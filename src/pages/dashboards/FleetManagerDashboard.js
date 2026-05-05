import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import PermissionGate from '../../auth/PermissionGate';
import { getAllVehicles } from '../../api/fleetApi';
import { getAllRoutes, getAllLoads } from '../../api/routingApi';
import { getAllDispatches } from '../../api/dispatchApi';

export default function FleetManagerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    vehicles: 0,
    routes: 0,
    loads: 0,
    dispatches: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setStats((prev) => ({ ...prev, loading: true, error: null }));
        const [vehicles, routes, loads, dispatches] = await Promise.all([
          getAllVehicles().catch((e) => { console.error('Error fetching vehicles:', e); return []; }),
          getAllRoutes().catch((e) => { console.error('Error fetching routes:', e); return []; }),
          getAllLoads().catch((e) => { console.error('Error fetching loads:', e); return []; }),
          getAllDispatches().catch((e) => { console.error('Error fetching dispatches:', e); return []; }),
        ]);

        const vehicleCount = Array.isArray(vehicles) ? vehicles.length : 0;
        const routeCount = Array.isArray(routes) ? routes.length : 0;
        const loadCount = Array.isArray(loads) ? loads.length : 0;
        const dispatchCount = Array.isArray(dispatches) ? dispatches.length : 0;

        console.log('Fleet manager dashboard loaded:', { vehicles: vehicleCount, routes: routeCount, loads: loadCount, dispatches: dispatchCount });

        setStats({
          vehicles: vehicleCount,
          routes: routeCount,
          loads: loadCount,
          dispatches: dispatchCount,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error loading fleet manager dashboard:', err);
        setStats((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    };

    loadMetrics();
  }, []);

  return (
    <DashboardShell
      title="Fleet Manager Dashboard"
      description="Optimize vehicle capacity, route planning, and load distribution"
      actions={
        <>
          <PermissionGate action="create" resource="vehicles">
            <button className="dashboard-action-button">Add Vehicle</button>
          </PermissionGate>
          <PermissionGate action="create" resource="routes">
            <button className="dashboard-action-button">Plan Route</button>
          </PermissionGate>
        </>
      }
    >
      {stats.error && (
        <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          ⚠️ {stats.error}
        </div>
      )}

      <div className="dashboard-grid">
        <PermissionGate action="view" resource="vehicles">
          <div
            className="dashboard-card"
            onClick={() => navigate('/fleet/vehicles')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/fleet/vehicles')}
            style={{ cursor: 'pointer' }}
            title="View fleet vehicles"
          >
            <h3>🚗 Fleet Vehicles</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.vehicles}</div>}
            <div className="stat-meta">Total assets available for dispatch</div>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="routes">
          <div
            className="dashboard-card"
            onClick={() => navigate('/routing/routes')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/routing/routes')}
            style={{ cursor: 'pointer' }}
            title="View routes"
          >
            <h3>🗺️ Active Routes</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.routes}</div>}
            <div className="stat-meta">Optimized route plans in use</div>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="loads">
          <div
            className="dashboard-card"
            onClick={() => navigate('/routing/loads')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/routing/loads')}
            style={{ cursor: 'pointer' }}
            title="View loads"
          >
            <h3>📋 Loads</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.loads}</div>}
            <div className="stat-meta">Shipments awaiting vehicle assignment</div>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="dispatch">
          <div
            className="dashboard-card"
            onClick={() => navigate('/dispatch')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/dispatch')}
            style={{ cursor: 'pointer' }}
            title="View dispatch records"
          >
            <h3>🚚 Dispatch Records</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.dispatches}</div>}
            <div className="stat-meta">Active dispatch assignments</div>
          </div>
        </PermissionGate>
      </div>

      <div className="dashboard-summary">
        <PermissionGate action="create" resource="routes">
          <div className="dashboard-summary-card">
            <p>⚙️ Optimization Focus</p>
            <strong>Route Planning</strong>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="vehicles">
          <div className="dashboard-summary-card">
            <p>📊 Fleet Metrics</p>
            <strong>Capacity Analysis</strong>
          </div>
        </PermissionGate>
      </div>
    </DashboardShell>
  );
}
