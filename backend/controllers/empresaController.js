import { queryDB } from "../config/db.js";
import sql from 'mssql';
import { dbConfig } from '../config/db.js';

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
    // Validar que recibimos un GUID para evitar errores de conversión en SQL
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de empresa inválido' });
    }
    try {
        // 1) Obtener datos base de la empresa
        const empresas = await queryDB('SELECT id, id_mercado, nombre, ticker FROM Empresa WHERE id = @id', { id });
        if (!empresas || empresas.length === 0) return res.status(404).json({ message: 'Empresa no encontrada' });
        const empresaRow = empresas[0];

        // 2) Obtener inventario (precio actual, acciones totales y disponibles, capitalizacion)
        const inventarios = await queryDB(
            'SELECT id_empresa, acciones_totales, acciones_disponibles, precio, capitalizacion FROM Inventario WHERE id_empresa = @id',
            { id }
        );
        const inventario = inventarios && inventarios.length > 0 ? inventarios[0] : null;

        // 3) Obtener historial de precios (orden descendente por fecha). Excluir el registro más reciente para que "precio actual" sea el
        // tomado desde Inventario.precio y el histórico contenga solo previos.
        const historialAll = await queryDB(
            'SELECT fecha, precio FROM Inventario_Historial WHERE id_empresa = @id ORDER BY fecha DESC',
            { id }
        );
        // Transformar a formato { fecha, valor } y excluir el primer registro (más reciente)
        const historicoPrevio = (historialAll || []).slice(1).map(row => ({ fecha: new Date(row.fecha).toISOString(), valor: Number(row.precio) }));

        // 4) Determinar mayor tenedor comparando inventario (tesorería) vs. portafolios de usuarios
        // Obtener mayor tenedor por usuarios (alias) para esa empresa
        const holders = await queryDB(
            `SELECT u.alias, p.acciones FROM Portafolio p
             JOIN Usuario u ON u.id_portafolio = p.id
             WHERE p.id_empresa = @id
             ORDER BY p.acciones DESC`,
            { id }
        );

        let mayor_tenedor_alias = null;
        if (holders && holders.length > 0) {
            mayor_tenedor_alias = holders[0].alias;
        }

        // Comparar con tesoreria (inventario)
        if (inventario) {
            const tesoreriaAcciones = Number(inventario.acciones_disponibles);
            const topHolderAcciones = holders && holders.length > 0 ? Number(holders[0].acciones) : 0;
            if (tesoreriaAcciones >= topHolderAcciones) {
                mayor_tenedor_alias = 'administracion';
            }
        } else {
            // Si no hay inventario, y no hay holders, dejar null
            if (!mayor_tenedor_alias) mayor_tenedor_alias = null;
        }

        // 5) Construir objeto de respuesta con las claves que el frontend espera
        const empresa = {
            id: empresaRow.id,
            nombre: empresaRow.nombre,
            ticker: empresaRow.ticker,
            precio_actual: inventario ? Number(inventario.precio) : null,
            cantidad_acciones_totales: inventario ? Number(inventario.acciones_totales) : null,
            acciones_disponibles: inventario ? Number(inventario.acciones_disponibles) : null,
            capitalizacion: inventario ? Number(inventario.capitalizacion) : null,
            mayor_tenedor_alias: mayor_tenedor_alias,
        };

        // Responder
        res.json({ empresa, historico: historicoPrevio, favorita: false });
    } catch (err) {
        console.error('Error en getEmpresaDetalle:', err);
        res.status(500).json({ message: 'Error al obtener detalle de empresa', error: err.message });
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

        // 1) obtener portafolio del usuario para esa empresa
        const portRes = await request.query(`SELECT p.id, p.acciones, p.id_portafolio FROM Portafolio p JOIN Usuario u ON u.id_portafolio = p.id WHERE p.id_empresa='${id}' AND u.id='${user.id}'`);
        if (!portRes.recordset || portRes.recordset.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'posición insuficiente' });
        }
        const port = portRes.recordset[0];
        if (Number(port.acciones) < cantidad) {
            await transaction.rollback();
            return res.status(400).json({ message: 'posición insuficiente' });
        }

        // 2) obtener inventario y precio
        const invRes = await request.query(`SELECT precio FROM Inventario WHERE id_empresa='${id}'`);
        if (!invRes.recordset || invRes.recordset.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'inventario no disponible' });
        }
        const precio = Number(invRes.recordset[0].precio);

        // 3) actualizar portafolio, inventario y billetera (sumar funds)
        await request.query(`UPDATE Portafolio SET acciones = acciones - ${cantidad} WHERE id='${port.id}'`);
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
