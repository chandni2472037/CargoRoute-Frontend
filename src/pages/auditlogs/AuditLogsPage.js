import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import { getAllAuditLogs } from "../../api/auditLogsApi";
import axios from "axios";
import "../../styles/Bookings.css";

function formatDateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [timeSort, setTimeSort] = useState("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  const loadAuditLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllAuditLogs();
      const sorted = [...data].sort((a, b) => {
        const ta = new Date(a.timestamp || 0).getTime();
        const tb = new Date(b.timestamp || 0).getTime();
        return tb - ta;
      });
      setLogs(sorted);
    } catch (err) {
      setLogs([]);
      setError(
        err?.response?.data?.message ||
          "Unable to fetch audit logs right now. Please try again shortly."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadUsersMap = async () => {
    try {
      const res = await axios.get("http://localhost:8080/cargoRoute/user/getAllUsers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const rows = Array.isArray(res.data) ? res.data : [];
      const map = {};
      rows.forEach((u) => {
        if (u?.userID != null) {
          map[String(u.userID)] = u.name || `User ${u.userID}`;
        }
      });
      setUserMap(map);
    } catch {
      setUserMap({});
    }
  };

  useEffect(() => {
    loadAuditLogs();
    loadUsersMap();
  }, []);

  const resolveUserName = (id) => {
    if (id == null) return "-";
    return userMap[String(id)] || `User ${id}`;
  };

  const actionOptions = useMemo(() => {
    const set = new Set(logs.map((x) => x.action).filter(Boolean));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = logs.filter((l) => {
      const matchesSearch =
        !q ||
        String(l.auditID || "").toLowerCase().includes(q) ||
        String(resolveUserName(l.userID) || "").toLowerCase().includes(q) ||
        String(resolveUserName(l.resourceID) || "").toLowerCase().includes(q) ||
        (l.resourceType || "").toLowerCase().includes(q) ||
        (l.details || "").toLowerCase().includes(q);
      const matchesAction = actionFilter === "ALL" || l.action === actionFilter;
      return matchesSearch && matchesAction;
    });
    rows.sort((a, b) => {
      const ta = new Date(a.timestamp || 0).getTime();
      const tb = new Date(b.timestamp || 0).getTime();
      return timeSort === "ASC" ? ta - tb : tb - ta;
    });
    return rows;
  }, [logs, search, actionFilter, timeSort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, actionFilter, timeSort]);

  const exportAuditLogs = () => {
    const headers = [
      "Action Taker",
      "Action",
      "Resource",
      "User Affected",
      "Details",
      "Timestamp",
    ];

    const rows = filtered.map((l) => [
      resolveUserName(l.userID),
      l.action || "-",
      l.resourceType || "-",
      resolveUserName(l.resourceID),
      l.details || "-",
      formatDateTime(l.timestamp),
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <Layout>
      <div className="bookings-page">
        <div className="page-header">
          <div>
            <div className="page-title-group">
              <span className="page-title-icon">🧾</span>
              <h1 className="page-title">Audit Logs</h1>
            </div>
            <p className="page-subtitle">Track system changes and actions across services</p>
          </div>
        </div>

        {error && (
          <div className="auth-message auth-message-error" style={{ marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}

        <div className="table-section">
          <h2 className="section-title">All Audit Logs</h2>

          <div className="table-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by audit id, action taker, affected user, resource, details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="toolbar-right">
              <div className="filter-wrapper">
                <span>🏷️</span>
                <select
                  className="status-select"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                >
                  <option value="ALL">All Actions</option>
                  {actionOptions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn-export" onClick={exportAuditLogs}>⬇ Export</button>
              <button className="btn-export" onClick={loadAuditLogs}>↻ Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading audit logs…</div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    {/* <th>Audit ID</th> */}
                    <th>Action Taker</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>User Affected</th>
                    <th>Details</th>
                    <th
                      onClick={() => setTimeSort((prev) => (prev === "DESC" ? "ASC" : "DESC"))}
                      style={{ cursor: "pointer", userSelect: "none" }}
                      title="Sort by timestamp"
                    >
                      Timestamp {timeSort === "DESC" ? "↓" : "↑"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-state">
                        No audit logs found for current filter.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((log) => (
                      <tr key={log.auditID || `${log.userID}-${log.timestamp}-${log.action}`}>
                        {/* <td>{log.auditID ?? "-"}</td> */}
                        <td>{resolveUserName(log.userID)}</td>
                        <td>{log.action || "-"}</td>
                        <td>{log.resourceType || "-"}</td>
                        <td>{resolveUserName(log.resourceID)}</td>
                        <td title={log.details || ""}>{log.details || "-"}</td>
                        <td>{formatDateTime(log.timestamp)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

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
                  className={`pagination-btn ${currentPage === page ? "pagination-btn-active" : ""}`}
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
