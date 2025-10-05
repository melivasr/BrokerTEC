import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import * as empresaService from "../../services/empresaService";
import { getWallet } from "../../services/walletService";

export default function Portafolio() {
  const [posiciones, setPosiciones] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cantidadVenta, setCantidadVenta] = useState({});
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        // Suponiendo que empresaService.getPortafolio retorna posiciones y datos de empresa
        const data = await empresaService.getPortafolio();
        setPosiciones(data.posiciones);
  const w = await getWallet();
        setWallet(w);
      } catch (err) {
        setError(err?.message || "Error al cargar portafolio");
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleVender = async (empresa_id) => {
    setError("");
    setSuccess("");
    const cantidad = Number(cantidadVenta[empresa_id]);
    if (!cantidad || cantidad <= 0) {
      setError("Ingrese una cantidad válida");
      return;
    }
    try {
      await empresaService.venderAcciones(empresa_id, cantidad);
      setSuccess("Venta realizada");
      setCantidadVenta({ ...cantidadVenta, [empresa_id]: "" });
      // Refrescar datos
      const data = await empresaService.getPortafolio();
      setPosiciones(data.posiciones);
  const w = await getWallet();
      setWallet(w);
    } catch (err) {
      setError(err?.message || "Error en la venta");
    }
  };

  if (loading) return <div>Cargando...</div>;

  // Calcular totales
  const totalCartera = posiciones.reduce((acc, p) => acc + (p.valor_actual || 0), 0);
  const totalWallet = wallet ? wallet.saldo : 0;
  const totalGeneral = totalCartera + totalWallet;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Trader" />
      <main style={{ padding: 24, width: "100%" }}>
        <h2>Mi Portafolio</h2>
        {error && <div style={{ color: "red" }}>{error}</div>}
        {success && <div style={{ color: "green" }}>{success}</div>}
        <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee', marginBottom: 24 }}>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Mercado</th>
              <th>Cantidad</th>
              <th>Costo Promedio</th>
              <th>Precio Actual</th>
              <th>Valor Actual</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {posiciones.length === 0 ? (
              <tr><td colSpan={7} style={{ color: 'orange', textAlign: 'center' }}>No tienes posiciones</td></tr>
            ) : posiciones.map((p) => (
              <tr key={p.empresa_id}>
                <td>{p.empresa_nombre}</td>
                <td>{p.mercado_nombre}</td>
                <td>{p.cantidad}</td>
                <td>${p.costo_promedio}</td>
                <td>{p.precio_actual !== null ? `$${p.precio_actual}` : <span style={{ color: 'orange' }}>datos de precio no disponibles</span>}</td>
                <td>{p.valor_actual !== null ? `$${p.valor_actual}` : <span style={{ color: 'orange' }}>datos de precio no disponibles</span>}</td>
                <td>
                  <button onClick={() => window.location.href = `/trader/operar?empresa=${p.empresa_id}`}>Comprar más</button>
                  <form style={{ display: 'inline', marginLeft: 8 }} onSubmit={e => { e.preventDefault(); handleVender(p.empresa_id); }}>
                    <input
                      type="number"
                      min="1"
                      max={p.cantidad}
                      value={cantidadVenta[p.empresa_id] || ""}
                      onChange={e => setCantidadVenta({ ...cantidadVenta, [p.empresa_id]: e.target.value })}
                      style={{ width: 60 }}
                      placeholder="Vender"
                    />
                    <button type="submit">Vender</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px #eee', maxWidth: 400 }}>
          <b>Total cartera:</b> ${totalCartera.toLocaleString()}<br/>
          <b>Total wallet:</b> ${totalWallet.toLocaleString()}<br/>
          <b>Total general:</b> ${totalGeneral.toLocaleString()}
        </div>
      </main>
    </div>
  );
}
