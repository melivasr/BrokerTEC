// src/pages/Admin/Catalogos.jsx
import React from "react";
import Sidebar from "../../components/Sidebar";
export default function Catalogos() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Admin" />
      <main style={{ padding: 24 }}>
        <h2>Dashboard Admin: Catálogos</h2>
      </main>
    </div>
  );
}