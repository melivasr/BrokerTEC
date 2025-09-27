import { queryDB } from "../config/db.js";

export async function getWallet(req, res) {
  const userId = req.user.id;

  try {
    const wallet = await queryDB(
      `SELECT w.wallet_id, w.saldo, c.nombre AS categoria, c.limite_diario, w.consumo_diario
       FROM Wallet w
       JOIN Categoria c ON w.categoria_id = c.categoria_id
       WHERE w.usuario_id = @userId`,
      { userId }
    );

    if (!wallet.length) return res.status(404).json({ message: "Wallet no encontrado" });

    const recargas = await queryDB(
      `SELECT recarga_id, monto, fecha_hora
       FROM Recarga
       WHERE wallet_id = @walletId
       ORDER BY fecha_hora DESC`,
      { walletId: wallet[0].wallet_id }
    );

    res.json({ ...wallet[0], recargas });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener wallet", error });
  }
}

export async function recargarWallet(req, res) {
  const userId = req.user.id;
  const { monto } = req.body;

  try {
    // Validación de límite diario
    // (puedes calcular sumatoria de recargas del día y compararla con limite_diario)

    await queryDB(
      `INSERT INTO Recarga(wallet_id, monto)
       VALUES ((SELECT wallet_id FROM Wallet WHERE usuario_id = @userId), @monto)`,
      { userId, monto }
    );

    res.json({ message: "Recarga exitosa" });
  } catch (error) {
    res.status(500).json({ message: "Error al recargar", error });
  }
}
