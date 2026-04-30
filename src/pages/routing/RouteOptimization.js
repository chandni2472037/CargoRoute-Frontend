import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAllRoutes } from '../../api/routingApi';
import '../styles/Routing.css';

export default function RouteOptimization() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const navigate = useNavigate();

  const normalizeStatus = (status) => {
    const s = (status || '').toString().trim().toLowerCase().replace(/\s+/g, '_');
    if (s === 'planned') return 'planned';
    if (s === 'in_progress') return 'in_progress';
    if (s === 'completed') return 'completed';
    return 'unknown';
  };

  // Fetch all routes
  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllRoutes();
      const normalizedRoutes = (Array.isArray(data) ? data : []).map((route) => ({
        id: route.routeID,
        routeId: route.routeID,
        loadId: route.load?.loadID,
        loadCode: route.load?.loadCode,
        vehicleId: route.load?.vehicleID,
        status: route.status,
        totalDistance: route.distanceKm,
        estimatedDuration: route.estimatedDurationMin,
      }));
      setRoutes(normalizedRoutes);
    } catch (err) {
      setError('Failed to load routes. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  // Filter routes based on search and status
  const filteredRoutes = routes.filter((route) => {
    const matchesSearch =
      route.routeId?.toString().includes(searchTerm) ||
      route.loadCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.vehicleId?.toString().includes(searchTerm) ||
      route.loadId?.toString().includes(searchTerm);

    const matchesStatus =
      filterStatus === 'all' || normalizeStatus(route.status) === filterStatus;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, routes]);

  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoutes = filteredRoutes.slice(
    startIndex,
    endIndex
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Calculate route statistics
  const stats = {
    total: routes.length,
    planned: routes.filter((r) => normalizeStatus(r.status) === 'planned').length,
    inProgress: routes.filter((r) => normalizeStatus(r.status) === 'in_progress').length,
    completed: routes.filter((r) => normalizeStatus(r.status) === 'completed').length,
    avgDistance:
      routes.length > 0
        ? (
            routes.reduce((sum, r) => sum + (r.totalDistance || 0), 0) / routes.length
          ).toFixed(2)
        : 0,
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'in_progress') return 'status-optimized';
    if (normalized === 'completed') return 'status-completed';
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

  const exportRoutes = (format) => {
    const fileDate = new Date().toISOString().slice(0, 10);
    const headers = ['Route ID', 'Load', 'Vehicle ID', 'Status', 'Distance (km)', 'Duration'];

    const rows = filteredRoutes.map((route) => [
      route.routeId || 'N/A',
      route.loadCode || route.loadId || '-',
      route.vehicleId || '-',
      route.status || 'Pending',
      route.totalDistance ? route.totalDistance.toFixed(2) : '-',
      route.estimatedDuration || '-',
    ]);

    if (format === 'excel') {
      const tsv = [
        headers.join('\t'),
        ...rows.map((row) => row.map((cell) => String(cell ?? '').replace(/\t/g, ' ')).join('\t')),
      ].join('\n');

      downloadTextFile(`\ufeff${tsv}`, `routes-${fileDate}.xls`, 'application/vnd.ms-excel;charset=utf-8;');
      return;
    }

    const csv = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    downloadTextFile(`\ufeff${csv}`, `routes-${fileDate}.csv`, 'text/csv;charset=utf-8;');
  };

  if (loading) {
    return (
      <Layout>
        <div className="routing-container">
          <div className="loading-spinner">Loading routes...</div>
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
            <h1>Route Optimization</h1>
            <p>Review and approve optimized delivery routes</p>
          </div>
          <button
            className="btn btn-primary plus-btn"
            onClick={() => navigate('/routing/routes/new')}
            title="Add Route"
          >
            +
          </button>
        </div>

        {/* STATISTICS CARDS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-summary">
              <span className="stat-label">Total Routes</span>
              <span className="stat-value stat-value-total">{stats.total}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-summary">
              <span className="stat-label">Planned</span>
              <span className="stat-value stat-value-pending">{stats.planned}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-summary">
              <span className="stat-label">In Progress</span>
              <span className="stat-value stat-value-optimized">{stats.inProgress}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-summary">
              <span className="stat-label">Completed</span>
              <span className="stat-value stat-value-completed">{stats.completed}</span>
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
            <h2 className="routing-filter-title">All Routes</h2>
            <input
              type="text"
              placeholder="Search by Route ID, Vehicle ID, or Load ID..."
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
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <details className="export-menu">
                <summary className="export-btn" aria-label="Export routes table">
                  Export
                </summary>
                <div className="export-dropdown" role="menu" aria-label="Export format">
                  <button type="button" className="export-option" onClick={() => exportRoutes('csv')}>
                    Export CSV
                  </button>
                </div>
              </details>
            </div>
          </div>

          {/* ROUTES TABLE */}
          <div className="table-container">
            <table className="routes-table">
              <thead>
                <tr>
                  <th>Route Id</th>
                  <th>Load</th>
                  <th>Vehicle Id</th>
                  <th>Status</th>
                  <th>Distance (km)</th>
                  <th>Duration</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.length > 0 ? (
                  paginatedRoutes.map((route) => (
                    <tr key={route.id}>
                      <td className="font-medium">{route.routeId || 'N/A'}</td>
                      <td>{route.loadCode || route.loadId || '-'}</td>
                      <td>{route.vehicleId || '-'}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(route.status)}`}>
                          {route.status || 'Pending'}
                        </span>
                      </td>
                      <td>{route.totalDistance ? route.totalDistance.toFixed(2) : '-'}</td>
                      <td>{route.estimatedDuration || '-'}</td>
                      <td className="actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => navigate(`/routing/route/${route.id}`)}
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
                      No routes found. Click "Add Route" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredRoutes.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredRoutes.length)} of {filteredRoutes.length}
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
