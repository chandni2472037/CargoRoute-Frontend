import { Navigate } from "react-router-dom";
import { getUserFromToken } from "../utils/jwtUtils";

/**
 * ProtectedRoute
 *  - role  : single string  (legacy)
 *  - roles : array of strings  (preferred, allows multiple roles)
 * If neither is supplied, only authentication is checked.
 */
export default function ProtectedRoute({ children, role, roles }) {
  const user = getUserFromToken();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const allowed = roles ?? (role ? [role] : null);
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
