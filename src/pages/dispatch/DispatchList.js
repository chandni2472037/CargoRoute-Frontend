import React, { useEffect, useState, useCallback } from 'react';
import '../../styles/Billing.css';
import {
  getAllDispatches, createDispatch, updateDispatch, deleteDispatch, getDispatchesByStatus
} from '../../api/dispatchApi';
import { getAllDrivers } from '../../api/dispatchApi';

const STATUS_OPTIONS = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
const EMPTY_FORM = { loadID: '', assignedDriverID: '', assignedBy: '', status: 'PENDING' };

const statusColor = (s) => {
  switch (String(s).toUpperCase()) {
    case 'PENDING':    return 'status-pending';
    case 'ASSIGNED':   return 'status-active';
    case 'IN_TRANSIT': return 'status-paid';
    case 'DELIVERED':  return 'status-active';
    case 'CANCELLED':  return 'status-cancelled';
    default:           return 'status-draft';
  }
};

export default function DispatchList() {
  const [dispatches, setDispatches] = useState([]);
  const [drivers, setDrivers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]       = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget]           = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [dispatches, driversData] = await Promise.all([
        filterStatus === 'ALL' ? getAllDispatches() : getDispatchesByStatus(filterStatus),
        getAllDrivers()
      ]);
      setDispatches(Array.isArray(dispatches) ? dispatches : []);
      setDrivers(Array.isArray(driversData) ? driversData : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };

  const openCreate = () => {
    setEditMode(false); setCurrentId(null); setForm(EMPTY_FORM);
    setFormError(''); setShowModal(true);
  };

  const openEdit = (d) => {
    // d is DispatchResponseDTO: { dispatch, load, vehicle }
    const dispatch = d.dispatch || d;
    setEditMode(true); setCurrentId(dispatch.dispatchID);
    setForm({
      loadID:          dispatch.loadID || '',
      assignedDriverID: dispatch.assignedDriverID || '',
      assignedBy:      dispatch.assignedBy || '',
      status:          dispatch.status || 'PENDING',
    });
    setFormError(''); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.loadID || !form.assignedDriverID || !form.assignedBy) {
      setFormError('Load ID, Driver and Assigned By are required.'); return;
    }
    setSaving(true); setFormError('');
    try {
      if (editMode) { await updateDispatch(currentId, form); flash('Dispatch updated.'); }
      else          { await createDispatch(form);             flash('Dispatch created.'); }
      setShowModal(false); loadData();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const confirmDelete = (d) => { setDeleteTarget(d); setShowDeleteConfirm(true); };
  const doDelete = async () => {
    const dispatch = deleteTarget.dispatch || deleteTarget;
    try {
      await deleteDispatch(dispatch.dispatchID);
      flash(`Dispatch #${dispatch.dispatchID} deleted.`);
      setShowDeleteConfirm(false); setDeleteTarget(null); loadData();
    } catch (e) { setError(e.message); setShowDeleteConfirm(false); }
  };

  const filtered = dispatches.filter(d => {
    const dispatch = d.dispatch || d;
    const load     = d.load    || {};
    const vehicle  = d.vehicle || {};
    const q = search.toLowerCase();
    return (
      String(dispatch.dispatchID || '').includes(q) ||
      (dispatch.assignedBy || '').toLowerCase().includes(q) ||
      (load.loadCode || '').toLowerCase().includes(q) ||
      (vehicle.regNumber || '').toLowerCase().includes(q)
    );
  });

  const getDriver = (id) => drivers.find(dr => String(dr.driverID) === String(id));

  return (
    <div className="billing-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dispatches</h1>
          <p className="page-subtitle">Assign loads to drivers and track dispatch status</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ New Dispatch</button>
      </div>

      {error   && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      {/* Stats */}
      <div className="billing-stats-grid">
        <div className="stat-card"><span className="stat-label">Total Dispatches</span><span className="stat-value">{dispatches.length}</span></div>
        <div className="stat-card"><span className="stat-label">In Transit</span><span className="stat-value">{dispatches.filter(d => (d.dispatch||d).status === 'IN_TRANSIT').length}</span></div>
        <div className="stat-card"><span className="stat-label">Delivered</span><span className="stat-value">{dispatches.filter(d => (d.dispatch||d).status === 'DELIVERED').length}</span></div>
        <div className="stat-card"><span className="stat-label">Pending</span><span className="stat-value">{dispatches.filter(d => (d.dispatch||d).status === 'PENDING').length}</span></div>
      </div>

      <div className="table-section">
        <div className="section-header">
          <span className="section-title">Dispatch List</span>
          <span className="section-badge">{filtered.length} dispatch{filtered.length !== 1 ? 'es' : ''}</span>
        </div>
        <div className="table-toolbar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by ID, load code, vehicle, assigned by…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-wrapper">
            <select className="status-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state">Loading dispatches…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No dispatches found.</div>
          ) : (
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Dispatch ID</th>
                  <th>Load Code</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Assigned By</th>
                  <th>Assigned At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const dispatch = d.dispatch || d;
                  const load     = d.load    || {};
                  const vehicle  = d.vehicle || {};
                  const driver   = getDriver(dispatch.assignedDriverID);
                  return (
                    <tr key={dispatch.dispatchID}>
                      <td className="billing-id-cell">#{dispatch.dispatchID}</td>
                      <td>{load.loadCode || `Load #${dispatch.loadID}`}</td>
                      <td>{vehicle.regNumber || '—'}</td>
                      <td>{driver ? driver.name : `Driver #${dispatch.assignedDriverID}`}</td>
                      <td>{dispatch.assignedBy}</td>
                      <td>{dispatch.assignedAt ? new Date(dispatch.assignedAt).toLocaleString() : '—'}</td>
                      <td><span className={`status-badge ${statusColor(dispatch.status)}`}>{dispatch.status}</span></td>
                      <td>
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(d)}>✏️</button>
                        <button className="btn-icon" title="Delete" onClick={() => confirmDelete(d)}>🗑️</button>
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
              <h2 className="modal-title">{editMode ? 'Edit Dispatch' : 'Create New Dispatch'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {formError && <div className="error-banner">{formError}</div>}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Load ID *</label>
                    <input required type="number" value={form.loadID} onChange={e => setForm(f => ({...f, loadID: e.target.value}))} placeholder="e.g. 101" />
                  </div>
                  <div className="form-field">
                    <label>Driver *</label>
                    <select required value={form.assignedDriverID} onChange={e => setForm(f => ({...f, assignedDriverID: e.target.value}))}>
                      <option value="">— Select Driver —</option>
                      {drivers.filter(dr => dr.status === 'ACTIVE').map(dr => (
                        <option key={dr.driverID} value={dr.driverID}>{dr.name} ({dr.licenseNo})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Assigned By *</label>
                    <input required value={form.assignedBy} onChange={e => setForm(f => ({...f, assignedBy: e.target.value}))} placeholder="Dispatcher name / ID" />
                  </div>
                  <div className="form-field">
                    <label>Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : (editMode ? 'Save Changes' : 'Create Dispatch')}</button>
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
              <h2 className="modal-title">Delete Dispatch</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div className="delete-confirm-icon">🗑️</div>
              <p className="delete-confirm-text">Delete Dispatch <strong>#{(deleteTarget.dispatch || deleteTarget).dispatchID}</strong>? This cannot be undone.</p>
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
