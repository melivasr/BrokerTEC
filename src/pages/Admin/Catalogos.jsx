import React, { useEffect, useState } from 'react';
import { getMercados, createMercado, updateMercado, deleteMercado } from '../../services/empresaService';
import { getEmpresas, createEmpresa, updateEmpresa, delistarEmpresa } from '../../services/empresaService';
import DataTable from '../../components/DataTable';
import ModalConfirm from '../../components/ModalConfirm';
import ErrorMessage from '../../components/ErrorMessage';
import Sidebar from '../../components/Sidebar';

const Catalogos = () => {
  const [mercados, setMercados] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [empresaToDelist, setEmpresaToDelist] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const mercadosData = await getMercados();
      setMercados(mercadosData);
      const empresasData = await getEmpresas();
      setEmpresas(empresasData);
    } catch (err) {
      setError('Error cargando datos');
    }
  };

  const handleDelistEmpresa = async (empresa, justificacion) => {
    try {
      await delistarEmpresa(empresa.empresa_id, justificacion);
      fetchData();
    } catch (err) {
      if (err.message.includes('posiciones activas')) {
        setError('empresa con posiciones activas (se liquidarán)');
      } else if (err.message.includes('capitalización incompleta')) {
        setError('datos de capitalización incompletos');
      } else {
        setError('Error al delistar empresa');
      }
    }
    setShowModal(false);
  };

  // ...handlers para crear/actualizar/eliminar mercados y empresas...

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar rol="Admin" />
      <main style={{ flex: 1, padding: 24 }}>
        <h2>Catálogos</h2>
        {error && <ErrorMessage message={error} />}
        <DataTable
          title="Mercados"
          data={mercados}
          // ...props para CRUD...
        />
        <DataTable
          title="Empresas"
          data={empresas}
          // ...props para CRUD y delistar...
          onDelist={(empresa) => { setEmpresaToDelist(empresa); setShowModal(true); }}
        />
        {showModal && (
          <ModalConfirm
            title="Delistar Empresa"
            message="¿Está seguro que desea delistar esta empresa? Se liquidarán posiciones activas."
            onConfirm={(justificacion) => handleDelistEmpresa(empresaToDelist, justificacion)}
            onCancel={() => setShowModal(false)}
          />
        )}
        {/* Opcional: gráfico de precios históricos */}
      </main>
    </div>
  );
};

export default Catalogos;
