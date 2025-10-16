import { queryDB } from "../config/db.js";

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
    console.error('Error en getPortafolio:', err);
    res.status(500).json({ message: 'Error al obtener portafolio', error: err.message });
  }
}
