import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAllLoads, getAllRoutes } from '../../api/routingApi';
import '../../styles/Routing.css';
 
export default function LoadPlanning() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deliverySort, setDeliverySort] = useState('none');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const navigate = useNavigate();
 
  const normalizeLoad = useCallback((item) => {
    if (!item) return null;
 
    const raw = item?.load ? { ...item.load, vehicle: item.vehicle || null } : item;
 
    const loadID = raw.loadID ?? raw.id ?? raw.loadId;
    if (!loadID) return null;
 
    return {
      ...raw,
      loadID,
      loadCode: raw.loadCode || `LOAD-${loadID}`,
      status: raw.status || 'PENDING',
      totalWeightKg: raw.totalWeightKg ?? 0,
      totalVolumeM3: raw.totalVolumeM3 ?? 0,
    };
  }, []);
 
  const deriveLoadsFromRoutes = useCallback(async () => {
    const routes = await getAllRoutes();
    const routeList = Array.isArray(routes) ? routes : (routes?.value || []);
    const byLoadId = new Map();
 
    routeList.forEach((route) => {
      const load = route?.load;
      if (!load) return;
 
      const normalized = normalizeLoad(load);
      if (normalized?.loadID && !byLoadId.has(normalized.loadID)) {
        byLoadId.set(normalized.loadID, normalized);
      }
    });
 
    return Array.from(byLoadId.values());
  }, [normalizeLoad]);
 
  // Fetch all loads
  const fetchLoads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllLoads();
      const normalizedLoads = (Array.isArray(data) ? data : [])
        .map(normalizeLoad)
        .filter(Boolean);
      setLoads(normalizedLoads);
    } catch (err) {
      try {
        const fallbackLoads = await deriveLoadsFromRoutes();
        setLoads(fallbackLoads);
        setError('Load API is temporarily unavailable. Showing loads from route data.');
      } catch (fallbackErr) {
        const apiMessage = err?.response?.data?.message || err?.response?.data?.error;
        setError(apiMessage || 'Failed to load data. Please try again.');
        console.error('Load fetch failed:', err);
        console.error('Route fallback failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, [deriveLoadsFromRoutes, normalizeLoad]);
 
  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);
 
  // Filter loads
  const filteredLoads = loads.filter((load) => {
    const matchesSearch =
      (load.loadCode && load.loadCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (load.loadID && load.loadID.toString().includes(searchTerm)) ||
      (load.totalWeightKg && load.totalWeightKg.toString().includes(searchTerm));
 
    const matchesStatus =
      filterStatus === 'all' ||
      (load.status && load.status.toLowerCase() === filterStatus.toLowerCase());
 
    return matchesSearch && matchesStatus;
  });
 
  const getSortTime = (value) => {
    if (!value) return Number.NaN;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? Number.NaN : time;
  };
 
  const sortedLoads = [...filteredLoads].sort((a, b) => {
    const compareByDirection = (aValue, bValue, direction) => {
      const aMissing = Number.isNaN(aValue);
      const bMissing = Number.isNaN(bValue);
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (direction === 'latest') return bValue - aValue;
      if (direction === 'earliest') return aValue - bValue;
      return 0;
    };
 
    if (deliverySort !== 'none') {
      const deliveryCompare = compareByDirection(
        getSortTime(a.plannedEnd),
        getSortTime(b.plannedEnd),
        deliverySort
      );
      if (deliveryCompare !== 0) return deliveryCompare;
    }
 
    return 0;
  });
 
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, deliverySort, loads]);
 
  const totalPages = Math.max(1, Math.ceil(sortedLoads.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLoads = sortedLoads.slice(startIndex, endIndex);
 
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
 
  // Calculate statistics
  const stats = {
    total: loads.length,
    planned: loads.filter((l) => (l.status || '').toUpperCase() === 'PLANNED').length,
    inTransit: loads.filter((l) => {
      const s = (l.status || '').toUpperCase();
      return s === 'IN_TRANSIT' || s === 'IN TRANSIT' || s === 'INTRANSIT';
    }).length,
    delivered: loads.filter((l) => (l.status || '').toUpperCase() === 'DELIVERED').length,
  };
 
  // Get status color
  const getStatusColor = (status) => {
    if (!status) return 'status-pending';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'planned') return 'status-optimized';
    if (lowerStatus === 'delivered') return 'status-completed';
    return 'status-pending';
  };
 
  const downloadTextFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
 
  const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
 
  const exportLoads = (format) => {
    const fileDate = new Date().toISOString().slice(0, 10);
    const headers = ['Load Code', 'Load ID', 'Weight (kg)', 'Volume (m3)', 'Status', 'Pickup', 'Delivery'];
 
    const rows = sortedLoads.map((load) => [
      load.loadCode || `LOAD-${load.loadID}`,
      load.loadID || '',
      load.totalWeightKg ?? 0,
      load.totalVolumeM3 ?? 0,
      load.status || 'Pending',
      load.plannedStart ? new Date(load.plannedStart).toLocaleDateString() : '-',
      load.plannedEnd ? new Date(load.plannedEnd).toLocaleDateString() : '-',
    ]);
 
    if (format === 'excel') {
      const tsv = [
        headers.join('\t'),
        ...rows.map((row) => row.map((cell) => String(cell ?? '').replace(/\t/g, ' ')).join('\t')),
      ].join('\n');
 
      downloadTextFile(`\ufeff${tsv}`, `loads-${fileDate}.xls`, 'application/vnd.ms-excel;charset=utf-8;');
      return;
    }
 
    const csv = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');
 
    downloadTextFile(`\ufeff${csv}`, `loads-${fileDate}.csv`, 'text/csv;charset=utf-8;');
  };
 
  if (loading) {
    return (
      <Layout>
        <div className="routing-container">
          <div className="loading-spinner">Loading loads...</div>
        </div>
      </Layout>
    );
  }
 
  return (
    <Layout>
      <div className="routing-container">
        {/* HEADER */}
        <div className="routing-header">
          <div>
            <h1>Load Planning</h1>
            <p>Consolidate bookings into optimized loads</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-primary plus-btn"
              onClick={() => navigate('/routing/load/new')}
              title="Create Load"
            >
              +
            </button>
          </div>
        </div>
 
        {/* STATISTICS CARDS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-summary">
              <span className="stat-label">Total Loads</span>
              <span className="stat-value">{stats.total}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-summary">
              <span className="stat-label">Planned</span>
              <span className="stat-value stat-value-planned">{stats.planned}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-summary">
              <span className="stat-label">Delivered</span>
              <span className="stat-value stat-value-delivered">{stats.delivered}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-summary">
              <span className="stat-label">In Transit</span>
              <span className="stat-value stat-value-intransit">{stats.inTransit}</span>
            </div>
          </div>
        </div>
 
        {/* ERROR MESSAGE */}
        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}
 
        <div className="routing-table-section">
          {/* FILTERS */}
          <div className="filters-section">
            <h2 className="routing-filter-title">All Loads</h2>
            <input
              type="text"
              placeholder="Search by Load Code, ID or Weight..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input load-search-input"
            />
            <div className="filters-actions">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="planned">Planned</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
 
              <details className="export-menu">
                <summary className="export-btn" aria-label="Export loads table">
                  Export
                </summary>
                <div className="export-dropdown" role="menu" aria-label="Export format">
                  <button type="button" className="export-option" onClick={() => exportLoads('csv')}>
                    Export CSV
                  </button>
                </div>
              </details>
            </div>
          </div>
 
          {/* LOADS TABLE */}
          <div className="table-container">
            <table className="routes-table">
              <thead>
                <tr>
                  <th>Load ID</th>
                  <th>Weight (kg)</th>
                  <th>Volume (m³)</th>
                  <th>Status</th>
                  <th>Pickup</th>
                  <th>
                    <div className="table-sort-header">
                      <span>Delivery</span>
                      <select
                        className="table-sort-select"
                        value={deliverySort}
                        onChange={(e) => setDeliverySort(e.target.value)}
                        aria-label="Sort by delivery date"
                      >
                        <option value="none">▼</option>
                        <option value="latest">Latest</option>
                        <option value="earliest">Earliest</option>
                      </select>
                    </div>
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoads.length > 0 ? (
                  paginatedLoads.map((load) => (
                    <tr key={load.loadID}>
                      <td className="font-medium">{load.loadCode || `LOAD-${load.loadID}`}</td>
                      <td>{load.totalWeightKg || 0}</td>
                      <td>{load.totalVolumeM3 ? Number(load.totalVolumeM3).toFixed(2) : 0}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(load.status)}`}>
                          {load.status || 'Pending'}
                        </span>
                      </td>
                      <td>{load.plannedStart ? new Date(load.plannedStart).toLocaleDateString() : '-'}</td>
                      <td>{load.plannedEnd ? new Date(load.plannedEnd).toLocaleDateString() : '-'}</td>
                      <td className="actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => navigate(`/routing/load/${load.loadID}`)}
                          aria-label="View"
                        >
                          ⋯
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      No loads found. Click "Create Load" to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
 
          {filteredLoads.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {startIndex + 1}-{Math.min(endIndex, sortedLoads.length)} of {sortedLoads.length}
              </div>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
 
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
 
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
 
 