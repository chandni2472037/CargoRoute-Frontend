import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { getMyNotifications } from "../../api/notificationApi";
import "../../styles/Notifications.css";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const res = await getMyNotifications();
    setNotifications(res.data);
};

  const unread = notifications.filter(n => n.status === "UNREAD");
  const read = notifications.filter(n => n.status === "READ");

  return (
    <Layout>
      <div className="notifications-page">

        {/* Header */}
        <div className="notifications-header">
          <div>
            <h2>Notifications</h2>
            <p>Stay updated on important events</p>
          </div>

          <div className="notification-actions">
            <button>✓ Mark All Read</button>
            <button className="danger">🗑 Clear All</button>
          </div>
        </div>

        {/* Unread */}
        <div className="notification-section">
          <h4>🔔 Unread ({unread.length})</h4>

          {unread.map(n => (
            <div key={n.notificationID} className="notification-card unread">
              <span className={`dot ${n.category.toLowerCase()}`} />

              <div className="content">
                <div className="title">
                  <strong>{n.category}</strong>
                  <span className="time">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p>{n.message}</p>
              </div>

              <span className="check">✓</span>
            </div>
          ))}
        </div>

        {/* Read */}
        <div className="notification-section">
          <h4>Read Notifications</h4>

          {read.map(n => (
            <div key={n.notificationID} className="notification-card">
              <div className="content">
                <strong>{n.category}</strong>
                <p>{n.message}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}