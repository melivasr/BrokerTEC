import React from "react";
import { Link } from "react-router-dom";

const options = {
  Admin: [
    { name: "Catálogos", path: "/admin/catalogos" },
    { name: "Precios", path: "/admin/precios" },
    { name: "Reportes", path: "/admin/reportes" },
    { name: "Usuarios y Cuentas", path: "/admin/usuarios-cuentas" },
    { name: "Perfil", path: "/perfil" },
  ],
  Analista: [
    { name: "Estadísticas", path: "/analista/estadisticas" },
    { name: "Reportes Empresa", path: "/analista/empresa" },
    { name: "Reportes Usuario", path: "/analista/usuario" },
    { name: "Perfil", path: "/perfil" },
  ],
  Trader: [
    { name: "Home", path: "/trader/home" },
    { name: "Operar", path: "/trader/operar" },
    { name: "Portafolio", path: "/trader/portafolio" },
    { name: "Wallet", path: "/trader/wallet" },
    { name: "Seguridad", path: "/trader/seguridad" },
  // Para navegación dinámica, puedes usar un ejemplo o dejar la opción para seleccionar empresa
  { name: "Empresa Detalle", path: "/trader/empresa/1" },
    { name: "Perfil", path: "/perfil" },
  ],
};

export default function Sidebar({ rol }) {
  return (
    <aside
      style={{
        width: 220,
        background: "#f0f0f0",
        padding: 20,
        minHeight: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        borderRight: "1px solid #ddd",
        zIndex: 100,
      }}
    >
      <h3>Opciones</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {options[rol]?.map((opt) => (
          <li key={opt.path} style={{ margin: "16px 0" }}>
            <Link to={opt.path}>{opt.name}</Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}