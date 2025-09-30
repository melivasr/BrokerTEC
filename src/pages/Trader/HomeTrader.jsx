// src/pages/Trader/HomeTrader.jsx
import React from "react";
import Sidebar from "../../components/Sidebar";
export default function HomeTrader() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol="Trader" />
      <main style={{ padding: 24 }}>
        <h2>Dashboard Trader: Home</h2>
      </main>
    </div>
  );
}