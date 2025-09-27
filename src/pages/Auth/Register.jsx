import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register, login } from "../../services/authService";

export default function Register() {
  const [alias, setAlias] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [pais_origen, setPaisOrigen] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("Trader");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register({ alias, nombre, direccion, pais_origen, telefono, correo, password, rol });
      // Login automático tras registro
      const { user } = await login(alias, password);
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
      <h2>Registro BrokerTEC</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Alias</label>
          <input type="text" value={alias} onChange={e => setAlias(e.target.value)} required />
        </div>
        <div>
          <label>Nombre</label>
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required />
        </div>
        <div>
          <label>Dirección</label>
          <input type="text" value={direccion} onChange={e => setDireccion(e.target.value)} />
        </div>
        <div>
          <label>País de origen</label>
          <input type="text" value={pais_origen} onChange={e => setPaisOrigen(e.target.value)} />
        </div>
        <div>
          <label>Teléfono</label>
          <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} />
        </div>
        <div>
          <label>Correo</label>
          <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} required />
        </div>
        <div>
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div>
          <label>Rol</label>
          <select value={rol} onChange={e => setRol(e.target.value)} required>
            <option value="Trader">Trader</option>
            <option value="Admin">Admin</option>
            <option value="Analista">Analista</option>
          </select>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
}
