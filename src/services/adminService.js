import axios from "axios";
import { authHeader } from "./authService";

// MERCADOS
export async function getMercados() {
    const res = await axios.get('/api/admin/mercados', { headers: authHeader() });
    return res.data;
}

export async function createMercado(data) {
    const res = await axios.post('/api/admin/mercados', data, { headers: authHeader() });
    return res.data;
}

export async function updateMercado(id, data) {
    const res = await axios.put(`/api/admin/mercados/${id}`, data, { headers: authHeader() });
    return res.data;
}

export async function deleteMercado(id) {
    const res = await axios.delete(`/api/admin/mercados/${id}`, { headers: authHeader() });
    return res.data;
}

// EMPRESAS
export async function getEmpresasAdmin() {
    const res = await axios.get('/api/admin/empresas', { headers: authHeader() });
    return res.data;
}

export async function createEmpresaAdmin(data) {
    const res = await axios.post('/api/admin/empresas', data, { headers: authHeader() });
    return res.data;
}

export async function updateEmpresa(id, data) {
    const res = await axios.put(`/api/admin/empresas/${id}`, data, { headers: authHeader() });
    return res.data;
}

export async function delistarEmpresa(id, justificacion, precioLiquidacion = null) {
    const res = await axios.post(
        `/api/admin/empresas/${id}/delistar`,
        { justificacion: justificacion, precio_liquidacion: precioLiquidacion },
        { headers: authHeader() }
    );
    return res.data;
}

// PRECIOS & CARGA

export async function getHistorialPrecio(id) {
    const res = await axios.get(`/api/admin/empresas/${id}/historial-precio`, { headers: authHeader() });
    return res.data;
}

export async function cargarPrecioManual(id, data) {
    const res = await axios.post(
        `/api/admin/empresas/${id}/cargar-precio`,
        data,
        { headers: authHeader() }
    );
    return res.data;
}

export async function cargarPreciosBatch(precios) {
    const res = await axios.post(
        '/api/admin/precios/batch',
        { precios: precios },
        { headers: authHeader() }
    );
    return res.data;
}
// USUARIOS & CUENTAS
export async function getUsuarios() {
    const res = await axios.get('/api/admin/usuarios', { headers: authHeader() });
    return res.data;
}

export async function getUsuarioCuentas(id) {
    const res = await axios.get(`/api/admin/usuarios/${id}/cuentas`, { headers: authHeader() });
    return res.data;
}

export async function createUsuario(data) {
    const res = await axios.post('/api/admin/usuarios', data, { headers: authHeader() });
    return res.data;
}

export async function updateUsuarioAdmin(id, data) {
    const res = await axios.put(`/api/admin/usuarios/${id}`, data, { headers: authHeader() });
    return res.data;
}

export async function deshabilitarUsuario(id, justificacion) {
    const res = await axios.post(
        `/api/admin/usuarios/${id}/deshabilitar`,
        { justificacion: justificacion },
        { headers: authHeader() }
    );
    return res.data;
}

export async function getTopWallet() {
    const res = await axios.get('/api/admin/usuarios/top-wallet', { headers: authHeader() });
    return res.data;
}

export async function getTopAcciones() {
    const res = await axios.get('/api/admin/usuarios/top-acciones', { headers: authHeader() });
    return res.data;
}