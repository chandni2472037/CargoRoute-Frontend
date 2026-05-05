import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import PermissionGate from '../../auth/PermissionGate';
import { getAllDispatches, getAllAcknowledgements } from '../../api/dispatchApi';
import { getAllPods } from '../../api/manifestApi';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    dispatches: 0,
    acknowledgements: 0,
    pods: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setStats((prev) => ({ ...prev, loading: true, error: null }));
        const [dispatches, acknowledgements, pods] = await Promise.all([
          getAllDispatches().catch((e) => { console.error('Error:', e); return []; }),
          getAllAcknowledgements().catch((e) => { console.error('Error:', e); return []; }),
          getAllPods().catch((e) => { console.error('Error:', e); return []; }),
        ]);

        const dispatchCount = Array.isArray(dispatches) ? dispatches.length : 0;
        const ackCount = Array.isArray(acknowledgements) ? acknowledgements.length : 0;
        const podCount = Array.isArray(pods) ? pods.length : 0;
        console.log('Driver dashboard loaded:', { dispatches: dispatchCount, acknowledgements: ackCount, pods: podCount });

        setStats({ dispatches: dispatchCount, acknowledgements: ackCount, pods: podCount, loading: false, error: null });
      } catch (err) {
        console.error('Error loading driver dashboard:', err);
        setStats((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    };

    loadMetrics();
  }, []);

  return (
    <DashboardShell
      title="Driver Portal"
      description="Manage your assigned loads, acknowledge deliveries, and track proof of delivery"
      actions={
        <PermissionGate action="create" resource="dispatch-acknowledge">
          <button className="dashboard-action-button" onClick={() => navigate('/dispatch')}>Acknowledge Dispatch</button>
        </PermissionGate>
      }
    >
      {stats.error && (
        <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          ⚠️ {stats.error}
        </div>
      )}

      <div className="dashboard-grid">
        <PermissionGate action="view" resource="dispatch">
          <div
            className="dashboard-card"
            onClick={() => navigate('/dispatch')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/dispatch')}
            style={{ cursor: 'pointer' }}
            title="View your dispatches"
          >
            <h3>🚗 Active Dispatches</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.dispatches}</div>}
            <div className="stat-meta">Loads assigned to you today</div>
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
            title="View pending acknowledgments"
          >
            <h3>✅ Pending Acknowledgments</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.acknowledgements}</div>}
            <div className="stat-meta">Awaiting your confirmation</div>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="pod">
          <div
            className="dashboard-card"
            onClick={() => navigate('/manifests/pods')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/manifests/pods')}
            style={{ cursor: 'pointer' }}
            title="View proof of delivery"
          >
            <h3>📋 Delivery Proofs</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.pods}</div>}
            <div className="stat-meta">POD documents logged</div>
          </div>
        </PermissionGate>
      </div>

      <div className="dashboard-summary">
        <PermissionGate action="create" resource="pod">
          <div
            className="dashboard-summary-card"
            onClick={() => navigate('/manifests/pods')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/manifests/pods')}
            style={{ cursor: 'pointer' }}
            title="Upload new POD"
          >
            <p>📸 Next Action</p>
            <strong>Upload POD</strong>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="driver-portal">
          <div className="dashboard-summary-card">
            <p>🎯 Status</p>
            <strong>On Duty</strong>
          </div>
        </PermissionGate>
      </div>
    </DashboardShell>
  );
}
