import React, { useEffect, useState } from 'react';
import { getUsuarios, getUsuarioCuentas, crearUsuario, editarUsuario, asignarCategoria, habilitarMercado, deshabilitarUsuario } from '../../services/userService';
import { getTopWallet, getTopAcciones } from '../../services/reportService';
import ErrorMessage from '../../components/ErrorMessage';
import ModalConfirm from '../../components/ModalConfirm';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import Sidebar from '../../components/Sidebar';

const UsuariosCuentas = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [cuentas, setCuentas] = useState(null);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [justificacion, setJustificacion] = useState('');
  const [topWallet, setTopWallet] = useState([]);
  const [topAcciones, setTopAcciones] = useState([]);

  useEffect(() => {
    fetchUsuarios();
    fetchTops();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch {
      setError('Error cargando usuarios');
    }
  };

  const fetchTops = async () => {
    setError('');
    try {
      setTopWallet(await getTopWallet());
      setTopAcciones(await getTopAcciones());
    } catch {
      setError('Error cargando top traders');
    }
  };

  const handleUsuarioClick = async (usuario) => {
    setSelectedUsuario(usuario);
    try {
      const data = await getUsuarioCuentas(usuario.usuario_id);
      setCuentas(data);
    } catch {
      setCuentas(null);
    }
  };

  const handleDeshabilitar = async () => {
    setError('');
    if (!justificacion) {
      setError('justificación requerida');
      return;
    }
    try {
      await deshabilitarUsuario(selectedUsuario.usuario_id, justificacion);
      fetchUsuarios();
      setShowModal(false);
    } catch (err) {
      if (err.message.includes('ya deshabilitado')) {
        setError('usuario ya deshabilitado');
      } else {
        setError('Error al deshabilitar usuario');
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
            <table>
                <thead>
                <tr>
                    <th>Alias</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {usuarios.map(u => (
                    <tr key={u.usuario_id}>
                    <td>{u.alias}</td>
                    <td>{u.rol}</td>
                    <td>{u.estado}</td>
                    <td>
                        <button onClick={() => handleUsuarioClick(u)}>Ver cuentas</button>
                        <button onClick={() => { setSelectedUsuario(u); setShowModal(true); }}>Deshabilitar</button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {cuentas && (
                <div>
                <h3>Cuentas de {selectedUsuario.alias}</h3>
                <div>Wallet: ${cuentas.wallet.saldo} | Categoría: {cuentas.wallet.categoria} | Límite: {cuentas.wallet.limite}</div>
                <div>Mercados habilitados: {cuentas.mercados.map(m => m.nombre).join(', ')}</div>
                </div>
            )}
            {showModal && (
                <ModalConfirm
                title={`Deshabilitar usuario ${selectedUsuario.alias}`}
                message="Ingrese la justificación para deshabilitar el usuario."
                onConfirm={handleDeshabilitar}
                onCancel={() => setShowModal(false)}
                >
                <input
                    type="text"
                    placeholder="Justificación"
                    value={justificacion}
                    onChange={e => setJustificacion(e.target.value)}
                />
                </ModalConfirm>
            )}
            <div style={{ display: 'flex', gap: 40, marginTop: 40 }}>
                <div style={{ width: 400 }}>
                <h3>Top 5 por dinero en wallet</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topWallet}>
                    <XAxis dataKey="alias" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="saldo" fill="#8884d8">
                        <LabelList dataKey="saldo" position="right" />
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
                </div>
                <div style={{ width: 400 }}>
                <h3>Top 5 por valor en acciones</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topAcciones}>
                    <XAxis dataKey="alias" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="valor_acciones" fill="#82ca9d">
                        <LabelList dataKey="valor_acciones" position="right" />
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default UsuariosCuentas;