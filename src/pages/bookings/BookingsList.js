import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAllBookings, importBookingsCsv } from '../../api/bookingsApi';
import { siteName, STATUS_CONFIG } from '../../utils/constants';
import { exportCSV } from '../../utils/csvExport';
import '../../styles/Bookings.css';
import { AuthContext } from '../../auth/AuthContext';
import Pagination from '../../components/Pagination';

function formatBookingId(id) {
  return `BK${String(id).padStart(3, '0')}`;
}

export default function BookingsList() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const ALLOWED_CREATE_ROLES = ['Admin', 'Shipper'];
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [importing, setImporting]       = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef                    = useRef(null);
  const [currentPage, setCurrentPage]   = useState(1);
  const PAGE_SIZE = 4;
  const [openMenuId, setOpenMenuId] = useState(null);

  const loadBookings = () => {
    setLoading(true);
    getAllBookings()
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBookings(); }, []);

  // Reset to first page whenever search/filter changes
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = {
    total:     bookings.length,
    pending:   bookings.filter((b) => b.status === 'PENDING' || b.status === 'SUBMITTED').length,
    inTransit: bookings.filter((b) => b.status === 'IN_TRANSIT' || b.status === 'DISPATCHED').length,
    delivered: bookings.filter((b) => b.status === 'DELIVERED').length,
  };

  const handleExport = () => {
    const headers = ['Booking ID','Shipper','Origin Site','Destination Site',
      'Pickup Start','Pickup End','Weight (kg)','Volume (m³)','Units','Commodity','Status'];
    const rows = filtered.map((b) => [
      formatBookingId(b.bookingID), b.shipper?.name,
      siteName(b.originSiteID), siteName(b.destinationSiteID),
      b.pickupWindowStart, b.pickupWindowEnd,
      b.weightKg, b.volumeM3, b.pieces, b.commodity, b.status,
    ]);
    exportCSV('bookings.csv', headers, rows);
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
    // Frontend: validate file extension (and optionally MIME) before sending to backend
    if (!file.name || !file.name.toLowerCase().endsWith('.csv')) {
      setImportResult({ error: 'Unsupported file format. Please upload a CSV file.' });
      return;
    }
    // Read header row and validate required column headers (case-sensitive)
    const REQUIRED_HEADERS = [
      'shipperId', 'originSiteID', 'destinationSiteID',
      'pickupWindowStart', 'pickupWindowEnd',
      'deliveryWindowStart', 'deliveryWindowEnd',
      'weightKg', 'volumeM3', 'pieces', 'commodity'
    ];

    try {
      const text = await file.text();
      const firstLine = text.split(/\r?\n/)[0] || '';
      const headerCols = firstLine.split(',').map((h) => h.trim());
      const missing = REQUIRED_HEADERS.filter((h) => !headerCols.includes(h));
      if (missing.length > 0) {
        const label = missing.length === 1 ? 'Missing required column header: ' : 'Missing required column headers: ';
        setImportResult({ error: `Import failed.\n\n${label}${missing.join(', ')}\n\nNo bookings were imported.` });
        return;
      }
    } catch (err) {
      setImportResult({ error: 'Import failed. Could not read the CSV file.' });
      return;
    }

    // Header validated — proceed to upload
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
            <div className="page-title-group">
              <span className="page-title-icon">📦</span>
              <h1 className="page-title">Bookings</h1>
            </div>
            <p className="page-subtitle">Manage all freight bookings and orders</p>
          </div>
          {ALLOWED_CREATE_ROLES.includes(user?.role) && (
            <button className="btn-primary" title="New Booking" onClick={() => navigate('/bookings/new')} style={{ fontSize: 22, lineHeight: 1, padding: '6px 16px' }}>
              +
            </button>
          )}
        </div>

        {/* ── Stats cards ─────────────────────────────────────── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Bookings</div>
            <div className="stat-value">{stats.total}</div>
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
                <select className="status-select" value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">Status</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              {ALLOWED_CREATE_ROLES.includes(user?.role) && (
                <>
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
                </>
              )}
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
                    <th>Booking Id</th>
                    <th>Shipper</th>
                    <th>Origin</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        {bookings.length === 0
                          ? (ALLOWED_CREATE_ROLES.includes(user?.role)
                              ? 'No bookings yet. Create your first booking.'
                              : 'No bookings available to display.')
                          : 'No bookings match your search.'}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((b) => {
                      const st = STATUS_CONFIG[b.status] || { label: b.status, cls: 'status-pending' };
                      return (
                        <tr key={b.bookingID} className="table-row"
                          onClick={() => navigate(`/bookings/${b.bookingID}`)}>
                          <td className="booking-id-cell">{formatBookingId(b.bookingID)}</td>
                          <td>{b.shipper?.name || '–'}</td>
                          <td>{siteName(b.originSiteID)}</td>
                          <td>{siteName(b.destinationSiteID)}</td>
                          <td>
                            <span className={`status-badge ${st.cls}`}>{st.label}</span>
                          </td>
                          <td>
                            <div className="action-menu" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="kebab-btn"
                                aria-label="Actions"
                                onClick={() => setOpenMenuId(openMenuId === b.bookingID ? null : b.bookingID)}
                              >
                                ⋯
                              </button>
                              {openMenuId === b.bookingID && (
                                <div className="kebab-dropdown">
                                  <button
                                    className="kebab-item"
                                    onClick={() => { setOpenMenuId(null); navigate(`/bookings/${b.bookingID}`); }}
                                  >
                                    View
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}