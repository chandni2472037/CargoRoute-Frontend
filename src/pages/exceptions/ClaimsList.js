import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  getAllClaims,
  createClaim,
  updateClaimStatus,
} from '../../api/exceptionsApi';
import {
  CLAIM_STATUS_CONFIG,
  EXCEPTION_TYPE_CONFIG,
  EXCEPTION_STATUS_CONFIG,
} from '../../utils/constants';
import '../../styles/Bookings.css';
import '../../styles/Exceptions.css';

// ── Formatters ───────────────────────────────────────────────────────────────

function formatClaimId(id) {
  return `CL${String(id).padStart(4, '0')}`;
}

function formatExceptionId(id) {
  return id ? `EX${String(id).padStart(4, '0')}` : '–';
}

function formatBookingId(id) {
  return id ? `BK${String(id).padStart(4, '0')}` : '–';
}

function formatDateTime(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount) {
  if (amount == null) return '–';
  return `₹${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Claim form validation ─────────────────────────────────────────────────────

function validateClaimForm(fields) {
  const errors = {};
  if (!fields.exceptionId || isNaN(Number(fields.exceptionId)) || Number(fields.exceptionId) <= 0) {
    errors.exceptionId = 'Enter a valid Exception ID (positive number).';
  }
  if (!fields.filedBy.trim()) {
    errors.filedBy = 'Filer name is required.';
  }
  if (!fields.amountClaimed || isNaN(Number(fields.amountClaimed)) || Number(fields.amountClaimed) <= 0) {
    errors.amountClaimed = 'Enter a valid amount (greater than 0).';
  }
  return errors;
}

// ── Component ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  exceptionId:     '',
  filedBy:         '',
  amountClaimed:   '',
  resolutionNotes: '',
};

export default function ClaimsList() {
  const navigate = useNavigate();

  // Data
  const [claims, setClaims]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Filtering
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Status update inline
  const [pendingStatus, setPendingStatus] = useState({});   // claimId → newStatus
  const [updateMsg, setUpdateMsg]         = useState({});   // claimId → message

  // File Claim panel
  const [showForm, setShowForm]       = useState(false);
  const [formFields, setFormFields]   = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState({});
  const [saving, setSaving]           = useState(false);
  const [formApiError, setFormApiError] = useState('');

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadClaims = useCallback(() => {
    setLoading(true);
    setError('');
    getAllClaims()
      .then(setClaims)
      .catch(() => setError('Could not load claims. Is ExceptionService running?'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = claims.filter((claim) => {
    const q = search.toLowerCase().trim();
    const exId  = claim.exception?.exceptiondto?.exceptionID;
    const bkId  = claim.exception?.exceptiondto?.bookingId;

    const matchSearch =
      !q ||
      formatClaimId(claim.claimID).toLowerCase().includes(q) ||
      formatExceptionId(exId).toLowerCase().includes(q) ||
      String(exId || '').includes(q) ||
      formatBookingId(bkId).toLowerCase().includes(q) ||
      String(bkId || '').includes(q) ||
      (claim.filedBy || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'ALL' || claim.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = {
    total:       claims.length,
    open:        claims.filter((c) => c.status === 'OPEN').length,
    underReview: claims.filter((c) => c.status === 'UNDER_REVIEW').length,
    settled:     claims.filter((c) => c.status === 'SETTLED').length,
  };

  // ── Total amount ──────────────────────────────────────────────────────────

  const totalAmount = claims.reduce(
    (sum, c) => sum + (Number(c.amountClaimed) || 0),
    0
  );

  // ── Status update ─────────────────────────────────────────────────────────

  const handleStatusChange = (claimId, value) => {
    setPendingStatus((prev) => ({ ...prev, [claimId]: value }));
    setUpdateMsg((prev) => ({ ...prev, [claimId]: '' }));
  };

  const applyStatusUpdate = (claim) => {
    const next = pendingStatus[claim.claimID];
    if (!next || next === claim.status) return;

    updateClaimStatus(claim.claimID, next)
      .then(() => {
        setUpdateMsg((prev) => ({
          ...prev,
          [claim.claimID]: `Updated to ${CLAIM_STATUS_CONFIG[next]?.label || next}`,
        }));
        loadClaims();
      })
      .catch(() => {
        setUpdateMsg((prev) => ({
          ...prev,
          [claim.claimID]: 'Update failed',
        }));
        setPendingStatus((prev) => ({ ...prev, [claim.claimID]: claim.status }));
      });
  };

  // ── File Claim form ───────────────────────────────────────────────────────

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormApiError('');
    const validationErrors = validateClaimForm(formFields);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    const payload = {
      exceptionID:     Number(formFields.exceptionId),
      filedBy:         formFields.filedBy.trim(),
      amountClaimed:   Number(formFields.amountClaimed),
      resolutionNotes: formFields.resolutionNotes.trim() || null,
    };

    setSaving(true);
    createClaim(payload)
      .then(() => {
        setShowForm(false);
        setFormFields(EMPTY_FORM);
        setFormErrors({});
        loadClaims();
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data ||
          'Failed to file claim. Check the Exception ID and try again.';
        setFormApiError(String(msg));
        setSaving(false);
      });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="bookings-page exceptions-page">

        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Claims</h1>
            <p className="page-subtitle">
              Manage compensation claims linked to freight exceptions
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-secondary"
              onClick={() => navigate('/exceptions')}
            >
              ← Exceptions
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setShowForm(true);
                setFormApiError('');
                setFormErrors({});
                setFormFields(EMPTY_FORM);
              }}
            >
              📋 File Claim
            </button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Claims</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Open</div>
            <div className="stat-value stat-pending">{stats.open}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Under Review</div>
            <div className="stat-value stat-transit">{stats.underReview}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Settled</div>
            <div className="stat-value stat-delivered">{stats.settled}</div>
          </div>
        </div>

        {/* Total amount chip */}
        {claims.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <span className="claim-total-chip">
              💰 Total Claimed: {formatCurrency(totalAmount)}
            </span>
          </div>
        )}

        {/* ── Table Section ── */}
        <div className="table-section">
          <h2 className="section-title">All Claims</h2>

          {/* Toolbar */}
          <div className="table-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by claim ID, exception ID, booking ID or filer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="toolbar-right">
              <div className="filter-wrapper">
                <span>🏷️</span>
                <select
                  className="status-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  {Object.entries(CLAIM_STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <button className="btn-export" onClick={loadClaims}>↺ Refresh</button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-message auth-message-error" style={{ marginBottom: 16 }}>
              ⚠ {error}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="empty-state">Loading claims…</div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Exception</th>
                    <th>Exception Type</th>
                    <th>Booking</th>
                    <th>Filed By</th>
                    <th>Amount Claimed</th>
                    <th>Filed At</th>
                    <th>Status</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="empty-state">
                        {claims.length === 0
                          ? 'No claims filed yet. Use "File Claim" to get started.'
                          : 'No claims match your search.'}
                      </td>
                    </tr>
                  ) : filtered.map((claim) => {
                    const exDto  = claim.exception?.exceptiondto || {};
                    const typeCfg =
                      EXCEPTION_TYPE_CONFIG[exDto.type] || { label: exDto.type, cls: '', icon: '⚠️' };
                    const statusCfg =
                      CLAIM_STATUS_CONFIG[claim.status] || { label: claim.status, cls: '' };
                    const currentPending =
                      pendingStatus[claim.claimID] ?? claim.status;
                    const msg = updateMsg[claim.claimID] || '';

                    return (
                      <tr key={claim.claimID}>
                        <td>
                          <span className="booking-id-cell">
                            {formatClaimId(claim.claimID)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-view"
                            onClick={() =>
                              navigate(`/exceptions/${exDto.exceptionID}`)
                            }
                          >
                            {formatExceptionId(exDto.exceptionID)}
                          </button>
                        </td>
                        <td>
                          {exDto.type ? (
                            <span className={`status-badge ${typeCfg.cls}`}>
                              {typeCfg.label}
                            </span>
                          ) : (
                            '–'
                          )}
                        </td>
                        <td>
                          <span className="booking-id-cell">
                            {formatBookingId(exDto.bookingId)}
                          </span>
                        </td>
                        <td>{claim.filedBy || '–'}</td>
                        <td>
                          <span className="amount-cell">
                            {formatCurrency(claim.amountClaimed)}
                          </span>
                        </td>
                        <td>{formatDateTime(claim.filedAt)}</td>
                        <td>
                          <span className={`status-badge ${statusCfg.cls}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <select
                              className="status-update-select"
                              value={currentPending}
                              onChange={(e) =>
                                handleStatusChange(claim.claimID, e.target.value)
                              }
                            >
                              {Object.entries(CLAIM_STATUS_CONFIG).map(
                                ([key, cfg]) => (
                                  <option key={key} value={key}>
                                    {cfg.label}
                                  </option>
                                )
                              )}
                            </select>
                            <button
                              className="btn-view"
                              onClick={() => applyStatusUpdate(claim)}
                              disabled={currentPending === claim.status}
                            >
                              Apply
                            </button>
                            {msg && (
                              <span
                                className={
                                  msg.includes('failed') || msg.includes('Failed')
                                    ? 'update-msg-error'
                                    : 'update-msg'
                                }
                                style={{ fontSize: 12 }}
                              >
                                {msg}
                              </span>
                            )}
                          </div>
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

      {/* ── File Claim Slide-in Panel ── */}
      {showForm && (
        <div
          className="claim-form-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <div className="claim-form-panel">
            <h2>📋 File a Claim</h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Link this claim to an existing exception by its numeric ID.
            </p>

            <form onSubmit={handleFormSubmit} noValidate className="form-section">

              <div className="form-field">
                <label>
                  Exception ID <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="exceptionId"
                  placeholder="e.g. 7"
                  value={formFields.exceptionId}
                  onChange={handleFormChange}
                  className={formErrors.exceptionId ? 'input-error' : ''}
                  min="1"
                />
                {formErrors.exceptionId && (
                  <span className="error-msg">{formErrors.exceptionId}</span>
                )}
              </div>

              <div className="form-field">
                <label>
                  Filed By <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="filedBy"
                  placeholder="Full name or employee ID"
                  value={formFields.filedBy}
                  onChange={handleFormChange}
                  className={formErrors.filedBy ? 'input-error' : ''}
                />
                {formErrors.filedBy && (
                  <span className="error-msg">{formErrors.filedBy}</span>
                )}
              </div>

              <div className="form-field">
                <label>
                  Amount Claimed (₹) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="amountClaimed"
                  placeholder="e.g. 50000"
                  value={formFields.amountClaimed}
                  onChange={handleFormChange}
                  className={formErrors.amountClaimed ? 'input-error' : ''}
                  min="0.01"
                  step="0.01"
                />
                {formErrors.amountClaimed && (
                  <span className="error-msg">{formErrors.amountClaimed}</span>
                )}
              </div>

              <div className="form-field">
                <label>Resolution Notes</label>
                <textarea
                  name="resolutionNotes"
                  rows={3}
                  placeholder="Optional — describe basis for this claim or any supporting details…"
                  value={formFields.resolutionNotes}
                  onChange={handleFormChange}
                />
              </div>

              {formApiError && (
                <div className="error-banner">
                  <span>⚠️ {formApiError}</span>
                </div>
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
                  {saving ? 'Filing…' : '📋 File Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
