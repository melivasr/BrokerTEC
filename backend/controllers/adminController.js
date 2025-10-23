import { queryDB } from "../config/db.js";
import bcrypt from "bcryptjs";

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

export async function createMercado(req, res) {
    const { nombre } = req.body;

    if (!nombre) {
        return res.status(400).json({ message: 'El nombre del mercado es requerido' });
    }

    try {
        await queryDB(
            `INSERT INTO Mercado (nombre) VALUES (@nombre)`,
            { nombre: nombre }
        );
        res.status(201).json({ message: 'Mercado creado exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al crear mercado' });
    }
}

export async function updateMercado(req, res) {
    const { id } = req.params;
    const { nombre } = req.body;

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de mercado inválido' });
    }

    if (!nombre) {
        return res.status(400).json({ message: 'El nombre del mercado es requerido' });
    }

    try {
        await queryDB(
            `UPDATE Mercado SET nombre = @nombre WHERE id = @id_mercado`,
            { nombre: nombre, id_mercado: id }
        );
        res.json({ message: 'Mercado actualizado exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al actualizar mercado' });
    }
}

export async function deleteMercado(req, res) {
    const { id } = req.params;

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de mercado inválido' });
    }

    try {
        const empresas = await queryDB(
            `SELECT COUNT(*) AS total FROM Empresa WHERE id_mercado = @id_mercado`,
            { id_mercado: id }
        );
        if (empresas[0].total > 0) {
            return res.status(400).json({ message: 'No se puede eliminar un mercado con empresas asociadas' });
        }

        await queryDB(
            `DELETE FROM Mercado WHERE id = @id_mercado`,
            { id_mercado: id }
        );
        res.json({ message: 'Mercado eliminado exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al eliminar mercado' });
    }
}

// Obtener empresas CON inventario para admin
export async function getEmpresasAdmin(req, res) {
    try {
    const empresas = await queryDB(`
        SELECT 
        e.id,
        e.nombre,
        e.ticker,
        e.id_mercado,
        m.nombre AS mercado,
        i.precio AS precio_actual,
        i.acciones_totales,
        i.acciones_disponibles,
        i.capitalizacion,
        ult.fecha AS fecha_actualizacion
        FROM Empresa e
        INNER JOIN Mercado m ON e.id_mercado = m.id
        LEFT JOIN Inventario i ON e.id = i.id_empresa
        OUTER APPLY (
        SELECT TOP 1 ih.fecha
        FROM Inventario_Historial ih
        WHERE ih.id_empresa = e.id
        ORDER BY ih.fecha DESC
        ) ult
        ORDER BY m.nombre, e.nombre
    `);

    res.json(empresas);
    } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al obtener empresas' });
    }
}

// Crear empresa con inventario
export async function createEmpresaAdmin(req, res) {
    const { nombre, ticker, id_mercado, precio, acciones_totales } = req.body;

    if (!nombre || !ticker || !id_mercado) {
        return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    if (precio && acciones_totales) {
        if (precio <= 0 || acciones_totales <= 0) {
            return res.status(400).json({ message: 'datos de capitalización incompletos' });
        }
    }

    try {
        const resultado = await queryDB(
            `INSERT INTO Empresa (nombre, ticker, id_mercado) 
             OUTPUT INSERTED.id
             VALUES (@nombre, @ticker, @id_mercado)`,
            { nombre: nombre, ticker: ticker.toUpperCase(), id_mercado: id_mercado }
        );

        const nuevaEmpresaId = resultado[0].id;

        if (precio && acciones_totales) {
            await queryDB(
                `INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio)
                 VALUES (@id_empresa, @acciones_totales, @acciones_totales, @precio)`,
                {
                    id_empresa: nuevaEmpresaId,
                    acciones_totales: acciones_totales,
                    precio: precio
                }
            );
        }

        res.status(201).json({ 
            message: 'Empresa creada exitosamente',
            id: nuevaEmpresaId
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al crear empresa' });
    }
}

// Actualizar empresa
export async function updateEmpresa(req, res) {
    const { id } = req.params;
    const { nombre, ticker, id_mercado } = req.body;

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de empresa inválido' });
    }

    if (!nombre || !ticker || !id_mercado) {
        return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    try {
        await queryDB(
            `UPDATE Empresa 
             SET nombre = @nombre, ticker = @ticker, id_mercado = @id_mercado
             WHERE id = @id_empresa`,
            { 
                nombre: nombre, 
                ticker: ticker.toUpperCase(), 
                id_mercado: id_mercado,
                id_empresa: id
            }
        );

        res.json({ message: 'Empresa actualizada exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al actualizar empresa' });
    }
}

// Delistar empresa con liquidación
export async function delistarEmpresa(req, res) {
    const { id } = req.params;
    const { justificacion, precio_liquidacion } = req.body;

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de empresa inválido' });
    }

    if (!justificacion) {
        return res.status(400).json({ message: 'La justificación es requerida' });
    }

    try {
        const empresa = await queryDB(
            `SELECT e.nombre, i.precio 
             FROM Empresa e
             LEFT JOIN Inventario i ON e.id = i.id_empresa
             WHERE e.id = @id_empresa`,
            { id_empresa: id }
        );

        if (empresa.length === 0) {
            return res.status(404).json({ message: 'Empresa no encontrada' });
        }

        const precioLiquidacion = precio_liquidacion || empresa[0].precio;

        if (!precioLiquidacion || precioLiquidacion <= 0) {
            return res.status(400).json({ message: 'Precio de liquidación inválido' });
        }

        const posiciones = await queryDB(
            `SELECT p.id, p.acciones, u.id AS id_usuario, u.alias, u.id_billetera
             FROM Portafolio p
             INNER JOIN Usuario u ON p.id = u.id_portafolio
             WHERE p.id_empresa = @id_empresa AND p.acciones > 0`,
            { id_empresa: id }
        );

        if (posiciones.length > 0) {
            for (let i = 0; i < posiciones.length; i++) {
                const pos = posiciones[i];
                const montoLiquidacion = pos.acciones * precioLiquidacion;

                await queryDB(
                    `UPDATE Billetera 
                     SET fondos = fondos + @monto
                     WHERE id = @id_billetera`,
                    { monto: montoLiquidacion, id_billetera: pos.id_billetera }
                );

                await queryDB(
                    `INSERT INTO Transaccion (alias, id_portafolio, id_billetera, id_empresa, tipo, precio, cantidad, fecha)
                     VALUES (@alias, @id_portafolio, @id_billetera, @id_empresa, 'Venta', @precio, @cantidad, GETDATE())`,
                    {
                        alias: pos.alias,
                        id_portafolio: pos.id,
                        id_billetera: pos.id_billetera,
                        id_empresa: id,
                        precio: precioLiquidacion,
                        cantidad: pos.acciones
                    }
                );

                await queryDB(
                    `UPDATE Portafolio SET acciones = 0 WHERE id = @id_portafolio`,
                    { id_portafolio: pos.id }
                );
            }

            const mensaje = `empresa con posiciones activas (se liquidarán). ${posiciones.length} posición(es) liquidada(s) al precio de $${precioLiquidacion}`;
            
            await queryDB(`DELETE FROM Inventario WHERE id_empresa = @id_empresa`, { id_empresa: id });
            await queryDB(`DELETE FROM Empresa WHERE id = @id_empresa`, { id_empresa: id });

            res.json({ 
                message: mensaje,
                posiciones_liquidadas: posiciones.length,
                precio_liquidacion: precioLiquidacion,
                justificacion: justificacion
            });
        } else {
            await queryDB(`DELETE FROM Inventario WHERE id_empresa = @id_empresa`, { id_empresa: id });
            await queryDB(`DELETE FROM Empresa WHERE id = @id_empresa`, { id_empresa: id });

            res.json({ 
                message: 'Empresa deslistada exitosamente',
                posiciones_liquidadas: 0,
                justificacion: justificacion
            });
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al delistar empresa' });
    }
}

// PRECIOS & CARGA
// Obtener historial de precios de una empresa
export async function getHistorialPrecio(req, res) {
    const { id } = req.params;

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de empresa inválido' });
    }

    try {
        const historial = await queryDB(`
            SELECT fecha, precio
            FROM Inventario_Historial
            WHERE id_empresa = @id_empresa
            ORDER BY fecha ASC
        `, { id_empresa: id });

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

// Cargar precio manual
export async function cargarPrecioManual(req, res) {
    const { id } = req.params;
    const { precio, fecha } = req.body;

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de empresa inválido' });
    }

    // Validaciones
    if (!precio || parseFloat(precio) <= 0) {
        return res.status(400).json({ message: 'precio inválido' });
    }

    if (!fecha) {
        return res.status(400).json({ message: 'formato de fecha inválido' });
    }

    // Validar que la fecha no sea futura
    const fechaSeleccionada = new Date(fecha);
    const ahora = new Date();
    if (fechaSeleccionada > ahora) {
        return res.status(400).json({ message: 'La fecha no puede ser futura' });
    }

    try {
        const precioNum = parseFloat(precio);

        // Actualizar precio actual en Inventario
        await queryDB(
            `UPDATE Inventario SET precio = @precio WHERE id_empresa = @id_empresa`,
            { precio: precioNum, id_empresa: id }
        );

        // Registrar en historial
        await queryDB(
            `INSERT INTO Inventario_Historial (fecha, id_empresa, acciones_totales, acciones_disponibles, precio)
             SELECT @fecha, id_empresa, acciones_totales, acciones_disponibles, @precio
             FROM Inventario WHERE id_empresa = @id_empresa`,
            { fecha: fechaSeleccionada, precio: precioNum, id_empresa: id }
        );

        res.json({ 
            message: 'Precio cargado exitosamente',
            precio: precioNum,
            fecha: fechaSeleccionada
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al cargar precio' });
    }
}

// Carga batch de precios (API)
export async function cargarPreciosBatch(req, res) {
    const { precios } = req.body; // Array de { id_empresa, precio }

    if (!precios || !Array.isArray(precios) || precios.length === 0) {
        return res.status(400).json({ message: 'Datos inválidos' });
    }

    try {
        let exitosos = 0;
        let fallidos = 0;
        const errores = [];

        for (const item of precios) {
            const { id_empresa, precio } = item;

            // Validaciones
            if (!id_empresa || !precio || parseFloat(precio) <= 0) {
                fallidos++;
                errores.push({ id_empresa, error: 'precio inválido' });
                continue;
            }

            try {
                const precioNum = parseFloat(precio);

                // Actualizar precio actual
                await queryDB(
                    `UPDATE Inventario SET precio = @precio WHERE id_empresa = @id_empresa`,
                    { precio: precioNum, id_empresa: id_empresa }
                );

                // Registrar en historial
                await queryDB(
                    `INSERT INTO Inventario_Historial (id_empresa, acciones_totales, acciones_disponibles, precio)
                     SELECT id_empresa, acciones_totales, acciones_disponibles, @precio
                     FROM Inventario WHERE id_empresa = @id_empresa`,
                    { precio: precioNum, id_empresa: id_empresa }
                );

                exitosos++;
            } catch (err) {
                fallidos++;
                errores.push({ id_empresa, error: err.message });
            }
        }

        res.json({
            message: 'Carga batch completada',
            exitosos: exitosos,
            fallidos: fallidos,
            errores: errores
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'auth fallida' });
    }
}

// USUARIOS & CUENTAS
// Obtener todos los usuarios
export async function getUsuarios(req, res) {
    try {
        const usuarios = await queryDB(`
            SELECT 
                id,
                alias,
                nombre,
                rol,
                habilitado,
                correo,
                telefono,
                direccion,
                pais_origen
            FROM Usuario
            ORDER BY alias
        `);

        res.json(usuarios);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
}

// Obtener cuentas de un usuario 
export async function getUsuarioCuentas(req, res) {
    const { id } = req.params;

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    try {
        // Obtener wallet
        const wallet = await queryDB(`
            SELECT 
                b.id,
                b.fondos AS saldo,
                b.categoria,
                b.limite_diario,
                b.consumo
            FROM Billetera b
            INNER JOIN Usuario u ON u.id_billetera = b.id
            WHERE u.id = @id_usuario
        `, { id_usuario: id });

        if (wallet.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Obtener mercados habilitados
        const mercados = await queryDB(`
            SELECT m.id, m.nombre
            FROM Mercado m
            INNER JOIN Mercado_Habilitado mh ON mh.id_mercado = m.id
            WHERE mh.id_usuario = @id_usuario
            ORDER BY m.nombre
        `, { id_usuario: id });

        res.json({
            wallet: {
                id: wallet[0].id,
                saldo: wallet[0].saldo,
                categoria: wallet[0].categoria,
                limite_diario: wallet[0].limite_diario,
                consumo: wallet[0].consumo
            },
            mercados: mercados
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener cuentas del usuario' });
    }
}

// Deshabilitar usuario (con liquidación)
export async function deshabilitarUsuario(req, res) {
    const { id } = req.params;
    const { justificacion } = req.body;

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    if (!justificacion || !justificacion.trim()) {
        return res.status(400).json({ message: 'justificación requerida' });
    }

    try {
        // Verificar que el usuario existe y está habilitado
        const usuario = await queryDB(
            `SELECT id, alias, habilitado, id_billetera FROM Usuario WHERE id = @id_usuario`,
            { id_usuario: id }
        );

        if (usuario.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (!usuario[0].habilitado) {
            return res.status(400).json({ message: 'usuario ya deshabilitado' });
        }

        const alias = usuario[0].alias;
        const idBilletera = usuario[0].id_billetera;

        // Obtener posiciones activas del usuario
        const posiciones = await queryDB(`
            SELECT 
                t.id_empresa,
                SUM(CASE WHEN t.tipo = 'Compra' THEN t.cantidad WHEN t.tipo = 'Venta' THEN -t.cantidad ELSE 0 END) AS cantidad_net
            FROM Transaccion t
            WHERE t.alias = @alias
            GROUP BY t.id_empresa
            HAVING SUM(CASE WHEN t.tipo = 'Compra' THEN t.cantidad WHEN t.tipo = 'Venta' THEN -t.cantidad ELSE 0 END) > 0
        `, { alias: alias });

        let totalLiquidado = 0;
        let posicionesLiquidadas = 0;

        // Liquidar cada posición al precio actual
        for (let i = 0; i < posiciones.length; i++) {
            const pos = posiciones[i];
            const cantidad = pos.cantidad_net;

            // Obtener precio actual
            const inventario = await queryDB(
                `SELECT precio FROM Inventario WHERE id_empresa = @id_empresa`,
                { id_empresa: pos.id_empresa }
            );

            if (inventario.length > 0) {
                const precio = inventario[0].precio;
                const montoLiquidacion = cantidad * precio;

                // Abonar al wallet
                await queryDB(
                    `UPDATE Billetera SET fondos = fondos + @monto WHERE id = @id_billetera`,
                    { monto: montoLiquidacion, id_billetera: idBilletera }
                );

                // Devolver acciones al inventario
                await queryDB(
                    `UPDATE Inventario SET acciones_disponibles = acciones_disponibles + @cantidad WHERE id_empresa = @id_empresa`,
                    { cantidad: cantidad, id_empresa: pos.id_empresa }
                );

                // Registrar transacción de liquidación
                await queryDB(
                    `INSERT INTO Transaccion (alias, id_portafolio, id_billetera, id_empresa, tipo, precio, cantidad)
                     VALUES (@alias, (SELECT id_portafolio FROM Usuario WHERE id = @id_usuario), @id_billetera, @id_empresa, 'Venta', @precio, @cantidad)`,
                    {
                        alias: alias,
                        id_usuario: id,
                        id_billetera: idBilletera,
                        id_empresa: pos.id_empresa,
                        precio: precio,
                        cantidad: cantidad
                    }
                );

                totalLiquidado += montoLiquidacion;
                posicionesLiquidadas++;
            }
        }

        // Deshabilitar usuario
        await queryDB(
            `UPDATE Usuario SET habilitado = 0, deshabilitado_justificacion = @justificacion WHERE id = @id_usuario`,
            { justificacion: justificacion, id_usuario: id }
        );

        res.json({
            message: 'Usuario deshabilitado exitosamente',
            posiciones_liquidadas: posicionesLiquidadas,
            total_liquidado: totalLiquidado,
            justificacion: justificacion
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al deshabilitar usuario' });
    }
}

// Top 5 traders por dinero en wallet
export async function getTopWallet(req, res) {
    try {
        const top = await queryDB(`
            SELECT TOP 5
                u.alias,
                b.fondos AS saldo
            FROM Usuario u
            INNER JOIN Billetera b ON u.id_billetera = b.id
            WHERE u.rol = 'Trader' AND u.habilitado = 1
            ORDER BY b.fondos DESC
        `);

        console.log('Top Wallet:', top); // Debug
        res.json(top);
    } catch (error) {
        console.error('Error en getTopWallet:', error);
        res.status(500).json({ message: 'Error al obtener top wallet' });
    }
}

// Top 5 traders por valor en acciones
export async function getTopAcciones(req, res) {
    try {
        // Primero obtenemos todos los traders
        const traders = await queryDB(`
            SELECT u.alias
            FROM Usuario u
            WHERE u.rol = 'Trader' AND u.habilitado = 1
        `);

        console.log('Traders encontrados:', traders); // Debug

        // Para cada trader, calculamos su valor en acciones
        const resultados = [];
        
        for (const trader of traders) {
            // Obtener posiciones netas por empresa
            const posiciones = await queryDB(`
                SELECT 
                    t.id_empresa,
                    SUM(CASE WHEN t.tipo = 'Compra' THEN t.cantidad WHEN t.tipo = 'Venta' THEN -t.cantidad ELSE 0 END) AS cantidad_neta
                FROM Transaccion t
                WHERE t.alias = @alias
                GROUP BY t.id_empresa
                HAVING SUM(CASE WHEN t.tipo = 'Compra' THEN t.cantidad WHEN t.tipo = 'Venta' THEN -t.cantidad ELSE 0 END) > 0
            `, { alias: trader.alias });

            console.log(`Posiciones de ${trader.alias}:`, posiciones); // Debug

            let valorTotal = 0;

            // Para cada posición, calcular valor actual
            for (const pos of posiciones) {
                const inventario = await queryDB(`
                    SELECT precio FROM Inventario WHERE id_empresa = @id_empresa
                `, { id_empresa: pos.id_empresa });

                if (inventario.length > 0) {
                    const precio = inventario[0].precio;
                    valorTotal += pos.cantidad_neta * precio;
                }
            }

            if (valorTotal > 0) {
                resultados.push({
                    alias: trader.alias,
                    valor_acciones: valorTotal
                });
            }
        }
        // Ordenar por valor descendente y tomar top 5
        resultados.sort((a, b) => b.valor_acciones - a.valor_acciones);
        const top5 = resultados.slice(0, 5);

        console.log('Top 5 Acciones:', top5); // Debug
        res.json(top5);
    } catch (error) {
        console.error('Error en getTopAcciones:', error);
        res.status(500).json({ message: 'Error al obtener top acciones' });
    }
}
// Crear usuario 
export async function createUsuario(req, res) {
    const { alias, nombre, correo, password, rol, categoria } = req.body;

    if (!alias || !nombre || !correo || !password || !rol) {
        return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    try {
        // Verificar si ya existe
        const existing = await queryDB(
            `SELECT * FROM Usuario WHERE alias = @alias OR correo = @correo`,
            { alias: alias, correo: correo }
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Alias o correo ya registrado' });
        }

        // Crear billetera según categoría
        const categoriaFinal = categoria || 'Junior';
        let fondos = 0;
        let limiteDiario = 0;

        switch (categoriaFinal) {
            case 'Junior':
                fondos = 1000;
                limiteDiario = 500;
                break;
            case 'Mid':
                fondos = 5000;
                limiteDiario = 2000;
                break;
            case 'Senior':
                fondos = 20000;
                limiteDiario = 10000;
                break;
        }

        const billetera = await queryDB(
            `INSERT INTO Billetera (categoria, fondos, limite_diario, consumo)
             OUTPUT INSERTED.id
             VALUES (@categoria, @fondos, @limite_diario, 0)`,
            { categoria: categoriaFinal, fondos: fondos, limite_diario: limiteDiario }
        );

        const idBilletera = billetera[0].id;

        // Encriptar contraseña
        const contrasenaHash = await bcrypt.hash(password, 10);

        // Crear usuario
        await queryDB(
            `INSERT INTO Usuario (id_billetera, nombre, alias, correo, contrasena_hash, rol, habilitado)
             VALUES (@id_billetera, @nombre, @alias, @correo, @contrasena_hash, @rol, 1)`,
            {
                id_billetera: idBilletera,
                nombre: nombre,
                alias: alias,
                correo: correo,
                contrasena_hash: contrasenaHash,
                rol: rol
            }
        );

        res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al crear usuario' });
    }
}

// Actualizar usuario (Admin)
export async function updateUsuarioAdmin(req, res) {
    const { id } = req.params;
    const { nombre, correo, rol, categoria, limite_diario } = req.body;

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id)) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    try {
        // Actualizar datos del usuario
        if (nombre || correo || rol) {
            const updates = [];
            const params = { id_usuario: id };

            if (nombre) {
                updates.push('nombre = @nombre');
                params.nombre = nombre;
            }
            if (correo) {
                updates.push('correo = @correo');
                params.correo = correo;
            }
            if (rol) {
                updates.push('rol = @rol');
                params.rol = rol;
            }

            if (updates.length > 0) {
                await queryDB(
                    `UPDATE Usuario SET ${updates.join(', ')} WHERE id = @id_usuario`,
                    params
                );
            }
        }

        // Actualizar billetera 
        if (categoria || limite_diario) {
            const billeteraUpdates = [];
            const billeteraParams = {};

            if (categoria) {
                billeteraUpdates.push('categoria = @categoria');
                billeteraParams.categoria = categoria;
            }
            if (limite_diario) {
                billeteraUpdates.push('limite_diario = @limite_diario');
                billeteraParams.limite_diario = parseFloat(limite_diario);
            }

            if (billeteraUpdates.length > 0) {
                await queryDB(
                    `UPDATE Billetera 
                     SET ${billeteraUpdates.join(', ')}
                     WHERE id = (SELECT id_billetera FROM Usuario WHERE id = @id_usuario)`,
                    { ...billeteraParams, id_usuario: id }
                );
            }
        }

        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
}

export async function habilitarMercado(req, res) {
    const { id } = req.params; // id del usuario
    const { id_mercado } = req.body;

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id) || !guidRegex.test(id_mercado)) {
        return res.status(400).json({ message: 'IDs inválidos' });
    }

    try {
        // Verificar si ya existe
        const existe = await queryDB(
            `SELECT * FROM Mercado_Habilitado WHERE id_usuario = @id_usuario AND id_mercado = @id_mercado`,
            { id_usuario: id, id_mercado: id_mercado }
        );

        if (existe.length > 0) {
            return res.status(400).json({ message: 'Mercado ya habilitado para este usuario' });
        }

        await queryDB(
            `INSERT INTO Mercado_Habilitado (id_usuario, id_mercado) VALUES (@id_usuario, @id_mercado)`,
            { id_usuario: id, id_mercado: id_mercado }
        );

        res.json({ message: 'Mercado habilitado exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al habilitar mercado' });
    }
}

export async function deshabilitarMercado(req, res) {
    const { id, idMercado } = req.params;

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(id) || !guidRegex.test(idMercado)) {
        return res.status(400).json({ message: 'IDs inválidos' });
    }

    try {
        await queryDB(
            `DELETE FROM Mercado_Habilitado WHERE id_usuario = @id_usuario AND id_mercado = @id_mercado`,
            { id_usuario: id, id_mercado: idMercado }
        );

        res.json({ message: 'Mercado deshabilitado exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al deshabilitar mercado' });
    }
}