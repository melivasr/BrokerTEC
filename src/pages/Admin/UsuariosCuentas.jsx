import React, { useEffect, useState } from 'react';
import { 
  getUsuarios, getUsuarioCuentas, deshabilitarUsuario, getTopWallet, getTopAcciones,
  createUsuario, updateUsuarioAdmin, getMercados, habilitarMercado, deshabilitarMercado
} from '../../services/adminService';
import ErrorMessage from '../../components/ErrorMessage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, CartesianGrid } from 'recharts';
import Sidebar from '../../components/Sidebar';

// Estilos
const tableCell = { padding: 12, border: '1px solid #ddd' };
const modalInput = (isMobile) => ({ 
  width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box',
  fontSize: isMobile ? '16px' : '14px'
});

// Componente tabla de usuarios
const UsuariosTable = ({ usuarios, isMobile, onVerCuentas, onEditar, onDeshabilitar }) => (
  isMobile ? (
    <div style={{ marginBottom: 32 }}>
      {usuarios.map((u) => (
        <div key={u.id} className="card" style={{ marginBottom: 16 }}>
          <h4 style={{ marginTop: 0, marginBottom: 8 }}>{u.alias}</h4>
          <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Nombre:</strong> {u.nombre}</p>
          <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Rol:</strong> {u.rol}</p>
          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 12,
            background: u.habilitado ? '#d4edda' : '#f8d7da',
            color: u.habilitado ? '#155724' : '#721c24',
            fontSize: '0.9em',
            marginTop: 8
          }}>
            {u.habilitado ? 'Activo' : 'Deshabilitado'}
          </span>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <button onClick={() => onVerCuentas(u)} className="btn-block">Ver Cuentas</button>
            <button onClick={() => onEditar(u)} className="btn-block">Editar</button>
            <button 
              onClick={() => onDeshabilitar(u)} 
              disabled={!u.habilitado}
              className="btn-block"
              style={{ background: u.habilitado ? '#dc3545' : '#ccc', color: 'white', cursor: u.habilitado ? 'pointer' : 'not-allowed' }}
            >
              Deshabilitar
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
      <thead>
        <tr>
          <th style={{ ...tableCell, textAlign: 'left' }}>Alias</th>
          <th style={{ ...tableCell, textAlign: 'left' }}>Nombre</th>
          <th style={{ ...tableCell, textAlign: 'left' }}>Rol</th>
          <th style={{ ...tableCell, textAlign: 'center' }}>Estado</th>
          <th style={{ ...tableCell, textAlign: 'center', width: 300 }}>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {usuarios.map((u) => (
          <tr key={u.id}>
            <td style={tableCell}>{u.alias}</td>
            <td style={tableCell}>{u.nombre}</td>
            <td style={tableCell}>{u.rol}</td>
            <td style={{ ...tableCell, textAlign: 'center' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: 12,
                background: u.habilitado ? '#d4edda' : '#f8d7da',
                color: u.habilitado ? '#155724' : '#721c24',
                fontSize: '0.9em'
              }}>
                {u.habilitado ? 'Activo' : 'Deshabilitado'}
              </span>
            </td>
            <td style={{ ...tableCell, textAlign: 'center' }}>
              <button onClick={() => onVerCuentas(u)} style={{ marginRight: 8, padding: '6px 12px' }}>Ver Cuentas</button>
              <button onClick={() => onEditar(u)} style={{ marginRight: 8, padding: '6px 12px' }}>Editar</button>
              <button 
                onClick={() => onDeshabilitar(u)} 
                disabled={!u.habilitado}
                style={{ background: u.habilitado ? '#dc3545' : '#ccc', color: 'white', padding: '6px 12px', border: 'none', borderRadius: 4, cursor: u.habilitado ? 'pointer' : 'not-allowed' }}
              >
                Deshabilitar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
);

// Componente detalles de cuentas
const DetallesCuentas = ({ usuario, cuentas, isMobile, onGestionarMercados }) => (
  <div className="card" style={{ marginBottom: 32 }}>
    <h3>Cuentas de {usuario.alias}</h3>
    
    <div style={{ marginBottom: 16 }}>
      <h4 style={{ marginBottom: 8 }}>Billetera:</h4>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', 
        gap: isMobile ? 8 : 16 
      }}>
        <div><strong>Saldo:</strong> ${cuentas.wallet.saldo.toFixed(2)}</div>
        <div><strong>Categoría:</strong> {cuentas.wallet.categoria}</div>
        <div><strong>Límite Diario:</strong> ${cuentas.wallet.limite_diario.toFixed(2)}</div>
        <div><strong>Consumo Hoy:</strong> ${cuentas.wallet.consumo.toFixed(2)}</div>
      </div>
    </div>

    <div>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 8, marginBottom: 8 }}>
        <h4 style={{ margin: 0 }}>Mercados Habilitados:</h4>
        <button onClick={onGestionarMercados} className="btn-block" style={{ padding: '6px 12px' }}>
          Gestionar Mercados
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {cuentas.mercados.length > 0 ? (
          cuentas.mercados.map((m) => (
            <span key={m.id} style={{ padding: '6px 16px', background: '#007bff', color: 'white', borderRadius: 16, fontSize: '0.9em' }}>
              {m.nombre}
            </span>
          ))
        ) : (
          <span style={{ color: '#666' }}>Sin mercados habilitados</span>
        )}
      </div>
    </div>
  </div>
);

// Componente gráficos top traders
const TopTradersCharts = ({ topWallet, topAcciones, isMobile }) => (
  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 40, marginTop: 40 }}>
    <div>
      <h3>Top 5 por dinero en wallet</h3>
      <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
        <BarChart data={topWallet} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: isMobile ? 10 : 12 }} />
          <YAxis type="category" dataKey="alias" width={isMobile ? 60 : 80} tick={{ fontSize: isMobile ? 10 : 12 }} />
          <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
          <Bar dataKey="saldo" fill="#007bff">
            <LabelList dataKey="saldo" position="right" formatter={(v) => `$${v}`} style={{ fontSize: isMobile ? 10 : 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div>
      <h3>Top 5 por valor en acciones</h3>
      <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
        <BarChart data={topAcciones} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: isMobile ? 10 : 12 }} />
          <YAxis type="category" dataKey="alias" width={isMobile ? 60 : 80} tick={{ fontSize: isMobile ? 10 : 12 }} />
          <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
          <Bar dataKey="valor_acciones" fill="#28a745">
            <LabelList dataKey="valor_acciones" position="right" formatter={(v) => `$${v}`} style={{ fontSize: isMobile ? 10 : 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const UsuariosCuentas = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
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

  // Formularios
  const [formData, setFormData] = useState({alias: '', nombre: '', correo: '', password: '', rol: 'Trader', categoria: 'Junior'});
  const [editData, setEditData] = useState({nombre: '', correo: '', rol: '', categoria: '', limite_diario: ''});

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchUsuarios();
    fetchTops();
    fetchMercados();
  }, []);

  const fetchUsuarios = async () => {
    setError('');
    try {
      setUsuarios(await getUsuarios());
    } catch { setError('Error cargando usuarios'); }
  };

  const fetchMercados = async () => {
    try {
      setMercados(await getMercados());
    } catch (err) { console.error('Error cargando mercados:', err); }
  };

  const fetchTops = async () => {
    setError('');
    try {
      const [wallet, acciones] = await Promise.all([getTopWallet(), getTopAcciones()]);
      setTopWallet(wallet);
      setTopAcciones(acciones);
    } catch { setError('Error cargando top traders'); }
  };

  const handleUsuarioClick = async (usuario) => {
    setSelectedUsuario(usuario);
    setError('');
    try {
      setCuentas(await getUsuarioCuentas(usuario.id));
    } catch {
      setCuentas(null);
      setError('Error cargando cuentas');
    }
  };

  const handleCreateUsuario = async () => {
    setError(''); setSuccess('');
    if (!formData.alias || !formData.nombre || !formData.correo || !formData.password) {
      setError('Todos los campos requeridos'); return;
    }
    try {
      await createUsuario(formData);
      setSuccess('Usuario creado');
      setShowCreateModal(false);
      setFormData({alias: '', nombre: '', correo: '', password: '', rol: 'Trader', categoria: 'Junior'});
      fetchUsuarios();
      fetchTops();
    } catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  const handleEditUsuario = async () => {
    setError(''); setSuccess('');
    try {
      await updateUsuarioAdmin(selectedUsuario.id, editData);
      setSuccess('Usuario actualizado');
      setShowEditModal(false);
      fetchUsuarios();
    } catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  const handleHabilitarMercado = async (idMercado) => {
    setError(''); setSuccess('');
    try {
      await habilitarMercado(selectedUsuario.id, idMercado);
      setSuccess('Mercado habilitado');
      handleUsuarioClick(selectedUsuario);
    } catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  const handleDeshabilitarMercado = async (idMercado) => {
    setError(''); setSuccess('');
    try {
      await deshabilitarMercado(selectedUsuario.id, idMercado);
      setSuccess('Mercado deshabilitado');
      handleUsuarioClick(selectedUsuario);
    } catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  const handleDeshabilitar = async () => {
    setError(''); setSuccess('');
    if (!justificacion.trim()) { setError('Justificación requerida'); return; }
    try {
      const result = await deshabilitarUsuario(selectedUsuario.id, justificacion);
      setSuccess(`Usuario ${selectedUsuario.alias} deshabilitado. ${result.posiciones_liquidadas} posición(es) liquidada(s).`);
      setShowModal(false);
      setJustificacion('');
      fetchUsuarios();
      fetchTops();
    } catch (err) {
      setError(err.response?.data?.message?.includes('ya deshabilitado') ? 'Usuario ya deshabilitado' : err.response?.data?.message || 'Error');
    }
  };

  const inputStyle = modalInput(isMobile);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar rol="Admin" />
      <main className="app-main">
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: 24, gap: 12 }}>
          <h2 style={{ margin: 0 }}>Usuarios & Cuentas</h2>
          <button onClick={() => setShowCreateModal(true)} style={{ background: '#28a745', color: 'white' }} className="btn-block">
            + Crear Usuario
          </button>
        </div>
        
        {error && <ErrorMessage message={error} />}
        {success && <div className="card" style={{ padding: 12, color: '#155724', marginBottom: 16 }}>{success}</div>}

        <UsuariosTable 
          usuarios={usuarios} 
          isMobile={isMobile}
          onVerCuentas={handleUsuarioClick}
          onEditar={(u) => { 
            setSelectedUsuario(u); 
            setEditData({nombre: u.nombre, correo: u.correo, rol: u.rol, categoria: '', limite_diario: ''}); 
            setShowEditModal(true); 
          }}
          onDeshabilitar={(u) => { setSelectedUsuario(u); setShowModal(true); }}
        />

        {cuentas && selectedUsuario && (
          <DetallesCuentas 
            usuario={selectedUsuario} 
            cuentas={cuentas} 
            isMobile={isMobile}
            onGestionarMercados={() => setShowMercadosModal(true)}
          />
        )}

        <TopTradersCharts topWallet={topWallet} topAcciones={topAcciones} isMobile={isMobile} />

        {/* MODAL CREAR */}
        {showCreateModal && (
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 12 : 24 }}>
            <div className="card" style={{ minWidth: isMobile ? '100%' : 500, maxWidth: isMobile ? '100%' : 600, maxHeight: isMobile ? 'calc(100vh - 24px)' : '90vh', overflow: 'auto' }}>
              <h3>Crear Usuario</h3>
              <div style={{ marginBottom: 16 }}>
                <label>Alias:</label>
                <input type="text" value={formData.alias} onChange={(e) => setFormData({ ...formData, alias: e.target.value })} placeholder="juanp" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Nombre:</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Juan Pérez" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Correo:</label>
                <input type="email" value={formData.correo} onChange={(e) => setFormData({ ...formData, correo: e.target.value })} placeholder="juan@example.com" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Contraseña:</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Mínimo 6" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Rol:</label>
                <select value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })} style={inputStyle}>
                  <option value="Trader">Trader</option>
                  <option value="Analista">Analista</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Categoría:</label>
                <select value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} style={inputStyle}>
                  <option value="Junior">Junior ($1000 - Límite: $500)</option>
                  <option value="Mid">Mid ($5000 - Límite: $2000)</option>
                  <option value="Senior">Senior ($20000 - Límite: $10000)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
                <button onClick={() => { setShowCreateModal(false); setFormData({alias: '', nombre: '', correo: '', password: '', rol: 'Trader', categoria: 'Junior'}); }} className="btn-block">
                  Cancelar
                </button>
                <button onClick={handleCreateUsuario} style={{ background: '#28a745', color: 'white' }} className="btn-block">
                  Crear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDITAR */}
        {showEditModal && (
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 12 : 24 }}>
            <div className="card" style={{ minWidth: isMobile ? '100%' : 500, maxWidth: isMobile ? '100%' : 600 }}>
              <h3>Editar: {selectedUsuario?.alias}</h3>
              <div style={{ marginBottom: 16 }}>
                <label>Nombre:</label>
                <input type="text" value={editData.nombre} onChange={(e) => setEditData({ ...editData, nombre: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Correo:</label>
                <input type="email" value={editData.correo} onChange={(e) => setEditData({ ...editData, correo: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Rol:</label>
                <select value={editData.rol} onChange={(e) => setEditData({ ...editData, rol: e.target.value })} style={inputStyle}>
                  <option value="Trader">Trader</option>
                  <option value="Analista">Analista</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Categoría (opcional):</label>
                <select value={editData.categoria} onChange={(e) => setEditData({ ...editData, categoria: e.target.value })} style={inputStyle}>
                  <option value="">No cambiar</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Límite Diario (opcional):</label>
                <input type="number" value={editData.limite_diario} onChange={(e) => setEditData({ ...editData, limite_diario: e.target.value })} placeholder="Vacío = no cambiar" step="0.01" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
                <button onClick={() => setShowEditModal(false)} className="btn-block">Cancelar</button>
                <button onClick={handleEditUsuario} style={{ background: '#007bff', color: 'white' }} className="btn-block">Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL MERCADOS */}
        {showMercadosModal && selectedUsuario && cuentas && (
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 12 : 24 }}>
            <div className="card" style={{ minWidth: isMobile ? '100%' : 500, maxWidth: isMobile ? '100%' : 600 }}>
              <h3>Gestionar Mercados: {selectedUsuario.alias}</h3>
              <div style={{ marginBottom: 16 }}>
                <h4>Mercados:</h4>
                {mercados.map((m) => {
                  const habilitado = cuentas.mercados.some(cm => cm.id === m.id);
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderBottom: '1px solid #eee' }}>
                      <span>{m.nombre}</span>
                      {habilitado ? (
                        <button onClick={() => handleDeshabilitarMercado(m.id)} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4 }}>
                          Deshabilitar
                        </button>
                      ) : (
                        <button onClick={() => handleHabilitarMercado(m.id)} style={{ background: '#28a745', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4 }}>
                          Habilitar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowMercadosModal(false)} className="btn-block">Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DESHABILITAR */}
        {showModal && (
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 12 : 24 }}>
            <div className="card" style={{ minWidth: isMobile ? '100%' : 500, maxWidth: isMobile ? '100%' : 600 }}>
              <h3 style={{ color: '#dc3545' }}>Deshabilitar Usuario</h3>
              <p>¿Seguro de deshabilitar <strong>{selectedUsuario?.alias}</strong>?</p>
              <div className="card" style={{ padding: 12, color: '#856404', marginBottom: 16, fontSize: '0.9em' }}>
                ⚠️ Esta acción:
                <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                  <li>Liquidará todas las posiciones al precio actual</li>
                  <li>Dinero abonado a wallet</li>
                  <li>Usuario en modo lectura</li>
                  <li>Acción auditada</li>
                </ul>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Justificación:</label>
                <textarea value={justificacion} onChange={(e) => setJustificacion(e.target.value)} placeholder="Motivo..." rows={4} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
                <button onClick={() => { setShowModal(false); setJustificacion(''); }} className="btn-block">Cancelar</button>
                <button onClick={handleDeshabilitar} style={{ background: '#dc3545', color: 'white' }} className="btn-block">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UsuariosCuentas;