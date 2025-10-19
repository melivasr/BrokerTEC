import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Sidebar from "../../components/Sidebar";
import * as analistaService from "../../services/analistaService";

export default function ReportesEmpresa() {
  const [filtros, setFiltros] = useState({ desde: "", hasta: "", mercadoId: "" });
  const [empresaId, setEmpresaId] = useState("");
  const [empresas, setEmpresas] = useState([]);
  const [mercados, setMercados] = useState([]);
  
  const [transacciones, setTransacciones] = useState([]);
  const [mayorTenedor, setMayorTenedor] = useState(null);
  const [tesoreria, setTesoreria] = useState(null);
  const [historicoPrecio, setHistoricoPrecio] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar mercados y empresas al inicio
  useEffect(() => {
    async function cargarInicial() {
      try {
        const merc = await analistaService.getMercadosAnalista();
        setMercados(merc);
        
        const emp = await analistaService.getEmpresasPorMercado();
        setEmpresas(emp);
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
      }
    }
    cargarInicial();
  }, []);

  // Actualizar empresas cuando cambia el mercado
  useEffect(() => {
    async function cargarEmpresas() {
      try {
        const emp = await analistaService.getEmpresasPorMercado(filtros.mercadoId || null);
        setEmpresas(emp);
      } catch (err) {
        console.error('Error cargando empresas:', err);
      }
    }
    cargarEmpresas();
  }, [filtros.mercadoId]);

  const aplicar = async (e) => {
    e.preventDefault();
    
    if (!empresaId) {
      setError("Debes seleccionar una empresa");
      return;
    }

    // Validación de rango de fechas
    if (filtros.desde && filtros.hasta) {
      const inicio = new Date(filtros.desde);
      const fin = new Date(filtros.hasta);
      if (inicio > fin) {
        setError("rango de fechas inválido");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const params = {};
      if (filtros.desde) params.fecha_inicio = filtros.desde;
      if (filtros.hasta) params.fecha_fin = filtros.hasta;

      // Obtener datos de la empresa seleccionada
      const empresaEncontrada = empresas.find(e => e.id === empresaId);
      setEmpresaSeleccionada(empresaEncontrada);

      // Llamar a todos los endpoints
      const trans = await analistaService.getTransaccionesEmpresa(empresaId, params);
      setTransacciones(trans);

      const tenedor = await analistaService.getMayorTenedor(empresaId);
      setMayorTenedor(tenedor);

      const inv = await analistaService.getInventarioTesoreria(empresaId);
      setTesoreria(inv);

      const hist = await analistaService.getHistorialPrecio(empresaId, params);
      setHistoricoPrecio(hist);

    } catch (err) {
      console.error('Error:', err);
      const mensaje = err?.response?.data?.message || err?.message || 'Error al cargar datos';
      setError(mensaje);
    }

    setLoading(false);
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Analista" />
      <main style={{ padding: 24, width: "100%" }}>
        <h2>Reporte por Empresa</h2>

        <form onSubmit={aplicar} style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <label>Empresa</label><br/>
            <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
              <option value="">Selecciona una empresa</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nombre} ({emp.ticker})</option>
              ))}
            </select>
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
              {mercados.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Cargando...' : 'Aplicar'}
          </button>
        </form>

        {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

        {empresaSeleccionada && (
          <div style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
            <h3>{empresaSeleccionada.nombre} ({empresaSeleccionada.ticker})</h3>
            
            <p>
              <b>Mayor tenedor:</b> {mayorTenedor ? mayorTenedor.tenedor : 'Cargando...'}
              {mayorTenedor && ` (${mayorTenedor.total_acciones} acciones)`}
            </p>
            
            <p>
              <b>Inventario Tesorería:</b> {tesoreria ? `${tesoreria.acciones_disponibles.toLocaleString()} acciones disponibles` : 'Cargando...'}
            </p>

            {tesoreria && (
              <div style={{ marginBottom: 16 }}>
                <p>Acciones totales: {tesoreria.acciones_totales.toLocaleString()}</p>
                <p>Acciones en circulación: {tesoreria.acciones_en_circulacion.toLocaleString()}</p>
                <p>Precio actual: ${tesoreria.precio_actual}</p>
                <p>% en Tesorería: {tesoreria.porcentaje_tesoreria}%</p>
              </div>
            )}

            <h4 style={{ marginTop: 16 }}>Precio vs. Tiempo</h4>
            {historicoPrecio.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={historicoPrecio}>
                  <XAxis dataKey="fecha" tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip formatter={(v) => `$${v}`} />
                  <Line type="monotone" dataKey="precio" stroke="#2ecc71" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: "orange" }}>Sin datos históricos de precio</p>
            )}

            <h4 style={{ marginTop: 16 }}>Historial de transacciones</h4>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Fecha–Hora</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Alias</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Tipo</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Cantidad</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Precio</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Monto Total</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.length > 0 ? transacciones.map((t) => (
                  <tr key={t.id}>
                    <td style={{ padding: 8 }}>{new Date(t.fecha).toLocaleString()}</td>
                    <td style={{ padding: 8 }}>{t.alias}</td>
                    <td style={{ padding: 8 }}>{t.tipo}</td>
                    <td style={{ padding: 8 }}>{t.cantidad}</td>
                    <td style={{ padding: 8 }}>${t.precio}</td>
                    <td style={{ padding: 8 }}>${t.monto_total}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} style={{ color: "orange", textAlign: "center", padding: 8 }}>Sin transacciones</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}