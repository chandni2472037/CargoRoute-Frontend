import React, { useEffect, useState, useCallback } from 'react';
import '../../styles/Billing.css';
import { getAllVehicles, createVehicle, getVehicleById } from '../../api/fleetApi';

const VEHICLE_TYPES  = ['Van', 'Truck', 'Trailer'];
const STATUS_OPTIONS = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED'];
const EMPTY_FORM = {
  regNumber: '', type: 'Truck', maxWeightKg: '', maxVolumeM3: '', status: 'AVAILABLE', lastMaintenanceAt: ''
};

const statusColor = (s) => {
  switch (String(s).toUpperCase()) {
    case 'AVAILABLE':   return 'status-active';
    case 'IN_USE':      return 'status-paid';
    case 'MAINTENANCE': return 'status-pending';
    case 'RETIRED':     return 'status-cancelled';
    default:            return 'status-draft';
  }
};

export default function VehiclesList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [search, setSearch]     = useState('');
  const [filterType, setFilterType]       = useState('ALL');
  const [filterStatus, setFilterStatus]   = useState('ALL');

  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [saving, setSaving]         = useState(false);

  const [showDetail, setShowDetail] = useState(false);
  const [detailVehicle, setDetailVehicle] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadVehicles = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getAllVehicles();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };

  const openCreate = () => {
    setForm(EMPTY_FORM); setFormError(''); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.regNumber.trim() || !form.maxWeightKg || !form.maxVolumeM3) {
      setFormError('Registration number, max weight and max volume are required.'); return;
    }
    setSaving(true); setFormError('');
    try {
      await createVehicle({
        ...form,
        maxWeightKg: parseFloat(form.maxWeightKg),
        maxVolumeM3: parseFloat(form.maxVolumeM3),
        lastMaintenanceAt: form.lastMaintenanceAt || null
      });
      flash('Vehicle registered.');
      setShowModal(false); loadVehicles();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const openDetail = async (v) => {
    setLoadingDetail(true); setShowDetail(true); setDetailVehicle(null);
    try {
      const detail = await getVehicleById(v.vehicleID);
      setDetailVehicle(detail);
    } catch (e) { setError(e.message); setShowDetail(false); }
    finally { setLoadingDetail(false); }
  };

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    const matchQ = (v.regNumber||'').toLowerCase().includes(q) || (v.type||'').toLowerCase().includes(q) || (v.status||'').toLowerCase().includes(q);
    const matchType   = filterType   === 'ALL' || v.type   === filterType;
    const matchStatus = filterStatus === 'ALL' || v.status === filterStatus;
    return matchQ && matchType && matchStatus;
  });

  return (
    <div className="billing-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fleet Vehicles</h1>
          <p className="page-subtitle">Register and monitor fleet vehicle inventory</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Register Vehicle</button>
      </div>

      {error   && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="billing-stats-grid">
        <div className="stat-card"><span className="stat-label">Total Vehicles</span><span className="stat-value">{vehicles.length}</span></div>
        <div className="stat-card"><span className="stat-label">Available</span><span className="stat-value">{vehicles.filter(v => v.status === 'AVAILABLE').length}</span></div>
        <div className="stat-card"><span className="stat-label">In Use</span><span className="stat-value">{vehicles.filter(v => v.status === 'IN_USE').length}</span></div>
        <div className="stat-card"><span className="stat-label">Under Maintenance</span><span className="stat-value">{vehicles.filter(v => v.status === 'MAINTENANCE').length}</span></div>
      </div>

      <div className="table-section">
        <div className="section-header">
          <span className="section-title">Vehicle Registry</span>
          <span className="section-badge">{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-toolbar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by reg number, type, status…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-wrapper" style={{ display: 'flex', gap: '8px' }}>
            <select className="status-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="ALL">All Types</option>
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="status-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state">Loading vehicles…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No vehicles found.</div>
          ) : (
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Vehicle ID</th>
                  <th>Reg Number</th>
                  <th>Type</th>
                  <th>Max Weight (kg)</th>
                  <th>Max Volume (m³)</th>
                  <th>Assigned Driver</th>
                  <th>Last Maintenance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.vehicleID}>
                    <td className="billing-id-cell">#{v.vehicleID}</td>
                    <td><strong>{v.regNumber}</strong></td>
                    <td>{v.type}</td>
                    <td className="amount-cell">{v.maxWeightKg?.toLocaleString() ?? '—'}</td>
                    <td className="amount-cell">{v.maxVolumeM3 ?? '—'}</td>
                    <td>{v.driver ? v.driver.name : '—'}</td>
                    <td>{v.lastMaintenanceAt ? new Date(v.lastMaintenanceAt).toLocaleDateString() : '—'}</td>
                    <td><span className={`status-badge ${statusColor(v.status)}`}>{v.status}</span></td>
                    <td>
                      <button className="btn-view" onClick={() => openDetail(v)}>👁 View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Register Vehicle Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Register New Vehicle</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {formError && <div className="error-banner">{formError}</div>}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Registration Number *</label>
                    <input required value={form.regNumber} onChange={e => setForm(f => ({...f, regNumber: e.target.value}))} placeholder="e.g. MH-12-AB-1234" />
                  </div>
                  <div className="form-field">
                    <label>Vehicle Type *</label>
                    <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                      {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Max Weight (kg) *</label>
                    <input required type="number" min="0" step="0.01" value={form.maxWeightKg} onChange={e => setForm(f => ({...f, maxWeightKg: e.target.value}))} placeholder="5000" />
                  </div>
                  <div className="form-field">
                    <label>Max Volume (m³) *</label>
                    <input required type="number" min="0" step="0.01" value={form.maxVolumeM3} onChange={e => setForm(f => ({...f, maxVolumeM3: e.target.value}))} placeholder="20" />
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
                    <label>Last Maintenance Date</label>
                    <input type="datetime-local" value={form.lastMaintenanceAt} onChange={e => setForm(f => ({...f, lastMaintenanceAt: e.target.value}))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Register Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Vehicle Detail</h2>
              <button className="modal-close" onClick={() => setShowDetail(false)}>✕</button>
            </div>
            <div className="modal-body">
              {loadingDetail ? (
                <div className="empty-state">Loading…</div>
              ) : detailVehicle ? (
                <>
                  <div className="form-row-2">
                    <div className="form-field">
                      <label>Reg Number</label>
                      <p style={{margin:0, fontWeight:600}}>{detailVehicle.regNumber}</p>
                    </div>
                    <div className="form-field">
                      <label>Type</label>
                      <p style={{margin:0}}>{detailVehicle.type}</p>
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-field">
                      <label>Max Weight</label>
                      <p style={{margin:0}}>{detailVehicle.maxWeightKg?.toLocaleString()} kg</p>
                    </div>
                    <div className="form-field">
                      <label>Max Volume</label>
                      <p style={{margin:0}}>{detailVehicle.maxVolumeM3} m³</p>
                    </div>
                  </div>
                  {detailVehicle.driver && (
                    <div className="form-field">
                      <label>Assigned Driver</label>
                      <p style={{margin:0}}><strong>{detailVehicle.driver.name}</strong> — {detailVehicle.driver.licenseNo} — {detailVehicle.driver.mobileNumber}</p>
                    </div>
                  )}
                  {detailVehicle.availabilities?.length > 0 && (
                    <div className="form-field">
                      <label>Availability Windows ({detailVehicle.availabilities.length})</label>
                      <table className="billing-table" style={{ fontSize: '0.82rem' }}>
                        <thead><tr><th>Start</th><th>End</th><th>Status</th></tr></thead>
                        <tbody>
                          {detailVehicle.availabilities.map(a => (
                            <tr key={a.id}>
                              <td>{a.startTime ? new Date(a.startTime).toLocaleString() : '—'}</td>
                              <td>{a.endTime   ? new Date(a.endTime).toLocaleString()   : '—'}</td>
                              <td><span className={`status-badge ${statusColor(a.status)}`}>{a.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : null}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetail(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
