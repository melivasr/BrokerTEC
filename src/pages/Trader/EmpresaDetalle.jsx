import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import empresaService from "../../services/empresaService";
import Sidebar from "../../components/Sidebar";

export default function EmpresaDetalle() {
  const { empresaId } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [error, setError] = useState("");
  const [favorita, setFavorita] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setError("");
      try {
        // Suponiendo que empresaService.getDetalleEmpresa retorna todos los datos necesarios
        const data = await empresaService.getDetalleEmpresa(empresaId);
        setEmpresa(data.empresa);
        setHistorico(data.historico);
        setFavorita(data.favorita || false);
      } catch (err) {
        setError(err?.message || "Error al cargar empresa");
      }
    }
    fetchData();
  }, [empresaId]);

  const handleOperar = () => {
    navigate(`/trader/operar?empresa=${empresaId}`);
  };

  const handleFavorita = async () => {
    try {
      await empresaService.marcarFavorita(empresaId);
      setFavorita(true);
    } catch (err) {
      setError("No se pudo marcar como favorita");
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Trader" />
      <main style={{ padding: 24, width: "100%" }}>
        <h2>Detalle de Empresa</h2>
        {error && <div style={{ color: "red" }}>{error}</div>}
        {!empresa ? (
          <div>Cargando datos...</div>
        ) : (
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 2px 8px #eee", maxWidth: 700 }}>
            <h3>{empresa.nombre} ({empresa.ticker})</h3>
            <p><b>Precio actual:</b> ${empresa.precio_actual}</p>
            <p><b>Cantidad de acciones totales:</b> {empresa.cantidad_acciones_totales}</p>
            <p><b>Acciones disponibles (Tesorería):</b> {empresa.acciones_disponibles !== null ? empresa.acciones_disponibles : <span style={{ color: 'orange' }}>Inventario no disponible</span>}</p>
            <p><b>Capitalización actual:</b> ${empresa.capitalizacion}</p>
            <p><b>Mayor tenedor:</b> {empresa.mayor_tenedor === 'Tesoreria' ? 'administracion' : empresa.mayor_tenedor_alias}</p>
            <button onClick={handleOperar} style={{ marginRight: 12 }}>Operar</button>
            <button onClick={handleFavorita} disabled={favorita}>{favorita ? 'Favorita' : 'Marcar como favorita'}</button>
            <hr style={{ margin: '24px 0' }} />
            <h4>Histórico de precios</h4>
            {historico.length === 0 ? (
              <div style={{ color: 'orange' }}>Sin histórico suficiente</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={historico}>
                  <XAxis dataKey="fecha" />
                  <YAxis dataKey="valor" />
                  <Tooltip formatter={v => `$${v}`} />
                  <Line type="monotone" dataKey="valor" stroke="#2ecc71" />
                </LineChart>
              </ResponsiveContainer>
            )}
            <ul style={{ marginTop: 16 }}>
              {historico.map((h, i) => (
                <li key={i}>${h.valor} el {h.fecha}</li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
