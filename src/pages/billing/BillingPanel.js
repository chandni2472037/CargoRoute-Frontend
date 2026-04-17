import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAllInvoices } from '../../api/billingApi';
import { getAllTariffs } from '../../api/billingApi';
import { getAllBillingLines } from '../../api/billingApi';
import '../../styles/Billing.css';

function fmtCurrency(val) {
  if (val == null) return '—';
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtInvoiceId(id) {
  return `INV${String(id).padStart(4, '0')}`;
}

function getStatusClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'paid')      return 'status-paid';
  if (s === 'pending')   return 'status-pending';
  if (s === 'overdue')   return 'status-overdue';
  if (s === 'cancelled') return 'status-cancelled';
  if (s === 'issued')    return 'status-issued';
  if (s === 'draft')     return 'status-draft';
  return 'status-default';
}

export default function BillingPanel() {
  const navigate = useNavigate();

  const [invoices,     setInvoices]     = useState([]);
  const [tariffs,      setTariffs]      = useState([]);
  const [billingLines, setBillingLines] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  useEffect(() => {
    Promise.all([
      getAllInvoices().catch(() => []),
      getAllTariffs().catch(() => []),
      getAllBillingLines().catch(() => []),
    ]).then(([inv, tar, lines]) => {
      setInvoices(inv);
      setTariffs(tar);
      setBillingLines(lines);
    }).catch(() => {
      setError('Could not connect to BillingService (port 9096). Make sure the service is running.');
    }).finally(() => setLoading(false));
  }, []);

  // Stats derived from data
  const totalInvoices   = invoices.length;
  const pendingInvoices = invoices.filter(r => (r.invoice?.status || '').toLowerCase() === 'pending').length;
  const paidInvoices    = invoices.filter(r => (r.invoice?.status || '').toLowerCase() === 'paid').length;
  const totalRevenue    = invoices
    .filter(r => (r.invoice?.status || '').toLowerCase() === 'paid')
    .reduce((sum, r) => sum + (r.invoice?.totalAmount || 0), 0);
  const activeTariffs   = tariffs.filter(t => (t.status || '').toLowerCase() === 'active').length;

  // Recent 5 invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.invoice?.issuedAt || 0) - new Date(a.invoice?.issuedAt || 0))
    .slice(0, 5);

  return (
    <Layout>
      <div className="billing-page">

        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">💳 Billing Panel</h1>
            <p className="page-subtitle">Manage tariffs, billing lines, and invoices for shipper accounts</p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="error-banner">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Stats */}
        <div className="billing-stats-grid">
          <div className="stat-card">
            <span className="stat-icon">🧾</span>
            <div className="stat-label">Total Invoices</div>
            <div className="stat-value">{loading ? '—' : totalInvoices}</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏳</span>
            <div className="stat-label">Pending Invoices</div>
            <div className="stat-value stat-pending">{loading ? '—' : pendingInvoices}</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-label">Paid Invoices</div>
            <div className="stat-value stat-paid">{loading ? '—' : paidInvoices}</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📋</span>
            <div className="stat-label">Active Tariffs</div>
            <div className="stat-value stat-active">{loading ? '—' : activeTariffs}</div>
          </div>
        </div>

        {/* Revenue summary */}
        <div className="invoice-total-bar" style={{ marginBottom: 24 }}>
          <div>
            <div className="invoice-total-label">Total Collected Revenue (Paid Invoices)</div>
            <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>
              {billingLines.length} billing line{billingLines.length !== 1 ? 's' : ''} across all loads
            </div>
          </div>
          <div className="invoice-total-amount">{loading ? '…' : fmtCurrency(totalRevenue)}</div>
        </div>

        {/* Quick-access tiles */}
        <div className="billing-quick-grid">
          <Link to="/billing/invoices" className="quick-card">
            <div className="quick-card-icon">🧾</div>
            <div>
              <div className="quick-card-title">Invoices</div>
              <div className="quick-card-desc">View, generate &amp; manage shipper invoices</div>
            </div>
          </Link>
          <Link to="/billing/billing-lines" className="quick-card">
            <div className="quick-card-icon">📄</div>
            <div>
              <div className="quick-card-title">Billing Lines</div>
              <div className="quick-card-desc">Review &amp; reconcile billing entries per booking</div>
            </div>
          </Link>
          <Link to="/billing/tariffs" className="quick-card">
            <div className="quick-card-icon">💹</div>
            <div>
              <div className="quick-card-title">Tariffs</div>
              <div className="quick-card-desc">Manage rate cards, service types &amp; charges</div>
            </div>
          </Link>
        </div>

        {/* Recent Invoices table */}
        <div className="table-section">
          <div className="section-header">
            <span className="section-title">Recent Invoices</span>
            <button className="btn-view" onClick={() => navigate('/billing/invoices')}>
              View All →
            </button>
          </div>

          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : recentInvoices.length === 0 ? (
            <div className="empty-state">No invoices yet. Generate your first invoice from the Invoices section.</div>
          ) : (
            <div className="table-wrapper">
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Shipper</th>
                    <th>Period</th>
                    <th>Issued At</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((r) => {
                    const inv = r.invoice || {};
                    const shipper = r.shipper || {};
                    return (
                      <tr key={inv.invoiceID}>
                        <td className="billing-id-cell">{fmtInvoiceId(inv.invoiceID)}</td>
                        <td>{shipper.name || `Shipper #${inv.shipperID}`}</td>
                        <td style={{ fontSize: 13 }}>
                          {fmtDate(inv.periodStart)} – {fmtDate(inv.periodEnd)}
                        </td>
                        <td style={{ fontSize: 13 }}>{fmtDate(inv.issuedAt)}</td>
                        <td className="amount-cell">{fmtCurrency(inv.totalAmount)}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(inv.status)}`}>
                            {inv.status || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-view"
                            onClick={() => navigate(`/billing/invoices/${inv.invoiceID}`)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
