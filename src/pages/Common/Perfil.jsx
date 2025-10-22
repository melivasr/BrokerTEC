import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { getCurrentUser, updateUser, deleteUser, changePassword } from "../../services/authService";

export default function Perfil() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ old: "", new: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    setForm({
      alias: u?.alias || "",
      nombre: u?.nombre || "",
      correo: u?.correo || "",
      direccion: u?.direccion || "",
      pais_origen: u?.pais_origen || "",
      telefono: u?.telefono || ""
    });
  }, []);

  if (!user) return <div>Cargando perfil...</div>;

  const validatePassword = (pw) => pw.length >= 6 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await updateUser(form);
      setSuccess("Datos actualizados correctamente.");
      setEditMode(false);
      setUser({ ...user, ...form });
    } catch (err) {
      setError(err?.message || "Error al actualizar datos.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar tu cuenta?")) return;
    try {
      await deleteUser(user.id);
      setSuccess("Cuenta eliminada. Redirigiendo...");
      setTimeout(() => window.location.href = "/login", 2000);
    } catch (err) {
      setError(err?.message || "Error al eliminar cuenta.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (!validatePassword(passwords.new)) {
      setPwError("Contraseña débil. Debe tener al menos 6 caracteres, una mayúscula y un número.");
      return;
    }
    try {
      await changePassword({ id: user.id, old: passwords.old, new: passwords.new });
      setPwSuccess("Contraseña cambiada correctamente.");
      setPasswords({ old: "", new: "" });
    } catch (err) {
      setPwError(err?.message || "Error al cambiar contraseña.");
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar rol={user.rol} />
      <main className="app-main">
        <h2>Perfil de Usuario</h2>
        <div style={{ background: 'var(--card-bg)', padding: 24, borderRadius: 8, boxShadow: "0 2px 8px #eee", maxWidth: 500 }}>
          {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}
          {success && <div style={{ color: "green", marginBottom: 10 }}>{success}</div>}
          {!editMode ? (
            <>
              <h3>Datos personales</h3>
              <p><b>Alias:</b> {user.alias}</p>
              <p><b>Nombre:</b> {user.nombre}</p>
              <p><b>Correo:</b> {user.correo}</p>
              <p><b>Dirección:</b> {user.direccion}</p>
              <p><b>País de origen:</b> {user.pais_origen}</p>
              <p><b>Teléfono:</b> {user.telefono}</p>
              <button onClick={() => setEditMode(true)} style={{ marginTop: 12 }} className="btn-block">Editar datos</button>
              <button onClick={handleDelete} style={{ marginLeft: 12, color: 'red' }} className="small-hide-mobile">Eliminar cuenta</button>
            </>
          ) : (
            <form onSubmit={handleUpdate}>
              <h3>Editar datos personales</h3>
              <label>Alias</label>
              <input className="form-control" type="text" value={form.alias} onChange={e => setForm({ ...form, alias: e.target.value })} required />
              <label>Nombre</label>
              <input className="form-control" type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              <label>Correo</label>
              <input className="form-control" type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} required />
              <label>Dirección</label>
              <input className="form-control" type="text" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
              <label>País de origen</label>
              <input className="form-control" type="text" value={form.pais_origen} onChange={e => setForm({ ...form, pais_origen: e.target.value })} />
              <label>Teléfono</label>
              <input className="form-control" type="text" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
              <button type="submit" style={{ marginTop: 12 }} className="btn-block">Guardar cambios</button>
              <button type="button" onClick={() => setEditMode(false)} style={{ marginLeft: 12 }} className="small-hide-mobile">Cancelar</button>
            </form>
          )}
          <hr style={{ margin: '24px 0' }} />
          <form onSubmit={handleChangePassword}>
            <h3>Cambiar contraseña</h3>
            <input
              className="form-control"
              type={showPassword ? "text" : "password"}
              value={passwords.old}
              onChange={e => setPasswords({ ...passwords, old: e.target.value })}
              placeholder="Contraseña actual"
              required
            />
            <input
              className="form-control"
              type={showPassword ? "text" : "password"}
              value={passwords.new}
              onChange={e => setPasswords({ ...passwords, new: e.target.value })}
              placeholder="Nueva contraseña"
              required
            />
            <label>
              <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} /> Mostrar contraseñas
            </label>
            <button type="submit" style={{ marginTop: 12 }} className="btn-block">Cambiar contraseña</button>
            {pwError && <div style={{ color: "red", marginTop: 8 }}>{pwError}</div>}
            {pwSuccess && <div style={{ color: "green", marginTop: 8 }}>{pwSuccess}</div>}
          </form>
        </div>
      </main>
    </div>
  );
}