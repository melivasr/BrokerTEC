import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register, login } from "../../services/authService";
import logo from "../../logo.svg";

export default function Register() {
  const [form, setForm] = useState({
    alias: "",
    nombre: "",
    direccion: "",
    pais_origen: "",
    telefono: "",
    correo: "",
    password: "",
    rol: "Trader", // por defecto
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState("");
  const [errors, setErrors] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const errorBoxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onChange = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
    if (errorGlobal) setErrorGlobal("");
  };

  const requiredKeys = ["alias", "nombre", "direccion", "pais_origen", "telefono", "correo", "password"];

  const isValid = useMemo(
    () =>
      requiredKeys.every((k) => (form[k] || "").trim().length > 0) &&
      /\S+@\S+\.\S+/.test((form.correo || "").trim()),
    [form]
  );

  const phoneOk = (t) => {
    const v = (t || "").trim();
    return /^\+?\d[\d\s-]{5,}$/.test(v);
  };

  const validateFields = () => {
    const newErrors = {};
    requiredKeys.forEach((k) => {
      if (!(form[k] || "").trim()) newErrors[k] = "Este campo es obligatorio.";
    });
    if ((form.correo || "").trim() && !/\S+@\S+\.\S+/.test(form.correo.trim())) {
      newErrors.correo = "Formato de correo inválido.";
    }
    if ((form.telefono || "").trim() && !phoneOk(form.telefono)) {
      newErrors.telefono = "Teléfono inválido.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGlobal("");
    const newErrors = validateFields();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setErrorGlobal("Debes completar todos los espacios para continuar.");
      const first = Object.keys(newErrors)[0];
      setTimeout(() => {
        const el = document.getElementById(first);
        if (el) el.focus();
        if (errorBoxRef.current) errorBoxRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        alias: form.alias.trim(),
        nombre: form.nombre.trim(),
        direccion: form.direccion.trim(),
        pais_origen: form.pais_origen.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim(),
        password: form.password, 
        rol: "Trader",
      };

      await register(payload);
      const { user } = await login(payload.alias, payload.password);

      if (user?.rol === "Trader") navigate("/trader/home");
      else navigate("/perfil");
    } catch (err) {
      setErrorGlobal(typeof err === "string" ? err : (err?.message || "Error al registrarse"));
      setTimeout(() => {
        if (errorBoxRef.current) errorBoxRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    } finally {
      setLoading(false);
    }
  };

  // estilos
  const inputErrorStyle = (key) =>
    errors[key] ? { border: "1px solid #dc3545", outlineColor: "#dc3545" } : undefined;

  const toggleBtnStyle = {
    position: "absolute",
    right: 8,
    top: "10%",
    padding: "6px 10px",
    fontSize: 12,
    borderRadius: 6,
    background: "var(--button-bg)",
    color: "var(--button-text)",
    border: "1px solid var(--sidebar-border)",
    lineHeight: 1,
    cursor: "pointer",
  };

  return (
    <div className="app-main" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div className="container-center" style={{ width: "100%" }}>
        <div className="card" style={{ display: "grid", padding: 0, overflow: "hidden" }}>
          {/* Header con logo */}
          <div style={{ padding: 20, borderBottom: "1px solid var(--sidebar-border)", textAlign: "center" }}>
            <img src={logo} alt="BrokerTEC" style={{ height: 120, marginBottom: 8 }} />
            <h2 style={{ margin: 0 }}>Crea tu cuenta</h2>
            <p style={{ margin: "6px 0 0 0", opacity: 0.8 }}>
              Completa los datos para empezar a usar BrokerTEC
            </p>
          </div>

          {/* Form */}
          <div>
            <div style={{ padding: 20 }}>
              <form onSubmit={handleSubmit} noValidate>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div>
                    <label htmlFor="alias">Alias *</label>
                    <input
                      id="alias"
                      className="form-control"
                      value={form.alias}
                      onChange={onChange("alias")}
                      required
                      style={inputErrorStyle("alias")}
                    />
                    {errors.alias && <small style={{ color: "#dc3545" }}>{errors.alias}</small>}
                  </div>

                  <div>
                    <label htmlFor="nombre">Nombre *</label>
                    <input
                      id="nombre"
                      className="form-control"
                      value={form.nombre}
                      onChange={onChange("nombre")}
                      required
                      style={inputErrorStyle("nombre")}
                    />
                    {errors.nombre && <small style={{ color: "#dc3545" }}>{errors.nombre}</small>}
                  </div>

                  <div>
                    <label htmlFor="direccion">Dirección *</label>
                    <input
                      id="direccion"
                      className="form-control"
                      value={form.direccion}
                      onChange={onChange("direccion")}
                      required
                      style={inputErrorStyle("direccion")}
                    />
                    {errors.direccion && <small style={{ color: "#dc3545" }}>{errors.direccion}</small>}
                  </div>

                  <div>
                    <label htmlFor="pais_origen">País de origen *</label>
                    <input
                      id="pais_origen"
                      className="form-control"
                      value={form.pais_origen}
                      onChange={onChange("pais_origen")}
                      required
                      style={inputErrorStyle("pais_origen")}
                    />
                    {errors.pais_origen && <small style={{ color: "#dc3545" }}>{errors.pais_origen}</small>}
                  </div>

                  <div>
                    <label htmlFor="telefono">Teléfono *</label>
                    <input
                      id="telefono"
                      className="form-control"
                      value={form.telefono}
                      onChange={onChange("telefono")}
                      inputMode="tel"
                      required
                      style={inputErrorStyle("telefono")}
                    />
                    {errors.telefono && <small style={{ color: "#dc3545" }}>{errors.telefono}</small>}
                  </div>

                  <div>
                    <label htmlFor="correo">Correo *</label>
                    <input
                      id="correo"
                      className="form-control"
                      type="email"
                      value={form.correo}
                      onChange={onChange("correo")}
                      autoComplete="email"
                      required
                      style={inputErrorStyle("correo")}
                    />
                    {errors.correo && <small style={{ color: "#dc3545" }}>{errors.correo}</small>}
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label htmlFor="password">Contraseña *</label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="password"
                        className="form-control"
                        type={showPass ? "text" : "password"}
                        value={form.password}
                        onChange={onChange("password")}
                        autoComplete="new-password"
                        required
                        style={{ paddingRight: 90, ...inputErrorStyle("password") }} // espacio para el botón
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((s) => !s)}
                        aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                        style={toggleBtnStyle}
                      >
                        {showPass ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                    {errors.password && (
                      <small style={{ color: "#dc3545", display: "block", marginTop: 4 }}>{errors.password}</small>
                    )}
                  </div>
                </div>

                {/* Mensaje global de error */}
                {errorGlobal && (
                  <div
                    ref={errorBoxRef}
                    className="card"
                    role="alert"
                    aria-live="assertive"
                    style={{ background: "rgba(220,53,69,.1)", color: "#dc3545", marginTop: 12 }}
                  >
                    {errorGlobal}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-block"
                  disabled={loading} 
                  style={{ width: "100%", marginTop: 12, opacity: loading ? 0.8 : 1 }}
                >
                  {loading ? "Creando cuenta..." : "Registrarse"}
                </button>

                <p style={{ marginTop: 12, fontSize: 14 }}>
                  ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                </p>
              </form>
            </div>

            <div
              className="small-hide-mobile"
              style={{
                padding: 20,
                borderTop: "1px solid var(--sidebar-border)",
                background: "rgba(127,127,127,0.06)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
