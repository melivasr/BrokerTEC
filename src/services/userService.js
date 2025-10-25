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

 // Liquidar todas las posiciones del usuario
 export async function liquidarTodo({ id, password }) {
	const res = await axios.post('/api/usuario/liquidar-todo', { password }, { headers: authHeader() });
     return res.data;
 }

// Último acceso a Seguridad (acceso anterior)
export async function getLastAccessSeguridad() {
  const res = await axios.get('/api/usuario/last-access-seguridad', { headers: authHeader() });
  return res.data;
}

// Registrar el acceso actual a Seguridad
export async function registrarAccesoSeguridad() {
  const res = await axios.post('/api/usuario/registrar-acceso-seguridad', {}, { headers: authHeader() });
  return res.data;
}