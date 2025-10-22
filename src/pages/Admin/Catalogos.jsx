import React, { useEffect, useState } from 'react';
import {getMercados, createMercado, updateMercado, deleteMercado,
  getEmpresasAdmin, createEmpresaAdmin, updateEmpresa, delistarEmpresa
} from '../../services/adminService';
import ErrorMessage from '../../components/ErrorMessage';
import Sidebar from '../../components/Sidebar';

const Catalogos = () => {
  const [mercados, setMercados] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para modales de Mercado
  const [showMercadoModal, setShowMercadoModal] = useState(false);
  const [editingMercado, setEditingMercado] = useState(null);
  const [mercadoNombre, setMercadoNombre] = useState('');

  // Estados para modales de Empresa
  const [showEmpresaModal, setShowEmpresaModal] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [empresaForm, setEmpresaForm] = useState({
    nombre: '', ticker: '', id_mercado: '', precio: '',
    acciones_totales: ''});

  // Estados para delistar
  const [showDelistModal, setShowDelistModal] = useState(false);
  const [empresaToDelist, setEmpresaToDelist] = useState(null);
  const [justificacion, setJustificacion] = useState('');
  const [precioLiquidacion, setPrecioLiquidacion] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mercadosData, empresasData] = await Promise.all([
        getMercados(),
        getEmpresasAdmin()
      ]);
      setMercados(mercadosData);
      setEmpresas(empresasData);
    } catch (err) {
      setError('Error cargando datos');
    }
  };

  // MERCADOS
  const handleCreateMercado = () => {
    setEditingMercado(null);
    setMercadoNombre('');
    setShowMercadoModal(true);
  };

  const handleEditMercado = (mercado) => {
    setEditingMercado(mercado);
    setMercadoNombre(mercado.nombre);
    setShowMercadoModal(true);
  };

  const handleSaveMercado = async () => {
    setError('');
    setSuccess('');
    
    if (!mercadoNombre.trim()) {
      setError('El nombre del mercado es requerido');
      return;
    }

    try {
      if (editingMercado) {
        await updateMercado(editingMercado.id, { nombre: mercadoNombre });
        setSuccess('Mercado actualizado exitosamente');
      } else {
        await createMercado({ nombre: mercadoNombre });
        setSuccess('Mercado creado exitosamente');
      }
      setShowMercadoModal(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Error al guardar mercado');
    }
  };

  const handleDeleteMercado = async (mercado) => {
    if (!window.confirm(`¿Está seguro de eliminar el mercado "${mercado.nombre}"?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await deleteMercado(mercado.id);
      setSuccess('Mercado eliminado exitosamente');
      fetchData();
    } catch (err) {
      if (err.message.includes('empresas asociadas')) {
        setError('No se puede eliminar un mercado con empresas asociadas');
      } else {
        setError(err.message || 'Error al eliminar mercado');
      }
    }
  };

  // EMPRESAS

  const handleCreateEmpresa = () => {
    setEditingEmpresa(null);
    setEmpresaForm({nombre: '', ticker: '', id_mercado: '', precio: '', acciones_totales: ''});
    setShowEmpresaModal(true);
  };

  const handleEditEmpresa = (empresa) => {
    setEditingEmpresa(empresa);
    setEmpresaForm({
      nombre: empresa.nombre,
      ticker: empresa.ticker,
      id_mercado: empresa.id_mercado,
      precio: empresa.precio_actual || '',
      acciones_totales: empresa.acciones_totales || ''
    });
    setShowEmpresaModal(true);
  };

  const handleSaveEmpresa = async () => {
    setError('');
    setSuccess('');

    if (!empresaForm.nombre || !empresaForm.ticker || !empresaForm.id_mercado) {
      setError('Faltan datos requeridos');
      return;
    }

    if (empresaForm.precio && empresaForm.acciones_totales) {
      if (parseFloat(empresaForm.precio) <= 0 || parseInt(empresaForm.acciones_totales) <= 0) {
        setError('datos de capitalización incompletos');
        return;
      }
    }

    try {
      if (editingEmpresa) {
        await updateEmpresa(editingEmpresa.id, {
          nombre: empresaForm.nombre,
          ticker: empresaForm.ticker,
          id_mercado: empresaForm.id_mercado
        });
        setSuccess('Empresa actualizada exitosamente');
      } else {
        await createEmpresaAdmin({
          nombre: empresaForm.nombre,
          ticker: empresaForm.ticker,
          id_mercado: empresaForm.id_mercado,
          precio: empresaForm.precio ? parseFloat(empresaForm.precio) : null,
          acciones_totales: empresaForm.acciones_totales ? parseInt(empresaForm.acciones_totales) : null
        });
        setSuccess('Empresa creada exitosamente');
      }
      setShowEmpresaModal(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Error al guardar empresa');
    }
  };

  const handleDelistEmpresa = async () => {
    setError('');
    setSuccess('');

    if (!justificacion.trim()) {
      setError('La justificación es requerida');
      return;
    }

    try {
      const result = await delistarEmpresa(
        empresaToDelist.id,
        justificacion,
        precioLiquidacion ? parseFloat(precioLiquidacion) : null
      );

      if (result.posiciones_liquidadas > 0) {
        setSuccess(`empresa con posiciones activas (se liquidarán). ${result.posiciones_liquidadas} posición(es) liquidada(s)`);
      } else {
        setSuccess('Empresa deslistada exitosamente');
      }

      setShowDelistModal(false);
      setJustificacion('');
      setPrecioLiquidacion('');
      fetchData();
    } catch (err) {
      setError(err.message || 'Error al delistar empresa');
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar rol="Admin" />
      <main style={{ flex: 1, padding: 24 }}>
        <div style={{ padding: 24 }}>
          <h2>Catálogos - Mercados y Empresas</h2>
          
          {error && <ErrorMessage message={error} />}
          {success && <div style={{ padding: 12, background: '#d4edda', color: '#155724', borderRadius: 4, marginBottom: 16 }}>{success}</div>}

          {/* MERCADOS */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Mercados</h3>
              <button onClick={handleCreateMercado}>Crear Mercado</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: 12, textAlign: 'left', border: '1px solid #ddd' }}>Nombre</th>
                  <th style={{ padding: 12, textAlign: 'center', border: '1px solid #ddd' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mercados.map((mercado) => (
                  <tr key={mercado.id}>
                    <td style={{ padding: 12, border: '1px solid #ddd' }}>{mercado.nombre}</td>
                    <td style={{ padding: 12, border: '1px solid #ddd', textAlign: 'center' }}>
                      <button onClick={() => handleEditMercado(mercado)} style={{ marginRight: 8 }}>Editar</button>
                      <button onClick={() => handleDeleteMercado(mercado)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* EMPRESAS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Empresas</h3>
              <button onClick={handleCreateEmpresa}>Crear Empresa</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: 12, textAlign: 'left', border: '1px solid #ddd' }}>Nombre</th>
                  <th style={{ padding: 12, textAlign: 'left', border: '1px solid #ddd' }}>Ticker</th>
                  <th style={{ padding: 12, textAlign: 'left', border: '1px solid #ddd' }}>Mercado</th>
                  <th style={{ padding: 12, textAlign: 'right', border: '1px solid #ddd' }}>Precio Actual</th>
                  <th style={{ padding: 12, textAlign: 'right', border: '1px solid #ddd' }}>Acciones Totales</th>
                  <th style={{ padding: 12, textAlign: 'right', border: '1px solid #ddd' }}>Capitalización</th>
                  <th style={{ padding: 12, textAlign: 'center', border: '1px solid #ddd' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((empresa) => (
                  <tr key={empresa.id}>
                    <td style={{ padding: 12, border: '1px solid #ddd' }}>{empresa.nombre}</td>
                    <td style={{ padding: 12, border: '1px solid #ddd' }}>{empresa.ticker}</td>
                    <td style={{ padding: 12, border: '1px solid #ddd' }}>{empresa.mercado}</td>
                    <td style={{ padding: 12, border: '1px solid #ddd', textAlign: 'right' }}>
                      {empresa.precio_actual ? `$${empresa.precio_actual.toFixed(2)}` : '-'}
                    </td>
                    <td style={{ padding: 12, border: '1px solid #ddd', textAlign: 'right' }}>
                      {empresa.acciones_totales || '-'}
                    </td>
                    <td style={{ padding: 12, border: '1px solid #ddd', textAlign: 'right' }}>
                      {empresa.capitalizacion ? `$${empresa.capitalizacion.toFixed(2)}` : '-'}
                    </td>
                    <td style={{ padding: 12, border: '1px solid #ddd', textAlign: 'center' }}>
                      <button onClick={() => handleEditEmpresa(empresa)} style={{ marginRight: 8 }}>Editar</button>
                      <button 
                        onClick={() => { 
                          setEmpresaToDelist(empresa); 
                          setShowDelistModal(true); 
                        }}
                        style={{ background: '#dc3545', color: 'white' }}
                      >
                        Delistar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MODAL MERCADO */}
          {showMercadoModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'white', padding: 24, borderRadius: 8, minWidth: 400 }}>
                <h3>{editingMercado ? 'Editar Mercado' : 'Crear Mercado'}</h3>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Nombre del Mercado:</label>
                  <input
                    type="text"
                    value={mercadoNombre}
                    onChange={(e) => setMercadoNombre(e.target.value)}
                    placeholder="Ej: NASDAQ"
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowMercadoModal(false)}>Cancelar</button>
                  <button onClick={handleSaveMercado} style={{ background: '#007bff', color: 'white' }}>
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL EMPRESA */}
          {showEmpresaModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'white', padding: 24, borderRadius: 8, minWidth: 500 }}>
                <h3>{editingEmpresa ? 'Editar Empresa' : 'Crear Empresa'}</h3>
                
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Nombre:</label>
                  <input
                    type="text"
                    value={empresaForm.nombre}
                    onChange={(e) => setEmpresaForm({ ...empresaForm, nombre: e.target.value })}
                    placeholder="Ej: Apple Inc."
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Ticker:</label>
                  <input
                    type="text"
                    value={empresaForm.ticker}
                    onChange={(e) => setEmpresaForm({ ...empresaForm, ticker: e.target.value.toUpperCase() })}
                    placeholder="Ej: AAPL"
                    maxLength={6}
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Mercado:</label>
                  <select
                    value={empresaForm.id_mercado}
                    onChange={(e) => setEmpresaForm({ ...empresaForm, id_mercado: e.target.value })}
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  >
                    <option value="">Seleccione un mercado</option>
                    {mercados.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                {!editingEmpresa && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>Precio Inicial (opcional):</label>
                      <input
                        type="number"
                        value={empresaForm.precio}
                        onChange={(e) => setEmpresaForm({ ...empresaForm, precio: e.target.value })}
                        placeholder="Ej: 150.00"
                        step="0.01"
                        min="0"
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>Acciones Totales (opcional):</label>
                      <input
                        type="number"
                        value={empresaForm.acciones_totales}
                        onChange={(e) => setEmpresaForm({ ...empresaForm, acciones_totales: e.target.value })}
                        placeholder="Ej: 1000"
                        min="0"
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                      />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowEmpresaModal(false)}>Cancelar</button>
                  <button onClick={handleSaveEmpresa} style={{ background: '#007bff', color: 'white' }}>
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL DELISTAR */}
          {showDelistModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'white', padding: 24, borderRadius: 8, minWidth: 500 }}>
                <h3 style={{ color: '#dc3545' }}>Delistar Empresa</h3>
                <p style={{ marginBottom: 16 }}>
                  ¿Está seguro de delistar <strong>{empresaToDelist?.nombre}</strong>?
                  {empresaToDelist?.acciones_disponibles < empresaToDelist?.acciones_totales && (
                    <span style={{ color: '#dc3545', display: 'block', marginTop: 8 }}>
                       Esta empresa tiene posiciones activas que serán liquidadas automáticamente.
                    </span>
                  )}
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Justificación (requerida):</label>
                  <textarea
                    value={justificacion}
                    onChange={(e) => setJustificacion(e.target.value)}
                    placeholder="Explique el motivo del delisting..."
                    rows={4}
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>
                    Precio de Liquidación (, por defecto se usa el precio actual: ${empresaToDelist?.precio_actual?.toFixed(2)}):
                  </label>
                  <input
                    type="number"
                    value={precioLiquidacion}
                    onChange={(e) => setPrecioLiquidacion(e.target.value)}
                    placeholder={`Por defecto: ${empresaToDelist?.precio_actual?.toFixed(2)}`}
                    step="0.01"
                    min="0"
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => { setShowDelistModal(false); setJustificacion(''); setPrecioLiquidacion(''); }}>
                    Cancelar
                  </button>
                  <button 
                    onClick={handleDelistEmpresa} 
                    style={{ background: '#dc3545', color: 'white' }}
                  >
                    Confirmar Delisting
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

export default Catalogos;