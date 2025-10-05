import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";

export default function ReportesUsuario() {
  const [alias, setAlias] = useState("");
  const [filtros, setFiltros] = useState({ desde: "", hasta: "", empresaId: "", tipo: "" });

  // Mock “resultado” (se muestra tras “Buscar”)
  const [resultado, setResultado] = useState(null);

  const buscar = (e) => {
    e.preventDefault();
    if (!alias.trim()) return;

    // En el futuro, reemplazas por la llamada al backend
    setResultado({
      alias: alias.trim(),
      transacciones: [
        { fecha_hora: "2025-10-02T09:10:00Z", empresa_nombre: "Acme Corp", ticker: "ACM", tipo: "Compra", cantidad: 50, precio: 108.2 },
        { fecha_hora: "2025-10-03T13:25:00Z", empresa_nombre: "Globex", ticker: "GLX", tipo: "Venta", cantidad: 20, precio: 89.1 },
        { fecha_hora: "2025-10-04T15:40:00Z", empresa_nombre: "Initech", ticker: "ITX", tipo: "Compra", cantidad: 75, precio: 45.0 },
      ],
    });
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Analista" />
      <main style={{ padding: 24, width: "100%" }}>
        <h2>Reporte por Usuario (alias)</h2>

        <form onSubmit={buscar} style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <label>Alias</label><br/>
            <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="p.ej. trader_01" />
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
            <label>Empresa (ID)</label><br/>
            <input value={filtros.empresaId} onChange={(e) => setFiltros({ ...filtros, empresaId: e.target.value })} placeholder="Opcional" />
          </div>
          <div>
            <label>Tipo</label><br/>
            <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
              <option value="">Todos</option>
              <option value="Compra">Compra</option>
              <option value="Venta">Venta</option>
            </select>
          </div>
          <button type="submit">Buscar</button>
        </form>

        {resultado && (
          <div style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
            <h3>Alias: {resultado.alias}</h3>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Fecha–Hora</th>
                  <th>Empresa</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {resultado.transacciones.length ? resultado.transacciones.map((t, i) => (
                  <tr key={i}>
                    <td>{new Date(t.fecha_hora).toLocaleString()}</td>
                    <td>{t.empresa_nombre} ({t.ticker})</td>
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
        )}
      </main>
    </div>
  );
}
