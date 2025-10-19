import { queryDB } from "../config/db.js";

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
                i.capitalizacion
            FROM Empresa e
            INNER JOIN Mercado m ON e.id_mercado = m.id
            LEFT JOIN Inventario i ON e.id = i.id_empresa
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