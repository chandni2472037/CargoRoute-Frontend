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
  const [editingStatus, setEditingStatus] = useState(false);
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
      await updateBookingStatus(id, newStatus);
      // Re-fetch booking details to get the latest state
      const fresh = await getBookingById(id);
      setBooking(fresh);
      setMsg({ type: 'success', text: 'Status updated successfully.' });
      return true;
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update status.' });
      return false;
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
          {/* right header intentionally left empty to keep header compact */}
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

          <div className="detail-card">
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
                <div className="detail-label">Units</div>
                <div className="detail-value">{booking.pieces}</div>
              </div>
            </div>
            <div className="detail-row-3" style={{ marginTop: 16 }}>
              <div className="detail-field">
                <div className="detail-label">Commodity</div>
                <div className="detail-value">{booking.commodity}</div>
              </div>
              {flags.length > 0 && (
                <div className="detail-field">
                  <div className="detail-label" style={{ marginBottom: 6 }}>Special Handling</div>
                  <div className="flags-list">
                    {flags.map((f) => (
                      <span key={f} className="flag-tag">{f.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="detail-card">
            <h3 className="detail-card-title">Booking Meta</h3>
            <div className="detail-row-2">
              <div className="detail-field">
                <div className="detail-label">Created At</div>
                <div className="detail-value">{formatDateTime(booking.createdAt)}</div>
              </div>
              <div className="detail-field">
                <div className="meta-status-label-row">
                  <span className="detail-label">Status</span>
                  {!editingStatus && (
                    <button
                      className="edit-icon-btn"
                      aria-label="Edit status"
                      onClick={() => { setEditingStatus(true); setNewStatus(booking.status); }}
                      title="Edit status"
                    >
                      <svg className="edit-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
                        <path d="M4 13.5V16H6.5L14.87 7.63L12.37 5.13L4 13.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15.5 6.13L13.87 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                </div>
                <div className="detail-value meta-status-value">
                  {!editingStatus ? (
                    <span className={`status-badge ${st.cls}`}>{st.label}</span>
                  ) : (
                    <div className="meta-status-edit-row">
                      <select className="status-update-select" value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <button
                        className="btn-primary"
                        onClick={async () => { const ok = await handleStatusUpdate(); if (ok) setEditingStatus(false); }}
                        disabled={saving || newStatus === booking.status}
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => { setNewStatus(booking.status); setEditingStatus(false); }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {msg.text && (
                    <span className={`update-msg ${msg.type === 'error' ? 'update-msg-error' : ''}`}>
                      {msg.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {booking.updatedAt && (
              <div className="detail-row-2" style={{ marginTop: 14 }}>
                <div className="detail-field">
                  <div className="detail-label">Updated At</div>
                  <div className="detail-value">{formatDateTime(booking.updatedAt)}</div>
                </div>
              </div>
            )}
          </div>

          
        </div>


      </div>
    </Layout>
  );
}
