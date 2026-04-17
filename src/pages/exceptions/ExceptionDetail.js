import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  getExceptionById,
  updateExceptionStatus,
  getClaimsByException,
  createClaim,
} from '../../api/exceptionsApi';
import {
  EXCEPTION_TYPE_CONFIG,
  EXCEPTION_STATUS_CONFIG,
  CLAIM_STATUS_CONFIG,
  siteName,
} from '../../utils/constants';
import '../../styles/Bookings.css';
import '../../styles/Exceptions.css';

// ── Formatters ───────────────────────────────────────────────────────────────

function formatExceptionId(id) {
  return `EX${String(id).padStart(4, '0')}`;
}

function formatBookingId(id) {
  return id ? `BK${String(id).padStart(4, '0')}` : '–';
}

function formatClaimId(id) {
  return `CL${String(id).padStart(4, '0')}`;
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

function formatDate(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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
  if (!fields.filedBy.trim()) errors.filedBy = 'Filer name is required.';
  if (!fields.amountClaimed || isNaN(Number(fields.amountClaimed)) || Number(fields.amountClaimed) <= 0) {
    errors.amountClaimed = 'Enter a valid claim amount (greater than 0).';
  }
  return errors;
}

// ── Component ────────────────────────────────────────────────────────────────

const EMPTY_CLAIM = { filedBy: '', amountClaimed: '', resolutionNotes: '' };

export default function ExceptionDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  // Exception + booking
  const [item, setItem]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Status update
  const [newStatus, setNewStatus]         = useState('');
  const [statusMsg, setStatusMsg]         = useState('');
  const [statusMsgError, setStatusMsgError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Claims
  const [claims, setClaims]         = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);

  // File claim panel
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimFields, setClaimFields]     = useState(EMPTY_CLAIM);
  const [claimErrors, setClaimErrors]     = useState({});
  const [claimSaving, setClaimSaving]     = useState(false);
  const [claimApiError, setClaimApiError] = useState('');

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadException = useCallback(() => {
    setLoading(true);
    setError('');
    getExceptionById(id)
      .then((data) => {
        setItem(data);
        setNewStatus(data.exceptiondto?.status || '');
      })
      .catch(() => setError('Exception not found or service unavailable.'))
      .finally(() => setLoading(false));
  }, [id]);

  const loadClaims = useCallback(() => {
    setClaimsLoading(true);
    getClaimsByException(id)
      .then(setClaims)
      .catch(() => {})
      .finally(() => setClaimsLoading(false));
  }, [id]);

  useEffect(() => {
    loadException();
    loadClaims();
  }, [loadException, loadClaims]);

  // ── Status update ─────────────────────────────────────────────────────────

  const handleStatusUpdate = () => {
    const currentStatus = item?.exceptiondto?.status;
    if (!newStatus || newStatus === currentStatus) return;

    setStatusMsg('');
    setStatusMsgError('');
    setUpdatingStatus(true);

    updateExceptionStatus(id, newStatus)
      .then(() => {
        setStatusMsg(`Status updated to ${EXCEPTION_STATUS_CONFIG[newStatus]?.label || newStatus}.`);
        loadException();
      })
      .catch(() => {
        setStatusMsgError('Failed to update status. Please try again.');
        setNewStatus(currentStatus);
      })
      .finally(() => setUpdatingStatus(false));
  };

  // ── File claim ────────────────────────────────────────────────────────────

  const handleClaimChange = (e) => {
    const { name, value } = e.target;
    setClaimFields((prev) => ({ ...prev, [name]: value }));
    if (claimErrors[name]) setClaimErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    setClaimApiError('');
    const validationErrors = validateClaimForm(claimFields);
    if (Object.keys(validationErrors).length > 0) {
      setClaimErrors(validationErrors);
      return;
    }

    const payload = {
      filedBy:         claimFields.filedBy.trim(),
      amountClaimed:   Number(claimFields.amountClaimed),
      resolutionNotes: claimFields.resolutionNotes.trim() || null,
      exceptionID:     Number(id),
    };

    setClaimSaving(true);
    createClaim(payload)
      .then(() => {
        setShowClaimForm(false);
        setClaimFields(EMPTY_CLAIM);
        setClaimErrors({});
        loadClaims();
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data ||
          'Failed to file claim.';
        setClaimApiError(String(msg));
        setClaimSaving(false);
      });
  };

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">Loading exception…</div>
      </Layout>
    );
  }

  if (error || !item) {
    return (
      <Layout>
        <div className="error-banner">
          <span>⚠️ {error || 'Exception not found.'}</span>
          <button onClick={() => navigate('/exceptions')}>← Back</button>
        </div>
      </Layout>
    );
  }

  const ex = item.exceptiondto || {};
  const bk = item.bookingdto   || {};

  const typeCfg   = EXCEPTION_TYPE_CONFIG[ex.type]     || { label: ex.type,   cls: '', icon: '⚠️' };
  const statusCfg = EXCEPTION_STATUS_CONFIG[ex.status] || { label: ex.status, cls: '' };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="bookings-page exception-detail-page">

        {/* ── Header ── */}
        <div className="detail-header">
          <div className="detail-header-left">
            <button
              className="btn-secondary"
              onClick={() => navigate('/exceptions')}
            >
              ← Back
            </button>
            <div>
              <span className="detail-booking-id">
                {formatExceptionId(ex.exceptionID)}
              </span>
            </div>
            <span className={`status-badge ${typeCfg.cls}`}>
              {typeCfg.label}
            </span>
            <span className={`status-badge ${statusCfg.cls}`}>
              {statusCfg.label}
            </span>
          </div>

          <button
            className="btn-primary"
            onClick={() => {
              setShowClaimForm(true);
              setClaimApiError('');
              setClaimErrors({});
              setClaimFields(EMPTY_CLAIM);
            }}
          >
            📋 File Claim
          </button>
        </div>

        {/* ── Status Update Bar ── */}
        <div className="status-update-bar">
          <span className="status-update-label">Update Status:</span>
          <select
            className="status-update-select"
            value={newStatus}
            onChange={(e) => {
              setNewStatus(e.target.value);
              setStatusMsg('');
              setStatusMsgError('');
            }}
          >
            {Object.entries(EXCEPTION_STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
          <button
            className="btn-primary"
            onClick={handleStatusUpdate}
            disabled={updatingStatus || newStatus === ex.status}
          >
            {updatingStatus ? 'Updating…' : 'Apply'}
          </button>
          {statusMsg      && <span className="update-msg">{statusMsg}</span>}
          {statusMsgError && <span className="update-msg-error">{statusMsgError}</span>}
        </div>

        {/* ── Detail Cards Grid ── */}
        <div className="detail-grid">

          {/* Exception Info */}
          <div className="detail-card">
            <p className="detail-card-title">Exception Details</p>
            <div className="detail-row-2">
              <div className="detail-field">
                <span className="detail-label">Exception ID</span>
                <span className="detail-value">
                  {formatExceptionId(ex.exceptionID)}
                </span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Type</span>
                <span className="detail-value">
                  <span className={`status-badge ${typeCfg.cls}`}>
                    {typeCfg.label}
                  </span>
                </span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Reported By</span>
                <span className="detail-value">{ex.reportedBy || '–'}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Reported At</span>
                <span className="detail-value">{formatDateTime(ex.reportedAt)}</span>
              </div>
              {ex.updatedAt && (
                <div className="detail-field">
                  <span className="detail-label">Last Updated</span>
                  <span className="detail-value">{formatDateTime(ex.updatedAt)}</span>
                </div>
              )}
              <div className="detail-field">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  <span className={`status-badge ${statusCfg.cls}`}>
                    {statusCfg.label}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Booking Info */}
          <div className="detail-card">
            <p className="detail-card-title">Linked Booking</p>
            {bk.bookingID ? (
              <div className="detail-row-2">
                <div className="detail-field">
                  <span className="detail-label">Booking ID</span>
                  <span className="detail-value">{formatBookingId(bk.bookingID)}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">{bk.status || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Origin</span>
                  <span className="detail-value">{siteName(bk.originSiteID)}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Destination</span>
                  <span className="detail-value">{siteName(bk.destinationSiteID)}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Commodity</span>
                  <span className="detail-value">{bk.commodity || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Weight / Volume</span>
                  <span className="detail-value">
                    {bk.weightKg != null ? `${bk.weightKg} kg` : '–'}
                    {bk.volumeM3 != null ? ` · ${bk.volumeM3} m³` : ''}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Pickup Window</span>
                  <span className="detail-value">
                    {formatDate(bk.pickupWindowStart)} – {formatDate(bk.pickupWindowEnd)}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Delivery Window</span>
                  <span className="detail-value">
                    {formatDate(bk.deliveryWindowStart)} – {formatDate(bk.deliveryWindowEnd)}
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>No booking data available.</p>
            )}
          </div>

          {/* Description — full width */}
          <div className="detail-card detail-card-wide">
            <p className="detail-card-title">Incident Description</p>
            <p className="detail-notes">{ex.description || '–'}</p>
          </div>

          {/* Claims — full width */}
          <div className="detail-card detail-card-wide">
            <p className="detail-card-title">
              Filed Claims
              {claims.length > 0 && (
                <span style={{ marginLeft: 8, fontWeight: 400, color: '#94a3b8' }}>
                  ({claims.length})
                </span>
              )}
            </p>

            {claimsLoading && (
              <div className="loading-spinner" style={{ padding: '10px 0' }}>
                Loading claims…
              </div>
            )}

            {!claimsLoading && claims.length === 0 && (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-text">No claims filed yet</div>
                <div className="empty-sub">
                  Click "File Claim" above to submit a claim for this exception.
                </div>
              </div>
            )}

            {!claimsLoading && claims.length > 0 && (
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Filed By</th>
                    <th>Filed At</th>
                    <th>Amount Claimed</th>
                    <th>Resolution Notes</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => {
                    const claimStatusCfg =
                      CLAIM_STATUS_CONFIG[claim.status] || { label: claim.status, cls: '' };
                    return (
                      <tr key={claim.claimID}>
                        <td>
                          <span className="booking-id-cell">
                            {formatClaimId(claim.claimID)}
                          </span>
                        </td>
                        <td>{claim.filedBy || '–'}</td>
                        <td>{formatDateTime(claim.filedAt)}</td>
                        <td>
                          <span className="amount-cell">
                            {formatCurrency(claim.amountClaimed)}
                          </span>
                        </td>
                        <td>
                          <span className="desc-cell" title={claim.resolutionNotes}>
                            {claim.resolutionNotes || '–'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${claimStatusCfg.cls}`}>
                            {claimStatusCfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── File Claim Slide-in Panel ── */}
        {showClaimForm && (
          <div
            className="claim-form-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowClaimForm(false);
            }}
          >
            <div className="claim-form-panel">
              <h2>📋 File a Claim</h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Linked to exception{' '}
                <strong>{formatExceptionId(ex.exceptionID)}</strong> —{' '}
                {formatBookingId(ex.bookingId)}
              </p>

              <form
                onSubmit={handleClaimSubmit}
                noValidate
                className="form-section"
              >
                <div className="form-field">
                  <label>
                    Filed By <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="filedBy"
                    placeholder="Full name or employee ID"
                    value={claimFields.filedBy}
                    onChange={handleClaimChange}
                    className={claimErrors.filedBy ? 'input-error' : ''}
                  />
                  {claimErrors.filedBy && (
                    <span className="error-msg">{claimErrors.filedBy}</span>
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
                    value={claimFields.amountClaimed}
                    onChange={handleClaimChange}
                    className={claimErrors.amountClaimed ? 'input-error' : ''}
                    min="0.01"
                    step="0.01"
                  />
                  {claimErrors.amountClaimed && (
                    <span className="error-msg">{claimErrors.amountClaimed}</span>
                  )}
                </div>

                <div className="form-field">
                  <label>Resolution Notes</label>
                  <textarea
                    name="resolutionNotes"
                    rows={3}
                    placeholder="Optional — describe the basis for this claim or any supporting details…"
                    value={claimFields.resolutionNotes}
                    onChange={handleClaimChange}
                  />
                </div>

                {claimApiError && (
                  <div className="error-banner">
                    <span>⚠️ {claimApiError}</span>
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowClaimForm(false)}
                    disabled={claimSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={claimSaving}
                  >
                    {claimSaving ? 'Filing…' : '📋 File Claim'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
