import { queryDB } from "../config/db.js";
// Helpers
const GUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const isGuid = (v) => GUID.test(String(v || ''));

// Actualizar billetera de un usuario
export async function updateBilletera(req, res) {
  const { id_billetera } = req.params;
  const { limite_diario, categoria } = req.body;

  if (!isGuid(id_billetera)) {
    return res.status(400).json({ message: "ID de billetera inválido" });
  }
  if (categoria !== undefined && !['Junior', 'Mid', 'Senior'].includes(categoria)) {
    return res.status(400).json({ message: "Categoría inválida" });
  }
  if (limite_diario !== undefined && Number(limite_diario) < 0) {
    return res.status(400).json({ message: "Límite diario inválido" });
  }
  if (categoria === undefined && limite_diario === undefined) {
    return res.status(400).json({ message: "Nada que actualizar" });
  }

  try {
    const ex = await queryDB(`SELECT 1 FROM Billetera WHERE id=@id`, { id: id_billetera });
    if (!ex.length) return res.status(404).json({ message: "Billetera no encontrada" });

    if (categoria !== undefined) {
      await queryDB(
        `UPDATE Billetera SET categoria=@categoria WHERE id=@id`,
        { categoria, id: id_billetera }
      );
    }
    if (limite_diario !== undefined) {
      await queryDB(
        `UPDATE Billetera SET limite_diario=@lim WHERE id=@id`,
        { lim: Number(limite_diario), id: id_billetera }
      );
    }

    await queryDB(
      `INSERT INTO Billetera_Historial
        (id_billetera, categoria, fondos, limite_diario, consumo, bloqueo_hasta, recarga_monto)
       SELECT id, categoria, fondos, limite_diario, consumo, bloqueo_hasta, NULL
       FROM Billetera WHERE id=@id`,
      { id: id_billetera }
    );

    res.json({ message: "Billetera actualizada" });
  } catch (e) {
    console.error('[updateBilletera] Error updating wallet:', e.message);
    res.status(500).json({ message: "Error al actualizar billetera" });
  }
}

// Obtener detalles de una billetera específica
export async function getBilletera(req, res) {
  const { id_billetera } = req.params;
  if (!isGuid(id_billetera)) {
    return res.status(400).json({ message: "ID de billetera inválido" });
  }
  try {
    const rows = await queryDB(
      `SELECT id, categoria, fondos, limite_diario, consumo, bloqueo_hasta
       FROM Billetera WHERE id=@id`,
      { id: id_billetera }
    );
    if (!rows.length) return res.status(404).json({ message: "Billetera no encontrada" });
    res.json(rows[0]);
  } catch (e) {
    console.error('[getBilletera] Error fetching wallet:', e.message);
    res.status(500).json({ message: "Error al obtener billetera" });
  }
}

// Mercados

export async function createMercado(req, res) {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ message: 'Nombre requerido' });
  try {
    await queryDB(`INSERT INTO Mercado (nombre) VALUES (@nombre)`, { nombre });
    res.status(201).json({ message: 'Mercado creado' });
  } catch (e) {
    res.status(500).json({ message: 'Error al crear mercado' });
  }
}

export async function updateMercado(req, res) {
  const { id } = req.params;
  const { nombre } = req.body;
  if (!isGuid(id)) return res.status(400).json({ message: 'ID inválido' });
  if (!nombre)   return res.status(400).json({ message: 'Nombre requerido' });
  try {
    await queryDB(`UPDATE Mercado SET nombre=@nombre WHERE id=@id`, { nombre, id });
    res.json({ message: 'Mercado actualizado' });
  } catch (e) {
    res.status(500).json({ message: 'Error al actualizar mercado' });
  }
}

export async function deleteMercado(req, res) {
  const { id } = req.params;
  if (!isGuid(id)) return res.status(400).json({ message: 'ID inválido' });
  try {
    // Con ON DELETE CASCADE en FK Empresa(id_mercado) y Mercado_Habilitado(id_mercado)
    await queryDB(`DELETE FROM Mercado WHERE id=@id`, { id });
    res.json({ message: 'Mercado eliminado' });
  } catch (e) {
    res.status(500).json({ message: 'Debe deslistar las empresas antes de eliminar el mercado' });
  }
}

// Empresas (vista admin)
export async function getEmpresasAdmin(_req, res) {
  try {
    const rows = await queryDB(`
      SELECT 
        e.id, e.nombre, e.ticker, e.id_mercado,
        m.nombre AS mercado,
        i.precio AS precio_actual,
        i.acciones_totales, i.acciones_disponibles, i.capitalizacion,
        ult.fecha AS fecha_actualizacion
      FROM Empresa e
      JOIN Mercado m ON e.id_mercado = m.id
      LEFT JOIN Inventario i ON e.id = i.id_empresa
      OUTER APPLY (
        SELECT TOP 1 ih.fecha
        FROM Inventario_Historial ih
        WHERE ih.id_empresa = e.id
        ORDER BY ih.fecha DESC
      ) ult
      ORDER BY m.nombre, e.nombre
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener empresas' });
  }
}

export async function createEmpresaAdmin(req, res) {
  const { nombre, ticker, id_mercado, precio, acciones_totales } = req.body;
  if (!nombre || !ticker || !id_mercado)
    return res.status(400).json({ message: 'Datos requeridos' });
  try {
    const ins = await queryDB(
      `INSERT INTO Empresa (nombre, ticker, id_mercado)
       OUTPUT INSERTED.id
       VALUES (@nombre, @ticker, @id_mercado)`,
      { nombre, ticker: String(ticker).toUpperCase(), id_mercado }
    );
    const idEmpresa = ins[0].id;

    if (precio && acciones_totales) {
      if (precio <= 0 || acciones_totales <= 0)
        return res.status(400).json({ message: 'Capitalización inválida' });

      await queryDB(
        `INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio)
         VALUES (@id_empresa, @acciones_totales, @acciones_totales, @precio)`,
        { id_empresa: idEmpresa, acciones_totales, precio }
      );

      await queryDB(
        `INSERT INTO Inventario_Historial (fecha, id_empresa, acciones_totales, acciones_disponibles, precio)
         SELECT SYSUTCDATETIME(), id_empresa, acciones_totales, acciones_disponibles, precio
         FROM Inventario WHERE id_empresa=@id_empresa`,
        { id_empresa: idEmpresa }
      );
    }

    res.status(201).json({ message: 'Empresa creada', id: idEmpresa });
  } catch (e) {
    res.status(500).json({ message: 'Error al crear empresa' });
  }
}

export async function updateEmpresa(req, res) {
  const { id } = req.params;
  const { nombre, ticker, id_mercado } = req.body;
  if (!isGuid(id)) return res.status(400).json({ message: 'ID inválido' });
  if (!nombre || !ticker || !id_mercado)
    return res.status(400).json({ message: 'Datos requeridos' });

  try {
    await queryDB(
      `UPDATE Empresa 
       SET nombre=@nombre, ticker=@ticker, id_mercado=@id_mercado
       WHERE id=@id`,
      { id, nombre, ticker: String(ticker).toUpperCase(), id_mercado }
    );
    res.json({ message: 'Empresa actualizada' });
  } catch (e) {
    res.status(500).json({ message: 'Error al actualizar empresa' });
  }
}

// Actualizar inventario
export async function updateInventario(req, res) {
  const { id } = req.params;
  const a = Number(req.body.acciones_totales);
  
  if (!isGuid(id) || !a || a <= 0) return res.status(400).json({ message: 'Datos inválidos' });

  try {
    const inv = await queryDB(`SELECT acciones_totales FROM Inventario WHERE id_empresa=@id`, { id });
    if (!inv.length) return res.status(404).json({ message: 'Inventario no encontrado' });

    await queryDB(
      `UPDATE Inventario SET acciones_totales=@a, acciones_disponibles=acciones_disponibles+@dif WHERE id_empresa=@id`,
      { id, a, dif: a - inv[0].acciones_totales }
    );

    res.json({ message: 'Inventario actualizado' });
  } catch (e) {
    res.status(500).json({ message: 'Error' });
  }
}

export async function delistarEmpresa(req, res) {
  const { id } = req.params;
  const { justificacion, precio_liquidacion } = req.body;

  if (!isGuid(id)) return res.status(400).json({ message: 'ID inválido' });
  if (!justificacion?.trim()) return res.status(400).json({ message: 'Justificación requerida' });

  try {
    // Empresa + precio base
    const emp = await queryDB(
      `SELECT e.nombre, e.ticker, i.precio
         FROM Empresa e
         LEFT JOIN Inventario i ON i.id_empresa = e.id
        WHERE e.id = @id`, { id }
    );
    if (!emp.length) return res.status(404).json({ message: 'Empresa no encontrada' });

    const precio = (precio_liquidacion && Number(precio_liquidacion) > 0)
      ? Number(precio_liquidacion)
      : Number(emp[0].precio) || 0;

    if (precio <= 0) {
      return res.status(400).json({ message: 'No hay precio válido para liquidar (fije precio_liquidacion o cargue precio actual)' });
    }

    // Posiciones NETAS por alias 
    const posiciones = await queryDB(`
      SELECT t.alias,
             SUM(CASE WHEN t.tipo='Compra' THEN t.cantidad
                      WHEN t.tipo='Venta'  THEN -t.cantidad ELSE 0 END) AS cantidad_neta
        FROM Transaccion t
       WHERE t.id_empresa = @id
       GROUP BY t.alias
      HAVING SUM(CASE WHEN t.tipo='Compra' THEN t.cantidad
                      WHEN t.tipo='Venta'  THEN -t.cantidad ELSE 0 END) > 0
    `, { id });

    let totalLiquidado = 0;
    let posicionesLiquidadas = 0;

    for (const pos of posiciones) {
      const cantidad = Number(pos.cantidad_neta);

      // Datos del usuario wallet y portafolio
      const u = await queryDB(
        `SELECT id, id_billetera, id_portafolio FROM Usuario WHERE alias = @alias`,
        { alias: pos.alias }
      );
      if (!u.length || !u[0].id_billetera || !u[0].id_portafolio) continue;
      
      const idBilletera = u[0].id_billetera;
      const idPortafolio = u[0].id_portafolio;

      const monto = cantidad * precio;
      
      // Abonar al wallet
      await queryDB(
        `UPDATE Billetera SET fondos = fondos + @monto WHERE id = @id_billetera`,
        { monto, id_billetera: idBilletera }
      );
      
      // Devolver acciones a Tesorería
      await queryDB(
        `UPDATE Inventario
            SET acciones_disponibles = acciones_disponibles + @cantidad
          WHERE id_empresa = @id`,
        { cantidad, id }
      );
      
      // Registrar la "venta" por delist 
      await queryDB(
        `INSERT INTO Transaccion (alias, id_portafolio, id_billetera, id_empresa, tipo, precio, cantidad)
         VALUES (@alias, @id_portafolio, @id_billetera, @id, 'Venta', @precio, @cantidad)`,
        {
          alias: pos.alias,
          id_portafolio: idPortafolio,
          id_billetera: idBilletera,
          id,
          precio,
          cantidad
        }
      );

      // Actualizar SOLO las filas del portafolio específico Y empresa específica
      const portafolioCheck = await queryDB(
        `SELECT * FROM Portafolio WHERE id_empresa = @id_empresa`,
        { id_empresa: id }
      );
      
      console.log('[updateInventario] Portfolio check completed');
      
      // Intentar actualización específica
      await queryDB(
        `UPDATE p
         SET p.acciones = 0 
         FROM Portafolio p
         INNER JOIN Usuario u ON u.id_portafolio = p.id
         WHERE u.alias = @alias 
         AND p.id_empresa = @id_empresa`,
        { alias: pos.alias, id_empresa: id }
      );

      totalLiquidado += monto;
      posicionesLiquidadas++;
    }

    // Marcar empresa como delistada 
    await queryDB(
      `UPDATE Empresa SET delistada = 1 WHERE id = @id`,
      { id }
    );

    res.json({
      message: posicionesLiquidadas ? 'Empresa delistada con posiciones liquidadas' : 'Empresa delistada',
      posiciones_liquidadas: posicionesLiquidadas,
      total_liquidado: totalLiquidado,
      precio_liquidacion: precio,
      justificacion
    });
  } catch (e) {
    console.error('[delistarEmpresa] Error delisting company:', e.message);
    res.status(500).json({ message: 'Error al delistar empresa' });
  }
}

// Precios & Carga
export async function getHistorialPrecio(req, res) {
  const { id } = req.params;
  if (!isGuid(id)) return res.status(400).json({ message: 'ID inválido' });
  try {
    const rows = await queryDB(
      `SELECT fecha, precio
       FROM Inventario_Historial
       WHERE id_empresa=@id
       ORDER BY fecha ASC`,
      { id }
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener historial' });
  }
}

export async function cargarPrecioManual(req, res) {
  const { id } = req.params;
  const { precio, fecha } = req.body;
  if (!isGuid(id)) return res.status(400).json({ message: 'ID inválido' });
  const p = Number(precio);
  if (!p || p <= 0) return res.status(400).json({ message: 'Precio inválido' });
  if (!fecha)        return res.status(400).json({ message: 'Fecha requerida' });

  const f = new Date(fecha);
  if (isNaN(f.getTime()) || f > new Date())
    return res.status(400).json({ message: 'Fecha inválida' });

  try {
    const inv = await queryDB(`SELECT 1 FROM Inventario WHERE id_empresa=@id`, { id });
    if (inv.length === 0) {
      await queryDB(
        `INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio)
         VALUES (@id, 0, 0, @p)`,
        { id, p }
      );
    } else {
      await queryDB(`UPDATE Inventario SET precio=@p WHERE id_empresa=@id`, { id, p });
    }

    await queryDB(
      `INSERT INTO Inventario_Historial (fecha, id_empresa, acciones_totales, acciones_disponibles, precio)
       SELECT @f, id_empresa, acciones_totales, acciones_disponibles, @p
       FROM Inventario WHERE id_empresa=@id`,
      { id, p, f }
    );

    res.json({ message: 'Precio cargado', precio: p, fecha: f });
  } catch (e) {
    res.status(500).json({ message: 'Error al cargar precio' });
  }
}

export async function cargarPreciosBatch(req, res) {
  const { precios } = req.body; // [{ id_empresa, precio, fecha? }]
  if (!Array.isArray(precios) || precios.length === 0)
    return res.status(400).json({ message: 'Datos inválidos' });

  let ok = 0, fail = 0;
  const errores = [];

  for (const it of precios) {
    try {
      const id = it?.id_empresa;
      const p = Number(it?.precio);
      if (!isGuid(id) || !p || p <= 0) throw new Error('dato');

      let f = null;
      if (it.fecha) {
        const d = new Date(it.fecha);
        if (isNaN(d.getTime()) || d > new Date()) throw new Error('fecha');
        f = d;
      }

      const inv = await queryDB(`SELECT 1 FROM Inventario WHERE id_empresa=@id`, { id });
      if (inv.length === 0) {
        await queryDB(
          `INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio)
           VALUES (@id, 0, 0, @p)`,
          { id, p }
        );
      } else {
        await queryDB(`UPDATE Inventario SET precio=@p WHERE id_empresa=@id`, { id, p });
      }

      await queryDB(
        `INSERT INTO Inventario_Historial (fecha, id_empresa, acciones_totales, acciones_disponibles, precio)
         SELECT ${f ? '@f' : 'SYSUTCDATETIME()'}, id_empresa, acciones_totales, acciones_disponibles, @p
         FROM Inventario WHERE id_empresa=@id`,
        f ? { id, p, f } : { id, p }
      );

      ok++;
    } catch (e) {
      fail++; errores.push({ id_empresa: it?.id_empresa, error: 'inválido' });
    }
  }

  res.json({ message: 'Carga completada', exitosos: ok, fallidos: fail, errores });
}

// Usuarios (solo lectura para admin)
export async function getUsuarios(_req, res) {
  try {
    const rows = await queryDB(`
      SELECT id, alias, nombre, rol, habilitado, correo, telefono, direccion, pais_origen, id_billetera
      FROM Usuario
      ORDER BY alias
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
}

export async function getUsuarioCuentas(req, res) {
  const { id } = req.params;
  if (!isGuid(id)) return res.status(400).json({ message: 'ID inválido' });

  try {
    const u = await queryDB(
      `SELECT id, rol, id_billetera FROM Usuario WHERE id=@id`,
      { id }
    );
    if (!u.length) return res.status(404).json({ message: 'Usuario no encontrado' });

    let wallet = null;
    if (u[0].rol === 'Trader' && u[0].id_billetera) {
      const w = await queryDB(
        `SELECT id, fondos AS saldo, categoria, limite_diario, consumo
         FROM Billetera WHERE id=@bid`,
        { bid: u[0].id_billetera }
      );
      if (w.length) wallet = w[0];
    }

    const mercados = await queryDB(
      `SELECT m.id, m.nombre
         FROM Mercado_Habilitado mh
         JOIN Mercado m ON m.id = mh.id_mercado
        WHERE mh.id_usuario=@id
        ORDER BY m.nombre`,
      { id }
    );

    res.json({ wallet, mercados });
  } catch (e) {
    console.error('[getUsuarioCuentas] Error fetching user accounts:', e.message);
    res.status(500).json({ message: 'Error al obtener cuentas' });
  }
}


// Mercados habilitados por usuario 
export async function habilitarMercado(req, res) {
    const { id } = req.params; // id del usuario
    const { id_mercado } = req.body;
    
    // Usar isGuid en lugar de guidRegex
    if (!isGuid(id) || !isGuid(id_mercado)) {
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
        console.error('[habilitarMercado] Error enabling market:', error.message);
        res.status(500).json({ message: 'Error al habilitar mercado' });
    }
}

export async function deshabilitarMercado(req, res) {
    const { id, idMercado } = req.params;
    
    // Usar isGuid en lugar de guidRegex
    if (!isGuid(id) || !isGuid(idMercado)) {
        return res.status(400).json({ message: 'IDs inválidos' });
    }

    try {
        await queryDB(
            `DELETE FROM Mercado_Habilitado WHERE id_usuario = @id_usuario AND id_mercado = @id_mercado`,
            { id_usuario: id, id_mercado: idMercado }
        );

        res.json({ message: 'Mercado deshabilitado exitosamente' });
    } catch (error) {
        console.error('[deshabilitarMercado] Error disabling market:', error.message);
        res.status(500).json({ message: 'Error al deshabilitar mercado' });
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
        console.error('[deshabilitarUsuario] Error disabling user:', error.message);
        res.status(500).json({ message: 'Error al deshabilitar usuario' });
    }
}
// Rankings
export async function getTopWallet(_req, res) {
  try {
    const rows = await queryDB(`
      SELECT TOP 5 u.alias, b.fondos AS saldo
      FROM Usuario u
      JOIN Billetera b ON u.id_billetera=b.id
      WHERE u.rol='Trader' AND u.habilitado=1
      ORDER BY b.fondos DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener ranking' });
  }
}

export async function getTopAcciones(_req, res) {
  try {
    // valor en acciones = suma(posición neta * precio actual)
    const traders = await queryDB(
      `SELECT alias FROM Usuario WHERE rol='Trader' AND habilitado=1`
    );

    const resultados = [];
    for (const t of traders) {
      const pos = await queryDB(
        `SELECT id_empresa,
                SUM(CASE WHEN tipo='Compra' THEN cantidad WHEN tipo='Venta' THEN -cantidad ELSE 0 END) AS cantidad_neta
         FROM Transaccion
         WHERE alias=@a
         GROUP BY id_empresa
         HAVING SUM(CASE WHEN tipo='Compra' THEN cantidad WHEN tipo='Venta' THEN -cantidad ELSE 0 END) > 0`,
        { a: t.alias }
      );

      let total = 0;
      for (const p of pos) {
        const pr = await queryDB(`SELECT precio FROM Inventario WHERE id_empresa=@e`, { e: p.id_empresa });
        if (pr.length > 0) total += Number(p.cantidad_neta) * Number(pr[0].precio);
      }
      if (total > 0) resultados.push({ alias: t.alias, valor_acciones: total });
    }

    resultados.sort((a, b) => b.valor_acciones - a.valor_acciones);
    res.json(resultados.slice(0, 5));
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener ranking' });
  }
}
