import React, { useEffect, useState } from 'react';
import { createMercado, updateMercado, deleteMercado,
  getEmpresasAdmin, createEmpresaAdmin, updateEmpresa, updateInventario, delistarEmpresa, getHistorialPrecio
} from '../../services/adminService';
import {getMercados} from '../../services/analistaService';
import ErrorMessage from '../../components/ErrorMessage';
import Sidebar from '../../components/Sidebar';

// Helpers
const formatFechaCR = (fecha) =>
  new Date(fecha).toLocaleString('es-CR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });

const compressConsecutiveEquals = (rows) => {
  const out = [];
  for (const r of rows) {
    if (!out.length || out[out.length - 1].precio !== r.precio) out.push(r);
  }
  return out;
};

// Estilos compartidos 
const tableCell = { padding: 12, border: '1px solid #ddd' };
const modalInput = (isMobile) => ({ 
  width: '100%', 
  padding: 8, 
  border: '1px solid #ddd', 
  borderRadius: 4, 
  boxSizing: 'border-box',
  fontSize: isMobile ? '16px' : '14px'
});

// Componente de vista de mercados
const MercadosView = ({ mercados, isMobile, onEdit, onDelete }) => (
  isMobile ? (
    <div>
      {mercados.map((m) => (
        <div key={m.id} className="card" style={{ marginBottom: 12 }}>
          <h4 style={{ marginTop: 0 }}>{m.nombre}</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onEdit(m)} className="btn-block">Editar</button>
            <button onClick={() => onDelete(m)} className="btn-block" style={{ background: '#dc3545', color: 'white' }}>
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ ...tableCell, textAlign: 'left' }}>Nombre</th>
          <th style={{ ...tableCell, textAlign: 'center', width: 200 }}>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {mercados.map((m) => (
          <tr key={m.id}>
            <td style={tableCell}>{m.nombre}</td>
            <td style={{ ...tableCell, textAlign: 'center' }}>
              <button onClick={() => onEdit(m)} style={{ marginRight: 8 }}>Editar</button>
              <button onClick={() => onDelete(m)} style={{ background: '#dc3545', color: 'white', padding: '6px 12px', border: 'none', borderRadius: 4 }}>
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
);

// Componente de vista de empresas
const EmpresasView = ({ empresas, preciosHistoricos, isMobile, onEdit, onDelist, onVerPrecios }) => (
  isMobile ? (
    <div>
      {empresas.map((e) => (
        <div key={e.id} className="card" style={{ marginBottom: 16 }}>
          <h4 style={{ marginTop: 0, marginBottom: 8 }}>{e.nombre} ({e.ticker})</h4>
          <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Mercado:</strong> {e.mercado}</p>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            <strong>Precio:</strong> {e.precio_actual ? `$${e.precio_actual.toFixed(2)}` : '-'}
          </p>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            <strong>Acciones:</strong> {e.acciones_totales?.toLocaleString() || '-'}
          </p>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            <strong>Cap.:</strong> {e.capitalizacion ? `$${e.capitalizacion.toLocaleString()}` : '-'}
          </p>
          
          {preciosHistoricos[e.id]?.length > 0 && (
            <button onClick={() => onVerPrecios(e)} className="btn-block" style={{ marginTop: 8 }}>
              Ver Precios ({preciosHistoricos[e.id].length})
            </button>
          )}
          
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => onEdit(e)} className="btn-block">Editar</button>
            <button onClick={() => onDelist(e)} className="btn-block" style={{ background: '#dc3545', color: 'white' }}>
              Delistar
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ ...tableCell, textAlign: 'left' }}>Nombre</th>
          <th style={{ ...tableCell, textAlign: 'left' }}>Ticker</th>
          <th style={{ ...tableCell, textAlign: 'left' }}>Mercado</th>
          <th style={{ ...tableCell, textAlign: 'right' }}>Precio</th>
          <th style={{ ...tableCell, textAlign: 'center' }}>Histórico</th>
          <th style={{ ...tableCell, textAlign: 'right' }}>Acciones</th>
          <th style={{ ...tableCell, textAlign: 'right' }}>Cap.</th>
          <th style={{ ...tableCell, textAlign: 'center', width: 200 }}>Acciones</th>
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
            <td style={{ ...tableCell, textAlign: 'center' }}>
              {preciosHistoricos[e.id]?.length > 0 ? (
                <button onClick={() => onVerPrecios(e)} style={{ padding: '4px 12px', fontSize: '0.9em' }}>
                  Ver ({preciosHistoricos[e.id].length})
                </button>
              ) : (
                <span style={{ color: '#999', fontSize: '0.9em' }}>-</span>
              )}
            </td>
            <td style={{ ...tableCell, textAlign: 'right' }}>{e.acciones_totales?.toLocaleString() || '-'}</td>
            <td style={{ ...tableCell, textAlign: 'right' }}>{e.capitalizacion ? `$${e.capitalizacion.toLocaleString()}` : '-'}</td>
            <td style={{ ...tableCell, textAlign: 'center' }}>
              <button onClick={() => onEdit(e)} style={{ marginRight: 8 }}>Editar</button>
              <button onClick={() => onDelist(e)} style={{ background: '#dc3545', color: 'white', padding: '6px 12px', border: 'none', borderRadius: 4 }}>
                Delistar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
);

const Catalogos = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mercados, setMercados] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Mercado modal
  const [showMercadoModal, setShowMercadoModal] = useState(false);
  const [editingMercado, setEditingMercado] = useState(null);
  const [mercadoNombre, setMercadoNombre] = useState('');

  // Empresa modal
  const [showEmpresaModal, setShowEmpresaModal] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [empresaForm, setEmpresaForm] = useState({nombre: '', ticker: '', id_mercado: '', precio: '', acciones_totales: ''});

  // Delistar modal
  const [showDelistModal, setShowDelistModal] = useState(false);
  const [empresaToDelist, setEmpresaToDelist] = useState(null);
  const [justificacion, setJustificacion] = useState('');
  const [precioLiquidacion, setPrecioLiquidacion] = useState('');

  // Precios históricos
  const [preciosHistoricos, setPreciosHistoricos] = useState({});
  const [showPreciosModal, setShowPreciosModal] = useState(false);
  const [selectedEmpresaPrecios, setSelectedEmpresaPrecios] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [mercadosData, empresasData] = await Promise.all([getMercados(), getEmpresasAdmin()]);
      setMercados(mercadosData);
      setEmpresas(empresasData);
      
      const historicos = {};
      for (const empresa of empresasData) {
        if (empresa.precio_actual) {
          try {
            const historial = await getHistorialPrecio(empresa.id);
            historicos[empresa.id] = compressConsecutiveEquals(historial).reverse();
          } catch { historicos[empresa.id] = []; }
        }
      }
      setPreciosHistoricos(historicos);
    } catch { setError('Error cargando datos'); }
  };

  const handleSaveMercado = async () => {
    setError(''); setSuccess('');
    if (!mercadoNombre.trim()) { setError('El nombre del mercado es requerido'); return; }
    try {
      editingMercado 
        ? await updateMercado(editingMercado.id, { nombre: mercadoNombre })
        : await createMercado({ nombre: mercadoNombre });
      setSuccess(`Mercado ${editingMercado ? 'actualizado' : 'creado'} exitosamente`);
      setShowMercadoModal(false);
      fetchData();
    } catch (err) { setError(err.message || 'Error al guardar mercado'); }
  };

  const handleDeleteMercado = async (mercado) => {
    if (!window.confirm(`¿Eliminar "${mercado.nombre}"?\n\nSolo si no tiene empresas.`)) return;
    setError(''); setSuccess('');
    try {
      await deleteMercado(mercado.id);
      setSuccess('Mercado eliminado');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message?.includes('empresas asociadas') 
        ? 'No se puede eliminar: tiene empresas asociadas'
        : err.response?.data?.message || 'Error');
    }
  };

  const handleSaveEmpresa = async () => {
    setError(''); setSuccess('');
    if (!empresaForm.nombre || !empresaForm.ticker || !empresaForm.id_mercado) { 
      setError('Faltan datos'); return; 
    }
    try {
      if (editingEmpresa) {
        await updateEmpresa(editingEmpresa.id, {
          nombre: empresaForm.nombre, 
          ticker: empresaForm.ticker, 
          id_mercado: empresaForm.id_mercado
        });
        // Si cambió el stock, actualizar inventario
        if (empresaForm.acciones_totales && parseInt(empresaForm.acciones_totales) !== editingEmpresa.acciones_totales) {
          await updateInventario(editingEmpresa.id, parseInt(empresaForm.acciones_totales));
        }
      } else {
        await createEmpresaAdmin({
          ...empresaForm, 
          precio: empresaForm.precio ? parseFloat(empresaForm.precio) : null, 
          acciones_totales: empresaForm.acciones_totales ? parseInt(empresaForm.acciones_totales) : null
        });
      }
      setSuccess(`Empresa ${editingEmpresa ? 'actualizada' : 'creada'}`);
      setShowEmpresaModal(false);
      fetchData();
    } catch (err) { setError(err.message || 'Error'); }
  };

  const handleDelistEmpresa = async () => {
    setError(''); setSuccess('');
    if (!justificacion.trim()) { setError('Justificación requerida'); return; }
    try {
      const result = await delistarEmpresa(empresaToDelist.id, justificacion, precioLiquidacion ? parseFloat(precioLiquidacion) : null);
      setSuccess(result.posiciones_liquidadas > 0 ? `Deslistada. ${result.posiciones_liquidadas} posición(es) liquidada(s)` : 'Deslistada');
      setShowDelistModal(false);
      setJustificacion(''); setPrecioLiquidacion('');
      fetchData();
    } catch (err) { setError(err.message || 'Error'); }
  };

  const inputStyle = modalInput(isMobile);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar rol="Admin" />
      <main className="app-main">
        <h2>Catálogos - Mercados y Empresas</h2>
        
        {error && <ErrorMessage message={error} />}
        {success && <div className="card" style={{ padding: 12, background: '#d4edda', color: '#155724', marginBottom: 16 }}>{success}</div>}

        {/* MERCADOS */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Mercados</h3>
            <button onClick={() => { setEditingMercado(null); setMercadoNombre(''); setShowMercadoModal(true); }} className="btn-block">
              Crear Mercado
            </button>
          </div>
          <MercadosView mercados={mercados} isMobile={isMobile}
            onEdit={(m) => { setEditingMercado(m); setMercadoNombre(m.nombre); setShowMercadoModal(true); }}
            onDelete={handleDeleteMercado} />
        </div>

        {/* EMPRESAS */}
        <div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Empresas</h3>
            <button onClick={() => { setEditingEmpresa(null); setEmpresaForm({nombre: '', ticker: '', id_mercado: '', precio: '', acciones_totales: ''}); setShowEmpresaModal(true); }} className="btn-block">
              Crear Empresa
            </button>
          </div>
          <EmpresasView empresas={empresas} preciosHistoricos={preciosHistoricos} isMobile={isMobile}
            onEdit={(e) => { setEditingEmpresa(e); setEmpresaForm({nombre: e.nombre, ticker: e.ticker, id_mercado: e.id_mercado, precio: e.precio_actual || '', acciones_totales: e.acciones_totales || ''}); setShowEmpresaModal(true); }}
            onDelist={(e) => { setEmpresaToDelist(e); setShowDelistModal(true); }}
            onVerPrecios={(e) => { setSelectedEmpresaPrecios(e); setShowPreciosModal(true); }} />
        </div>

        {/* MODAL MERCADO */}
        {showMercadoModal && (
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 12 : 24 }}>
            <div className="card" style={{ minWidth: isMobile ? '100%' : 400, maxWidth: isMobile ? '100%' : 600 }}>
              <h3>{editingMercado ? 'Editar' : 'Crear'} Mercado</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>Nombre:</label>
                <input type="text" value={mercadoNombre} onChange={(e) => setMercadoNombre(e.target.value)} placeholder="NASDAQ" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
                <button onClick={() => setShowMercadoModal(false)} className="btn-block">Cancelar</button>
                <button onClick={handleSaveMercado} style={{ background: '#007bff', color: 'white' }} className="btn-block">Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EMPRESA */}
        {showEmpresaModal && (
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 12 : 24 }}>
            <div className="card" style={{ minWidth: isMobile ? '100%' : 500, maxWidth: isMobile ? '100%' : 600, maxHeight: isMobile ? 'calc(100vh - 24px)' : '90vh', overflow: 'auto' }}>
              <h3>{editingEmpresa ? 'Editar' : 'Crear'} Empresa</h3>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Nombre:</label>
                <input type="text" value={empresaForm.nombre} onChange={(e) => setEmpresaForm({ ...empresaForm, nombre: e.target.value })} placeholder="Apple Inc." style={inputStyle} />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Ticker:</label>
                <input type="text" value={empresaForm.ticker} onChange={(e) => setEmpresaForm({ ...empresaForm, ticker: e.target.value.toUpperCase() })} placeholder="AAPL" maxLength={6} style={inputStyle} />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Mercado:</label>
                <select value={empresaForm.id_mercado} onChange={(e) => setEmpresaForm({ ...empresaForm, id_mercado: e.target.value })} style={inputStyle}>
                  <option value="">Seleccione</option>
                  {mercados.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              
              {!editingEmpresa ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Precio Inicial:</label>
                    <input type="number" value={empresaForm.precio} onChange={(e) => setEmpresaForm({ ...empresaForm, precio: e.target.value })} placeholder="150.00" step="0.01" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Acciones Totales:</label>
                    <input type="number" value={empresaForm.acciones_totales} onChange={(e) => setEmpresaForm({ ...empresaForm, acciones_totales: e.target.value })} placeholder="1000" style={inputStyle} />
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Acciones Totales:</label>
                  <input type="number" value={empresaForm.acciones_totales} onChange={(e) => setEmpresaForm({ ...empresaForm, acciones_totales: e.target.value })} placeholder="1000" style={inputStyle} />
                  <small style={{ color: '#666', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                    Actual: {editingEmpresa?.acciones_totales?.toLocaleString() || 0}
                  </small>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row', marginTop: 24 }}>
                <button onClick={() => setShowEmpresaModal(false)} className="btn-block">Cancelar</button>
                <button onClick={handleSaveEmpresa} style={{ background: '#007bff', color: 'white' }} className="btn-block">Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DELISTAR */}
        {showDelistModal && (
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 12 : 24 }}>
            <div className="card" style={{ minWidth: isMobile ? '100%' : 500, maxWidth: isMobile ? '100%' : 600 }}>
              <h3 style={{ color: '#dc3545' }}>Delistar Empresa</h3>
              <p>¿Seguro de delistar <strong>{empresaToDelist?.nombre}</strong>?
                {empresaToDelist?.acciones_disponibles < empresaToDelist?.acciones_totales && (
                  <span style={{ color: '#dc3545', display: 'block', marginTop: 8 }}> Tiene posiciones activas que serán liquidadas</span>
                )}
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Justificación *</label>
                <textarea value={justificacion} onChange={(e) => setJustificacion(e.target.value)} placeholder="Explique el motivo del delist..." rows={4} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Precio Liquidación (opcional)</label>
                <input type="number" value={precioLiquidacion} onChange={(e) => setPrecioLiquidacion(e.target.value)} step="0.1" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
                <button onClick={() => { setShowDelistModal(false); setJustificacion(''); setPrecioLiquidacion(''); }} className="btn-block">Cancelar</button>
                <button onClick={handleDelistEmpresa} style={{ background: '#dc3545', color: 'white' }} className="btn-block">Confirmar Delist</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL PRECIOS */}
        {showPreciosModal && selectedEmpresaPrecios && (
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 12 : 24 }}>
            <div className="card" style={{ minWidth: isMobile ? '100%' : 500, maxWidth: isMobile ? '100%' : 600, maxHeight: '90vh', overflow: 'auto' }}>
              <h3>Precios: {selectedEmpresaPrecios.nombre}</h3>
              <p>Actual: <strong>${selectedEmpresaPrecios.precio_actual?.toFixed(2)}</strong></p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '13px' : '14px' }}>
                <thead>
                  <tr>
                    <th style={{ ...tableCell, textAlign: 'left' }}>Fecha</th>
                    <th style={{ ...tableCell, textAlign: 'right' }}>Precio</th>
                    <th style={{ ...tableCell, textAlign: 'right' }}>Cambio</th>
                  </tr>
                </thead>
                <tbody>
                  {preciosHistoricos[selectedEmpresaPrecios.id]?.map((h, i, arr) => {
                    const prev = arr[i + 1];
                    const cambio = prev ? (h.precio - prev.precio) : 0;
                    const pct = prev ? ((cambio / prev.precio) * 100) : 0;
                    return (
                      <tr key={i}>
                        <td style={tableCell}>{formatFechaCR(h.fecha)}</td>
                        <td style={{ ...tableCell, textAlign: 'right' }}>${h.precio.toFixed(2)}</td>
                        <td style={{ ...tableCell, textAlign: 'right', color: cambio >= 0 ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                          {cambio >= 0 ? '+' : ''}{cambio.toFixed(2)} ({pct.toFixed(1)}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button onClick={() => { setShowPreciosModal(false); setSelectedEmpresaPrecios(null); }} className="btn-block" style={{ marginTop: 16 }}>Cerrar</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Catalogos;