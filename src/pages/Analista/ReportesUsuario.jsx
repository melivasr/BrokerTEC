import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import * as analistaService from "../../services/analistaService";

const tableCell = { padding: 8, borderBottom: '1px solid #ddd' };

// Componente tabla/tarjetas de historial
const HistorialView = ({ historial, isMobile }) => {
  if (historial.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#856404' }}>
        Sin transacciones para los filtros seleccionados
      </div>
    );
  }

  return isMobile ? (
    <div>
      {historial.map((t) => (
        <div key={t.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
            <div>
              <strong style={{ fontSize: 15 }}>{t.empresa}</strong>
              <div style={{ fontSize: 13, color: '#666' }}>
                {t.ticker} • {t.mercado}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
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
          <th style={{ ...tableCell, textAlign: 'left' }}>Empresa</th>
          <th style={{ ...tableCell, textAlign: 'left' }}>Mercado</th>
          <th style={{ ...tableCell, textAlign: 'center' }}>Tipo</th>
          <th style={{ ...tableCell, textAlign: 'right' }}>Cantidad</th>
          <th style={{ ...tableCell, textAlign: 'right' }}>Precio</th>
          <th style={{ ...tableCell, textAlign: 'right' }}>Monto Total</th>
        </tr>
      </thead>
      <tbody>
        {historial.map((t) => (
          <tr key={t.id}>
            <td style={{ padding: 8 }}>{new Date(t.fecha).toLocaleString()}</td>
            <td style={{ padding: 8 }}>{t.empresa} ({t.ticker})</td>
            <td style={{ padding: 8 }}>{t.mercado}</td>
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

// Componente resumen de estadísticas
const ResumenUsuario = ({ alias, historial, isMobile }) => {
  const totalCompras = historial.filter(t => t.tipo === 'Compra').length;
  const totalVentas = historial.filter(t => t.tipo === 'Venta').length;
  const montoCompras = historial.filter(t => t.tipo === 'Compra').reduce((sum, t) => sum + parseFloat(t.monto_total), 0);
  const montoVentas = historial.filter(t => t.tipo === 'Venta').reduce((sum, t) => sum + parseFloat(t.monto_total), 0);

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>Alias: {alias}</h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', 
        gap: 12,
        padding: 12,
        background: 'var(--button-bg)',
        borderRadius: 8
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>Transacciones</div>
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>{historial.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>Compras</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#28a745' }}>{totalCompras}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>Ventas</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#e67e22' }}>{totalVentas}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>Balance</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: montoCompras - montoVentas >= 0 ? '#28a745' : '#dc3545' }}>
            ${(montoCompras - montoVentas).toLocaleString()}
          </div>
        </div>
      </div>

      {!isMobile && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 12,
          marginTop: 12,
          fontSize: 14
        }}>
          <div>
            <strong>Monto Total Compras:</strong> ${montoCompras.toLocaleString()}
          </div>
          <div>
            <strong>Monto Total Ventas:</strong> ${montoVentas.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ReportesUsuario() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [alias, setAlias] = useState("");
  const [filtros, setFiltros] = useState({ desde: "", hasta: "", tipo: "", ordenar: "" });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      if (filtros.tipo) params.tipo = filtros.tipo;
      if (filtros.ordenar) params.ordenar = filtros.ordenar;

      const data = await analistaService.getHistorialUsuario(alias.trim(), params);
      setResultado(data);
      
    } catch (err) {
      console.error('Error:', err);
      const mensaje = err?.response?.data?.message || err?.message || 'Error al buscar usuario';
      
      if (mensaje === 'alias inexistente' || err?.response?.status === 404) {
        setError('Alias inexistente');
      } else {
        setError(mensaje);
      }
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
        <h2>Reporte por Usuario (alias)</h2>

        <form onSubmit={buscar} className="card" style={{ marginBottom: 16 }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12, 
            marginBottom: 12
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>Alias *</label>
              <input 
                value={alias} 
                onChange={(e) => setAlias(e.target.value)} 
                placeholder="ej: juanp" 
                style={inputStyle}
              />
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
              <label style={{ display: 'block', marginBottom: 4 }}>Tipo</label>
              <select 
                value={filtros.tipo} 
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                style={inputStyle}
              >
                <option value="">Todos</option>
                <option value="Compra">Compra</option>
                <option value="Venta">Venta</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>Ordenar por</label>
              <select 
                value={filtros.ordenar} 
                onChange={(e) => setFiltros({ ...filtros, ordenar: e.target.value })}
                style={inputStyle}
              >
                <option value="">Fecha (desc)</option>
                <option value="empresa">Empresa</option>
                <option value="tipo">Tipo</option>
                <option value="fecha">Fecha</option>
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
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {error && (
          <div className="card" style={{ padding: 12, color: '#721c24', background: '#f8d7da', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {resultado && (
          <>
            <ResumenUsuario alias={resultado.alias} historial={resultado.historial} isMobile={isMobile} />
            
            <div className="card">
              <h4 style={{ marginTop: 0, marginBottom: 16 }}>Historial de Transacciones</h4>
              <HistorialView historial={resultado.historial} isMobile={isMobile} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}