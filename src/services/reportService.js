import axios from "axios";
import { authHeader } from "./authService";

export async function getTopWallet() {
  return (await axios.get('/api/reportes/top-wallet', { headers: authHeader() })).data;
}
export async function getTopAcciones() {
  return (await axios.get('/api/reportes/top-acciones', { headers: authHeader() })).data;
}
