import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../services/authService";
import logo from "../../logo.svg";

export default function Login() {
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const aliasTrim = alias.trim();
    if (!aliasTrim || !password) {
      setError("Debes ingresar tus datos válidos.");
      return;
    }

    setLoading(true);
    try {
      const { user } = await login(aliasTrim, password);

      if (user?.rol === "Trader") navigate("/trader/home");
      else if (user?.rol === "Admin") navigate("/admin/catalogos");
      else if (user?.rol === "Analista") navigate("/analista/empresa");
      else navigate("/perfil");
    } catch (err) {
      let msg = "Usuario o contraseña incorrectos.";
      if (typeof err === "string") msg = err;
      else if (err?.response?.status && ![400, 401].includes(err.response.status)) {
        msg = err?.message || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleBtnStyle = {
    position: "absolute",
    right: 8,
    top: "10%",
    padding: "6px 10px",
    fontSize: 12,
    borderRadius: 6,
    background: "var(--button-bg)",
    color: "var(--button-text)",
    border: "1px solid var(--sidebar-border)",
    lineHeight: 1,
    cursor: "pointer",
  };

  return (
    <div className="app-main" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div className="container-center" style={{ width: "100%" }}>
        <div className="card" style={{ display: "grid", padding: 0, overflow: "hidden" }}>
          {/* Header con logo */}
          <div style={{ padding: 20, borderBottom: "1px solid var(--sidebar-border)", textAlign: "center" }}>
            <img src={logo} alt="BrokerTEC" style={{ height: 120, marginBottom: 8 }} />
            <h2 style={{ margin: 0 }}>Bienvenida/o a BrokerTEC</h2>
            <p style={{ margin: "6px 0 0 0", opacity: 0.8 }}>Inicia sesión para continuar</p>
          </div>

          {/* Body */}
          <div style={{ padding: 20 }}>
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: 12 }}>
                <label htmlFor="alias">Alias</label>
                <input
                  id="alias"
                  className="form-control"
                  type="text"
                  autoComplete="username"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="username"
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="password">Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    className="form-control"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="*******"
                    required
                    style={{ paddingRight: 90 }}   
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                    style={toggleBtnStyle}
                  >
                    {showPass ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="card" role="alert" aria-live="assertive" style={{ background: "rgba(220,53,69,.1)", color: "#dc3545", marginBottom: 12 }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-block" disabled={loading} style={{ width: "100%" }}>
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </button>

              <p style={{ marginTop: 12, fontSize: 14 }}>
                ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
