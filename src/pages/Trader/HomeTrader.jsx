// src/pages/Trader/HomeTrader.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import * as empresaService from "../../services/empresaService";

export default function HomeTrader() {
  const [mercados, setMercados] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        // Suponiendo que empresaService.getPanoramaMercados() retorna los mercados habilitados y sus top empresas
        const data = await empresaService.getPanoramaMercados();
        setMercados(data);
      } catch (err) {
        setError(err?.message || "Error al cargar datos de mercado");
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Trader" />
      <main style={{ padding: 24, width: "100%" }}>
        <h2>Portada del Trader</h2>
        {loading && <p>Cargando datos...</p>}
        {error && <div style={{ color: "red" }}>{error}</div>}
        {!loading && mercados.length === 0 && <div>No hay mercados habilitados.</div>}
        {mercados.map((mercado) => (
          <section key={mercado.mercado_id} style={{ marginBottom: 40 }}>
            <h3>{mercado.nombre}</h3>
            {mercado.empresas.length === 0 ? (
              <div style={{ color: "orange" }}>Sin datos de capitalización</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={mercado.empresas}
                  layout="vertical"
                  margin={{ left: 40, right: 40 }}
                >
                  <XAxis type="number" dataKey="capitalizacion" tickFormatter={v => `$${v.toLocaleString()}`}/>
                  <YAxis type="category" dataKey="nombre" width={120} />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="capitalizacion" fill="#3498db">
                    <LabelList dataKey="ticker" position="right" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <ul style={{ marginTop: 16 }}>
              {mercado.empresas.map((e) => (
                <li key={e.empresa_id} style={{ marginBottom: 8 }}>
                  <b>{e.nombre}</b> ({e.ticker}) - Capitalización: ${e.capitalizacion.toLocaleString()}<br/>
                  Precio actual: ${e.precio_actual} | Variación: {e.variacion > 0 ? '+' : ''}{e.variacion}%<br/>
                  <button onClick={() => window.location.href = `/trader/empresa/${e.empresa_id}`}>Ver Empresa</button>
                  <button onClick={() => window.location.href = `/trader/operar?empresa=${e.empresa_id}`} style={{ marginLeft: 8 }}>Operar</button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}