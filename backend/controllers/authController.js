import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { queryDB } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

// Registro de usuario
export async function register(req, res) {
  const { alias, nombre, direccion, pais_origen, telefono, correo, password, rol } = req.body;
  try {
    // Verificar si el alias o correo ya existen
    const existing = await queryDB(
      "SELECT * FROM Usuario WHERE alias = @alias OR correo = @correo",
      { alias, correo }
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Alias o correo ya registrado" });
    }
    // Encriptar contraseña
  const contrasena_hash = await bcrypt.hash(password, 10);

  // Crear billetera asociada segun rol
    let categoria = "Junior";
    if (rol === "Analista") categoria = "Mid";
    if (rol === "Admin") categoria = "Senior";

  const billeteraId = uuidv4();
    await queryDB(
    `INSERT INTO Billetera (id, categoria, fondos, limite_diario, consumo)
    VALUES (@id, @categoria, 0, 0, 0)`,
    { id: billeteraId, categoria }
  );

  // Si el usuario es Trader, crear también un portafolio vacío
    let portafolioId = null;
    if (rol === "Trader") {
      portafolioId = uuidv4();
      await queryDB(
        `INSERT INTO Portafolio (id, id_empresa, acciones)
         VALUES (@id, (SELECT TOP 1 id FROM Empresa), 0)`,
        { id: portafolioId }
      );
    }

  // Insertar usuario
    await queryDB(
      `INSERT INTO Usuario (id_billetera, id_portafolio, nombre, alias, direccion, pais_origen, telefono, correo, contrasena_hash, rol)
       VALUES (@id_billetera, @id_portafolio, @nombre, @alias, @direccion, @pais_origen, @telefono, @correo, @contrasena_hash, @rol)`,
      {
        id_billetera: billeteraId,
        id_portafolio: portafolioId,
        nombre,
        alias,
        direccion,
        pais_origen,
        telefono,
        correo,
        contrasena_hash,
        rol
      }
    );

    res.json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el registro", error });
  }
}

// Iniciar sesión
export async function login(req, res) {
  const { alias, password } = req.body;

  try {
    const users = await queryDB(
      "SELECT * FROM Usuario WHERE alias = @alias",
      { alias }
    );
    const user = users[0];

  if (!user || !(await bcrypt.compare(password, user.contrasena_hash))) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

  // Excluir la contraseña del usuario retornado
  const { contrasena_hash, ...userData } = user;
  res.json({ token, user: userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el login", error });
  }
}

// Actualizar datos de usuario
export async function updateUser(req, res) {
  const { id } = req.params;
  const { alias, nombre, direccion, pais_origen, telefono, correo, rol } = req.body;
  try {
    await queryDB(
      `UPDATE Usuario SET alias=@alias, nombre=@nombre, direccion=@direccion, pais_origen=@pais_origen, telefono=@telefono, correo=@correo, rol=@rol WHERE id=@id`,
      { id, alias, nombre, direccion, pais_origen, telefono, correo, rol }
    );
    res.json({ message: "Datos actualizados correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar usuario", error });
  }
}

// Eliminar usuario
export async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    await queryDB(`DELETE FROM Usuario WHERE id=@id`, { id });
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar usuario", error });
  }
}

// Cambiar contraseña
export async function changePassword(req, res) {
  const { id } = req.params;
  const { old, new: newPassword } = req.body;
  try {
    const users = await queryDB(`SELECT contrasena_hash FROM Usuario WHERE id=@id`, { id });
    if (users.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
    const valid = await bcrypt.compare(old, users[0].contrasena_hash);
    if (!valid) return res.status(400).json({ message: "Contraseña actual incorrecta" });
    const newHash = await bcrypt.hash(newPassword, 10);
    await queryDB(`UPDATE Usuario SET contrasena_hash=@newHash WHERE id=@id`, { id, newHash });
    res.json({ message: "Contraseña cambiada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al cambiar contraseña", error });
  }
}