import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { AuthContext } from '../auth/AuthContext';
import { getAllBookings } from '../api/bookingsApi';
import { getAllExceptions, getAllClaims } from '../api/exceptionsApi';
import {
  siteName,
  STATUS_CONFIG,
  EXCEPTION_STATUS_CONFIG,
  CLAIM_STATUS_CONFIG,
} from '../utils/constants';
import '../styles/Bookings.css';

/* ─── helpers ─────────────────────────────────────── */
// The backend already returns user-scoped data for SHIPPER via JWT; no
// additional client-side ownership filter is applied so that backend
// changes (field renames, new scope logic) are automatically honoured.

function fmtBookingId(id) {
  return `BK${String(id).padStart(3, '0')}`;
}

function fmtDate(raw) {
  if (!raw) return '–';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw).slice(0, 10);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── component ───────────────────────────────────── */
export default function ShipperDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bookings,   setBookings]   = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [claims,     setClaims]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    Promise.all([getAllBookings(), getAllExceptions(), getAllClaims()])
      .then(([bks, exs, cls]) => {
        if (!mounted) return;
        // Backend already filters by the JWT owner for SHIPPER role –
        // use the responses as-is; no additional client-side filter needed.
        setBookings(  Array.isArray(bks) ? bks : []);
        setExceptions(Array.isArray(exs) ? exs : []);
        setClaims(    Array.isArray(cls) ? cls : []);
      })
      .catch(() => setError('Failed to load dashboard data. Please refresh and try again.'))
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  /* KPI numbers */
  const pendingBookings = bookings.filter(
    (b) => b.status === 'PENDING' || b.status === 'SUBMITTED',
  ).length;
  const activeExceptions = exceptions.filter(
    (e) => {
      const s = e.exceptiondto?.status ?? e.status;
      return s === 'PENDING' || s === 'IN_REVIEW';
    },
  ).length;
  const openClaims = claims.filter(
    (c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW',
  ).length;

  /* Recent slices – sorted newest-first by ID */
  const recentBookings = bookings
    .slice()
    .sort((a, b) => (b.bookingID ?? 0) - (a.bookingID ?? 0))
    .slice(0, 5);

  const recentIssues = [
    ...exceptions.map((e) => ({
      ...e,
      _kind:   'Exception',
      _id:     e.exceptiondto?.exceptionID ?? e.exceptionID ?? e.id,
      _status: e.exceptiondto?.status ?? e.status,
      _navId:  e.exceptiondto?.exceptionID ?? e.exceptionID ?? e.id,
    })),
    ...claims.map((c) => ({
      ...c,
      _kind:   'Claim',
      _id:     c.claimID ?? c.id,
      _status: c.status,
      _navId:  c.claimID ?? c.id,
    })),
  ]
    .sort((a, b) => (b._id ?? 0) - (a._id ?? 0))
    .slice(0, 5);

  /* ─── render ─────────────────────────────────────── */
  return (
    <Layout>
      <div className="bookings-page">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <div className="page-title-group">
              <span className="page-title-icon">📊</span>
              <h1 className="page-title">Dashboard</h1>
            </div>
            <p className="page-subtitle">
              Welcome back, <strong>{user?.name || 'Shipper'}</strong> — here's your freight activity overview.
            </p>
          </div>
        </div>

        {/* ── Error banner ──────────────────────────────────────────── */}
        {error && (
          <div className="auth-message auth-message-error" style={{ marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}

        {loading && <div className="empty-state">Loading dashboard…</div>}

        {!loading && (
          <>
            {/* ── KPI Cards ───────────────────────────────────────────── */}
            <div
              className="stats-grid"
              style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
            >
              {/* My Bookings */}
              <div className="stat-card" style={{ borderLeftColor: '#3b82f6' }}>
                <div>
                  <div className="stat-label">My Bookings</div>
                  {pendingBookings > 0 && (
                    <div style={{ fontSize: 11, color: '#d97706', marginTop: 3, fontWeight: 500 }}>
                      {pendingBookings} pending
                    </div>
                  )}
                </div>
                <div className="stat-value">{bookings.length}</div>
              </div>

              {/* My Exceptions */}
              <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
                <div>
                  <div className="stat-label">My Exceptions</div>
                  {activeExceptions > 0 && (
                    <div style={{ fontSize: 11, color: '#d97706', marginTop: 3, fontWeight: 500 }}>
                      {activeExceptions} in review
                    </div>
                  )}
                </div>
                <div className="stat-value stat-pending">{exceptions.length}</div>
              </div>

              {/* My Claims */}
              <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
                <div>
                  <div className="stat-label">My Claims</div>
                  {openClaims > 0 && (
                    <div style={{ fontSize: 11, color: '#16a34a', marginTop: 3, fontWeight: 500 }}>
                      {openClaims} open
                    </div>
                  )}
                </div>
                <div className="stat-value stat-transit">{claims.length}</div>
              </div>
            </div>

            {/* ── Two-column content ────────────────────────────────── */}
            <div className="dashboard-grid">

              {/* Recent Bookings */}
              <div className="table-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 className="section-title" style={{ margin: 0 }}>Recent Bookings</h2>
                  <button
                    className="btn-view"
                    onClick={() => navigate('/bookings')}
                  >
                    View All →
                  </button>
                </div>

                {recentBookings.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 0' }}>
                    No bookings yet.{' '}
                    <button
                      className="btn-view"
                      style={{ display: 'inline', background: 'none', padding: 0, color: '#3b82f6' }}
                      onClick={() => navigate('/bookings/new')}
                    >
                      Create your first booking →
                    </button>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="bookings-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Destination</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentBookings.map((b) => {
                          const st = STATUS_CONFIG[b.status] || { label: b.status, cls: 'status-submitted' };
                          return (
                            <tr
                              key={b.bookingID}
                              className="table-row"
                              onClick={() => navigate(`/bookings/${b.bookingID}`)}
                            >
                              <td className="booking-id-cell">{fmtBookingId(b.bookingID)}</td>
                              <td>{siteName(b.destinationSiteID)}</td>
                              <td>
                                <span className={`status-badge ${st.cls}`}>{st.label}</span>
                              </td>
                              <td style={{ color: '#64748b', fontSize: 13 }}>
                                {fmtDate(b.pickupWindowStart)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recent Exceptions & Claims */}
              <div className="table-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 className="section-title" style={{ margin: 0 }}>Recent Exceptions & Claims</h2>
                  <button
                    className="btn-view"
                    onClick={() => navigate('/exceptions')}
                  >
                    View All →
                  </button>
                </div>

                {recentIssues.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 0' }}>
                    No exceptions or claims filed.
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="bookings-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Reference</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentIssues.map((it, idx) => {
                          const isException = it._kind === 'Exception';
                          const statusMap = isException ? EXCEPTION_STATUS_CONFIG : CLAIM_STATUS_CONFIG;
                          const st = statusMap[it._status] || { label: it._status || '–', cls: 'status-submitted' };
                          const refLabel = isException
                            ? `EX${String(it._id ?? '?').padStart(4, '0')}`
                            : `CL${String(it._id ?? '?').padStart(4, '0')}`;
                          return (
                            <tr
                              key={`${it._kind}-${it._id ?? idx}`}
                              className="table-row"
                              onClick={() =>
                                navigate(isException ? `/exceptions/${it._navId}` : `/claims/${it._navId}`)
                              }
                            >
                              <td>
                                <span style={{ fontSize: 13 }}>
                                  {isException ? '⚠️ Exception' : '📋 Claim'}
                                </span>
                              </td>
                              <td className="booking-id-cell">{refLabel}</td>
                              <td>
                                <span className={`status-badge ${st.cls}`}>{st.label}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
