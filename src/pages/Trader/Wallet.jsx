import React, { useEffect, useState } from "react";
import { getWallet, recargarWallet } from "../../services/walletService";
import Sidebar from "../../components/Sidebar";

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [monto, setMonto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bloqueoRestante, setBloqueoRestante] = useState(null);

  function formatDuration(ms) {
    if (!ms || ms <= 0) return '00:00:00';
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600).toString().padStart(2, '0');
    const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  useEffect(() => {
      async function fetchWallet() {
        try {
          const data = await getWallet();
          setWallet(data);
        } catch (err) {
          // err puede ser string o Error. Preferir campo 'error' (detalle) si viene del backend para depuración
            setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || String(err));
        }
      }
      fetchWallet();
  }, []);

  // Manejar contador de bloqueo si existe bloqueo_hasta
  useEffect(() => {
    let timer = null;
    if (wallet?.bloqueo_hasta) {
      const update = () => {
        const ahora = new Date();
        const fin = new Date(wallet.bloqueo_hasta);
        const diff = fin - ahora;
        if (diff <= 0) {
          setBloqueoRestante(0);
          // refrescar wallet para quitar bloqueo
          getWallet().then(data => setWallet(data)).catch(() => {});
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
          return;
        }
        setBloqueoRestante(diff);
      };
      update();
      timer = setInterval(update, 1000);
    } else {
      setBloqueoRestante(null);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [wallet?.bloqueo_hasta]);

  const handleRecargar = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
      if (!monto || isNaN(monto) || Number(monto) <= 0) {
        setError("monto inválido");
      return;
    }
    // Validar límite diario
      if (!wallet) {
        setError('No se pudo obtener la wallet');
        return;
      }
      const limiteRestante = wallet.limite_diario - wallet.consumo_diario;
      if (Number(monto) > limiteRestante) {
        setError("se alcanzó el límite diario");
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
      const resp = await recargarWallet(id, Number(monto));
      // resp puede contener bloqueo_hasta, saldo, consumo_diario, recargas
      setSuccess('Recarga exitosa');
      setMonto("");
      if (resp) {
        // Normalizar nombres posibles
        const newWallet = {
          ...wallet,
          saldo: resp.saldo !== undefined ? resp.saldo : wallet?.saldo,
          consumo_diario: resp.consumo_diario !== undefined ? resp.consumo_diario : wallet?.consumo_diario,
          bloqueo_hasta: resp.bloqueo_hasta !== undefined ? resp.bloqueo_hasta : wallet?.bloqueo_hasta,
          recargas: resp.recargas !== undefined ? resp.recargas : wallet?.recargas,
        };
        setWallet(newWallet);
      } else {
        const data = await getWallet(); // refrescar wallet
        setWallet(data);
      }
    } catch (err) {
        const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || String(err);
        setError(msg);
        // Si el backend respondió con bloqueo_hasta en error (por ejemplo: 'bloqueado') actualizar estado para mostrar contador
        const bloqueo = err?.response?.data?.bloqueo_hasta;
        if (bloqueo) {
          setWallet(prev => ({ ...(prev || {}), bloqueo_hasta: bloqueo }));
        }
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar rol="Trader" />
      <main className="app-main">
        <div className="card small">
          <h2>Mi Wallet</h2>
      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 10 }}>{success}</div>}
      {wallet ? (
        <div>
          <p><b>Saldo:</b> ${wallet.saldo}</p>
          <p><b>Categoría:</b> {wallet.categoria}</p>
          <p><b>Límite diario:</b> ${wallet.limite_diario}</p>
          <p><b>Consumo de hoy:</b> ${wallet.consumo_diario}</p>
          {wallet.bloqueo_hasta && bloqueoRestante > 0 && (
            <div style={{ marginTop: 8, color: '#b33' }}>
              Has alcanzado el límite diario. Podrás recargar en: {new Date(wallet.bloqueo_hasta).toLocaleString()} (restan {formatDuration(bloqueoRestante)})
            </div>
          )}

          <h3>Historial de recargas</h3>
          <div className="table-responsive">
            <ul className="list-compact">
              {(wallet.recargas || []).map((r) => (
                <li key={r.recarga_id || Math.random()}>
                  +${r.monto} el {new Date(r.fecha_hora).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleRecargar} style={{ marginTop: 24 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Monto a recargar</label>
            <input
              type="number"
              min="1"
              max={wallet.limite_diario - wallet.consumo_diario}
              step="1"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder={`Máximo: $${(wallet.limite_diario - wallet.consumo_diario).toFixed(2)}`}
              className="form-control"
              required
              disabled={!!(wallet.bloqueo_hasta && bloqueoRestante > 0)}
            />
            <button type="submit" disabled={loading || !!(wallet.bloqueo_hasta && bloqueoRestante > 0)} className="btn-block">
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
      </main>
    </div>
  );
}