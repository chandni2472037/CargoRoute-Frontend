import React, { useEffect, useState, useCallback } from 'react';
import '../../styles/Billing.css';
import { getAllLoads, createLoad, updateLoad, deleteLoad } from '../../api/routingApi';

const STATUS_OPTIONS = ['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const EMPTY_FORM = {
  loadCode: '', vehicleID: '', plannedStart: '', plannedEnd: '',
  totalWeightKg: '', totalVolumeM3: '', bookingsJSON: '', status: 'DRAFT'
};

const statusColor = (s) => {
  switch (String(s).toUpperCase()) {
    case 'DRAFT':       return 'status-draft';
    case 'PLANNED':     return 'status-pending';
    case 'IN_PROGRESS': return 'status-paid';
    case 'COMPLETED':   return 'status-active';
    case 'CANCELLED':   return 'status-cancelled';
    default:            return 'status-draft';
  }
};

export default function LoadsList() {
  const [loads, setLoads]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [search, setSearch]       = useState('');
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
      const data = await getAllLoads();
      // getAllLoads returns List<RequiredResponseDTO> where each item is { load, route } OR just LoadDTO
      setLoads(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };

  // Extract load from RequiredResponseDTO or plain LoadDTO
  const getLoad = (item) => item?.load || item;

  const openCreate = () => {
    setEditMode(false); setCurrentId(null); setForm(EMPTY_FORM);
    setFormError(''); setShowModal(true);
  };

  const openEdit = (item) => {
    const load = getLoad(item);
    setEditMode(true); setCurrentId(load.loadID);
    setForm({
      loadCode:       load.loadCode      || '',
      vehicleID:      load.vehicleID     != null ? String(load.vehicleID) : '',
      plannedStart:   load.plannedStart  ? load.plannedStart.substring(0, 16)  : '',
      plannedEnd:     load.plannedEnd    ? load.plannedEnd.substring(0, 16)    : '',
      totalWeightKg:  load.totalWeightKg != null ? String(load.totalWeightKg) : '',
      totalVolumeM3:  load.totalVolumeM3 != null ? String(load.totalVolumeM3) : '',
      bookingsJSON:   load.bookingsJSON  || '',
      status:         load.status        || 'DRAFT',
    });
    setFormError(''); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.loadCode.trim()) { setFormError('Load code is required.'); return; }
    setSaving(true); setFormError('');
    const payload = {
      ...form,
      vehicleID:     form.vehicleID     ? Number(form.vehicleID)     : null,
      totalWeightKg: form.totalWeightKg ? parseFloat(form.totalWeightKg) : null,
      totalVolumeM3: form.totalVolumeM3 ? parseFloat(form.totalVolumeM3) : null,
    };
    try {
      if (editMode) { await updateLoad(currentId, payload); flash('Load updated.'); }
      else          { await createLoad(payload);             flash('Load created.'); }
      setShowModal(false); loadData();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const confirmDelete = (item) => { setDeleteTarget(item); setShowDeleteConfirm(true); };
  const doDelete = async () => {
    const load = getLoad(deleteTarget);
    try {
      await deleteLoad(load.loadID);
      flash(`Load "${load.loadCode}" deleted.`);
      setShowDeleteConfirm(false); setDeleteTarget(null); loadData();
    } catch (e) { setError(e.message); setShowDeleteConfirm(false); }
  };

  const filtered = loads.filter(item => {
    const load = getLoad(item);
    const q = search.toLowerCase();
    return (
      (load.loadCode   || '').toLowerCase().includes(q) ||
      String(load.loadID   || '').includes(q) ||
      String(load.vehicleID || '').includes(q)
    );
  });

  const filteredByStatus = filtered.filter(item =>
    filterStatus === 'ALL' || (getLoad(item).status || '').toUpperCase() === filterStatus
  );

  return (
    <div className="billing-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loads</h1>
          <p className="page-subtitle">Plan and manage cargo loads for routing and dispatch</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Create Load</button>
      </div>

      {error   && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="billing-stats-grid">
        <div className="stat-card"><span className="stat-label">Total Loads</span><span className="stat-value">{loads.length}</span></div>
        <div className="stat-card"><span className="stat-label">Planned</span><span className="stat-value">{loads.filter(l => (getLoad(l).status||'') === 'PLANNED').length}</span></div>
        <div className="stat-card"><span className="stat-label">In Progress</span><span className="stat-value">{loads.filter(l => (getLoad(l).status||'') === 'IN_PROGRESS').length}</span></div>
        <div className="stat-card"><span className="stat-label">Completed</span><span className="stat-value">{loads.filter(l => (getLoad(l).status||'') === 'COMPLETED').length}</span></div>
      </div>

      <div className="table-section">
        <div className="section-header">
          <span className="section-title">Load Registry</span>
          <span className="section-badge">{filteredByStatus.length} load{filteredByStatus.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-toolbar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by load code, ID or vehicle…" value={search} onChange={e => setSearch(e.target.value)} />
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
            <div className="empty-state">Loading loads…</div>
          ) : filteredByStatus.length === 0 ? (
            <div className="empty-state">No loads found.</div>
          ) : (
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Load ID</th>
                  <th>Load Code</th>
                  <th>Vehicle ID</th>
                  <th>Planned Start</th>
                  <th>Planned End</th>
                  <th>Weight (kg)</th>
                  <th>Volume (m³)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredByStatus.map(item => {
                  const load  = getLoad(item);
                  return (
                    <tr key={load.loadID}>
                      <td className="billing-id-cell">#{load.loadID}</td>
                      <td><strong>{load.loadCode}</strong></td>
                      <td>{load.vehicleID != null ? `#${load.vehicleID}` : '—'}</td>
                      <td>{load.plannedStart ? new Date(load.plannedStart).toLocaleString() : '—'}</td>
                      <td>{load.plannedEnd   ? new Date(load.plannedEnd).toLocaleString()   : '—'}</td>
                      <td className="amount-cell">{load.totalWeightKg?.toLocaleString() ?? '—'}</td>
                      <td className="amount-cell">{load.totalVolumeM3 ?? '—'}</td>
                      <td><span className={`status-badge ${statusColor(load.status)}`}>{load.status}</span></td>
                      <td>
                        <button className="btn-icon" title="Edit"   onClick={() => openEdit(item)}>✏️</button>
                        <button className="btn-icon" title="Delete" onClick={() => confirmDelete(item)}>🗑️</button>
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
              <h2 className="modal-title">{editMode ? 'Edit Load' : 'Create New Load'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {formError && <div className="error-banner">{formError}</div>}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Load Code *</label>
                    <input required value={form.loadCode} onChange={e => setForm(f => ({...f, loadCode: e.target.value}))} placeholder="e.g. LD-2024-001" />
                  </div>
                  <div className="form-field">
                    <label>Vehicle ID</label>
                    <input type="number" value={form.vehicleID} onChange={e => setForm(f => ({...f, vehicleID: e.target.value}))} placeholder="Optional vehicle assignment" />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Planned Start</label>
                    <input type="datetime-local" value={form.plannedStart} onChange={e => setForm(f => ({...f, plannedStart: e.target.value}))} />
                  </div>
                  <div className="form-field">
                    <label>Planned End</label>
                    <input type="datetime-local" value={form.plannedEnd} onChange={e => setForm(f => ({...f, plannedEnd: e.target.value}))} />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Total Weight (kg)</label>
                    <input type="number" step="0.01" value={form.totalWeightKg} onChange={e => setForm(f => ({...f, totalWeightKg: e.target.value}))} placeholder="e.g. 2500" />
                  </div>
                  <div className="form-field">
                    <label>Total Volume (m³)</label>
                    <input type="number" step="0.01" value={form.totalVolumeM3} onChange={e => setForm(f => ({...f, totalVolumeM3: e.target.value}))} placeholder="e.g. 12.5" />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Bookings JSON</label>
                    <input value={form.bookingsJSON} onChange={e => setForm(f => ({...f, bookingsJSON: e.target.value}))} placeholder='e.g. [1,2,3]' />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : (editMode ? 'Save Changes' : 'Create Load')}</button>
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
              <h2 className="modal-title">Delete Load</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div className="delete-confirm-icon">🗑️</div>
              <p className="delete-confirm-text">Delete load <strong>{getLoad(deleteTarget).loadCode}</strong>? This cannot be undone.</p>
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
