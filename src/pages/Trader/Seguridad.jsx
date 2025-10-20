import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { getCurrentUser } from "../../services/authService";
import * as empresaService from "../../services/empresaService";

export default function Seguridad() {
  const [user, setUser] = useState(null);
  const [lastAccess, setLastAccess] = useState("");
  const [password, setPassword] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setUser(getCurrentUser());
    // Suponiendo que empresaService.getLastAccess() retorna el último acceso
    async function fetchLastAccess() {
      try {
        const data = await empresaService.getLastAccess();
        setLastAccess(data.lastAccess);
      } catch {
        setLastAccess("");
      }
    }
    fetchLastAccess();
  }, []);

  const handleLiquidar = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await empresaService.liquidarTodo({ id: user.id, password });
      setSuccess("Liquidación exitosa. Todas tus posiciones han sido vendidas.");
      setPassword("");
      setConfirming(false);
    } catch (err) {
      setError(err?.message || "contraseña incorrecta");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Trader" />
      <main style={{ padding: 24, width: "100%" }}>
        <h2>Seguridad</h2>

        <div className="card" style={{ maxWidth: 500 }}>
          <h3>Acciones sensibles</h3>
          <p><b>Último acceso:</b> {lastAccess ? lastAccess : "No disponible"}</p>
          <hr style={{ margin: '24px 0' }} />
          <h4>Liquidar todo</h4>
          <p>Esta acción venderá todas tus posiciones al precio actual. Es irreversible y será auditada.</p>
          {!confirming ? (
            <button onClick={() => setConfirming(true)} style={{ background: 'red', color: 'white', padding: '10px 20px' }}>
              Liquidar todo
            </button>
          ) : (
            <form onSubmit={handleLiquidar}>
              <label>Reingresa tu contraseña para confirmar:</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: 8, marginBottom: 12 }}
              />
              <button type="submit" disabled={loading} style={{ background: 'red', color: 'white', padding: '10px 20px' }}>
                {loading ? 'Procesando...' : 'Confirmar liquidación'}
              </button>
              <button type="button" onClick={() => setConfirming(false)} style={{ marginLeft: 12 }}>
                Cancelar
              </button>
            </form>
          )}
          {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
          {success && <div style={{ color: 'green', marginTop: 10 }}>{success}</div>}
        </div>

      </main>
    </div>
  );
}