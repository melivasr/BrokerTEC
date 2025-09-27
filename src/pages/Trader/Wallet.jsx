import React, { useEffect, useState } from "react";
import { getWallet, recargarWallet } from "../../services/walletService";

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [monto, setMonto] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchWallet() {
      try {
        const data = await getWallet();
        setWallet(data);
      } catch (err) {
        setError(err);
      }
    }
    fetchWallet();
  }, []);

  const handleRecargar = async (e) => {
    e.preventDefault();
    try {
      await recargarWallet(parseFloat(monto));
      alert("Recarga exitosa");
      setMonto("");
      const data = await getWallet(); // refrescar wallet
      setWallet(data);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div>
      <h2>Mi Wallet</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {wallet ? (
        <div>
          <p>Saldo: ${wallet.saldo}</p>
          <p>Categoría: {wallet.categoria}</p>
          <p>Límite diario: ${wallet.limite_diario}</p>
          <p>Consumo de hoy: ${wallet.consumo_diario}</p>

          <h3>Historial de recargas</h3>
          <ul>
            {wallet.recargas.map((r) => (
              <li key={r.recarga_id}>
                +${r.monto} el {new Date(r.fecha_hora).toLocaleString()}
              </li>
            ))}
          </ul>

          <form onSubmit={handleRecargar}>
            <label>Monto a recargar</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
            <button type="submit">Recargar</button>
          </form>
        </div>
      ) : (
        <p>Cargando wallet...</p>
      )}
    </div>
  );
}
