import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import PermissionGate from '../../auth/PermissionGate';
import { getAllInvoices, getAllBillingLines, getAllTariffs } from '../../api/billingApi';

export default function BillingClerkDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    invoices: 0,
    billingLines: 0,
    tariffs: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setStats((prev) => ({ ...prev, loading: true, error: null }));
        const [invoices, billingLines, tariffs] = await Promise.all([
          getAllInvoices().catch((e) => { console.error('Error fetching invoices:', e); return []; }),
          getAllBillingLines().catch((e) => { console.error('Error fetching billing lines:', e); return []; }),
          getAllTariffs().catch((e) => { console.error('Error fetching tariffs:', e); return []; }),
        ]);

        const invoiceCount = Array.isArray(invoices) ? invoices.length : 0;
        const billingLineCount = Array.isArray(billingLines) ? billingLines.length : 0;
        const tariffCount = Array.isArray(tariffs) ? tariffs.length : 0;

        console.log('Billing clerk dashboard loaded:', { invoices: invoiceCount, billingLines: billingLineCount, tariffs: tariffCount });

        setStats({
          invoices: invoiceCount,
          billingLines: billingLineCount,
          tariffs: tariffCount,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error loading billing clerk dashboard:', err);
        setStats((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    };

    loadMetrics();
  }, []);

  return (
    <DashboardShell
      title="Billing Clerk Dashboard"
      description="Review invoices, manage billing lines, and oversee tariff rates"
    >
      {stats.error && (
        <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          ⚠️ {stats.error}
        </div>
      )}

      <div className="dashboard-grid">
        <PermissionGate action="view" resource="invoices">
          <div
            className="dashboard-card"
            onClick={() => navigate('/billing/invoices')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/billing/invoices')}
            style={{ cursor: 'pointer' }}
            title="View invoices"
          >
            <h3>💳 Invoices</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.invoices}</div>}
            <div className="stat-meta">Pending review and reconciliation</div>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="billing-lines">
          <div
            className="dashboard-card"
            onClick={() => navigate('/billing/billing-lines')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/billing/billing-lines')}
            style={{ cursor: 'pointer' }}
            title="View billing lines"
          >
            <h3>📊 Billing Lines</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.billingLines}</div>}
            <div className="stat-meta">Line items for invoice generation</div>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="tariffs">
          <div
            className="dashboard-card"
            onClick={() => navigate('/billing/tariffs')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/billing/tariffs')}
            style={{ cursor: 'pointer' }}
            title="View tariffs"
          >
            <h3>💰 Tariffs</h3>
            {stats.loading ? <div className="stat-value">–</div> : <div className="stat-value">{stats.tariffs}</div>}
            <div className="stat-meta">Active rate schedules</div>
          </div>
        </PermissionGate>
      </div>

      <div className="dashboard-summary">
        <PermissionGate action="view" resource="billing">
          <div className="dashboard-summary-card">
            <p>📈 Financial Control</p>
            <strong>Invoice Processing</strong>
          </div>
        </PermissionGate>
        <PermissionGate action="view" resource="billing">
          <div className="dashboard-summary-card">
            <p>🔒 Access Level</p>
            <strong>Financial Records Only</strong>
          </div>
        </PermissionGate>
      </div>
    </DashboardShell>
  );
}
