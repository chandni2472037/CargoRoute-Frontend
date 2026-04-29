import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import {
  clearMyNotifications,
  getMyNotifications,
  markAllNotificationsRead,
  markOneReadAndReturn,
} from "../../api/notificationApi";
import "../../styles/Notifications.css";

const CATEGORY_META = {
  PICKUP:     { icon: "🚚", color: "#3b82f6" },
  DELIVERY:   { icon: "📦", color: "#10b981" },
  EXCEPTION:  { icon: "⚠️", color: "#ef4444" },
  INVOICE:    { icon: "🧾", color: "#f59e0b" },
  DISPATCH:   { icon: "📤", color: "#8b5cf6" },
  ASSIGNMENT: { icon: "🧩", color: "#f97316" },
  ROUTING:    { icon: "🗺️", color: "#06b6d4" },
  DEFAULT:    { icon: "🔔", color: "#6b7280" },
};

const getCategoryMeta = (cat) =>
  CATEGORY_META[(cat || "").toUpperCase()] || CATEGORY_META.DEFAULT;

const timeAgo = (dateVal) => {
  if (!dateVal) return "Just now";
  const diff = Date.now() - new Date(dateVal).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyNotifications();
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load notifications.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => (n.status || "").toUpperCase() === "UNREAD").length,
    [notifications]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notifications.filter((n) => {
      const status = (n.status || "").toUpperCase();
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      const matchesSearch =
        !q ||
        String(n.message || "").toLowerCase().includes(q) ||
        String(n.category || "").toLowerCase().includes(q) ||
        String(n.entityID ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [notifications, search, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const markRead = async (notificationId) => {
    try {
      await markOneReadAndReturn(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationID === notificationId ? { ...n, status: "READ" } : n
        )
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to mark notification as read.");
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" })));
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to mark all as read.");
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Clear all your notifications?")) return;
    try {
      await clearMyNotifications();
      setNotifications([]);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to clear notifications.");
    }
  };

  const handleExport = () => {
    const headers = ["Notification ID", "Category", "Message", "Entity ID", "Status", "Created At"];
    const rows = filtered.map((n) => [
      n.notificationID, n.category || "", n.message || "",
      n.entityID ?? "", n.status || "",
      n.createdAt ? new Date(n.createdAt).toLocaleString() : "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "notifications.csv";
    a.click();
  };

  const stats = {
    total: notifications.length,
    unread: notifications.filter((n) => (n.status || "").toUpperCase() === "UNREAD").length,
    read:   notifications.filter((n) => (n.status || "").toUpperCase() === "READ").length,
    today:  notifications.filter((n) => {
      if (!n.createdAt) return false;
      return new Date(n.createdAt).toDateString() === new Date().toDateString();
    }).length,
  };

  return (
    <Layout>
      <div className="notif-page">
        <div className="notif-page-header">
          <div>
            <h1 className="notif-title">Notifications</h1>
            <p className="notif-subtitle">
              All notifications for your account
              {unreadCount > 0 && (
                <span className="notif-unread-badge">{unreadCount} unread</span>
              )}
            </p>
          </div>
          <div className="notif-header-actions">
            <button className="notif-action-btn" onClick={markAllRead}>✓ Mark All Read</button>
            <button className="notif-action-btn notif-action-danger" onClick={clearAll}>🗑 Clear All</button>
          </div>
        </div>

        <div className="notif-stats-row">
          <div className="notif-stat"><div className="notif-stat-value">{stats.total}</div><div className="notif-stat-label">Total</div></div>
          <div className="notif-stat notif-stat-unread"><div className="notif-stat-value">{stats.unread}</div><div className="notif-stat-label">Unread</div></div>
          <div className="notif-stat notif-stat-read"><div className="notif-stat-value">{stats.read}</div><div className="notif-stat-label">Read</div></div>
          <div className="notif-stat notif-stat-today"><div className="notif-stat-value">{stats.today}</div><div className="notif-stat-label">Today</div></div>
        </div>

        {error && <div className="notif-error-banner">⚠ {error}</div>}

        <div className="notif-toolbar">
          <div className="notif-search-wrap">
            <span className="notif-search-icon">🔍</span>
            <input
              className="notif-search"
              placeholder="Search notifications…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="notif-toolbar-right">
            <select className="notif-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
            </select>
            <button className="notif-action-btn" onClick={handleExport}>⬇ Export</button>
            <button className="notif-action-btn" onClick={loadNotifications}>↻ Refresh</button>
          </div>
        </div>

        {loading ? (
          <div className="notif-empty"><div className="notif-empty-icon">🔔</div><p>Loading notifications…</p></div>
        ) : filtered.length === 0 ? (
          <div className="notif-empty"><div className="notif-empty-icon">🔔</div><p>No notifications found.</p></div>
        ) : (
          <>
            <div className="notif-list-container">
              <ul className="notif-list">
                {paginated.map((n) => {
                  const isUnread = (n.status || "").toUpperCase() === "UNREAD";
                  const meta = getCategoryMeta(n.category);
                  return (
                    <li key={n.notificationID} className={`notif-list-item ${isUnread ? "notif-list-item-unread" : ""}`} onClick={() => isUnread && markRead(n.notificationID)}>
                      <span className="notif-list-icon" style={{ color: meta.color }}>{meta.icon}</span>
                      <div className="notif-list-body">
                        <p className={`notif-list-message ${isUnread ? "notif-list-message-bold" : ""}`}>{n.message}</p>
                        <div className="notif-list-meta">
                          <span className="notif-list-category">{(n.category || "GENERAL").toUpperCase()}</span>
                          <span className="notif-list-dot">•</span>
                          <span className="notif-list-time">{timeAgo(n.createdAt)}</span>
                          {n.entityID && (
                            <><span className="notif-list-dot">•</span><span className="notif-list-entity">#{n.entityID}</span></>
                          )}
                        </div>
                      </div>
                      {isUnread && <span className="notif-unread-dot" />}
                    </li>
                  );
                })}
              </ul>
            </div>

            {filtered.length > PAGE_SIZE && (
              <div className="notif-pagination">
                <button className="npag-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>‹ Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`npag-btn ${p === currentPage ? "npag-active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
                <button className="npag-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next ›</button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}