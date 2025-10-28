import { queryDB } from "../config/db.js";

// Devuelve true si el usuario está habilitado (habilitado = 1/true), false si está deshabilitado o no existe
export async function isUserEnabled(userId) {
  if (!userId) return false;
  try {
    const rows = await queryDB(`SELECT habilitado FROM Usuario WHERE id = @userId`, { userId });
    if (!rows || rows.length === 0) return false;
    const v = rows[0].habilitado;
    // SQL BIT puede venir como 0/1 o booleano
    return v === 1 || v === true || v === '1';
  } catch (e) {
    console.error('isUserEnabled error:', e);
    return false;
  }
}
