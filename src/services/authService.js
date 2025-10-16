

import axios from "axios";
const API_URL = "http://localhost:4000/api/auth"; // Ajusta a tu backend

// Registrar usuario
export async function register({ alias, nombre, direccion, pais_origen, telefono, correo, password, rol }) {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      alias,
      nombre,
      direccion,
      pais_origen,
      telefono,
      correo,
      password,
      rol
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error en registro";
  }
}

// Iniciar sesión
export async function login(alias, password) {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      alias,
      password,
    });

    const { token, user } = response.data;

    // Guardar todos los datos del usuario retornados por el backend
    localStorage.setItem(
      "user",
      JSON.stringify({ ...user, token })
    );

    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error en login";
  }
}

// Cerrar sesión
export function logout() {
  localStorage.removeItem("user");
}

// Obtener usuario logueado
export function getCurrentUser() {
  return JSON.parse(localStorage.getItem("user"));
}

// Axios con token automático
export function authHeader() {
  const user = getCurrentUser();
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  } else {
    return {};
  }
}

// Actualizar datos personales
export async function updateUser(data) {
  try {
    const user = getCurrentUser();
    const response = await axios.put(
      `http://localhost:4000/api/auth/${user.id}`,
      data,
      { headers: authHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error al actualizar usuario";
  }
}

// Eliminar usuario
export async function deleteUser(id) {
  try {
    const response = await axios.delete(
      `http://localhost:4000/api/auth/${id}`,
      { headers: authHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error al eliminar usuario";
  }
}

// Cambiar contraseña
export async function changePassword({ id, old, new: newPassword }) {
  try {
    const response = await axios.post(
      `http://localhost:4000/api/auth/${id}/change-password`,
      { old, new: newPassword },
      { headers: authHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error al cambiar contraseña";
  }
}
