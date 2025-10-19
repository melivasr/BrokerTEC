import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import * as analistaService from "../../services/analistaService";

export default function Estadisticas() {
  const [mercadoId, setMercadoId] = useState("");
  const [mercados, setMercados] = useState([]);
  const [nivel, setNivel] = useState("mercado");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar mercados al inicio
  useEffect(() => {
    async function cargarMercados() {
      try {
        const merc = await analistaService.getMercadosAnalista();
        setMercados(merc);
      } catch (err) {
        console.error('Error cargando mercados:', err);
      }
    }
    cargarMercados();
  }, []);

  // Cargar datos al cambiar nivel o mercado
  useEffect(() => {
    cargarEstadisticas();
  }, [nivel, mercadoId]);

  const cargarEstadisticas = async () => {
    setLoading(true);
    setError("");

    try {
      let resultado;
      
      if (nivel === "mercado") {
        resultado = await analistaService.getEstadisticasMercado();
      } else {
        resultado = await analistaService.getEstadisticasEmpresa(mercadoId || null);
      }

      if (resultado.message) {
        setError(resultado.message);
        setData([]);
      } else {
        setData(resultado.estadisticas || []);
      }
      
    } catch (err) {
      console.error('Error:', err);
      const mensaje = err?.response?.data?.message || err?.message || 'Error al cargar estadísticas';
      setError(mensaje);
    }

    setLoading(false);
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Analista" />
      <main style={{ padding: 24, width: "100%" }}>
        <h2>Estadísticas — Traders vs. Administración</h2>

        <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "end" }}>
          <div>
            <label>Nivel</label><br/>
            <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
              <option value="mercado">Por Mercado</option>
              <option value="empresa">Por Empresa</option>
            </select>
          </div>
          
          {nivel === "empresa" && (
            <div>
              <label>Filtrar por Mercado</label><br/>
              <select value={mercadoId} onChange={(e) => setMercadoId(e.target.value)}>
                <option value="">Todos</option>
                {mercados.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <button onClick={cargarEstadisticas} disabled={loading}>
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

        {data.length > 0 ? (
          <div style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
            <h3>
              {nivel === "mercado" 
                ? "Distribución por Mercado" 
                : (mercadoId ? `Empresas del mercado seleccionado` : "Todas las Empresas")}
            </h3>

            <table style={{ width: "100%", marginBottom: 16, borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                    {nivel === "mercado" ? "Mercado" : "Empresa"}
                  </th>
                  {nivel === "empresa" && <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Ticker</th>}
                  {nivel === "empresa" && <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Mercado</th>}
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Acciones Traders</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Acciones Admin</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Total</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>% Traders</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>% Admin</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: 8 }}>{nivel === "mercado" ? r.mercado : r.empresa}</td>
                    {nivel === "empresa" && <td style={{ padding: 8 }}>{r.ticker}</td>}
                    {nivel === "empresa" && <td style={{ padding: 8 }}>{r.mercado}</td>}
                    <td style={{ padding: 8 }}>{r.acciones_traders.toLocaleString()}</td>
                    <td style={{ padding: 8 }}>{r.acciones_administracion.toLocaleString()}</td>
                    <td style={{ padding: 8 }}>{r.total_acciones.toLocaleString()}</td>
                    <td style={{ padding: 8 }}>{r.porcentaje_traders}%</td>
                    <td style={{ padding: 8 }}>{r.porcentaje_administracion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ResponsiveContainer width="100%" height={data.length * 60 + 100}>
              <BarChart 
                data={data} 
                layout="vertical" 
                margin={{ left: nivel === "empresa" ? 100 : 40, right: 40 }}
              >
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis 
                  type="category" 
                  dataKey={nivel === "mercado" ? "mercado" : "empresa"} 
                  width={nivel === "empresa" ? 120 : 80}
                />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Bar dataKey="porcentaje_traders" fill="#3498db" name="% Traders" />
                <Bar dataKey="porcentaje_administracion" fill="#e74c3c" name="% Admin" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : !loading && !error && (
          <div style={{ color: "orange" }}>sin posiciones para calcular</div>
        )}
      </main>
    </div>
  );
}