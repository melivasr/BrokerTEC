import { queryDB } from "../config/db.js";
import sql from 'mssql';
import { dbConfig } from '../config/db.js';
import jwt from 'jsonwebtoken';

// Obtener todas las empresas
export async function getEmpresas(req, res) {
    try {
        const empresas = await queryDB('SELECT * FROM Empresa');
        res.json(empresas);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener empresas', error: err.message });
    }
}

// Crear una nueva empresa
export async function createEmpresa(req, res) {
    try {
        const { nombre, ticker, id_mercado } = req.body;
        if (!nombre || !ticker || !id_mercado) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }
        const result = await queryDB(
            'INSERT INTO Empresa (nombre, ticker, id_mercado) VALUES (@nombre, @ticker, @id_mercado)',
            { nombre, ticker, id_mercado }
        );
        res.status(201).json({ message: 'Empresa creada', result });
    } catch (err) {
        res.status(500).json({ message: 'Error al crear empresa', error: err.message });
    }
}

// Obtener detalle completo de una empresa para la vista de detalle del Trader
export async function getEmpresaDetalle(req, res) {
    const { id } = req.params;
    console.log('getEmpresaDetalle llamado con id=', id);

    // Validar que recibimos un GUID válido
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de empresa inválido' });
    }

    try {
        // 1) Obtener datos base de la empresa
        const empresas = await queryDB('SELECT id, id_mercado, nombre, ticker FROM Empresa WHERE id = @id', { id });
        if (!empresas || empresas.length === 0)
            return res.status(404).json({ message: 'Empresa no encontrada' });

        const empresaRow = empresas[0];

        // 2) Obtener inventario (precio actual, acciones totales y disponibles, capitalizacion)
        const inventarios = await queryDB(
            'SELECT id_empresa, acciones_totales, acciones_disponibles, precio, capitalizacion FROM Inventario WHERE id_empresa = @id',
            { id }
        );
        const inventario = inventarios && inventarios.length > 0 ? inventarios[0] : null;
        
        // 3) Obtener historial de precios (excluyendo el más reciente)
        const historialAll = await queryDB(
            'SELECT fecha, precio FROM Inventario_Historial WHERE id_empresa = @id ORDER BY fecha DESC',
            { id }
        );
        const historicoPrevio = (historialAll || [])
            .slice(1)
            .map(row => ({
                fecha: new Date(row.fecha).toISOString(),
                valor: Number(row.precio),
            }));

        // 4) Determinar mayor tenedor
        const holders = await queryDB(
            `SELECT u.alias, p.acciones 
             FROM Portafolio p
             JOIN Usuario u ON u.id_portafolio = p.id
             WHERE p.id_empresa = @id
             ORDER BY p.acciones DESC`,
            { id }
        );

        let mayor_tenedor_alias = null;
        if (holders && holders.length > 0) {
            mayor_tenedor_alias = holders[0].alias;
        }

        if (inventario) {
            const tesoreriaAcciones = Number(inventario.acciones_disponibles);
            const topHolderAcciones = holders && holders.length > 0 ? Number(holders[0].acciones) : 0;
            if (tesoreriaAcciones >= topHolderAcciones) {
                mayor_tenedor_alias = 'administracion';
            }
        }

        // 5) Determinar posición real del usuario (calculada desde las transacciones)
        let posicionUsuario = 0;
        try {
            const authHeader = req.headers?.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                if (token) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const userId = decoded?.id;

                    if (userId) {
                        // Obtener el alias del usuario
                        const userRes = await queryDB(
                            'SELECT alias FROM Usuario WHERE id = @userId',
                            { userId }
                        );
                        const alias = userRes[0]?.alias;

                        if (alias) {
                            // Calcular la posición DIRECTAMENTE desde las transacciones (sin depender de Portafolio)
                            const posicionRes = await queryDB(
                                `SELECT 
                                    ISNULL(SUM(CASE 
                                        WHEN tipo = 'Compra' THEN cantidad 
                                        WHEN tipo = 'Venta' THEN -cantidad 
                                        ELSE 0 
                                    END), 0) AS cantidad
                                FROM Transaccion 
                                WHERE alias = @alias AND id_empresa = @id`,
                                { alias, id }
                            );
                            
                            if (posicionRes && posicionRes.length > 0) {
                                posicionUsuario = Number(posicionRes[0].cantidad || 0);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.warn("No se pudo obtener posición del usuario:", err.message);
        }
        
        // 6) Determinar si la empresa es favorita para el usuario autenticado
        let favoritaFlag = false;
        try {
            const authHeader = req.headers?.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                if (token) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const userId = decoded?.id;
                    if (userId) {
                        const fav = await queryDB(
                            'SELECT 1 FROM Empresa_Favorita WHERE id_empresa = @id AND id_usuario = @userId',
                            { id, userId }
                        );
                        if (fav && fav.length > 0) favoritaFlag = true;
                    }
                }
            }
        } catch (e) {
            console.warn('No se pudo verificar favoritas:', e?.message || e);
        }

        // 7) Construir respuesta final
        const empresa = {
            id: empresaRow.id,
            nombre: empresaRow.nombre,
            ticker: empresaRow.ticker,
            precio_actual: inventario ? Number(inventario.precio) : null,
            cantidad_acciones_totales: inventario ? Number(inventario.acciones_totales) : null,
            acciones_disponibles: inventario ? Number(inventario.acciones_disponibles) : null,
            capitalizacion: inventario ? Number(inventario.capitalizacion) : null,
            mayor_tenedor_alias,
            posicion_usuario: posicionUsuario,
        };

        res.json({ empresa, historico: historicoPrevio, favorita: favoritaFlag });

    } catch (err) {
        console.error('Error en getEmpresaDetalle:', err);
        res.status(500).json({ message: 'Error al obtener detalle de empresa', error: err.message });
    }
}


// Marcar/Desmarcar empresa como favorita (toggle) para el usuario autenticado
export async function marcarFavorita(req, res) {
    const { id } = req.params; // id de la empresa
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ message: 'Usuario no autenticado' });

    // validar guid
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !guidRegex.test(id)) return res.status(400).json({ message: 'ID de empresa inválido' });

    try {
        // verificar si ya está marcada
        const exists = await queryDB('SELECT 1 FROM Empresa_Favorita WHERE id_empresa = @id AND id_usuario = @userId', { id, userId: user.id });
        if (exists && exists.length > 0) {
            // eliminar favorita
            await queryDB('DELETE FROM Empresa_Favorita WHERE id_empresa = @id AND id_usuario = @userId', { id, userId: user.id });
            return res.json({ message: 'Desmarcada', favorita: false });
        }
        // insertar favorita
        await queryDB('INSERT INTO Empresa_Favorita (id_empresa, id_usuario) VALUES (@id, @userId)', { id, userId: user.id });
        return res.json({ message: 'Marcada', favorita: true });
    } catch (err) {
        console.error('Error en marcarFavorita:', err);
        return res.status(500).json({ message: 'Error marcando favorita', error: err.message });
    }
}

// Obtener empresas favoritas del usuario
export async function getFavoritas(req, res) {
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    try {
        // Unir Empresa_Favorita con Empresa y opcionalmente Inventario para datos de precio/capitalizacion
        const rows = await queryDB(
            `SELECT e.id, e.nombre, e.ticker, i.precio AS precio_actual, i.capitalizacion
             FROM Empresa_Favorita ef
             JOIN Empresa e ON e.id = ef.id_empresa
             LEFT JOIN Inventario i ON i.id_empresa = e.id
             WHERE ef.id_usuario = @userId`,
            { userId: user.id }
        );
        return res.json(rows || []);
    } catch (err) {
        console.error('Error en getFavoritas:', err);
        return res.status(500).json({ message: 'Error obteniendo favoritas', error: err.message });
    }
}

// Comprar acciones: operación atómica sobre billetera, inventario y portafolio
export async function comprarAcciones(req, res) {
    const { id } = req.params; // id de la empresa
    const { cantidad } = req.body;
    const user = req.user; // set por auth middleware
    if (!user || !user.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    if (!cantidad || cantidad <= 0) return res.status(400).json({ message: 'Cantidad inválida' });

    // validar guid
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !guidRegex.test(id)) return res.status(400).json({ message: 'ID de empresa inválido' });

    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        // 1) verificar empresa e inventario
        const invRes = await request.query(`SELECT precio, acciones_disponibles FROM Inventario WHERE id_empresa='${id}'`);
        if (!invRes.recordset || invRes.recordset.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'inventario no disponible' });
        }
        const inventario = invRes.recordset[0];
        const precio = Number(inventario.precio);
        const accionesDisponibles = Number(inventario.acciones_disponibles);

        // 2) verificar mercado habilitado para el usuario
        const empresaRes = await request.query(`SELECT id_mercado FROM Empresa WHERE id='${id}'`);
        const idMercado = empresaRes.recordset[0]?.id_mercado;
        const mhRes = await request.query(`SELECT 1 FROM Mercado_Habilitado WHERE id_mercado='${idMercado}' AND id_usuario='${user.id}'`);
        if (!mhRes.recordset || mhRes.recordset.length === 0) {
            await transaction.rollback();
            return res.status(403).json({ message: 'mercado no habilitado' });
        }

        // 3) verificar inventario suficiente
        if (cantidad > accionesDisponibles) {
            await transaction.rollback();
            return res.status(400).json({ message: 'inventario insuficiente' });
        }

        // 4) obtener billetera del usuario
        const billeteraRes = await request.query(`SELECT b.id, b.fondos FROM Usuario u JOIN Billetera b ON u.id_billetera = b.id WHERE u.id='${user.id}'`);
        if (!billeteraRes.recordset || billeteraRes.recordset.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'billetera no encontrada' });
        }
        const billetera = billeteraRes.recordset[0];
        const totalPrecio = precio * cantidad;
        if (Number(billetera.fondos) < totalPrecio) {
            await transaction.rollback();
            return res.status(400).json({ message: 'saldo insuficiente' });
        }

        // 5) actualizar Inventario, Billetera y Portafolio
        // restar acciones del inventario
        await request.query(`UPDATE Inventario SET acciones_disponibles = acciones_disponibles - ${cantidad} WHERE id_empresa='${id}'`);
        // restar fondos
        await request.query(`UPDATE Billetera SET fondos = fondos - ${totalPrecio} WHERE id='${billetera.id}'`);

        // incrementar o crear portafolio del usuario para esa empresa
        const portRes = await request.query(`SELECT id, acciones FROM Portafolio WHERE id_empresa='${id}' AND id IN (SELECT id_portafolio FROM Usuario WHERE id='${user.id}')`);
        if (portRes.recordset && portRes.recordset.length > 0) {
            const portId = portRes.recordset[0].id;
            await request.query(`UPDATE Portafolio SET acciones = acciones + ${cantidad} WHERE id='${portId}'`);
        } else {
            // crear nuevo portafolio y vincular al usuario
            const newPortId = sql.uniqueidentifier ? sql.uniqueidentifier() : undefined;
            // Insertar portafolio sin GUID manual (usar NEWID en SQL)
            await request.query(`INSERT INTO Portafolio (id, id_empresa, acciones) VALUES (NEWID(), '${id}', ${cantidad})`);
            // actualizar usuario para apuntar al nuevo portafolio
            await request.query(`UPDATE Usuario SET id_portafolio = (SELECT TOP 1 id FROM Portafolio WHERE id_empresa='${id}' AND acciones = ${cantidad}) WHERE id='${user.id}'`);
        }

        // insertar transaccion
        await request.query(`INSERT INTO Transaccion (id, alias, id_portafolio, id_billetera, id_empresa, tipo, precio, cantidad) VALUES (NEWID(), (SELECT alias FROM Usuario WHERE id='${user.id}'), (SELECT id_portafolio FROM Usuario WHERE id='${user.id}'), '${billetera.id}', '${id}', 'Compra', ${precio}, ${cantidad})`);

        await transaction.commit();
        res.json({ message: 'Compra realizada' });
    } catch (err) {
        try { await transaction.rollback(); } catch (e) {}
        console.error('Error en comprarAcciones:', err);
        res.status(500).json({ message: 'Error en la compra', error: err.message });
    } finally {
        try { pool && pool.close(); } catch (e) {}
    }
}

// Vender acciones: operación atómica inversa
export async function venderAcciones(req, res) {
    const { id } = req.params; // id de la empresa
    const { cantidad } = req.body;
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    if (!cantidad || cantidad <= 0) return res.status(400).json({ message: 'Cantidad inválida' });

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !guidRegex.test(id)) return res.status(400).json({ message: 'ID de empresa inválido' });

    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        // 1) determinar posición del usuario para esa empresa usando Transaccion (por alias)
        // esto permite que la posición se calcule incluso si la tabla Portafolio no está vinculada correctamente
        const aliasRes = await request.query(`SELECT alias FROM Usuario WHERE id='${user.id}'`);
        const alias = aliasRes.recordset[0]?.alias;
        const posRes = await request.query(`SELECT SUM(CASE WHEN tipo='Compra' THEN cantidad WHEN tipo='Venta' THEN -cantidad ELSE 0 END) AS cantidad_net FROM Transaccion WHERE alias='${alias}' AND id_empresa='${id}'`);
        const posicionUsuario = Number(posRes.recordset[0]?.cantidad_net || 0);
        if (posicionUsuario <= 0 || posicionUsuario < cantidad) {
            await transaction.rollback();
            return res.status(400).json({ message: 'posición insuficiente' });
        }
        // intentar obtener fila de Portafolio vinculada al usuario para actualizarla (si existe)
        const portRes = await request.query(`SELECT p.id, p.acciones FROM Portafolio p JOIN Usuario u ON u.id_portafolio = p.id WHERE p.id_empresa='${id}' AND u.id='${user.id}'`);
        const port = (portRes.recordset && portRes.recordset.length > 0) ? portRes.recordset[0] : null;

        // 2) obtener inventario y precio
        const invRes = await request.query(`SELECT precio FROM Inventario WHERE id_empresa='${id}'`);
        if (!invRes.recordset || invRes.recordset.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'inventario no disponible' });
        }
        const precio = Number(invRes.recordset[0].precio);

        // 3) actualizar portafolio (si existe), inventario y billetera (sumar funds)
        if (port) {
            await request.query(`UPDATE Portafolio SET acciones = acciones - ${cantidad} WHERE id='${port.id}'`);
        } else {
            // No hay fila en Portafolio vinculada al usuario: saltamos la actualización de Portafolio porque
            // la posición se está obteniendo de Transaccion. Esto evita fallos cuando Usuario.id_portafolio
            // fue sobrescrito por compras posteriores.
            console.warn('No se encontró fila de Portafolio vinculada al usuario para la empresa', id);
        }
        await request.query(`UPDATE Inventario SET acciones_disponibles = acciones_disponibles + ${cantidad} WHERE id_empresa='${id}'`);
        // sumar fondos al usuario
        const billeteraRes = await request.query(`SELECT b.id FROM Usuario u JOIN Billetera b ON u.id_billetera = b.id WHERE u.id='${user.id}'`);
        const billeteraId = billeteraRes.recordset[0].id;
        const totalPrecio = precio * cantidad;
        await request.query(`UPDATE Billetera SET fondos = fondos + ${totalPrecio} WHERE id='${billeteraId}'`);

        // insertar transaccion
        await request.query(`INSERT INTO Transaccion (id, alias, id_portafolio, id_billetera, id_empresa, tipo, precio, cantidad) VALUES (NEWID(), (SELECT alias FROM Usuario WHERE id='${user.id}'), (SELECT id_portafolio FROM Usuario WHERE id='${user.id}'), '${billeteraId}', '${id}', 'Venta', ${precio}, ${cantidad})`);

        await transaction.commit();
        res.json({ message: 'Venta realizada' });
    } catch (err) {
        try { await transaction.rollback(); } catch (e) {}
        console.error('Error en venderAcciones:', err);
        res.status(500).json({ message: 'Error en la venta', error: err.message });
    } finally {
        try { pool && pool.close(); } catch (e) {}
    }
}
