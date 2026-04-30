import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthContext } from '../../auth/AuthContext';
import { getAllShippers, createShipper, updateShipper } from '../../api/bookingsApi';
import { SHIPPER_STATUS_CONFIG as STATUS_CONFIG } from '../../utils/constants';
import { exportCSV } from '../../utils/csvExport';
import '../../styles/Bookings.css';

const EMPTY_FORM = { name: '', contactInfo: '', accountTerms: '', status: 'ACTIVE' };
// status is always ACTIVE on creation; not shown in form

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
  const [viewMode, setViewMode]     = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);
  const [message, setMessage]       = useState({ type: '', text: '' });
  const [search, setSearch]         = useState('');

  const loadShippers = () => {
    setLoading(true);
    getAllShippers()
      .then(setShippers)
      .catch(() => setError('Could not load shippers. Is the API Gateway running on port 8089?'))
      .finally(() => setLoading(false));
  };

  useEffect(loadShippers, []);

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const openAddForm = () => {
    // Admins should navigate to dedicated page instead of inline modal
    if (user?.role === 'Admin') {
      navigate('/shippers/new');
      return;
    }
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setMessage({ type: '', text: '' });
    setShowForm(true);
  };
/*  commented due to error*/ 
  // const openEditForm = (s, mode = 'edit') => {
  //   setEditId(s.shipperID);
  //   setForm({
  //     name:         s.name         || '',
  //     contactInfo:  s.contactInfo  || '',
  //     accountTerms: s.accountTerms || '',
  //     status:       s.status       || 'ACTIVE',
  //   });
  //   setFormErrors({});
  //   setMessage({ type: '', text: '' });
  //   setViewMode(mode === 'view');
  //   setShowForm(true);
  //   setOpenMenuId(null);
  // };

  const handleView = (shipper) => {
    // Navigate to dedicated detail page instead of inline modal
    navigate(`/shippers/${shipper.shipperID}`);
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
    s.name?.toLowerCase().includes(search.toLowerCase())
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
          {user?.role === 'Admin' && (
            <button
              className="btn-primary"
              title="Add Shipper"
              onClick={openAddForm}
              style={{ fontSize: 22, lineHeight: 1, padding: '6px 16px' }}
            >
              +
            </button>
          )}
        </div>

        {/* ── Error banner ────────────────────────────────── */}
        {error && (
          <div className="auth-message auth-message-error" style={{ marginBottom: 16 }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* ── Inline Add / Edit Form ───────────────────────── */}
        {showForm && (
          <div className="shipper-form-card">
            <div className="shipper-form-header">
              <h2>{viewMode ? '👁 View Shipper' : (editId ? '✏️ Edit Shipper' : '➕ Add New Shipper')}</h2>
              <button className="form-close-btn" onClick={() => setShowForm(false)} title="Close">✕</button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="shipper-form-body">
                <div className="form-row form-row-2">
                  <div className="form-field">
                    <label>Name <span className="required">*</span></label>
                    <input
                      type="text" name="name" value={form.name} onChange={handleChange}
                      placeholder="Company or shipper name"
                      className={formErrors.name ? 'input-error' : ''}
                      disabled={viewMode}
                    />
                    {formErrors.name && <span className="error-msg">{formErrors.name}</span>}
                  </div>
                  <div className="form-field">
                    <label>Contact Info</label>
                    <input
                      type="text" name="contactInfo" value={form.contactInfo} onChange={handleChange}
                      placeholder="Email address or phone number"
                      disabled={viewMode}
                    />
                  </div>
                </div>

                <hr className="shipper-form-divider" />

                <div className="form-field">
                  <label>Account Terms</label>
                  <input
                    type="text" name="accountTerms" value={form.accountTerms} onChange={handleChange}
                    placeholder="e.g., NET30, PREPAID, COD"
                    disabled={viewMode}
                  />
                </div>

                {message.text && (
                  <div className={`auth-message auth-message-${message.type}`}>
                    <span>{message.type === 'success' ? '✔' : '⚠'}</span> {message.text}
                  </div>
                )}

                <div className="shipper-form-actions">
                  {!viewMode ? (
                    <>
                      <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : (editId ? 'Update' : '+ Add')}
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                      Close
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ── Stats cards ─────────────────────────────────── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Shippers</div>
            <div className="stat-value">{shippers.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active</div>
            <div className="stat-value stat-transit">{shippers.filter(s => s.status === 'ACTIVE').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Inactive</div>
            <div className="stat-value stat-pending">{shippers.filter(s => s.status === 'INACTIVE').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Suspended</div>
            <div className="stat-value stat-delivered">{shippers.filter(s => s.status === 'SUSPENDED').length}</div>
          </div>
        </div>

        {/* ── Table section ───────────────────────────────── */}
        <div className="table-section">
          <h2 className="section-title">All Shippers</h2>

          <div className="table-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="toolbar-right">
              <div className="filter-wrapper">
                <select
                  className="status-select"
                  value={search}
                  onChange={(e) => setSearch(e.target.value === 'ALL' ? '' : e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
              <button className="btn-export" onClick={() => {
                const headers = ['Name','Contact Info','Account Terms','Status'];
                const rows = filtered.map((s) => [s.name, s.contactInfo || '', s.accountTerms || '', s.status]);
                exportCSV('shippers.csv', headers, rows);
              }}>⬇ Export</button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading shippers…</div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact Info</th>
                    <th>Account Terms</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                          {shippers.length === 0
                            ? (user?.role === 'Admin'
                              ? 'No shippers yet. Click + Add Shipper to create the first one.'
                              : 'No shippers available to display.')
                            : 'No shippers match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => {
                      const sc = STATUS_CONFIG[s.status] || { label: s.status, cls: 'status-pending' };
                      return (
                        <tr key={s.shipperID} className="table-row">
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td>{s.contactInfo || '–'}</td>
                          <td>{s.accountTerms || '–'}</td>
                          <td>
                            <span className={`status-badge ${sc.cls}`}>{sc.label}</span>
                          </td>
                          <td style={{ position: 'relative' }}>
                            <button
                              className="icon-btn"
                              aria-haspopup="true"
                              aria-expanded={openMenuId === s.shipperID}
                              onClick={() => setOpenMenuId(openMenuId === s.shipperID ? null : s.shipperID)}
                              title="Actions"
                            >
                              ⋮
                            </button>
                            {openMenuId === s.shipperID && (
                              <div className="row-action-menu" style={{ position: 'absolute', right: 0, top: '28px', background: '#fff', border: '1px solid #e6eef8', borderRadius: 8, boxShadow: '0 6px 18px rgba(15,23,42,0.08)', zIndex: 40 }}>
                                <button className="menu-item" onClick={() => handleView(s)}>View</button>
                                {user?.role === 'Admin' && (
                                  <button className="menu-item" onClick={() => navigate(`/shippers/${s.shipperID}/edit`)}>Edit</button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}