import React, { useEffect, useState } from 'react';
import { 
  getUsuarios, getUsuarioCuentas, deshabilitarUsuario, getTopWallet, getTopAcciones, 
  habilitarMercado, deshabilitarMercado, updateBilletera
} from '../../services/adminService';
import {getMercados} from '../../services/analistaService';
import { register, updateUserById } from '../../services/authService';
import ErrorMessage from '../../components/ErrorMessage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, CartesianGrid } from 'recharts';
import Sidebar from '../../components/Sidebar';

const tableCell = { padding: 12, border: '1px solid #ddd' };
const modalInput = (isMobile) => ({ 
  width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box',
  fontSize: isMobile ? '16px' : '14px'
});

const UsuariosTable = ({ usuarios, isMobile, onVerCuentas, onEditar, onDeshabilitar }) => (
  isMobile ? (
    <div style={{ marginBottom: 32 }}>
      {usuarios.map((u) => (
        <div key={u.id} className="card" style={{ marginBottom: 16 }}>
          <h4 style={{ marginTop: 0, marginBottom: 8 }}>{u.alias}</h4>
          <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Nombre:</strong> {u.nombre}</p>
          <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Rol:</strong> {u.rol}</p>
          <span style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: 12,
            background: u.habilitado ? '#d4edda' : '#f8d7da',
            color: u.habilitado ? '#155724' : '#721c24', fontSize: '0.9em', marginTop: 8
          }}>
            {u.habilitado ? 'Activo' : 'Deshabilitado'}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <button onClick={() => onVerCuentas(u)} className="btn-block">Ver Cuentas</button>
            <button onClick={() => onEditar(u)} className="btn-block">Editar</button>
            <button onClick={() => onDeshabilitar(u)} disabled={!u.habilitado} className="btn-block"
              style={{ background: u.habilitado ? '#dc3545' : '#ccc', color: 'white', cursor: u.habilitado ? 'pointer' : 'not-allowed' }}>
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
                padding: '4px 12px', borderRadius: 12,
                background: u.habilitado ? '#d4edda' : '#f8d7da',
                color: u.habilitado ? '#155724' : '#721c24', fontSize: '0.9em'
              }}>
                {u.habilitado ? 'Activo' : 'Deshabilitado'}
              </span>
            </td>
            <td style={{ ...tableCell, textAlign: 'center' }}>
              <button onClick={() => onVerCuentas(u)} style={{ marginRight: 8, padding: '6px 12px' }}>Ver Cuentas</button>
              <button onClick={() => onEditar(u)} style={{ marginRight: 8, padding: '6px 12px' }}>Editar</button>
              <button onClick={() => onDeshabilitar(u)} disabled={!u.habilitado}
                style={{ background: u.habilitado ? '#dc3545' : '#ccc', color: 'white', padding: '6px 12px', 
                border: 'none', borderRadius: 4, cursor: u.habilitado ? 'pointer' : 'not-allowed' }}>
                Deshabilitar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
);

const DetallesCuentas = ({ usuario, cuentas, isMobile, onGestionarMercados, onEditarBilletera }) => (
  <div className="card" style={{ marginBottom: 32 }}>
    <h3>Cuentas de {usuario.alias}</h3>
    
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', gap: 8, marginBottom: 8 }}>
        <h4 style={{ margin: 0 }}>Billetera:</h4>
        <button onClick={onEditarBilletera} style={{ background: '#17a2b8', color: 'white', padding: '6px 12px', 
          border: 'none', borderRadius: 4 }} className="btn-block">
          Editar Billetera
        </button>
      </div>
        {cuentas?.wallet ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: isMobile ? 8 : 16 }}>
            <div><strong>Saldo:</strong> ${Number(cuentas.wallet.saldo).toFixed(2)}</div>
            <div><strong>Categoría:</strong> {cuentas.wallet.categoria}</div>
            <div><strong>Límite Diario:</strong> ${Number(cuentas.wallet.limite_diario).toFixed(2)}</div>
            <div><strong>Consumo Hoy:</strong> ${Number(cuentas.wallet.consumo).toFixed(2)}</div>
          </div>
        ) : (
          <div style={{ color: '#666' }}>Este usuario no tiene billetera</div>
        )}
    </div>

    <div>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', gap: 8, marginBottom: 8 }}>
        <h4 style={{ margin: 0 }}>Mercados Habilitados:</h4>
        <button onClick={onGestionarMercados} className="btn-block" style={{ padding: '6px 12px' }}>
          Gestionar Mercados
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {cuentas.mercados.length > 0 ? (
          cuentas.mercados.map((m) => (
            <span key={m.id} style={{ padding: '6px 16px', background: '#007bff', color: 'white', 
              borderRadius: 16, fontSize: '0.9em' }}>{m.nombre}</span>
          ))
        ) : <span style={{ color: '#666' }}>Sin mercados habilitados</span>}
      </div>
    </div>
  </div>
);

const TopTradersCharts = ({ topWallet, topAcciones, isMobile }) => (
  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 40, marginTop: 40 }}>
    <div>
      <h3>Top 5 por dinero en wallet</h3>
      <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
        <BarChart data={topWallet} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: isMobile ? 10 : 12 }} />
          <YAxis type="category" dataKey="alias" width={isMobile ? 60 : 80} tick={{ fontSize: isMobile ? 10 : 12 }} />
          <Tooltip formatter={(v) => `$${v.toFixed(2)}`} contentStyle={{ backgroundColor: "var(--card-bg)", fontSize: isMobile ? 12 : 14 }} />
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
          <Tooltip formatter={(v) => `$${v.toFixed(2)}`} contentStyle={{ backgroundColor: "var(--card-bg)", fontSize: isMobile ? 12 : 14 }} />
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
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMercadosModal, setShowMercadosModal] = useState(false);
  const [showEditBilleteraModal, setShowEditBilleteraModal] = useState(false);
  const [justificacion, setJustificacion] = useState('');
  const [topWallet, setTopWallet] = useState([]);
  const [topAcciones, setTopAcciones] = useState([]);
  const [formData, setFormData] = useState({
    alias: '', nombre: '', direccion: '', pais_origen: '', telefono: '', correo: '', password: '', rol: 'Trader'
  });
  const [editData, setEditData] = useState({
    alias: '', nombre: '', direccion: '', pais_origen: '', telefono: '', correo: '', rol: 'Trader'
  });
  const [billeteraData, setBilleteraData] = useState({
    id_billetera: '', fondos: 0, limite_diario: 0, categoria: 'Junior'
  });
  const [formErrors, setFormErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { fetchUsuarios(); fetchTops(); fetchMercados(); }, []);

  useEffect(() => {
    let alive = true;

    const refetch = async () => {
      if (!alive) return;
      await fetchTops();
    };

    const id = setInterval(refetch, 8000);
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

  const fetchUsuarios = async () => {
    setError('');
    try { setUsuarios(await getUsuarios()); } 
    catch { setError('Error cargando usuarios'); }
  };

  const fetchMercados = async () => {
    try { setMercados(await getMercados()); } 
    catch (err) { console.error('Error cargando mercados:', err); }
  };

  const fetchTops = async () => {
    setError('');
    try {
      const [usuariosData, wallet, acciones] = await Promise.all([
        getUsuarios(),
        getTopWallet(),
        getTopAcciones(),
      ]);

      setUsuarios(usuariosData || []);
      setTopWallet((wallet || []).map(r => ({...r, saldo: Number(r?.saldo ?? 0)})));
      setTopAcciones((acciones || []).map(r => ({...r, valor_acciones: Number(r?.valor_acciones ?? 0)})));
    } catch (e) {}
  };

  const handleUsuarioClick = async (usuario) => {
    setSelectedUsuario(usuario);
    setError('');
    try {
      const cuentasData = await getUsuarioCuentas(usuario.id);
      setCuentas(cuentasData);
      if (!cuentasData?.wallet) {
        setSuccess('');
        setError('Este usuario no tiene cuentas asociadas');
      }
      if (usuario.id_billetera) {
        setBilleteraData(prev => ({ ...prev, id_billetera: usuario.id_billetera }));
      }
    } catch { setCuentas(null); setError('Error cargando cuentas'); }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleCreateUsuario = async () => {
    setError(''); setSuccess('');
    setFormErrors({});
    
    const errors = {};
    
    if (!formData.alias?.trim()) errors.alias = 'El alias es requerido';
    if (!formData.nombre?.trim()) errors.nombre = 'El nombre es requerido';
    if (!formData.direccion?.trim()) errors.direccion = 'La dirección es requerida';
    if (!formData.pais_origen?.trim()) errors.pais_origen = 'El país es requerido';
    if (!formData.telefono?.trim()) errors.telefono = 'El teléfono es requerido';
    if (!formData.correo?.trim()) errors.correo = 'El correo es requerido';
    else if (!isValidEmail(formData.correo)) errors.correo = 'Formato de correo inválido (ejemplo@dominio.com)';
    if (!formData.password?.trim()) errors.password = 'La contraseña es requerida';
    else if (formData.password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      await register(formData);
      setSuccess('Usuario creado correctamente');
      setShowCreateModal(false);
      setFormData({ alias: '', nombre: '', direccion: '', pais_origen: '', telefono: '', correo: '', password: '', rol: 'Trader' });
      setFormErrors({});
      fetchUsuarios(); fetchTops();
    } catch (err) { 
      setError(err.response?.data?.message || 'Error al crear usuario'); 
    }
  };

  const handleEditUsuario = async () => {
    setError(''); setSuccess('');
    setEditErrors({});
    
    const errors = {};
    
    if (!editData.alias?.trim()) errors.alias = 'El alias es requerido';
    if (!editData.nombre?.trim()) errors.nombre = 'El nombre es requerido';
    if (!editData.direccion?.trim()) errors.direccion = 'La dirección es requerida';
    if (!editData.pais_origen?.trim()) errors.pais_origen = 'El país es requerido';
    if (!editData.telefono?.trim()) errors.telefono = 'El teléfono es requerido';
    if (!editData.correo?.trim()) errors.correo = 'El correo es requerido';
    else if (!isValidEmail(editData.correo)) errors.correo = 'Formato de correo inválido (ejemplo@dominio.com)';
    
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    
    try {
      await updateUserById(selectedUsuario.id, editData);
      setSuccess('Usuario actualizado correctamente');
      setShowEditModal(false);
      setEditErrors({});
      fetchUsuarios();
      if (cuentas) handleUsuarioClick(selectedUsuario);
    } catch (err) { 
      setError(err.response?.data?.message || 'Error al actualizar usuario'); 
    }
  };

  const handleEditBilletera = async () => {
    setError(''); setSuccess('');
    if (!billeteraData.id_billetera) {
      setError('No se encontró la billetera del usuario');
      return;
    }
    try {
      await updateBilletera(billeteraData.id_billetera, {
        limite_diario: parseFloat(billeteraData.limite_diario),
        categoria: billeteraData.categoria
      });
      setSuccess('Billetera actualizada correctamente');
      setShowEditBilleteraModal(false);
      fetchTops();
      if (selectedUsuario) handleUsuarioClick(selectedUsuario);
    } catch (err) { setError(err.response?.data?.message || 'Error al actualizar billetera'); }
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
      setShowModal(false); setJustificacion('');
      fetchUsuarios(); fetchTops();
    } catch (err) {
      setError(err.response?.data?.message?.includes('ya deshabilitado') ? 'Usuario ya deshabilitado' : err.response?.data?.message || 'Error');
    }
  };

  const inputStyle = modalInput(isMobile);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar rol="Admin" />
      <main className="app-main">
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center', marginBottom: 24, gap: 12 }}>
          <h2 style={{ margin: 0 }}>Usuarios & Cuentas</h2>
          <button onClick={() => setShowCreateModal(true)} style={{ background: '#28a745', color: 'white' }} className="btn-block">
            + Crear Usuario
          </button>
        </div>
        
        {error && <ErrorMessage message={error} />}
        {success && <div className="card" style={{ padding: 12, background: '#d4edda', color: '#155724', marginBottom: 16 }}>{success}</div>}

        <UsuariosTable usuarios={usuarios} isMobile={isMobile} onVerCuentas={handleUsuarioClick}
          onEditar={(u) => { 
            setSelectedUsuario(u); 
            setEditData({ alias: u.alias || '', nombre: u.nombre || '', direccion: u.direccion || '', 
              pais_origen: u.pais_origen || '', telefono: u.telefono || '', correo: u.correo || '', rol: u.rol || 'Trader' }); 
            setShowEditModal(true); 
          }}
          onDeshabilitar={(u) => { setSelectedUsuario(u); setShowModal(true); }}
        />

        {cuentas && selectedUsuario?.rol === 'Trader' && cuentas.wallet && (
          <DetallesCuentas
            usuario={selectedUsuario}
            cuentas={cuentas}
            isMobile={isMobile}
            onGestionarMercados={() => setShowMercadosModal(true)}
            onEditarBilletera={() => {
              setBilleteraData({
                id_billetera: selectedUsuario.id_billetera,
                fondos: cuentas.wallet.saldo,
                limite_diario: cuentas.wallet.limite_diario,
                categoria: cuentas.wallet.categoria
              });
              setShowEditBilleteraModal(true);
            }}
          />
        )}

        <TopTradersCharts topWallet={topWallet} topAcciones={topAcciones} isMobile={isMobile} />

        {/* MODAL CREAR */}
        {showCreateModal && (
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', 
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000, 
            padding: isMobile ? 12 : 24, overflowY: 'auto' }}>
            <div className="card" style={{ minWidth: isMobile ? '100%' : 500, maxWidth: isMobile ? '100%' : 600, 
              maxHeight: isMobile ? 'calc(100vh - 24px)' : '90vh', overflow: 'auto', margin: 'auto' }}>
              <h3>Crear Usuario</h3>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Alias *</label>
                <input 
                  type="text" 
                  value={formData.alias} 
                  onChange={(e) => {
                    setFormData({ ...formData, alias: e.target.value });
                    if (formErrors.alias) setFormErrors({ ...formErrors, alias: null });
                  }} 
                  placeholder="juanp" 
                  style={{ ...inputStyle, borderColor: formErrors.alias ? '#dc3545' : '#ddd' }} 
                />
                {formErrors.alias && (
                  <small style={{ color: '#dc3545', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                    {formErrors.alias}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Nombre Completo *</label>
                <input 
                  type="text" 
                  value={formData.nombre} 
                  onChange={(e) => {
                    setFormData({ ...formData, nombre: e.target.value });
                    if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: null });
                  }} 
                  placeholder="Juan Pérez" 
                  style={{ ...inputStyle, borderColor: formErrors.nombre ? '#dc3545' : '#ddd' }} 
                />
                {formErrors.nombre && (
                  <small style={{ color: '#dc3545', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                    {formErrors.nombre}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Dirección *</label>
                <input 
                  type="text" 
                  value={formData.direccion} 
                  onChange={(e) => {
                    setFormData({ ...formData, direccion: e.target.value });
                    if (formErrors.direccion) setFormErrors({ ...formErrors, direccion: null });
                  }} 
                  placeholder="Calle Principal 123" 
                  style={{ ...inputStyle, borderColor: formErrors.direccion ? '#dc3545' : '#ddd' }} 
                />
                {formErrors.direccion && (
                  <small style={{ color: '#dc3545', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                    {formErrors.direccion}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>País de Origen *</label>
                <input 
                  type="text" 
                  value={formData.pais_origen} 
                  onChange={(e) => {
                    setFormData({ ...formData, pais_origen: e.target.value });
                    if (formErrors.pais_origen) setFormErrors({ ...formErrors, pais_origen: null });
                  }} 
                  placeholder="Costa Rica" 
                  style={{ ...inputStyle, borderColor: formErrors.pais_origen ? '#dc3545' : '#ddd' }} 
                />
                {formErrors.pais_origen && (
                  <small style={{ color: '#dc3545', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                    {formErrors.pais_origen}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Teléfono *</label>
                <input 
                  type="tel" 
                  value={formData.telefono} 
                  onChange={(e) => {
                    setFormData({ ...formData, telefono: e.target.value });
                    if (formErrors.telefono) setFormErrors({ ...formErrors, telefono: null });
                  }} 
                  placeholder="+506 1234-5678" 
                  style={{ ...inputStyle, borderColor: formErrors.telefono ? '#dc3545' : '#ddd' }} 
                />
                {formErrors.telefono && (
                  <small style={{ color: '#dc3545', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                    {formErrors.telefono}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Correo Electrónico *</label>
                <input 
                  type="email" 
                  value={formData.correo} 
                  onChange={(e) => {
                    setFormData({ ...formData, correo: e.target.value });
                    if (formErrors.correo) setFormErrors({ ...formErrors, correo: null });
                  }} 
                  placeholder="name@example.com" 
                  style={{ ...inputStyle, borderColor: formErrors.correo ? '#dc3545' : '#ddd' }} 
                />
                {formErrors.correo && (
                  <small style={{ color: '#dc3545', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                    {formErrors.correo}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Contraseña *</label>
                <input 
                  type="password" 
                  value={formData.password} 
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (formErrors.password) setFormErrors({ ...formErrors, password: null });
                  }} 
                  placeholder="Mínimo 6 caracteres" 
                  style={{ ...inputStyle, borderColor: formErrors.password ? '#dc3545' : '#ddd' }} 
                />
                {formErrors.password && (
                  <small style={{ color: '#dc3545', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                    {formErrors.password}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Rol *</label>
                <select value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })} style={inputStyle}>
                  <option value="Trader">Trader</option>
                  <option value="Analista">Analista</option>
                  <option value="Admin">Admin</option>
                </select>
                <small style={{ color: '#666', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                  La categoría de billetera se asigna al editar las billeteras en cuentas
                </small>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row', marginTop: 24 }}>
                <button onClick={() => { 
                  setShowCreateModal(false); 
                  setFormData({ alias: '', nombre: '', direccion: '', pais_origen: '', telefono: '', correo: '', password: '', rol: 'Trader' }); 
                  setFormErrors({});
                }} 
                className="btn-block" style={{ padding: '8px 16px' }}>Cancelar</button>
                <button onClick={handleCreateUsuario} style={{ background: '#28a745', color: 'white', padding: '8px 16px' }} 
                  className="btn-block">Crear Usuario</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDITAR */}
        {showEditModal && (
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', 
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000, 
            padding: isMobile ? 12 : 24, overflowY: 'auto' }}>
            <div className="card" style={{ minWidth: isMobile ? '100%' : 500, maxWidth: isMobile ? '100%' : 600, 
              maxHeight: isMobile ? 'calc(100vh - 24px)' : '90vh', overflow: 'auto', margin: 'auto' }}>
              <h3>Editar Usuario: {selectedUsuario?.alias}</h3>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Alias *</label>
                <input 
                  type="text" 
                  value={editData.alias} 
                  onChange={(e) => {
                    setEditData({ ...editData, alias: e.target.value });
                    if (editErrors.alias) setEditErrors({ ...editErrors, alias: null });
                  }} 
                  style={{ ...inputStyle, borderColor: editErrors.alias ? '#dc3545' : '#ddd' }} 
                />
                {editErrors.alias && (
                  <small style={{ color: '#dc3545', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                    {editErrors.alias}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Nombre Completo *</label>
                <input 
                  type="text" 
                  value={editData.nombre} 
                  onChange={(e) => {
                    setEditData({ ...editData, nombre: e.target.value });
                    if (editErrors.nombre) setEditErrors({ ...editErrors, nombre: null });
                  }} 
                  style={{ ...inputStyle, borderColor: editErrors.nombre ? '#dc3545' : '#ddd' }} 
                />
                {editErrors.nombre && (
                  <small style={{ color: '#dc3545', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                    {editErrors.nombre}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Dirección *</label>
                <input 
                  type="text" 
                  value={editData.direccion} 
                  onChange={(e) => {
                    setEditData({ ...editData, direccion: e.target.value });
                    if (editErrors.direccion) setEditErrors({ ...editErrors, direccion: null });
                  }} 
                  style={{ ...inputStyle, borderColor: editErrors.direccion ? '#dc3545' : '#ddd' }} 
                />
                {editErrors.direccion && (
                  <small style={{ color: '#dc3545', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                    {editErrors.direccion}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>País de Origen *</label>
                <input 
                  type="text" 
                  value={editData.pais_origen} 
                  onChange={(e) => {
                    setEditData({ ...editData, pais_origen: e.target.value });
                    if (editErrors.pais_origen) setEditErrors({ ...editErrors, pais_origen: null });
                  }} 
                  style={{ ...inputStyle, borderColor: editErrors.pais_origen ? '#dc3545' : '#ddd' }} 
                />
                {editErrors.pais_origen && (
                  <small style={{ color: '#dc3545', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                    {editErrors.pais_origen}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Teléfono *</label>
                <input 
                  type="tel" 
                  value={editData.telefono} 
                  onChange={(e) => {
                    setEditData({ ...editData, telefono: e.target.value });
                    if (editErrors.telefono) setEditErrors({ ...editErrors, telefono: null });
                  }} 
                  style={{ ...inputStyle, borderColor: editErrors.telefono ? '#dc3545' : '#ddd' }} 
                />
                {editErrors.telefono && (
                  <small style={{ color: '#dc3545', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                    {editErrors.telefono}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Correo Electrónico *</label>
                <input 
                  type="email" 
                  value={editData.correo} 
                  onChange={(e) => {
                    setEditData({ ...editData, correo: e.target.value });
                    if (editErrors.correo) setEditErrors({ ...editErrors, correo: null });
                  }} 
                  style={{ ...inputStyle, borderColor: editErrors.correo ? '#dc3545' : '#ddd' }} 
                />
                {editErrors.correo && (
                  <small style={{ color: '#dc3545', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                    {editErrors.correo}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Rol *</label>
                <select value={editData.rol} onChange={(e) => setEditData({ ...editData, rol: e.target.value })} style={inputStyle}>
                  <option value="Trader">Trader</option>
                  <option value="Analista">Analista</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row', marginTop: 24 }}>
                <button onClick={() => { setShowEditModal(false); setEditErrors({}); }} className="btn-block" style={{ padding: '8px 16px' }}>Cancelar</button>
                <button onClick={handleEditUsuario} style={{ background: '#007bff', color: 'white', padding: '8px 16px' }} 
                  className="btn-block">Guardar Cambios</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDITAR BILLETERA */}
        {showEditBilleteraModal && (
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', 
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 12 : 24 }}>
            <div className="card" style={{ minWidth: isMobile ? '100%' : 500, maxWidth: isMobile ? '100%' : 600 }}>
              <h3>Editar Billetera: {selectedUsuario?.alias}</h3>
              <div className="card" style={{ padding: 12, background: '#d1ecf1', color: '#0c5460', marginBottom: 16, fontSize: '0.9em' }}>
                 Los cambios en la billetera se registran en el historial para auditoría
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Categoría</label>
                <select value={billeteraData.categoria} onChange={(e) => setBilleteraData({ ...billeteraData, categoria: e.target.value })} 
                  style={inputStyle}>
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Fondos</label>
                <input
                  type="number"
                  value={Number(billeteraData.fondos).toFixed(2)} disabled readOnly
                  style={{ ...inputStyle, background: '#f8f9fa', color: '#6c757d', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#666', fontSize: '0.85em', display: 'block', marginTop: 4 }}>
                  Solo lectura.
                </small>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Límite Diario</label>
                <input type="number" min="0" step="0.01" value={billeteraData.limite_diario} 
                  onChange={(e) => setBilleteraData({ ...billeteraData, limite_diario: parseFloat(e.target.value) || 0 })} style={inputStyle} />
                <small style={{ color: '#666', fontSize: '0.85em', display: 'block', marginTop: 4 }}>Límite máximo de transacciones diarias</small>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row', marginTop: 24 }}>
                <button onClick={() => setShowEditBilleteraModal(false)} className="btn-block" style={{ padding: '8px 16px' }}>Cancelar</button>
                <button onClick={handleEditBilletera} style={{ background: '#17a2b8', color: 'white', padding: '8px 16px' }} 
                  className="btn-block">Guardar Cambios</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL GESTIONAR MERCADOS */}
        {showMercadosModal && selectedUsuario && cuentas && (
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', 
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 12 : 24 }}>
            <div className="card" style={{ minWidth: isMobile ? '100%' : 500, maxWidth: isMobile ? '100%' : 600 }}>
              <h3>Gestionar Mercados: {selectedUsuario.alias}</h3>
              <div style={{ marginBottom: 16 }}>
                <h4>Mercados:</h4>
                {mercados.map((m) => {
                  const habilitado = cuentas.mercados.some(cm => cm.id === m.id);
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      padding: 8, borderBottom: '1px solid #eee' }}>
                      <span>{m.nombre}</span>
                      {habilitado ? (
                        <button onClick={() => handleDeshabilitarMercado(m.id)} 
                          style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4 }}>
                          Deshabilitar
                        </button>
                      ) : (
                        <button onClick={() => handleHabilitarMercado(m.id)} 
                          style={{ background: '#28a745', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4 }}>
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
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', 
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 12 : 24 }}>
            <div className="card" style={{ minWidth: isMobile ? '100%' : 500, maxWidth: isMobile ? '100%' : 600 }}>
              <h3 style={{ color: '#dc3545' }}>Deshabilitar Usuario</h3>
              <p>¿Seguro de deshabilitar <strong>{selectedUsuario?.alias}</strong>?</p>
              <div className="card" style={{ padding: 12, background: '#fff3cd', color: '#856404', marginBottom: 16, fontSize: '0.9em' }}>
                 Esta acción:
                <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                  <li>Liquidará todas las posiciones al precio actual</li>
                  <li>Dinero abonado a wallet</li>
                  <li>Usuario en modo lectura</li>
                  <li>Acción auditada</li>
                </ul>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Justificación *</label>
                <textarea value={justificacion} onChange={(e) => setJustificacion(e.target.value)} 
                  placeholder="Explique el motivo de deshabilitar este usuario..." rows={4} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
                <button onClick={() => { setShowModal(false); setJustificacion(''); }} className="btn-block" style={{ padding: '8px 16px' }}>
                  Cancelar
                </button>
                <button onClick={handleDeshabilitar} style={{ background: '#dc3545', color: 'white', padding: '8px 16px' }} 
                  className="btn-block">Confirmar Deshabilitación</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UsuariosCuentas;