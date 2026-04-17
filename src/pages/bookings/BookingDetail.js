import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getBookingById, updateBookingStatus } from '../../api/bookingsApi';
import { siteName, STATUS_CONFIG } from '../../utils/constants';
import '../../styles/Bookings.css';

function formatDateTime(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function formatBookingId(id) {
  return `BK${String(id).padStart(3, '0')}`;
}

export default function BookingDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [booking, setBooking]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState({ type: '', text: '' });

  useEffect(() => {
    getBookingById(id)
      .then((data) => { setBooking(data); setNewStatus(data.status); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === booking.status) return;
    setSaving(true);
    try {
      const updated = await updateBookingStatus(id, newStatus);
      setBooking(updated);
      setMsg({ type: 'success', text: 'Status updated successfully.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update status.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    }
  };

  if (loading) return <Layout><div className="empty-state">Loading…</div></Layout>;
  if (notFound) return <Layout><div className="empty-state">Booking not found.</div></Layout>;

  const st = STATUS_CONFIG[booking.status] || { label: booking.status, cls: 'status-pending' };
  const flags = booking.specialHandlingFlags
    ? booking.specialHandlingFlags.split(',').filter(Boolean)
    : [];

  return (
    <Layout>
      <div className="booking-detail-page">

        {/* ── Header ────────────────────────────────────────── */}
        <div className="detail-header">
          <div className="detail-header-left">
            <button className="back-btn" onClick={() => navigate('/bookings')}>←</button>
            <div>
              <div className="detail-booking-id">{formatBookingId(booking.bookingID)}</div>
              <div className="page-subtitle">Booking Detail</div>
            </div>
          </div>
          <div className="detail-header-right">
            <span className={`status-badge status-badge-lg ${st.cls}`}>{st.label}</span>
          </div>
        </div>

        {/* ── Status update bar ────────────────────────────── */}
        <div className="status-update-bar">
          <label className="status-update-label">Update Status:</label>
          <select className="status-update-select" value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={handleStatusUpdate}
            disabled={saving || newStatus === booking.status}>
            {saving ? 'Saving…' : 'Update'}
          </button>
          {msg.text && (
            <span className={`update-msg ${msg.type === 'error' ? 'update-msg-error' : ''}`}>
              {msg.text}
            </span>
          )}
        </div>

        {/* ── Detail grid ──────────────────────────────────── */}
        <div className="detail-grid">

          <div className="detail-card">
            <h3 className="detail-card-title">Shipper Information</h3>
            <div className="detail-field">
              <div className="detail-label">Shipper</div>
              <div className="detail-value">{booking.shipper?.name || '–'}</div>
            </div>
            {booking.shipper?.contactInfo && (
              <div className="detail-field" style={{ marginTop: 10 }}>
                <div className="detail-label">Contact</div>
                <div className="detail-value">{booking.shipper.contactInfo}</div>
              </div>
            )}
          </div>

          <div className="detail-card">
            <h3 className="detail-card-title">Route</h3>
            <div className="detail-route">
              <div className="route-point">
                <span className="route-dot route-dot-origin">●</span>
                <div>
                  <div className="detail-label">Origin</div>
                  <div className="detail-value">{siteName(booking.originSiteID)}</div>
                </div>
              </div>
              <div className="route-line">│</div>
              <div className="route-point">
                <span className="route-dot route-dot-dest">●</span>
                <div>
                  <div className="detail-label">Destination</div>
                  <div className="detail-value">{siteName(booking.destinationSiteID)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <h3 className="detail-card-title">Pickup Window</h3>
            <div className="detail-row-2">
              <div className="detail-field">
                <div className="detail-label">Start</div>
                <div className="detail-value">{formatDateTime(booking.pickupWindowStart)}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">End</div>
                <div className="detail-value">{formatDateTime(booking.pickupWindowEnd)}</div>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <h3 className="detail-card-title">Delivery Window</h3>
            <div className="detail-row-2">
              <div className="detail-field">
                <div className="detail-label">Start</div>
                <div className="detail-value">{formatDateTime(booking.deliveryWindowStart)}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">End</div>
                <div className="detail-value">{formatDateTime(booking.deliveryWindowEnd)}</div>
              </div>
            </div>
          </div>

          <div className="detail-card detail-card-wide">
            <h3 className="detail-card-title">Cargo Details</h3>
            <div className="detail-row-3">
              <div className="detail-field">
                <div className="detail-label">Weight</div>
                <div className="detail-value">{booking.weightKg?.toLocaleString()} kg</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Volume</div>
                <div className="detail-value">{booking.volumeM3} m³</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Pieces</div>
                <div className="detail-value">{booking.pieces}</div>
              </div>
            </div>
            <div className="detail-row" style={{ marginTop: 16 }}>
              <div className="detail-field">
                <div className="detail-label">Commodity</div>
                <div className="detail-value">{booking.commodity}</div>
              </div>
            </div>
            {flags.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="detail-label" style={{ marginBottom: 8 }}>Special Handling</div>
                <div className="flags-list">
                  {flags.map((f) => (
                    <span key={f} className="flag-tag">{f.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="detail-card">
            <h3 className="detail-card-title">Booking Meta</h3>
            <div className="detail-field">
              <div className="detail-label">Created At</div>
              <div className="detail-value">{formatDateTime(booking.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="detail-footer">
          <button className="btn-secondary" onClick={() => navigate('/bookings')}>← Back to Bookings</button>
          <button className="btn-primary" onClick={() => navigate('/bookings/new')}>+ New Booking</button>
        </div>
      </div>
    </Layout>
  );
}
