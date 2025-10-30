import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { getCurrentUser } from "../../services/authService";
import { getHomeTraderData, getFavoritas } from "../../services/traderService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";

export default function HomeTrader() {
  const [user, setUser] = useState(null);
  const [mercados, setMercados] = useState([]);
  const [favoritas, setFavoritas] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
  }, []);

  const usuarioDeshabilitado = user && (user.habilitado === 0 || user.habilitado === false);

  useEffect(() => {
    if (!user) {
      setError("Usuario no autenticado");
      setLoading(false);
      return;
    }
    if (!user.id) {
      setError("ID de usuario inválido");
      setLoading(false);
      return;
    }
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const data = await getHomeTraderData(user.id);
        if (Array.isArray(data)) {
          setMercados(data);
          if (data.length === 0) setError("No hay mercados habilitados.");
        } else if (data && data.error) {
          setError(data.error);
          setMercados(data.mercados || []);
        } else {
          setError("Respuesta inesperada del servidor");
        }
        // traer favoritas del usuario
        try {
          const fav = await getFavoritas();
          setFavoritas(fav || []);
        } catch (e) {
          console.warn('[HomeTrader] Unable to load favorites:', e?.message);
        }
      } catch (err) {
        console.error('[HomeTrader] Error loading market data:', err?.message);
        setError(err?.response?.data?.message || err?.message || "Error al cargar datos de mercado");
      }
      setLoading(false);
    }
    fetchData();
    
  }, [user]);

  if (!user) return <div>Cargando usuario...</div>;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol={user.rol} />
      <main className="app-main">
        <h2>Portada del Trader</h2>
        {favoritas && favoritas.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <h3>Empresas favoritas</h3>
            <ul>
              {favoritas.map(f => (
                <li key={f.id} style={{ marginBottom: 8 }}>
                  <b>{f.nombre}</b> ({f.ticker}) - Precio: ${f.precio_actual ?? 'N/A'}
                  <button onClick={() => window.location.href = `/trader/empresa/${f.id}`} style={{ marginLeft: 8, marginBottom: 8 }} className="btn-block">Ver</button>
                  <button onClick={() => window.location.href = `/trader/operar/${f.id}`} style={{ marginLeft: 8 }} className="btn-block" disabled={usuarioDeshabilitado}>Operar</button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {loading && <p>Cargando datos...</p>}
        {error && <div style={{ color: "red" }}>{error}</div>}
        {!loading && !error && mercados.length === 0 && <div>No hay mercados habilitados.</div>}
        {mercados.map((mercado, idx) => (
          <section key={mercado.mercado?.id || idx} style={{ marginBottom: 40 }}>
            <h3>{mercado.mercado?.nombre || mercado.mercado || "Mercado"}</h3>
            {(!mercado.empresas || mercado.empresas.length === 0) ? (
              <div style={{ color: "orange" }}>sin datos de capitalización</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[...mercado.empresas].slice(0, 5)}
                  layout="vertical"
                  margin={{ left: 40, right: 40 }}
                >
                  <XAxis type="number" dataKey="capitalizacion" tickFormatter={v => `$${v?.toLocaleString?.() ?? v}`}/>
                  <YAxis type="category" dataKey="nombre" width={120} />
                  <Tooltip formatter={(value) => `$${value?.toLocaleString?.() ?? value}`}/>
                  <Bar dataKey="capitalizacion" fill="#3498db">
                    <LabelList dataKey="ticker" position="right" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <ul style={{ marginTop: 16 }}>
              {mercado.empresas?.map((e) => (
                <li key={e.id} style={{ marginBottom: 8 }}>
                  <b>{e.nombre}</b> ({e.ticker}) - Capitalización: ${e.capitalizacion?.toLocaleString?.() ?? 'N/A'}<br/>
                  Precio actual: ${e.precio_actual ?? e.precio ?? 'N/A'} | Variación: {e.variacion !== null && e.variacion !== undefined ? (e.variacion > 0 ? '+' : '') + e.variacion : 'N/A'}<br/>
                  <button onClick={() => window.location.href = `/trader/empresa/${e.id}`} style={{ marginBottom: 8, marginLeft: 8 }} className="btn-block">Ver Empresa</button>
                  <button onClick={() => window.location.href = `/trader/operar/${e.id}`} style={{ marginLeft: 8 }} className="btn-block" disabled={usuarioDeshabilitado}>Operar</button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}