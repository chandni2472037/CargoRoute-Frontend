import { jwtDecode } from "jwt-decode";

export const getToken = () => localStorage.getItem("token");

export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    // Backend puts email in 'sub' and role name in 'role'
    return {
      ...decoded,
      email: decoded.sub,
      // Derive a display name from the email (part before @)
      name: decoded.name || decoded.sub?.split('@')[0] || 'User',
    };
  } catch (err) {
    console.error("Invalid token", err);
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
};