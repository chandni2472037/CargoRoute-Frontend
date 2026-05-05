import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import DashboardShell from './DashboardShell';
import PermissionGate from '../../auth/PermissionGate';
import { getBookingsByShipper } from '../../api/bookingsApi';
import { getAllExceptions, getAllClaims } from '../../api/exceptionsApi';
import { getAllPods } from '../../api/manifestApi';

export default function ShipperDashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    bookings: 0,
    exceptions: 0,
    claims: 0,
    pods: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const shipperId = user?.userId || user?.id || user?.userID;
    if (!shipperId) {
      setStats((prev) => ({ ...prev, loading: false }));
      return;
    }

    const loadMetrics = async () => {
      try {
        setStats((prev) => ({ ...prev, loading: true, error: null }));
        const [bookings, exceptions, claims, pods] = await Promise.all([
          getBookingsByShipper(shipperId).catch((e) => { console.error('Error fetching bookings:', e); return []; }),
          getAllExceptions().catch((e) => { console.error('Error fetching exceptions:', e); return []; }),
          getAllClaims().catch((e) => { console.error('Error fetching claims:', e); return []; }),
          getAllPods().catch((e) => { console.error('Error fetching pods:', e); return []; }),
        ]);

        const bookingCount = Array.isArray(bookings) ? bookings.length : 0;
        const exceptionCount = Array.isArray(exceptions)
          ? exceptions.filter((item) => item.shipperID == shipperId || item.createdBy == shipperId).length
          : 0;
        const claimCount = Array.isArray(claims)
          ? claims.filter((item) => item.shipperID == shipperId || item.createdBy == shipperId).length
          : 0;
        const podCount = Array.isArray(pods) ? pods.length : 0;

        console.log('Shipper dashboard loaded:', { bookings: bookingCount, exceptions: exceptionCount, claims: claimCount, pods: podCount });

        setStats({
          bookings: bookingCount,
          exceptions: exceptionCount,
          claims: claimCount,
          pods: podCount,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error loading shipper dashboard:', err);
        setStats((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    };

    loadMetrics();
  }, [user]);

  return (
    <DashboardShell
      title="Shipper Dashboard"
      description="Create bookings, track shipments, manage exceptions and claims"
      actions={
        <>
          <PermissionGate action="create" resource="bookings">
            <button className="dashboard-action-button">Create Booking</button>
          </PermissionGate>
          <PermissionGate action="create" resource="exceptions">
            <button className="dashboard-action-button">Report Exception</button>
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
        <PermissionGate action="view" resource="own-bookings">
          <div
            className="dashboard-card"
            onClick={() => navigate('/bookings')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/bookings')}
            style={{ cursor: 'pointer' }}
            title="View your bookings"
          >
            <h3>📦 My Bookings</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.bookings}</div>}
            <div className="stat-meta">Active shipments under your account</div>
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
            <h3>⚠️ Exceptions</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.exceptions}</div>}
            <div className="stat-meta">Issues reported on your shipments</div>
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
            title="View claims"
          >
            <h3>🔴 Claims</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.claims}</div>}
            <div className="stat-meta">Insurance claims filed</div>
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
            <div className="stat-meta">Delivered and confirmed shipments</div>
          </div>
        </PermissionGate>
      </div>

      <div className="dashboard-summary">
        <PermissionGate action="create" resource="exceptions">
          <div className="dashboard-summary-card">
            <p>🚨 Quick Action</p>
            <strong>Report Issue</strong>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="own-bookings">
          <div className="dashboard-summary-card">
            <p>👁️ Visibility</p>
            <strong>Your Shipments Only</strong>
          </div>
        </PermissionGate>
      </div>
    </DashboardShell>
  );
}
