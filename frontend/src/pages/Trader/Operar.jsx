import React, { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { getDetalleEmpresa, comprarAcciones, venderAcciones, getWallet } from "../../services/traderService";
import { getCurrentUser } from "../../services/authService";

export default function Operar() {
  const [searchParams] = useSearchParams();
  const { empresaId: empresaIdParam } = useParams();
  const empresaId = empresaIdParam || searchParams.get("empresa");
  const [empresa, setEmpresa] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [accion, setAccion] = useState("Compra");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const currentUser = getCurrentUser();
  const usuarioDeshabilitado = currentUser && (currentUser.habilitado === 0 || currentUser.habilitado === false);

  useEffect(() => {
    async function fetchData() {
      setError("");
      try {
        if (!empresaId) {
          setError("ID de empresa inválido");
          return;
        }
        const e = await getDetalleEmpresa(empresaId);
        setEmpresa(e.empresa);
        const w = await getWallet();
        setWallet(w);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Error al cargar datos";
        setError(msg);
      }
    }
    fetchData();
  }, [empresaId]);

  if (!empresa || !wallet) {
    if (error) {
      return (
        <div style={{ display: "flex" }}>
          <Sidebar rol="Trader" />
          <main className="app-main">
            <h2>Operar Empresa</h2>
            <div style={{ color: "red" }}>{error}</div>
          </main>
        </div>
      );
    }
    return <div>Cargando...</div>;
  }

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
      if (!empresa.precio_actual) {
        setError("inventario no disponible");
        setLoading(false);
        return;
      }
      // Verificar primero si hay inventario disponible
      if (cantidad > maxPorInventario) {
        setError("inventario insuficiente");
        setLoading(false);
        return;
      }
      // Luego verificar si hay saldo suficiente
      if (maxComprable < cantidad) {
        setError("saldo insuficiente");
        setLoading(false);
        return;
      }
      if (maxComprable <= 0) {
        setError("saldo insuficiente");
        setLoading(false);
        return;
      }
      try {
        if (usuarioDeshabilitado) {
          setError('Cuenta deshabilitada: no puedes realizar compras');
          setLoading(false);
          return;
        }
        const res = await comprarAcciones(empresaId, cant);
        setSuccess(res?.message || "Compra realizada");
        setCantidad("");
        const e = await getDetalleEmpresa(empresaId);
        setEmpresa(e.empresa);
        const w = await getWallet();
        setWallet(w);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Error en la compra";
        setError(msg);
      }
    } else {
      if (maxVendible <= 0) {
        setError("posición insuficiente");
        setLoading(false);
        return;
      }
      if (cant > maxVendible) {
        setError("posición insuficiente");
        setLoading(false);
        return;
      }
      try {
        if (usuarioDeshabilitado) {
          setError('Cuenta deshabilitada: no puedes realizar ventas');
          setLoading(false);
          return;
        }
        const res = await venderAcciones(empresaId, cant);
        setSuccess(res?.message || "Venta realizada");
        setCantidad("");
        const e = await getDetalleEmpresa(empresaId);
        setEmpresa(e.empresa);
        const w = await getWallet();
        setWallet(w);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Error en la venta";
        setError(msg);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Trader" />
      <main className="app-main">
        <h2>Operar Empresa</h2>
        <div className="card small">
          <p><b>Empresa:</b> {empresa.nombre} ({empresa.ticker})</p>
          <p><b>Precio actual:</b> ${empresa.precio_actual}</p>
          <p><b>Acciones disponibles:</b> {empresa.acciones_disponibles}</p>
          <p><b>Saldo en wallet:</b> ${wallet.saldo}</p>
          <p><b>Posición actual:</b> {empresa.posicion_usuario || 0}</p>
          <p>
            <b>{accion === "Compra" ? "Máximo comprable" : "Máximo vendible"}:</b>{" "}
            {accion === "Compra" ? maxComprable : maxVendible}
          </p>

          <form onSubmit={handleOperar} style={{ marginTop: 24 }}>
            <label>Acción:</label>
            <select
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              className="form-control"
            >
              <option value="Compra">Comprar</option>
              <option value="Venta">Vender</option>
            </select>

            <label>Cantidad:</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="form-control"
              placeholder="Ingrese la cantidad"
              required
            />

            <button type="submit" disabled={loading} className="btn-block">
              {loading ? "Procesando..." : accion}
            </button>
          </form>

          {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
          {success && <div style={{ color: "green", marginTop: 10 }}>{success}</div>}
        </div>
      </main>
    </div>
  );
}
