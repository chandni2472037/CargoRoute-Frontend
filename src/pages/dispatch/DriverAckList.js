import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  getAllAcknowledgements,
  createAcknowledgement,
  updateAcknowledgement,
  getAllDispatches,
  getAllDrivers,
} from '../../api/dispatchApi';
import { DISPATCH_STATUS_CONFIG, DRIVER_STATUS_CONFIG } from '../../utils/constants';
import '../../styles/Bookings.css';
import '../../styles/DispatchManifests.css';

// ── Formatters ────────────────────────────────────────────────────────────────

function formatDispatchId(id) {
  return id ? `DS${String(id).padStart(4, '0')}` : '–';
}
function formatDateTime(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateForm(fields) {
  const errors = {};
  if (!fields.dispatchID) errors.dispatchID = 'Select a dispatch.';
  if (!fields.driverID)   errors.driverID   = 'Select a driver.';
  return errors;
}

const EMPTY_FORM = { dispatchID: '', driverID: '', notes: '' };

// ── Component ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 4;

export default function DriverAckList() {
  const navigate = useNavigate();

  const [acks, setAcks]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // dropdowns
  const [dispatches, setDispatches] = useState([]);
  const [drivers, setDrivers]       = useState([]);

  // form panel
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [formFields, setFormFields]   = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState({});
  const [saving, setSaving]           = useState(false);
  const [formApiError, setFormApiError] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  // actions menu
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadData = useCallback(() => {
    setLoading(true);
    setError('');
    getAllAcknowledgements()
      .then(setAcks)
      .catch(() => setError('Could not load acknowledgements. Is DispatchService running?'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
    getAllDispatches().then(setDispatches).catch(() => {});
    getAllDrivers().then(setDrivers).catch(() => {});
  }, [loadData]);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = acks.filter((a) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const dispId = formatDispatchId(a.dispatch?.dispatch?.dispatchID).toLowerCase();
    const driverName = (a.driver?.name || '').toLowerCase();
    const loadCode = (a.dispatch?.load?.loadCode || '').toLowerCase();
    const notes = (a.notes || '').toLowerCase();
    return dispId.includes(q) || driverName.includes(q) || loadCode.includes(q) || notes.includes(q);
  });

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // ── Pagination ───────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = {
    total:   acks.length,
    today:   acks.filter((a) => {
      if (!a.ackAt) return false;
      const d = new Date(a.ackAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
    unique:  new Set(acks.map((a) => a.driver?.driverID).filter(Boolean)).size,
  };

  // Show all dispatches that are not yet completed or cancelled
  const ACK_INELIGIBLE_STATUSES = ['COMPLETED', 'CANCELLED'];
  const eligibleDispatches = dispatches.filter(
    (d) => !ACK_INELIGIBLE_STATUSES.includes((d.dispatch || {}).status)
  );

  // ── Form handlers ─────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingId(null);
    setFormFields(EMPTY_FORM);
    setFormErrors({});
    setFormApiError('');
    setSaving(false);
    setShowForm(true);
  };

  const openEdit = (ack) => {
    setEditingId(ack.ackID);
    setFormFields({
      dispatchID: String(ack.dispatch?.dispatch?.dispatchID || ''),
      driverID:   String(ack.driver?.driverID || ''),
      notes:      ack.notes || '',
    });
    setFormErrors({});
    setFormApiError('');
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-fill assigned driver when a dispatch is chosen
      if (name === 'dispatchID' && value) {
        const selected = dispatches.find(
          (d) => String((d.dispatch || {}).dispatchID) === String(value)
        );
        const assignedDriverID = selected?.dispatch?.assignedDriverID;
        if (assignedDriverID) next.driverID = String(assignedDriverID);
      }
      return next;
    });
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormApiError('');
    setFormSuccessMessage('');
    const validationErrors = validateForm(formFields);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    const payload = {
      dispatchID: Number(formFields.dispatchID),
      driverID:   Number(formFields.driverID),
      notes:      formFields.notes.trim() || null,
    };

    setSaving(true);
    const apiCall = editingId
      ? updateAcknowledgement(editingId, payload)
      : createAcknowledgement(payload);

    apiCall
      .then(() => {
        const action = editingId ? 'updated' : 'added';
        setFormSuccessMessage(`Acknowledgement ${action} successfully!`);
        setTimeout(() => {
          setShowForm(false);
          setFormSuccessMessage('');
          setFormApiError('');
          loadData();
        }, 1500);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data || 'Save failed.';
        setFormApiError(String(msg));
      })
      .finally(() => setSaving(false));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="bookings-page dispatch-page">

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Driver Acknowledgements</h1>
            <p className="page-subtitle">Track driver acceptance of dispatch assignments</p>
          </div>
          <button className="btn-primary expand-btn" title="Record Acknowledgement" onClick={openAdd}>
            <span className="expand-btn-icon">+</span><span className="expand-btn-label">Record Acknowledgement</span>
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Acknowledgements</div>
            <div className="stat-value">{stats.total}</div>
            <span className="stat-icon" role="img" aria-label="ack">✔</span>
          </div>
          <div className="stat-card">
            <div className="stat-label">Recorded Today</div>
            <div className="stat-value stat-transit">{stats.today}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Unique Drivers</div>
            <div className="stat-value stat-delivered">{stats.unique}</div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="auth-message auth-message-error" style={{ marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Table ── */}
        <div className="table-section">
          <h2 className="section-title">All Acknowledgements</h2>

          <div className="table-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by dispatch ID, driver name, load code or notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="toolbar-right">
              <button className="btn-export" onClick={loadData}>↺ Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading acknowledgements…</div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Ack ID</th>
                    <th>Driver</th>
                    <th>Dispatch</th>
                    <th>Acknowledged At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        {acks.length === 0
                          ? 'No acknowledgements recorded yet.'
                          : 'No results match your search.'}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((ack) => {
                      const dispatch   = ack.dispatch?.dispatch || {};
                      const load       = ack.dispatch?.load     || {};
                      const driver     = ack.driver             || {};
                      const dSt = DISPATCH_STATUS_CONFIG[dispatch.status] || { label: dispatch.status || '–', cls: '' };
                      const drSt = DRIVER_STATUS_CONFIG[driver.status]   || { label: driver.status  || '–', cls: '' };

                      return (
                        <tr
                          key={ack.ackID}
                          className="table-row"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/dispatch/${dispatch.dispatchID}`)}
                        >
                          <td className="booking-id-cell">
                            ACK{String(ack.ackID).padStart(4, '0')}
                          </td>
                          <td>{driver.name || '–'}</td>
                          <td className="booking-id-cell">
                            {formatDispatchId(dispatch.dispatchID)}
                          </td>
                          <td>{formatDateTime(ack.ackAt)}</td>
                          <td className="actions-cell" onClick={(e) => e.stopPropagation()} ref={openMenuId === ack.ackID ? menuRef : null}>
                            <button
                              className="actions-menu-btn"
                              title="Actions"
                              onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === ack.ackID ? null : ack.ackID); }}
                            >…</button>
                            {openMenuId === ack.ackID && (
                              <div className="actions-dropdown">
                                <button className="actions-dropdown-item" onClick={() => { setOpenMenuId(null); openEdit(ack); }}>✏️ Edit</button>
                                <button className="actions-dropdown-item" onClick={() => { setOpenMenuId(null); navigate(`/dispatch/${dispatch.dispatchID}`); }}>👁 View Dispatch</button>
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

      {/* ── Add / Edit Acknowledgement Slide-in Panel ── */}
      {showForm && (
        <div
          className="claim-form-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="claim-form-panel">
            <h2>{editingId ? 'Edit Acknowledgement' : '✔ Record Acknowledgement'}</h2>

            <form onSubmit={handleSubmit} noValidate className="form-section">

              <div className="form-field">
                <label>Dispatch <span className="required">*</span></label>
                <select
                  name="dispatchID"
                  value={formFields.dispatchID}
                  onChange={handleChange}
                  className={formErrors.dispatchID ? 'input-error' : ''}
                >
                  <option value="">— Select dispatch —</option>
                  {eligibleDispatches.map((d) => {
                    const dsp = d.dispatch || {};
                    const ld  = d.load     || {};
                    const st  = DISPATCH_STATUS_CONFIG[dsp.status] || { label: dsp.status };
                    return (
                      <option key={dsp.dispatchID} value={dsp.dispatchID}>
                        {formatDispatchId(dsp.dispatchID)}
                        {ld.loadCode ? ` · ${ld.loadCode}` : ''}
                        {` · ${st.label}`}
                      </option>
                    );
                  })}
                  {eligibleDispatches.length === 0 && (
                    <option disabled value="">No active dispatches available</option>
                  )}
                </select>
                {formErrors.dispatchID && <span className="error-msg">{formErrors.dispatchID}</span>}
              </div>

              <div className="form-field">
                <label>Driver <span className="required">*</span></label>
                <select
                  name="driverID"
                  value={formFields.driverID}
                  onChange={handleChange}
                  className={formErrors.driverID ? 'input-error' : ''}
                  disabled={!!formFields.dispatchID && !editingId}
                >
                  <option value="">— Select driver —</option>
                  {drivers.map((dr) => {
                    const drSt = DRIVER_STATUS_CONFIG[dr.status] || { label: dr.status };
                    return (
                      <option key={dr.driverID} value={dr.driverID}>
                        {dr.name} — {dr.licenseNo} ({drSt.label})
                      </option>
                    );
                  })}
                </select>
                {formErrors.driverID && <span className="error-msg">{formErrors.driverID}</span>}
                {formFields.dispatchID && !editingId && (
                  <span className="ack-lock-notice">Auto-filled from dispatch — only the assigned driver may acknowledge.</span>
                )}
              </div>

              <div className="form-field">
                <label>Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={300}
                  placeholder="Optional driver comments or remarks…"
                  value={formFields.notes}
                  onChange={handleChange}
                />
                <span className="field-hint" style={{ color: formFields.notes.length >= 280 ? '#ef4444' : '#94a3b8' }}>
                  {formFields.notes.length}/300 characters
                </span>
              </div>

              {formSuccessMessage && (
                <div className="auth-message auth-message-success">✔ {formSuccessMessage}</div>
              )}
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
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : '✔ Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
