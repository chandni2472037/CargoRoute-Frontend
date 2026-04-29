import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import ShipperDashboard from './ShipperDashboard';

export default function DashboardRouter() {
  const { user } = useContext(AuthContext);
  const role = user?.role || '';

  if (role === 'Shipper' || role === 'SHIPPER') {
    return <ShipperDashboard />;
  }

  // If an AdminDashboard component exists in the project, render it here.
  // Fallback: redirect Admins to bookings for now so /dashboard is not blank.
  if (role === 'Admin' || role === 'ADMIN') {
    return <Navigate to="/bookings" replace />;
  }

  // Other roles: redirect to bookings
  return <Navigate to="/bookings" replace />;
}
