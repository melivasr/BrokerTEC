import React, { useEffect, useState } from 'react';
import { 
  getUsuarios, 
  getUsuarioCuentas, 
  deshabilitarUsuario, 
  getTopWallet, 
  getTopAcciones 
} from '../../services/adminService';
import ErrorMessage from '../../components/ErrorMessage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, CartesianGrid } from 'recharts';
import Sidebar from '../../components/Sidebar';

const UsuariosCuentas = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [cuentas, setCuentas] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [justificacion, setJustificacion] = useState('');
  const [topWallet, setTopWallet] = useState([]);
  const [topAcciones, setTopAcciones] = useState([]);

  useEffect(() => {
    fetchUsuarios();
    fetchTops();
  }, []);

  const fetchUsuarios = async () => {
    setError('');
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError('Error cargando usuarios');
    }
  };

  const fetchTops = async () => {
    setError('');
    try {
      const [wallet, acciones] = await Promise.all([
        getTopWallet(),
        getTopAcciones()
      ]);
      setTopWallet(wallet);
      setTopAcciones(acciones);
    } catch (err) {
      setError('Error cargando top traders');
    }
  };

  const handleUsuarioClick = async (usuario) => {
    setSelectedUsuario(usuario);
    setError('');
    
    try {
      const data = await getUsuarioCuentas(usuario.id);
      setCuentas(data);
    } catch (err) {
      setCuentas(null);
      setError('Error cargando cuentas del usuario');
    }
  };

  const handleDeshabilitar = async () => {
    setError('');
    setSuccess('');

    if (!justificacion.trim()) {
      setError('justificación requerida');
      return;
    }

    try {
      const result = await deshabilitarUsuario(selectedUsuario.id, justificacion);
      setSuccess(`Usuario ${selectedUsuario.alias} deshabilitado. ${result.posiciones_liquidadas} posición(es) liquidada(s).`);
      setShowModal(false);
      setJustificacion('');
      fetchUsuarios();
      fetchTops();
    } catch (err) {
      if (err.response?.data?.message?.includes('ya deshabilitado')) {
        setError('usuario ya deshabilitado');
      } else {
        setError(err.response?.data?.message || 'Error al deshabilitar usuario');
      }
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar rol="Admin" />
      <main style={{ flex: 1, padding: 24 }}>
        <div style={{ padding: 24 }}>
          <h2>Usuarios & Cuentas</h2>
          
          {error && <ErrorMessage message={error} />}
          {success && (
            <div style={{ padding: 12, background: '#d4edda', color: '#155724', borderRadius: 4, marginBottom: 16 }}>
              {success}
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: 12, textAlign: 'left', border: '1px solid #ddd' }}>Alias</th>
                <th style={{ padding: 12, textAlign: 'left', border: '1px solid #ddd' }}>Rol</th>
                <th style={{ padding: 12, textAlign: 'center', border: '1px solid #ddd' }}>Estado</th>
                <th style={{ padding: 12, textAlign: 'center', border: '1px solid #ddd' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td style={{ padding: 12, border: '1px solid #ddd' }}>{usuario.alias}</td>
                  <td style={{ padding: 12, border: '1px solid #ddd' }}>{usuario.rol}</td>
                  <td style={{ padding: 12, border: '1px solid #ddd', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 12,
                      background: usuario.habilitado ? '#d4edda' : '#f8d7da',
                      color: usuario.habilitado ? '#155724' : '#721c24',
                      fontSize: '0.9em'
                    }}>
                      {usuario.habilitado ? 'Activo' : 'Deshabilitado'}
                    </span>
                  </td>
                  <td style={{ padding: 12, border: '1px solid #ddd', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleUsuarioClick(usuario)}
                      style={{ marginRight: 8, padding: '6px 12px', cursor: 'pointer' }}
                    >
                      Ver Cuentas
                    </button>
                    <button 
                      onClick={() => { 
                        setSelectedUsuario(usuario); 
                        setShowModal(true); 
                      }}
                      disabled={!usuario.habilitado}
                      style={{ 
                        background: usuario.habilitado ? '#dc3545' : '#ccc', 
                        color: 'white',
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: 4,
                        cursor: usuario.habilitado ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Deshabilitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* DETALLES DE CUENTAS */}
          {cuentas && selectedUsuario && (
            <div style={{ padding: 24, background: '#f8f9fa', borderRadius: 8, marginBottom: 32 }}>
              <h3>Cuentas de {selectedUsuario.alias}</h3>
              
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 8 }}>Billetera:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <div>
                    <strong>Saldo:</strong> ${cuentas.wallet.saldo.toFixed(2)}
                  </div>
                  <div>
                    <strong>Categoría:</strong> {cuentas.wallet.categoria}
                  </div>
                  <div>
                    <strong>Límite Diario:</strong> ${cuentas.wallet.limite_diario.toFixed(2)}
                  </div>
                  <div>
                    <strong>Consumo Hoy:</strong> ${cuentas.wallet.consumo.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: 8 }}>Mercados Habilitados:</h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  {cuentas.mercados.length > 0 ? (
                    cuentas.mercados.map((mercado) => (
                      <span 
                        key={mercado.id}
                        style={{
                          padding: '6px 16px',
                          background: '#007bff',
                          color: 'white',
                          borderRadius: 16,
                          fontSize: '0.9em'
                        }}
                      >
                        {mercado.nombre}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#666' }}>Sin mercados habilitados</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* GRAFICOS TOP TRADERS */}
          <div style={{ display: 'flex', gap: 40, marginTop: 40 }}>
            <div style={{ flex: 1 }}>
              <h3>Top 5 por dinero en wallet</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topWallet} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                  <YAxis type="category" dataKey="alias" width={80} />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="saldo" fill="#007bff">
                    <LabelList dataKey="saldo" position="right" formatter={(value) => `$${value}`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ flex: 1 }}>
              <h3>Top 5 por valor en acciones</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topAcciones} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                  <YAxis type="category" dataKey="alias" width={80} />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="valor_acciones" fill="#28a745">
                    <LabelList dataKey="valor_acciones" position="right" formatter={(value) => `$${value}`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MODAL DESHABILITAR */}
          {showModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'white', padding: 24, borderRadius: 8, minWidth: 500 }}>
                <h3 style={{ color: '#dc3545' }}>Deshabilitar Usuario</h3>
                <p style={{ marginBottom: 16 }}>
                  ¿Está seguro de deshabilitar al usuario <strong>{selectedUsuario?.alias}</strong>?
                </p>
                <div style={{ padding: 12, background: '#fff3cd', color: '#856404', borderRadius: 4, marginBottom: 16, fontSize: '0.9em' }}>
                   Esta acción:
                  <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                    <li>Liquidará todas las posiciones del usuario al precio actual</li>
                    <li>El dinero será abonado a su wallet</li>
                    <li>El usuario quedará en modo solo lectura</li>
                    <li>La acción será auditada</li>
                  </ul>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Justificación (requerida):</label>
                  <textarea
                    value={justificacion}
                    onChange={(e) => setJustificacion(e.target.value)}
                    placeholder="Explique el motivo de la deshabilitación..."
                    rows={4}
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => { setShowModal(false); setJustificacion(''); }}
                    style={{ padding: '8px 16px', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleDeshabilitar}
                    style={{ background: '#dc3545', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Confirmar Deshabilitación
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

export default UsuariosCuentas;