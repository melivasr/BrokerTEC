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
    // Insertar usuario
    await queryDB(
  `INSERT INTO Usuario (alias, nombre, direccion, pais_origen, telefono, correo, contrasena_hash, rol, estado)
   VALUES (@alias, @nombre, @direccion, @pais_origen, @telefono, @correo, @contrasena_hash, @rol, 'Activo')`,
  { alias, nombre, direccion, pais_origen, telefono, correo, contrasena_hash, rol }
    );
    res.json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el registro", error });
  }
}
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { queryDB } from "../config/db.js";

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
      { id: user.usuario_id, rol: user.rol },
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
