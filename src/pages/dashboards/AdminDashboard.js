import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import PermissionGate from '../../auth/PermissionGate';
import { getAllUsersAdmin } from '../../api/authApi';
import { getAllBookings } from '../../api/bookingsApi';
import { getAllDispatches } from '../../api/dispatchApi';
import { getAllAuditLogs } from '../../api/auditLogsApi';
import { getAllReports } from '../../api/reportApi';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    bookings: 0,
    dispatches: 0,
    audits: 0,
    reports: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setStats((prev) => ({ ...prev, loading: true, error: null }));
        const [users, bookings, dispatches, audits, reports] = await Promise.all([
          getAllUsersAdmin().catch((e) => {
            console.error('Error fetching users:', e);
            return [];
          }),
          getAllBookings().catch((e) => {
            console.error('Error fetching bookings:', e);
            return [];
          }),
          getAllDispatches().catch((e) => {
            console.error('Error fetching dispatches:', e);
            return [];
          }),
          getAllAuditLogs().catch((e) => {
            console.error('Error fetching audit logs:', e);
            return [];
          }),
          getAllReports().catch((e) => {
            console.error('Error fetching reports:', e);
            return [];
          }),
        ]);

const usersArray = normalizeUsersArray(users);

const activeUserCount = usersArray.filter(
  (u) => String(u.status).toUpperCase() === "ACTIVE"
).length;


const bookingCount  = normalizeUsersArray(bookings).length;
const dispatchCount = normalizeUsersArray(dispatches).length;
const auditCount    = normalizeUsersArray(audits).length;
const reportCount   = normalizeUsersArray(reports).length;



setStats({
  users: activeUserCount,   // ✅ ACTIVE USERS ONLY
  bookings: bookingCount,
  dispatches: dispatchCount,
  audits: auditCount,
  reports: reportCount,
  loading: false,
  error: null,
});


        console.log('Dashboard metrics loaded:', {
          users: activeUserCount,
          bookings: bookingCount,
          dispatches: dispatchCount,
          audits: auditCount,
          reports: reportCount,
        });

        
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
        setStats((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    };

    loadMetrics();
  }, []);


const normalizeUsersArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.users)) return res.users;
  return [];
};


  return (
    <DashboardShell
      title="Admin Dashboard"
      description="System health, user management, compliance, and executive oversight"
      
    >
      {stats.error && (
        <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          ⚠️ {stats.error}
        </div>
      )}

      <div className="dashboard-grid">
        <PermissionGate action="view" resource="all-users">
          <div
            className="dashboard-card"
            onClick={() => navigate('/users')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/users')}
            style={{ cursor: 'pointer' }}
            title="View all users"
          >
            <h3>👥 Active Users</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.users.toLocaleString()}</div>}
            <div className="stat-meta">Users enrolled across all services</div>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="all-bookings">
          <div
            className="dashboard-card"
            onClick={() => navigate('/bookings')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/bookings')}
            style={{ cursor: 'pointer' }}
            title="View all bookings"
          >
            <h3>📦 Total Bookings</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.bookings.toLocaleString()}</div>}
            <div className="stat-meta">Bookings processed system-wide</div>
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
            title="View all dispatches"
          >
            <h3>🚚 Dispatches</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.dispatches.toLocaleString()}</div>}
            <div className="stat-meta">Driver assignments and handoffs</div>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="all">
          <div
            className="dashboard-card"
            onClick={() => navigate('/admin/audit-logs')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/audit-logs')}
            style={{ cursor: 'pointer' }}
            title="View audit logs"
          >
            <h3>🔐 Audit Events</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.audits.toLocaleString()}</div>}
            <div className="stat-meta">Security and operation audit logs</div>
          </div>
        </PermissionGate>

                <PermissionGate action="view" resource="all">
  <div
    className="dashboard-card"
    onClick={() => navigate('/reports')}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && navigate('/reports')}
    style={{ cursor: 'pointer' }}
    title="View reports"
  >
    <h3>📊 Reports</h3>
    {stats.loading ? (
      <div className="stat-value">–</div>
    ) : (
      <div className="stat-value">
        {stats.reports.toLocaleString()}
      </div>
    )}
    <div className="stat-meta">Generated system reports</div>
  </div>
  </PermissionGate>
      </div>

    </DashboardShell>
  );
}
