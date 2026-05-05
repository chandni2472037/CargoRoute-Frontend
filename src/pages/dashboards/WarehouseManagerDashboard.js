import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import PermissionGate from '../../auth/PermissionGate';
import { getAllManifests, getAllHandovers, getAllPods } from '../../api/manifestApi';
import { getAllExceptions } from '../../api/exceptionsApi';

export default function WarehouseManagerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    manifests: 0,
    handovers: 0,
    pods: 0,
    exceptions: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setStats((prev) => ({ ...prev, loading: true, error: null }));
        const [manifests, handovers, pods, exceptions] = await Promise.all([
          getAllManifests().catch((e) => { console.error('Error fetching manifests:', e); return []; }),
          getAllHandovers().catch((e) => { console.error('Error fetching handovers:', e); return []; }),
          getAllPods().catch((e) => { console.error('Error fetching pods:', e); return []; }),
          getAllExceptions().catch((e) => { console.error('Error fetching exceptions:', e); return []; }),
        ]);

        const manifestCount = Array.isArray(manifests) ? manifests.length : 0;
        const handoverCount = Array.isArray(handovers) ? handovers.length : 0;
        const podCount = Array.isArray(pods) ? pods.length : 0;
        const exceptionCount = Array.isArray(exceptions) ? exceptions.length : 0;

        console.log('Warehouse manager dashboard loaded:', { manifests: manifestCount, handovers: handoverCount, pods: podCount, exceptions: exceptionCount });

        setStats({
          manifests: manifestCount,
          handovers: handoverCount,
          pods: podCount,
          exceptions: exceptionCount,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error loading warehouse manager dashboard:', err);
        setStats((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    };

    loadMetrics();
  }, []);

  return (
    <DashboardShell
      title="Warehouse Manager Dashboard"
      description="Manage manifests, handovers, proof of delivery, and warehouse exceptions"
      actions={
        <PermissionGate action="create" resource="manifest">
          <button className="dashboard-action-button">Create Manifest</button>
        </PermissionGate>
      }
    >
      {stats.error && (
        <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          ⚠️ {stats.error}
        </div>
      )}

      <div className="dashboard-grid">
        <PermissionGate action="view" resource="manifest">
          <div
            className="dashboard-card"
            onClick={() => navigate('/manifests')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/manifests')}
            style={{ cursor: 'pointer' }}
            title="View manifests"
          >
            <h3>📄 Manifests</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.manifests}</div>}
            <div className="stat-meta">Shipments in warehouse queue</div>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="handover">
          <div
            className="dashboard-card"
            onClick={() => navigate('/handovers')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/handovers')}
            style={{ cursor: 'pointer' }}
            title="View handovers"
          >
            <h3>🔄 Handovers</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.handovers}</div>}
            <div className="stat-meta">Driver-warehouse transfer records</div>
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
            <h3>✔️ Proof of Delivery</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.pods}</div>}
            <div className="stat-meta">Confirmed delivery documents</div>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="exceptions">
          <div
            className="dashboard-card"
            onClick={() => navigate('/exceptions')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/exceptions')}
            style={{ cursor: 'pointer' }}
            title="View exceptions"
          >
            <h3>⚠️ Issues</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.exceptions}</div>}
            <div className="stat-meta">Warehouse-related exceptions</div>
          </div>
        </PermissionGate>
      </div>

      <div className="dashboard-summary">
        <PermissionGate action="create" resource="handover">
          <div className="dashboard-summary-card">
            <p>📋 Warehouse Operations</p>
            <strong>Process Handovers</strong>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="exceptions">
          <div className="dashboard-summary-card">
            <p>🔍 Quality Assurance</p>
            <strong>Exception Review</strong>
          </div>
        </PermissionGate>
      </div>
    </DashboardShell>
  );
}
