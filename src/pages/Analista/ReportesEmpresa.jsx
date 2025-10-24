import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Sidebar from "../../components/Sidebar";
import * as analistaService from "../../services/analistaService";

// Estilos
const tableCell = { padding: 8, borderBottom: '1px solid #ddd' };

// Componente tabla/tarjetas de transacciones
const TransaccionesView = ({ transacciones, isMobile }) => {
  if (transacciones.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#856404' }}>
        Sin transacciones en el período seleccionado
      </div>
    );
  }

  return isMobile ? (
    <div>
      {transacciones.map((t) => (
        <div key={t.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
            <div>
              <strong style={{ fontSize: 15 }}>{t.alias}</strong>
              <div style={{ fontSize: 13, color: '#666' }}>
                {new Date(t.fecha).toLocaleString('es-CR', { 
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}
              </div>
            </div>
            <span style={{
              padding: '4px 12px',
              borderRadius: 12,
              background: t.tipo === 'Compra' ? '#d4edda' : '#fff3cd',
              color: t.tipo === 'Compra' ? '#155724' : '#856404',
              fontSize: 13,
              fontWeight: 'bold'
            }}>
              {t.tipo}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 12, color: '#666' }}>Cantidad</div>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>{t.cantidad}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666' }}>Precio</div>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>${t.precio}</div>
            </div>
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee' }}>
            <strong>Total:</strong> ${t.monto_total.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ ...tableCell, textAlign: 'left' }}>Fecha–Hora</th>
          <th style={{ ...tableCell, textAlign: 'left' }}>Alias</th>
          <th style={{ ...tableCell, textAlign: 'center' }}>Tipo</th>
          <th style={{ ...tableCell, textAlign: 'right' }}>Cantidad</th>
          <th style={{ ...tableCell, textAlign: 'right' }}>Precio</th>
          <th style={{ ...tableCell, textAlign: 'right' }}>Monto Total</th>
        </tr>
      </thead>
      <tbody>
        {transacciones.map((t) => (
          <tr key={t.id}>
            <td style={{ padding: 8 }}>{new Date(t.fecha).toLocaleString()}</td>
            <td style={{ padding: 8 }}>{t.alias}</td>
            <td style={{ padding: 8, textAlign: 'center' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: 12,
                background: t.tipo === 'Compra' ? '#d4edda' : '#fff3cd',
                color: t.tipo === 'Compra' ? '#155724' : '#856404',
                fontSize: '0.9em'
              }}>
                {t.tipo}
              </span>
            </td>
            <td style={{ padding: 8, textAlign: 'right' }}>{t.cantidad}</td>
            <td style={{ padding: 8, textAlign: 'right' }}>${t.precio}</td>
            <td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>${t.monto_total.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Componente de info de empresa
const InfoEmpresa = ({ empresa, mayorTenedor, tesoreria, isMobile }) => (
  <div className="card" style={{ marginBottom: 16 }}>
    <h3 style={{ marginTop: 0 }}>{empresa.nombre} ({empresa.ticker})</h3>
    
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
      gap: 16,
      marginBottom: 16 
    }}>
      <div>
        <h4 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>Mayor Tenedor</h4>
        {mayorTenedor ? (
          <>
            <p style={{ margin: '4px 0' }}><strong>{mayorTenedor.tenedor}</strong></p>
            <p style={{ margin: '4px 0', color: '#666' }}>{mayorTenedor.total_acciones.toLocaleString()} acciones</p>
          </>
        ) : (
          <p style={{ color: '#999' }}>Cargando...</p>
        )}
      </div>
      
      <div>
        <h4 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>Inventario Tesorería</h4>
        {tesoreria ? (
          <>
            <p style={{ margin: '4px 0' }}>
              <strong>{tesoreria.acciones_disponibles.toLocaleString()}</strong> disponibles
            </p>
            <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>
              {tesoreria.acciones_en_circulacion.toLocaleString()} en circulación
            </p>
            <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>
              Total: {tesoreria.acciones_totales.toLocaleString()}
            </p>
          </>
        ) : (
          <p style={{ color: '#999' }}>Cargando...</p>
        )}
      </div>
    </div>

    {tesoreria && (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', 
        gap: 12,
        padding: 12,
        background: 'var(--button-bg)',
        borderRadius: 8
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>Precio Actual</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#28a745' }}>${tesoreria.precio_actual}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>% Tesorería</div>
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>{tesoreria.porcentaje_tesoreria}%</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>Capitalización</div>
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>
            ${(tesoreria.precio_actual * tesoreria.acciones_totales).toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>Valor Circulación</div>
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>
            ${(tesoreria.precio_actual * tesoreria.acciones_en_circulacion).toLocaleString()}
          </div>
        </div>
      </div>
    )}
  </div>
);

// Componente de gráfico
const GraficoHistorico = ({ data, isMobile }) => {
  if (data.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#856404' }}>
        Sin datos históricos de precio para el período seleccionado
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
      <LineChart data={data} margin={{ top: 5, right: isMobile ? 5 : 20, left: isMobile ? -10 : 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="fecha" 
          tickFormatter={(v) => {
            const date = new Date(v);
            return isMobile 
              ? date.toLocaleDateString('es-CR', { month: 'numeric', day: 'numeric' })
              : date.toLocaleDateString('es-CR', { month: 'short', day: 'numeric' });
          }}
          tick={{ fontSize: isMobile ? 10 : 12 }}
          angle={isMobile ? -45 : 0}
          textAnchor={isMobile ? 'end' : 'middle'}
          height={isMobile ? 60 : 30}
        />
        <YAxis 
          tickFormatter={(v) => `$${v.toFixed(isMobile ? 0 : 2)}`}
          tick={{ fontSize: isMobile ? 10 : 12 }}
          width={isMobile ? 45 : 60}
        />
        <Tooltip 
          formatter={(v) => [`$${v.toFixed(2)}`, 'Precio']}
          labelFormatter={(l) => new Date(l).toLocaleDateString('es-CR')}
          contentStyle={{  backgroundColor: "var(--card-bg)",fontSize: isMobile ? 12 : 14 }}
        />
        <Line 
          type="monotone" 
          dataKey="precio" 
          stroke="#2ecc71" 
          strokeWidth={2}
          dot={!isMobile ? { fill: '#2ecc71', r: 4 } : false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default function ReportesEmpresa() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function cargarInicial() {
      try {
        const merc = await analistaService.getMercados();
        setMercados(merc);
        
        const emp = await analistaService.getEmpresasPorMercado();
        setEmpresas(emp);
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
      }
    }
    cargarInicial();
  }, []);

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

    if (filtros.desde && filtros.hasta) {
      const inicio = new Date(filtros.desde);
      const fin = new Date(filtros.hasta);
      if (inicio > fin) {
        setError("Rango de fechas inválido");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const params = {};
      if (filtros.desde) params.fecha_inicio = filtros.desde;
      if (filtros.hasta) params.fecha_fin = filtros.hasta;

      const empresaEncontrada = empresas.find(e => e.id === empresaId);
      setEmpresaSeleccionada(empresaEncontrada);

      const [trans, tenedor, inv, hist] = await Promise.all([
        analistaService.getTransaccionesEmpresa(empresaId, params),
        analistaService.getMayorTenedor(empresaId),
        analistaService.getInventarioTesoreria(empresaId),
        analistaService.getHistorialPrecio(empresaId, params)
      ]);

      setTransacciones(trans);
      setMayorTenedor(tenedor);
      setTesoreria(inv);
      setHistoricoPrecio(hist);

    } catch (err) {
      console.error('Error:', err);
      setError(err?.response?.data?.message || err?.message || 'Error al cargar datos');
    }

    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: 8,
    border: '1px solid #ddd',
    borderRadius: 4,
    boxSizing: 'border-box',
    fontSize: isMobile ? '16px' : '14px'
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Analista" />
      <main className="app-main">
        <h2>Reporte por Empresa</h2>

        <form onSubmit={aplicar} className="card" style={{ marginBottom: 16 }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12, 
            marginBottom: 12
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>Empresa *</label>
              <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} style={inputStyle}>
                <option value="">Selecciona...</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nombre} ({emp.ticker})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>Desde</label>
              <input 
                type="date" 
                value={filtros.desde} 
                onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} 
                style={inputStyle}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>Hasta</label>
              <input 
                type="date" 
                value={filtros.hasta} 
                onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} 
                style={inputStyle}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>Mercado</label>
              <select 
                value={filtros.mercadoId} 
                onChange={(e) => setFiltros({ ...filtros, mercadoId: e.target.value })}
                style={inputStyle}
              >
                <option value="">Todos</option>
                {mercados.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-block"
            style={{ 
              background: loading ? '#ccc' : '#007bff', 
              color: 'white',
              padding: '10px 20px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Cargando...' : 'Generar Reporte'}
          </button>
        </form>

        {error && (
          <div className="card" style={{ padding: 12, color: '#721c24', background: '#f8d7da', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {empresaSeleccionada && (
          <>
            <InfoEmpresa 
              empresa={empresaSeleccionada} 
              mayorTenedor={mayorTenedor} 
              tesoreria={tesoreria}
              isMobile={isMobile}
            />

            <div className="card" style={{ marginBottom: 16 }}>
              <h4 style={{ marginTop: 0 }}>Precio vs. Tiempo</h4>
              <GraficoHistorico data={historicoPrecio} isMobile={isMobile} />
            </div>

            <div className="card">
              <h4 style={{ marginTop: 0 }}>Historial de Transacciones</h4>
              <TransaccionesView transacciones={transacciones} isMobile={isMobile} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}