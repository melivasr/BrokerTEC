import { queryDB } from "../config/db.js";

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
    // 2. Para cada mercado, obtener top 5 empresas por capitalización
    const result = [];
    for (const mercado of mercados) {
      const empresas = await queryDB(
        `SELECT TOP 5 e.id, e.nombre, e.ticker,
                i.precio AS precio_actual,
                i.acciones_disponibles * i.precio AS capitalizacion,
                i.acciones_disponibles,
                i.precio AS precio_actual,
                (
                  i.precio - ISNULL((SELECT TOP 1 ih.precio FROM Inventario_Historial ih WHERE ih.id_empresa = e.id AND ih.fecha < SYSDATETIME() ORDER BY ih.fecha DESC), 0)
                ) AS variacion
         FROM Empresa e
         JOIN Inventario i ON i.id_empresa = e.id
         WHERE e.id_mercado = @mercado_id
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
    console.error("Error en getHomeTraderData:", error);
    res.status(500).json({ error: "Error obteniendo datos de HomeTrader", details: error });
    }
}
