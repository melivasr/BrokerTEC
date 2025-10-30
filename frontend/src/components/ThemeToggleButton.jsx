import React, { useEffect, useState } from "react";

export default function ThemeToggleButton() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (dark) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 9999,
        padding: "12px 20px",
        borderRadius: 24,
        border: "none",
        background: dark ? "#222" : "#eee",
        color: dark ? "#fff" : "#222",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: 16,
        transition: "background 0.2s, color 0.2s"
      }}
      aria-label="Cambiar modo oscuro/claro"
      className="theme-toggle"
    >
      <span className="theme-text">{dark ? "🌙 Modo Oscuro" : "☀️ Modo Claro"}</span>
      <span className="theme-emoji">{dark ? "🌙" : "☀️"}</span>
    </button>
  );
}
