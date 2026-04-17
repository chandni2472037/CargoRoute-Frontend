import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  getAllPods,
  createPod,
  updatePod,
  deletePod,
} from '../../api/manifestApi';
import { POD_STATUS_CONFIG, POD_TYPE_CONFIG } from '../../utils/constants';
import '../../styles/Bookings.css';

// ── Formatters ────────────────────────────────────────────────────────────────
function formatPodId(id)     { return `POD${String(id).padStart(4, '0')}`; }
function formatBookingId(id) { return id ? `BK${String(id).padStart(4, '0')}` : '–'; }
function formatDateTime(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Validation ────────────────────────────────────────────────────────────────
function validate(fields) {
  const errors = {};
  if (!fields.bookingID || Number(fields.bookingID) <= 0) errors.bookingID = 'Enter a valid Booking ID.';
  if (!fields.receivedBy.trim()) errors.receivedBy = 'Received By is required.';
  if (!fields.podType)  errors.podType  = 'Select a POD type.';
  if (!fields.status)   errors.status   = 'Select a status.';
  return errors;
}

const EMPTY_FORM = {
  bookingID:  '',
  receivedBy: '',
  podURI:     '',
  podType:    'Photo',
  status:     'PENDING',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PodList() {
  const navigate = useNavigate();
  const [pods, setPods]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter]     = useState('ALL');

  // Form
  const [showForm, setShowForm]       = useState(false);
  const [formFields, setFormFields]   = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState({});
  const [saving, setSaving]           = useState(false);
  const [formApiError, setFormApiError] = useState('');

  // Delete
  const [deletingId, setDeletingId] = useState(null);

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadPods = useCallback(() => {
    setLoading(true);
    setError('');
    getAllPods()
      .then(setPods)
      .catch(() => setError('Could not load PODs. Is ManifestService running?'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadPods(); }, [loadPods]);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = pods.filter((p) => {
    const pod  = p.proofOfDelivery || {};
    const bk   = p.booking        || {};
    const q    = search.toLowerCase().trim();
    const matchSearch = !q ||
      formatPodId(pod.podID).toLowerCase().includes(q) ||
      formatBookingId(pod.bookingID).toLowerCase().includes(q) ||
      (pod.receivedBy || '').toLowerCase().includes(q) ||
      (bk.commodity   || '').toLowerCase().includes(q) ||
      (pod.podURI     || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || pod.status === statusFilter;
    const matchType   = typeFilter   === 'ALL' || pod.podType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = {
    total:    pods.length,
    pending:  pods.filter((p) => p.proofOfDelivery?.status === 'PENDING').length,
    verified: pods.filter((p) => p.proofOfDelivery?.status === 'VERIFIED').length,
    rejected: pods.filter((p) => p.proofOfDelivery?.status === 'REJECTED').length,
  };

  // ── Form handlers ─────────────────────────────────────────────────────────

  const openAdd = () => {
    setFormFields(EMPTY_FORM);
    setFormErrors({});
    setFormApiError('');
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormApiError('');
    const errs = validate(formFields);
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    const payload = {
      bookingID:  Number(formFields.bookingID),
      receivedBy: formFields.receivedBy.trim(),
      podURI:     formFields.podURI.trim() || null,
      podType:    formFields.podType,
      status:     formFields.status,
    };

    setSaving(true);
    createPod(payload)
      .then(() => { setShowForm(false); loadPods(); })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data || 'Save failed.';
        setFormApiError(String(msg));
        setSaving(false);
      });
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = (id) => {
    deletePod(id)
      .then(() => { setDeletingId(null); loadPods(); })
      .catch(() => setDeletingId(null));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="bookings-page">

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Proof of Delivery</h1>
            <p className="page-subtitle">Track and verify delivery evidence for all bookings</p>
          </div>
          <button className="btn-primary" onClick={openAdd}>+ Add POD</button>
        </div>

        {/* ── Stats ── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total PODs</div>
            <div className="stat-value">{stats.total}</div>
            <span className="stat-icon" role="img" aria-label="pod">📄</span>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value stat-pending">{stats.pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Verified</div>
            <div className="stat-value stat-delivered">{stats.verified}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Rejected</div>
            <div className="stat-value stat-cancelled">{stats.rejected}</div>
          </div>
        </div>

        {error && (
          <div className="auth-message auth-message-error" style={{ marginBottom: 16 }}>⚠ {error}</div>
        )}

        {/* ── Table ── */}
        <div className="table-section">
          <h2 className="section-title">All Proof of Deliveries</h2>

          <div className="table-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by POD ID, booking ID, received by…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="toolbar-right">
              <div className="filter-wrapper">
                <span>⚙️</span>
                <select className="status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  {Object.entries(POD_STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-wrapper">
                <select className="status-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="ALL">All Types</option>
                  {Object.entries(POD_TYPE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <button className="btn-export" onClick={loadPods}>↺ Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading PODs…</div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>POD ID</th>
                    <th>Booking ID</th>
                    <th>Received By</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        {pods.length === 0 ? 'No PODs recorded yet.' : 'No results match your filters.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => {
                      const pod = item.proofOfDelivery || {};
                      const st  = POD_STATUS_CONFIG[pod.status]  || { label: pod.status  || '–', cls: '' };
                      const tp  = POD_TYPE_CONFIG[pod.podType]   || { label: pod.podType || '–' };
                      return (
                        <tr key={pod.podID} className="table-row" style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/pod/${pod.podID}`)}>
                          <td className="booking-id-cell">{formatPodId(pod.podID)}</td>
                          <td className="booking-id-cell">{formatBookingId(pod.bookingID)}</td>
                          <td>{pod.receivedBy || '–'}</td>
                          <td>{tp.label}</td>
                          <td>
                            <span className={`status-badge ${st.cls}`}>{st.label}</span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn-view" onClick={() => navigate(`/pod/${pod.podID}`)}>View</button>
                              {deletingId === pod.podID ? (
                                <>
                                  <button className="btn-view" style={{ background: '#fee2e2', color: '#b91c1c' }} onClick={() => handleDelete(pod.podID)}>Confirm</button>
                                  <button className="btn-view" onClick={() => setDeletingId(null)}>Cancel</button>
                                </>
                              ) : (
                                <button className="btn-view" style={{ background: '#fee2e2', color: '#b91c1c' }} onClick={() => setDeletingId(pod.podID)}>Delete</button>
                              )}
                            </div>
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

      {/* ── Add POD Slide-in Panel ── */}
      {showForm && (
        <div className="claim-form-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="claim-form-panel">
            <h2>📄 Add Proof of Delivery</h2>

            <form onSubmit={handleSubmit} noValidate className="form-section">

              <div className="form-field">
                <label>Booking ID <span className="required">*</span></label>
                <input
                  type="number"
                  name="bookingID"
                  min="1"
                  placeholder="e.g. 3"
                  value={formFields.bookingID}
                  onChange={handleChange}
                  className={formErrors.bookingID ? 'input-error' : ''}
                />
                {formErrors.bookingID && <span className="error-msg">{formErrors.bookingID}</span>}
              </div>

              <div className="form-field">
                <label>Received By <span className="required">*</span></label>
                <input
                  type="text"
                  name="receivedBy"
                  placeholder="Name of recipient"
                  value={formFields.receivedBy}
                  onChange={handleChange}
                  className={formErrors.receivedBy ? 'input-error' : ''}
                />
                {formErrors.receivedBy && <span className="error-msg">{formErrors.receivedBy}</span>}
              </div>

              <div className="form-field">
                <label>POD Type <span className="required">*</span></label>
                <select
                  name="podType"
                  value={formFields.podType}
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
                <label>Status <span className="required">*</span></label>
                <select
                  name="status"
                  value={formFields.status}
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
                  type="text"
                  name="podURI"
                  placeholder="https://… (photo or signature URL)"
                  value={formFields.podURI}
                  onChange={handleChange}
                />
              </div>

              {formApiError && (
                <div className="auth-message auth-message-error">⚠ {formApiError}</div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Add POD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
