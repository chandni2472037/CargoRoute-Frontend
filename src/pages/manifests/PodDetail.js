import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAllPods, updatePod, deletePod } from '../../api/manifestApi';
import { getBookingById } from '../../api/bookingsApi';
import { POD_STATUS_CONFIG, POD_TYPE_CONFIG, siteName } from '../../utils/constants';
import '../../styles/Bookings.css';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPodId(id)     { return id ? `POD${String(id).padStart(4, '0')}` : '–'; }
function formatBookingId(id) { return id ? `BK${String(id).padStart(4, '0')}` : '–'; }
function formatDateTime(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PodDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [podData,     setPodData]     = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  // Edit
  const [isEditing,  setIsEditing]  = useState(false);
  const [editFields, setEditFields] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState({ type: '', text: '' });

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError('');

    // getAllPods returns List<{ proofOfDelivery: {...}, booking: {...} }> — the
    // most reliable single call that delivers both POD + booking in one shot.
    getAllPods()
      .then((allPods) => {
        const numId = Number(id);
        const found = allPods.find(
          (item) => item?.proofOfDelivery?.podID === numId
        );

        if (!found) {
          setError(`No POD found for ID ${formatPodId(id)}.`);
          setLoading(false);
          return;
        }

        const pod     = found.proofOfDelivery || {};
        const booking = found.booking         || {};

        setPodData(pod);
        setEditFields({
          receivedBy: pod.receivedBy || '',
          podType:    pod.podType    || 'Photo',
          status:     pod.status     || 'PENDING',
          podURI:     pod.podURI     || '',
        });

        // If booking came embedded, use it; otherwise fetch separately
        if (booking.bookingID) {
          setBookingData(booking);
          setLoading(false);
        } else if (pod.bookingID) {
          getBookingById(pod.bookingID)
            .then((bk) => setBookingData(bk))
            .catch(() => setBookingData({}))
            .finally(() => setLoading(false));
        } else {
          setBookingData({});
          setLoading(false);
        }
      })
      .catch(() => {
        setError('Failed to load POD details. Is ManifestService running?');
        setLoading(false);
      });
  }, [id]);

  // ── Edit handlers ───────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFields((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSave = async () => {
    const errs = {};
    if (!editFields.receivedBy.trim()) errs.receivedBy = 'Received By is required.';
    if (!editFields.podType)           errs.podType    = 'POD Type is required.';
    if (!editFields.status)            errs.status     = 'Status is required.';
    if (Object.keys(errs).length > 0)  { setFormErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        bookingID:  podData.bookingID,
        receivedBy: editFields.receivedBy.trim(),
        podType:    editFields.podType,
        status:     editFields.status,
        podURI:     editFields.podURI.trim() || null,
      };
      await updatePod(podData.podID, payload);
      // Re-fetch to keep data consistent
      const allPods = await getAllPods();
      const found   = allPods.find((item) => item?.proofOfDelivery?.podID === podData.podID);
      if (found) setPodData(found.proofOfDelivery || {});
      setIsEditing(false);
      setMsg({ type: 'success', text: 'POD updated successfully.' });
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete handler ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePod(podData.podID);
      setMsg({ type: 'success', text: 'POD deleted.' });
      setTimeout(() => navigate('/pod'), 1200);
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to delete POD.' });
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  // ── Derived display values ──────────────────────────────────────────────────
  const st = POD_STATUS_CONFIG[podData?.status] || { label: podData?.status || '–', cls: '' };
  const tp = POD_TYPE_CONFIG[podData?.podType]  || { label: podData?.podType || '–' };

  // ── States ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="booking-detail-page">
          <div className="empty-state" style={{ padding: '60px 0' }}>
            ⏳ Loading POD details…
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="booking-detail-page">
          <div className="detail-header">
            <div className="detail-header-left">
              <button className="back-btn" onClick={() => navigate('/pod')}>←</button>
              <div>
                <div className="detail-booking-id">POD Not Found</div>
                <div className="page-subtitle">Proof of Delivery — Detail View</div>
              </div>
            </div>
          </div>
          <div className="auth-message auth-message-error" style={{ marginTop: 24 }}>
            ⚠ {error}
          </div>
        </div>
      </Layout>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="booking-detail-page">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="detail-header">
          <div className="detail-header-left">
            <button className="back-btn" onClick={() => navigate('/pod')} title="Back to POD list">
              ←
            </button>
            <div>
              <div className="detail-booking-id">{formatPodId(podData?.podID)}</div>
              <div className="page-subtitle">Proof of Delivery — Detail View</div>
            </div>
          </div>
          <div className="detail-header-right">
            <span className={`status-badge status-badge-lg ${st.cls}`}>{st.label}</span>
          </div>
        </div>

        {/* ── Inline message ───────────────────────────────────────────────── */}
        {msg.text && (
          <div
            className={`auth-message ${msg.type === 'error' ? 'auth-message-error' : 'auth-message-success'}`}
            style={{ marginBottom: 16 }}
          >
            {msg.type === 'success' ? '✓' : '⚠'} {msg.text}
          </div>
        )}

        {/* ════════════════════ VIEW MODE ════════════════════════════════════ */}
        {!isEditing && (
          <>
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                ✏ Edit POD
              </button>
              {!confirmDelete ? (
                <button
                  className="btn-view"
                  style={{ background: '#fee2e2', color: '#b91c1c' }}
                  onClick={() => setConfirmDelete(true)}
                >
                  🗑 Delete POD
                </button>
              ) : (
                <>
                  <span style={{ alignSelf: 'center', fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>
                    Are you sure?
                  </span>
                  <button
                    className="btn-view"
                    style={{ background: '#b91c1c', color: '#fff' }}
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting…' : 'Confirm Delete'}
                  </button>
                  <button
                    className="btn-view"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

            <div className="detail-grid">

              {/* ── Section 1 : POD Information ──────────────────────────── */}
              <div className="detail-card">
                <h3 className="detail-card-title" style={{ marginBottom: 20 }}>
                  📄 Section 1 — POD Information
                </h3>

                <div className="detail-row" style={{ marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div className="detail-label">POD ID</div>
                    <div className="detail-value" style={{ fontWeight: 700, fontSize: 16 }}>
                      {formatPodId(podData?.podID)}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="detail-label">Verification Status</div>
                    <div className="detail-value">
                      <span className={`status-badge ${st.cls}`}>{st.label}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-row" style={{ marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div className="detail-label">POD Type</div>
                    <div className="detail-value">{tp.label}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="detail-label">Received By</div>
                    <div className="detail-value">{podData?.receivedBy || '–'}</div>
                  </div>
                </div>

                <div className="detail-row" style={{ marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div className="detail-label">Delivery Date &amp; Time</div>
                    <div className="detail-value">{formatDateTime(podData?.deliveredAt)}</div>
                  </div>
                </div>

                <div>
                  <div className="detail-label">POD Document</div>
                  <div style={{ marginTop: 8 }}>
                    {podData?.podURI ? (
                      <a
                        href={podData.podURI}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-view"
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        📎 View / Download Document
                      </a>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No document attached</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Section 2 : Associated Booking Details ────────────────── */}
              <div className="detail-card">
                <h3 className="detail-card-title" style={{ marginBottom: 20 }}>
                  📦 Section 2 — Associated Booking Details
                </h3>

                <div className="detail-row" style={{ marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div className="detail-label">Booking ID</div>
                    <div className="detail-value" style={{ fontWeight: 700, fontSize: 16 }}>
                      {formatBookingId(podData?.bookingID)}
                    </div>
                  </div>
                  {bookingData?.status && (
                    <div style={{ flex: 1 }}>
                      <div className="detail-label">Booking Status</div>
                      <div className="detail-value">{bookingData.status}</div>
                    </div>
                  )}
                </div>

                <div className="detail-row" style={{ marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div className="detail-label">Commodity</div>
                    <div className="detail-value">{bookingData?.commodity || '–'}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="detail-label">Shipper</div>
                    <div className="detail-value">
                      {bookingData?.shipper?.name || bookingData?.shipperName || '–'}
                    </div>
                  </div>
                </div>

                <div className="detail-row">
                  <div style={{ flex: 1 }}>
                    <div className="detail-label">Origin</div>
                    <div className="detail-value">
                      {bookingData?.originSiteID ? siteName(bookingData.originSiteID) : (bookingData?.origin || '–')}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="detail-label">Destination</div>
                    <div className="detail-value">
                      {bookingData?.destinationSiteID ? siteName(bookingData.destinationSiteID) : (bookingData?.destination || '–')}
                    </div>
                  </div>
                </div>

                {(!bookingData || Object.keys(bookingData).length === 0) && (
                  <p style={{ color: '#9ca3af', fontStyle: 'italic', marginTop: 12 }}>
                    Booking details unavailable.
                  </p>
                )}
              </div>

            </div>
          </>
        )}

        {/* ════════════════════ EDIT MODE ════════════════════════════════════ */}
        {isEditing && (
          <div className="detail-grid">
            <div className="detail-card">
              <h3 className="detail-card-title" style={{ marginBottom: 20 }}>
                ✏ Edit POD — {formatPodId(podData?.podID)}
              </h3>

              <div className="form-field">
                <label>Received By <span className="required">*</span></label>
                <input
                  type="text"
                  name="receivedBy"
                  placeholder="Name of recipient"
                  value={editFields.receivedBy}
                  onChange={handleChange}
                  className={formErrors.receivedBy ? 'input-error' : ''}
                />
                {formErrors.receivedBy && <span className="error-msg">{formErrors.receivedBy}</span>}
              </div>

              <div className="form-field">
                <label>POD Type <span className="required">*</span></label>
                <select
                  name="podType"
                  value={editFields.podType}
                  onChange={handleChange}
                  className={formErrors.podType ? 'input-error' : ''}
                >
                  {Object.entries(POD_TYPE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                {formErrors.podType && <span className="error-msg">{formErrors.podType}</span>}
              </div>

              <div className="form-field">
                <label>Verification Status <span className="required">*</span></label>
                <select
                  name="status"
                  value={editFields.status}
                  onChange={handleChange}
                  className={formErrors.status ? 'input-error' : ''}
                >
                  {Object.entries(POD_STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                {formErrors.status && <span className="error-msg">{formErrors.status}</span>}
              </div>

              <div className="form-field">
                <label>POD Document URI</label>
                <input
                  type="url"
                  name="podURI"
                  placeholder="https://… (photo or signature URL)"
                  value={editFields.podURI}
                  onChange={handleChange}
                />
              </div>

              {msg.text && (
                <div className={`auth-message ${msg.type === 'error' ? 'auth-message-error' : 'auth-message-success'}`}
                  style={{ marginBottom: 8 }}>
                  {msg.text}
                </div>
              )}

              <div className="form-actions" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setIsEditing(false); setFormErrors({}); }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
