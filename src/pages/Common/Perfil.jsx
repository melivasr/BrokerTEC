import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { getCurrentUser } from "../../services/authService";

export default function Perfil() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  if (!user) return <div>Cargando perfil...</div>;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol={user.rol} />
      <main style={{ padding: 24, marginLeft: 220, width: "100%" }}>
        <h2>Perfil de Usuario</h2>
        <div style={{ background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 2px 8px #eee", maxWidth: 500 }}>
          <h3>Datos en pantalla</h3>
          <p><b>Alias:</b> {user.alias}</p>
          {user.nombre && <p><b>Nombre:</b> {user.nombre}</p>}
          {user.correo && <p><b>Correo:</b> {user.correo}</p>}
          <p><b>Rol:</b> {user.rol}</p>
          {user.estado && <p><b>Estado:</b> {user.estado}</p>}
          {user.pais_origen && <p><b>País de origen:</b> {user.pais_origen}</p>}
          {user.direccion && <p><b>Dirección:</b> {user.direccion}</p>}
          {user.telefono && <p><b>Teléfono:</b> {user.telefono}</p>}
        </div>
      </main>
    </div>
  );
}
