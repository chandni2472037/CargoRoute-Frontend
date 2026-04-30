/**
 * Standardized role constants used throughout the application
 */
export const ROLES = [
  "Shipper",
  "Dispatcher",
  "FleetManager",
  "Driver",
  "WarehouseManager",
  "Billing",
  "Admin",
  "Analyst",
];

/**
 * Get normalized role (case-insensitive comparison)
 */
export const normalizeRole = (role) => {
  if (!role) return null;
  const normalized = String(role).trim();
  const found = ROLES.find(r => r.toLowerCase() === normalized.toLowerCase());
  return found || normalized;
};
