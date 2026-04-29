import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAllRoutingRules } from '../../api/routingApi';
import '../styles/Routing.css';

export default function RoutingRules() {
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [prioritySort, setPrioritySort] = useState('none');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const getRuleId = (item) => item?.ruleID ?? item?.ruleId ?? item?.id ?? null;

  const normalizeKey = (key) => String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const parseConditions = (conditionsJSON) => {
    if (!conditionsJSON) {
      return {
        origin: '-',
        destination: '-',
        commodity: '-',
        pairs: [],
      };
    }

    try {
      const parsed = JSON.parse(conditionsJSON);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid condition payload');
      }

      const entries = Object.entries(parsed);
      const usedIndexes = new Set();

      const pickValue = (candidates) => {
        const index = entries.findIndex(([key]) => candidates.includes(normalizeKey(key)));
        if (index >= 0) {
          usedIndexes.add(index);
          return entries[index][1];
        }
        return null;
      };

      const origin = pickValue(['origin', 'source', 'from']) ?? '-';
      const destination = pickValue(['destination', 'dest', 'to']) ?? '-';
      const commodity = pickValue(['commodity', 'product', 'goods', 'material']) ?? '-';

      const pairs = entries.map(([key, value]) => ({
        key,
        value: value ?? '-',
      }));

      return {
        origin,
        destination,
        commodity,
        pairs,
      };
    } catch {
      return {
        origin: '-',
        destination: '-',
        commodity: '-',
        pairs: [{ key: 'Conditions', value: String(conditionsJSON) }],
      };
    }
  };

  const getRuleStatus = (rule) => {
    const explicitStatus = String(rule?.status || '').trim().toLowerCase();
    if (explicitStatus === 'maintenance') return 'maintenance';
    if (explicitStatus === 'active') return 'active';
    if (explicitStatus === 'inactive') return 'inactive';
    return rule?.active ? 'active' : 'inactive';
  };

  const getRuleStatusBadgeClass = (status) => {
    if (status === 'active') return 'rule-status-active';
    if (status === 'maintenance') return 'rule-status-maintenance';
    return 'rule-status-inactive';
  };

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllRoutingRules();
      setRules(data);
    } catch (err) {
      setError('Failed to load routing rules. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Filter
  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      rule.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(getRuleId(rule) ?? '').includes(searchTerm) ||
      String(rule.priority ?? '').includes(searchTerm);

    const matchesActive =
      filterActive === 'all' ||
      (filterActive === 'active' && rule.active === true) ||
      (filterActive === 'inactive' && rule.active === false);

    return matchesSearch && matchesActive;
  });

  // Sort by priority
  const sortedRules = [...filteredRules].sort((a, b) => {
    if (prioritySort === 'high') return (b.priority ?? 0) - (a.priority ?? 0);
    if (prioritySort === 'low') return (a.priority ?? 0) - (b.priority ?? 0);
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedRules.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRules = sortedRules.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterActive, prioritySort]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Stats
  const stats = {
    total: rules.length,
    active: rules.filter((r) => r.active === true).length,
    inactive: rules.filter((r) => r.active === false).length,
    highPriority: rules.filter((r) => (r.priority ?? 0) >= 8).length,
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

  const exportRules = () => {
    const fileDate = new Date().toISOString().slice(0, 10);
    const headers = ['Rule ID', 'Name', 'Priority', 'Conditions', 'Active'];
    const rows = sortedRules.map((rule) => [
      getRuleId(rule) ?? '',
      rule.name ?? '',
      rule.priority ?? '',
      rule.conditionsJSON ?? '',
      rule.active ? 'Yes' : 'No',
    ]);
    const csv = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');
    downloadTextFile(`\ufeff${csv}`, `routing-rules-${fileDate}.csv`, 'text/csv;charset=utf-8;');
  };

  if (loading) {
    return (
      <Layout>
        <div className="routing-container">
          <div className="loading-spinner">Loading routing rules...</div>
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
            <h1>Routing Rules</h1>
            <p>Manage and configure automated routing rules</p>
          </div>
          <button
            className="btn btn-primary plus-btn"
            onClick={() => navigate('/routing/rules/new')}
            title="Add Rule"
          >
            +
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-summary">
              <span className="stat-label">Total Rules</span>
              <span className="stat-value stat-value-total">{stats.total}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-summary">
              <span className="stat-label">Active</span>
              <span className="stat-value stat-value-completed">{stats.active}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-summary">
              <span className="stat-label">Inactive</span>
              <span className="stat-value stat-value-pending">{stats.inactive}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-summary">
              <span className="stat-label">High Priority</span>
              <span className="stat-value stat-value-optimized">{stats.highPriority}</span>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}

        <div className="routing-table-section">
          {/* FILTERS */}
          <div className="filters-section">
            <h2 className="routing-filter-title">All Rules</h2>
            <input
              type="text"
              placeholder="Search by Rule ID or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input load-search-input"
            />
            <div className="filters-actions">
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <details className="export-menu">
                <summary className="export-btn" aria-label="Export rules table">
                  Export
                </summary>
                <div className="export-dropdown" role="menu">
                  <button type="button" className="export-option" onClick={exportRules}>
                    Export CSV
                  </button>
                </div>
              </details>
            </div>
          </div>

          {/* TABLE */}
          <div className="table-container">
            <table className="routes-table routing-rules-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Name</th>
                  <th>
                    <div className="table-sort-header">
                      <span>Priority</span>
                      <select
                        className="table-sort-select"
                        value={prioritySort}
                        onChange={(e) => setPrioritySort(e.target.value)}
                        aria-label="Sort by priority"
                      >
                        <option value="none">▼</option>
                        <option value="high">Highest</option>
                        <option value="low">Lowest</option>
                      </select>
                    </div>
                  </th>
                  <th>Conditions</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRules.length > 0 ? (
                  paginatedRules.map((rule) => {
                    const conditionData = parseConditions(rule.conditionsJSON);
                    const status = getRuleStatus(rule);

                    return (
                    <tr key={getRuleId(rule) ?? `rule-${rule.name || 'unknown'}`}>
                      <td className="font-medium">{getRuleId(rule) ?? '-'}</td>
                      <td>{rule.name || '-'}</td>
                      <td className="priority-cell">{rule.priority ?? '-'}</td>
                      <td className="conditions-cell">
                        <div className="conditions-structured" aria-label="Rule conditions">
                          <div className="condition-item">
                            <span className="condition-key">Origin</span>
                            <span className="condition-value">{String(conditionData.origin)}</span>
                          </div>
                          <div className="condition-item">
                            <span className="condition-key">Destination</span>
                            <span className="condition-value">{String(conditionData.destination)}</span>
                          </div>
                          <div className="condition-item">
                            <span className="condition-key">Commodity</span>
                            <span className="condition-value">{String(conditionData.commodity)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge ${getRuleStatusBadgeClass(status)}`}>
                          {status === 'maintenance' ? 'Maintenance' : status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => {
                            const ruleId = getRuleId(rule);
                            if (ruleId !== null && ruleId !== undefined && ruleId !== '') {
                              navigate(`/routing/rules/${ruleId}`);
                            }
                          }}
                          disabled={getRuleId(rule) === null || getRuleId(rule) === undefined || getRuleId(rule) === ''}
                          aria-label="View"
                        >
                          ⋯
                        </button>
                      </td>
                    </tr>
                  );})
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      No routing rules found. Click "+" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {sortedRules.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {startIndex + 1}–{Math.min(endIndex, sortedRules.length)} of {sortedRules.length}
              </div>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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
