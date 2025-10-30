import { queryDB } from "../config/db.js";
import sql from 'mssql';
import { dbConfig } from '../config/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import { isUserEnabled } from '../utils/userHelpers.js';

// Duración del bloqueo en minutos (por defecto 1440 = 24h). Se puede ajustar con la variable de entorno BLOQUEO_MINUTOS.
const BLOQUEO_MINUTOS = Number(process.env.BLOQUEO_MINUTOS) || 1440;

// Endpoint: GET /api/empresas/home-trader/:id
export async function getHomeTraderData(req, res) {
  const { id } = req.params;
  try {
    // 1. Obtener mercados habilitados para el usuario
    const mercados = await queryDB(
      `SELECT m.id, m.nombre
       FROM Mercado m
       JOIN Mercado_Habilitado mh ON mh.id_mercado = m.id
       WHERE mh.id_usuario = @id`,
      { id }
    );
    if (mercados.length === 0) {
      return res.status(200).json({ error: "mercado no habilitado", mercados: [] });
    }
    // 2. Para cada mercado, obtener de mayor a menor empresas por capitalización
    const result = [];
    for (const mercado of mercados) {
      const empresas = await queryDB(
        `SELECT e.id, e.nombre, e.ticker,
                i.precio AS precio_actual,
                i.acciones_disponibles * i.precio AS capitalizacion,
                i.acciones_disponibles,
                (
                  i.precio - ISNULL((
                    SELECT precio 
                    FROM (
                      SELECT ih.precio, ROW_NUMBER() OVER (ORDER BY ih.fecha DESC) AS rn
                      FROM Inventario_Historial ih 
                      WHERE ih.id_empresa = e.id
                    ) ranked
                    WHERE rn = 2
                  ), i.precio)
                ) AS variacion
         FROM Empresa e
         JOIN Inventario i ON i.id_empresa = e.id
         WHERE e.id_mercado = @mercado_id AND e.delistada = 0
         ORDER BY capitalizacion DESC`,
        { mercado_id: mercado.id }
      );
      result.push({
        mercado: { id: mercado.id, nombre: mercado.nombre },
        empresas: empresas.map(emp => ({
          ...emp,
          capitalizacion: emp.capitalizacion || null,
          variacion: emp.variacion || null,
        }))
      });
    }
    res.json(result);
  } catch (error) {
    console.error("[getHomeTraderData] Error fetching home trader data:", error.message);
    res.status(500).json({ error: "Error obteniendo datos de HomeTrader", details: error });
    }
}

// Obtener todas las empresas
export async function getEmpresas(req, res) {
    try {
        const empresas = await queryDB('SELECT * FROM Empresa WHERE Empresa.delistada = 0 ');
        res.json(empresas);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener empresas', error: err.message });
    }
}

// Crear una nueva empresa
export async function createEmpresa(req, res) {
    try {
        const { nombre, ticker, id_mercado } = req.body;
        if (!nombre || !ticker || !id_mercado) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }
        const result = await queryDB(
            'INSERT INTO Empresa (nombre, ticker, id_mercado) VALUES (@nombre, @ticker, @id_mercado)',
            { nombre, ticker, id_mercado }
        );
        res.status(201).json({ message: 'Empresa creada', result });
    } catch (err) {
        res.status(500).json({ message: 'Error al crear empresa', error: err.message });
    }
}

// Obtener detalle completo de una empresa para la vista de detalle del Trader
export async function getEmpresaDetalle(req, res) {
    const { id } = req.params;

    // Validar que recibimos un GUID válido
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de empresa inválido' });
    }

    try {
        // 1) Obtener datos base de la empresa
        const empresas = await queryDB('SELECT id, id_mercado, nombre, ticker FROM Empresa WHERE id = @id AND delistada = 0', { id });
        if (!empresas || empresas.length === 0)
            return res.status(404).json({ message: 'Empresa no encontrada' });

        const empresaRow = empresas[0];

        // 2) Obtener inventario (precio actual, acciones totales y disponibles, capitalizacion)
        const inventarios = await queryDB(
            'SELECT id_empresa, acciones_totales, acciones_disponibles, precio, capitalizacion FROM Inventario WHERE id_empresa = @id',
            { id }
        );
        const inventario = inventarios && inventarios.length > 0 ? inventarios[0] : null;
        
        // 3) Obtener historial de precios (excluyendo el más reciente)
        const historialAll = await queryDB(
            'SELECT fecha, precio FROM Inventario_Historial WHERE id_empresa = @id ORDER BY fecha DESC',
            { id }
        );
        const historicoPrevio = (historialAll || [])
            .slice(1)
            .map(row => ({
                fecha: new Date(row.fecha).toISOString(),
                valor: Number(row.precio),
            }));

        // 4) Determinar mayor tenedor
        const holders = await queryDB(
            `SELECT u.alias, p.acciones 
             FROM Portafolio p
             JOIN Usuario u ON u.id_portafolio = p.id
             WHERE p.id_empresa = @id
             ORDER BY p.acciones DESC`,
            { id }
        );

        let mayor_tenedor_alias = null;
        if (holders && holders.length > 0) {
            mayor_tenedor_alias = holders[0].alias;
        }

        if (inventario) {
            const tesoreriaAcciones = Number(inventario.acciones_disponibles);
            const topHolderAcciones = holders && holders.length > 0 ? Number(holders[0].acciones) : 0;
            if (tesoreriaAcciones >= topHolderAcciones) {
                mayor_tenedor_alias = 'administracion';
            }
        }

        // 5) Determinar posición real del usuario (calculada desde las transacciones)
        let posicionUsuario = 0;
        try {
            const authHeader = req.headers?.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                if (token) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const userId = decoded?.id;

                    if (userId) {
                        // Obtener el alias del usuario
                        const userRes = await queryDB(
                            'SELECT alias FROM Usuario WHERE id = @userId',
                            { userId }
                        );
                        const alias = userRes[0]?.alias;

                        if (alias) {
                            // Calcular la posición DIRECTAMENTE desde las transacciones (sin depender de Portafolio)
                            const posicionRes = await queryDB(
                                `SELECT 
                                    ISNULL(SUM(CASE 
                                        WHEN tipo = 'Compra' THEN cantidad 
                                        WHEN tipo = 'Venta' THEN -cantidad 
                                        ELSE 0 
                                    END), 0) AS cantidad
                                FROM Transaccion 
                                WHERE alias = @alias AND id_empresa = @id`,
                                { alias, id }
                            );
                            
                            if (posicionRes && posicionRes.length > 0) {
                                posicionUsuario = Number(posicionRes[0].cantidad || 0);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.warn("[getEmpresaDetalle] Unable to fetch user position:", err.message);
        }
        
        // 6) Determinar si la empresa es favorita para el usuario autenticado
        let favoritaFlag = false;
        try {
            const authHeader = req.headers?.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                if (token) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const userId = decoded?.id;
                    if (userId) {
                        const fav = await queryDB(
                            'SELECT 1 FROM Empresa_Favorita WHERE id_empresa = @id AND id_usuario = @userId',
                            { id, userId }
                        );
                        if (fav && fav.length > 0) favoritaFlag = true;
                    }
                }
            }
        } catch (e) {
            console.warn('[getEmpresaDetalle] Unable to verify favorites:', e?.message || 'Unknown error');
        }

        // 7) Construir respuesta final
        const empresa = {
            id: empresaRow.id,
            nombre: empresaRow.nombre,
            ticker: empresaRow.ticker,
            precio_actual: inventario ? Number(inventario.precio) : null,
            cantidad_acciones_totales: inventario ? Number(inventario.acciones_totales) : null,
            acciones_disponibles: inventario ? Number(inventario.acciones_disponibles) : null,
            capitalizacion: inventario ? Number(inventario.capitalizacion) : null,
            mayor_tenedor_alias,
            posicion_usuario: posicionUsuario,
        };

        res.json({ empresa, historico: historicoPrevio, favorita: favoritaFlag });

    } catch (err) {
        console.error('[getEmpresaDetalle] Error fetching company details:', err.message);
        res.status(500).json({ message: 'Error al obtener detalle de empresa', error: err.message });
    }
}


// Marcar/Desmarcar empresa como favorita (toggle) para el usuario autenticado
export async function marcarFavorita(req, res) {
    const { id } = req.params; // id de la empresa
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ message: 'Usuario no autenticado' });

    // validar guid
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !guidRegex.test(id)) return res.status(400).json({ message: 'ID de empresa inválido' });

    try {
        // verificar si ya está marcada
        const exists = await queryDB('SELECT 1 FROM Empresa_Favorita WHERE id_empresa = @id AND id_usuario = @userId', { id, userId: user.id });
        if (exists && exists.length > 0) {
            // eliminar favorita
            await queryDB('DELETE FROM Empresa_Favorita WHERE id_empresa = @id AND id_usuario = @userId', { id, userId: user.id });
            return res.json({ message: 'Desmarcada', favorita: false });
        }
        // insertar favorita
        await queryDB('INSERT INTO Empresa_Favorita (id_empresa, id_usuario) VALUES (@id, @userId)', { id, userId: user.id });
        return res.json({ message: 'Marcada', favorita: true });
    } catch (err) {
        console.error('[marcarFavorita] Error marking favorite:', err.message);
        return res.status(500).json({ message: 'Error marcando favorita', error: err.message });
    }
}

// Obtener empresas favoritas del usuario
export async function getFavoritas(req, res) {
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    try {
        // Unir Empresa_Favorita con Empresa y opcionalmente Inventario para datos de precio/capitalizacion
        const rows = await queryDB(
            `SELECT e.id, e.nombre, e.ticker, i.precio AS precio_actual, i.capitalizacion
             FROM Empresa_Favorita ef
             JOIN Empresa e ON e.id = ef.id_empresa
             LEFT JOIN Inventario i ON i.id_empresa = e.id
             WHERE ef.id_usuario = @userId`,
            { userId: user.id }
        );
        return res.json(rows || []);
    } catch (err) {
        console.error('[getFavoritas] Error fetching favorites:', err.message);
        return res.status(500).json({ message: 'Error obteniendo favoritas', error: err.message });
    }
}

// Comprar acciones: operación atómica sobre billetera, inventario y portafolio
export async function comprarAcciones(req, res) {
    const { id } = req.params; // id de la empresa
    const { cantidad } = req.body;
    const user = req.user; // set por auth middleware
    if (!user || !user.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    if (!cantidad || cantidad <= 0) return res.status(400).json({ message: 'Cantidad inválida' });

    // validar guid
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !guidRegex.test(id)) return res.status(400).json({ message: 'ID de empresa inválido' });

    // verificar que el usuario esté habilitado
    try {
        const enabled = await isUserEnabled(user.id);
        if (!enabled) return res.status(403).json({ message: 'Usuario deshabilitado' });
    } catch (e) {
        console.error('[comprarAcciones] Error checking user status:', e.message);
        return res.status(500).json({ message: 'Error interno' });
    }

    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        // 1) verificar empresa e inventario
        const invRes = await request.query(`SELECT precio, acciones_disponibles FROM Inventario WHERE id_empresa='${id}'`);
        if (!invRes.recordset || invRes.recordset.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'inventario no disponible' });
        }
        const inventario = invRes.recordset[0];
        const precio = Number(inventario.precio);
        const accionesDisponibles = Number(inventario.acciones_disponibles);

        // 2) verificar mercado habilitado para el usuario
        const empresaRes = await request.query(`SELECT id_mercado FROM Empresa WHERE id='${id}'`);
        const idMercado = empresaRes.recordset[0]?.id_mercado;
        const mhRes = await request.query(`SELECT 1 FROM Mercado_Habilitado WHERE id_mercado='${idMercado}' AND id_usuario='${user.id}'`);
        if (!mhRes.recordset || mhRes.recordset.length === 0) {
            await transaction.rollback();
            return res.status(403).json({ message: 'mercado no habilitado' });
        }

        // 3) verificar inventario suficiente
        if (cantidad > accionesDisponibles) {
            await transaction.rollback();
            return res.status(400).json({ message: 'inventario insuficiente' });
        }

        // 4) obtener billetera del usuario
        const billeteraRes = await request.query(`SELECT b.id, b.fondos FROM Usuario u JOIN Billetera b ON u.id_billetera = b.id WHERE u.id='${user.id}'`);
        if (!billeteraRes.recordset || billeteraRes.recordset.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'billetera no encontrada' });
        }
        const billetera = billeteraRes.recordset[0];
        const totalPrecio = precio * cantidad;
        if (Number(billetera.fondos) < totalPrecio) {
            await transaction.rollback();
            return res.status(400).json({ message: 'saldo insuficiente' });
        }

        // 5) actualizar Inventario, Billetera y Portafolio
        // restar acciones del inventario
        await request.query(`UPDATE Inventario SET acciones_disponibles = acciones_disponibles - ${cantidad} WHERE id_empresa='${id}'`);
        // restar fondos
        await request.query(`UPDATE Billetera SET fondos = fondos - ${totalPrecio} WHERE id='${billetera.id}'`);

        // incrementar o crear portafolio del usuario para esa empresa
        const portRes = await request.query(`SELECT id, acciones FROM Portafolio WHERE id_empresa='${id}' AND id IN (SELECT id_portafolio FROM Usuario WHERE id='${user.id}')`);
        if (portRes.recordset && portRes.recordset.length > 0) {
            const portId = portRes.recordset[0].id;
            await request.query(`UPDATE Portafolio SET acciones = acciones + ${cantidad} WHERE id='${portId}'`);
        } else {
            // Verificar si existe un portafolio para esta empresa (sin vinculación a usuario)
            const existingPortRes = await request.query(`SELECT TOP 1 id FROM Portafolio WHERE id_empresa='${id}' ORDER BY id DESC`);
            if (existingPortRes.recordset && existingPortRes.recordset.length > 0) {
                // Ya existe portafolio, solo incrementar acciones
                await request.query(`UPDATE Portafolio SET acciones = acciones + ${cantidad} WHERE id_empresa='${id}'`);
            } else {
                // Crear nuevo portafolio
                const newPortId = 'NEWID()';
                await request.query(`INSERT INTO Portafolio (id, id_empresa, acciones) VALUES (NEWID(), '${id}', ${cantidad})`);
                
                // Solo actualizar Usuario.id_portafolio si el usuario aún no tiene uno asignado
                await request.query(`UPDATE Usuario SET id_portafolio = (SELECT TOP 1 id FROM Portafolio WHERE id_empresa='${id}' ORDER BY id DESC) WHERE id='${user.id}' AND id_portafolio IS NULL`);
            }
        }

        // insertar transaccion
        await request.query(`INSERT INTO Transaccion (id, alias, id_portafolio, id_billetera, id_empresa, tipo, precio, cantidad) VALUES (NEWID(), (SELECT alias FROM Usuario WHERE id='${user.id}'), (SELECT id_portafolio FROM Usuario WHERE id='${user.id}'), '${billetera.id}', '${id}', 'Compra', ${precio}, ${cantidad})`);

        await transaction.commit();
        res.json({ message: 'Compra realizada' });
    } catch (err) {
        try { await transaction.rollback(); } catch (e) {}
        console.error('[comprarAcciones] Error purchasing shares:', err.message);
        res.status(500).json({ message: 'Error en la compra', error: err.message });
    } finally {
        try { pool && pool.close(); } catch (e) {}
    }
}

// Vender acciones: operación atómica inversa
export async function venderAcciones(req, res) {
    const { id } = req.params; // id de la empresa
    const { cantidad } = req.body;
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    if (!cantidad || cantidad <= 0) return res.status(400).json({ message: 'Cantidad inválida' });

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !guidRegex.test(id)) return res.status(400).json({ message: 'ID de empresa inválido' });

    // verificar que el usuario esté habilitado
    try {
        const enabled = await isUserEnabled(user.id);
        if (!enabled) return res.status(403).json({ message: 'Usuario deshabilitado' });
    } catch (e) {
        console.error('[venderAcciones] Error checking user status:', e.message);
        return res.status(500).json({ message: 'Error interno' });
    }

    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        // 1) determinar posición del usuario para esa empresa usando Transaccion (por alias)
        // esto permite que la posición se calcule incluso si la tabla Portafolio no está vinculada correctamente
        const aliasRes = await request.query(`SELECT alias FROM Usuario WHERE id='${user.id}'`);
        const alias = aliasRes.recordset[0]?.alias;
        const posRes = await request.query(`SELECT SUM(CASE WHEN tipo='Compra' THEN cantidad WHEN tipo='Venta' THEN -cantidad ELSE 0 END) AS cantidad_net FROM Transaccion WHERE alias='${alias}' AND id_empresa='${id}'`);
        const posicionUsuario = Number(posRes.recordset[0]?.cantidad_net || 0);
        if (posicionUsuario <= 0 || posicionUsuario < cantidad) {
            await transaction.rollback();
            return res.status(400).json({ message: 'posición insuficiente' });
        }
        // intentar obtener fila de Portafolio vinculada al usuario para actualizarla (si existe)
        const portRes = await request.query(`SELECT p.id, p.acciones FROM Portafolio p JOIN Usuario u ON u.id_portafolio = p.id WHERE p.id_empresa='${id}' AND u.id='${user.id}'`);
        const port = (portRes.recordset && portRes.recordset.length > 0) ? portRes.recordset[0] : null;

        // 2) obtener inventario y precio
        const invRes = await request.query(`SELECT precio FROM Inventario WHERE id_empresa='${id}'`);
        if (!invRes.recordset || invRes.recordset.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'inventario no disponible' });
        }
        const precio = Number(invRes.recordset[0].precio);

        // 3) actualizar portafolio (si existe), inventario y billetera (sumar funds)
        if (port) {
            await request.query(`UPDATE Portafolio SET acciones = acciones - ${cantidad} WHERE id='${port.id}'`);
        } else {
            // No hay fila en Portafolio vinculada al usuario: saltamos la actualización de Portafolio porque
            // la posición se está obteniendo de Transaccion. Esto evita fallos cuando Usuario.id_portafolio
            // fue sobrescrito por compras posteriores.
            console.warn('No se encontró fila de Portafolio vinculada al usuario para la empresa', id);
        }
        await request.query(`UPDATE Inventario SET acciones_disponibles = acciones_disponibles + ${cantidad} WHERE id_empresa='${id}'`);
        // sumar fondos al usuario
        const billeteraRes = await request.query(`SELECT b.id FROM Usuario u JOIN Billetera b ON u.id_billetera = b.id WHERE u.id='${user.id}'`);
        const billeteraId = billeteraRes.recordset[0].id;
        const totalPrecio = precio * cantidad;
        await request.query(`UPDATE Billetera SET fondos = fondos + ${totalPrecio} WHERE id='${billeteraId}'`);

        // insertar transaccion
        await request.query(`INSERT INTO Transaccion (id, alias, id_portafolio, id_billetera, id_empresa, tipo, precio, cantidad) VALUES (NEWID(), (SELECT alias FROM Usuario WHERE id='${user.id}'), (SELECT id_portafolio FROM Usuario WHERE id='${user.id}'), '${billeteraId}', '${id}', 'Venta', ${precio}, ${cantidad})`);

        await transaction.commit();
        res.json({ message: 'Venta realizada' });
    } catch (err) {
        try { await transaction.rollback(); } catch (e) {}
        console.error('[venderAcciones] Error selling shares:', err.message);
        res.status(500).json({ message: 'Error en la venta', error: err.message });
    } finally {
        try { pool && pool.close(); } catch (e) {}
    }
}

// Devuelve las posiciones del usuario (solo propias) con datos de empresa, mercado, costo promedio y precio actual
export async function getPortafolio(req, res) {
  const userId = req.user.id;
  try {
    // Obtener alias del usuario
    const u = await queryDB(`SELECT alias FROM Usuario WHERE id = @userId`, { userId });
    if (!u || u.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    const alias = u[0].alias;

    // Agrupar transacciones por empresa para obtener cantidad neta y costo promedio (solo compras)
    const posicionesRaw = await queryDB(
      `SELECT t.id_empresa,
              SUM(CASE WHEN t.tipo = 'Compra' THEN t.cantidad WHEN t.tipo = 'Venta' THEN -t.cantidad ELSE 0 END) AS cantidad_net,
              SUM(CASE WHEN t.tipo = 'Compra' THEN t.precio * t.cantidad ELSE 0 END) AS total_compra,
              SUM(CASE WHEN t.tipo = 'Compra' THEN t.cantidad ELSE 0 END) AS acciones_compradas
       FROM Transaccion t
       WHERE t.alias = @alias
       GROUP BY t.id_empresa
       HAVING SUM(CASE WHEN t.tipo = 'Compra' THEN t.cantidad WHEN t.tipo = 'Venta' THEN -t.cantidad ELSE 0 END) > 0`,
      { alias }
    );

    const posiciones = [];
    for (const row of posicionesRaw) {
      const empresaId = row.id_empresa;
      const cantidad = Number(row.cantidad_net || 0);
      const accionesCompradas = Number(row.acciones_compradas || 0);
      const costoPromedio = accionesCompradas > 0 ? Number(row.total_compra || 0) / accionesCompradas : null;

      // obtener datos de empresa y mercado
      const empresaRows = await queryDB(`SELECT e.nombre AS empresa_nombre, m.nombre AS mercado_nombre FROM Empresa e JOIN Mercado m ON e.id_mercado = m.id WHERE e.id = @empresaId`, { empresaId });
      const empresaNombre = empresaRows && empresaRows.length > 0 ? empresaRows[0].empresa_nombre : 'Desconocida';
      const mercadoNombre = empresaRows && empresaRows.length > 0 ? empresaRows[0].mercado_nombre : 'Desconocido';

      // precio actual desde Inventario
      const inv = await queryDB(`SELECT precio FROM Inventario WHERE id_empresa = @empresaId`, { empresaId });
      const precioActual = (inv && inv.length > 0) ? Number(inv[0].precio) : null;
      const valorActual = precioActual !== null ? precioActual * cantidad : null;

      posiciones.push({
        empresa_id: empresaId,
        empresa_nombre: empresaNombre,
        mercado_nombre: mercadoNombre,
        cantidad,
        costo_promedio: costoPromedio !== null ? Number(costoPromedio.toFixed(4)) : null,
        precio_actual: precioActual !== null ? Number(precioActual) : null,
        valor_actual: valorActual !== null ? Number(valorActual.toFixed(4)) : null,
      });
    }

    res.json({ posiciones });
  } catch (err) {
    console.error('[getPortafolio] Error fetching portfolio:', err.message);
    res.status(500).json({ message: 'Error al obtener portafolio', error: err.message });
  }
}


/**
 * GET /api/usuario/last-access-seguridad
 * Retorna el último acceso registrado (ANTES de actualizar)
 */
export async function getLastAccessSeguridad(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const rows = await queryDB(
      `SELECT ultimo_acceso_seguridad FROM Usuario WHERE id = @userId`, 
      { userId }
    );
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const lastAccess = rows[0].ultimo_acceso_seguridad;
    
    if (!lastAccess) {
      return res.json({ lastAccess: null });
    }

    // Simplemente convertir a ISO string
    const isoString = lastAccess.toISOString();
    
    return res.json({ lastAccess: isoString });
      
  } catch (err) {
    console.error("[getLastAccessSeguridad] Error fetching last access:", err.message);
    return res.status(500).json({ message: "Error al obtener último acceso", error: err.message });
  }
}

/**
 * POST /api/usuario/registrar-acceso-seguridad
 * Actualiza el timestamp del último acceso a Seguridad
 */
export async function registrarAccesoSeguridad(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    await queryDB(
      `UPDATE Usuario SET ultimo_acceso_seguridad = GETDATE() WHERE id = @userId`,
      { userId }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("[registrarAccesoSeguridad] Error registering access:", err.message);
    return res.status(500).json({ message: "Error al registrar acceso", error: err.message });
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

  // verificar que el usuario esté habilitado
  try {
    const enabled = await isUserEnabled(userId);
    if (!enabled) return res.status(403).json({ message: 'Usuario deshabilitado' });
  } catch (e) {
    console.error('[liquidarTodo] Error checking user status:', e.message);
    return res.status(500).json({ message: 'Error interno' });
  }

  try {
    // verificar contraseña
    const u = await queryDB(`SELECT contrasena_hash FROM Usuario WHERE id = @userId`, { userId });
    if (!u || u.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
    const valid = await bcrypt.compare(password, u[0].contrasena_hash);
    if (!valid) return res.status(400).json({ message: "contraseña incorrecta" });
    const userAlias = u[0].alias;

    // usar transaction con mssql
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();
      const request = new sql.Request(transaction);
      request.input("userId", sql.UniqueIdentifier, userId);

      await request.query(`EXEC sp_set_session_context @key = N'liquidacion_total', @value = N'SI'`);
      await request.input('userAlias', sql.NVarChar, userAlias)
                   .query(`EXEC sp_set_session_context @key = N'usuario_admin', @value = @userAlias`);

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

      await request.query(`EXEC sp_set_session_context @key = N'liquidacion_total', @value = NULL`);
      await request.query(`EXEC sp_set_session_context @key = N'usuario_admin', @value = NULL`);

      await transaction.commit();
      // result.recordset[0] debería contener soldCount/totalValue
      const stats = result.recordset && result.recordset.length ? result.recordset[result.recordset.length - 1] : null;
      return res.json({ message: "Liquidación completada", soldCount: stats?.soldCount ?? 0, totalValue: stats?.totalValue ?? 0 });
    } catch (errTransaction) {
      try { await transaction.rollback(); } catch (e) {}
      console.error("[liquidarTodo] Transaction error:", errTransaction.message);
      return res.status(500).json({ message: "Error en liquidación", error: errTransaction.message ?? errTransaction });
    } finally {
      try { pool && pool.close(); } catch (e) {}
    }
  } catch (err) {
    console.error("[liquidarTodo] Error liquidating:", err.message);
    return res.status(500).json({ message: "Error en liquidar todo", error: err.message });
  }
}

export async function getWallet(req, res) {
  const billeteraId = req.userBilletera; // Validada por middleware

  try {
    // Obtener la billetera usando el ID validado
    const billetera = await queryDB(
      `SELECT b.id AS id, b.fondos AS saldo, b.categoria AS categoria, b.limite_diario AS limite_diario, b.consumo AS consumo, b.bloqueo_hasta AS bloqueo_hasta
       FROM Billetera b
       WHERE b.id = @billeteraId`,
      { billeteraId }
    );

    if (!billetera || billetera.length === 0) return res.status(404).json({ message: "Billetera no encontrada" });

    let b = billetera[0];

    // Si existe bloqueo pero ya expiró, resetear consumo y limpiar bloqueo_hasta
    if (b.bloqueo_hasta) {
      const bloqueoDate = new Date(b.bloqueo_hasta);
      const ahora = new Date();
      if (bloqueoDate <= ahora) {
        // Resetear consumo y limpiar bloqueo
        await queryDB(`UPDATE Billetera SET consumo = 0, bloqueo_hasta = NULL WHERE id = @billeteraId`, { billeteraId });
        // Registrar snapshot en historial
        await queryDB(`INSERT INTO Billetera_Historial (id_billetera, categoria, fondos, limite_diario, consumo, bloqueo_hasta)
          SELECT id, categoria, fondos, limite_diario, consumo, bloqueo_hasta FROM Billetera WHERE id = @billeteraId`, { billeteraId });
        // Volver a obtener la fila actualizada
        const refreshed = await queryDB(
          `SELECT b.id AS id, b.fondos AS saldo, b.categoria AS categoria, b.limite_diario AS limite_diario, b.consumo AS consumo, b.bloqueo_hasta AS bloqueo_hasta
           FROM Billetera b
           WHERE b.id = @billeteraId`,
          { billeteraId }
        );
        if (refreshed && refreshed.length) b = refreshed[0];
      }
    }

    // Construir historial de recargas a partir de Billetera_Historial usando recarga_monto (solo recargas explícitas)
    const recargasQuery = `
      SELECT fecha, CONVERT(varchar(50), fecha, 126) AS fecha_iso, recarga_monto
      FROM Billetera_Historial
      WHERE id_billetera = @billeteraId AND recarga_monto IS NOT NULL AND recarga_monto > 0
      ORDER BY fecha DESC
    `;
    const recargasRaw = await queryDB(recargasQuery, { billeteraId });
    const recargas = (recargasRaw || [])
      .map(r => ({ fecha: r.fecha, fecha_iso: r.fecha_iso, monto: r.recarga_monto }))
      .map(r => ({ recarga_id: r.fecha_iso, monto: Number(r.monto), fecha_hora: new Date(r.fecha).toISOString() }));

    // Normalizar nombres esperados por el frontend
    res.json({
      id: b.id,
      saldo: Number(b.saldo),
      categoria: b.categoria,
      limite_diario: Number(b.limite_diario),
      consumo_diario: Number(b.consumo),
      bloqueo_hasta: b.bloqueo_hasta ? new Date(b.bloqueo_hasta).toISOString() : null,
      recargas,
    });
  } catch (error) {
    console.error('[getWallet] Error fetching wallet:', error.message);
    res.status(500).json({ message: "Error al obtener wallet", error: error.message });
  }
}

export async function recargarWallet(req, res) {
  const userId = req.user.id;
  const { monto } = req.body;

  // Verificar que el usuario esté habilitado
  try {
    const { isUserEnabled } = await import('../utils/userHelpers.js');
    const enabled = await isUserEnabled(userId);
    if (!enabled) return res.status(403).json({ message: 'Usuario deshabilitado' });
  } catch (e) {
    console.error('[recargarWallet] Error checking user status:', e.message);
    return res.status(500).json({ message: 'Error interno' });
  }

  try {
    // Validar monto
    const amount = Number(monto);
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'monto inválido' });
    }

    // Usar billeteraId validada por middleware (verifyBilleterable)
    const billeteraId = req.userBilletera;

    // Usar transacción para evitar condiciones de carrera
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();

      // Obtener datos actuales de la billetera
      const bb = await new sql.Request(transaction).input('billeteraId', billeteraId).query(`SELECT id, categoria, fondos, limite_diario, consumo, bloqueo_hasta FROM Billetera WHERE id = @billeteraId`);
      if (!bb.recordset || bb.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Billetera no encontrada' });
      }
      const b = bb.recordset[0];
      // Si existe bloqueo activo, rechazar
      if (b.bloqueo_hasta) {
        const bloqueoDate = new Date(b.bloqueo_hasta);
        const ahora = new Date();
        if (bloqueoDate > ahora) {
          await transaction.rollback();
          return res.status(400).json({ message: 'bloqueado', bloqueo_hasta: bloqueoDate.toISOString() });
        }
      }
      const limiteRestante = Number(b.limite_diario) - Number(b.consumo);
      if (amount > limiteRestante) {
        await transaction.rollback();
        return res.status(400).json({ message: 'se alcanzó el límite diario' });
      }

      // Actualizar fondos y consumo
      await new sql.Request(transaction).input('monto', amount).input('billeteraId', billeteraId).query(`UPDATE Billetera SET fondos = fondos + @monto, consumo = consumo + @monto WHERE id = @billeteraId`);

      // Después de actualizar, verificar si se alcanzó el límite y establecer bloqueo por 24 horas si corresponde
      const after = await new sql.Request(transaction).input('billeteraId', billeteraId).query(`SELECT consumo, limite_diario FROM Billetera WHERE id = @billeteraId`);
      const consumoActual = Number(after.recordset[0].consumo);
      const limiteTotal = Number(after.recordset[0].limite_diario);
      let bloqueoHasta = null;
      if (consumoActual >= limiteTotal) {
        // calcular bloqueo según variable de entorno (minutos)
        const minutos = Number.isFinite(BLOQUEO_MINUTOS) ? BLOQUEO_MINUTOS : 1440;
        bloqueoHasta = new Date(Date.now() + minutos * 60 * 1000);
        await new sql.Request(transaction).input('bloqueo', bloqueoHasta).input('billeteraId', billeteraId).query(`UPDATE Billetera SET bloqueo_hasta = @bloqueo WHERE id = @billeteraId`);
      }

      // Registrar snapshot en historial (incluyendo bloqueo_hasta). Añadir recarga_monto para identificar recargas explícitas
      await new sql.Request(transaction).input('billeteraId', billeteraId).input('monto', amount).query(`INSERT INTO Billetera_Historial (id_billetera, categoria, fondos, limite_diario, consumo, bloqueo_hasta, recarga_monto)
        SELECT id, categoria, fondos, limite_diario, consumo, bloqueo_hasta, @monto FROM Billetera WHERE id = @billeteraId`);

      await transaction.commit();

      // Obtener estado actualizado y recargas recientes
      const updated = await queryDB(`SELECT id, fondos AS saldo, categoria, limite_diario, consumo, bloqueo_hasta FROM Billetera WHERE id = @billeteraId`, { billeteraId });
      const recargasQuery = `
        SELECT fecha, CONVERT(varchar(50), fecha, 126) AS fecha_iso, recarga_monto
        FROM Billetera_Historial
        WHERE id_billetera = @billeteraId AND recarga_monto IS NOT NULL AND recarga_monto > 0
        ORDER BY fecha DESC
      `;
      const recRaw = await queryDB(recargasQuery, { billeteraId });
      const recargas = (recRaw || [])
        .map(r => ({ fecha: r.fecha, fecha_iso: r.fecha_iso, monto: r.recarga_monto }))
        .map(r => ({ recarga_id: r.fecha_iso, monto: Number(r.monto), fecha_hora: new Date(r.fecha).toISOString() }));

      return res.json({ message: 'Recarga exitosa', saldo: Number(updated[0].saldo), consumo_diario: Number(updated[0].consumo), bloqueo_hasta: updated[0].bloqueo_hasta ? new Date(updated[0].bloqueo_hasta).toISOString() : null, recargas });
    } catch (err) {
      try { await transaction.rollback(); } catch (e) {}
      console.error('[recargarWallet] Transaction error:', err.message);
      return res.status(500).json({ message: 'Error al recargar', error: err.message });
    } finally {
      try { pool && pool.close(); } catch (e) {}
    }
  } catch (error) {
    console.error('[recargarWallet] Error recharging wallet:', error.message);
    res.status(500).json({ message: 'Error al recargar', error: error.message });
  }
}