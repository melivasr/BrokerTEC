import axios from "axios";
import { authHeader } from "./authService";

// Mercados
export async function getMercados() {
	return (await axios.get("/api/mercados", { headers: authHeader() })).data;
}
export async function createMercado(data) {
	return (await axios.post("/api/mercados", data, { headers: authHeader() })).data;
}
export async function updateMercado(id, data) {
	return (await axios.put(`/api/mercados/${id}`, data, { headers: authHeader() })).data;
}
export async function deleteMercado(id) {
	return (await axios.delete(`/api/mercados/${id}`, { headers: authHeader() })).data;
}

// Empresas
export async function getEmpresas() {
	return (await axios.get("/api/empresas", { headers: authHeader() })).data;
}
export async function createEmpresa(data) {
	return (await axios.post("/api/empresas", data, { headers: authHeader() })).data;
}
export async function updateEmpresa(id, data) {
	return (await axios.put(`/api/empresas/${id}`, data, { headers: authHeader() })).data;
}
export async function delistarEmpresa(id, justificacion) {
	return (await axios.delete(`/api/empresas/${id}?delistar=true&justificacion=${encodeURIComponent(justificacion)}`, { headers: authHeader() })).data;
}

// Precios
 export async function venderAcciones(empresaId, cantidad) {
	 const res = await axios.post(`/api/empresas/${empresaId}/vender`, { cantidad });
	 return res.data;
 }

// Precios y carga
export async function getEmpresasPrecios() {
	return (await axios.get('/api/empresas/precios', { headers: authHeader() })).data;
}
export async function getPreciosHistoricos(empresaId) {
	return (await axios.get(`/api/empresas/${empresaId}/precios-historicos`, { headers: authHeader() })).data;
}
export async function cargarPrecioManual(empresaId, { precio, fecha }) {
	return (await axios.post(`/api/empresas/${empresaId}/precio`, { precio, fecha }, { headers: authHeader() })).data;
}
export async function cargarPreciosBatch(preciosBatch) {
	return (await axios.post('/api/precios/batch', { precios: preciosBatch }, { headers: authHeader() })).data;
}

// Trader funciones
export async function getDetalleEmpresa(empresaId) {
	return (await axios.get(`/api/empresas/${empresaId}`, { headers: authHeader() })).data;
}
export async function marcarFavorita(empresaId) {
	return (await axios.post(`/api/empresas/${empresaId}/favorita`, {}, { headers: authHeader() })).data;
}
export async function getPanoramaMercados() {
	return (await axios.get('/api/mercados/panorama', { headers: authHeader() })).data;
}
export async function comprarAcciones(empresaId, cantidad) {
	return (await axios.post(`/api/empresas/${empresaId}/comprar`, { cantidad }, { headers: authHeader() })).data;
}
 
 // Portafolio del usuario
 export async function getPortafolio() {
	 const res = await axios.get('/api/portafolio');
	 return res.data;
 }

 
 // Último acceso del usuario
 export async function getLastAccess() {
	 const res = await axios.get('/api/usuario/last-access');
	 return res.data;
 }
 
 // Liquidar todas las posiciones del usuario
 export async function liquidarTodo({ usuario_id, password }) {
	 const res = await axios.post('/api/usuario/liquidar-todo', { usuario_id, password });
	 return res.data;
 }
