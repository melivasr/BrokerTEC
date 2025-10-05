import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Sidebar from "../../components/Sidebar";

export default function ReportesEmpresa() {
  const [filtros, setFiltros] = useState({ desde: "", hasta: "", mercadoId: "" });
  const [empresaId, setEmpresaId] = useState("1");

  // Mock empresa + histórico + transacciones
  const empresa = { nombre: "Acme Corp", ticker: "ACM" };
  const historico_precios = [
    { fecha: "2025-09-27", valor: 98 },
    { fecha: "2025-09-28", valor: 101 },
    { fecha: "2025-09-29", valor: 97 },
    { fecha: "2025-09-30", valor: 104 },
    { fecha: "2025-10-01", valor: 103 },
    { fecha: "2025-10-02", valor: 106 },
    { fecha: "2025-10-03", valor: 110 },
  ];
  const mayor_tenedor_alias = "Tesoreria";
  const inventario_tesoreria = 125000;

  const transacciones = [
    { fecha_hora: "2025-10-03T10:15:00Z", alias: "trader_01", tipo: "Compra", cantidad: 120, precio: 110 },
    { fecha_hora: "2025-10-03T12:05:00Z", alias: "trader_17", tipo: "Venta", cantidad: 40, precio: 109.5 },
    { fecha_hora: "2025-10-04T14:45:00Z", alias: "trader_08", tipo: "Compra", cantidad: 300, precio: 111.2 },
  ];

  const aplicar = (e) => {
    e.preventDefault();
    // futuro: fetch con filtros + empresaId
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Analista" />
      <main style={{ padding: 24, width: "100%" }}>
        <h2>Reporte por Empresa</h2>

        <form onSubmit={aplicar} style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <label>Empresa ID</label><br/>
            <input value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} placeholder="Ej: 1" />
          </div>
          <div>
            <label>Desde</label><br/>
            <input type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} />
          </div>
          <div>
            <label>Hasta</label><br/>
            <input type="date" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} />
          </div>
          <div>
            <label>Mercado</label><br/>
            <select value={filtros.mercadoId} onChange={(e) => setFiltros({ ...filtros, mercadoId: e.target.value })}>
              <option value="">Todos</option>
              <option value="1">NYSE</option>
              <option value="2">NASDAQ</option>
            </select>
          </div>
          <button type="submit">Aplicar</button>
        </form>

        <div style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
          <h3>{empresa.nombre} ({empresa.ticker})</h3>
          <p><b>Mayor tenedor:</b> {mayor_tenedor_alias === "Tesoreria" ? "administracion" : mayor_tenedor_alias}</p>
          <p><b>Inventario Tesorería:</b> {inventario_tesoreria.toLocaleString()}</p>

          <h4 style={{ marginTop: 16 }}>Precio vs. Tiempo</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historico_precios}>
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip formatter={(v) => `$${v}`} />
              <Line type="monotone" dataKey="valor" stroke="#2ecc71" />
            </LineChart>
          </ResponsiveContainer>

          <h4 style={{ marginTop: 16 }}>Historial de transacciones</h4>
          <table style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Fecha–Hora</th>
                <th>Alias</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              {transacciones.length ? transacciones.map((t, i) => (
                <tr key={i}>
                  <td>{new Date(t.fecha_hora).toLocaleString()}</td>
                  <td>{t.alias}</td>
                  <td>{t.tipo}</td>
                  <td>{t.cantidad}</td>
                  <td>${t.precio}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ color: "orange", textAlign: "center" }}>Sin transacciones</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
