import React, { useEffect, useState, useCallback } from 'react';
import '../../styles/Billing.css';
import {
  getAllRoutingRules, getActiveRoutingRules, createRoutingRule, updateRoutingRule, deleteRoutingRule
} from '../../api/routingApi';

const EMPTY_FORM = { name: '', conditionsJSON: '', priority: '1', active: true };

export default function RoutingRulesList() {
  const [rules, setRules]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [search, setSearch]       = useState('');
  const [filterActive, setFilterActive] = useState('ALL');

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
      const data = filterActive === 'active'
        ? await getActiveRoutingRules()
        : await getAllRoutingRules();
      setRules(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [filterActive]);

  useEffect(() => { loadData(); }, [loadData]);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };

  const openCreate = () => {
    setEditMode(false); setCurrentId(null); setForm(EMPTY_FORM);
    setFormError(''); setShowModal(true);
  };

  const openEdit = (r) => {
    setEditMode(true); setCurrentId(r.ruleID);
    setForm({
      name:           r.name           || '',
      conditionsJSON: r.conditionsJSON  || '',
      priority:       r.priority        != null ? String(r.priority) : '1',
      active:         r.active          !== false,
    });
    setFormError(''); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Rule name is required.'); return; }
    setSaving(true); setFormError('');
    const payload = { ...form, priority: Number(form.priority) };
    try {
      if (editMode) { await updateRoutingRule(currentId, payload); flash('Rule updated.'); }
      else          { await createRoutingRule(payload);             flash('Rule created.'); }
      setShowModal(false); loadData();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (r) => {
    try {
      await updateRoutingRule(r.ruleID, { ...r, active: !r.active });
      flash(`Rule "${r.name}" ${!r.active ? 'activated' : 'deactivated'}.`);
      loadData();
    } catch (e) { setError(e.message); }
  };

  const confirmDelete = (r) => { setDeleteTarget(r); setShowDeleteConfirm(true); };
  const doDelete = async () => {
    try {
      await deleteRoutingRule(deleteTarget.ruleID);
      flash(`Rule "${deleteTarget.name}" deleted.`);
      setShowDeleteConfirm(false); setDeleteTarget(null); loadData();
    } catch (e) { setError(e.message); setShowDeleteConfirm(false); }
  };

  const filtered = rules.filter(r => {
    const q = search.toLowerCase();
    return (r.name||'').toLowerCase().includes(q) || (r.conditionsJSON||'').toLowerCase().includes(q);
  });

  const activeCount   = rules.filter(r => r.active === true).length;
  const inactiveCount = rules.filter(r => r.active === false).length;

  return (
    <div className="billing-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Routing Rules</h1>
          <p className="page-subtitle">Configure business rules that govern route assignment and load planning</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ New Rule</button>
      </div>

      {error   && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="billing-stats-grid">
        <div className="stat-card"><span className="stat-label">Total Rules</span><span className="stat-value">{rules.length}</span></div>
        <div className="stat-card"><span className="stat-label">Active</span><span className="stat-value">{activeCount}</span></div>
        <div className="stat-card"><span className="stat-label">Inactive</span><span className="stat-value">{inactiveCount}</span></div>
        <div className="stat-card">
          <span className="stat-label">Highest Priority</span>
          <span className="stat-value">{rules.length > 0 ? Math.max(...rules.map(r => r.priority || 0)) : '—'}</span>
        </div>
      </div>

      <div className="table-section">
        <div className="section-header">
          <span className="section-title">Rule Definitions</span>
          <span className="section-badge">{filtered.length} rule{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-toolbar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by rule name or conditions…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-wrapper">
            <select className="status-select" value={filterActive} onChange={e => setFilterActive(e.target.value)}>
              <option value="ALL">All Rules</option>
              <option value="active">Active Only</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state">Loading routing rules…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No routing rules found.</div>
          ) : (
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Name</th>
                  <th>Priority</th>
                  <th>Conditions</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => (b.priority||0) - (a.priority||0)).map(r => (
                  <tr key={r.ruleID}>
                    <td className="billing-id-cell">#{r.ruleID}</td>
                    <td><strong>{r.name}</strong></td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.priority}</td>
                    <td className="notes-cell">
                      {r.conditionsJSON
                        ? String(r.conditionsJSON).substring(0, 60) + (String(r.conditionsJSON).length > 60 ? '…' : '')
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        title={r.active ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleActive(r)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}
                      >
                        {r.active ? '✅' : '⭕'}
                      </button>
                    </td>
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
              <h2 className="modal-title">{editMode ? 'Edit Routing Rule' : 'Create New Rule'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {formError && <div className="error-banner">{formError}</div>}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Rule Name *</label>
                    <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Max Weight Per Truck" />
                  </div>
                  <div className="form-field">
                    <label>Priority</label>
                    <input type="number" min="1" value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} placeholder="1 = lowest" />
                  </div>
                </div>
                <div className="form-field">
                  <label>Conditions JSON</label>
                  <textarea
                    rows={4}
                    value={form.conditionsJSON}
                    onChange={e => setForm(f => ({...f, conditionsJSON: e.target.value}))}
                    placeholder={'e.g. {"maxWeightKg": 5000, "vehicleType": "Truck"}'}
                    style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                  />
                </div>
                <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="ruleActive"
                    checked={form.active}
                    onChange={e => setForm(f => ({...f, active: e.target.checked}))}
                    style={{ width: 'auto', marginTop: 0 }}
                  />
                  <label htmlFor="ruleActive" style={{ marginBottom: 0, cursor: 'pointer' }}>Active (rule will be applied to routing decisions)</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : (editMode ? 'Save Changes' : 'Create Rule')}</button>
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
              <h2 className="modal-title">Delete Rule</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div className="delete-confirm-icon">🗑️</div>
              <p className="delete-confirm-text">Delete rule <strong>"{deleteTarget.name}"</strong>? This cannot be undone.</p>
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
