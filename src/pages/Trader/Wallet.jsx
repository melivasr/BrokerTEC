import React, { useEffect, useState } from "react";
import { getWallet, recargarWallet } from "../../services/walletService";

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [monto, setMonto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setError("");
    setSuccess("");
    if (!monto || isNaN(monto) || Number(monto) <= 0) {
      setError("Monto inválido");
      return;
    }
    // Validar límite diario
    const limiteRestante = wallet.limite_diario - wallet.consumo_diario;
    if (Number(monto) > limiteRestante) {
      setError("Se alcanzó el límite diario");
      return;
    }
    setLoading(true);
    try {
      const id = JSON.parse(localStorage.getItem('user'))?.id;
      if (!id) {
        setError('No se encontró el usuario.');
        setLoading(false);
        return;
      }
      await recargarWallet(id, Number(monto));
      setSuccess('Recarga exitosa');
      setMonto("");
      const data = await getWallet(); // refrescar wallet
      setWallet(data);
    } catch (err) {
      setError('Error al recargar: ' + (err?.message || 'Intente de nuevo'));
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2>Mi Wallet</h2>
      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 10 }}>{success}</div>}
      {wallet ? (
        <div>
          <p><b>Saldo:</b> ${wallet.saldo}</p>
          <p><b>Categoría:</b> {wallet.categoria}</p>
          <p><b>Límite diario:</b> ${wallet.limite_diario}</p>
          <p><b>Consumo de hoy:</b> ${wallet.consumo_diario}</p>

          <h3>Historial de recargas</h3>
          <ul>
            {wallet.recargas.map((r) => (
              <li key={r.recarga_id}>
                +${r.monto} el {new Date(r.fecha_hora).toLocaleString()}
              </li>
            ))}
          </ul>

          <form onSubmit={handleRecargar} style={{ marginTop: 24 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Monto a recargar</label>
            <input
              type="number"
              min="1"
              max={wallet.limite_diario - wallet.consumo_diario}
              step="0.01"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder={`Máximo: $${(wallet.limite_diario - wallet.consumo_diario).toFixed(2)}`}
              style={{ width: '100%', padding: 8, marginBottom: 12 }}
              required
            />
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
              {loading ? 'Procesando...' : 'Recargar'}
            </button>
            <div style={{ marginTop: 8, color: '#555' }}>
              Límite restante hoy: ${ (wallet.limite_diario - wallet.consumo_diario).toFixed(2) }
            </div>
          </form>
        </div>
      ) : (
        <p>Cargando wallet...</p>
      )}
    </div>
  );
}
