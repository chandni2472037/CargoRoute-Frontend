import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAllExceptions } from '../../api/exceptionsApi';
import {
  EXCEPTION_TYPE_CONFIG,
  EXCEPTION_STATUS_CONFIG,
  siteName,
} from '../../utils/constants';
import '../../styles/Bookings.css';
import '../../styles/Exceptions.css';

// ── Formatters ──────────────────────────────────────────────────────────────

function formatExceptionId(id) {
  return `EX${String(id).padStart(4, '0')}`;
}

function formatBookingId(id) {
  return id ? `BK${String(id).padStart(4, '0')}` : '–';
}

function formatDateTime(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Component ───────────────────────────────────────────────────────────────

export default function ExceptionsList() {
  const navigate = useNavigate();

  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter]     = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // ── Data loading ────────────────────────────────────────────────────────

  const loadExceptions = useCallback(() => {
    setLoading(true);
    setError('');
    getAllExceptions()
      .then(setExceptions)
      .catch(() =>
        setError('Could not load exceptions. Is ExceptionService running?')
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadExceptions(); }, [loadExceptions]);

  // ── Filtering ───────────────────────────────────────────────────────────

  const filtered = exceptions.filter((item) => {
    const ex = item.exceptiondto || {};
    const q  = search.toLowerCase().trim();

    const matchSearch =
      !q ||
      formatExceptionId(ex.exceptionID).toLowerCase().includes(q) ||
      formatBookingId(ex.bookingId).toLowerCase().includes(q) ||
      String(ex.bookingId || '').includes(q) ||
      (ex.reportedBy || '').toLowerCase().includes(q) ||
      (ex.description || '').toLowerCase().includes(q);

    const matchType   = typeFilter === 'ALL'   || ex.type   === typeFilter;
    const matchStatus = statusFilter === 'ALL' || ex.status === statusFilter;

    return matchSearch && matchType && matchStatus;
  });

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = {
    total:    exceptions.length,
    pending:  exceptions.filter((e) => e.exceptiondto?.status === 'PENDING').length,
    inReview: exceptions.filter((e) => e.exceptiondto?.status === 'IN_REVIEW').length,
    resolved: exceptions.filter((e) => e.exceptiondto?.status === 'RESOLVED').length,
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="bookings-page exceptions-page">

        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Exceptions</h1>
            <p className="page-subtitle">
              Track and manage freight exceptions, delays and incidents
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/exceptions/new')}
          >
            ⚠️ Report Exception
          </button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Exceptions</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value stat-pending">{stats.pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Review</div>
            <div className="stat-value stat-transit">{stats.inReview}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Resolved</div>
            <div className="stat-value stat-delivered">{stats.resolved}</div>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="auth-message auth-message-error" style={{ marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Table Section ── */}
        <div className="table-section">
          <h2 className="section-title">All Exceptions</h2>

          {/* Toolbar */}
          <div className="table-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by ID, booking, reporter or description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="toolbar-right">
              <div className="filter-wrapper">
                <span>🏷️</span>
                <select
                  className="status-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  {Object.entries(EXCEPTION_TYPE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-wrapper">
                <select
                  className="status-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  {Object.entries(EXCEPTION_STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <button className="btn-export" onClick={loadExceptions}>↺ Refresh</button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="empty-state">Loading exceptions…</div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Exception ID</th>
                    <th>Type</th>
                    <th>Booking</th>
                    <th>Origin → Destination</th>
                    <th>Reported By</th>
                    <th>Reported At</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-state">
                        {exceptions.length === 0
                          ? 'No exceptions reported yet. Click "Report Exception" to get started.'
                          : 'No exceptions match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => {
                      const ex  = item.exceptiondto || {};
                      const bk  = item.bookingdto   || {};
                      const typeCfg   = EXCEPTION_TYPE_CONFIG[ex.type]     || { label: ex.type,   cls: '', icon: '' };
                      const statusCfg = EXCEPTION_STATUS_CONFIG[ex.status] || { label: ex.status, cls: '' };

                      return (
                        <tr
                          key={ex.exceptionID}
                          className="table-row"
                          onClick={() => navigate(`/exceptions/${ex.exceptionID}`)}
                        >
                          <td className="booking-id-cell">
                            {formatExceptionId(ex.exceptionID)}
                          </td>
                          <td>
                            <span className={`status-badge ${typeCfg.cls}`}>
                              {typeCfg.label}
                            </span>
                          </td>
                          <td className="booking-id-cell">
                            {formatBookingId(ex.bookingId)}
                          </td>
                          <td>
                            {bk.originSiteID ? (
                              <div className="route-cell">
                                <span className="route-origin">{siteName(bk.originSiteID)}</span>
                                <span className="route-arrow">→</span>
                                <span className="route-dest">{siteName(bk.destinationSiteID)}</span>
                              </div>
                            ) : '–'}
                          </td>
                          <td>{ex.reportedBy || '–'}</td>
                          <td>{formatDateTime(ex.reportedAt)}</td>
                          <td>
                            <span className="desc-cell" title={ex.description}>
                              {ex.description || '–'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${statusCfg.cls}`}>
                              {statusCfg.label}
                            </span>
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
