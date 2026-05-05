import React, { useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import AdminDashboard from './dashboards/AdminDashboard';
import DriverDashboard from './dashboards/DriverDashboard';
import ShipperDashboard from './dashboards/ShipperDashboard';
import DispatcherDashboard from './dashboards/DispatcherDashboard';
import FleetManagerDashboard from './dashboards/FleetManagerDashboard';
import WarehouseManagerDashboard from './dashboards/WarehouseManagerDashboard';
import BillingClerkDashboard from './dashboards/BillingClerkDashboard';
import AnalystDashboard from './dashboards/AnalystDashboard';

export default function DashboardRouter() {
  const { user } = useContext(AuthContext);
  const role = user?.role || '';

  switch (role.toLowerCase()) {
    case 'admin':
      return <AdminDashboard />;
    case 'driver':
      return <DriverDashboard />;
    case 'shipper':
      return <ShipperDashboard />;
    case 'dispatcher':
      return <DispatcherDashboard />;
    case 'fleetmanager':
      return <FleetManagerDashboard />;
    case 'warehousemanager':
      return <WarehouseManagerDashboard />;
    case 'billingclerk':
      return <BillingClerkDashboard />;
    case 'analyst':
      return <AnalystDashboard />;
    default:
      return <div>Dashboard not configured for role: {role}</div>;
  }
}
