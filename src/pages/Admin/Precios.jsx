import React, { useEffect, useState } from 'react';
import { getEmpresasAdmin, getHistorialPrecio, cargarPrecioManual, cargarPreciosBatch } from '../../services/adminService';
import ErrorMessage from '../../components/ErrorMessage';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Sidebar from '../../components/Sidebar';

const formatFecha = (fecha) => fecha ? new Date(fecha).toLocaleString('es-CR', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
}) : '-';

const formatFechaCorta = (fecha, isMobile) => {
  const date = new Date(fecha);
  return isMobile 
    ? date.toLocaleDateString('es-CR', { month: 'numeric', day: 'numeric' })
    : date.toLocaleDateString('es-CR', { month: 'short', day: 'numeric' });
};

// Estilos
const tableCell = { padding: 12, border: '1px solid #ddd' };
const modalInput = (isMobile) => ({ 
  width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box',
  fontSize: isMobile ? '16px' : '14px'
});

// Componente tabla de empresas
const EmpresasTable = ({ empresas, isMobile, onVerGrafico, onCargarPrecio }) => (
  isMobile ? (
    <div style={{ marginBottom: 32 }}>
      {empresas.map((e) => (
        <div key={e.id} className="card" style={{ marginBottom: 16 }}>
          <h4 style={{ marginTop: 0, marginBottom: 8 }}>{e.nombre} ({e.ticker})</h4>
          <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Mercado:</strong> {e.mercado}</p>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            <strong>Precio:</strong>{' '}
            <span style={{ fontSize: 18, fontWeight: 'bold', color: e.precio_actual ? '#28a745' : '#999' }}>
              {e.precio_actual ? `$${e.precio_actual.toFixed(2)}` : '-'}
            </span>
          </p>
          <p style={{ margin: '4px 0', fontSize: 13, color: '#666' }}>
            <strong>Actualizado:</strong> {formatFecha(e.fecha_actualizacion)}
          </p>
          <div style={{ display: 'flex', gap: 8, flexDirection: 'column', marginTop: 12 }}>
            <button onClick={() => onVerGrafico(e)} className="btn-block">Ver Gráfico</button>
            <button onClick={() => onCargarPrecio(e)} className="btn-block" style={{ background: '#007bff', color: 'white' }}>
              Cargar Precio
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
      <thead>
        <tr>
          <th style={{ ...tableCell, textAlign: 'left' }}>Empresa</th>
          <th style={{ ...tableCell, textAlign: 'left' }}>Ticker</th>
          <th style={{ ...tableCell, textAlign: 'left' }}>Mercado</th>
          <th style={{ ...tableCell, textAlign: 'right' }}>Precio</th>
          <th style={{ ...tableCell, textAlign: 'center' }}>Actualización</th>
          <th style={{ ...tableCell, textAlign: 'center', width: 250 }}>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {empresas.map((e) => (
          <tr key={e.id}>
            <td style={tableCell}>{e.nombre}</td>
            <td style={tableCell}>{e.ticker}</td>
            <td style={tableCell}>{e.mercado}</td>
            <td style={{ ...tableCell, textAlign: 'right', fontWeight: 'bold' }}>
              {e.precio_actual ? `$${e.precio_actual.toFixed(2)}` : '-'}
            </td>
            <td style={{ ...tableCell, textAlign: 'center', fontSize: '0.9em' }}>{formatFecha(e.fecha_actualizacion)}</td>
            <td style={{ ...tableCell, textAlign: 'center' }}>
              <button onClick={() => onVerGrafico(e)} style={{ marginRight: 8, padding: '6px 12px' }}>Ver Gráfico</button>
              <button onClick={() => onCargarPrecio(e)} style={{ background: '#007bff', color: 'white', padding: '6px 12px', border: 'none', borderRadius: 4 }}>
                Cargar Precio
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
);

// Componente gráfico
const GraficoHistorial = ({ empresa, historico, isMobile }) => (
  <div className="card" style={{ marginTop: 32 }}>
    <h3 style={{ marginTop: 0 }}>Precio vs. Tiempo: {empresa.nombre} ({empresa.ticker})</h3>
    {historico.length > 0 ? (
      <div style={{ width: '100%', marginTop: 16 }}>
        <ResponsiveContainer width="100%" height={isMobile ? 280 : 400}>
          <LineChart data={historico} margin={{ top: 5, right: isMobile ? 5 : 20, left: isMobile ? -20 : 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="fecha" 
              tickFormatter={(v) => formatFechaCorta(v, isMobile)}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
            />
            <YAxis 
              domain={['dataMin - 5', 'dataMax + 5']}
              tickFormatter={(v) => `$${v.toFixed(isMobile ? 0 : 2)}`}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 50 : 60}
            />
            <Tooltip 
              formatter={(v) => [`$${v.toFixed(2)}`, 'Precio']}
              labelFormatter={(l) => new Date(l).toLocaleString('es-CR')}
              contentStyle={{  backgroundColor: "var(--card-bg)",fontSize: isMobile ? 12 : 14 }}
            />
            <Line 
              type="monotone" 
              dataKey="precio" 
              stroke="#007bff" 
              strokeWidth={2}
              dot={!isMobile ? { fill: '#007bff', r: 4 } : false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <div className="card" style={{ padding: 40, textAlign: 'center', color: '#666', marginTop: 16 }}>
        No hay historial de precios disponible
      </div>
    )}
  </div>
);

const Precios = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [precio, setPrecio] = useState('');
  const [fecha, setFecha] = useState('');
  
  const fetchTops = async () => {
    // refresca el listado de empresas
    await fetchEmpresas();

    // si hay empresa seleccionada, refresca también su histórico
    if (selectedEmpresa) {
      try {
        const h = await getHistorialPrecio(selectedEmpresa.id);
        setHistorico(h);
      } catch {
        // si falla, deja el histórico como está o limpia
        setHistorico([]);
      }
    }};
    
  useEffect(() => {
      let alive = true;
  
      const refetch = async () => {
        if (!alive) return;
        await fetchTops();
      };
      // refresco periódico 
      const id = setInterval(refetch, 8000);
      // refrescar cuando la pestaña vuelve a estar visible
      const onVisibility = () => {
        if (document.visibilityState === 'visible') refetch();
      };
      document.addEventListener('visibilitychange', onVisibility);
      const onFocus = () => refetch();
      window.addEventListener('focus', onFocus);
      return () => {
        alive = false;
        clearInterval(id);
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('focus', onFocus);
      };
    }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { fetchEmpresas(); }, []);

  const fetchEmpresas = async () => {
    setError('');
    try {
      setEmpresas(await getEmpresasAdmin());
    } catch { setError('auth fallida'); }
  };

  const handleEmpresaClick = async (empresa) => {
    setSelectedEmpresa(empresa);
    setError('');
    try {
      setHistorico(await getHistorialPrecio(empresa.id));
    } catch {
      setHistorico([]);
      setError('Error al obtener historial');
    }
  };

  const handleCargaManual = async () => {
    setError(''); setSuccess('');
    if (!precio || parseFloat(precio) <= 0) { setError('precio inválido'); return; }
    if (!fecha) { setError('fecha inválida'); return; }
    
    const fechaSeleccionada = new Date(fecha);
    if (fechaSeleccionada > new Date()) { setError('Fecha no puede ser futura'); return; }

    try {
      await cargarPrecioManual(selectedEmpresa.id, { precio: parseFloat(precio), fecha: fechaSeleccionada.toISOString() });
      setSuccess('Precio cargado');
      setShowModal(false);
      setPrecio(''); setFecha('');
      fetchEmpresas();
      if (selectedEmpresa) handleEmpresaClick(selectedEmpresa);
    } catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  const handleCargaBatch = async () => {
    setError(''); setSuccess('');
    try {
      const preciosData = empresas.filter(e => e.precio_actual).map(e => ({ id_empresa: e.id, precio: e.precio_actual }));
      if (preciosData.length === 0) { setError('No hay precios para cargar'); return; }
      const result = await cargarPreciosBatch(preciosData);
      setSuccess(`Batch: ${result.exitosos} ok, ${result.fallidos} fallidos`);
      fetchEmpresas();
    } catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  const inputStyle = modalInput(isMobile);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar rol="Admin" />
      <main className="app-main">
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: 24, gap: 12 }}>
          <h2 style={{ margin: 0 }}>Precios & Carga</h2>
          <button onClick={handleCargaBatch} style={{ background: '#28a745', color: 'white' }} className="btn-block">
            {isMobile ? 'Carga API' : 'Carga Automática (API)'}
          </button>
        </div>

        {error && <ErrorMessage message={error} />}
        {success && <div className="card" style={{ padding: 12, color: '#155724', marginBottom: 16 }}>{success}</div>}

        <EmpresasTable 
          empresas={empresas}
          isMobile={isMobile}
          onVerGrafico={handleEmpresaClick}
          onCargarPrecio={(e) => { setSelectedEmpresa(e); setPrecio(e.precio_actual || ''); setFecha(''); setShowModal(true); }}
        />

        {selectedEmpresa && <GraficoHistorial empresa={selectedEmpresa} historico={historico} isMobile={isMobile} />}

        {/* MODAL */}
        {showModal && (
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 12 : 24 }}>
            <div className="card" style={{ minWidth: isMobile ? '100%' : 500, maxWidth: isMobile ? '100%' : 600 }}>
              <h3>Cargar Precio Manual</h3>
              <p style={{ color: '#666', marginBottom: 16 }}>
                <strong>{selectedEmpresa?.nombre}</strong> ({selectedEmpresa?.ticker})
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>Precio:</label>
                <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="150.50" min="0.01" step="0.01" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>Fecha y Hora:</label>
                <input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} max={new Date().toISOString().slice(0, 16)} style={inputStyle} step="1" />
                <small style={{ color: '#666', display: 'block', marginTop: 4 }}>Formato: YYYY-MM-DD HH:MM:SS</small>
              </div>
              <div className="card" style={{ padding: 12, color: '#856404', marginBottom: 16, fontSize: isMobile ? '0.85em' : '0.9em' }}>
                <strong>Nota:</strong> Acción auditada. Precio se guarda en historial.
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
                <button onClick={() => { setShowModal(false); setPrecio(''); setFecha(''); }} className="btn-block">Cancelar</button>
                <button onClick={handleCargaManual} style={{ background: '#007bff', color: 'white' }} className="btn-block">Confirmar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Precios;