import React, { useEffect, useState } from 'react';
import { 
  getEmpresasAdmin, 
  getHistorialPrecio, 
  cargarPrecioManual, 
  cargarPreciosBatch 
} from '../../services/adminService';
import ErrorMessage from '../../components/ErrorMessage';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Sidebar from '../../components/Sidebar';

const Precios = () => {
  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal carga manual
  const [showModal, setShowModal] = useState(false);
  const [precio, setPrecio] = useState('');
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    setError('');
    try {
      const data = await getEmpresasAdmin();
      setEmpresas(data);
    } catch (err) {
      setError('auth fallida');
    }
  };

  const handleEmpresaClick = async (empresa) => {
    setSelectedEmpresa(empresa);
    setError('');
    
    try {
      const data = await getHistorialPrecio(empresa.id);
      setHistorico(data);
    } catch (err) {
      setHistorico([]);
      setError('Error al obtener historial de precios');
    }
  };

  const handleCargaManual = async () => {
    setError('');
    setSuccess('');

    // Validaciones
    if (!precio || parseFloat(precio) <= 0) {
      setError('precio inválido');
      return;
    }

    if (!fecha) {
      setError('formato de fecha inválido');
      return;
    }

    // Validar que la fecha no sea futura
    const fechaSeleccionada = new Date(fecha);
    const ahora = new Date();
    if (fechaSeleccionada > ahora) {
      setError('La fecha no puede ser futura');
      return;
    }

    try {
      await cargarPrecioManual(selectedEmpresa.id, { 
        precio: parseFloat(precio), 
        fecha: fechaSeleccionada.toISOString() 
      });
      
      setSuccess('Precio cargado exitosamente');
      setShowModal(false);
      setPrecio('');
      setFecha('');
      fetchEmpresas();
    } catch (err) {
      setError(err.response?.data?.message || 'auth fallida');
    }
  };

  const handleCargaBatch = async () => {
    setError('');
    setSuccess('');

    try {
      // Cargar precios actuales para todas las empresas que tengan inventario
      const preciosData = empresas
        .filter(e => e.precio_actual)
        .map(e => ({
          id_empresa: e.id,
          precio: e.precio_actual
        }));

      if (preciosData.length === 0) {
        setError('No hay empresas con precios para cargar');
        return;
      }
      
      const result = await cargarPreciosBatch(preciosData);
      setSuccess(`Carga batch completada. Exitosos: ${result.exitosos}, Fallidos: ${result.fallidos}`);
      fetchEmpresas();
    } catch (err) {
      setError(err.response?.data?.message || 'auth fallida');
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleString('es-CR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar rol="Admin" />
      <main style={{ flex: 1, padding: 24 }}>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2>Precios & Carga</h2>
            <button 
              onClick={handleCargaBatch}
              style={{ background: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              Carga Automática (API)
            </button>
          </div>

          {error && <ErrorMessage message={error} />}
          {success && (
            <div style={{ padding: 12, background: '#d4edda', color: '#155724', borderRadius: 4, marginBottom: 16 }}>
              {success}
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: 12, textAlign: 'left', border: '1px solid #ddd' }}>Empresa</th>
                <th style={{ padding: 12, textAlign: 'left', border: '1px solid #ddd' }}>Ticker</th>
                <th style={{ padding: 12, textAlign: 'left', border: '1px solid #ddd' }}>Mercado</th>
                <th style={{ padding: 12, textAlign: 'right', border: '1px solid #ddd' }}>Precio Actual</th>
                <th style={{ padding: 12, textAlign: 'center', border: '1px solid #ddd' }}>Fecha Actualización</th>
                <th style={{ padding: 12, textAlign: 'center', border: '1px solid #ddd' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((empresa) => (
                <tr key={empresa.id} style={{ cursor: 'pointer' }}>
                  <td style={{ padding: 12, border: '1px solid #ddd' }}>{empresa.nombre}</td>
                  <td style={{ padding: 12, border: '1px solid #ddd' }}>{empresa.ticker}</td>
                  <td style={{ padding: 12, border: '1px solid #ddd' }}>{empresa.mercado}</td>
                  <td style={{ padding: 12, border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
                    {empresa.precio_actual ? `$${empresa.precio_actual.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: 12, border: '1px solid #ddd', textAlign: 'center', fontSize: '0.9em' }}>
                    {formatFecha(empresa.fecha_actualizacion)}
                  </td>
                  <td style={{ padding: 12, border: '1px solid #ddd', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleEmpresaClick(empresa)}
                      style={{ marginRight: 8, padding: '6px 12px', cursor: 'pointer' }}
                    >
                      Ver Histórico
                    </button>
                    <button 
                      onClick={() => { 
                        setSelectedEmpresa(empresa); 
                        setPrecio(empresa.precio_actual || '');
                        setShowModal(true); 
                      }}
                      style={{ background: '#007bff', color: 'white', padding: '6px 12px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Cargar Precio
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* GRAFICO DE HISTORIAL */}
          {selectedEmpresa && (
            <div style={{ marginTop: 32, padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
              <h3>Precio vs. Tiempo: {selectedEmpresa.nombre} ({selectedEmpresa.ticker})</h3>
              {historico.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={historico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="fecha" 
                      tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                    />
                    <YAxis 
                      domain={['dataMin - 5', 'dataMax + 5']}
                      tickFormatter={(tick) => `$${tick.toFixed(2)}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Precio']}
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="precio" 
                      stroke="#007bff" 
                      strokeWidth={2}
                      dot={{ fill: '#007bff', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                  No hay historial de precios disponible para esta empresa
                </div>
              )}
            </div>
          )}

          {/* MODAL CARGA MANUAL */}
          {showModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'white', padding: 24, borderRadius: 8, minWidth: 500 }}>
                <h3>Cargar Precio Manual</h3>
                <p style={{ color: '#666', marginBottom: 16 }}>
                  Empresa: <strong>{selectedEmpresa?.nombre}</strong> ({selectedEmpresa?.ticker})
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Precio:</label>
                  <input
                    type="number"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="Ej: 150.50"
                    min="0.01"
                    step="0.01"
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Fecha y Hora:</label>
                  <input
                    type="datetime-local"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    max={new Date().toISOString().slice(0, 16)}
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                  <small style={{ color: '#666', display: 'block', marginTop: 4 }}>
                    Formato: YYYY-MM-DD HH:MM
                  </small>
                </div>

                <div style={{ padding: 12, background: '#fff3cd', color: '#856404', borderRadius: 4, marginBottom: 16, fontSize: '0.9em' }}>
                   Esta acción será auditada. Asegúrese de que el precio y la fecha sean correctos.
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => { setShowModal(false); setPrecio(''); setFecha(''); }}
                    style={{ padding: '8px 16px', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCargaManual}
                    style={{ background: '#007bff', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Confirmar Carga
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Precios;