import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";

export default function Estasticas() {
  const [mercadoId, setMercadoId] = useState("");

  // Datos mock
  const dataMock = [
    { empresa_id: 1, empresa_nombre: "Acme Corp", pct_traders: 62.5, pct_administracion: 37.5 },
    { empresa_id: 2, empresa_nombre: "Globex", pct_traders: 40.0, pct_administracion: 60.0 },
    { empresa_id: 3, empresa_nombre: "Initech", pct_traders: 75.0, pct_administracion: 25.0 },
  ];

  const data = dataMock; // en el futuro filtras por mercadoId

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Analista" />
      <main style={{ padding: 24, width: "100%" }}>
        <h2>Estadísticas — Traders vs. Administración</h2>

        <div style={{ marginBottom: 16 }}>
          <label>Mercado</label>{" "}
          <select value={mercadoId} onChange={(e) => setMercadoId(e.target.value)}>
            <option value="">Todos</option>
            <option value="1">NYSE</option>
            <option value="2">NASDAQ</option>
          </select>
          <button style={{ marginLeft: 8 }} onClick={() => { /* futuro: aplicar filtros */ }}>
            Aplicar
          </button>
        </div>

        <div style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
          <h3>{mercadoId ? `Mercado ${mercadoId}` : "Todos los mercados"}</h3>

          <table style={{ width: "100%", marginBottom: 16 }}>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>% Traders</th>
                <th>% Administración</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.empresa_id}>
                  <td>{r.empresa_nombre}</td>
                  <td>{r.pct_traders.toFixed(2)}%</td>
                  <td>{r.pct_administracion.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} layout="vertical" margin={{ left: 40, right: 40 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="empresa_nombre" width={150} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="pct_traders" fill="#3498db">
                <LabelList dataKey="empresa_nombre" position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
}