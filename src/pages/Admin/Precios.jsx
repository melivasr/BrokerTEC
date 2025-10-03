import React, { useEffect, useState } from 'react';
import { getEmpresasPrecios, cargarPrecioManual, getPreciosHistoricos, cargarPreciosBatch } from '../../services/empresaService';
import ErrorMessage from '../../components/ErrorMessage';
import ModalConfirm from '../../components/ModalConfirm';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../../components/Sidebar';

const Precios = () => {
  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [precio, setPrecio] = useState('');
  const [fecha, setFecha] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const data = await getEmpresasPrecios();
      setEmpresas(data);
    } catch (err) {
      setError('auth fallida');
    }
  };

  const handleEmpresaClick = async (empresa) => {
    setSelectedEmpresa(empresa);
    try {
      const data = await getPreciosHistoricos(empresa.empresa_id);
      setHistorico(data);
    } catch {
      setHistorico([]);
    }
  };

  const handleCargaManual = async () => {
    setError('');
    if (!precio || precio <= 0) {
      setError('precio inválido');
      return;
    }
    if (!fecha || isNaN(Date.parse(fecha))) {
      setError('formato de fecha inválido');
      return;
    }
    try {
      await cargarPrecioManual(selectedEmpresa.empresa_id, { precio, fecha });
      fetchEmpresas();
      setShowModal(false);
    } catch (err) {
      setError('auth fallida');
    }
  };

  // Ejemplo para carga por API (batch)
  const handleCargaBatch = async (preciosBatch) => {
    try {
      await cargarPreciosBatch(preciosBatch);
      fetchEmpresas();
    } catch (err) {
      setError('auth fallida');
    }
  };

  return (
    <div style={{ display: 'flex' }}>
        <Sidebar rol="Admin" />
      <main style={{ flex: 1, padding: 24 }}>
        <div style={{ padding: 24 }}>
      <h2>Precios & Carga</h2>
      {error && <ErrorMessage message={error} />}
      <table>
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Precio Actual</th>
            <th>Fecha Actualización</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {empresas.map((e) => (
            <tr key={e.empresa_id}>
              <td>{e.nombre}</td>
              <td>{e.precio_actual}</td>
              <td>{e.fecha_actualizacion}</td>
              <td>
                <button onClick={() => handleEmpresaClick(e)}>Ver histórico</button>
                <button onClick={() => { setSelectedEmpresa(e); setShowModal(true); }}>Cargar precio</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedEmpresa && historico.length > 0 && (
        <div style={{ height: 300, margin: '24px 0' }}>
          <h3>Precio vs. tiempo: {selectedEmpresa.nombre}</h3>
          <ResponsiveContainer>
            <LineChart data={historico}>
              <XAxis dataKey="ts_utc" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="precio" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {showModal && (
        <ModalConfirm
          title={`Cargar precio para ${selectedEmpresa.nombre}`}
          message="Ingrese el nuevo precio y la fecha/hora de actualización."
          onConfirm={handleCargaManual}
          onCancel={() => setShowModal(false)}
        >
          <input
            type="number"
            placeholder="Precio"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            min="0.01"
            step="0.01"
          />
          <input
            type="datetime-local"
            placeholder="Fecha"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
          />
        </ModalConfirm>
      )}
      </div>
      </main>
    </div>      
  );
};

export default Precios;