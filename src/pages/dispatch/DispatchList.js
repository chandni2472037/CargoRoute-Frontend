import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAllDispatches } from '../../api/dispatchApi';
import { DISPATCH_STATUS_CONFIG } from '../../utils/constants';
import '../../styles/Bookings.css';

// ── Formatters ───────────────────────────────────────────────────────────────

function formatDispatchId(id) {
  return `DS${String(id).padStart(4, '0')}`;
}

function formatLoadId(id) {
  return id ? `LD${String(id).padStart(4, '0')}` : '–';
}

function formatDateTime(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DispatchList() {
  const navigate = useNavigate();

  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadDispatches = useCallback(() => {
    setLoading(true);
    setError('');
    getAllDispatches()
      .then(setDispatches)
      .catch(() => setError('Could not load dispatches. Is DispatchService running?'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDispatches(); }, [loadDispatches]);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = dispatches.filter((item) => {
    const d = item.dispatch || {};
    const l = item.load     || {};
    const v = item.vehicle  || {};
    const q = search.toLowerCase().trim();

    const matchSearch =
      !q ||
      formatDispatchId(d.dispatchID).toLowerCase().includes(q) ||
      formatLoadId(d.loadID).toLowerCase().includes(q) ||
      (l.loadCode || '').toLowerCase().includes(q) ||
      (v.regNumber || '').toLowerCase().includes(q) ||
      (d.assignedBy || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = {
    total:      dispatches.length,
    pending:    dispatches.filter((i) => ['CREATED','PENDING','ASSIGNED'].includes(i.dispatch?.status)).length,
    inProgress: dispatches.filter((i) => ['ACKNOWLEDGED','IN_PROGRESS'].includes(i.dispatch?.status)).length,
    completed:  dispatches.filter((i) => i.dispatch?.status === 'COMPLETED').length,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="bookings-page">

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Dispatch</h1>
            <p className="page-subtitle">
              Assign loads to drivers and track dispatch status
            </p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/dispatch/new')}>
            + New Dispatch
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Dispatches</div>
            <div className="stat-value">{stats.total}</div>
            <span className="stat-icon" role="img" aria-label="dispatch">📤</span>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending / Assigned</div>
            <div className="stat-value stat-pending">{stats.pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value stat-transit">{stats.inProgress}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value stat-delivered">{stats.completed}</div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="auth-message auth-message-error" style={{ marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Table Section ── */}
        <div className="table-section">
          <h2 className="section-title">All Dispatches</h2>

          <div className="table-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by dispatch ID, load code, vehicle, or assigned by…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="toolbar-right">
              <div className="filter-wrapper">
                <span>⚙️</span>
                <select
                  className="status-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  {Object.entries(DISPATCH_STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <button className="btn-export" onClick={loadDispatches}>↺ Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading dispatches…</div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Dispatch ID</th>
                    <th>Load</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Assigned By</th>
                    <th>Assigned At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-state">
                        {dispatches.length === 0
                          ? 'No dispatches yet. Create one to get started.'
                          : 'No dispatches match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => {
                      const d  = item.dispatch || {};
                      const l  = item.load     || {};
                      const v  = item.vehicle  || {};
                      const dr = v.driver      || {};
                      const st = DISPATCH_STATUS_CONFIG[d.status] || { label: d.status, cls: '' };

                      return (
                        <tr
                          key={d.dispatchID}
                          className="table-row"
                          onClick={() => navigate(`/dispatch/${d.dispatchID}`)}
                        >
                          <td className="booking-id-cell">{formatDispatchId(d.dispatchID)}</td>
                          <td>
                            <div className="route-cell">
                              <span className="route-origin booking-id-cell">
                                {formatLoadId(d.loadID)}
                              </span>
                              {l.loadCode && (
                                <span className="route-arrow">{l.loadCode}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            {v.regNumber ? (
                              <div className="route-cell">
                                <span className="route-origin">{v.regNumber}</span>
                                <span className="route-arrow">{v.type || ''}</span>
                              </div>
                            ) : '–'}
                          </td>
                          <td>{dr.name || '–'}</td>
                          <td>{d.assignedBy || '–'}</td>
                          <td>{formatDateTime(d.assignedAt)}</td>
                          <td>
                            <span className={`status-badge ${st.cls}`}>{st.label}</span>
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
