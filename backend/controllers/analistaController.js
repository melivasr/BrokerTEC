import { queryDB } from "../config/db.js";

//EMPRESA (REPORTES)

// Historial de transacciones de una empresa
export async function getTransaccionesEmpresa(req, res) {
    const { id } = req.params;
    const fecha_inicio = req.query.fecha_inicio;
    const fecha_fin = req.query.fecha_fin;

    // Validar GUID
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de empresa inválido' });
    }

    // Validar rango de fechas
    if (fecha_inicio && fecha_fin) {
        const inicio = new Date(fecha_inicio);
        const fin = new Date(fecha_fin);
        if (inicio > fin) {
            return res.status(400).json({ message: 'rango de fechas inválido' });
        }
    }

    try {
        let query = `SELECT t.id, t.alias, t.tipo, t.cantidad, t.precio, t.fecha
                     FROM Transaccion t
                     WHERE t.id_empresa = @id_empresa`;
        
        const params = { id_empresa: id };
        
        if (fecha_inicio) {
            query = query + ` AND t.fecha >= @fecha_inicio`;
            params.fecha_inicio = fecha_inicio;
        }
        if (fecha_fin) {
            query = query + ` AND t.fecha <= @fecha_fin`;
            params.fecha_fin = fecha_fin;
        }
        
        query = query + ` ORDER BY t.fecha DESC`;
        
        const transacciones = await queryDB(query, params);

        // Calcular monto total
        for (let i = 0; i < transacciones.length; i++) {
            transacciones[i].monto_total = transacciones[i].cantidad * transacciones[i].precio;
        }
        res.json(transacciones);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener transacciones' });
    }
}

// Mayor tenedor de una empresa
export async function getMayorTenedor(req, res) {
    const { id } = req.params;

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de empresa inválido' });
    }

    try {
        // Obtener traders
        const traders = await queryDB(
            `SELECT u.alias, SUM(p.acciones) AS total
             FROM Portafolio p
             INNER JOIN Usuario u ON p.id = u.id_portafolio
             WHERE p.id_empresa = @id_empresa AND p.acciones > 0 AND u.rol = 'Trader'
             GROUP BY u.alias
             ORDER BY SUM(p.acciones) DESC`,
            { id_empresa: id }
        );

        // Obtener admins
        const admins = await queryDB(
            `SELECT SUM(p.acciones) AS total
             FROM Portafolio p
             INNER JOIN Usuario u ON p.id = u.id_portafolio
             WHERE p.id_empresa = @id_empresa AND p.acciones > 0 AND u.rol = 'Admin'`,
            { id_empresa: id }
        );

        // Obtener tesoreria
        const inventario = await queryDB(
            `SELECT acciones_disponibles FROM Inventario WHERE id_empresa = @id_empresa`,
            { id_empresa: id }
        );

        let mayor = null;
        let maxAcciones = 0;

        // Comparar tesoreria
        if (inventario.length > 0) {
            const tesoreria = inventario[0].acciones_disponibles;
            if (tesoreria > maxAcciones) {
                maxAcciones = tesoreria;
                mayor = {
                    tenedor: 'administracion',
                    total_acciones: tesoreria
                };
            }
        }

        // Comparar admins
        if (admins.length > 0 && admins[0].total) {
            const adminTotal = admins[0].total;
            if (adminTotal > maxAcciones) {
                maxAcciones = adminTotal;
                mayor = {
                    tenedor: 'administracion',
                    total_acciones: adminTotal
                };
            }
        }

        // Comparar traders
        if (traders.length > 0) {
            const traderTotal = traders[0].total;
            if (traderTotal > maxAcciones) {
                maxAcciones = traderTotal;
                mayor = {
                    tenedor: traders[0].alias,
                    total_acciones: traderTotal
                };
            }
        }

        res.json(mayor);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener mayor tenedor' });
    }
}

// Inventario de Tesorería
export async function getInventarioTesoreria(req, res) {
    const { id } = req.params;

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de empresa inválido' });
    }

    try {
        const resultado = await queryDB(
            `SELECT acciones_totales, acciones_disponibles, precio
             FROM Inventario WHERE id_empresa = @id_empresa`,
            { id_empresa: id }
        );

        if (resultado.length === 0) {
            return res.status(404).json({ message: 'Inventario no encontrado' });
        }

        const inv = resultado[0];
        
        const tesoreria = {
            acciones_totales: inv.acciones_totales,
            acciones_disponibles: inv.acciones_disponibles,
            acciones_en_circulacion: inv.acciones_totales - inv.acciones_disponibles,
            precio_actual: inv.precio
        };

        // Calcular porcentajes
        tesoreria.porcentaje_tesoreria = (inv.acciones_disponibles / inv.acciones_totales * 100).toFixed(2);
        tesoreria.porcentaje_circulacion = ((inv.acciones_totales - inv.acciones_disponibles) / inv.acciones_totales * 100).toFixed(2);

        res.json(tesoreria);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener inventario' });
    }
}

// Historial de precios para gráfico
export async function getHistorialPrecio(req, res) {
    const { id } = req.params;
    const fecha_inicio = req.query.fecha_inicio;
    const fecha_fin = req.query.fecha_fin;

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de empresa inválido' });
    }

    // Validar rango
    if (fecha_inicio && fecha_fin) {
        if (new Date(fecha_inicio) > new Date(fecha_fin)) {
            return res.status(400).json({ message: 'rango de fechas inválido' });
        }
    }

    try {
        let query = `SELECT fecha, precio FROM Inventario_Historial WHERE id_empresa = @id_empresa`;
        const params = { id_empresa: id };
        
        if (fecha_inicio) {
            query = query + ` AND fecha >= @fecha_inicio`;
            params.fecha_inicio = fecha_inicio;
        }
        if (fecha_fin) {
            query = query + ` AND fecha <= @fecha_fin`;
            params.fecha_fin = fecha_fin;
        }
        
        query = query + ` ORDER BY fecha ASC`;
        
        const historial = await queryDB(query, params);

        // Agregar precio actual
        const precioActual = await queryDB(
            `SELECT precio FROM Inventario WHERE id_empresa = @id_empresa`,
            { id_empresa: id }
        );

        if (precioActual.length > 0) {
            historial.push({
                fecha: new Date(),
                precio: precioActual[0].precio
            });
        }

        res.json(historial);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener historial de precios' });
    }
}

// Lista de empresas
export async function getEmpresasPorMercado(req, res) {
    const id_mercado = req.query.id_mercado;

    try {
        let query = `SELECT e.id, e.nombre, e.ticker, m.nombre AS mercado, e.id_mercado
                     FROM Empresa e
                     INNER JOIN Mercado m ON e.id_mercado = m.id`;

        const params = {};
        
        if (id_mercado) {
            query = query + ` WHERE e.id_mercado = @id_mercado`;
            params.id_mercado = id_mercado;
        }

        query = query + ` ORDER BY m.nombre, e.nombre`;

        const empresas = await queryDB(query, params);
        res.json(empresas);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener empresas' });
    }
}

//  USUARIO (ALIAS)

// Historial de usuario por alias
export async function getHistorialUsuario(req, res) {
    const { alias } = req.params;
    const fecha_inicio = req.query.fecha_inicio;
    const fecha_fin = req.query.fecha_fin;
    const id_empresa = req.query.id_empresa;
    const tipo = req.query.tipo;
    const ordenar = req.query.ordenar;

    try {
        // Validar que el alias existe
        const existe = await queryDB(
            `SELECT COUNT(*) AS existe FROM Usuario WHERE alias = @alias`,
            { alias: alias }
        );

        if (existe[0].existe === 0) {
            return res.status(404).json({ message: 'alias inexistente' });
        }

        // Query 
        let query = `SELECT t.id, e.nombre AS empresa, e.ticker, m.nombre AS mercado,
                            t.tipo, t.cantidad, t.precio, t.fecha
                     FROM Transaccion t
                     INNER JOIN Empresa e ON t.id_empresa = e.id
                     INNER JOIN Mercado m ON e.id_mercado = m.id
                     WHERE t.alias = @alias`;

        const params = { alias: alias };

        // Filtros
        if (fecha_inicio) {
            query = query + ` AND t.fecha >= @fecha_inicio`;
            params.fecha_inicio = fecha_inicio;
        }
        if (fecha_fin) {
            query = query + ` AND t.fecha <= @fecha_fin`;
            params.fecha_fin = fecha_fin;
        }
        if (id_empresa) {
            query = query + ` AND t.id_empresa = @id_empresa`;
            params.id_empresa = id_empresa;
        }
        if (tipo === 'Compra' || tipo === 'Venta') {
            query = query + ` AND t.tipo = @tipo`;
            params.tipo = tipo;
        }

        // Ordenamiento
        if (ordenar === 'empresa') {
            query = query + ` ORDER BY e.nombre ASC, t.fecha DESC`;
        } else if (ordenar === 'tipo') {
            query = query + ` ORDER BY t.tipo ASC, t.fecha DESC`;
        } else {
            query = query + ` ORDER BY t.fecha DESC`;
        }

        const historial = await queryDB(query, params);

        // Calcular monto total
        for (let i = 0; i < historial.length; i++) {
            historial[i].monto_total = historial[i].cantidad * historial[i].precio;
        }

        res.json({ alias: alias, historial: historial });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener historial del usuario' });
    }
}

// ESTADÍSTICAS

// Estadísticas por mercado
export async function getEstadisticasMercado(req, res) {
    try {
        // Verificar si hay posiciones
        const hayPosiciones = await queryDB(
            `SELECT COUNT(*) AS total FROM Portafolio WHERE acciones > 0`
        );

        if (hayPosiciones[0].total === 0) {
            return res.status(200).json({ 
                message: 'sin posiciones para calcular',
                estadisticas: [] 
            });
        }

        // Acciones de traders
        const traders = await queryDB(`
            SELECT m.nombre AS mercado, SUM(p.acciones) AS total
            FROM Portafolio p
            INNER JOIN Usuario u ON p.id = u.id_portafolio
            INNER JOIN Empresa e ON p.id_empresa = e.id
            INNER JOIN Mercado m ON e.id_mercado = m.id
            WHERE p.acciones > 0 AND u.rol = 'Trader'
            GROUP BY m.nombre
        `);

        // Acciones de admins
        const admins = await queryDB(`
            SELECT m.nombre AS mercado, SUM(p.acciones) AS total
            FROM Portafolio p
            INNER JOIN Usuario u ON p.id = u.id_portafolio
            INNER JOIN Empresa e ON p.id_empresa = e.id
            INNER JOIN Mercado m ON e.id_mercado = m.id
            WHERE p.acciones > 0 AND u.rol = 'Admin'
            GROUP BY m.nombre
        `);

        // Total por mercado
        const totales = await queryDB(`
            SELECT m.nombre AS mercado, SUM(p.acciones) AS total
            FROM Portafolio p
            INNER JOIN Usuario u ON p.id = u.id_portafolio
            INNER JOIN Empresa e ON p.id_empresa = e.id
            INNER JOIN Mercado m ON e.id_mercado = m.id
            WHERE p.acciones > 0
            GROUP BY m.nombre
        `);

        // Combinar resultados
        const estadisticas = [];
        for (let i = 0; i < totales.length; i++) {
            const mercado = totales[i].mercado;
            const total = totales[i].total;

            let acciones_traders = 0;
            let acciones_admins = 0;

            // Buscar traders
            for (let j = 0; j < traders.length; j++) {
                if (traders[j].mercado === mercado) {
                    acciones_traders = traders[j].total;
                    break;
                }
            }

            // Buscar admins
            for (let k = 0; k < admins.length; k++) {
                if (admins[k].mercado === mercado) {
                    acciones_admins = admins[k].total;
                    break;
                }
            }

            const porcentaje_traders = (acciones_traders / total * 100).toFixed(2);
            const porcentaje_admins = (acciones_admins / total * 100).toFixed(2);

            estadisticas.push({
                mercado: mercado,
                acciones_traders: acciones_traders,
                acciones_administracion: acciones_admins,
                total_acciones: total,
                porcentaje_traders: porcentaje_traders,
                porcentaje_administracion: porcentaje_admins
            });
        }

        res.json({ estadisticas: estadisticas });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
}

// Estadísticas por empresa
export async function getEstadisticasEmpresa(req, res) {
    const id_mercado = req.query.id_mercado;

    try {
        // Verificar si hay posiciones
        const hayPosiciones = await queryDB(
            `SELECT COUNT(*) AS total FROM Portafolio WHERE acciones > 0`
        );

        if (hayPosiciones[0].total === 0) {
            return res.status(200).json({ 
                message: 'sin posiciones para calcular',
                estadisticas: [] 
            });
        }

        // Query para traders
        let queryTraders = `
            SELECT e.nombre AS empresa, e.ticker, m.nombre AS mercado, SUM(p.acciones) AS total
            FROM Portafolio p
            INNER JOIN Usuario u ON p.id = u.id_portafolio
            INNER JOIN Empresa e ON p.id_empresa = e.id
            INNER JOIN Mercado m ON e.id_mercado = m.id
            WHERE p.acciones > 0 AND u.rol = 'Trader'
        `;

        // Query  para admins
        let queryAdmins = `
            SELECT e.nombre AS empresa, e.ticker, m.nombre AS mercado, SUM(p.acciones) AS total
            FROM Portafolio p
            INNER JOIN Usuario u ON p.id = u.id_portafolio
            INNER JOIN Empresa e ON p.id_empresa = e.id
            INNER JOIN Mercado m ON e.id_mercado = m.id
            WHERE p.acciones > 0 AND u.rol = 'Admin'
        `;

        let queryTotal = `
            SELECT e.nombre AS empresa, e.ticker, m.nombre AS mercado, SUM(p.acciones) AS total
            FROM Portafolio p
            INNER JOIN Usuario u ON p.id = u.id_portafolio
            INNER JOIN Empresa e ON p.id_empresa = e.id
            INNER JOIN Mercado m ON e.id_mercado = m.id
            WHERE p.acciones > 0
        `;

        const params = {};
        
        if (id_mercado) {
            queryTraders = queryTraders + ` AND e.id_mercado = @id_mercado`;
            queryAdmins = queryAdmins + ` AND e.id_mercado = @id_mercado`;
            queryTotal = queryTotal + ` AND e.id_mercado = @id_mercado`;
            params.id_mercado = id_mercado;
        }

        queryTraders = queryTraders + ` GROUP BY e.nombre, e.ticker, m.nombre`;
        queryAdmins = queryAdmins + ` GROUP BY e.nombre, e.ticker, m.nombre`;
        queryTotal = queryTotal + ` GROUP BY e.nombre, e.ticker, m.nombre`;

        const traders = await queryDB(queryTraders, params);
        const admins = await queryDB(queryAdmins, params);
        const totales = await queryDB(queryTotal, params);

        // Combinar resultados
        const estadisticas = [];
        for (let i = 0; i < totales.length; i++) {
            const ticker = totales[i].ticker;
            const total = totales[i].total;

            let acciones_traders = 0;
            let acciones_admins = 0;

            // Buscar traders
            for (let j = 0; j < traders.length; j++) {
                if (traders[j].ticker === ticker) {
                    acciones_traders = traders[j].total;
                    break;
                }
            }

            // Buscar admins
            for (let k = 0; k < admins.length; k++) {
                if (admins[k].ticker === ticker) {
                    acciones_admins = admins[k].total;
                    break;
                }
            }

            const porcentaje_traders = (acciones_traders / total * 100).toFixed(2);
            const porcentaje_admins = (acciones_admins / total * 100).toFixed(2);

            estadisticas.push({
                empresa: totales[i].empresa,
                ticker: ticker,
                mercado: totales[i].mercado,
                acciones_traders: acciones_traders,
                acciones_administracion: acciones_admins,
                total_acciones: total,
                porcentaje_traders: porcentaje_traders,
                porcentaje_administracion: porcentaje_admins
            });
        }

        res.json({ estadisticas: estadisticas });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
}

// AUXILIARES
// Lista de mercados
export async function getMercados(req, res) {
    try {
        const mercados = await queryDB(
            `SELECT id, nombre FROM Mercado ORDER BY nombre`
        );
        res.json(mercados);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener mercados' });
    }
}