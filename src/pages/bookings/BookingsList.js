import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAllBookings, importBookingsCsv } from '../../api/bookingsApi';
import { SITE_MAP, siteName, STATUS_CONFIG } from '../../utils/constants';
import '../../styles/Bookings.css';

function formatDate(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function formatBookingId(id) {
  return `BK${String(id).padStart(3, '0')}`;
}

export default function BookingsList() {
  const navigate = useNavigate();
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [importing, setImporting]       = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef                    = useRef(null);

  const loadBookings = () => {
    setLoading(true);
    getAllBookings()
      .then(setBookings)
      .catch(() => setError('Could not load bookings. Is BookingService running on port 7070?'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBookings(); }, []);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    const shipperName = b.shipper?.name?.toLowerCase() || '';
    const matchSearch =
      !q ||
      formatBookingId(b.bookingID).toLowerCase().includes(q) ||
      shipperName.includes(q) ||
      b.commodity?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:     bookings.length,
    pending:   bookings.filter((b) => b.status === 'PENDING' || b.status === 'SUBMITTED').length,
    inTransit: bookings.filter((b) => b.status === 'IN_TRANSIT' || b.status === 'DISPATCHED').length,
    delivered: bookings.filter((b) => b.status === 'DELIVERED').length,
  };

  const handleExport = () => {
    const headers = ['Booking ID','Shipper','Origin Site','Destination Site',
      'Pickup Start','Pickup End','Weight (kg)','Volume (m³)','Pieces','Commodity','Status'];
    const rows = filtered.map((b) => [
      formatBookingId(b.bookingID), b.shipper?.name,
      siteName(b.originSiteID), siteName(b.destinationSiteID),
      b.pickupWindowStart, b.pickupWindowEnd,
      b.weightKg, b.volumeM3, b.pieces, b.commodity, b.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'bookings.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = () => {
    const header = 'shipperId,originSiteID,destinationSiteID,pickupWindowStart,pickupWindowEnd,deliveryWindowStart,deliveryWindowEnd,weightKg,volumeM3,pieces,commodity,specialHandlingFlags';
    const sample = '1,1,2,2026-04-15T10:00:00,2026-04-15T14:00:00,2026-04-16T09:00:00,2026-04-16T17:00:00,500,2.5,10,Electronics,';
    const csv  = [header, sample].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'bookings_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importBookingsCsv(file);
      setImportResult(result);
      if (result.imported > 0) loadBookings();
    } catch (err) {
      setImportResult({ error: err.response?.data?.error || 'Import failed. Check your CSV format.' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Layout>
      <div className="bookings-page">

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Bookings</h1>
            <p className="page-subtitle">Manage all freight bookings and orders</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/bookings/new')}>
            + New Booking
          </button>
        </div>

        {/* ── Stats cards ─────────────────────────────────────── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Bookings</div>
            <div className="stat-value">{stats.total}</div>
            <span className="stat-icon" role="img" aria-label="package">📦</span>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value stat-pending">{stats.pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Transit</div>
            <div className="stat-value stat-transit">{stats.inTransit}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Delivered</div>
            <div className="stat-value stat-delivered">{stats.delivered}</div>
          </div>
        </div>

        {/* ── Error banner ────────────────────────────────────── */}
        {error && (
          <div className="auth-message auth-message-error" style={{ marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Table section ───────────────────────────────────── */}
        <div className="table-section">
          <h2 className="section-title">All Bookings</h2>

          <div className="table-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by booking ID, shipper, or commodity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="toolbar-right">
              <div className="filter-wrapper">
                <span>⚙️</span>
                <select className="status-select" value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />
              <button className="btn-import" onClick={handleDownloadTemplate} title="Download CSV template">
                📋 Template
              </button>
              <button
                className="btn-import btn-import-primary"
                onClick={() => fileInputRef.current.click()}
                disabled={importing}
              >
                {importing ? '⏳ Importing…' : '⬆ Import CSV'}
              </button>
              <button className="btn-export" onClick={handleExport}>⬇ Export</button>
            </div>
          </div>

          {/* ── Import result banner ─────────────────────────── */}
          {importResult && (
            <div className={`import-result ${importResult.error ? 'import-result-error' : importResult.failed > 0 ? 'import-result-warn' : 'import-result-ok'}`}>
              {importResult.error ? (
                <span>❌ {importResult.error}</span>
              ) : (
                <span>
                  ✅ <strong>{importResult.imported}</strong> booking{importResult.imported !== 1 ? 's' : ''} imported
                  {importResult.failed > 0 && (
                    <span className="import-errors">
                      &nbsp;·&nbsp;⚠ {importResult.failed} row{importResult.failed !== 1 ? 's' : ''} failed:
                      <ul>{importResult.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                    </span>
                  )}
                </span>
              )}
              <button className="import-result-close" onClick={() => setImportResult(null)}>✕</button>
            </div>
          )}

          {loading ? (
            <div className="empty-state">Loading bookings…</div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Shipper</th>
                    <th>Origin → Destination</th>
                    <th>Pickup Window</th>
                    <th>Weight / Volume</th>
                    <th>Commodity</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-state">
                        {bookings.length === 0 ? 'No bookings yet. Create your first booking.' : 'No bookings match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((b) => {
                      const st = STATUS_CONFIG[b.status] || { label: b.status, cls: 'status-pending' };
                      return (
                        <tr key={b.bookingID} className="table-row"
                          onClick={() => navigate(`/bookings/${b.bookingID}`)}>
                          <td className="booking-id-cell">{formatBookingId(b.bookingID)}</td>
                          <td>{b.shipper?.name || '–'}</td>
                          <td>
                            <div className="route-cell">
                              <span className="route-origin">{siteName(b.originSiteID)}</span>
                              <span className="route-arrow">→</span>
                              <span className="route-dest">{siteName(b.destinationSiteID)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="window-cell">
                              <span>{formatDate(b.pickupWindowStart)}</span>
                              <span className="window-times">
                                {formatTime(b.pickupWindowStart)} – {formatTime(b.pickupWindowEnd)}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="weight-cell">
                              <span>{b.weightKg?.toLocaleString()} kg</span>
                              <span className="vol-text">{b.volumeM3} m³</span>
                            </div>
                          </td>
                          <td>{b.commodity}</td>
                          <td>
                            <span className={`status-badge ${st.cls}`}>{st.label}</span>
                          </td>
                          <td>
                            <button className="btn-view"
                              onClick={(e) => { e.stopPropagation(); navigate(`/bookings/${b.bookingID}`); }}>
                              View
                            </button>
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
