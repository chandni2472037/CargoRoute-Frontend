import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAllManifests, deleteManifest } from '../../api/manifestApi';
import '../../styles/Bookings.css';

function formatManifestId(id) {
  return `MF${String(id).padStart(4, '0')}`;
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

export default function ManifestList() {
  const navigate = useNavigate();
  const [manifests, setManifests] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadManifests = useCallback(() => {
    setLoading(true);
    setError('');
    getAllManifests()
      .then(setManifests)
      .catch(() => setError('Could not load manifests. Is ManifestService running?'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadManifests(); }, [loadManifests]);

  const filtered = manifests.filter((m) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const mf = m.manifest || {};
    return (
      formatManifestId(mf.manifestID).toLowerCase().includes(q) ||
      (mf.loadID ? formatLoadId(mf.loadID).toLowerCase().includes(q) : false) ||
      (mf.createdBy || '').toLowerCase().includes(q) ||
      (mf.manifestURI || '').toLowerCase().includes(q) ||
      (m.load?.loadCode || '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total:   manifests.length,
    today:   manifests.filter((m) => {
      const dt = m.manifest?.createdAt;
      if (!dt) return false;
      return new Date(dt).toDateString() === new Date().toDateString();
    }).length,
    withLoad: manifests.filter((m) => m.load?.loadID).length,
  };

  const handleDelete = (id) => {
    deleteManifest(id)
      .then(() => { setDeletingId(null); loadManifests(); })
      .catch(() => setDeletingId(null));
  };

  return (
    <Layout>
      <div className="bookings-page">

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Manifests</h1>
            <p className="page-subtitle">Manage shipment manifests and load documentation</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/manifests/new')}>
            + New Manifest
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Manifests</div>
            <div className="stat-value">{stats.total}</div>
            <span className="stat-icon" role="img" aria-label="manifest">📋</span>
          </div>
          <div className="stat-card">
            <div className="stat-label">Created Today</div>
            <div className="stat-value stat-transit">{stats.today}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">With Load Data</div>
            <div className="stat-value stat-delivered">{stats.withLoad}</div>
          </div>
        </div>

        {error && (
          <div className="auth-message auth-message-error" style={{ marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Table ── */}
        <div className="table-section">
          <h2 className="section-title">All Manifests</h2>

          <div className="table-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by manifest ID, load code, created by…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="toolbar-right">
              <button className="btn-export" onClick={loadManifests}>↺ Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading manifests…</div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Manifest ID</th>
                    <th>Load ID</th>
                    <th>Created By</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        {manifests.length === 0
                          ? 'No manifests yet. Create one to get started.'
                          : 'No manifests match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m) => {
                      const mf = m.manifest || {};
                      return (
                        <tr
                          key={mf.manifestID}
                          className="table-row"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/manifests/${mf.manifestID}`)}
                        >
                          <td className="booking-id-cell">{formatManifestId(mf.manifestID)}</td>
                          <td className="booking-id-cell">{formatLoadId(mf.loadID)}</td>
                          <td>{mf.createdBy || '–'}</td>
                          <td>{formatDateTime(mf.createdAt)}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn-view" onClick={() => navigate(`/manifests/${mf.manifestID}`)}>View</button>
                              {deletingId === mf.manifestID ? (
                                <>
                                  <button className="btn-view" style={{ background: '#fee2e2', color: '#b91c1c' }} onClick={() => handleDelete(mf.manifestID)}>Confirm</button>
                                  <button className="btn-view" onClick={() => setDeletingId(null)}>Cancel</button>
                                </>
                              ) : (
                                <button className="btn-view" style={{ background: '#fee2e2', color: '#b91c1c' }} onClick={() => setDeletingId(mf.manifestID)}>Delete</button>
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
        </div>
      </div>
    </Layout>
  );
}
