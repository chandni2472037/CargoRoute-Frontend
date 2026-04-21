import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  getAllClaims,
} from '../../api/exceptionsApi';
import {
  CLAIM_STATUS_CONFIG,
} from '../../utils/constants';
import '../../styles/Bookings.css';
import '../../styles/Exceptions.css';

// ── Formatters ───────────────────────────────────────────────────────────────

function formatClaimId(id) {
  return `CL${String(id).padStart(4, '0')}`;
}

function formatExceptionId(id) {
  return id ? `EX${String(id).padStart(4, '0')}` : '–';
}

function formatBookingId(id) {
  return id ? `BK${String(id).padStart(4, '0')}` : '–';
}

// ── Component ────────────────────────────────────────────────────────────────


export default function ClaimsList() {
  const navigate = useNavigate();

  // Data
  const [claims, setClaims]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Filtering
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 4;

  // Status update inline — handled on ClaimDetail page

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadClaims = useCallback(() => {
    setLoading(true);
    setError('');
    getAllClaims()
      .then(setClaims)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  // Reset to first page whenever search/filter changes
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = claims.filter((claim) => {
    const q = search.toLowerCase().trim();
    const exId  = claim.exception?.exceptiondto?.exceptionID;
    const bkId  = claim.exception?.exceptiondto?.bookingId;

    const matchSearch =
      !q ||
      formatClaimId(claim.claimID).toLowerCase().includes(q) ||
      formatExceptionId(exId).toLowerCase().includes(q) ||
      String(exId || '').includes(q) ||
      formatBookingId(bkId).toLowerCase().includes(q) ||
      String(bkId || '').includes(q);

    const matchStatus = statusFilter === 'ALL' || claim.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = {
    total:       claims.length,
    open:        claims.filter((c) => c.status === 'OPEN').length,
    underReview: claims.filter((c) => c.status === 'UNDER_REVIEW').length,
    settled:     claims.filter((c) => c.status === 'SETTLED').length,
  };



  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="bookings-page exceptions-page">

        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Claims</h1>
            <p className="page-subtitle">
              Manage compensation claims linked to freight exceptions
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-secondary"
              onClick={() => navigate('/exceptions')}
            >
              ← Exceptions
            </button>
            <button
              className="btn-primary"
              title="File Claim"
              onClick={() => navigate('/claims/new')}
              style={{ fontSize: 22, lineHeight: 1, padding: '6px 16px' }}
            >
              +
            </button>
          </div>
        </div>

        {/* ── Pagination (moved below table) ── */}

        {/* ── Stats Cards ── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Claims</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Open</div>
            <div className="stat-value stat-pending">{stats.open}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Under Review</div>
            <div className="stat-value stat-transit">{stats.underReview}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Settled</div>
            <div className="stat-value stat-delivered">{stats.settled}</div>
          </div>
        </div>

        {/* ── Table Section ── */}
        <div className="table-section">
          <h2 className="section-title">All Claims</h2>

          {/* Toolbar */}
          <div className="table-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by Claim ID, Exception ID, or Booking ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="toolbar-right">
              <div className="filter-wrapper">
                <span>🏷️</span>
                <select
                  className="status-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  {Object.entries(CLAIM_STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-message auth-message-error" style={{ marginBottom: 16 }}>
              ⚠ {error}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="empty-state">Loading claims…</div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Exception</th>
                    <th>Booking</th>
                    <th>Filed By</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        {claims.length === 0
                          ? 'No claims filed yet. Use "File Claim" to get started.'
                          : 'No claims match your search.'}
                      </td>
                    </tr>
                  ) : paginated.map((claim) => {
                    const exDto     = claim.exception?.exceptiondto || {};
                    const statusCfg = CLAIM_STATUS_CONFIG[claim.status] || { label: claim.status, cls: '' };

                    return (
                      <tr key={claim.claimID} className="table-row"
                        onClick={() => navigate(`/claims/${claim.claimID}`)}>
                        <td className="booking-id-cell">{formatClaimId(claim.claimID)}</td>
                        <td>
                          <button
                            className="btn-view"
                            onClick={(e) => { e.stopPropagation(); navigate(`/exceptions/${exDto.exceptionID}`); }}
                          >
                            {formatExceptionId(exDto.exceptionID)}
                          </button>
                        </td>
                        <td className="booking-id-cell">{formatBookingId(exDto.bookingId)}</td>
                        <td>{claim.filedBy || '–'}</td>
                        <td>
                          <span className={`status-badge ${statusCfg.cls}`}>{statusCfg.label}</span>
                        </td>
                        <td>
                          <button
                            className="btn-view"
                            onClick={(e) => { e.stopPropagation(); navigate(`/claims/${claim.claimID}`); }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {/* ── Pagination ── */}
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="pagination pagination-right">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ‹ Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'pagination-btn-active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      </div>


    </Layout>
  );
}
