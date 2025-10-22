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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const data = await empresaService.getPortafolio();
        setPosiciones(data.posiciones);
        const w = await getWallet();
        setWallet(w);
      } catch (err) {
        console.error("Error loading portafolio:", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Error al cargar portafolio";
        setError(msg);
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
      const data = await empresaService.getPortafolio();
      setPosiciones(data.posiciones);
      const w = await getWallet();
      setWallet(w);
    } catch (err) {
      console.error("Error en handleVender:", err);
      const msg =
        err?.response?.data?.message || err?.message || "Error en la venta";
      setError(msg);
    }
  };

  if (loading) return <div>Cargando...</div>;

  const totalCartera = posiciones.reduce((acc, p) => acc + (p.valor_actual || 0), 0);
  const totalWallet = wallet ? wallet.saldo : 0;
  const totalGeneral = totalCartera + totalWallet;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Trader" />
      <main className="app-main">
        <h2>Mi Portafolio</h2>
        {error && <div style={{ color: "red" }}>{error}</div>}
        {success && <div style={{ color: "green" }}>{success}</div>}

        {/* ✅ Vista escritorio (tabla) */}
        {!isMobile && (
          <div className="table-responsive">
            <table className="table-card">
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
                  <tr>
                    <td colSpan={7} style={{ color: "orange", textAlign: "center" }}>
                      No tienes posiciones
                    </td>
                  </tr>
                ) : (
                  posiciones.map((p) => (
                    <tr key={p.empresa_id}>
                      <td>{p.empresa_nombre}</td>
                      <td>{p.mercado_nombre}</td>
                      <td>{p.cantidad}</td>
                      <td>${p.costo_promedio}</td>
                      <td>
                        {p.precio_actual !== null ? (
                          `$${p.precio_actual}`
                        ) : (
                          <span style={{ color: "orange" }}>
                            datos no disponibles
                          </span>
                        )}
                      </td>
                      <td>
                        {p.valor_actual !== null ? (
                          `$${p.valor_actual}`
                        ) : (
                          <span style={{ color: "orange" }}>
                            datos no disponibles
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() =>
                            (window.location.href = `/trader/operar/${p.empresa_id}`)
                          }
                          className="small-hide-mobile"
                        >
                          Comprar más
                        </button>
                        <form
                          className="inline-form"
                          style={{ display: "inline", marginLeft: 8 }}
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleVender(p.empresa_id);
                          }}
                        >
                          <input
                            type="number"
                            min="1"
                            max={p.cantidad}
                            value={cantidadVenta[p.empresa_id] || ""}
                            onChange={(e) =>
                              setCantidadVenta({
                                ...cantidadVenta,
                                [p.empresa_id]: e.target.value,
                              })
                            }
                            className="form-control"
                            style={{
                              width: 80,
                              display: "inline-block",
                              verticalAlign: "middle",
                            }}
                            placeholder="Vender"
                          />
                          <button
                            type="submit"
                            className="btn-block"
                            style={{ display: "inline-block", marginLeft: 8 }}
                            disabled={
                              !cantidadVenta[p.empresa_id] ||
                              Number(cantidadVenta[p.empresa_id]) <= 0 ||
                              Number(cantidadVenta[p.empresa_id]) >
                                Number(p.cantidad)
                            }
                          >
                            Vender
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ✅ Vista móvil (cards verticales) */}
        {isMobile && (
          <div className="mobile-cards">
            {posiciones.length === 0 ? (
              <div style={{ color: "orange", textAlign: "center" }}>
                No tienes posiciones
              </div>
            ) : (
              posiciones.map((p) => (
                <div key={p.empresa_id} className="card" style={{ marginBottom: 16 }}>
                  <h3>{p.empresa_nombre}</h3>
                  <p><b>Mercado:</b> {p.mercado_nombre}</p>
                  <p><b>Cantidad:</b> {p.cantidad}</p>
                  <p><b>Costo Promedio:</b> ${p.costo_promedio}</p>
                  <p>
                    <b>Precio Actual:</b>{" "}
                    {p.precio_actual !== null
                      ? `$${p.precio_actual}`
                      : <span style={{ color: "orange" }}>no disponible</span>}
                  </p>
                  <p>
                    <b>Valor Actual:</b>{" "}
                    {p.valor_actual !== null
                      ? `$${p.valor_actual}`
                      : <span style={{ color: "orange" }}>no disponible</span>}
                  </p>
                  <div style={{ marginTop: 12 }}>
                    <button
                      onClick={() =>
                        (window.location.href = `/trader/operar/${p.empresa_id}`)
                      }
                      style={{ marginBottom: 8, width: "100%" }}
                    >
                      Comprar más
                    </button>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleVender(p.empresa_id);
                      }}
                    >
                      <input
                        type="number"
                        min="1"
                        max={p.cantidad}
                        value={cantidadVenta[p.empresa_id] || ""}
                        onChange={(e) =>
                          setCantidadVenta({
                            ...cantidadVenta,
                            [p.empresa_id]: e.target.value,
                          })
                        }
                        className="form-control"
                        placeholder="Cantidad a vender"
                      />
                      <button
                        type="submit"
                        className="btn-block"
                        disabled={
                          !cantidadVenta[p.empresa_id] ||
                          Number(cantidadVenta[p.empresa_id]) <= 0 ||
                          Number(cantidadVenta[p.empresa_id]) > Number(p.cantidad)
                        }
                      >
                        Vender
                      </button>
                      {cantidadVenta[p.empresa_id] &&
                        Number(cantidadVenta[p.empresa_id]) >
                          Number(p.cantidad) && (
                          <div style={{ color: "orange", fontSize: 12 }}>
                            Cantidad superior a la posición
                          </div>
                        )}
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="table-card" style={{ maxWidth: 400, marginTop: 24 }}>
          <b>Total cartera:</b> ${totalCartera.toLocaleString()} <br />
          <b>Total wallet:</b> ${totalWallet.toLocaleString()} <br />
          <b>Total general:</b> ${totalGeneral.toLocaleString()}
        </div>
      </main>
    </div>
  );
}
