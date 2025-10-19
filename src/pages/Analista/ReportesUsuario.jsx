import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import * as analistaService from "../../services/analistaService";

export default function ReportesUsuario() {
  const [alias, setAlias] = useState("");
  const [filtros, setFiltros] = useState({ desde: "", hasta: "", empresaId: "", tipo: "", ordenar: "" });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buscar = async (e) => {
    e.preventDefault();
    
    if (!alias.trim()) {
      setError("Debes ingresar un alias");
      return;
    }

    setLoading(true);
    setError("");
    setResultado(null);

    try {
      const params = {};
      if (filtros.desde) params.fecha_inicio = filtros.desde;
      if (filtros.hasta) params.fecha_fin = filtros.hasta;
      if (filtros.empresaId) params.id_empresa = filtros.empresaId;
      if (filtros.tipo) params.tipo = filtros.tipo;
      if (filtros.ordenar) params.ordenar = filtros.ordenar;

      const data = await analistaService.getHistorialUsuario(alias.trim(), params);
      setResultado(data);
      
    } catch (err) {
      console.error('Error:', err);
      const mensaje = err?.response?.data?.message || err?.message || 'Error al buscar usuario';
      
      // Mensaje 
      if (mensaje === 'alias inexistente' || err?.response?.status === 404) {
        setError('alias inexistente');
      } else {
        setError(mensaje);
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Analista" />
      <main style={{ padding: 24, width: "100%" }}>
        <h2>Reporte por Usuario (alias)</h2>

        <form onSubmit={buscar} style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <label>Alias</label><br/>
            <input 
              value={alias} 
              onChange={(e) => setAlias(e.target.value)} 
              placeholder="p.ej. juanp" 
            />
          </div>
          <div>
            <label>Desde</label><br/>
            <input 
              type="date" 
              value={filtros.desde} 
              onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} 
            />
          </div>
          <div>
            <label>Hasta</label><br/>
            <input 
              type="date" 
              value={filtros.hasta} 
              onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} 
            />
          </div>
          <div>
            <label>Empresa (ID)</label><br/>
            <input 
              value={filtros.empresaId} 
              onChange={(e) => setFiltros({ ...filtros, empresaId: e.target.value })} 
              placeholder="Opcional" 
            />
          </div>
          <div>
            <label>Tipo</label><br/>
            <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
              <option value="">Todos</option>
              <option value="Compra">Compra</option>
              <option value="Venta">Venta</option>
            </select>
          </div>
          <div>
            <label>Ordenar por</label><br/>
            <select value={filtros.ordenar} onChange={(e) => setFiltros({ ...filtros, ordenar: e.target.value })}>
              <option value="">Fecha (desc)</option>
              <option value="empresa">Empresa</option>
              <option value="tipo">Tipo</option>
              <option value="fecha">Fecha</option>
            </select>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

        {resultado && (
          <div style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
            <h3>Alias: {resultado.alias}</h3>
            
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Fecha–Hora</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Empresa</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Mercado</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Tipo</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Cantidad</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Precio</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Monto Total</th>
                </tr>
              </thead>
              <tbody>
                {resultado.historial.length > 0 ? resultado.historial.map((t) => (
                  <tr key={t.id}>
                    <td style={{ padding: 8 }}>{new Date(t.fecha).toLocaleString()}</td>
                    <td style={{ padding: 8 }}>{t.empresa} ({t.ticker})</td>
                    <td style={{ padding: 8 }}>{t.mercado}</td>
                    <td style={{ padding: 8 }}>{t.tipo}</td>
                    <td style={{ padding: 8 }}>{t.cantidad}</td>
                    <td style={{ padding: 8 }}>${t.precio}</td>
                    <td style={{ padding: 8 }}>${t.monto_total}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} style={{ color: "orange", textAlign: "center", padding: 8 }}>Sin transacciones</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}