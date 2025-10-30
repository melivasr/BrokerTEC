import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ role }) {
  const user = JSON.parse(localStorage.getItem("user")); // { alias, rol, token }

  if (!user) return <Navigate to="/" />;
  if (role && user.rol !== role) return <Navigate to="/" />;

  return <Outlet />;
}
