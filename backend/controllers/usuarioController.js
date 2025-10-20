import bcrypt from "bcryptjs";
import sql from "mssql";
import { dbConfig } from "../config/db.js";
import { queryDB } from "../config/db.js";

/**
 * GET /api/usuario/last-access
 */
export async function getLastAccess(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const rows = await queryDB(`SELECT alias FROM Usuario WHERE id = @userId`, { userId });
    if (!rows || rows.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });

    const alias = rows[0].alias;
    const last = await queryDB(`SELECT MAX(fecha) AS lastAccess FROM Transaccion WHERE alias = @alias`, { alias });
   const raw = last && last[0] && last[0].lastAccess ? new Date(last[0].lastAccess) : null;
    if (!raw) return res.json({ lastAccess: null });

    // Costa Rica = UTC-6
    const offsetMs = 6 * 60 * 60 * 1000;
    const crDate = new Date(raw.getTime() - offsetMs);
    // Formato ISO con offset -06:00 (ej: 2025-10-18T12:34:56.789-06:00)
    const isoNoZ = crDate.toISOString().replace('Z', '');
    const lastAccessCR = `${isoNoZ}-06:00`;
    return res.json({ lastAccess: lastAccessCR });
  } catch (err) {
    console.error("getLastAccess error:", err);
    return res.status(500).json({ message: "Error al obtener último acceso", error: err.message });
  }
}

/**
 * POST /api/usuario/liquidar-todo
 * Body: { password }
 * Liquidación atómica: vende todas las posiciones del portafolio del usuario,
 * actualiza inventario, billetera y registra historiales + transacciones.
 */
export async function liquidarTodo(req, res) {
  const userId = req.user?.id;
  const { password } = req.body;
  if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });
  if (!password) return res.status(400).json({ message: "Contraseña requerida" });

  try {
    // verificar contraseña
    const u = await queryDB(`SELECT contrasena_hash FROM Usuario WHERE id = @userId`, { userId });
    if (!u || u.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
    const valid = await bcrypt.compare(password, u[0].contrasena_hash);
    if (!valid) return res.status(400).json({ message: "contraseña incorrecta" });

    // usar transaction con mssql (patrón usado en empresaController)
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();
      const request = new sql.Request(transaction);
      request.input("userId", sql.UniqueIdentifier, userId);

      // Script set-based: construir #toSell con las posiciones >0 para el usuario
      const sqlScript = `
        SET NOCOUNT ON;

        DECLARE @id_portafolio UNIQUEIDENTIFIER = (SELECT id_portafolio FROM Usuario WHERE id = @userId);
        DECLARE @id_billetera UNIQUEIDENTIFIER = (SELECT id_billetera FROM Usuario WHERE id = @userId);
        DECLARE @alias NVARCHAR(40) = (SELECT alias FROM Usuario WHERE id = @userId);

        IF @id_portafolio IS NULL OR @id_billetera IS NULL
        BEGIN
          THROW 51000, 'Usuario sin portafolio o billetera asociada', 1;
        END

        /*
          CALCULAR posiciones reales a partir de Transaccion (Compra - Venta)
          para asegurarnos de vender todas las acciones que el usuario posee,
          incluidas las compradas después del seed.
        */
        SELECT
          t.id_empresa,
          SUM(CASE WHEN t.tipo = 'Compra' THEN t.cantidad WHEN t.tipo = 'Venta' THEN -t.cantidad ELSE 0 END) AS acciones
        INTO #currentPos
        FROM Transaccion t
        WHERE t.alias = @alias
        GROUP BY t.id_empresa
        HAVING SUM(CASE WHEN t.tipo = 'Compra' THEN t.cantidad WHEN t.tipo = 'Venta' THEN -t.cantidad ELSE 0 END) > 0;

        IF NOT EXISTS (SELECT 1 FROM #currentPos)
        BEGIN
          DROP TABLE IF EXISTS #currentPos;
          SELECT 0 AS soldCount, 0.0 AS totalValue;
          RETURN;
        END;

        -- unir con Inventario para obtener el precio actual
        SELECT cp.id_empresa, cp.acciones, i.precio
        INTO #toSell
        FROM #currentPos cp
        JOIN Inventario i ON cp.id_empresa = i.id_empresa;

        -- insertar transacciones de venta por cada empresa con la cantidad calculada
        INSERT INTO Transaccion (id, alias, id_portafolio, id_billetera, id_empresa, tipo, precio, cantidad)
        SELECT NEWID(), @alias, @id_portafolio, @id_billetera, t.id_empresa, 'Venta', t.precio, t.acciones
        FROM #toSell t;

        -- totales vendidos y valor
        DECLARE @totalValue DECIMAL(19,4) = (SELECT SUM(acciones * precio) FROM #toSell);
        DECLARE @soldCount INT = (SELECT SUM(acciones) FROM #toSell);

        -- actualizar billetera (agregar efectivo)
        UPDATE Billetera
        SET fondos = fondos + @totalValue
        WHERE id = @id_billetera;

        -- registrar historial billetera (estado posterior)
        INSERT INTO Billetera_Historial (id_billetera, categoria, fondos, limite_diario, consumo)
        SELECT b.id, b.categoria, b.fondos, b.limite_diario, b.consumo
        FROM Billetera b
        WHERE b.id = @id_billetera;

        -- actualizar inventario (devolver acciones al disponible)
        UPDATE i
        SET i.acciones_disponibles = i.acciones_disponibles + t.acciones
        FROM Inventario i
        JOIN #toSell t ON i.id_empresa = t.id_empresa;

        -- registrar historial de inventario (estado posterior)
        INSERT INTO Inventario_Historial (id_empresa, acciones_totales, acciones_disponibles, precio)
        SELECT i.id_empresa, i.acciones_totales, i.acciones_disponibles, i.precio
        FROM Inventario i
        JOIN #toSell t ON i.id_empresa = t.id_empresa;

        -- registrar historial de portafolio (valores vendidos)
        INSERT INTO Portafolio_Historial (id_portafolio, id_empresa, acciones)
        SELECT @id_portafolio, t.id_empresa, t.acciones FROM #toSell t;

        /*
          Actualizar Portafolio existente relacionado con el usuario:
          - poner a cero las filas que coincidan con el id_portafolio del usuario y las empresas vendidas.
          Nota: la estructura actual de Portafolio usa id PK por fila, así que solo se actualizan
          las filas que pertenezcan exactamente al id_portafolio asignado al usuario.
        */
        UPDATE p
        SET p.acciones = 0
        FROM Portafolio p
        JOIN #toSell t ON p.id_empresa = t.id_empresa
        WHERE p.id = @id_portafolio;

        DROP TABLE IF EXISTS #currentPos;
        DROP TABLE IF EXISTS #toSell;

        SELECT @soldCount AS soldCount, @totalValue AS totalValue;
      `;

      const result = await request.query(sqlScript);
      await transaction.commit();
      // result.recordset[0] debería contener soldCount/totalValue
      const stats = result.recordset && result.recordset.length ? result.recordset[result.recordset.length - 1] : null;
      return res.json({ message: "Liquidación completada", soldCount: stats?.soldCount ?? 0, totalValue: stats?.totalValue ?? 0 });
    } catch (errTransaction) {
      try { await transaction.rollback(); } catch (e) {}
      console.error("liquidarTodo transaction error:", errTransaction);
      return res.status(500).json({ message: "Error en liquidación", error: errTransaction.message ?? errTransaction });
    } finally {
      try { pool && pool.close(); } catch (e) {}
    }
  } catch (err) {
    console.error("liquidarTodo error:", err);
    return res.status(500).json({ message: "Error en liquidar todo", error: err.message });
  }
}