import React, { useEffect, useState, useCallback } from 'react';
import '../../styles/Billing.css';
import {
  getAllVehicleAvailabilities, createVehicleAvailability,
  updateVehicleAvailability, deleteVehicleAvailability, getAvailabilitiesByVehicle
} from '../../api/fleetApi';
import { getAllVehicles } from '../../api/fleetApi';

const STATUS_OPTIONS = ['AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE', 'IN_USE'];
const EMPTY_FORM = { vehicleID: '', startTime: '', endTime: '', status: 'AVAILABLE' };

const statusColor = (s) => {
  switch (String(s).toUpperCase()) {
    case 'AVAILABLE':    return 'status-active';
    case 'IN_USE':       return 'status-paid';
    case 'MAINTENANCE':  return 'status-pending';
    case 'UNAVAILABLE':  return 'status-cancelled';
    default:             return 'status-draft';
  }
};

export default function VehicleAvailability() {
  const [availabilities, setAvailabilities] = useState([]);
  const [vehicles, setVehicles]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');
  const [filterVehicle, setFilterVehicle]   = useState('ALL');

  const [showModal, setShowModal]   = useState(false);
  const [editMode, setEditMode]     = useState(false);
  const [currentId, setCurrentId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [saving, setSaving]         = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget]           = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [avails, vehs] = await Promise.all([
        filterVehicle === 'ALL'
          ? getAllVehicleAvailabilities()
          : getAvailabilitiesByVehicle(filterVehicle),
        getAllVehicles()
      ]);
      setAvailabilities(Array.isArray(avails) ? avails : []);
      setVehicles(Array.isArray(vehs) ? vehs : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [filterVehicle]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };

  const openCreate = () => {
    setEditMode(false); setCurrentId(null); setForm(EMPTY_FORM);
    setFormError(''); setShowModal(true);
  };

  const openEdit = (a) => {
    setEditMode(true); setCurrentId(a.id ?? a.availabilityID);
    setForm({
      vehicleID:  String(a.vehicleID || ''),
      startTime:  a.startTime ? a.startTime.substring(0, 16) : '',
      endTime:    a.endTime   ? a.endTime.substring(0, 16)   : '',
      status:     a.status || 'AVAILABLE',
    });
    setFormError(''); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.vehicleID || !form.startTime || !form.endTime) {
      setFormError('Vehicle, start time and end time are required.'); return;
    }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      setFormError('End time must be after start time.'); return;
    }
    setSaving(true); setFormError('');
    const payload = { ...form, vehicleID: Number(form.vehicleID) };
    try {
      if (editMode) { await updateVehicleAvailability(currentId, payload); flash('Availability updated.'); }
      else          { await createVehicleAvailability(payload);            flash('Availability window created.'); }
      setShowModal(false); loadAll();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const confirmDelete = (a) => { setDeleteTarget(a); setShowDeleteConfirm(true); };
  const doDelete = async () => {
    const id = deleteTarget.id ?? deleteTarget.availabilityID;
    try {
      await deleteVehicleAvailability(id);
      flash(`Availability window deleted.`);
      setShowDeleteConfirm(false); setDeleteTarget(null); loadAll();
    } catch (e) { setError(e.message); setShowDeleteConfirm(false); }
  };

  const getVehicleReg = (id) => {
    const v = vehicles.find(v => String(v.vehicleID) === String(id));
    return v ? v.regNumber : `#${id}`;
  };

  return (
    <div className="billing-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicle Availability</h1>
          <p className="page-subtitle">Schedule and manage vehicle availability windows</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Add Window</button>
      </div>

      {error   && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="billing-stats-grid">
        <div className="stat-card"><span className="stat-label">Total Windows</span><span className="stat-value">{availabilities.length}</span></div>
        <div className="stat-card"><span className="stat-label">Available Now</span><span className="stat-value">{availabilities.filter(a => a.status === 'AVAILABLE').length}</span></div>
        <div className="stat-card"><span className="stat-label">In Use</span><span className="stat-value">{availabilities.filter(a => a.status === 'IN_USE').length}</span></div>
        <div className="stat-card"><span className="stat-label">Maintenance</span><span className="stat-value">{availabilities.filter(a => a.status === 'MAINTENANCE').length}</span></div>
      </div>

      <div className="table-section">
        <div className="section-header">
          <span className="section-title">Availability Windows</span>
          <span className="section-badge">{availabilities.length} window{availabilities.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-toolbar">
          <div className="filter-wrapper">
            <select className="status-select" value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)}>
              <option value="ALL">All Vehicles</option>
              {vehicles.map(v => <option key={v.vehicleID} value={v.vehicleID}>{v.regNumber}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state">Loading availability data…</div>
          ) : availabilities.length === 0 ? (
            <div className="empty-state">No availability windows found.</div>
          ) : (
            <table className="billing-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vehicle</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {availabilities.map(a => {
                  const id       = a.id ?? a.availabilityID;
                  const start    = a.startTime ? new Date(a.startTime) : null;
                  const end      = a.endTime   ? new Date(a.endTime)   : null;
                  const duration = start && end ? Math.round((end - start) / 3600000) : null;
                  return (
                    <tr key={id}>
                      <td className="billing-id-cell">#{id}</td>
                      <td><strong>{getVehicleReg(a.vehicleID)}</strong></td>
                      <td>{start ? start.toLocaleString() : '—'}</td>
                      <td>{end   ? end.toLocaleString()   : '—'}</td>
                      <td>{duration !== null ? `${duration}h` : '—'}</td>
                      <td><span className={`status-badge ${statusColor(a.status)}`}>{a.status}</span></td>
                      <td>
                        <button className="btn-icon" title="Edit"   onClick={() => openEdit(a)}>✏️</button>
                        <button className="btn-icon" title="Delete" onClick={() => confirmDelete(a)}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editMode ? 'Edit Availability Window' : 'Add Availability Window'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {formError && <div className="error-banner">{formError}</div>}
                <div className="form-field">
                  <label>Vehicle *</label>
                  <select required value={form.vehicleID} onChange={e => setForm(f => ({...f, vehicleID: e.target.value}))}>
                    <option value="">— Select Vehicle —</option>
                    {vehicles.map(v => <option key={v.vehicleID} value={v.vehicleID}>{v.regNumber} ({v.type})</option>)}
                  </select>
                </div>
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Start Time *</label>
                    <input required type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({...f, startTime: e.target.value}))} />
                  </div>
                  <div className="form-field">
                    <label>End Time *</label>
                    <input required type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({...f, endTime: e.target.value}))} />
                  </div>
                </div>
                <div className="form-field">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : (editMode ? 'Save Changes' : 'Add Window')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deleteTarget && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Window</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div className="delete-confirm-icon">🗑️</div>
              <p className="delete-confirm-text">Delete this availability window for vehicle <strong>{getVehicleReg(deleteTarget.vehicleID)}</strong>? This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn-danger" onClick={doDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
