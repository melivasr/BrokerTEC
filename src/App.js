
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import logo from './logo.svg';
import HomeTrader from './pages/Trader/HomeTrader';
import Wallet from './pages/Trader/Wallet';
import Portafolio from './pages/Trader/Portafolio';
import EmpresaDetalle from './pages/Trader/EmpresaDetalle';
import Operar from './pages/Trader/Operar';
import Seguridad from './pages/Trader/Seguridad';
import Catalogos from './pages/Admin/Catalogos';
import ReportesEmpresa from './pages/Analista/ReportesEmpresa';
import ReportesUsuario from './pages/Analista/ReportesUsuario';
import Estadisticas from './pages/Analista/Estadisticas';
import Perfil from './pages/Common/Perfil';
import Precios from './pages/Admin/Precios';
import UsuariosCuentas from './pages/Admin/UsuariosCuentas';
import ThemeToggleButton from "./components/ThemeToggleButton";


function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Dashboards por rol */}
        <Route path="/trader/home" element={<HomeTrader />} />
        <Route path="/trader/wallet" element={<Wallet />} />
        <Route path="/trader/portafolio" element={<Portafolio />} />
        <Route path="/trader/empresa/:empresaId" element={<EmpresaDetalle />} />
  <Route path="/trader/operar/:empresaId?" element={<Operar />} />
        <Route path="/trader/seguridad" element={<Seguridad />} />
        <Route path="/admin/catalogos" element={<Catalogos />} />
        <Route path="/admin/precios" element={<Precios />} />
        <Route path="/admin/usuarios-cuentas" element={<UsuariosCuentas />} />
        <Route path="/analista/empresa" element={<ReportesEmpresa />} />
        <Route path="/analista/usuario" element={<ReportesUsuario />} />
        <Route path="/analista/estadisticas" element={<Estadisticas />} />
        {/* Perfil común */}
        <Route path="/perfil" element={<Perfil />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      <ThemeToggleButton />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;