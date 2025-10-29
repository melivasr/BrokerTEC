import axios from "axios";
import { authHeader } from "./authService";

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Wallet
export async function getWallet() {
  try {
    const response = await axios.get(`${BASE}/api/trader/wallet`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function recargarWallet(id, monto) {
  try {
    const response = await axios.post(
      `${BASE}/api/trader/wallet/recargar`,
      { id, monto },
      { headers: authHeader() }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Empresas y mercados
export async function getMercados() {
  return (await axios.get("/api/trader/mercados", { headers: authHeader() })).data;
}

export async function venderAcciones(empresaId, cantidad) {
  const res = await axios.post(`/api/trader/empresas/${empresaId}/vender`, { cantidad }, { headers: authHeader() });
  return res.data;
}

export async function getDetalleEmpresa(empresaId) {
  return (await axios.get(`/api/trader/empresas/${empresaId}`, { headers: authHeader() })).data;
}

export async function marcarFavorita(empresaId) {
  return (await axios.post(`/api/trader/empresas/${empresaId}/favorita`, {}, { headers: authHeader() })).data;
}

export async function getFavoritas() {
  return (await axios.get(`/api/trader/empresas/favoritas`, { headers: authHeader() })).data;
}

export async function getPanoramaMercados() {
  return (await axios.get('/api/trader/mercados/panorama', { headers: authHeader() })).data;
}

export async function comprarAcciones(empresaId, cantidad) {
  return (await axios.post(`/api/trader/empresas/${empresaId}/comprar`, { cantidad }, { headers: authHeader() })).data;
}

export async function getPortafolio() {
  const res = await axios.get('/api/trader/portafolio', { headers: authHeader() });
  return res.data;
}

// HomeTrader data
export async function getHomeTraderData(id) {
  try {
    const response = await axios.get(`/api/trader/home/${id}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error al obtener datos de HomeTrader";
  }
}

// Seguridad y liquidación
export async function liquidarTodo({ id, password }) {
  const res = await axios.post('/api/trader/seguridad/liquidar-todo', { password }, { headers: authHeader() });
  return res.data;
}

export async function getLastAccessSeguridad() {
  const res = await axios.get('/api/trader/seguridad/last-access', { headers: authHeader() });
  return res.data;
}

export async function registrarAccesoSeguridad() {
  const res = await axios.post('/api/trader/seguridad/registrar-acceso', {}, { headers: authHeader() });
  return res.data;
}

// Reportes para trader
export async function getTopWallet() {
  return (await axios.get('/api/trader/reportes/top-wallet', { headers: authHeader() })).data;
}

export async function getTopAcciones() {
  return (await axios.get('/api/trader/reportes/top-acciones', { headers: authHeader() })).data;
}