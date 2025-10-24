import { queryDB } from "../config/db.js";

const GUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// EMPRESA (REPORTES)
// Historial de transacciones de una empresa
export async function getTransaccionesEmpresa(req, res) {
  const { id } = req.params;
  const { fecha_inicio, fecha_fin } = req.query;

  if (!GUID_RE.test(id)) return res.status(400).json({ message: "ID de empresa inválido" });

  if (fecha_inicio && fecha_fin && new Date(fecha_inicio) > new Date(fecha_fin)) {
    return res.status(400).json({ message: "rango de fechas inválido" });
  }

  try {
    let sql = `
      SELECT t.id, t.alias, t.tipo, t.cantidad, t.precio, t.fecha
      FROM Transaccion t
      WHERE t.id_empresa = @id_empresa
    `;
    const params = { id_empresa: id };

    if (fecha_inicio) { sql += ` AND t.fecha >= @fecha_inicio`; params.fecha_inicio = fecha_inicio; }
    if (fecha_fin)    { sql += ` AND t.fecha <= @fecha_fin`;    params.fecha_fin    = fecha_fin; }

    sql += ` ORDER BY t.fecha DESC`;

    const rows = await queryDB(sql, params);
    const transacciones = rows.map(r => ({ ...r, monto_total: r.cantidad * r.precio }));

    res.json(transacciones);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ message: "Error al obtener transacciones" });
  }
}

// Mayor tenedor de una empresa (trader, administración por admins o tesorería)
export async function getMayorTenedor(req, res) {
  const { id } = req.params;

  if (!GUID_RE.test(id)) return res.status(400).json({ message: "ID de empresa inválido" });

  try {
    const [traders, admins, inventario] = await Promise.all([
      queryDB(`
        SELECT u.alias, SUM(p.acciones) AS total
        FROM Portafolio p
        INNER JOIN Usuario u ON p.id = u.id_portafolio
        WHERE p.id_empresa = @id_empresa AND p.acciones > 0 AND u.rol = 'Trader'
        GROUP BY u.alias
        ORDER BY SUM(p.acciones) DESC
      `, { id_empresa: id }),
      queryDB(`
        SELECT SUM(p.acciones) AS total
        FROM Portafolio p
        INNER JOIN Usuario u ON p.id = u.id_portafolio
        WHERE p.id_empresa = @id_empresa AND p.acciones > 0 AND u.rol = 'Admin'
      `, { id_empresa: id }),
      queryDB(`
        SELECT acciones_disponibles
        FROM Inventario
        WHERE id_empresa = @id_empresa
      `, { id_empresa: id })
    ]);

    let mayor = null;
    let max = 0;

    const tesoreria = Number(inventario?.[0]?.acciones_disponibles || 0);
    if (tesoreria > max) { max = tesoreria; mayor = { tenedor: "administracion", total_acciones: tesoreria }; }

    const totalAdmins = Number(admins?.[0]?.total || 0);
    if (totalAdmins > max) { max = totalAdmins; mayor = { tenedor: "administracion", total_acciones: totalAdmins }; }

    if (traders.length) {
      const topTrader = { alias: traders[0].alias, total: Number(traders[0].total || 0) };
      if (topTrader.total > max) { max = topTrader.total; mayor = { tenedor: topTrader.alias, total_acciones: topTrader.total }; }
    }

    res.json(mayor);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ message: "Error al obtener mayor tenedor" });
  }
}

// Inventario de Tesorería
export async function getInventarioTesoreria(req, res) {
  const { id } = req.params;

  if (!GUID_RE.test(id)) return res.status(400).json({ message: "ID de empresa inválido" });

  try {
    const rows = await queryDB(`
      SELECT acciones_totales, acciones_disponibles, precio
      FROM Inventario
      WHERE id_empresa = @id_empresa
    `, { id_empresa: id });

    if (!rows.length) return res.status(404).json({ message: "Inventario no encontrado" });

    const inv = rows[0];

    const enCirculacion = inv.acciones_totales - inv.acciones_disponibles;
    const porcentajeTesoreria   = (inv.acciones_disponibles / inv.acciones_totales) * 100;
    const porcentajeCirculacion = (enCirculacion / inv.acciones_totales) * 100;

    res.json({
      acciones_totales: inv.acciones_totales,
      acciones_disponibles: inv.acciones_disponibles,
      acciones_en_circulacion: enCirculacion,
      precio_actual: inv.precio,
      porcentaje_tesoreria: porcentajeTesoreria.toFixed(2),
      porcentaje_circulacion: porcentajeCirculacion.toFixed(2),
    });
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ message: "Error al obtener inventario" });
  }
}

// Historial de precios 
export async function getHistorialPrecio(req, res) {
  const { id } = req.params;
  const { fecha_inicio, fecha_fin } = req.query;

  if (!GUID_RE.test(id)) return res.status(400).json({ message: "ID de empresa inválido" });

  if (fecha_inicio && fecha_fin && new Date(fecha_inicio) > new Date(fecha_fin)) {
    return res.status(400).json({ message: "rango de fechas inválido" });
  }

  try {
    let sql = `
      SELECT fecha, precio
      FROM Inventario_Historial
      WHERE id_empresa = @id_empresa
    `;
    const params = { id_empresa: id };

    if (fecha_inicio) { sql += ` AND fecha >= @fecha_inicio`; params.fecha_inicio = fecha_inicio; }
    if (fecha_fin)    { sql += ` AND fecha <= @fecha_fin`;    params.fecha_fin    = fecha_fin;   }

    sql += ` ORDER BY fecha ASC`;

    const historial = await queryDB(sql, params);

    const precioActual = await queryDB(`
      SELECT precio FROM Inventario WHERE id_empresa = @id_empresa
    `, { id_empresa: id });

    if (precioActual.length) {
      historial.push({ fecha: new Date(), precio: precioActual[0].precio });
    }

    res.json(historial);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ message: "Error al obtener historial de precios" });
  }
}

// Lista de empresas 
export async function getEmpresasPorMercado(req, res) {
  const { id_mercado } = req.query;

  try {
    let sql = `
      SELECT e.id, e.nombre, e.ticker, m.nombre AS mercado, e.id_mercado
      FROM Empresa e
      INNER JOIN Mercado m ON e.id_mercado = m.id
    `;
    const params = {};

    if (id_mercado) { sql += ` WHERE e.id_mercado = @id_mercado`; params.id_mercado = id_mercado; }

    sql += ` ORDER BY m.nombre, e.nombre`;

    const empresas = await queryDB(sql, params);
    res.json(empresas);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ message: "Error al obtener empresas" });
  }
}

// USUARIO (ALIAS)
// Historial de transacciones por alias
export async function getHistorialUsuario(req, res) {
  const { alias } = req.params;
  const { fecha_inicio, fecha_fin, tipo, ordenar } = req.query;

  try {
    const exists = await queryDB(`
      SELECT COUNT(*) AS existe FROM Usuario WHERE alias = @alias
    `, { alias });

    if (!exists[0]?.existe) return res.status(404).json({ message: "alias inexistente" });

    let sql = `
      SELECT t.id, e.nombre AS empresa, e.ticker, m.nombre AS mercado,
             t.tipo, t.cantidad, t.precio, t.fecha
      FROM Transaccion t
      INNER JOIN Empresa e ON t.id_empresa = e.id
      INNER JOIN Mercado m ON e.id_mercado = m.id
      WHERE t.alias = @alias
    `;
    const params = { alias };

    if (fecha_inicio) { sql += ` AND t.fecha >= @fecha_inicio`; params.fecha_inicio = fecha_inicio; }
    if (fecha_fin)    { sql += ` AND t.fecha <= @fecha_fin`;    params.fecha_fin    = fecha_fin;    }
    if (tipo === "Compra" || tipo === "Venta") { sql += ` AND t.tipo = @tipo`; params.tipo = tipo; }

    if (ordenar === "empresa") {
      sql += ` ORDER BY e.nombre ASC, t.fecha DESC`;
    } else if (ordenar === "tipo") {
      sql += ` ORDER BY t.tipo ASC, t.fecha DESC`;
    } else {
      sql += ` ORDER BY t.fecha DESC`;
    }

    const rows = await queryDB(sql, params);
    const historial = rows.map(r => ({ ...r, monto_total: r.cantidad * r.precio }));

    res.json({ alias, historial });
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ message: "Error al obtener historial del usuario" });
  }
}

// ESTADÍSTICAS
// Estadísticas por mercado (porcentaje traders vs administración)
export async function getEstadisticasMercado(req, res) {
  try {
    const base = await queryDB(`
      SELECT 
        m.nombre AS mercado,
        SUM(inv.acciones_totales)     AS total_acciones,
        SUM(inv.acciones_disponibles) AS tesoreria
      FROM Empresa e
      INNER JOIN Mercado m   ON e.id_mercado = m.id
      INNER JOIN Inventario inv ON inv.id_empresa = e.id
      GROUP BY m.nombre
    `);

    if (!base.length) return res.status(200).json({ message: "sin posiciones para calcular", estadisticas: [] });

    const [rowsTraders, rowsAdmins] = await Promise.all([
      queryDB(`
        SELECT m.nombre AS mercado, SUM(p.acciones) AS acciones_traders
        FROM Portafolio p
        INNER JOIN Usuario u ON p.id = u.id_portafolio
        INNER JOIN Empresa e ON p.id_empresa = e.id
        INNER JOIN Mercado m ON e.id_mercado = m.id
        WHERE p.acciones > 0 AND u.rol = 'Trader'
        GROUP BY m.nombre
      `),
      queryDB(`
        SELECT m.nombre AS mercado, SUM(p.acciones) AS acciones_admins
        FROM Portafolio p
        INNER JOIN Usuario u ON p.id = u.id_portafolio
        INNER JOIN Empresa e ON p.id_empresa = e.id
        INNER JOIN Mercado m ON e.id_mercado = m.id
        WHERE p.acciones > 0 AND u.rol = 'Admin'
        GROUP BY m.nombre
      `),
    ]);

    const mapTraders = new Map(rowsTraders.map(r => [r.mercado, Number(r.acciones_traders || 0)]));
    const mapAdmins  = new Map(rowsAdmins .map(r => [r.mercado, Number(r.acciones_admins  || 0)]));

    const out = [];
    let sumaTotales = 0;

    for (const r of base) {
      const traders = mapTraders.get(r.mercado) || 0;
      const administracion = (mapAdmins.get(r.mercado) || 0) + Number(r.tesoreria || 0);
      
      const total = traders + administracion;
      if (total <= 0) continue;

      out.push({
        mercado: r.mercado,
        acciones_traders: traders,
        acciones_administracion: administracion,
        total_acciones: total,
        porcentaje_traders: (traders / total) * 100,
        porcentaje_administracion: (administracion / total) * 100,
      });

      sumaTotales += total;
    }

    if (!out.length || !sumaTotales) {
      return res.status(200).json({ message: "sin posiciones para calcular", estadisticas: [] });
    }

    res.json({ estadisticas: out });
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
}

// Estadísticas por empresa 
export async function getEstadisticasEmpresa(req, res) {
  const { id_mercado } = req.query;

  try {
    let sqlBase = `
      SELECT e.id, e.nombre AS empresa, e.ticker, m.nombre AS mercado,
             inv.acciones_totales, inv.acciones_disponibles
      FROM Empresa e
      INNER JOIN Mercado m   ON e.id_mercado = m.id
      INNER JOIN Inventario inv ON inv.id_empresa = e.id
    `;
    const params = {};
    if (id_mercado) { sqlBase += ` WHERE e.id_mercado = @id_mercado`; params.id_mercado = id_mercado; }
    sqlBase += ` ORDER BY m.nombre, e.nombre`;

    const base = await queryDB(sqlBase, params);
    if (!base.length) return res.status(200).json({ message: "sin posiciones para calcular", estadisticas: [] });

    let sqlTraders = `
      SELECT e.id, SUM(p.acciones) AS acciones_traders
      FROM Portafolio p
      INNER JOIN Usuario u ON p.id = u.id_portafolio
      INNER JOIN Empresa e ON p.id_empresa = e.id
      WHERE p.acciones > 0 AND u.rol = 'Trader'
    `;
    let sqlAdmins = `
      SELECT e.id, SUM(p.acciones) AS acciones_admins
      FROM Portafolio p
      INNER JOIN Usuario u ON p.id = u.id_portafolio
      INNER JOIN Empresa e ON p.id_empresa = e.id
      WHERE p.acciones > 0 AND u.rol = 'Admin'
    `;
    if (id_mercado) {
      sqlTraders += ` AND e.id_mercado = @id_mercado`;
      sqlAdmins  += ` AND e.id_mercado = @id_mercado`;
    }
    sqlTraders += ` GROUP BY e.id`;
    sqlAdmins  += ` GROUP BY e.id`;

    const [rowsTraders, rowsAdmins] = await Promise.all([
      queryDB(sqlTraders, params),
      queryDB(sqlAdmins,  params),
    ]);

    const mapTraders = new Map(rowsTraders.map(r => [r.id, Number(r.acciones_traders || 0)]));
    const mapAdmins  = new Map(rowsAdmins .map(r => [r.id, Number(r.acciones_admins  || 0)]));

    const out = [];
    let sumaTotales = 0;

    for (const r of base) {
      const traders = mapTraders.get(r.id) || 0;
      const administracion = (mapAdmins.get(r.id) || 0) + Number(r.acciones_disponibles || 0);
    
      const total = traders + administracion;
      if (total <= 0) continue;

      out.push({
        empresa: r.empresa,
        ticker: r.ticker,
        mercado: r.mercado,
        acciones_traders: traders,
        acciones_administracion: administracion,
        total_acciones: total,
        porcentaje_traders: (traders / total) * 100,
        porcentaje_administracion: (administracion / total) * 100,
      });

      sumaTotales += total;
    }

    if (!out.length || !sumaTotales) {
      return res.status(200).json({ message: "sin posiciones para calcular", estadisticas: [] });
    }

    res.json({ estadisticas: out });
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
}

// Lista de mercados
export async function getMercados(req, res) {
  try {
    const rows = await queryDB(`SELECT id, nombre FROM Mercado ORDER BY nombre`);
    res.json(rows);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ message: "Error al obtener mercados" });
  }
}