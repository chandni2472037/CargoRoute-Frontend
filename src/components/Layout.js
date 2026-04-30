import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import '../styles/Layout.css';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '⊞', path: '/dashboard' },
  {
    label: 'Bookings',
    icon: '📦',
    path: '/bookings',
    children: [
      { label: 'All Bookings', path: '/bookings' },
      { label: 'New Booking',  path: '/bookings/new' },
      { label: 'Shippers',     path: '/shippers' },
    ],
  },
  { label: 'Vehicles & Fleet', icon: '🚚', path: '/vehicles' },
  { label: 'Route Planning', icon: '🗺️', path: '/routes' },
  {
    label: 'Dispatch',
    icon: '📤',
    path: '/dispatch',
    children: [
      { label: 'All Dispatches',         path: '/dispatch' },
      { label: 'New Dispatch',            path: '/dispatch/new' },
      { label: 'Drivers',                 path: '/drivers' },
      { label: 'Driver Acknowledgements', path: '/driver-ack' },
    ],
  },
  { label: 'Manifests & POD', icon: '📄', path: '/manifests',
    children: [
      { label: 'All Manifests',    path: '/manifests' },
      { label: 'New Manifest',     path: '/manifests/new' },
      { label: 'Proof of Delivery', path: '/pod' },
      { label: 'Handovers',        path: '/handovers' },
    ],
  },
  {
    label: 'Exceptions & Claims',
    icon: '⚠️',
    path: '/exceptions',
    children: [
      { label: 'All Exceptions', path: '/exceptions' },
      { label: 'Report Exception', path: '/exceptions/new' },
      { label: 'Claims', path: '/claims' },
    ],
  },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutUser } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState({ '/bookings': true, '/exceptions': true, '/dispatch': true, '/manifests': true });

  const toggleMenu = (path) => {
    setExpandedMenus((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const isActive = (path) => location.pathname === path;

  const isParentActive = (item) =>
    item.children && item.children.some((c) => location.pathname.startsWith(c.path));

  return (
    <div className="layout-container">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </div>
            <div className="logo-text">
              <div className="logo-title">CargoRoute IQ</div>
              <div className="logo-subtitle">Freight Routing &amp; Load Balancer</div>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} title="Close sidebar">
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div key={item.path}>
                <div
                  className={`nav-item ${isParentActive(item) ? 'nav-item-active' : ''}`}
                  onClick={() => toggleMenu(item.path)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-chevron">
                    {expandedMenus[item.path] ? '▾' : '▸'}
                  </span>
                </div>
                {expandedMenus[item.path] && (
                  <div className="nav-submenu">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`nav-subitem ${isActive(child.path) ? 'nav-subitem-active' : ''}`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'nav-item-active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            )
          )}
        </nav>
      </aside>

      {/* ── Main area ── */}
      <div className="layout-main">
        {/* Top header */}
        <header className="top-header">
          <div className="header-left">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen((v) => !v)}
              title="Toggle sidebar"
            >
              ☰
            </button>
            <div className="header-brand">
              <span className="header-brand-icon">
                <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              </span>
              <div>
                <div className="header-brand-title">CargoRoute IQ</div>
                <div className="header-brand-sub">Freight Routing &amp; Load Balancer</div>
              </div>
            </div>
          </div>

          <div className="header-right">
            <button className="header-icon-btn" title="Notifications">
              <span role="img" aria-label="bell">🔔</span>
              <span className="badge">2</span>
            </button>
            <button className="header-icon-btn" title="Tasks">
              <span role="img" aria-label="tasks">📋</span>
              <span className="badge badge-orange">3</span>
            </button>
            <div className="header-user">
              <div className="user-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'J'}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.name || 'John Dispatcher'}</div>
                <div className="user-role">{user?.role || 'Dispatcher'}</div>
              </div>
              <button
                className="logout-btn"
                onClick={() => { logoutUser(); navigate('/login'); }}
                title="Logout"
              >
                ↩
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
}
