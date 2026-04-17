import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  getManifestById,
  updateManifest,
  getHandoverByManifest,
  createHandover,
  updateHandover,
} from '../../api/manifestApi';
import { SITES } from '../../utils/constants';
import '../../styles/Bookings.css';

// ── Formatters ────────────────────────────────────────────────────────────────
function formatManifestId(id) { return `MF${String(id).padStart(4, '0')}`; }
function formatLoadId(id)     { return id ? `LD${String(id).padStart(4, '0')}` : '–'; }
function formatDateTime(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
function siteLabel(id) {
  const s = SITES.find((x) => x.id === Number(id));
  return s ? `${s.name} (${id})` : id ? String(id) : '–';
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateHandover(f) {
  const errors = {};
  if (!f.handedBy.trim())   errors.handedBy   = 'Handed By is required.';
  if (!f.receivedBy.trim()) errors.receivedBy  = 'Received By is required.';
  return errors;
}
const EMPTY_HANDOVER = { handedBy: '', receivedBy: '', notes: '' };

export default function ManifestDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [item, setItem]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Update bar
  const [editCreatedBy, setEditCreatedBy]   = useState('');
  const [editURI, setEditURI]               = useState('');
  const [editItemsJSON, setEditItemsJSON]   = useState('');
  const [updateMsg, setUpdateMsg]           = useState('');
  const [updateErr, setUpdateErr]           = useState('');
  const [updating, setUpdating]             = useState(false);

  // Handover
  const [handover, setHandover]             = useState(null);
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [showHandoverForm, setShowHandoverForm] = useState(false);
  const [editingHandoverId, setEditingHandoverId] = useState(null);
  const [handoverFields, setHandoverFields] = useState(EMPTY_HANDOVER);
  const [handoverErrors, setHandoverErrors] = useState({});
  const [handoverSaving, setHandoverSaving] = useState(false);
  const [handoverApiError, setHandoverApiError] = useState('');

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadManifest = useCallback(() => {
    setLoading(true);
    setError('');
    getManifestById(id)
      .then((data) => {
        setItem(data);
        const mf = data.manifest || {};
        setEditCreatedBy(mf.createdBy || '');
        setEditURI(mf.manifestURI || '');
        setEditItemsJSON(mf.itemsJSON || '');
      })
      .catch(() => setError('Manifest not found or ManifestService unavailable.'))
      .finally(() => setLoading(false));
  }, [id]);

  const loadHandover = useCallback(() => {
    setHandoverLoading(true);
    getHandoverByManifest(id)
      .then(setHandover)
      .catch(() => setHandover(null))
      .finally(() => setHandoverLoading(false));
  }, [id]);

  useEffect(() => { loadManifest(); loadHandover(); }, [loadManifest, loadHandover]);

  // ── Update ────────────────────────────────────────────────────────────────

  const handleUpdate = () => {
    const mf = item?.manifest || {};
    setUpdateMsg(''); setUpdateErr('');
    setUpdating(true);
    updateManifest(id, {
      loadID:      mf.loadID,
      warehouseID: mf.warehouseID,
      createdBy:   editCreatedBy.trim() || mf.createdBy,
      manifestURI: editURI.trim() || null,
      itemsJSON:   editItemsJSON.trim() || null,
    })
      .then(() => { setUpdateMsg('Manifest updated.'); loadManifest(); })
      .catch(() => setUpdateErr('Update failed.'))
      .finally(() => setUpdating(false));
  };

  // ── Handover form ─────────────────────────────────────────────────────────

  const openHandoverForm = (existing) => {
    if (existing) {
      setEditingHandoverId(existing.handover?.handoverID);
      setHandoverFields({
        handedBy:   existing.handover?.handedBy   || '',
        receivedBy: existing.handover?.receivedBy || '',
        notes:      existing.handover?.notes      || '',
      });
    } else {
      setEditingHandoverId(null);
      setHandoverFields(EMPTY_HANDOVER);
    }
    setHandoverErrors({});
    setHandoverApiError('');
    setShowHandoverForm(true);
  };

  const handleHandoverChange = (e) => {
    const { name, value } = e.target;
    setHandoverFields((prev) => ({ ...prev, [name]: value }));
    if (handoverErrors[name]) setHandoverErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleHandoverSubmit = (e) => {
    e.preventDefault();
    setHandoverApiError('');
    const errs = validateHandover(handoverFields);
    if (Object.keys(errs).length > 0) { setHandoverErrors(errs); return; }

    const payload = {
      manifestID: Number(id),
      handedBy:   handoverFields.handedBy.trim(),
      receivedBy: handoverFields.receivedBy.trim(),
      notes:      handoverFields.notes.trim() || null,
    };

    setHandoverSaving(true);
    const call = editingHandoverId
      ? updateHandover(editingHandoverId, payload)
      : createHandover(payload);

    call
      .then(() => { setShowHandoverForm(false); loadHandover(); })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data || 'Failed to save handover.';
        setHandoverApiError(String(msg));
        setHandoverSaving(false);
      });
  };

  // ── Guard renders ─────────────────────────────────────────────────────────

  if (loading) return <Layout><div className="loading-spinner">Loading manifest…</div></Layout>;
  if (error || !item) {
    return (
      <Layout>
        <div className="auth-message auth-message-error">
          ⚠ {error || 'Manifest not found.'}
          <button className="btn-secondary" onClick={() => navigate('/manifests')} style={{ marginLeft: 12 }}>← Back</button>
        </div>
      </Layout>
    );
  }

  const mf = item.manifest || {};
  const ld = item.load     || {};
  const v  = item.vehicle  || {};

  return (
    <Layout>
      <div className="booking-detail-page">

        {/* ── Header ── */}
        <div className="detail-header">
          <div className="detail-header-left">
            <button className="back-btn" onClick={() => navigate('/manifests')}>←</button>
            <div>
              <div className="detail-booking-id">{formatManifestId(mf.manifestID)}</div>
              <div className="page-subtitle">Manifest — Detail View</div>
            </div>
          </div>
          <button className="btn-primary" onClick={() => openHandoverForm(handover)}>
            📦 {handover ? 'Edit Handover' : 'Record Handover'}
          </button>
        </div>

        {/* ── Update Bar ── */}
        <div className="status-update-bar">
          <span className="status-update-label">Created By:</span>
          <input
            className="status-update-select"
            style={{ minWidth: 160 }}
            value={editCreatedBy}
            onChange={(e) => { setEditCreatedBy(e.target.value); setUpdateMsg(''); setUpdateErr(''); }}
            placeholder="Your name"
          />
          <span className="status-update-label">Manifest URI:</span>
          <input
            className="status-update-select"
            style={{ minWidth: 220 }}
            value={editURI}
            onChange={(e) => { setEditURI(e.target.value); setUpdateMsg(''); setUpdateErr(''); }}
            placeholder="https://…"
          />
          <button className="btn-primary" onClick={handleUpdate} disabled={updating}>
            {updating ? 'Saving…' : 'Apply'}
          </button>
          {updateMsg && <span className="update-msg">{updateMsg}</span>}
          {updateErr && <span className="update-msg-error">{updateErr}</span>}
        </div>

        {/* ── Detail Grid ── */}
        <div className="detail-grid">

          {/* Manifest Info */}
          <div className="detail-card">
            <p className="detail-card-title">📋 Manifest Details</p>
            <div className="detail-row-2">
              <div className="detail-field">
                <span className="detail-label">Manifest ID</span>
                <span className="detail-value">{formatManifestId(mf.manifestID)}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Load ID</span>
                <span className="detail-value">{formatLoadId(mf.loadID)}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Warehouse</span>
                <span className="detail-value">{siteLabel(mf.warehouseID)}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Created By</span>
                <span className="detail-value">{mf.createdBy || '–'}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Created At</span>
                <span className="detail-value">{formatDateTime(mf.createdAt)}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Manifest URI</span>
                <span className="detail-value">
                  {mf.manifestURI
                    ? <a href={mf.manifestURI} target="_blank" rel="noreferrer">View Document</a>
                    : '–'}
                </span>
              </div>
            </div>
            {mf.itemsJSON && (
              <div className="detail-field" style={{ marginTop: 12 }}>
                <span className="detail-label">Items JSON</span>
                <pre style={{ fontSize: 12, background: '#f8fafc', padding: 10, borderRadius: 6, overflowX: 'auto', marginTop: 4 }}>
                  {mf.itemsJSON}
                </pre>
              </div>
            )}
          </div>

          {/* Load Info */}
          <div className="detail-card">
            <p className="detail-card-title">🚛 Load Information</p>
            {ld.loadID ? (
              <div className="detail-row-2">
                <div className="detail-field">
                  <span className="detail-label">Load Code</span>
                  <span className="detail-value">{ld.loadCode || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">{ld.status || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Planned Start</span>
                  <span className="detail-value">{formatDateTime(ld.plannedStart)}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Planned End</span>
                  <span className="detail-value">{formatDateTime(ld.plannedEnd)}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Weight / Volume</span>
                  <span className="detail-value">
                    {ld.totalWeightKg != null ? `${ld.totalWeightKg} kg` : '–'}
                    {ld.totalVolumeM3 != null ? ` · ${ld.totalVolumeM3} m³` : ''}
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>No load data available.</p>
            )}
          </div>

          {/* Vehicle Info */}
          <div className="detail-card">
            <p className="detail-card-title">🚚 Vehicle</p>
            {v.vehicleID ? (
              <div className="detail-row-2">
                <div className="detail-field">
                  <span className="detail-label">Reg Number</span>
                  <span className="detail-value">{v.regNumber || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">{v.type || '–'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Max Capacity</span>
                  <span className="detail-value">
                    {v.maxWeightKg != null ? `${v.maxWeightKg} kg` : '–'}
                    {v.maxVolumeM3 != null ? ` · ${v.maxVolumeM3} m³` : ''}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">{v.status || '–'}</span>
                </div>
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>No vehicle data available.</p>
            )}
          </div>

          {/* Handover — full width */}
          <div className="detail-card detail-card-wide">
            <p className="detail-card-title">📦 Handover Record</p>

            {handoverLoading && <div className="loading-spinner" style={{ padding: '10px 0' }}>Loading handover…</div>}

            {!handoverLoading && !handover && (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-text">No handover recorded</div>
                <div className="empty-sub">Click "Record Handover" to log the transfer of this manifest.</div>
              </div>
            )}

            {!handoverLoading && handover && (() => {
              const hv = handover.handover || {};
              return (
                <div className="detail-row-3">
                  <div className="detail-field">
                    <span className="detail-label">Handover ID</span>
                    <span className="detail-value">HV{String(hv.handoverID).padStart(4, '0')}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">Handed By</span>
                    <span className="detail-value">{hv.handedBy || '–'}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">Handed At</span>
                    <span className="detail-value">{formatDateTime(hv.handedAt)}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">Received By</span>
                    <span className="detail-value">{hv.receivedBy || '–'}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">Received At</span>
                    <span className="detail-value">{formatDateTime(hv.receivedAt)}</span>
                  </div>
                  {hv.notes && (
                    <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                      <span className="detail-label">Notes</span>
                      <span className="detail-value">{hv.notes}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Handover Slide-in Panel ── */}
      {showHandoverForm && (
        <div className="claim-form-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowHandoverForm(false); }}>
          <div className="claim-form-panel">
            <h2>📦 {editingHandoverId ? 'Edit Handover' : 'Record Handover'}</h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Manifest <strong>{formatManifestId(mf.manifestID)}</strong>
            </p>

            <form onSubmit={handleHandoverSubmit} noValidate className="form-section">

              <div className="form-field">
                <label>Handed By <span className="required">*</span></label>
                <input
                  type="text"
                  name="handedBy"
                  placeholder="Name of person handing over"
                  value={handoverFields.handedBy}
                  onChange={handleHandoverChange}
                  className={handoverErrors.handedBy ? 'input-error' : ''}
                />
                {handoverErrors.handedBy && <span className="error-msg">{handoverErrors.handedBy}</span>}
              </div>

              <div className="form-field">
                <label>Received By <span className="required">*</span></label>
                <input
                  type="text"
                  name="receivedBy"
                  placeholder="Name of person receiving"
                  value={handoverFields.receivedBy}
                  onChange={handleHandoverChange}
                  className={handoverErrors.receivedBy ? 'input-error' : ''}
                />
                {handoverErrors.receivedBy && <span className="error-msg">{handoverErrors.receivedBy}</span>}
              </div>

              <div className="form-field">
                <label>Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Optional remarks about the handover…"
                  value={handoverFields.notes}
                  onChange={handleHandoverChange}
                />
              </div>

              {handoverApiError && (
                <div className="auth-message auth-message-error">⚠ {handoverApiError}</div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowHandoverForm(false)} disabled={handoverSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={handoverSaving}>
                  {handoverSaving ? 'Saving…' : editingHandoverId ? 'Save Changes' : '📦 Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
