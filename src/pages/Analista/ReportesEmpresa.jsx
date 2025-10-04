// src/pages/Analista/ReportesEmpresa.jsx
import React from "react";
import Sidebar from "../../components/Sidebar";
export default function ReportesEmpresa() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Analista" />
      <main style={{ padding: 24 }}>
        <h2>Dashboard Analista: Reportes Empresa</h2>
      </main>
    </div>
  );
}