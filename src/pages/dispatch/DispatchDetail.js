import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthContext } from '../../auth/AuthContext';
import {
  getDispatchById,
  updateDispatch,
  getAcknowledgementByDispatch,
  createAcknowledgement,
  getAllDrivers,
  getDriverById,
} from '../../api/dispatchApi';
import { DISPATCH_STATUS_CONFIG, DRIVER_STATUS_CONFIG, VEHICLE_TYPE_CONFIG } from '../../utils/constants';
import '../../styles/Bookings.css';
import '../../styles/DispatchManifests.css';

// ── Formatters ────────────────────────────────────────────────────────────────

function formatDispatchId(id) {
  return `DS${String(id).padStart(4, '0')}`;
}
function formatLoadId(id) {
  return id ? `LD${String(id).padStart(4, '0')}` : '–';
}
function formatDateTime(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function formatDate(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Ack form validation ───────────────────────────────────────────────────────

function validateAckForm(fields) {
  const errors = {};
  if (!fields.driverID) errors.driverID = 'Select a driver.';
  return errors;
}

const EMPTY_ACK = { driverID: '', notes: '' };

// ── Component ─────────────────────────────────────────────────────────────────

export default function DispatchDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isDriver     = user?.role === 'Driver';
  const isDispatcher = !isDriver;

  const [item, setItem]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Status update
  const [newStatus, setNewStatus]       = useState('');
  const [newDriver, setNewDriver]       = useState('');
  const [newAssignedBy, setNewAssignedBy] = useState('');
  const [statusMsg, setStatusMsg]       = useState('');
  const [statusMsgError, setStatusMsgError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [drivers, setDrivers]           = useState([]);
  const [assignedDriver, setAssignedDriver] = useState(null);

  // Acknowledgement
  const [ackList, setAckList]       = useState([]);
  const [ackLoading, setAckLoading] = useState(false);
  const [showAckForm, setShowAckForm] = useState(false);
  const [ackFields, setAckFields]   = useState(EMPTY_ACK);
  const [ackErrors, setAckErrors]   = useState({});
  const [ackSaving, setAckSaving]   = useState(false);
  const [ackApiError, setAckApiError] = useState('');

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadDispatch = useCallback(() => {
    setLoading(true);
    setError('');
    getDispatchById(id)
      .then((data) => {
        setItem(data);
        setNewStatus(data.dispatch?.status || '');
        setNewDriver(String(data.dispatch?.assignedDriverID || ''));
        setNewAssignedBy(data.dispatch?.assignedBy || '');
        // Fetch the assigned driver directly so it shows even if FleetService is down
        if (data.dispatch?.assignedDriverID) {
          getDriverById(data.dispatch.assignedDriverID)
            .then(setAssignedDriver)
            .catch(() => setAssignedDriver(null));
        } else {
          setAssignedDriver(null);
        }
      })
      .catch(() => setError('Dispatch not found or service unavailable.'))
      .finally(() => setLoading(false));
  }, [id]);

  const loadAck = useCallback(() => {
    setAckLoading(true);
    getAcknowledgementByDispatch(id)
      .then((data) => {
        if (Array.isArray(data)) setAckList(data);
        else if (data && data.ackID != null) setAckList([data]);
        else setAckList([]);
      })
      .catch(() => setAckList([]))
      .finally(() => setAckLoading(false));
  }, [id]);

  useEffect(() => {
    loadDispatch();
    loadAck();
    getAllDrivers().then(setDrivers).catch(() => {});
  }, [loadDispatch, loadAck]);

  // ── Status / driver update ────────────────────────────────────────────────

  const handleStatusUpdate = () => {
    const d = item?.dispatch || {};
    setStatusMsg('');
    setStatusMsgError('');
    setUpdatingStatus(true);

    const payload = {
      loadID:           d.loadID,
      assignedDriverID: Number(newDriver) || d.assignedDriverID,
      assignedBy:       d.assignedBy,
      status:           newStatus,
    };

    updateDispatch(id, payload)
      .then(() => {
        setStatusMsg('Dispatch updated successfully.');
        loadDispatch();
      })
      .catch(() => setStatusMsgError('Update failed. Please try again.'))
      .finally(() => setUpdatingStatus(false));
  };

  // ── Acknowledgement form ──────────────────────────────────────────────────

  const handleAckChange = (e) => {
    const { name, value } = e.target;
    setAckFields((prev) => ({ ...prev, [name]: value }));
    if (ackErrors[name]) setAckErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleAckSubmit = (e) => {
    e.preventDefault();
    setAckApiError('');
    const validationErrors = validateAckForm(ackFields);
    if (Object.keys(validationErrors).length > 0) {
      setAckErrors(validationErrors);
      return;
    }

    // Enforce: only the assigned driver can acknowledge
    if (Number(ackFields.driverID) !== Number(d.assignedDriverID)) {
      setAckErrors({ driverID: 'Only the assigned driver can acknowledge this dispatch.' });
      return;
    }

    const payload = {
      dispatchID: Number(id),
      driverID:   Number(ackFields.driverID),
      notes:      ackFields.notes.trim() || null,
    };

    setAckSaving(true);
    createAcknowledgement(payload)
      .then(() => {
        setShowAckForm(false);
        setAckFields(EMPTY_ACK);
        setAckErrors({});
        loadAck();
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data || 'Failed to record acknowledgement.';
        setAckApiError(String(msg));
      })
      .finally(() => setAckSaving(false));
  };

  // ── Loading / error ───────────────────────────────────────────────────────

  if (loading) {
    return <Layout><div className="loading-spinner">Loading dispatch…</div></Layout>;
  }

  if (error || !item) {
    return (
      <Layout>
        <div className="auth-message auth-message-error">
          ⚠ {error || 'Dispatch not found.'}
          <button className="btn-secondary" onClick={() => navigate('/dispatch')} style={{ marginLeft: 12 }}>
            ← Back
          </button>
        </div>
      </Layout>
    );
  }

  const d  = item.dispatch || {};
  const l  = item.load     || {};
  const v  = item.vehicle  || {};
  // Use directly-fetched driver; fall back to vehicle.driver if available
  const dr = assignedDriver || v.driver || {};
  const st = DISPATCH_STATUS_CONFIG[d.status] || { label: d.status, cls: '' };
  const drSt = DRIVER_STATUS_CONFIG[dr.status] || { label: dr.status, cls: '' };
  const vtCfg = VEHICLE_TYPE_CONFIG[v.type]    || { label: v.type || '–' };
  const latestAck = ackList.length > 0 ? ackList[ackList.length - 1] : null;
  const isAcked   = latestAck != null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="bookings-page booking-detail-page dispatch-page">

        {/* ── Header ── */}
        <div className="detail-header">
          <div className="detail-header-left">
            <button className="back-btn" onClick={() => navigate('/dispatch')} title="Back">
              ←
            </button>
            <span className="detail-booking-id">{formatDispatchId(d.dispatchID)}</span>
            <span className={`status-badge status-badge-lg ${st.cls}`}>{st.label}</span>
          </div>
          {isDriver && (
            <button
              className="btn-primary"
              disabled={isAcked}
              title={isAcked ? 'Acknowledgement already recorded' : ''}
              onClick={() => {
                if (isAcked) return;
                setShowAckForm(true);
                setAckApiError('');
                setAckErrors({});
                setAckSaving(false);
                // Pre-fill with the currently assigned driver
                setAckFields({ driverID: String(d.assignedDriverID || ''), notes: '' });
              }}
            >
              {isAcked ? '✔ Acknowledged' : '✔ Record Acknowledgement'}
            </button>
          )}
        </div>

        {/* ── Detail Grid ── */}
        <div className="detail-grid">

          {/* Dispatch Info */}
          <div className="detail-card">
            <p className="detail-card-title">Dispatch Details</p>
            <div className="detail-row-2">
              <div className="detail-field">
                <span className="detail-label">Dispatch ID</span>
                <span className="detail-value">{formatDispatchId(d.dispatchID)}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Load ID</span>
                <span className="detail-value">{formatLoadId(d.loadID)}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Assigned By</span>
                <span className="detail-value">{d.assignedBy || '–'}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Assigned At</span>
                <span className="detail-value">{formatDateTime(d.assignedAt)}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  <span className={`status-badge ${st.cls}`}>{st.label}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Load Info */}
          <div className="detail-card">
            <p className="detail-card-title">Load Information</p>
            {l.loadID ? (
              <div className="detail-row-2">
                <div className="detail-field">
                  <span className="detail-label">Load Code</span>
                  <span className="detail-value">{l.loadCode || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">{l.status || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Planned Start</span>
                  <span className="detail-value">{formatDateTime(l.plannedStart)}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Planned End</span>
                  <span className="detail-value">{formatDateTime(l.plannedEnd)}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Weight / Volume</span>
                  <span className="detail-value">
                    {l.totalWeightKg != null ? `${l.totalWeightKg} kg` : '–'}
                    {l.totalVolumeM3 != null ? ` · ${l.totalVolumeM3} m³` : ''}
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>No load data available.</p>
            )}
          </div>

          {/* Vehicle Info */}
          <div className="detail-card">
            <p className="detail-card-title">Vehicle</p>
            {v.vehicleID ? (
              <div className="detail-row-2">
                <div className="detail-field">
                  <span className="detail-label">Reg Number</span>
                  <span className="detail-value">{v.regNumber || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">{vtCfg.label}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Max Capacity</span>
                  <span className="detail-value">
                    {v.maxWeightKg != null ? `${v.maxWeightKg} kg` : '–'}
                    {v.maxVolumeM3 != null ? ` · ${v.maxVolumeM3} m³` : ''}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Vehicle Status</span>
                  <span className="detail-value">{v.status || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Last Maintenance</span>
                  <span className="detail-value">{formatDate(v.lastMaintenanceAt)}</span>
                </div>
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>No vehicle data available.</p>
            )}
          </div>

          {/* Driver Info */}
          <div className="detail-card">
            <p className="detail-card-title">Assigned Driver</p>
            {dr.driverID ? (
              <div className="detail-row-2">
                <div className="detail-field">
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{dr.name || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">License No</span>
                  <span className="detail-value">{dr.licenseNo || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Mobile</span>
                  <span className="detail-value">{dr.mobileNumber || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Contact</span>
                  <span className="detail-value">{dr.contactInfo || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Driver Status</span>
                  <span className="detail-value">
                    <span className={`status-badge ${drSt.cls}`}>{drSt.label}</span>
                  </span>
                </div>
              </div>
            ) : d.assignedDriverID ? (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading driver details…</p>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>No driver assigned.</p>
            )}
          </div>

          {/* Acknowledgement — full width */}
          <div className="detail-card detail-card-wide">
            <p className="detail-card-title">
              Driver Acknowledgement
            </p>

            {ackLoading && (
              <div className="loading-spinner" style={{ padding: '10px 0' }}>
                Loading acknowledgement…
              </div>
            )}

            {!ackLoading && !isAcked && (
              <div className="ack-awaiting-banner">
                <div className="ack-awaiting-title">⏳ Awaiting Acknowledgement</div>
                <div className="ack-awaiting-sub">
                  The assigned driver has not yet acknowledged this dispatch.
                  Click "Record Acknowledgement" to capture acceptance.
                </div>
              </div>
            )}

            {!ackLoading && isAcked && (
              <div className="detail-row-3">
                <div className="detail-field">
                  <span className="detail-label">Ack ID</span>
                  <span className="detail-value">ACK{String(latestAck.ackID).padStart(4, '0')}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Driver</span>
                  <span className="detail-value">{latestAck.driver?.name || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Acknowledged At</span>
                  <span className="detail-value" style={{ fontWeight: 600, color: '#16a34a' }}>
                    ✔ {formatDateTime(latestAck.ackAt)}
                  </span>
                </div>
                {latestAck.notes && (
                  <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="detail-label">Notes</span>
                    <span className="detail-value">{latestAck.notes}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Update Bar — Dispatcher only ── */}
        {isDispatcher && <div className="status-update-bar">
          <span className="status-update-label">Status:</span>
          <select
            className="status-update-select"
            value={newStatus}
            onChange={(e) => { setNewStatus(e.target.value); setStatusMsg(''); setStatusMsgError(''); }}
          >
            {Object.entries(DISPATCH_STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <span className="status-update-label">Driver:</span>
          <select
            className="status-update-select"
            value={newDriver}
            onChange={(e) => { setNewDriver(e.target.value); setStatusMsg(''); setStatusMsgError(''); }}
          >
            <option value="">— same driver —</option>
            {drivers.map((dr) => (
              <option key={dr.driverID} value={dr.driverID}>
                {dr.name} ({dr.status})
              </option>
            ))}
          </select>

          <button
            className="btn-primary"
            onClick={handleStatusUpdate}
            disabled={updatingStatus}
          >
            {updatingStatus ? 'Saving…' : 'Apply'}
          </button>
          {statusMsg      && <span className="update-msg">{statusMsg}</span>}
          {statusMsgError && <span className="update-msg-error">{statusMsgError}</span>}
        </div>}

        {/* ── Record Ack Slide-in Panel ── */}
        {showAckForm && (
          <div
            className="claim-form-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAckForm(false); }}
          >
            <div className="claim-form-panel">
              <h2>✔ Record Acknowledgement</h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Dispatch <strong>{formatDispatchId(d.dispatchID)}</strong>
                {' · '}The assigned driver confirms acceptance of this dispatch.
              </p>

              <form onSubmit={handleAckSubmit} noValidate className="form-section">
                <div className="form-field">
                  <label>Acknowledging Driver <span className="required">*</span></label>
                  <select
                    name="driverID"
                    value={ackFields.driverID}
                    onChange={handleAckChange}
                    className={ackErrors.driverID ? 'input-error' : ''}
                  >
                    {/* Only the assigned driver can acknowledge */}
                    {drivers
                      .filter((dr) => dr.driverID === d.assignedDriverID)
                      .map((dr) => (
                        <option key={dr.driverID} value={dr.driverID}>
                          {dr.name} — {dr.licenseNo} ✔ Assigned Driver
                        </option>
                      ))}
                    {drivers.filter((dr) => dr.driverID === d.assignedDriverID).length === 0 && (
                      <option value="" disabled>No assigned driver on this dispatch</option>
                    )}
                  </select>
                  {ackErrors.driverID && <span className="error-msg">{ackErrors.driverID}</span>}
                  <span className="ack-lock-notice">
                    Only the assigned driver may acknowledge this dispatch.
                  </span>
                </div>

                <div className="form-field">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    rows={3}
                    maxLength={300}
                    placeholder="Optional — driver comments or remarks on acceptance…"
                    value={ackFields.notes}
                    onChange={handleAckChange}
                  />
                  <span className="field-hint" style={{ color: ackFields.notes.length >= 280 ? '#ef4444' : '#94a3b8' }}>
                    {ackFields.notes.length}/300 characters
                  </span>
                </div>

                {ackApiError && (
                  <div className="auth-message auth-message-error">⚠ {ackApiError}</div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAckForm(false)}
                    disabled={ackSaving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={ackSaving}>
                    {ackSaving ? 'Saving…' : '✔ Record'}
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
