import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import * as analistaService from "../../services/analistaService";

// Estilos compartidos
const tableCell = { padding: 8, borderBottom: '1px solid #ddd' };

// Componente tarjetas de estadísticas
const EstadisticasView = ({ data, nivel, isMobile }) => (
  isMobile ? (
    <div style={{ marginBottom: 16 }}>
      {data.map((r, idx) => (
        <div key={idx} className="card" style={{ marginBottom: 12 }}>
          <h4 style={{ marginTop: 0, marginBottom: 8 }}>
            {nivel === "mercado" ? r.mercado : r.empresa}
            {nivel === "empresa" && <span style={{ fontSize: '0.9em', color: '#666' }}> ({r.ticker})</span>}
          </h4>
          {nivel === "empresa" && (
            <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>
              <strong>Mercado:</strong> {r.mercado}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <div>
              <strong style={{ fontSize: 13, color: '#666' }}>Traders:</strong>
              <div style={{ fontSize: 16 }}>{r.acciones_traders.toLocaleString()}</div>
              <div style={{ fontSize: 14, color: '#3498db', fontWeight: 'bold' }}>{r.porcentaje_traders}%</div>
            </div>
            <div>
              <strong style={{ fontSize: 13, color: '#666' }}>Admin:</strong>
              <div style={{ fontSize: 16 }}>{r.acciones_administracion.toLocaleString()}</div>
              <div style={{ fontSize: 14, color: '#e74c3c', fontWeight: 'bold' }}>{r.porcentaje_administracion}%</div>
            </div>
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee' }}>
            <strong style={{ fontSize: 13, color: '#666' }}>Total:</strong> {r.total_acciones.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <table style={{ width: "100%", marginBottom: 16, borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ ...tableCell, textAlign: 'left' }}>
            {nivel === "mercado" ? "Mercado" : "Empresa"}
          </th>
          {nivel === "empresa" && <th style={{ ...tableCell, textAlign: 'left' }}>Ticker</th>}
          {nivel === "empresa" && <th style={{ ...tableCell, textAlign: 'left' }}>Mercado</th>}
          <th style={{ ...tableCell, textAlign: 'right' }}>Acciones Traders</th>
          <th style={{ ...tableCell, textAlign: 'right' }}>Acciones Admin</th>
          <th style={{ ...tableCell, textAlign: 'right' }}>Total</th>
          <th style={{ ...tableCell, textAlign: 'center' }}>% Traders</th>
          <th style={{ ...tableCell, textAlign: 'center' }}>% Admin</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r, idx) => (
          <tr key={idx}>
            <td style={{ padding: 8 }}>{nivel === "mercado" ? r.mercado : r.empresa}</td>
            {nivel === "empresa" && <td style={{ padding: 8 }}>{r.ticker}</td>}
            {nivel === "empresa" && <td style={{ padding: 8 }}>{r.mercado}</td>}
            <td style={{ padding: 8, textAlign: 'right' }}>{r.acciones_traders.toLocaleString()}</td>
            <td style={{ padding: 8, textAlign: 'right' }}>{r.acciones_administracion.toLocaleString()}</td>
            <td style={{ padding: 8, textAlign: 'right' }}>{r.total_acciones.toLocaleString()}</td>
            <td style={{ padding: 8, textAlign: 'center', fontWeight: 'bold', color: '#3498db' }}>{r.porcentaje_traders}%</td>
            <td style={{ padding: 8, textAlign: 'center', fontWeight: 'bold', color: '#e74c3c' }}>{r.porcentaje_administracion}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
);

// Componente gráfico
const EstadisticasChart = ({ data, nivel, isMobile }) => (
  <ResponsiveContainer width="100%" height={isMobile ? Math.min(data.length * 50 + 100, 400) : data.length * 60 + 100}>
    <BarChart 
      data={data} 
      layout="vertical" 
      margin={{ 
        left: isMobile ? 10 : (nivel === "empresa" ? 100 : 40), 
        right: isMobile ? 10 : 40,
        top: 5,
        bottom: 5
      }}
    >
      <XAxis 
        type="number" 
        domain={[0, 100]} 
        tickFormatter={(v) => `${v}%`}
        tick={{ fontSize: isMobile ? 10 : 12 }}
      />
      <YAxis 
        type="category" 
        dataKey={nivel === "mercado" ? "mercado" : "empresa"} 
        width={isMobile ? 60 : (nivel === "empresa" ? 120 : 80)}
        tick={{ fontSize: isMobile ? 10 : 12 }}
      />
      <Tooltip 
        formatter={(v) => `${v}%`}
        contentStyle={{ fontSize: isMobile ? 12 : 14 }}
      />
      <Legend wrapperStyle={{ fontSize: isMobile ? 12 : 14 }} />
      <Bar dataKey="porcentaje_traders" fill="#3498db" name="% Traders" />
      <Bar dataKey="porcentaje_administracion" fill="#e74c3c" name="% Admin" />
    </BarChart>
  </ResponsiveContainer>
);

export default function Estadisticas() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mercadoId, setMercadoId] = useState("");
  const [mercados, setMercados] = useState([]);
  const [nivel, setNivel] = useState("mercado");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function cargarMercados() {
      try {
        setMercados(await analistaService.getMercadosAnalista());
      } catch (err) {
        console.error('Error cargando mercados:', err);
      }
    }
    cargarMercados();
  }, []);

  useEffect(() => {
    cargarEstadisticas();
  }, [nivel, mercadoId]);

  const cargarEstadisticas = async () => {
    setLoading(true);
    setError("");

    try {
      const resultado = nivel === "mercado" 
        ? await analistaService.getEstadisticasMercado()
        : await analistaService.getEstadisticasEmpresa(mercadoId || null);

      if (resultado.message) {
        setError(resultado.message);
        setData([]);
      } else {
        setData(resultado.estadisticas || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err?.response?.data?.message || err?.message || 'Error al cargar estadísticas');
    }

    setLoading(false);
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Analista" />
      <main className="app-main">
        <h2>Estadísticas — Traders vs. Administración</h2>

        <div style={{ 
          marginBottom: 16, 
          display: "flex", 
          flexDirection: isMobile ? 'column' : 'row',
          gap: 12, 
          alignItems: isMobile ? 'stretch' : 'end'
        }}>
          <div style={{ flex: isMobile ? 'auto' : 1 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Nivel</label>
            <select 
              value={nivel} 
              onChange={(e) => setNivel(e.target.value)}
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
            >
              <option value="mercado">Por Mercado</option>
              <option value="empresa">Por Empresa</option>
            </select>
          </div>
          
          {nivel === "empresa" && (
            <div style={{ flex: isMobile ? 'auto' : 1 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Filtrar por Mercado</label>
              <select 
                value={mercadoId} 
                onChange={(e) => setMercadoId(e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
              >
                <option value="">Todos</option>
                {mercados.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <button 
            onClick={cargarEstadisticas} 
            disabled={loading}
            className="btn-block"
            style={{ padding: '8px 16px' }}
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {error && (
          <div className="card" style={{ padding: 12, color: '#721c24', background: '#f8d7da', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {data.length > 0 ? (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>
              {nivel === "mercado" 
                ? "Distribución por Mercado" 
                : (mercadoId ? `Empresas del mercado seleccionado` : "Todas las Empresas")}
            </h3>

            <EstadisticasView data={data} nivel={nivel} isMobile={isMobile} />
            <EstadisticasChart data={data} nivel={nivel} isMobile={isMobile} />
          </div>
        ) : !loading && !error && (
          <div className="card" style={{ padding: 16, color: '#856404', textAlign: 'center' }}>
            Sin posiciones para calcular
          </div>
        )}
      </main>
    </div>
  );
}