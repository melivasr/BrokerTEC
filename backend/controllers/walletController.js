import { queryDB } from "../config/db.js";
import sql from 'mssql';
import { dbConfig } from '../config/db.js';
// Duración del bloqueo en minutos (por defecto 1440 = 24h). Se puede ajustar con la variable de entorno BLOQUEO_MINUTOS.
const BLOQUEO_MINUTOS = Number(process.env.BLOQUEO_MINUTOS) || 1;

export async function getWallet(req, res) {
  const userId = req.user.id;

  try {
    // Obtener la billetera asociada al usuario según el schema actual (Billetera)
    const billetera = await queryDB(
      `SELECT b.id AS id, b.fondos AS saldo, b.categoria AS categoria, b.limite_diario AS limite_diario, b.consumo AS consumo, b.bloqueo_hasta AS bloqueo_hasta
       FROM Billetera b
       JOIN Usuario u ON u.id_billetera = b.id
       WHERE u.id = @userId`,
      { userId }
    );

    if (!billetera || billetera.length === 0) return res.status(404).json({ message: "Billetera no encontrada" });

    let b = billetera[0];

    // Si existe bloqueo pero ya expiró, resetear consumo y limpiar bloqueo_hasta
    if (b.bloqueo_hasta) {
      const bloqueoDate = new Date(b.bloqueo_hasta);
      const ahora = new Date();
      if (bloqueoDate <= ahora) {
        // Resetear consumo y limpiar bloqueo
        await queryDB(`UPDATE Billetera SET consumo = 0, bloqueo_hasta = NULL WHERE id = @billeteraId`, { billeteraId: b.id });
        // Registrar snapshot en historial
        await queryDB(`INSERT INTO Billetera_Historial (id_billetera, categoria, fondos, limite_diario, consumo, bloqueo_hasta)
          SELECT id, categoria, fondos, limite_diario, consumo, bloqueo_hasta FROM Billetera WHERE id = @billeteraId`, { billeteraId: b.id });
        // Volver a obtener la fila actualizada
        const refreshed = await queryDB(
          `SELECT b.id AS id, b.fondos AS saldo, b.categoria AS categoria, b.limite_diario AS limite_diario, b.consumo AS consumo, b.bloqueo_hasta AS bloqueo_hasta
           FROM Billetera b
           WHERE b.id = @billeteraId`,
          { billeteraId: b.id }
        );
        if (refreshed && refreshed.length) b = refreshed[0];
      }
    }

    // Construir historial de recargas a partir de Billetera_Historial usando recarga_monto (solo recargas explícitas)
    const recargasQuery = `
      SELECT fecha, CONVERT(varchar(50), fecha, 126) AS fecha_iso, recarga_monto
      FROM Billetera_Historial
      WHERE id_billetera = @billeteraId AND recarga_monto IS NOT NULL AND recarga_monto > 0
      ORDER BY fecha DESC
    `;
    const recargasRaw = await queryDB(recargasQuery, { billeteraId: b.id });
    const recargas = (recargasRaw || [])
      .map(r => ({ fecha: r.fecha, fecha_iso: r.fecha_iso, monto: r.recarga_monto }))
      .map(r => ({ recarga_id: r.fecha_iso, monto: Number(r.monto), fecha_hora: new Date(r.fecha).toISOString() }));

    // Normalizar nombres esperados por el frontend
    res.json({
      id: b.id,
      saldo: Number(b.saldo),
      categoria: b.categoria,
      limite_diario: Number(b.limite_diario),
      consumo_diario: Number(b.consumo),
      bloqueo_hasta: b.bloqueo_hasta ? new Date(b.bloqueo_hasta).toISOString() : null,
      recargas,
    });
  } catch (error) {
    console.error('Error en getWallet:', error);
    res.status(500).json({ message: "Error al obtener wallet", error: error.message });
  }
}

export async function recargarWallet(req, res) {
  const userId = req.user.id;
  const { monto } = req.body;

  try {
    // Validar monto
    const amount = Number(monto);
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'monto inválido' });
    }

    // Usar transacción para evitar condiciones de carrera
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();

      // Obtener id de la billetera del usuario
      const bRes = await new sql.Request(transaction).input('userId', userId).query(`SELECT id_billetera FROM Usuario WHERE id = @userId`);
      if (!bRes.recordset || bRes.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Billetera no encontrada' });
      }
      const billeteraId = bRes.recordset[0].id_billetera;

      // Obtener datos actuales de la billetera
      const bb = await new sql.Request(transaction).input('billeteraId', billeteraId).query(`SELECT id, categoria, fondos, limite_diario, consumo, bloqueo_hasta FROM Billetera WHERE id = @billeteraId`);
      if (!bb.recordset || bb.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Billetera no encontrada' });
      }
      const b = bb.recordset[0];
      // Si existe bloqueo activo, rechazar
      if (b.bloqueo_hasta) {
        const bloqueoDate = new Date(b.bloqueo_hasta);
        const ahora = new Date();
        if (bloqueoDate > ahora) {
          await transaction.rollback();
          return res.status(400).json({ message: 'bloqueado', bloqueo_hasta: bloqueoDate.toISOString() });
        }
      }
      const limiteRestante = Number(b.limite_diario) - Number(b.consumo);
      if (amount > limiteRestante) {
        await transaction.rollback();
        return res.status(400).json({ message: 'se alcanzó el límite diario' });
      }

      // Actualizar fondos y consumo
      await new sql.Request(transaction).input('monto', amount).input('billeteraId', billeteraId).query(`UPDATE Billetera SET fondos = fondos + @monto, consumo = consumo + @monto WHERE id = @billeteraId`);

      // Después de actualizar, verificar si se alcanzó el límite y establecer bloqueo por 24 horas si corresponde
      const after = await new sql.Request(transaction).input('billeteraId', billeteraId).query(`SELECT consumo, limite_diario FROM Billetera WHERE id = @billeteraId`);
      const consumoActual = Number(after.recordset[0].consumo);
      const limiteTotal = Number(after.recordset[0].limite_diario);
      let bloqueoHasta = null;
      if (consumoActual >= limiteTotal) {
        // calcular bloqueo según variable de entorno (minutos)
        const minutos = Number.isFinite(BLOQUEO_MINUTOS) ? BLOQUEO_MINUTOS : 1440;
        bloqueoHasta = new Date(Date.now() + minutos * 60 * 1000);
        await new sql.Request(transaction).input('bloqueo', bloqueoHasta).input('billeteraId', billeteraId).query(`UPDATE Billetera SET bloqueo_hasta = @bloqueo WHERE id = @billeteraId`);
      }

      // Registrar snapshot en historial (incluyendo bloqueo_hasta). Añadir recarga_monto para identificar recargas explícitas
      await new sql.Request(transaction).input('billeteraId', billeteraId).input('monto', amount).query(`INSERT INTO Billetera_Historial (id_billetera, categoria, fondos, limite_diario, consumo, bloqueo_hasta, recarga_monto)
        SELECT id, categoria, fondos, limite_diario, consumo, bloqueo_hasta, @monto FROM Billetera WHERE id = @billeteraId`);

      await transaction.commit();

      // Obtener estado actualizado y recargas recientes
      const updated = await queryDB(`SELECT id, fondos AS saldo, categoria, limite_diario, consumo, bloqueo_hasta FROM Billetera WHERE id = @billeteraId`, { billeteraId });
      const recargasQuery = `
        SELECT fecha, CONVERT(varchar(50), fecha, 126) AS fecha_iso, recarga_monto
        FROM Billetera_Historial
        WHERE id_billetera = @billeteraId AND recarga_monto IS NOT NULL AND recarga_monto > 0
        ORDER BY fecha DESC
      `;
      const recRaw = await queryDB(recargasQuery, { billeteraId });
      const recargas = (recRaw || [])
        .map(r => ({ fecha: r.fecha, fecha_iso: r.fecha_iso, monto: r.recarga_monto }))
        .map(r => ({ recarga_id: r.fecha_iso, monto: Number(r.monto), fecha_hora: new Date(r.fecha).toISOString() }));

      return res.json({ message: 'Recarga exitosa', saldo: Number(updated[0].saldo), consumo_diario: Number(updated[0].consumo), bloqueo_hasta: updated[0].bloqueo_hasta ? new Date(updated[0].bloqueo_hasta).toISOString() : null, recargas });
    } catch (err) {
      try { await transaction.rollback(); } catch (e) {}
      console.error('Error en recargarWallet (tx):', err);
      return res.status(500).json({ message: 'Error al recargar', error: err.message });
    } finally {
      try { pool && pool.close(); } catch (e) {}
    }
  } catch (error) {
    console.error('Error en recargarWallet:', error);
    res.status(500).json({ message: 'Error al recargar', error: error.message });
  }
}