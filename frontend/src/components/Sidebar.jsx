import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const options = {
  Admin: [
    { name: "Catálogos", path: "/admin/catalogos" },
    { name: "Precios", path: "/admin/precios" },
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
    { name: "Portafolio", path: "/trader/portafolio" },
    { name: "Wallet", path: "/trader/wallet" },
    { name: "Seguridad", path: "/trader/seguridad" },
    { name: "Perfil", path: "/perfil" },
  ],
};

export default function Sidebar({ rol }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function check() {
      const m = window.innerWidth < 768;
      setIsMobile(m);
      setIsOpen(!m); // open by default on desktop, closed on mobile
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <>
  {/* spacer to push main content on desktop */}
  {!isMobile && <div style={{ width: 200, flexShrink: 0 }} />}

  {/* Hamburger button for mobile */}
      {isMobile && (
        <button
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setIsOpen(v => !v)}
          style={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 110,
            width: 40,
            height: 40,
            borderRadius: 6,
            border: 'none',
            background: 'var(--card-bg)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
          }}
        >
          {isOpen ? '✕' : '☰'}
        </button>
      )}

      {/* overlay for mobile when open */}
      {isMobile && isOpen && (
        <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 105, background: 'rgba(0,0,0,0.3)' }} />
      )}

      <aside
        style={{
          width: 200,
          background: "var(--sidebar-bg)",
          padding: 20,
          minHeight: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          borderRight: "1px solid var(--sidebar-border)",
          zIndex: 120,
          transition: "transform 0.25s ease, background 0.3s, border-color 0.3s",
          transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none'
        }}
      >
        <h3 style={{ color: "var(--text-color)" }}>Opciones</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {options[rol]?.map((opt) => (
            <li key={opt.path} style={{ margin: "16px 0" }}>
              <Link
                to={opt.path}
                style={{
                  color: "var(--text-color)",
                  textDecoration: "none",
                }}
                onClick={() => { if (isMobile) setIsOpen(false); }}
              >
                {opt.name}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
