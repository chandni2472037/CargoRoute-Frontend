import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import PermissionGate from '../../auth/PermissionGate';
import { getAllBookings } from '../../api/bookingsApi';
import { getAllDispatches, getAllAcknowledgements } from '../../api/dispatchApi';
import { getAllExceptions } from '../../api/exceptionsApi';

export default function DispatcherDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    bookings: 0,
    dispatches: 0,
    exceptions: 0,
    acknowledgements: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setStats((prev) => ({ ...prev, loading: true, error: null }));
        const [bookings, dispatches, exceptions, acknowledgements] = await Promise.all([
          getAllBookings().catch((e) => { console.error('Error fetching bookings:', e); return []; }),
          getAllDispatches().catch((e) => { console.error('Error fetching dispatches:', e); return []; }),
          getAllExceptions().catch((e) => { console.error('Error fetching exceptions:', e); return []; }),
          getAllAcknowledgements().catch((e) => { console.error('Error fetching acknowledgements:', e); return []; }),
        ]);

        const bookingCount = Array.isArray(bookings) ? bookings.length : 0;
        const dispatchCount = Array.isArray(dispatches) ? dispatches.length : 0;
        const exceptionCount = Array.isArray(exceptions) ? exceptions.length : 0;
        const ackCount = Array.isArray(acknowledgements) ? acknowledgements.length : 0;

        console.log('Dispatcher dashboard loaded:', { bookings: bookingCount, dispatches: dispatchCount, exceptions: exceptionCount, acknowledgements: ackCount });

        setStats({
          bookings: bookingCount,
          dispatches: dispatchCount,
          exceptions: exceptionCount,
          acknowledgements: ackCount,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error loading dispatcher dashboard:', err);
        setStats((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    };

    loadMetrics();
  }, []);

  return (
    <DashboardShell
      title="Dispatcher Dashboard"
      description="Coordinate bookings, plan dispatches, manage exceptions and driver confirmations"
      actions={
        <PermissionGate action="create" resource="dispatch">
          <button className="dashboard-action-button">Create Dispatch</button>
        </PermissionGate>
      }
    >
      {stats.error && (
        <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          ⚠️ {stats.error}
        </div>
      )}

      <div className="dashboard-grid">
        <PermissionGate action="view" resource="all-bookings">
          <div
            className="dashboard-card"
            onClick={() => navigate('/bookings')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/bookings')}
            style={{ cursor: 'pointer' }}
            title="View bookings queue"
          >
            <h3>📦 Bookings Queue</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.bookings}</div>}
            <div className="stat-meta">Awaiting dispatch assignment</div>
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
            title="View active dispatches"
          >
            <h3>🚚 Active Dispatches</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.dispatches}</div>}
            <div className="stat-meta">In-transit and pending assignments</div>
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
            <h3>⚠️ Critical Issues</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.exceptions}</div>}
            <div className="stat-meta">Exceptions requiring resolution</div>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="driver-acknowledgements">
          <div
            className="dashboard-card"
            onClick={() => navigate('/dispatch')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/dispatch')}
            style={{ cursor: 'pointer' }}
            title="View pending confirmations"
          >
            <h3>✅ Pending Confirmations</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.acknowledgements}</div>}
            <div className="stat-meta">Driver ACKs awaiting response</div>
          </div>
        </PermissionGate>
      </div>

      <div className="dashboard-summary">
        <PermissionGate action="create" resource="dispatch">
          <div className="dashboard-summary-card">
            <p>🎯 Priority Actions</p>
            <strong>Assign & Track</strong>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="exceptions">
          <div className="dashboard-summary-card">
            <p>📊 Operational Focus</p>
            <strong>Issue Management</strong>
          </div>
        </PermissionGate>
      </div>
    </DashboardShell>
  );
}
