import React, { useEffect, useState, useCallback } from 'react';
import '../../styles/Billing.css';
import { getAllRoutes, createRoute, updateRoute, deleteRoute } from '../../api/routingApi';

const STATUS_OPTIONS = ['DRAFT', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const EMPTY_FORM = {
  loadID: '', sequenceJSON: '', distanceKm: '', estimatedDurationMin: '', costEstimate: '', status: 'DRAFT'
};

const statusColor = (s) => {
  switch (String(s).toUpperCase()) {
    case 'DRAFT':       return 'status-draft';
    case 'ACTIVE':      return 'status-pending';
    case 'IN_PROGRESS': return 'status-paid';
    case 'COMPLETED':   return 'status-active';
    case 'CANCELLED':   return 'status-cancelled';
    default:            return 'status-draft';
  }
};

export default function RoutesList() {
  const [routes, setRoutes]       = useState([]);
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
      const data = await getAllRoutes();
      setRoutes(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };

  const openCreate = () => {
    setEditMode(false); setCurrentId(null); setForm(EMPTY_FORM);
    setFormError(''); setShowModal(true);
  };

  const openEdit = (r) => {
    setEditMode(true); setCurrentId(r.routeID);
    setForm({
      loadID:               String(r.loadID || ''),
      sequenceJSON:         r.sequenceJSON         || '',
      distanceKm:           r.distanceKm           != null ? String(r.distanceKm)           : '',
      estimatedDurationMin: r.estimatedDurationMin  != null ? String(r.estimatedDurationMin) : '',
      costEstimate:         r.costEstimate          != null ? String(r.costEstimate)          : '',
      status:               r.status || 'DRAFT',
    });
    setFormError(''); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.loadID) { setFormError('Load ID is required.'); return; }
    setSaving(true); setFormError('');
    const payload = {
      ...form,
      loadID:               Number(form.loadID),
      distanceKm:           form.distanceKm           ? parseFloat(form.distanceKm)           : null,
      estimatedDurationMin: form.estimatedDurationMin ? parseInt(form.estimatedDurationMin)   : null,
      costEstimate:         form.costEstimate          ? parseFloat(form.costEstimate)          : null,
    };
    try {
      if (editMode) { await updateRoute(currentId, payload); flash('Route updated.'); }
      else          { await createRoute(payload);             flash('Route created.'); }
      setShowModal(false); loadData();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const confirmDelete = (r) => { setDeleteTarget(r); setShowDeleteConfirm(true); };
  const doDelete = async () => {
    try {
      await deleteRoute(deleteTarget.routeID);
      flash(`Route #${deleteTarget.routeID} deleted.`);
      setShowDeleteConfirm(false); setDeleteTarget(null); loadData();
    } catch (e) { setError(e.message); setShowDeleteConfirm(false); }
  };

  const filtered = routes.filter(r => {
    const q = search.toLowerCase();
    return String(r.routeID||'').includes(q) || String(r.loadID||'').includes(q) || (r.status||'').toLowerCase().includes(q);
  });

  const filteredByStatus = filtered.filter(r =>
    filterStatus === 'ALL' || (r.status||'').toUpperCase() === filterStatus
  );

  const totalCost = routes.reduce((s, r) => s + (r.costEstimate || 0), 0);
  const totalDist = routes.reduce((s, r) => s + (r.distanceKm  || 0), 0);

  return (
    <div className="billing-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Routes</h1>
          <p className="page-subtitle">Define and manage delivery routes for each load</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Create Route</button>
      </div>

      {error   && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="billing-stats-grid">
        <div className="stat-card"><span className="stat-label">Total Routes</span><span className="stat-value">{routes.length}</span></div>
        <div className="stat-card"><span className="stat-label">Active</span><span className="stat-value">{routes.filter(r => r.status === 'ACTIVE' || r.status === 'IN_PROGRESS').length}</span></div>
        <div className="stat-card"><span className="stat-label">Total Distance</span><span className="stat-value">{totalDist.toFixed(1)} km</span></div>
        <div className="stat-card"><span className="stat-label">Total Cost Est.</span><span className="stat-value">₹{totalCost.toLocaleString()}</span></div>
      </div>

      <div className="table-section">
        <div className="section-header">
          <span className="section-title">Route List</span>
          <span className="section-badge">{filteredByStatus.length} route{filteredByStatus.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-toolbar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by route ID, load ID or status…" value={search} onChange={e => setSearch(e.target.value)} />
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
            <div className="empty-state">Loading routes…</div>
          ) : filteredByStatus.length === 0 ? (
            <div className="empty-state">No routes found.</div>
          ) : (
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Route ID</th>
                  <th>Load ID</th>
                  <th>Distance (km)</th>
                  <th>Est. Duration</th>
                  <th>Cost Estimate</th>
                  <th>Sequence</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredByStatus.map(r => (
                  <tr key={r.routeID}>
                    <td className="billing-id-cell">#{r.routeID}</td>
                    <td>#{r.loadID}</td>
                    <td className="amount-cell">{r.distanceKm != null ? r.distanceKm.toFixed(2) : '—'}</td>
                    <td>{r.estimatedDurationMin != null ? `${r.estimatedDurationMin} min` : '—'}</td>
                    <td className="amount-cell">{r.costEstimate != null ? `₹${r.costEstimate.toLocaleString()}` : '—'}</td>
                    <td className="notes-cell">{r.sequenceJSON ? String(r.sequenceJSON).substring(0, 40) + (String(r.sequenceJSON).length > 40 ? '…' : '') : '—'}</td>
                    <td><span className={`status-badge ${statusColor(r.status)}`}>{r.status}</span></td>
                    <td>
                      <button className="btn-icon" title="Edit"   onClick={() => openEdit(r)}>✏️</button>
                      <button className="btn-icon" title="Delete" onClick={() => confirmDelete(r)}>🗑️</button>
                    </td>
                  </tr>
                ))}
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
              <h2 className="modal-title">{editMode ? 'Edit Route' : 'Create New Route'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {formError && <div className="error-banner">{formError}</div>}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Load ID *</label>
                    <input required type="number" value={form.loadID} onChange={e => setForm(f => ({...f, loadID: e.target.value}))} placeholder="e.g. 42" />
                  </div>
                  <div className="form-field">
                    <label>Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Distance (km)</label>
                    <input type="number" step="0.01" value={form.distanceKm} onChange={e => setForm(f => ({...f, distanceKm: e.target.value}))} placeholder="e.g. 250.5" />
                  </div>
                  <div className="form-field">
                    <label>Est. Duration (min)</label>
                    <input type="number" value={form.estimatedDurationMin} onChange={e => setForm(f => ({...f, estimatedDurationMin: e.target.value}))} placeholder="e.g. 180" />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Cost Estimate (₹)</label>
                    <input type="number" step="0.01" value={form.costEstimate} onChange={e => setForm(f => ({...f, costEstimate: e.target.value}))} placeholder="e.g. 12500" />
                  </div>
                  <div className="form-field">
                    <label>Sequence JSON</label>
                    <input value={form.sequenceJSON} onChange={e => setForm(f => ({...f, sequenceJSON: e.target.value}))} placeholder='e.g. ["WH1","HYD","MUM"]' />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : (editMode ? 'Save Changes' : 'Create Route')}</button>
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
              <h2 className="modal-title">Delete Route</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div className="delete-confirm-icon">🗑️</div>
              <p className="delete-confirm-text">Delete Route <strong>#{deleteTarget.routeID}</strong>? This cannot be undone.</p>
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
