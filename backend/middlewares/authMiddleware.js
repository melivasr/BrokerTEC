import jwt from "jsonwebtoken";
import { queryDB } from "../config/db.js";

export function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).json({ message: "Token requerido" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Token inválido" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token expirado o inválido" });

    req.user = decoded; // { id, rol }
    next();
  });
}

/**
 * Middleware para verificar que el usuario tiene uno de los roles especificados
 * @param {...string} rolesPermitidos - Roles permitidos (ej: 'Admin', 'Trader', 'Analista')
 * @returns {Function} Middleware function
 */
export function verifyRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const rolUsuario = req.user.rol;
    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({ 
        message: `Acceso denegado. Se requiere uno de estos roles: ${rolesPermitidos.join(', ')}`,
        rolActual: rolUsuario,
        rolesPermitidos
      });
    }

    next();
  };
}

/**
 * Middleware para validar que el usuario tiene una billetera asociada
 * Almacena el ID de la billetera en req.userBilletera para uso posterior
 * Uso: router.use(verifyToken); router.use(verifyBilleterable);
 */
export async function verifyBilleterable(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const user = await queryDB(
      `SELECT id_billetera FROM Usuario WHERE id = @userId`,
      { userId }
    );

    if (!user || user.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const billeteraId = user[0].id_billetera;
    if (!billeteraId) {
      return res.status(404).json({ message: "Usuario sin billetera asociada" });
    }

    // Guardar en req para uso posterior en controllers
    req.userBilletera = billeteraId;
    req.userId = userId;
    next();
  } catch (err) {
    console.error("[verifyBilleterable] Error validating billetera:", err.message);
    res.status(500).json({ message: "Error en validación", error: err.message });
  }
}
