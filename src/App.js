
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import logo from './logo.svg';
import HomeTrader from './pages/Trader/HomeTrader';
import Catalogos from './pages/Admin/Catalogos';
import ReportesEmpresa from './pages/Analista/ReportesEmpresa';


function App() {
  return (
    <Router>
      <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <img src={logo} alt="Logo" style={{ width: 120, marginBottom: 16 }} />
        <h1 style={{ marginBottom: 24 }}>BrokerTEC</h1>
        <nav style={{ marginBottom: 24 }}>
          <Link to="/login" style={{ marginRight: 16 }}>Iniciar sesión</Link>
          <Link to="/register">Registrarse</Link>
        </nav>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Dashboards por rol */}
          <Route path="/trader/home" element={<HomeTrader />} />
          <Route path="/admin/catalogos" element={<Catalogos />} />
          <Route path="/analista/empresa" element={<ReportesEmpresa />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
