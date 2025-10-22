import axios from "axios";
import { authHeader } from "./authService";
// Obtener transacciones de una empresa
export async function getTransaccionesEmpresa(empresaId, params = {}) {
    const { fecha_inicio, fecha_fin } = params;
    let url = `/api/analista/empresa/${empresaId}/transacciones`;
    
    const queryParams = [];
    if (fecha_inicio) queryParams.push(`fecha_inicio=${fecha_inicio}`);
    if (fecha_fin) queryParams.push(`fecha_fin=${fecha_fin}`);
    
    if (queryParams.length > 0) {
        url = url + '?' + queryParams.join('&');
    }
    
    const res = await axios.get(url, { headers: authHeader() });
    return res.data;
}

// Obtener mayor tenedor de una empresa
export async function getMayorTenedor(empresaId) {
    const res = await axios.get(`/api/analista/empresa/${empresaId}/mayor-tenedor`, { headers: authHeader() });
    return res.data;
}

// Obtener inventario de tesorería
export async function getInventarioTesoreria(empresaId) {
    const res = await axios.get(`/api/analista/empresa/${empresaId}/inventario-tesoreria`, { headers: authHeader() });
    return res.data;
}

// Obtener historial de precio para gráfico
export async function getHistorialPrecio(empresaId, params = {}) {
    const { fecha_inicio, fecha_fin } = params;
    let url = `/api/analista/empresa/${empresaId}/historial-precio`;
    
    const queryParams = [];
    if (fecha_inicio) queryParams.push(`fecha_inicio=${fecha_inicio}`);
    if (fecha_fin) queryParams.push(`fecha_fin=${fecha_fin}`);
    
    if (queryParams.length > 0) {
        url = url + '?' + queryParams.join('&');
    }
    
    const res = await axios.get(url, { headers: authHeader() });
    return res.data;
}

// Obtener empresas 
export async function getEmpresasPorMercado(idMercado = null) {
    let url = '/api/analista/empresas';
    if (idMercado) {
        url = url + `?id_mercado=${idMercado}`;
    }
    const res = await axios.get(url, { headers: authHeader() });
    return res.data;
}

// Obtener historial de un usuario por alias
export async function getHistorialUsuario(alias, params = {}) {
    const { fecha_inicio, fecha_fin, id_empresa, tipo, ordenar } = params;
    let url = `/api/analista/usuario/${alias}`;
    
    const queryParams = [];
    if (fecha_inicio) queryParams.push(`fecha_inicio=${fecha_inicio}`);
    if (fecha_fin) queryParams.push(`fecha_fin=${fecha_fin}`);
    if (id_empresa) queryParams.push(`id_empresa=${id_empresa}`);
    if (tipo) queryParams.push(`tipo=${tipo}`);
    if (ordenar) queryParams.push(`ordenar=${ordenar}`);
    
    if (queryParams.length > 0) {
        url = url + '?' + queryParams.join('&');
    }
    
    const res = await axios.get(url, { headers: authHeader() });
    return res.data;
}

// Obtener estadísticas por mercado
export async function getEstadisticasMercado() {
    const res = await axios.get('/api/analista/estadisticas/mercado', { headers: authHeader() });
    return res.data;
}
// Obtener estadísticas por empresa
export async function getEstadisticasEmpresa(idMercado = null) {
    let url = '/api/analista/estadisticas/empresa';
    if (idMercado) {
        url = url + `?id_mercado=${idMercado}`;
    }
    const res = await axios.get(url, { headers: authHeader() });
    return res.data;
}

export async function getMercadosAnalista() {
    const res = await axios.get('/api/analista/mercados', { headers: authHeader() });
    return res.data;
}