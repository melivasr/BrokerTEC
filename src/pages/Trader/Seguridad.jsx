import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { getCurrentUser } from "../../services/authService";
import * as empresaService from "../../services/userService";

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
    
    async function fetchLastAccess() {
      try {
        // Primero obtener el último acceso (anterior)
        const data = await empresaService.getLastAccessSeguridad();
        setLastAccess(data.lastAccess);
        
        // Luego registrar el acceso actual (será el "anterior" la próxima vez)
        await empresaService.registrarAccesoSeguridad();
      } catch {
        setLastAccess("");
      }
    }
    
    fetchLastAccess();
  }, []);

  const usuarioDeshabilitado = user && (user.habilitado === 0 || user.habilitado === false);

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
    // Extraer el mensaje correcto del error de axios
    const errorMessage = err?.response?.data?.message || err?.message || "Error desconocido";
    setError(errorMessage);
  }
  setLoading(false);
};

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Trader" />
      <main className="app-main">
        <h2>Seguridad</h2>

        <div className="card" style={{ maxWidth: 500 }}>
          <h3>Acciones sensibles</h3>
          <p><b>Último acceso:</b> {lastAccess ? lastAccess : "No disponible"}</p>
          <hr style={{ margin: '24px 0' }} />
          <h4>Liquidar todo</h4>
          <p>Esta acción venderá todas tus posiciones al precio actual. Es irreversible y será auditada.</p>
          {!confirming ? (
            <button onClick={() => setConfirming(true)} style={{ background: 'red', color: 'white' }} className="btn-block" disabled={usuarioDeshabilitado}>
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
                className="form-control"
              />
              <button type="submit" disabled={loading} style={{ background: 'red', color: 'white' }} className="btn-block">
                {loading ? 'Procesando...' : 'Confirmar liquidación'}
              </button>
              <button type="button" onClick={() => setConfirming(false)} style={{ marginTop: 8 }} className="btn-block">
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