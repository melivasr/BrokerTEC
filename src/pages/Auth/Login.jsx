import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/authService";

export default function Login() {
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { user } = await login(alias, password);

      // Redirigir según rol
      if (user.rol === "Trader") navigate("/trader/home");
      else if (user.rol === "Admin") navigate("/admin/catalogos");
      else if (user.rol === "Analista") navigate("/analista/empresa");
      else navigate("/perfil");
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>Login BrokerTEC</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Alias</label>
          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">Iniciar sesión</button>
      </form>
    </div>
  );
}
