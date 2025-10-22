import axios from "axios";
import { authHeader } from "./authService";

export async function getUsuarios() {
  return (await axios.get('/api/usuarios', { headers: authHeader() })).data;
}
export async function getUsuarioCuentas(usuarioId) {
  return (await axios.get(`/api/usuarios/${usuarioId}/cuentas`, { headers: authHeader() })).data;
}
export async function crearUsuario(data) {
  return (await axios.post('/api/usuarios', data, { headers: authHeader() })).data;
}
export async function editarUsuario(usuarioId, data) {
  return (await axios.put(`/api/usuarios/${usuarioId}`, data, { headers: authHeader() })).data;
}
export async function asignarCategoria(usuarioId, categoria_id, limite) {
  return (await axios.put(`/api/usuarios/${usuarioId}/wallet`, { categoria_id, limite }, { headers: authHeader() })).data;
}
export async function habilitarMercado(usuarioId, mercado_id) {
  return (await axios.post(`/api/usuarios/${usuarioId}/mercados`, { mercado_id }, { headers: authHeader() })).data;
}
export async function deshabilitarUsuario(usuarioId, justificacion) {
  return (await axios.post(`/api/usuarios/${usuarioId}/deshabilitar`, { justificacion }, { headers: authHeader() })).data;
}
