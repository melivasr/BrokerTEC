import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getDetalleEmpresa, marcarFavorita } from "../../services/traderService";
import Sidebar from "../../components/Sidebar";
import { getCurrentUser } from "../../services/authService";

export default function EmpresaDetalle() {
  const { id, empresaId } = useParams();
  const companyId = id || empresaId;
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [error, setError] = useState("");
  const [favorita, setFavorita] = useState(false);
  const currentUser = getCurrentUser();
  const usuarioDeshabilitado = currentUser && (currentUser.habilitado === 0 || currentUser.habilitado === false);

  // Nota: no hacer early return antes de los hooks para cumplir la regla de hooks.

  useEffect(() => {
    async function fetchData() {
      setError("");
      if (!companyId) {
        setError('ID de empresa inválido');
        return;
      }
      try {
        const data = await getDetalleEmpresa(companyId);
        // Backend returns { empresa, historico, favorita }
        if (!data || !data.empresa) {
          setError('Empresa no encontrada');
          return;
        }
        setEmpresa(data.empresa);
        setHistorico(Array.isArray(data.historico) ? data.historico.reverse() : []); // invertir para mostrar ascendente por fecha en el gráfico
        setFavorita(data.favorita || false);
        } catch (err) {
        console.error('Error fetching empresa detalle', err);
        const msg = err?.response?.data?.message || err?.message || 'Error al cargar empresa';
        setError(msg);
      }
    }
    fetchData();
  }, [companyId]);

  const handleOperar = () => {
    // navegar a Operar por ruta con id (coincide con routes.js)
  navigate(`/trader/operar/${companyId}`);
  };

  const handleFavorita = async () => {
    try {
      const resp = await marcarFavorita(companyId);
      // resp: { message, favorita }
      if (resp && typeof resp.favorita !== 'undefined') {
        setFavorita(!!resp.favorita);
      } else {
        // fallback: toggle
        setFavorita(prev => !prev);
      }
    } catch (err) {
      console.error('Error marcando favorita', err);
      setError('No se pudo marcar como favorita');
    }
  };

  // Helpers
  const hasInventario = empresa && empresa.precio_actual !== null && empresa.acciones_disponibles !== null;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Trader" />
      <main className="app-main">
        <h2>Detalle de Empresa</h2>
        {error && <div style={{ color: "red" }}>{error}</div>}
        {!empresa && !error ? (
          <div>Cargando datos...</div>
        ) : error ? (
          // Si hay error, no mostrar el panel de carga
          <div />
        ) : (
          <div className="card container-center">
            <h3>{empresa.nombre} ({empresa.ticker})</h3>

            <p><b>Precio actual:</b> {hasInventario ? `$${empresa.precio_actual}` : <span style={{ color: 'orange' }}>Inventario no disponible</span>}</p>
            <p><b>Cantidad de acciones totales:</b> {empresa.cantidad_acciones_totales ?? 'N/A'}</p>
            <p><b>Acciones disponibles (Tesorería):</b> {empresa.acciones_disponibles ?? <span style={{ color: 'orange' }}>Inventario no disponible</span>}</p>
            <p><b>Capitalización actual:</b> {empresa.capitalizacion !== null ? `$${empresa.capitalizacion}` : 'N/A'}</p>
            <p><b>Mayor tenedor:</b> {empresa.mayor_tenedor_alias ? empresa.mayor_tenedor_alias : 'N/A'}</p>

            <div style={{ marginTop: 12 }}>
              <button onClick={handleOperar} style={{ marginRight: 12, marginBottom: 8, marginTop: 8}} className="btn-block" disabled={usuarioDeshabilitado}>Operar</button>
              <button onClick={handleFavorita} className="btn-block">{favorita ? 'Desmarcar como favorita' : 'Marcar como favorita'}</button>
            </div>

            <hr style={{ margin: '24px 0' }} />

            <h4>Precio vs. Tiempo</h4>
            {(!historico || historico.length === 0) ? (
              <div style={{ color: 'orange' }}>Sin histórico suficiente</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historico}>
                  <XAxis dataKey="fecha" tickFormatter={(v) => new Date(v).toLocaleString()} />
                  <YAxis />
                  <Tooltip formatter={v => `$${v}`} />
                  <Line type="monotone" dataKey="valor" stroke="#2ecc71" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}

            <h5 style={{ marginTop: 16 }}>Histórico (lista)</h5>
            {(!historico || historico.length === 0) ? (
              <div style={{ color: 'orange' }}>Sin histórico suficiente</div>
            ) : (
              <div className="table-responsive">
                <ul className="list-compact">
                  {historico.map((h, i) => (
                    <li key={i}>${h.valor} el {new Date(h.fecha).toLocaleString()}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
