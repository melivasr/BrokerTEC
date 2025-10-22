import axios from "axios";
import { authHeader } from "./authService";

export async function getHomeTraderData(id) {
  try {
    const response = await axios.get(`/api/home-trader/${id}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error al obtener datos de HomeTrader";
  }
}
