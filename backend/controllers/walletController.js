import { queryDB } from "../config/db.js";

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

    res.json(billetera[0]);
  } catch (error) {
    console.error('Error en getWallet:', error);
    res.status(500).json({ message: "Error al obtener wallet", error: error.message });
  }
}

export async function recargarWallet(req, res) {
  const userId = req.user.id;
  const { monto } = req.body;

  try {
    // Obtener id de la billetera
    const bRes = await queryDB(`SELECT id FROM Billetera WHERE id IN (SELECT id_billetera FROM Usuario WHERE id = @userId)`, { userId });
    if (!bRes || bRes.length === 0) return res.status(404).json({ message: 'Billetera no encontrada' });
    const billeteraId = bRes[0].id;

    await queryDB(`UPDATE Billetera SET fondos = fondos + @monto WHERE id = @billeteraId`, { monto, billeteraId });

    res.json({ message: 'Recarga exitosa' });
  } catch (error) {
    console.error('Error en recargarWallet:', error);
    res.status(500).json({ message: 'Error al recargar', error: error.message });
  }
}
