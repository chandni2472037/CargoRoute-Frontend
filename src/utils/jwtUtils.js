import { jwtDecode } from "jwt-decode";

export const getToken = () => localStorage.getItem("token");

export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    // Backend puts email in 'sub' and role name in 'role'
    // Normalize role value so frontend comparisons match canonical names
    const rawRole = decoded.role || '';
    const compact = rawRole.replace(/^ROLE_/i, '').replace(/_/g, '').toLowerCase();
    const canonicalMap = {
      dispatcher: 'Dispatcher',
      shipper: 'Shipper',
      driver: 'Driver',
      warehousemanager: 'WarehouseManager',
      billingclerk: 'BillingClerk',
      fleetmanager: 'FleetManager',
      analyst: 'Analyst',
      admin: 'Admin'
    };
    const role = canonicalMap[compact] || decoded.role;

    return {
      ...decoded,
      role,
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