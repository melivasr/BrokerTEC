import { queryDB, dbConfig } from "../config/db.js";
import sql from 'mssql';

// Helpers
const GUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const isGuid = (v) => GUID.test(String(v || ''));

// Actualizar billetera de un usuario
export async function updateBilletera(req, res) {
  const { id_billetera } = req.params;
  const { limite_diario, categoria } = req.body;

  if (!isGuid(id_billetera)) {
    return res.status(400).json({ message: "ID de billetera inválido" });
  }
  if (categoria !== undefined && !['Junior', 'Mid', 'Senior'].includes(categoria)) {
    return res.status(400).json({ message: "Categoría inválida" });
  }
  if (limite_diario !== undefined && Number(limite_diario) < 0) {
    return res.status(400).json({ message: "Límite diario inválido" });
  }
  if (categoria === undefined && limite_diario === undefined) {
    return res.status(400).json({ message: "Nada que actualizar" });
  }

  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    // Verificar que existe la billetera
    const ex = await request.query(`SELECT 1 FROM Billetera WHERE id='${id_billetera}'`);
    if (!ex.recordset || ex.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: "Billetera no encontrada" });
    }

    // Actualizar categoría si se especificó
    if (categoria !== undefined) {
      await request.query(`UPDATE Billetera SET categoria='${categoria}' WHERE id='${id_billetera}'`);
    }
    
    // Actualizar límite diario si se especificó
    if (limite_diario !== undefined) {
      await request.query(`UPDATE Billetera SET limite_diario=${Number(limite_diario)} WHERE id='${id_billetera}'`);
    }

    // Registrar en historial
    await request.query(`
      INSERT INTO Billetera_Historial (id_billetera, categoria, fondos, limite_diario, consumo, bloqueo_hasta, recarga_monto)
      SELECT id, categoria, fondos, limite_diario, consumo, bloqueo_hasta, NULL
      FROM Billetera WHERE id='${id_billetera}'
    `);

    await transaction.commit();
    res.json({ message: "Billetera actualizada" });

  } catch (e) {
    try { await transaction.rollback(); } catch (rollbackErr) {}
    console.error('[updateBilletera] Error updating wallet:', e.message);
    res.status(500).json({ message: "Error al actualizar billetera" });
  } finally {
    try { pool && pool.close(); } catch (e) {}
  }
}

// Obtener detalles de una billetera específica
export async function getBilletera(req, res) {
  const { id_billetera } = req.params;
  if (!isGuid(id_billetera)) {
    return res.status(400).json({ message: "ID de billetera inválido" });
  }
  try {
    const rows = await queryDB(
      `SELECT id, categoria, fondos, limite_diario, consumo, bloqueo_hasta
       FROM Billetera WHERE id=@id`,
      { id: id_billetera }
    );
    if (!rows.length) return res.status(404).json({ message: "Billetera no encontrada" });
    res.json(rows[0]);
  } catch (e) {
    console.error('[getBilletera] Error fetching wallet:', e.message);
    res.status(500).json({ message: "Error al obtener billetera" });
  }
}

// Mercados
export async function createMercado(req, res) {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ message: 'Nombre requerido' });
  try {
    await queryDB(`INSERT INTO Mercado (nombre) VALUES (@nombre)`, { nombre });
    res.status(201).json({ message: 'Mercado creado' });
  } catch (e) {
    res.status(500).json({ message: 'Error al crear mercado' });
  }
}

export async function updateMercado(req, res) {
  const { id } = req.params;
  const { nombre } = req.body;
  if (!isGuid(id)) return res.status(400).json({ message: 'ID inválido' });
  if (!nombre)   return res.status(400).json({ message: 'Nombre requerido' });
  try {
    await queryDB(`UPDATE Mercado SET nombre=@nombre WHERE id=@id`, { nombre, id });
    res.json({ message: 'Mercado actualizado' });
  } catch (e) {
    res.status(500).json({ message: 'Error al actualizar mercado' });
  }
}

export async function deleteMercado(req, res) {
  const { id } = req.params;
  if (!isGuid(id)) return res.status(400).json({ message: 'ID inválido' });
  
  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    // Verificar empresas activas
    const empresasActivas = await request.query(`
      SELECT COUNT(*) as total 
      FROM Empresa 
      WHERE id_mercado = '${id}' AND (delistada = 0 OR delistada IS NULL)
    `);
    
    if (empresasActivas.recordset[0].total > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: `No se puede eliminar: hay ${empresasActivas.recordset[0].total} empresa(s) activa(s). Debe delistarlas primero.` 
      });
    }

    // Obtener empresas delistadas
    const empresasDelistadas = await request.query(`
      SELECT id FROM Empresa WHERE id_mercado = '${id}' AND delistada = 1
    `);
    
    let empresasEliminadas = 0;
    
    if (empresasDelistadas.recordset && empresasDelistadas.recordset.length > 0) {
      const empresaIds = empresasDelistadas.recordset.map(e => `'${e.id}'`).join(',');
      
      // Limpiar referencias en Transaccion
      await request.query(`
        UPDATE Transaccion 
        SET id_empresa = NULL 
        WHERE id_empresa IN (${empresaIds})
      `);
      
      await request.query(`
        UPDATE Transaccion 
        SET id_portafolio = NULL 
        WHERE id_portafolio IN (
          SELECT id FROM Portafolio WHERE id_empresa IN (${empresaIds})
        )
      `);
      
      // Eliminar empresas
      await request.query(`DELETE FROM Empresa WHERE id IN (${empresaIds})`);
      empresasEliminadas = empresasDelistadas.recordset.length;
    }

    // Eliminar mercado
    await request.query(`DELETE FROM Mercado WHERE id = '${id}'`);
    
    await transaction.commit();
    
    res.json({ 
      message: empresasEliminadas > 0 
        ? `Mercado eliminado (se eliminaron ${empresasEliminadas} empresa(s) delistada(s))`
        : 'Mercado eliminado' 
    });

  } catch (e) {
    try { await transaction.rollback(); } catch (rollbackErr) {}
    console.error('Error al eliminar mercado:', e);
    res.status(500).json({ message: 'Error al eliminar mercado' });
  } finally {
    try { pool && pool.close(); } catch (e) {}
  }
}

// Empresas (vista admin)
export async function getEmpresasAdmin(_req, res) {
  try {
    const rows = await queryDB(`
      SELECT 
        e.id, e.nombre, e.ticker, e.id_mercado,
        m.nombre AS mercado,
        i.precio AS precio_actual,
        i.acciones_totales, i.acciones_disponibles, i.capitalizacion,
        ult.fecha AS fecha_actualizacion
      FROM Empresa e
      JOIN Mercado m ON e.id_mercado = m.id
      LEFT JOIN Inventario i ON e.id = i.id_empresa
      OUTER APPLY (
        SELECT TOP 1 ih.fecha
        FROM Inventario_Historial ih
        WHERE ih.id_empresa = e.id
        ORDER BY ih.fecha DESC
      ) ult
      WHERE e.delistada = 0 
      ORDER BY m.nombre, e.nombre
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener empresas' });
  }
}

export async function createEmpresaAdmin(req, res) {
  const { nombre, ticker, id_mercado, precio, acciones_totales } = req.body;
  if (!nombre || !ticker || !id_mercado)
    return res.status(400).json({ message: 'Datos requeridos' });

  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    // Insertar empresa
    const ins = await request.query(`
      INSERT INTO Empresa (nombre, ticker, id_mercado)
      OUTPUT INSERTED.id
      VALUES ('${nombre}', '${String(ticker).toUpperCase()}', '${id_mercado}')
    `);
    
    const idEmpresa = ins.recordset[0].id;

    // Si se proporcionó precio e inventario, crearlos
    if (precio && acciones_totales) {
      if (precio <= 0 || acciones_totales <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Capitalización inválida' });
      }

      // Crear inventario
      await request.query(`
        INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio)
        VALUES ('${idEmpresa}', ${acciones_totales}, ${acciones_totales}, ${precio})
      `);

      // Crear historial
      await request.query(`
        INSERT INTO Inventario_Historial (fecha, id_empresa, acciones_totales, acciones_disponibles, precio)
        SELECT SYSUTCDATETIME(), id_empresa, acciones_totales, acciones_disponibles, precio
        FROM Inventario WHERE id_empresa='${idEmpresa}'
      `);
    }

    await transaction.commit();
    res.status(201).json({ message: 'Empresa creada', id: idEmpresa });

  } catch (e) {
    try { await transaction.rollback(); } catch (rollbackErr) {}
    console.error('[createEmpresaAdmin] Error creating company:', e.message);
    res.status(500).json({ message: 'Error al crear empresa' });
  } finally {
    try { pool && pool.close(); } catch (e) {}
  }
}

export async function updateEmpresa(req, res) {
  const { id } = req.params;
  const { nombre, ticker, id_mercado } = req.body;
  if (!isGuid(id)) return res.status(400).json({ message: 'ID inválido' });
  if (!nombre || !ticker || !id_mercado)
    return res.status(400).json({ message: 'Datos requeridos' });

  try {
    await queryDB(
      `UPDATE Empresa 
       SET nombre=@nombre, ticker=@ticker, id_mercado=@id_mercado
       WHERE id=@id`,
      { id, nombre, ticker: String(ticker).toUpperCase(), id_mercado }
    );
    res.json({ message: 'Empresa actualizada' });
  } catch (e) {
    res.status(500).json({ message: 'Error al actualizar empresa' });
  }
}

// Actualizar inventario
export async function updateInventario(req, res) {
  const { id } = req.params;
  const a = Number(req.body.acciones_totales);
  
  if (!isGuid(id) || !a || a <= 0) return res.status(400).json({ message: 'Datos inválidos' });

  try {
    const inv = await queryDB(`SELECT acciones_totales FROM Inventario WHERE id_empresa=@id`, { id });
    if (!inv.length) return res.status(404).json({ message: 'Inventario no encontrado' });

    await queryDB(
      `UPDATE Inventario SET acciones_totales=@a, acciones_disponibles=acciones_disponibles+@dif WHERE id_empresa=@id`,
      { id, a, dif: a - inv[0].acciones_totales }
    );

    res.json({ message: 'Inventario actualizado' });
  } catch (e) {
    res.status(500).json({ message: 'Error' });
  }
}

export async function delistarEmpresa(req, res) {
  const { id } = req.params;
  const { justificacion, precio_liquidacion } = req.body;

  if (!isGuid(id)) return res.status(400).json({ message: 'ID inválido' });
  if (!justificacion?.trim()) return res.status(400).json({ message: 'Justificación requerida' });

  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    // Validar empresa y obtener precio
    const empRes = await request.query(`
      SELECT e.nombre, e.ticker, i.precio
      FROM Empresa e
      LEFT JOIN Inventario i ON i.id_empresa = e.id
      WHERE e.id = '${id}'
    `);
    
    if (!empRes.recordset || empRes.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    const precio = (precio_liquidacion && Number(precio_liquidacion) > 0)
      ? Number(precio_liquidacion)
      : Number(empRes.recordset[0].precio) || 0;

    if (precio <= 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'No hay precio válido para liquidar (cargue un precio antes de liquidar)' 
      });
    }

    // Obtener posiciones netas
    const posRes = await request.query(`
      SELECT t.alias,
             SUM(CASE WHEN t.tipo='Compra' THEN t.cantidad
                      WHEN t.tipo='Venta'  THEN -t.cantidad ELSE 0 END) AS cantidad_neta
      FROM Transaccion t
      WHERE t.id_empresa = '${id}'
      GROUP BY t.alias
      HAVING SUM(CASE WHEN t.tipo='Compra' THEN t.cantidad
                      WHEN t.tipo='Venta'  THEN -t.cantidad ELSE 0 END) > 0
    `);

    let totalLiquidado = 0;
    let posicionesLiquidadas = 0;

    // Liquidar cada posición
    for (const pos of (posRes.recordset || [])) {
      const cantidad = Number(pos.cantidad_neta);

      // Obtener datos del usuario
      const uRes = await request.query(`
        SELECT id, id_billetera, id_portafolio 
        FROM Usuario 
        WHERE alias = '${pos.alias}'
      `);
      
      if (!uRes.recordset || uRes.recordset.length === 0 || 
          !uRes.recordset[0].id_billetera || !uRes.recordset[0].id_portafolio) {
        continue;
      }
      
      const idBilletera = uRes.recordset[0].id_billetera;
      const idPortafolio = uRes.recordset[0].id_portafolio;
      const monto = cantidad * precio;
      
      // Acreditar fondos
      await request.query(`
        UPDATE Billetera 
        SET fondos = fondos + ${monto} 
        WHERE id = '${idBilletera}'
      `);
      
      // Devolver acciones a Tesorería
      await request.query(`
        UPDATE Inventario
        SET acciones_disponibles = acciones_disponibles + ${cantidad}
        WHERE id_empresa = '${id}'
      `);
      
      // Registrar transacción de venta
      await request.query(`
        INSERT INTO Transaccion (id, alias, id_portafolio, id_billetera, id_empresa, tipo, precio, cantidad)
        VALUES (NEWID(), '${pos.alias}', '${idPortafolio}', '${idBilletera}', '${id}', 'Venta', ${precio}, ${cantidad})
      `);

      // Limpiar portafolio
      await request.query(`
        UPDATE p
        SET p.acciones = 0 
        FROM Portafolio p
        INNER JOIN Usuario u ON u.id_portafolio = p.id
        WHERE u.alias = '${pos.alias}' 
        AND p.id_empresa = '${id}'
      `);

      totalLiquidado += monto;
      posicionesLiquidadas++;
    }
    
    // Marcar empresa como delistada
    await request.query(`UPDATE Empresa SET delistada = 1 WHERE id = '${id}'`);

    await transaction.commit();
    
    res.json({
      message: posicionesLiquidadas ? 'Empresa delistada con posiciones liquidadas' : 'Empresa delistada',
      posiciones_liquidadas: posicionesLiquidadas,
      total_liquidado: totalLiquidado,
      precio_liquidacion: precio,
      justificacion
    });

  } catch (e) {
    try { await transaction.rollback(); } catch (rollbackErr) {}
    console.error('[delistarEmpresa] Error delisting company:', e.message);
    res.status(500).json({ message: 'Error al delistar empresa' });
  } finally {
    try { pool && pool.close(); } catch (e) {}
  }
}

// Precios & Carga
export async function getHistorialPrecio(req, res) {
  const { id } = req.params;
  if (!isGuid(id)) return res.status(400).json({ message: 'ID inválido' });
  try {
    const rows = await queryDB(
      `SELECT fecha, precio
       FROM Inventario_Historial
       WHERE id_empresa=@id
       ORDER BY fecha ASC`,
      { id }
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener historial' });
  }
}

export async function cargarPrecioManual(req, res) {
  const { id } = req.params;
  const { precio, fecha } = req.body;
  
  if (!isGuid(id)) return res.status(400).json({ message: 'ID inválido' });
  
  const p = Number(precio);
  if (!p || p <= 0) return res.status(400).json({ message: 'Precio inválido' });
  if (!fecha) return res.status(400).json({ message: 'Fecha requerida' });

  const f = new Date(fecha);
  if (isNaN(f.getTime()) || f > new Date())
    return res.status(400).json({ message: 'Fecha inválida' });

  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    // Verificar si existe inventario
    const inv = await request.query(`SELECT 1 FROM Inventario WHERE id_empresa='${id}'`);
    
    if (!inv.recordset || inv.recordset.length === 0) {
      // Crear inventario
      await request.query(`
        INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio)
        VALUES ('${id}', 0, 0, ${p})
      `);
    } else {
      // Actualizar precio
      await request.query(`UPDATE Inventario SET precio=${p} WHERE id_empresa='${id}'`);
    }

    // Insertar en historial
    await request.query(`
      INSERT INTO Inventario_Historial (fecha, id_empresa, acciones_totales, acciones_disponibles, precio)
      SELECT '${f.toISOString()}', id_empresa, acciones_totales, acciones_disponibles, ${p}
      FROM Inventario WHERE id_empresa='${id}'
    `);

    await transaction.commit();
    res.json({ message: 'Precio cargado', precio: p, fecha: f });

  } catch (e) {
    try { await transaction.rollback(); } catch (rollbackErr) {}
    console.error('[cargarPrecioManual] Error loading price:', e.message);
    res.status(500).json({ message: 'Error al cargar precio' });
  } finally {
    try { pool && pool.close(); } catch (e) {}
  }
}

export async function cargarPreciosBatch(req, res) {
  const { precios } = req.body;
  if (!Array.isArray(precios) || precios.length === 0)
    return res.status(400).json({ message: 'Datos inválidos' });

  let ok = 0, fail = 0;
  const errores = [];

  // Procesar cada precio en su propia transacción para evitar que un error afecte a todos
  for (const it of precios) {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    
    try {
      const id = it?.id_empresa;
      const p = Number(it?.precio);
      
      if (!isGuid(id) || !p || p <= 0) {
        fail++;
        errores.push({ id_empresa: id, error: 'datos inválidos' });
        continue;
      }

      let f = null;
      if (it.fecha) {
        const d = new Date(it.fecha);
        if (isNaN(d.getTime()) || d > new Date()) {
          fail++;
          errores.push({ id_empresa: id, error: 'fecha inválida' });
          continue;
        }
        f = d;
      }

      await transaction.begin();
      const request = new sql.Request(transaction);

      // Verificar si existe inventario
      const inv = await request.query(`SELECT 1 FROM Inventario WHERE id_empresa='${id}'`);
      
      if (!inv.recordset || inv.recordset.length === 0) {
        // Crear inventario
        await request.query(`
          INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio)
          VALUES ('${id}', 0, 0, ${p})
        `);
      } else {
        // Actualizar precio
        await request.query(`UPDATE Inventario SET precio=${p} WHERE id_empresa='${id}'`);
      }

      // Insertar en historial
      const fechaSQL = f ? `'${f.toISOString()}'` : 'SYSUTCDATETIME()';
      await request.query(`
        INSERT INTO Inventario_Historial (fecha, id_empresa, acciones_totales, acciones_disponibles, precio)
        SELECT ${fechaSQL}, id_empresa, acciones_totales, acciones_disponibles, ${p}
        FROM Inventario WHERE id_empresa='${id}'
      `);

      await transaction.commit();
      ok++;

    } catch (e) {
      try { await transaction.rollback(); } catch (rollbackErr) {}
      fail++;
      errores.push({ id_empresa: it?.id_empresa, error: e.message || 'error desconocido' });
    } finally {
      try { pool && pool.close(); } catch (e) {}
    }
  }

  res.json({ message: 'Carga completada', exitosos: ok, fallidos: fail, errores });
}

// Usuarios (solo lectura para admin)
export async function getUsuarios(_req, res) {
  try {
    const rows = await queryDB(`
      SELECT id, alias, nombre, rol, habilitado, correo, telefono, direccion, pais_origen, id_billetera
      FROM Usuario
      ORDER BY alias
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
}

export async function getUsuarioCuentas(req, res) {
  const { id } = req.params;
  if (!isGuid(id)) return res.status(400).json({ message: 'ID inválido' });

  try {
    const u = await queryDB(
      `SELECT id, rol, id_billetera FROM Usuario WHERE id=@id`,
      { id }
    );
    if (!u.length) return res.status(404).json({ message: 'Usuario no encontrado' });

    let wallet = null;
    if (u[0].rol === 'Trader' && u[0].id_billetera) {
      const w = await queryDB(
        `SELECT id, fondos AS saldo, categoria, limite_diario, consumo
         FROM Billetera WHERE id=@bid`,
        { bid: u[0].id_billetera }
      );
      if (w.length) wallet = w[0];
    }

    const mercados = await queryDB(
      `SELECT m.id, m.nombre
         FROM Mercado_Habilitado mh
         JOIN Mercado m ON m.id = mh.id_mercado
        WHERE mh.id_usuario=@id
        ORDER BY m.nombre`,
      { id }
    );

    res.json({ wallet, mercados });
  } catch (e) {
    console.error('[getUsuarioCuentas] Error fetching user accounts:', e.message);
    res.status(500).json({ message: 'Error al obtener cuentas' });
  }
}

// Mercados habilitados por usuario 
export async function habilitarMercado(req, res) {
  const { id } = req.params;
  const { id_mercado } = req.body;
  
  if (!isGuid(id) || !isGuid(id_mercado)) {
    return res.status(400).json({ message: 'IDs inválidos' });
  }

  try {
    const existe = await queryDB(
      `SELECT * FROM Mercado_Habilitado WHERE id_usuario = @id_usuario AND id_mercado = @id_mercado`,
      { id_usuario: id, id_mercado: id_mercado }
    );

    if (existe.length > 0) {
      return res.status(400).json({ message: 'Mercado ya habilitado para este usuario' });
    }

    await queryDB(
      `INSERT INTO Mercado_Habilitado (id_usuario, id_mercado) VALUES (@id_usuario, @id_mercado)`,
      { id_usuario: id, id_mercado: id_mercado }
    );

    res.json({ message: 'Mercado habilitado exitosamente' });
  } catch (error) {
    console.error('[habilitarMercado] Error enabling market:', error.message);
    res.status(500).json({ message: 'Error al habilitar mercado' });
  }
}

export async function deshabilitarMercado(req, res) {
  const { id, idMercado } = req.params;
  
  if (!isGuid(id) || !isGuid(idMercado)) {
    return res.status(400).json({ message: 'IDs inválidos' });
  }

  try {
    await queryDB(
      `DELETE FROM Mercado_Habilitado WHERE id_usuario = @id_usuario AND id_mercado = @id_mercado`,
      { id_usuario: id, id_mercado: idMercado }
    );

    res.json({ message: 'Mercado deshabilitado exitosamente' });
  } catch (error) {
    console.error('[deshabilitarMercado] Error disabling market:', error.message);
    res.status(500).json({ message: 'Error al deshabilitar mercado' });
  }
}

// Deshabilitar usuario (con liquidación)
export async function deshabilitarUsuario(req, res) {
  const { id } = req.params;
  const { justificacion } = req.body;

  if (!isGuid(id)) {
    return res.status(400).json({ message: 'ID de usuario inválido' });
  }

  if (!justificacion || !justificacion.trim()) {
    return res.status(400).json({ message: 'justificación requerida' });
  }

  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    // Verificar que el usuario existe y está habilitado
    const usuario = await request.query(`
      SELECT id, alias, habilitado, id_billetera 
      FROM Usuario 
      WHERE id = '${id}'
    `);

    if (!usuario.recordset || usuario.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!usuario.recordset[0].habilitado) {
      await transaction.rollback();
      return res.status(400).json({ message: 'usuario ya deshabilitado' });
    }

    const alias = usuario.recordset[0].alias;
    const idBilletera = usuario.recordset[0].id_billetera;

    // Obtener posiciones activas del usuario
    const posiciones = await request.query(`
      SELECT 
        t.id_empresa,
        SUM(CASE WHEN t.tipo = 'Compra' THEN t.cantidad 
                 WHEN t.tipo = 'Venta' THEN -t.cantidad 
                 ELSE 0 END) AS cantidad_net
      FROM Transaccion t
      WHERE t.alias = '${alias}'
      GROUP BY t.id_empresa
      HAVING SUM(CASE WHEN t.tipo = 'Compra' THEN t.cantidad 
                      WHEN t.tipo = 'Venta' THEN -t.cantidad 
                      ELSE 0 END) > 0
    `);

    let totalLiquidado = 0;
    let posicionesLiquidadas = 0;

    // Liquidar cada posición al precio actual
    for (const pos of (posiciones.recordset || [])) {
      const cantidad = Number(pos.cantidad_net);

      // Obtener precio actual
      const inventario = await request.query(`
        SELECT precio 
        FROM Inventario 
        WHERE id_empresa = '${pos.id_empresa}'
      `);

      if (inventario.recordset && inventario.recordset.length > 0) {
        const precio = Number(inventario.recordset[0].precio);
        const montoLiquidacion = cantidad * precio;

        // Abonar al wallet
        await request.query(`
          UPDATE Billetera 
          SET fondos = fondos + ${montoLiquidacion} 
          WHERE id = '${idBilletera}'
        `);

        // Devolver acciones al inventario
        await request.query(`
          UPDATE Inventario 
          SET acciones_disponibles = acciones_disponibles + ${cantidad} 
          WHERE id_empresa = '${pos.id_empresa}'
        `);

        // Registrar transacción de liquidación
        await request.query(`
          INSERT INTO Transaccion (id, alias, id_portafolio, id_billetera, id_empresa, tipo, precio, cantidad)
          VALUES (
            NEWID(), 
            '${alias}', 
            (SELECT id_portafolio FROM Usuario WHERE id = '${id}'), 
            '${idBilletera}', 
            '${pos.id_empresa}', 
            'Venta', 
            ${precio}, 
            ${cantidad}
          )
        `);

        totalLiquidado += montoLiquidacion;
        posicionesLiquidadas++;
      }
    }

    // Deshabilitar usuario (escapar comillas en justificación)
    const justificacionEscaped = justificacion.replace(/'/g, "''");
    await request.query(`
      UPDATE Usuario 
      SET habilitado = 0, deshabilitado_justificacion = '${justificacionEscaped}' 
      WHERE id = '${id}'
    `);

    await transaction.commit();
    
    res.json({
      message: 'Usuario deshabilitado exitosamente',
      posiciones_liquidadas: posicionesLiquidadas,
      total_liquidado: totalLiquidado,
      justificacion: justificacion
    });

  } catch (error) {
    try { await transaction.rollback(); } catch (e) {}
    console.error('[deshabilitarUsuario] Error disabling user:', error.message);
    res.status(500).json({ message: 'Error al deshabilitar usuario' });
  } finally {
    try { pool && pool.close(); } catch (e) {}
  }
}

// Rankings
export async function getTopWallet(_req, res) {
  try {
    const rows = await queryDB(`
      SELECT TOP 5 u.alias, b.fondos AS saldo
      FROM Usuario u
      JOIN Billetera b ON u.id_billetera=b.id
      WHERE u.rol='Trader' AND u.habilitado=1
      ORDER BY b.fondos DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener ranking' });
  }
}

export async function getTopAcciones(_req, res) {
  try {
    const traders = await queryDB(
      `SELECT alias FROM Usuario WHERE rol='Trader' AND habilitado=1`
    );

    const resultados = [];
    for (const t of traders) {
      const pos = await queryDB(
        `SELECT id_empresa,
                SUM(CASE WHEN tipo='Compra' THEN cantidad WHEN tipo='Venta' THEN -cantidad ELSE 0 END) AS cantidad_neta
         FROM Transaccion
         WHERE alias=@a
         GROUP BY id_empresa
         HAVING SUM(CASE WHEN tipo='Compra' THEN cantidad WHEN tipo='Venta' THEN -cantidad ELSE 0 END) > 0`,
        { a: t.alias }
      );

      let total = 0;
      for (const p of pos) {
        const pr = await queryDB(`SELECT precio FROM Inventario WHERE id_empresa=@e`, { e: p.id_empresa });
        if (pr.length > 0) total += Number(p.cantidad_neta) * Number(pr[0].precio);
      }
      if (total > 0) resultados.push({ alias: t.alias, valor_acciones: total });
    }

    resultados.sort((a, b) => b.valor_acciones - a.valor_acciones);
    res.json(resultados.slice(0, 5));
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener ranking' });
  }
}