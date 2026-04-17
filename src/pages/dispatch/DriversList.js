import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import {
  getAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../../api/dispatchApi';
import { DRIVER_STATUS_CONFIG } from '../../utils/constants';
import '../../styles/Bookings.css';

// ── Validation ────────────────────────────────────────────────────────────────

function validateDriverForm(fields) {
  const errors = {};
  if (!fields.name.trim())        errors.name        = 'Name is required.';
  if (!fields.licenseNo.trim())   errors.licenseNo   = 'License number is required.';
  if (!fields.mobileNumber.trim()) errors.mobileNumber = 'Mobile number is required.';
  if (!fields.status)             errors.status      = 'Select a status.';
  return errors;
}

// ── Component ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name:         '',
  licenseNo:    '',
  contactInfo:  '',
  mobileNumber: '',
  status:       'AVAILABLE',
};

export default function DriversList() {
  const [drivers, setDrivers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal state
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [formFields, setFormFields]   = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState({});
  const [saving, setSaving]           = useState(false);
  const [formApiError, setFormApiError] = useState('');

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadDrivers = useCallback(() => {
    setLoading(true);
    setError('');
    getAllDrivers()
      .then(setDrivers)
      .catch(() => setError('Could not load drivers. Is DispatchService running?'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      (d.name || '').toLowerCase().includes(q) ||
      (d.licenseNo || '').toLowerCase().includes(q) ||
      (d.mobileNumber || '').toLowerCase().includes(q) ||
      (d.contactInfo || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = {
    total:       drivers.length,
    available:   drivers.filter((d) => d.status === 'AVAILABLE').length,
    assigned:    drivers.filter((d) => d.status === 'ASSIGNED').length,
    onRoute:     drivers.filter((d) => d.status === 'ON_ROUTE').length,
  };

  // ── Form handlers ─────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingId(null);
    setFormFields(EMPTY_FORM);
    setFormErrors({});
    setFormApiError('');
    setShowForm(true);
  };

  const openEdit = (driver) => {
    setEditingId(driver.driverID);
    setFormFields({
      name:         driver.name         || '',
      licenseNo:    driver.licenseNo    || '',
      contactInfo:  driver.contactInfo  || '',
      mobileNumber: driver.mobileNumber || '',
      status:       driver.status       || 'AVAILABLE',
    });
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
    const validationErrors = validateDriverForm(formFields);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    const payload = {
      name:         formFields.name.trim(),
      licenseNo:    formFields.licenseNo.trim(),
      contactInfo:  formFields.contactInfo.trim() || null,
      mobileNumber: formFields.mobileNumber.trim(),
      status:       formFields.status,
    };

    setSaving(true);
    const apiCall = editingId
      ? updateDriver(editingId, payload)
      : createDriver(payload);

    apiCall
      .then(() => {
        setShowForm(false);
        loadDrivers();
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data || 'Save failed.';
        setFormApiError(String(msg));
        setSaving(false);
      });
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = (id) => {
    deleteDriver(id)
      .then(() => { setDeletingId(null); loadDrivers(); })
      .catch(() => { setDeletingId(null); });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="bookings-page">

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Drivers</h1>
            <p className="page-subtitle">Manage driver profiles and availability</p>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            + Add Driver
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Drivers</div>
            <div className="stat-value">{stats.total}</div>
            <span className="stat-icon" role="img" aria-label="driver">👤</span>
          </div>
          <div className="stat-card">
            <div className="stat-label">Available</div>
            <div className="stat-value stat-transit">{stats.available}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Assigned</div>
            <div className="stat-value stat-pending">{stats.assigned}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">On Route</div>
            <div className="stat-value stat-delivered">{stats.onRoute}</div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="auth-message auth-message-error" style={{ marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Table Section ── */}
        <div className="table-section">
          <h2 className="section-title">All Drivers</h2>

          <div className="table-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by name, license, mobile or contact…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="toolbar-right">
              <div className="filter-wrapper">
                <span>⚙️</span>
                <select
                  className="status-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  {Object.entries(DRIVER_STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <button className="btn-export" onClick={loadDrivers}>↺ Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading drivers…</div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Driver ID</th>
                    <th>Name</th>
                    <th>License No</th>
                    <th>Mobile</th>
                    <th>Contact Info</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-state">
                        {drivers.length === 0
                          ? 'No drivers registered yet. Add a driver to get started.'
                          : 'No drivers match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((driver) => {
                      const st = DRIVER_STATUS_CONFIG[driver.status] || { label: driver.status, cls: '' };
                      return (
                        <tr key={driver.driverID} className="table-row">
                          <td className="booking-id-cell">
                            DR{String(driver.driverID).padStart(4, '0')}
                          </td>
                          <td>{driver.name || '–'}</td>
                          <td>{driver.licenseNo || '–'}</td>
                          <td>{driver.mobileNumber || '–'}</td>
                          <td>{driver.contactInfo || '–'}</td>
                          <td>
                            <span className={`status-badge ${st.cls}`}>{st.label}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn-view"
                                onClick={() => openEdit(driver)}
                              >
                                Edit
                              </button>
                              {deletingId === driver.driverID ? (
                                <>
                                  <button
                                    className="btn-view"
                                    style={{ background: '#fee2e2', color: '#b91c1c' }}
                                    onClick={() => handleDelete(driver.driverID)}
                                  >
                                    Confirm
                                  </button>
                                  <button className="btn-view" onClick={() => setDeletingId(null)}>
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  className="btn-view"
                                  style={{ background: '#fee2e2', color: '#b91c1c' }}
                                  onClick={() => setDeletingId(driver.driverID)}
                                >
                                  Delete
                                </button>
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

      {/* ── Add / Edit Driver Slide-in Panel ── */}
      {showForm && (
        <div
          className="claim-form-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="claim-form-panel">
            <h2>{editingId ? 'Edit Driver' : 'Add Driver'}</h2>

            <form onSubmit={handleSubmit} noValidate className="form-section">

              <div className="form-field">
                <label>Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={formFields.name}
                  onChange={handleChange}
                  className={formErrors.name ? 'input-error' : ''}
                />
                {formErrors.name && <span className="error-msg">{formErrors.name}</span>}
              </div>

              <div className="form-field">
                <label>License No <span className="required">*</span></label>
                <input
                  type="text"
                  name="licenseNo"
                  placeholder="e.g. MH1234567"
                  value={formFields.licenseNo}
                  onChange={handleChange}
                  className={formErrors.licenseNo ? 'input-error' : ''}
                />
                {formErrors.licenseNo && <span className="error-msg">{formErrors.licenseNo}</span>}
              </div>

              <div className="form-field">
                <label>Mobile Number <span className="required">*</span></label>
                <input
                  type="tel"
                  name="mobileNumber"
                  placeholder="+91 9876543210"
                  value={formFields.mobileNumber}
                  onChange={handleChange}
                  className={formErrors.mobileNumber ? 'input-error' : ''}
                />
                {formErrors.mobileNumber && <span className="error-msg">{formErrors.mobileNumber}</span>}
              </div>

              <div className="form-field">
                <label>Contact Info</label>
                <input
                  type="text"
                  name="contactInfo"
                  placeholder="Email or secondary contact"
                  value={formFields.contactInfo}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label>Status <span className="required">*</span></label>
                <select
                  name="status"
                  value={formFields.status}
                  onChange={handleChange}
                  className={formErrors.status ? 'input-error' : ''}
                >
                  {Object.entries(DRIVER_STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                {formErrors.status && <span className="error-msg">{formErrors.status}</span>}
              </div>

              {formApiError && (
                <div className="auth-message auth-message-error">⚠ {formApiError}</div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
