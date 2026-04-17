import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { getAllShippers, createShipper, updateShipper } from '../../api/bookingsApi';
import { SHIPPER_STATUS_CONFIG as STATUS_CONFIG } from '../../utils/constants';
import '../../styles/Bookings.css';

const EMPTY_FORM = { name: '', contactInfo: '', accountTerms: '', status: 'ACTIVE' };

function validateShipperForm(form) {
  const err = {};
  if (!form.name.trim()) err.name = 'Shipper name is required';
  return err;
}

export default function ShippersList() {
  const [shippers, setShippers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);
  const [message, setMessage]       = useState({ type: '', text: '' });
  const [search, setSearch]         = useState('');

  const loadShippers = () => {
    setLoading(true);
    getAllShippers()
      .then(setShippers)
      .catch(() => setError('Could not load shippers. Is BookingService running on port 7070?'))
      .finally(() => setLoading(false));
  };

  useEffect(loadShippers, []);

  const openAddForm = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setMessage({ type: '', text: '' });
    setShowForm(true);
  };

  const openEditForm = (s) => {
    setEditId(s.shipperID);
    setForm({
      name:         s.name         || '',
      contactInfo:  s.contactInfo  || '',
      accountTerms: s.accountTerms || '',
      status:       s.status       || 'ACTIVE',
    });
    setFormErrors({});
    setMessage({ type: '', text: '' });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateShipperForm(form);
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      if (editId) {
        await updateShipper(editId, { ...form, shipperID: editId });
        setMessage({ type: 'success', text: 'Shipper updated successfully.' });
      } else {
        await createShipper(form);
        setMessage({ type: 'success', text: 'Shipper added successfully.' });
      }
      loadShippers();
      setTimeout(() => { setShowForm(false); setMessage({ type: '', text: '' }); }, 1400);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save shipper. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const filtered = shippers.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.contactInfo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="bookings-page">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Shippers</h1>
            <p className="page-subtitle">Manage registered shipper accounts</p>
          </div>
          <button className="btn-primary" onClick={openAddForm}>+ Add Shipper</button>
        </div>

        {error && (
          <div className="auth-message auth-message-error" style={{ marginBottom: 16 }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* ── Inline Add / Edit Form ───────────────────────── */}
        {showForm && (
          <div className="form-section" style={{
            marginBottom: 24, background: '#f8fafc',
            borderRadius: 10, padding: 24, border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 className="form-section-title" style={{ margin: 0 }}>
                {editId ? 'Edit Shipper' : 'Add New Shipper'}
              </h2>
              <button className="back-btn" onClick={() => setShowForm(false)} title="Close">✕</button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row form-row-2">
                <div className="form-field">
                  <label>Name <span className="required">*</span></label>
                  <input
                    type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="Company or shipper name"
                    className={formErrors.name ? 'input-error' : ''}
                  />
                  {formErrors.name && <span className="error-msg">{formErrors.name}</span>}
                </div>
                <div className="form-field">
                  <label>Contact Info</label>
                  <input
                    type="text" name="contactInfo" value={form.contactInfo} onChange={handleChange}
                    placeholder="Email address or phone number"
                  />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-field">
                  <label>Account Terms</label>
                  <input
                    type="text" name="accountTerms" value={form.accountTerms} onChange={handleChange}
                    placeholder="e.g., NET30, PREPAID, COD"
                  />
                </div>
                <div className="form-field">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              {message.text && (
                <div className={`auth-message auth-message-${message.type}`} style={{ marginBottom: 14 }}>
                  <span>{message.type === 'success' ? '✔' : '⚠'}</span> {message.text}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : (editId ? '✏️ Update Shipper' : '+ Add Shipper')}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Stats ───────────────────────────────────────── */}
        {!loading && shippers.length > 0 && (
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total',     val: shippers.length,                                             cls: '' },
              { label: 'Active',    val: shippers.filter(s => s.status === 'ACTIVE').length,    cls: 'status-created'   },
              { label: 'Inactive',  val: shippers.filter(s => s.status === 'INACTIVE').length,  cls: 'status-pending'   },
              { label: 'Suspended', val: shippers.filter(s => s.status === 'SUSPENDED').length, cls: 'status-cancelled' },
            ].map(({ label, val, cls }) => (
              <div className="stat-card" key={label}>
                <div className="stat-value">{val}</div>
                <div className="stat-label">
                  {cls ? <span className={`status-badge ${cls}`}>{label}</span> : label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Search ──────────────────────────────────────── */}
        {shippers.length > 0 && (
          <div className="filters-row" style={{ marginBottom: 16 }}>
            <input
              className="search-input"
              placeholder="🔍  Search shippers by name or contact…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* ── Table ───────────────────────────────────────── */}
        {loading ? (
          <div className="empty-state">Loading shippers…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏢</div>
            {search
              ? <p>No shippers match "{search}".</p>
              : <p>No shippers yet. Click <strong>+ Add Shipper</strong> to create the first one.</p>
            }
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Shipper ID</th>
                  <th>Name</th>
                  <th>Contact Info</th>
                  <th>Account Terms</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const sc = STATUS_CONFIG[s.status] || { label: s.status, cls: 'status-pending' };
                  return (
                    <tr key={s.shipperID}>
                      <td>
                        <span className="booking-id">
                          SH{String(s.shipperID).padStart(3, '0')}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.contactInfo || '–'}</td>
                      <td>{s.accountTerms || '–'}</td>
                      <td>
                        <span className={`status-badge ${sc.cls}`}>{sc.label}</span>
                      </td>
                      <td>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 14px', fontSize: 12 }}
                          onClick={() => openEditForm(s)}
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </Layout>
  );
}
