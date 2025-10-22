import axios from "axios";
import { authHeader } from "./authService";

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const API_URL = `${BASE}/api/wallet`; // Ajusta la ruta según tu backend

// Obtener info del wallet
export async function getWallet() {
  try {
    const response = await axios.get(`${API_URL}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    // Lanzar el objeto error para que el frontend pueda leer response.data (message/error)
    throw error;
  }
}

// Recargar wallet
export async function recargarWallet(id, monto) {
  try {
    const response = await axios.post(
      `${API_URL}/recargar`,
      { id, monto },
      { headers: authHeader() }
    );
    return response.data;
  } catch (error) {
    // Lanzar el error completo para que la UI muestre el detalle proporcionado por el backend
    throw error;
  }
}