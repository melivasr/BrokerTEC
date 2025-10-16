import { queryDB } from "../config/db.js";
import sql from 'mssql';
import { dbConfig } from '../config/db.js';

export async function getWallet(req, res) {
  const userId = req.user.id;

  try {
    // Obtener la billetera asociada al usuario según el schema actual (Billetera)
    const billetera = await queryDB(
      `SELECT b.id AS id, b.fondos AS saldo, b.categoria AS categoria, b.limite_diario AS limite_diario, b.consumo AS consumo
       FROM Billetera b
       JOIN Usuario u ON u.id_billetera = b.id
       WHERE u.id = @userId`,
      { userId }
    );

    if (!billetera || billetera.length === 0) return res.status(404).json({ message: "Billetera no encontrada" });

    const b = billetera[0];

    // Construir historial de recargas a partir de Billetera_Historial usando LAG para calcular deltas (monto de cada cambio positivo)
    const recargasQuery = `
      SELECT fecha, CONVERT(varchar(50), fecha, 126) AS fecha_iso, fondos - LAG(fondos, 1, 0) OVER (ORDER BY fecha) AS monto_delta
      FROM Billetera_Historial
      WHERE id_billetera = @billeteraId
      ORDER BY fecha DESC
    `;
    const recargasRaw = await queryDB(recargasQuery, { billeteraId: b.id });
    const recargas = (recargasRaw || [])
      .map(r => ({ fecha: r.fecha, fecha_iso: r.fecha_iso, monto: r.monto_delta }))
      .filter(r => r.monto && Number(r.monto) > 0)
      .map(r => ({ recarga_id: r.fecha_iso, monto: Number(r.monto), fecha_hora: new Date(r.fecha).toISOString() }));

    // Normalizar nombres esperados por el frontend
    res.json({
      id: b.id,
      saldo: Number(b.saldo),
      categoria: b.categoria,
      limite_diario: Number(b.limite_diario),
      consumo_diario: Number(b.consumo),
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
      const bb = await new sql.Request(transaction).input('billeteraId', billeteraId).query(`SELECT id, categoria, fondos, limite_diario, consumo FROM Billetera WHERE id = @billeteraId`);
      if (!bb.recordset || bb.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Billetera no encontrada' });
      }
      const b = bb.recordset[0];
      const limiteRestante = Number(b.limite_diario) - Number(b.consumo);
      if (amount > limiteRestante) {
        await transaction.rollback();
        return res.status(400).json({ message: 'se alcanzó el límite diario' });
      }

      // Actualizar fondos y consumo
      await new sql.Request(transaction).input('monto', amount).input('billeteraId', billeteraId).query(`UPDATE Billetera SET fondos = fondos + @monto, consumo = consumo + @monto WHERE id = @billeteraId`);

      // Registrar snapshot en historial
      await new sql.Request(transaction).input('billeteraId', billeteraId).query(`INSERT INTO Billetera_Historial (id_billetera, categoria, fondos, limite_diario, consumo)
        SELECT id, categoria, fondos, limite_diario, consumo FROM Billetera WHERE id = @billeteraId`);

      await transaction.commit();

      // Obtener estado actualizado y recargas recientes
      const updated = await queryDB(`SELECT id, fondos AS saldo, categoria, limite_diario, consumo FROM Billetera WHERE id = @billeteraId`, { billeteraId });
      const recargasQuery = `
        SELECT fecha, CONVERT(varchar(50), fecha, 126) AS fecha_iso, fondos - LAG(fondos, 1, 0) OVER (ORDER BY fecha) AS monto_delta
        FROM Billetera_Historial
        WHERE id_billetera = @billeteraId
        ORDER BY fecha DESC
      `;
      const recRaw = await queryDB(recargasQuery, { billeteraId });
      const recargas = (recRaw || [])
        .map(r => ({ fecha: r.fecha, fecha_iso: r.fecha_iso, monto: r.monto_delta }))
        .filter(r => r.monto && Number(r.monto) > 0)
        .map(r => ({ recarga_id: r.fecha_iso, monto: Number(r.monto), fecha_hora: new Date(r.fecha).toISOString() }));

      return res.json({ message: 'Recarga exitosa', saldo: Number(updated[0].saldo), consumo_diario: Number(updated[0].consumo), recargas });
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
