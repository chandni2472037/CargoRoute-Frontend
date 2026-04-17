import React, { useEffect, useState, useCallback } from 'react';
import '../../styles/Billing.css';
import {
  getAllDrivers, createDriver, updateDriver, deleteDriver, getDriversByStatus
} from '../../api/dispatchApi';

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED'];
const EMPTY_FORM = { name: '', licenseNo: '', contactInfo: '', mobileNumber: '', status: 'ACTIVE' };

const statusColor = (s) => {
  switch (String(s).toUpperCase()) {
    case 'ACTIVE':    return 'status-active';
    case 'INACTIVE':  return 'status-cancelled';
    case 'ON_LEAVE':  return 'status-pending';
    case 'SUSPENDED': return 'status-overdue';
    default:          return 'status-draft';
  }
};

export default function DriversList() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [showModal, setShowModal]   = useState(false);
  const [editMode, setEditMode]     = useState(false);
  const [currentId, setCurrentId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [saving, setSaving]         = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget]           = useState(null);

  const loadDrivers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = filterStatus === 'ALL'
        ? await getAllDrivers()
        : await getDriversByStatus(filterStatus);
      setDrivers(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };

  const openCreate = () => {
    setEditMode(false); setCurrentId(null); setForm(EMPTY_FORM);
    setFormError(''); setShowModal(true);
  };

  const openEdit = (d) => {
    setEditMode(true); setCurrentId(d.driverID);
    setForm({ name: d.name || '', licenseNo: d.licenseNo || '', contactInfo: d.contactInfo || '', mobileNumber: d.mobileNumber || '', status: d.status || 'ACTIVE' });
    setFormError(''); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.licenseNo.trim() || !form.mobileNumber.trim()) {
      setFormError('Name, licence number and mobile number are required.'); return;
    }
    setSaving(true); setFormError('');
    try {
      if (editMode) { await updateDriver(currentId, form); flash('Driver updated.'); }
      else          { await createDriver(form);             flash('Driver created.'); }
      setShowModal(false); loadDrivers();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const confirmDelete = (d) => { setDeleteTarget(d); setShowDeleteConfirm(true); };
  const doDelete = async () => {
    try {
      await deleteDriver(deleteTarget.driverID);
      flash(`Driver "${deleteTarget.name}" deleted.`);
      setShowDeleteConfirm(false); setDeleteTarget(null); loadDrivers();
    } catch (e) { setError(e.message); setShowDeleteConfirm(false); }
  };

  const filtered = drivers.filter(d =>
    (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.licenseNo || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.mobileNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="billing-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Drivers</h1>
          <p className="page-subtitle">Manage driver profiles and availability status</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Add Driver</button>
      </div>

      {error   && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      {/* Stats */}
      <div className="billing-stats-grid">
        <div className="stat-card"><span className="stat-label">Total Drivers</span><span className="stat-value">{drivers.length}</span></div>
        <div className="stat-card"><span className="stat-label">Active</span><span className="stat-value">{drivers.filter(d => d.status === 'ACTIVE').length}</span></div>
        <div className="stat-card"><span className="stat-label">On Leave</span><span className="stat-value">{drivers.filter(d => d.status === 'ON_LEAVE').length}</span></div>
        <div className="stat-card"><span className="stat-label">Inactive / Suspended</span><span className="stat-value">{drivers.filter(d => ['INACTIVE','SUSPENDED'].includes(d.status)).length}</span></div>
      </div>

      {/* Table section */}
      <div className="table-section">
        <div className="section-header">
          <span className="section-title">Driver List</span>
          <span className="section-badge">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-toolbar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by name, licence or mobile…" value={search} onChange={e => setSearch(e.target.value)} />
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
            <div className="empty-state">Loading drivers…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No drivers found.</div>
          ) : (
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Driver ID</th>
                  <th>Name</th>
                  <th>Licence No.</th>
                  <th>Mobile</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.driverID}>
                    <td className="billing-id-cell">#{d.driverID}</td>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.licenseNo}</td>
                    <td>{d.mobileNumber}</td>
                    <td className="notes-cell">{d.contactInfo || '—'}</td>
                    <td><span className={`status-badge ${statusColor(d.status)}`}>{d.status}</span></td>
                    <td>
                      <button className="btn-icon" title="Edit" onClick={() => openEdit(d)}>✏️</button>
                      <button className="btn-icon" title="Delete" onClick={() => confirmDelete(d)}>🗑️</button>
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
              <h2 className="modal-title">{editMode ? 'Edit Driver' : 'Add New Driver'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {formError && <div className="error-banner">{formError}</div>}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Full Name *</label>
                    <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="John Doe" />
                  </div>
                  <div className="form-field">
                    <label>Licence Number *</label>
                    <input required value={form.licenseNo} onChange={e => setForm(f => ({...f, licenseNo: e.target.value}))} placeholder="DL-123456" />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Mobile Number *</label>
                    <input required value={form.mobileNumber} onChange={e => setForm(f => ({...f, mobileNumber: e.target.value}))} placeholder="+91 9876543210" />
                  </div>
                  <div className="form-field">
                    <label>Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-field">
                  <label>Contact Info (email / address)</label>
                  <input value={form.contactInfo} onChange={e => setForm(f => ({...f, contactInfo: e.target.value}))} placeholder="driver@example.com or address" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : (editMode ? 'Save Changes' : 'Create Driver')}</button>
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
              <h2 className="modal-title">Delete Driver</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div className="delete-confirm-icon">🗑️</div>
              <p className="delete-confirm-text">Are you sure you want to delete driver <strong>{deleteTarget.name}</strong>? This action cannot be undone.</p>
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
