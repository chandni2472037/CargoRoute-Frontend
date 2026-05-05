import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAllVehicles } from '../../api/fleetApi';
import '../../styles/Fleet.css';
 
export default function FleetRegistry() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [maintenanceSort, setMaintenanceSort] = useState('none');
  const [stats, setStats] = useState({
    total: 0,
    unavailable: 0,
    inUse: 0,
    maintenance: 0,
  });
 
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllVehicles();
      setVehicles(data);
      calculateStats(data);
      setFilteredVehicles(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);
 
  useEffect(() => {
    if (vehicles.length > 0) {
      const filtered = vehicles.filter((vehicle) => {
        const matchesSearch =
          vehicle.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (vehicle.driver?.name && vehicle.driver.name.toLowerCase().includes(searchTerm.toLowerCase()));
 
        const matchesStatus =
          filterStatus === 'all' ||
          (vehicle.status && vehicle.status.toLowerCase() === filterStatus.toLowerCase());
 
        return matchesSearch && matchesStatus;
      });
      setFilteredVehicles(filtered);
      setCurrentPage(1);
    } else {
      setFilteredVehicles([]);
      setCurrentPage(1);
    }
  }, [searchTerm, filterStatus, vehicles]);
 
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    const aTime = a?.lastMaintenanceAt ? new Date(a.lastMaintenanceAt).getTime() : Number.NaN;
    const bTime = b?.lastMaintenanceAt ? new Date(b.lastMaintenanceAt).getTime() : Number.NaN;
 
    const aMissing = Number.isNaN(aTime);
    const bMissing = Number.isNaN(bTime);
    if (aMissing && bMissing) return 0;
    if (aMissing) return 1;
    if (bMissing) return -1;
 
    if (maintenanceSort === 'latest') return bTime - aTime;
    if (maintenanceSort === 'earliest') return aTime - bTime;
 
    return 0;
  });
 
  const totalPages = Math.max(1, Math.ceil(sortedVehicles.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVehicles = sortedVehicles.slice(startIndex, endIndex);
 
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
 
  const calculateStats = (vehicleList) => {
    const stats = {
      total: vehicleList.length,
      unavailable: vehicleList.filter(v => v.status?.toUpperCase() === 'UNAVAILABLE').length,
      inUse: vehicleList.filter(v => v.status?.toUpperCase() === 'ACTIVE').length,
      maintenance: vehicleList.filter(v => v.status?.toUpperCase() === 'MAINTENANCE').length,
    };
    setStats(stats);
  };
 
  const handleAddVehicle = () => {
    navigate('/fleet/vehicles/new');
  };
 
  const handleViewVehicle = (vehicleId) => {
    navigate(`/fleet/vehicles/${vehicleId}`);
  };
 
  const getStatusBadgeClass = (status) => {
    const upperStatus = status?.toUpperCase() || 'UNKNOWN';
    if (upperStatus === 'ACTIVE') return 'status-available';
    if (upperStatus === 'UNAVAILABLE') return 'status-unavailable';
    if (upperStatus === 'MAINTENANCE') return 'status-maintenance';
    return 'status-unknown';
  };
 
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
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
 
  const exportVehicles = (format) => {
    const fileDate = new Date().toISOString().slice(0, 10);
    const headers = [
      'Registration',
      'Type',
      'Max Weight (kg)',
      'Max Volume (m3)',
      'Assigned Driver',
      'Last Maintenance',
      'Status',
    ];
 
    const rows = sortedVehicles.map((vehicle) => [
      vehicle.regNumber || '',
      vehicle.type || '',
      vehicle.maxWeightKg ?? 0,
      vehicle.maxVolumeM3 ?? 0,
      vehicle.driver?.name || 'Unassigned',
      formatDate(vehicle.lastMaintenanceAt),
      vehicle.status || 'Unknown',
    ]);
 
    if (format === 'excel') {
      const tsv = [
        headers.join('\t'),
        ...rows.map((row) => row.map((cell) => String(cell ?? '').replace(/\t/g, ' ')).join('\t')),
      ].join('\n');
 
      downloadTextFile(`\ufeff${tsv}`, `vehicles-${fileDate}.xls`, 'application/vnd.ms-excel;charset=utf-8;');
      return;
    }
 
    const csv = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');
 
    downloadTextFile(`\ufeff${csv}`, `vehicles-${fileDate}.csv`, 'text/csv;charset=utf-8;');
  };
 
  if (loading) {
    return (
      <Layout>
        <div className="fleet-container">
          <div className="loading">Loading fleet data...</div>
        </div>
      </Layout>
    );
  }
 
  return (
    <Layout>
      <div className="fleet-container fleet-registry-page">
      <div className="fleet-header">
        <div className="fleet-title-section">
          <h1 className="fleet-title">Fleet Registry</h1>
          <p className="fleet-subtitle">Manage vehicles, capacity, and availability</p>
        </div>
        <button className="btn btn-primary plus-btn" onClick={handleAddVehicle} title="Add Vehicle">
          +
        </button>
      </div>
 
      <div className="fleet-stats">
  {/* TOTAL */}
  <div className="stat-card stat-card-total">
    <div className="stat-summary">
      <span className="stat-label">Total Fleet</span>
      <span className="stat-value stat-value-total">{stats.total}</span>
    </div>
  </div>
 
  {/* UNAVAILABLE - Uses Red/Orange theme from CSS */}
  <div className="stat-card stat-card-unavailable">
    <div className="stat-summary">
      <span className="stat-label">Unavailable</span>
      <span className="stat-value stat-value-unavailable">{stats.unavailable}</span>
    </div>
  </div>
 
  {/* IN USE - Uses Blue theme from CSS */}
  <div className="stat-card stat-card-inuse">
    <div className="stat-summary">
      <span className="stat-label">In Use</span>
      <span className="stat-value stat-value-inuse">{stats.inUse}</span>
    </div>
  </div>
 
  {/* MAINTENANCE - Uses Amber theme from CSS */}
  <div className="stat-card stat-card-maintenance">
    <div className="stat-summary">
      <span className="stat-label">Maintenance</span>
      <span className="stat-value stat-value-maintenance">{stats.maintenance}</span>
    </div>
  </div>
</div>
 
      {error && (
        <div className="alert alert-error">
          <span>⚠</span> {error}
        </div>
      )}
 
      <div className="fleet-vehicles-section">
        <div className="fleet-filters-section">
          <h2 className="fleet-filter-title">All Vehicles</h2>
          <input
            type="text"
            placeholder="Search by registration, type or driver"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input fleet-search-input"
          />
          <div className="fleet-filter-actions">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter-select fleet-filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="unavailable">Unavailable</option>
              <option value="maintenance">Maintenance</option>
            </select>
 
            <details className="export-menu">
              <summary className="export-btn" aria-label="Export vehicle table">
                Export
              </summary>
              <div className="export-dropdown" role="menu" aria-label="Export format">
                <button type="button" className="export-option" onClick={() => exportVehicles('csv')}>
                  Export CSV
                </button>
              </div>
            </details>
          </div>
        </div>
 
        {filteredVehicles.length === 0 ? (
          <div className="no-vehicles">
            <p>No vehicles found</p>
            <button onClick={handleAddVehicle} className="btn-add-first">
              Add Your First Vehicle
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="vehicles-table">
                <thead>
                  <tr>
                    <th>Registration</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Assigned Driver</th>
                    <th>
                      <div className="table-sort-header">
                        <span>Last Maintenance</span>
                        <select
                          className="table-sort-select"
                          value={maintenanceSort}
                          onChange={(e) => {
                            setMaintenanceSort(e.target.value);
                            setCurrentPage(1);
                          }}
                          aria-label="Sort by last maintenance"
                        >
                          <option value="none">▼</option>
                          <option value="latest">Latest</option>
                          <option value="earliest">Earliest</option>
                        </select>
                      </div>
                    </th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVehicles.map((vehicle) => (
                    <tr key={vehicle.vehicleID} className="vehicle-row">
                      <td className="reg-number">{vehicle.regNumber}</td>
                      <td>{vehicle.type}</td>
                      <td className="capacity">
                        <div className="capacity-text">
                          {vehicle.maxWeightKg ? vehicle.maxWeightKg.toLocaleString() : 0} kg
                        </div>
                        <div className="capacity-subtext">
                          {vehicle.maxVolumeM3 || 0} m³
                        </div>
                      </td>
                      <td className="driver-name">
                        {vehicle.driver?.name || 'Unassigned'}
                      </td>
                      <td className="maintenance-date">
                        {formatDate(vehicle.lastMaintenanceAt)}
                      </td>
                      <td className="status-column">
                        <span className={`status-badge ${getStatusBadgeClass(vehicle.status)}`}>
                          {vehicle.status || 'Unknown'}
                        </span>
                      </td>
                        <td className="actions">
                          <button
                            className="action-btn view-btn"
                            onClick={() => handleViewVehicle(vehicle.vehicleID)}
                            aria-label="View"
                          >
                            ⋯
                          </button>
                          <button
                            className="action-btn edit-btn"
                            onClick={() => navigate(`/fleet/vehicles/${vehicle.vehicleID}/edit`)}
                            aria-label="Edit"
                            style={{ marginLeft: '8px' }}
                          >
                            ✎
                          </button>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
 
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {sortedVehicles.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, sortedVehicles.length)} of {sortedVehicles.length}
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
          </>
        )}
      </div>
    </div>
    </Layout>
  );
}