import React, { useEffect, useState, useCallback } from 'react';
import '../../styles/Billing.css';
import {
  getAllDriverAcks, createDriverAck, updateDriverAck, deleteDriverAck
} from '../../api/dispatchApi';
import { getAllDrivers, getAllDispatches } from '../../api/dispatchApi';

const EMPTY_FORM = { dispatchID: '', driverID: '', notes: '' };

export default function DriverAckList() {
  const [acks, setAcks]       = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch]   = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]       = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget]           = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [acksData, driversData, dispatchesData] = await Promise.all([
        getAllDriverAcks(),
        getAllDrivers(),
        getAllDispatches()
      ]);
      setAcks(Array.isArray(acksData) ? acksData : []);
      setDrivers(Array.isArray(driversData) ? driversData : []);
      setDispatches(Array.isArray(dispatchesData) ? dispatchesData : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };

  const openCreate = () => {
    setEditMode(false); setCurrentId(null); setForm(EMPTY_FORM);
    setFormError(''); setShowModal(true);
  };

  const openEdit = (a) => {
    // a is DriverAckResponseDTO: { ackID, dispatch: DispatchResponseDTO, driver, ackAt, notes }
    setEditMode(true); setCurrentId(a.ackID);
    setForm({
      dispatchID: (a.dispatch?.dispatch || a.dispatch)?.dispatchID || '',
      driverID:   a.driver?.driverID || '',
      notes:      a.notes || '',
    });
    setFormError(''); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.dispatchID || !form.driverID) {
      setFormError('Dispatch and Driver are required.'); return;
    }
    setSaving(true); setFormError('');
    try {
      if (editMode) { await updateDriverAck(currentId, form); flash('Acknowledgement updated.'); }
      else          { await createDriverAck(form);             flash('Acknowledgement recorded.'); }
      setShowModal(false); loadAll();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const confirmDelete = (a) => { setDeleteTarget(a); setShowDeleteConfirm(true); };
  const doDelete = async () => {
    try {
      await deleteDriverAck(deleteTarget.ackID);
      flash(`Acknowledgement #${deleteTarget.ackID} deleted.`);
      setShowDeleteConfirm(false); setDeleteTarget(null); loadAll();
    } catch (e) { setError(e.message); setShowDeleteConfirm(false); }
  };

  const getDriver   = (id) => drivers.find(d => String(d.driverID) === String(id));
  const getDispatch = (id) => {
    const d = dispatches.find(d => String((d.dispatch||d).dispatchID) === String(id));
    return d ? (d.dispatch||d) : null;
  };

  const filtered = acks.filter(a => {
    const dispatch = (a.dispatch?.dispatch || a.dispatch) || {};
    const driver   = a.driver || {};
    const q = search.toLowerCase();
    return (
      String(a.ackID || '').includes(q) ||
      (driver.name || '').toLowerCase().includes(q) ||
      String(dispatch.dispatchID || '').includes(q) ||
      (a.notes || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="billing-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver Acknowledgements</h1>
          <p className="page-subtitle">Track driver acknowledgements for each dispatch assignment</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Record Acknowledgement</button>
      </div>

      {error   && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="billing-stats-grid">
        <div className="stat-card"><span className="stat-label">Total Acks</span><span className="stat-value">{acks.length}</span></div>
        <div className="stat-card"><span className="stat-label">Unique Drivers</span><span className="stat-value">{new Set(acks.map(a => a.driver?.driverID)).size}</span></div>
        <div className="stat-card"><span className="stat-label">Unique Dispatches</span><span className="stat-value">{new Set(acks.map(a => (a.dispatch?.dispatch||a.dispatch)?.dispatchID)).size}</span></div>
        <div className="stat-card"><span className="stat-label">Today's Acks</span><span className="stat-value">{acks.filter(a => a.ackAt && new Date(a.ackAt).toDateString() === new Date().toDateString()).length}</span></div>
      </div>

      <div className="table-section">
        <div className="section-header">
          <span className="section-title">Acknowledgement Records</span>
          <span className="section-badge">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-toolbar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by ack ID, driver, dispatch, notes…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state">Loading acknowledgements…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No acknowledgements found.</div>
          ) : (
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Ack ID</th>
                  <th>Dispatch ID</th>
                  <th>Load Code</th>
                  <th>Driver</th>
                  <th>Acknowledged At</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const dispatchObj = (a.dispatch?.dispatch || a.dispatch) || {};
                  const load        = a.dispatch?.load || {};
                  const driver      = a.driver || {};
                  return (
                    <tr key={a.ackID}>
                      <td className="billing-id-cell">#{a.ackID}</td>
                      <td>#{dispatchObj.dispatchID || '—'}</td>
                      <td>{load.loadCode || '—'}</td>
                      <td><strong>{driver.name || `Driver #${dispatchObj.assignedDriverID}`}</strong></td>
                      <td>{a.ackAt ? new Date(a.ackAt).toLocaleString() : '—'}</td>
                      <td className="notes-cell">{a.notes || '—'}</td>
                      <td>
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(a)}>✏️</button>
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
              <h2 className="modal-title">{editMode ? 'Edit Acknowledgement' : 'Record Driver Acknowledgement'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {formError && <div className="error-banner">{formError}</div>}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Dispatch *</label>
                    <select required value={form.dispatchID} onChange={e => setForm(f => ({...f, dispatchID: e.target.value}))}>
                      <option value="">— Select Dispatch —</option>
                      {dispatches.map(d => {
                        const dp = d.dispatch || d;
                        const ld = d.load || {};
                        return (
                          <option key={dp.dispatchID} value={dp.dispatchID}>
                            #{dp.dispatchID} — {ld.loadCode || `Load #${dp.loadID}`} ({dp.status})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Driver *</label>
                    <select required value={form.driverID} onChange={e => setForm(f => ({...f, driverID: e.target.value}))}>
                      <option value="">— Select Driver —</option>
                      {drivers.map(dr => (
                        <option key={dr.driverID} value={dr.driverID}>{dr.name} ({dr.licenseNo})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-field">
                  <label>Notes</label>
                  <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Any acknowledgement notes…" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : (editMode ? 'Save Changes' : 'Record Ack')}</button>
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
              <h2 className="modal-title">Delete Acknowledgement</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div className="delete-confirm-icon">🗑️</div>
              <p className="delete-confirm-text">Delete Acknowledgement <strong>#{deleteTarget.ackID}</strong>? This cannot be undone.</p>
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
