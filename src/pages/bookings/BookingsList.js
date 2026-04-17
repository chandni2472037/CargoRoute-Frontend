import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAllBookings } from '../../api/bookingsApi';
import '../../styles/Bookings.css';

// Static site map (no Site service yet – IDs assigned on first insert)
const SITE_MAP = {
  1: 'Mumbai Warehouse',
  2: 'Delhi Distribution Center',
  3: 'Bengaluru Depot',
  4: 'Chennai Hub',
  5: 'Hyderabad Facility',
  6: 'Kolkata Depot',
  7: 'Pune Terminal',
  8: 'Ahmedabad Crossdock',
};
const siteName = (id) => SITE_MAP[id] || `Site #${id}`;

// Full BookingStatus enum from backend
const STATUS_CONFIG = {
  DRAFT:      { label: 'Draft',      cls: 'status-draft'      },
  SUBMITTED:  { label: 'Submitted',  cls: 'status-submitted'  },
  PLANNED:    { label: 'Planned',    cls: 'status-planned'    },
  DISPATCHED: { label: 'Dispatched', cls: 'status-dispatched' },
  IN_TRANSIT: { label: 'In Transit', cls: 'status-in-transit' },
  DELIVERED:  { label: 'Delivered',  cls: 'status-delivered'  },
  CANCELLED:  { label: 'Cancelled',  cls: 'status-cancelled'  },
};

function fmtDate(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function fmtBookingId(id) {
  return `BK${String(id).padStart(3, '0')}`;
}

export default function BookingsList() {
  const navigate = useNavigate();
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    getAllBookings()
      .then(setBookings)
      .catch(() => setError('Could not load bookings. Is BookingService running on port 7070?'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    const shipperName = b.shipper?.name?.toLowerCase() || '';
    const matchSearch =
      !q ||
      fmtBookingId(b.bookingID).toLowerCase().includes(q) ||
      shipperName.includes(q) ||
      b.commodity?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:     bookings.length,
    pending:   bookings.filter((b) => b.status === 'PENDING' || b.status === 'SUBMITTED').length,
    inTransit: bookings.filter((b) => b.status === 'IN_TRANSIT' || b.status === 'DISPATCHED').length,
    delivered: bookings.filter((b) => b.status === 'DELIVERED').length,
  };

  const handleExport = () => {
    const headers = ['Booking ID','Shipper','Origin Site','Destination Site',
      'Pickup Start','Pickup End','Weight (kg)','Volume (m³)','Pieces','Commodity','Status'];
    const rows = filtered.map((b) => [
      fmtBookingId(b.bookingID), b.shipper?.name,
      siteName(b.originSiteID), siteName(b.destinationSiteID),
      b.pickupWindowStart, b.pickupWindowEnd,
      b.weightKg, b.volumeM3, b.pieces, b.commodity, b.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'bookings.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="bookings-page">

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Bookings</h1>
            <p className="page-subtitle">Manage all freight bookings and orders</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/bookings/new')}>
            + New Booking
          </button>
        </div>

        {/* ── Stats cards ─────────────────────────────────────── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Bookings</div>
            <div className="stat-value">{stats.total}</div>
            <span className="stat-icon" role="img" aria-label="package">📦</span>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value stat-pending">{stats.pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Transit</div>
            <div className="stat-value stat-transit">{stats.inTransit}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Delivered</div>
            <div className="stat-value stat-delivered">{stats.delivered}</div>
          </div>
        </div>

        {/* ── Error banner ────────────────────────────────────── */}
        {error && (
          <div className="auth-message auth-message-error" style={{ marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Table section ───────────────────────────────────── */}
        <div className="table-section">
          <h2 className="section-title">All Bookings</h2>

          <div className="table-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by booking ID, shipper, or commodity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="toolbar-right">
              <div className="filter-wrapper">
                <span>⚙️</span>
                <select className="status-select" value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <button className="btn-export" onClick={handleExport}>⬇ Export</button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading bookings…</div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Shipper</th>
                    <th>Origin → Destination</th>
                    <th>Pickup Window</th>
                    <th>Weight / Volume</th>
                    <th>Commodity</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-state">
                        {bookings.length === 0 ? 'No bookings yet. Create your first booking.' : 'No bookings match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((b) => {
                      const st = STATUS_CONFIG[b.status] || { label: b.status, cls: 'status-pending' };
                      return (
                        <tr key={b.bookingID} className="table-row"
                          onClick={() => navigate(`/bookings/${b.bookingID}`)}>
                          <td className="booking-id-cell">{fmtBookingId(b.bookingID)}</td>
                          <td>{b.shipper?.name || '–'}</td>
                          <td>
                            <div className="route-cell">
                              <span className="route-origin">{siteName(b.originSiteID)}</span>
                              <span className="route-arrow">→</span>
                              <span className="route-dest">{siteName(b.destinationSiteID)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="window-cell">
                              <span>{fmtDate(b.pickupWindowStart)}</span>
                              <span className="window-times">
                                {fmtTime(b.pickupWindowStart)} – {fmtTime(b.pickupWindowEnd)}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="weight-cell">
                              <span>{b.weightKg?.toLocaleString()} kg</span>
                              <span className="vol-text">{b.volumeM3} m³</span>
                            </div>
                          </td>
                          <td>{b.commodity}</td>
                          <td>
                            <span className={`status-badge ${st.cls}`}>{st.label}</span>
                          </td>
                          <td>
                            <button className="btn-view"
                              onClick={(e) => { e.stopPropagation(); navigate(`/bookings/${b.bookingID}`); }}>
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
