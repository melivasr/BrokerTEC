import React, { useEffect, useState } from 'react';
import { 
  getUsuarios, 
  getUsuarioCuentas, 
  deshabilitarUsuario, 
  getTopWallet, 
  getTopAcciones,
  createUsuario,
  updateUsuarioAdmin,
  getMercados,
  habilitarMercado,
  deshabilitarMercado
} from '../../services/adminService';
import ErrorMessage from '../../components/ErrorMessage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, CartesianGrid } from 'recharts';
import Sidebar from '../../components/Sidebar';

const UsuariosCuentas = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [mercados, setMercados] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [cuentas, setCuentas] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modales
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMercadosModal, setShowMercadosModal] = useState(false);
  
  const [justificacion, setJustificacion] = useState('');
  const [topWallet, setTopWallet] = useState([]);
  const [topAcciones, setTopAcciones] = useState([]);

  // Formulario crear/editar usuario
  const [formData, setFormData] = useState({
    alias: '',
    nombre: '',
    correo: '',
    password: '',
    rol: 'Trader',
    categoria: 'Junior'
  });

  // Formulario editar
  const [editData, setEditData] = useState({
    nombre: '',
    correo: '',
    rol: '',
    categoria: '',
    limite_diario: ''
  });

  useEffect(() => {
    fetchUsuarios();
    fetchTops();
    fetchMercados();
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

  const fetchMercados = async () => {
    try {
      const data = await getMercados();
      setMercados(data);
    } catch (err) {
      console.error('Error cargando mercados:', err);
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

  const handleCreateUsuario = async () => {
    setError('');
    setSuccess('');

    if (!formData.alias || !formData.nombre || !formData.correo || !formData.password) {
      setError('Todos los campos son requeridos');
      return;
    }

    try {
      await createUsuario(formData);
      setSuccess('Usuario creado exitosamente');
      setShowCreateModal(false);
      setFormData({ alias: '', nombre: '', correo: '', password: '', rol: 'Trader', categoria: 'Junior' });
      fetchUsuarios();
      fetchTops();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear usuario');
    }
  };

  const handleEditUsuario = async () => {
    setError('');
    setSuccess('');

    try {
      await updateUsuarioAdmin(selectedUsuario.id, editData);
      setSuccess('Usuario actualizado exitosamente');
      setShowEditModal(false);
      fetchUsuarios();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar usuario');
    }
  };

  const handleHabilitarMercado = async (idMercado) => {
    setError('');
    setSuccess('');

    try {
      await habilitarMercado(selectedUsuario.id, idMercado);
      setSuccess('Mercado habilitado exitosamente');
      handleUsuarioClick(selectedUsuario); // Recargar cuentas
    } catch (err) {
      setError(err.response?.data?.message || 'Error al habilitar mercado');
    }
  };

  const handleDeshabilitarMercado = async (idMercado) => {
    setError('');
    setSuccess('');

    try {
      await deshabilitarMercado(selectedUsuario.id, idMercado);
      setSuccess('Mercado deshabilitado exitosamente');
      handleUsuarioClick(selectedUsuario); // Recargar cuentas
    } catch (err) {
      setError(err.response?.data?.message || 'Error al deshabilitar mercado');
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2>Usuarios & Cuentas</h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              style={{ background: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              + Crear Usuario
            </button>
          </div>
          
          {error && <ErrorMessage message={error} />}
          {success && (
            <div style={{ padding: 12, background: "var(--card-bg)" , color: '#155724', borderRadius: 4, marginBottom: 16 }}>
              {success}
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
            <thead>
              <tr style={{ background:"var(--card-bg)"  }}>
                <th style={{ padding: 12, textAlign: 'left', border: '1px solid #ddd' }}>Alias</th>
                <th style={{ padding: 12, textAlign: 'left', border: '1px solid #ddd' }}>Nombre</th>
                <th style={{ padding: 12, textAlign: 'left', border: '1px solid #ddd' }}>Rol</th>
                <th style={{ padding: 12, textAlign: 'center', border: '1px solid #ddd' }}>Estado</th>
                <th style={{ padding: 12, textAlign: 'center', border: '1px solid #ddd' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td style={{ padding: 12, border: '1px solid #ddd' }}>{usuario.alias}</td>
                  <td style={{ padding: 12, border: '1px solid #ddd' }}>{usuario.nombre}</td>
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
                        setEditData({
                          nombre: usuario.nombre,
                          correo: usuario.correo,
                          rol: usuario.rol,
                          categoria: '',
                          limite_diario: ''
                        });
                        setShowEditModal(true); 
                      }}
                      style={{ marginRight: 8, padding: '6px 12px', cursor: 'pointer' }}
                    >
                      Editar
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
            <div style={{ padding: 24, background: "var(--card-bg)" , borderRadius: 8, marginBottom: 32 }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0 }}>Mercados Habilitados:</h4>
                  <button 
                    onClick={() => setShowMercadosModal(true)}
                    style={{ padding: '6px 12px', cursor: 'pointer' }}
                  >
                    Gestionar Mercados
                  </button>
                </div>
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

          {/* MODAL CREAR USUARIO */}
          {showCreateModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: "var(--card-bg)" , padding: 24, borderRadius: 8, minWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
                <h3>Crear Usuario</h3>
                
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Alias:</label>
                  <input
                    type="text"
                    value={formData.alias}
                    onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                    placeholder="Ej: juanp"
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Nombre:</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Correo:</label>
                  <input
                    type="email"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    placeholder="Ej: juan@example.com"
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Contraseña:</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Rol:</label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  >
                    <option value="Trader">Trader</option>
                    <option value="Analista">Analista</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Categoría:</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  >
                    <option value="Junior">Junior ($1000 - Límite: $500)</option>
                    <option value="Mid">Mid ($5000 - Límite: $2000)</option>
                    <option value="Senior">Senior ($20000 - Límite: $10000)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => { setShowCreateModal(false); setFormData({ alias: '', nombre: '', correo: '', password: '', rol: 'Trader', categoria: 'Junior' }); }}>
                    Cancelar
                  </button>
                  <button onClick={handleCreateUsuario} style={{ background: '#28a745', color: 'white' }}>
                    Crear Usuario
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL EDITAR USUARIO */}
          {showEditModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: "var(--card-bg)" , padding: 24, borderRadius: 8, minWidth: 500 }}>
                <h3>Editar Usuario: {selectedUsuario?.alias}</h3>
                
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Nombre:</label>
                  <input
                    type="text"
                    value={editData.nombre}
                    onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Correo:</label>
                  <input
                    type="email"
                    value={editData.correo}
                    onChange={(e) => setEditData({ ...editData, correo: e.target.value })}
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Rol:</label>
                  <select
                    value={editData.rol}
                    onChange={(e) => setEditData({ ...editData, rol: e.target.value })}
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  >
                    <option value="Trader">Trader</option>
                    <option value="Analista">Analista</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Categoría (opcional):</label>
                  <select
                    value={editData.categoria}
                    onChange={(e) => setEditData({ ...editData, categoria: e.target.value })}
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  >
                    <option value="">No cambiar</option>
                    <option value="Junior">Junior</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Límite Diario (opcional):</label>
                  <input
                    type="number"
                    value={editData.limite_diario}
                    onChange={(e) => setEditData({ ...editData, limite_diario: e.target.value })}
                    placeholder="Dejar vacío para no cambiar"
                    step="0.01"
                    style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowEditModal(false)}>Cancelar</button>
                  <button onClick={handleEditUsuario} style={{ background: '#007bff', color: 'white' }}>
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL GESTIONAR MERCADOS */}
          {showMercadosModal && selectedUsuario && cuentas && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: "var(--card-bg)" , padding: 24, borderRadius: 8, minWidth: 500 }}>
                <h3>Gestionar Mercados: {selectedUsuario.alias}</h3>
                
                <div style={{ marginBottom: 16 }}>
                  <h4>Mercados Disponibles:</h4>
                  {mercados.map((mercado) => {
                    const estaHabilitado = cuentas.mercados.some(m => m.id === mercado.id);
                    return (
                      <div key={mercado.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderBottom: '1px solid #eee' }}>
                        <span>{mercado.nombre}</span>
                        {estaHabilitado ? (
                          <button 
                            onClick={() => handleDeshabilitarMercado(mercado.id)}
                            style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          >
                            Deshabilitar
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleHabilitarMercado(mercado.id)}
                            style={{ background: '#28a745', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          >
                            Habilitar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowMercadosModal(false)}>Cerrar</button>
                </div>
              </div>
            </div>
          )}

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