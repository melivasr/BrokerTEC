import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Auth/Login";
import ProtectedRoute from "./pages/Auth/ProtectedRoute";

import Perfil from "./pages/Common/Perfil";

import HomeTrader from "./pages/Trader/HomeTrader";
import EmpresaDetalle from "./pages/Trader/EmpresaDetalle";
import Operar from "./pages/Trader/Operar";
import Wallet from "./pages/Trader/Wallet";
import Portafolio from "./pages/Trader/Portafolio";
import Seguridad from "./pages/Trader/Seguridad";

import Catalogos from "./pages/Admin/Catalogos";
import Precios from "./pages/Admin/Precios";
import UsuariosCuentas from "./pages/Admin/UsuariosCuentas";
import ReportesAdmin from "./pages/Admin/ReportesAdmin";

import ReportesEmpresa from "./pages/Analista/ReportesEmpresa";
import ReportesUsuario from "./pages/Analista/ReportesUsuario";
import Estadisticas from "./pages/Analista/Estadisticas";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Rutas protegidas por rol */}
        <Route element={<ProtectedRoute role="Trader" />}>
          <Route path="/trader/home" element={<HomeTrader />} />
          <Route path="/trader/empresa/:id" element={<EmpresaDetalle />} />
          <Route path="/trader/operar/:id" element={<Operar />} />
          <Route path="/trader/wallet" element={<Wallet />} />
          <Route path="/trader/portafolio" element={<Portafolio />} />
          <Route path="/trader/seguridad" element={<Seguridad />} />
        </Route>

        <Route element={<ProtectedRoute role="Admin" />}>
          <Route path="/admin/catalogos" element={<Catalogos />} />
          <Route path="/admin/precios" element={<Precios />} />
          <Route path="/admin/usuarios" element={<UsuariosCuentas />} />
          <Route path="/admin/reportes" element={<ReportesAdmin />} />
        </Route>

        <Route element={<ProtectedRoute role="Analista" />}>
          <Route path="/analista/empresa" element={<ReportesEmpresa />} />
          <Route path="/analista/usuario" element={<ReportesUsuario />} />
          <Route path="/analista/estadisticas" element={<Estadisticas />} />
        </Route>

        {/* Vista común */}
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </BrowserRouter>
  );
}
