import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  getAllPods,
  createPodWithImage,
  updatePod,
  deletePod,
} from '../../api/manifestApi';
import { POD_STATUS_CONFIG, POD_TYPE_CONFIG } from '../../utils/constants';
import '../../styles/Bookings.css';
import '../../styles/DispatchManifests.css';

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
function validate(fields, isEditing = false) {
  const errors = {};
  if (!isEditing && (!fields.bookingID || Number(fields.bookingID) <= 0)) errors.bookingID = 'Enter a valid Booking ID.';
  if (!fields.receivedBy.trim()) errors.receivedBy = 'Received By is required.';
  if (!fields.podType)  errors.podType  = 'Select a POD type.';
  if (!fields.status)   errors.status   = 'Select a status.';
  return errors;
}

// Convert ISO/backend datetime → datetime-local input value (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Returns now as datetime-local default value
function nowDatetimeLocal() {
  return toDatetimeLocal(new Date().toISOString());
}

// Convert datetime-local string (YYYY-MM-DDTHH:mm) to LocalDateTime format
// WITHOUT UTC conversion — backend expects local time as-is
function toLocalDateTime(val) {
  if (!val) return null;
  return val.length === 16 ? val + ':00' : val;
}

const EMPTY_FORM = {
  bookingID:   '',
  receivedBy:  '',
  podURI:      '',
  podType:     'Photo',
  status:      'PENDING',
  deliveredAt: '',
};

// ── Component ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 4;
export default function PodList() {
  const navigate = useNavigate();
  const [pods, setPods]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter]     = useState('ALL');
  const [currentPage, setCurrentPage]   = useState(1);

  // Add Form
  const [showForm, setShowForm]       = useState(false);
  const [formFields, setFormFields]   = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState({});
  const [saving, setSaving]           = useState(false);
  const [formApiError, setFormApiError] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  // Edit Form
  const [editPod,      setEditPod]      = useState(null);
  const [editFields,   setEditFields]   = useState(EMPTY_FORM);
  const [editErrors,   setEditErrors]   = useState({});
  const [editSaving,   setEditSaving]   = useState(false);
  const [editApiError, setEditApiError] = useState('');
  const [editSuccessMessage, setEditSuccessMessage] = useState('');
  const [podCreationTimestamp, setPodCreationTimestamp] = useState(null);

  // Image upload state
  const [uploadingCreate, setUploadingCreate] = useState(false);
  const [createImgName,   setCreateImgName]   = useState('');
  const [createImageFile, setCreateImageFile] = useState(null);

  // Actions dropdown
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = {
    total:    pods.length,
    pending:  pods.filter((p) => p.proofOfDelivery?.status === 'PENDING').length,
    verified: pods.filter((p) => p.proofOfDelivery?.status === 'VERIFIED').length,
    rejected: pods.filter((p) => p.proofOfDelivery?.status === 'REJECTED').length,
  };

  // ── Form handlers ─────────────────────────────────────────────────────────

  const MAX_IMG_MB = 2;
  const MAX_IMG_SIZE = MAX_IMG_MB * 1024 * 1024;
  const ALLOWED_IMG_TYPES = ['image/jpeg', 'image/png'];
  
  const handleCreateImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!ALLOWED_IMG_TYPES.includes(file.type)) {
      setFormApiError('Only JPG and PNG images are allowed. Please select a valid image file.');
      e.target.value = '';
      return;
    }
    
    // Check file size
    if (file.size > MAX_IMG_SIZE) {
      setFormApiError(`File too large. Maximum image size is ${MAX_IMG_MB} MB (your file: ${(file.size / (1024 * 1024)).toFixed(2)} MB). Please choose a smaller file.`);
      e.target.value = '';
      return;
    }
    setCreateImgName(file.name);
    setCreateImageFile(file);
    setFormApiError('');
  };

  const openAdd = () => {
    setFormFields({ ...EMPTY_FORM, deliveredAt: nowDatetimeLocal() });
    setFormErrors({});
    setFormApiError('');
    setCreateImageFile(null);
    setCreateImgName('');
    setSaving(false);
    setShowForm(true);
  };

  const POD_NAME_FIELDS = ['receivedBy'];
  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = POD_NAME_FIELDS.includes(name) ? value.replace(/[^a-zA-Z0-9 ]/g, '') : value;
    setFormFields((prev) => ({ ...prev, [name]: sanitized }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormApiError('');
    setFormSuccessMessage('');
    const errs = validate(formFields);
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setSaving(true);
    const payload = {
      bookingID:   Number(formFields.bookingID),
      receivedBy:  formFields.receivedBy.trim(),
      podURI:      null,
      podType:     formFields.podType,
      status:      formFields.status,
      deliveredAt: formFields.deliveredAt
        ? toLocalDateTime(formFields.deliveredAt)
        : toLocalDateTime(nowDatetimeLocal()),
    };
    if (!createImageFile) {
      setFormApiError('Please select a POD image to upload.');
      setSaving(false);
      return;
    }
    createPodWithImage(payload, createImageFile)
      .then(() => {
        setFormSuccessMessage('Proof of Delivery added successfully!');
        setTimeout(() => {
          setShowForm(false);
          setFormSuccessMessage('');
          setCreateImageFile(null);
          setCreateImgName('');
          loadPods();
          setSaving(false);
        }, 1500);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data || 'Save failed.';
        setFormApiError(String(msg));
        setSaving(false);
      });
  };

  // ── Edit handlers ─────────────────────────────────────────────────────────

  const openEdit = (pod) => {
    setEditPod(pod);
    setEditFields({
      bookingID:   pod.bookingID  || '',
      receivedBy:  pod.receivedBy || '',
      podURI:      pod.podURI     || '',
      podType:     pod.podType    || 'Photo',
      status:      pod.status     || 'PENDING',
      deliveredAt: toDatetimeLocal(pod.deliveredAt),
    });
    setPodCreationTimestamp(pod.creationTimestamp || null);
    setEditErrors({});
    setEditApiError('');
    setOpenMenuId(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    const sanitized = POD_NAME_FIELDS.includes(name) ? value.replace(/[^a-zA-Z0-9 ]/g, '') : value;
    setEditFields((prev) => ({ ...prev, [name]: sanitized }));
    if (editErrors[name]) setEditErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setEditApiError('');
    setEditSuccessMessage('');
    const errs = validate(editFields, true);
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }
    // Backend only updates: deliveredAt, receivedBy, podType, status
    // bookingID and podURI (image) are NOT updated by the backend
    const payload = {
      receivedBy:  editFields.receivedBy.trim(),
      podType:     editFields.podType,
      status:      editFields.status,
      deliveredAt: editFields.deliveredAt
        ? toLocalDateTime(editFields.deliveredAt)
        : null,
    };
    setEditSaving(true);
    updatePod(editPod.podID, payload)
      .then(() => {
        setEditSuccessMessage('Proof of Delivery updated successfully!');
        setTimeout(() => {
          setEditPod(null);
          setEditSuccessMessage('');
          loadPods();
          setEditSaving(false);
        }, 1500);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data || 'Save failed.';
        setEditApiError(String(msg));
        setEditSaving(false);
      });
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = (id) => {
    if (!window.confirm('Delete this POD? This cannot be undone.')) return;
    deletePod(id)
      .then(() => { setOpenMenuId(null); loadPods(); })
      .catch(() => setOpenMenuId(null));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="bookings-page manifests-page">

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Proof of Delivery</h1>
            <p className="page-subtitle">Track and verify delivery evidence for all bookings</p>
          </div>
          <button className="btn-primary expand-btn" title="Add POD" onClick={openAdd}><span className="expand-btn-icon">+</span><span className="expand-btn-label">Add POD</span></button>
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
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        {pods.length === 0 ? 'No PODs recorded yet.' : 'No results match your filters.'}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((item) => {
                      const pod = item.proofOfDelivery || {};
                      const st  = POD_STATUS_CONFIG[pod.status]  || { label: pod.status  || '–', cls: '' };
                      const tp  = POD_TYPE_CONFIG[pod.podType]   || { label: pod.podType || '–' };
                      const isOpen = openMenuId === pod.podID;
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
                          <td className="actions-cell" onClick={(e) => e.stopPropagation()} ref={isOpen ? menuRef : null}>
                            <button
                              className="actions-menu-btn"
                              onClick={(e) => { e.stopPropagation(); setOpenMenuId(isOpen ? null : pod.podID); }}
                              title="Actions"
                            >…</button>
                            {isOpen && (
                              <div className="actions-dropdown">
                                <button className="actions-dropdown-item" onClick={() => { setOpenMenuId(null); navigate(`/pod/${pod.podID}`); }}>👁 View</button>
                                <button className="actions-dropdown-item" onClick={() => { openEdit(pod); }}>✏ Edit</button>
                                <button className="actions-dropdown-item actions-dropdown-danger" onClick={(e) => { e.stopPropagation(); handleDelete(pod.podID); }}>🗑 Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              <button className="page-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>‹ Prev</button>
              <span className="page-info">Page {currentPage} of {totalPages}</span>
              <button className="page-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next ›</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Add POD Slide-in Panel ── */}
      {showForm && (
        <div className="claim-form-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="claim-form-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button type="button" className="back-btn" onClick={() => setShowForm(false)} title="Back">
                ←
              </button>
              <h2 style={{ margin: 0 }}>Add Proof of Delivery</h2>
            </div>

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
                <label>POD Image (JPG / PNG)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#3b82f6', color: '#fff', padding: '7px 14px',
                    borderRadius: 6, cursor: uploadingCreate ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: 500, opacity: uploadingCreate ? 0.7 : 1,
                  }}>
                    {uploadingCreate ? 'Uploading…' : 'Choose Image'}
                    <input type="file" accept="image/jpeg,image/png"
                      style={{ display: 'none' }}
                      disabled={uploadingCreate || saving}
                      onChange={handleCreateImageChange} />
                  </label>
                  {createImgName && (
                    <span style={{ fontSize: 12, color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {createImgName}
                    </span>
                  )}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7280' }}>
                  Note: Only JPG / PNG images are accepted. Maximum file size is <strong>2 MB</strong>.
                </p>
              </div>

              {formSuccessMessage && (
                <div className="auth-message auth-message-success">✔ {formSuccessMessage}</div>
              )}
              {formApiError && (
                <div className="auth-message auth-message-error">⚠ {formApiError}</div>
              )}

              <div className="form-actions" style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Edit POD Slide-in Panel ── */}
      {editPod && (
        <div className="claim-form-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditPod(null); }}>
          <div className="claim-form-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button type="button" className="back-btn" onClick={() => setEditPod(null)} title="Back">
                ←
              </button>
              <h2 style={{ margin: 0 }}>Edit POD</h2>
            </div>
            <form onSubmit={handleEditSubmit} noValidate className="form-section">

              <div className="form-field">
                <label>Booking ID</label>
                <div style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: 6, border: '1px solid #e5e7eb', fontFamily: 'monospace' }}>
                  {formatBookingId(editFields.bookingID)}
                </div>
                <span style={{ fontSize: 12, color: '#6b7280', marginTop: 4, display: 'block' }}>Booking ID cannot be changed after creation.</span>
              </div>

              <div className="form-field">
                <label>Received By <span className="required">*</span></label>
                <input
                  type="text"
                  name="receivedBy"
                  placeholder="Name of recipient"
                  value={editFields.receivedBy}
                  onChange={handleEditChange}
                  className={editErrors.receivedBy ? 'input-error' : ''}
                />
                {editErrors.receivedBy && <span className="error-msg">{editErrors.receivedBy}</span>}
              </div>

              <div className="form-field">
                <label>POD Type <span className="required">*</span></label>
                <select
                  name="podType"
                  value={editFields.podType}
                  onChange={handleEditChange}
                  className={editErrors.podType ? 'input-error' : ''}
                >
                  {Object.entries(POD_TYPE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                {editErrors.podType && <span className="error-msg">{editErrors.podType}</span>}
              </div>

              <div className="form-field">
                <label>Status <span className="required">*</span></label>
                <select
                  name="status"
                  value={editFields.status}
                  onChange={handleEditChange}
                  className={editErrors.status ? 'input-error' : ''}
                >
                  {Object.entries(POD_STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                {editErrors.status && <span className="error-msg">{editErrors.status}</span>}
              </div>

              <div className="form-field">
                <label>Delivered At</label>
                <input
                  type="datetime-local"
                  name="deliveredAt"
                  value={editFields.deliveredAt}
                  onChange={handleEditChange}
                />
              </div>

              {podCreationTimestamp && (
                <div className="form-field">
                  <label>Creation Time</label>
                  <div style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                    {formatDateTime(podCreationTimestamp)}
                  </div>
                </div>
              )}

              {editSuccessMessage && (
                <div className="auth-message auth-message-success">✔ {editSuccessMessage}</div>
              )}
              {editApiError && (
                <div className="auth-message auth-message-error">⚠ {editApiError}</div>
              )}

              <div className="form-actions" style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" className="btn-primary" disabled={editSaving}>{editSaving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
