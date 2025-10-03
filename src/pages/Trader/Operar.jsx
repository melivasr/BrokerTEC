<<<<<<< Updated upstream
=======
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import * as empresaService from "../../services/empresaService";
import { getWallet } from "../../services/walletService";

export default function Operar() {
  const [searchParams] = useSearchParams();
  const empresaId = searchParams.get("empresa");
  const [empresa, setEmpresa] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [accion, setAccion] = useState("Compra");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setError("");
      try {
        const e = await empresaService.getDetalleEmpresa(empresaId);
        setEmpresa(e.empresa);
  const w = await getWallet();
        setWallet(w);
      } catch (err) {
        setError("Error al cargar datos");
      }
    }
    fetchData();
  }, [empresaId]);

  if (!empresa || !wallet) return <div>Cargando...</div>;

  // Calcular máximo comprable
  const maxPorCash = Math.floor(wallet.saldo / empresa.precio_actual);
  const maxPorInventario = empresa.acciones_disponibles;
  const maxComprable = Math.min(maxPorCash, maxPorInventario);
  const maxVendible = empresa.posicion_usuario || 0;

  const handleOperar = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const cant = Number(cantidad);
    if (!cant || cant <= 0) {
      setError("Ingrese una cantidad válida");
      setLoading(false);
      return;
    }
    if (accion === "Compra") {
      if (maxComprable === 0) {
        setError("Saldo insuficiente o inventario insuficiente");
        setLoading(false);
        return;
      }
      if (cant > maxComprable) {
        setError("No puede comprar más de lo permitido");
        setLoading(false);
        return;
      }
      // Llamar al backend para comprar
      try {
        await empresaService.comprarAcciones(empresaId, cant);
        setSuccess("Compra realizada");
      } catch (err) {
        setError(err?.message || "Error en la compra");
      }
    } else {
      if (maxVendible === 0) {
        setError("Posición insuficiente");
        setLoading(false);
        return;
      }
      if (cant > maxVendible) {
        setError("No puede vender más de lo que tiene");
        setLoading(false);
        return;
      }
      // Llamar al backend para vender
      try {
        await empresaService.venderAcciones(empresaId, cant);
        setSuccess("Venta realizada");
      } catch (err) {
        setError(err?.message || "Error en la venta");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Trader" />
      <main style={{ padding: 24, width: "100%" }}>
        <h2>Operar Empresa</h2>
        <div style={{ background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 2px 8px #eee", maxWidth: 500 }}>
          <p><b>Empresa:</b> {empresa.nombre} ({empresa.ticker})</p>
          <p><b>Precio actual:</b> ${empresa.precio_actual}</p>
          <p><b>Acciones disponibles:</b> {empresa.acciones_disponibles}</p>
          <p><b>Saldo en wallet:</b> ${wallet.saldo}</p>
          <p><b>Posición actual:</b> {empresa.posicion_usuario || 0}</p>
          <form onSubmit={handleOperar} style={{ marginTop: 24 }}>
            <label>Acción:</label>
            <select value={accion} onChange={e => setAccion(e.target.value)} style={{ marginBottom: 12 }}>
              <option value="Compra">Comprar</option>
              <option value="Venta">Vender</option>
            </select>
            <label>Cantidad:</label>
            <input
              type="number"
              min="1"
              max={accion === "Compra" ? maxComprable : maxVendible}
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              style={{ width: '100%', padding: 8, marginBottom: 12 }}
              required
            />
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
              {loading ? 'Procesando...' : accion}
            </button>
          </form>
          {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
          {success && <div style={{ color: 'green', marginTop: 10 }}>{success}</div>}
        </div>
      </main>
    </div>
  );
}
>>>>>>> Stashed changes
