import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import * as empresaService from "../../services/empresaService";
import Sidebar from "../../components/Sidebar";

export default function EmpresaDetalle() {
  const { id, empresaId } = useParams();
  const companyId = id || empresaId;
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [error, setError] = useState("");
  const [favorita, setFavorita] = useState(false);

  // Nota: no hacer early return antes de los hooks para cumplir la regla de hooks.

  useEffect(() => {
    async function fetchData() {
      setError("");
      if (!companyId) {
        setError('ID de empresa inválido');
        return;
      }
      try {
        const data = await empresaService.getDetalleEmpresa(companyId);
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
  await empresaService.marcarFavorita(companyId);
      setFavorita(true);
    } catch (err) {
      setError('No se pudo marcar como favorita');
    }
  };

  // Helpers
  const hasInventario = empresa && empresa.precio_actual !== null && empresa.acciones_disponibles !== null;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Trader" />
      <main style={{ padding: 24, width: "100%" }}>
        <h2>Detalle de Empresa</h2>
        {error && <div style={{ color: "red" }}>{error}</div>}
        {!empresa && !error ? (
          <div>Cargando datos...</div>
        ) : error ? (
          // Si hay error, no mostrar el panel de carga
          <div />
        ) : (
          <div style={{ background: "var(--card-bg)", padding: 24, borderRadius: 8, boxShadow: "0 2px 8px #eee", maxWidth: 900 }}>
            <h3>{empresa.nombre} ({empresa.ticker})</h3>

            <p><b>Precio actual:</b> {hasInventario ? `$${empresa.precio_actual}` : <span style={{ color: 'orange' }}>Inventario no disponible</span>}</p>
            <p><b>Cantidad de acciones totales:</b> {empresa.cantidad_acciones_totales ?? 'N/A'}</p>
            <p><b>Acciones disponibles (Tesorería):</b> {empresa.acciones_disponibles ?? <span style={{ color: 'orange' }}>Inventario no disponible</span>}</p>
            <p><b>Capitalización actual:</b> {empresa.capitalizacion !== null ? `$${empresa.capitalizacion}` : 'N/A'}</p>
            <p><b>Mayor tenedor:</b> {empresa.mayor_tenedor_alias ? empresa.mayor_tenedor_alias : 'N/A'}</p>

            <div style={{ marginTop: 12 }}>
              <button onClick={handleOperar} style={{ marginRight: 12 }}>Operar</button>
              <button onClick={handleFavorita} disabled={favorita}>{favorita ? 'Favorita' : 'Marcar como favorita'}</button>
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
              <ul>
                {historico.map((h, i) => (
                  <li key={i}>${h.valor} el {new Date(h.fecha).toLocaleString()}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
