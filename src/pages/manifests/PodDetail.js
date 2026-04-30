import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAllPods, updatePod, deletePod, uploadManifestFile } from '../../api/manifestApi';
import { getBookingById } from '../../api/bookingsApi';
import { POD_STATUS_CONFIG, POD_TYPE_CONFIG, siteName } from '../../utils/constants';
import '../../styles/Bookings.css';
import '../../styles/DispatchManifests.css';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPodId(id)     { return id ? `POD${String(id).padStart(4, '0')}` : '–'; }
function formatBookingId(id) { return id ? `BK${String(id).padStart(4, '0')}` : '–'; }
function formatDateTime(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}// Convert ISO datetime → datetime-local input format (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
// Convert datetime-local string to LocalDateTime format WITHOUT UTC conversion
function toLocalDateTime(val) {
  if (!val) return null;
  return val.length === 16 ? val + ':00' : val;
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

  // Image upload
  const [uploadingImg, setUploadingImg] = useState(false);
  const [imgFileName,  setImgFileName]  = useState('');

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
          receivedBy:  pod.receivedBy || '',
          podType:     pod.podType    || 'Photo',
          status:      pod.status     || 'PENDING',
          podURI:      pod.podURI     || '',
          deliveredAt: toDatetimeLocal(pod.deliveredAt),
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
  const NAME_FIELDS = ['receivedBy'];
  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = NAME_FIELDS.includes(name) ? value.replace(/[^a-zA-Z0-9 ]/g, '') : value;
    setEditFields((prev) => ({ ...prev, [name]: sanitized }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const MAX_IMG_MB = 2;
  const MAX_IMG_SIZE = MAX_IMG_MB * 1024 * 1024;
  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMG_SIZE) {
      setMsg({ type: 'error', text: `File too large. Maximum image size is ${MAX_IMG_MB} MB (your file: ${(file.size / (1024 * 1024)).toFixed(2)} MB). Please choose a smaller file.` });
      e.target.value = '';
      return;
    }
    setImgFileName(file.name);
    setMsg({ type: '', text: '' });
    setUploadingImg(true);
    uploadManifestFile(file)
      .then((res) => {
        setEditFields((prev) => ({ ...prev, podURI: res.manifestURI }));
        setMsg({ type: 'success', text: 'Image uploaded — click Save Changes to apply.' });
      })
      .catch(() => setMsg({ type: 'error', text: 'Image upload failed. Ensure ManifestService (port 8001) is running.' }))
      .finally(() => setUploadingImg(false));
  };

  const handleSave = async () => {
    const errs = {};
    if (!editFields.receivedBy.trim()) errs.receivedBy = 'Received By is required.';
    if (!editFields.status)            errs.status     = 'Status is required.';
    if (Object.keys(errs).length > 0)  { setFormErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        bookingID:   podData.bookingID,
        receivedBy:  editFields.receivedBy.trim(),
        podType:     podData.podType,
        status:      editFields.status,
        podURI:      editFields.podURI.trim() || null,
        deliveredAt: podData.deliveredAt || null,
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
        <div className="booking-detail-page manifests-page">
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
        <div className="booking-detail-page manifests-page">
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
      <div className="booking-detail-page manifests-page">

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

            <div className="detail-grid">

              {/* ── Section 1 : POD Information ──────────────────────────── */}
              <div className="detail-card">
                <h3 className="detail-card-title" style={{ marginBottom: 20 }}>
                  📄 Proof of Delivery Information
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
                      <>
                        <img
                          src={podData.podURI.startsWith('/') ? `http://localhost:8001${podData.podURI}` : podData.podURI}
                          alt="POD"
                          style={{ maxWidth: 240, maxHeight: 180, borderRadius: 6, border: '1px solid #e5e7eb', display: 'block', marginBottom: 6 }}
                        />
                        <a
                          href={podData.podURI.startsWith('/') ? `http://localhost:8001${podData.podURI}` : podData.podURI}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-view"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          View Full Image
                        </a>
                      </>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No image attached</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Section 2 : Associated Booking Details ────────────────── */}
              <div className="detail-card">
                <h3 className="detail-card-title" style={{ marginBottom: 20 }}>
                  📦 Associated Booking Details
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
                <label>POD Image (JPG / PNG)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#3b82f6', color: '#fff', padding: '7px 14px',
                    borderRadius: 6, cursor: uploadingImg ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: 500, opacity: uploadingImg ? 0.7 : 1,
                  }}>
                    {uploadingImg ? 'Uploading…' : 'Choose Image'}
                    <input type="file" accept="image/jpeg,image/png"
                      style={{ display: 'none' }}
                      disabled={uploadingImg || saving}
                      onChange={handleImgChange} />
                  </label>
                  {imgFileName && (
                    <span style={{ fontSize: 12, color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {imgFileName}
                    </span>
                  )}
                  {editFields.podURI && !uploadingImg && (
                    <img
                      src={editFields.podURI.startsWith('/') ? `http://localhost:8001${editFields.podURI}` : editFields.podURI}
                      alt="preview"
                      style={{ height: 56, borderRadius: 4, border: '1px solid #e5e7eb' }}
                    />
                  )}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7280' }}>
                  Note: Only JPG / PNG images are accepted. Maximum file size is <strong>2 MB</strong>.
                </p>
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
