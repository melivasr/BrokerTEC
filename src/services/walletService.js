import axios from "axios";
import { authHeader } from "./authService";

const API_URL = "http://localhost:4000/api/wallet"; // Ajusta la ruta según tu backend

// Obtener info del wallet
export async function getWallet() {
  try {
    const response = await axios.get(`${API_URL}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error al obtener el wallet";
  }
}

// Recargar wallet
export async function recargarWallet(usuario_id, monto) {
  try {
    const response = await axios.post(
      `${API_URL}/recargar`,
      { usuario_id, monto },
      { headers: authHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error al recargar el wallet";
  }
}
