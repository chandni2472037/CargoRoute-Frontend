import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  getAllInvoices,
  createInvoice,
  deleteInvoice,
} from '../../api/billingApi';
import '../../styles/Billing.css';

const STATUS_OPTIONS = ['Pending', 'Paid', 'Overdue', 'Cancelled', 'Draft', 'Issued'];

const EMPTY_FORM = {
  shipperID:   '',
  periodStart: '',
  periodEnd:   '',
  linesJSON:   '[]',
  totalAmount: '',
  issuedAt:    '',
  status:      'Pending',
};

function validate(form) {
  const errs = {};
  if (!form.shipperID || isNaN(Number(form.shipperID))) errs.shipperID   = 'Valid Shipper ID required.';
  if (!form.periodStart) errs.periodStart = 'Period start is required.';
  if (!form.periodEnd)   errs.periodEnd   = 'Period end is required.';
  if (form.periodStart && form.periodEnd && form.periodEnd < form.periodStart)
    errs.periodEnd = 'Period end must be after period start.';
  if (!form.totalAmount || Number(form.totalAmount) <= 0) errs.totalAmount = 'Total amount must be > 0.';
  if (!form.linesJSON.trim()) errs.linesJSON = 'Lines JSON is required (use [] for empty).';
  try { JSON.parse(form.linesJSON); } catch { errs.linesJSON = 'Invalid JSON format.'; }
  return errs;
}

function fmtInvId(id) { return `INV${String(id).padStart(4, '0')}`; }

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtCurrency(val) {
  if (val == null) return '—';
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export default function InvoicesList() {
  const navigate = useNavigate();

  const [invoices,     setInvoices]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [formErrors,  setFormErrors]  = useState({});
  const [saving,      setSaving]      = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getAllInvoices()
      .then(setInvoices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Stats
  const total   = invoices.length;
  const pending = invoices.filter((r) => (r.invoice?.status || '').toLowerCase() === 'pending').length;
  const paid    = invoices.filter((r) => (r.invoice?.status || '').toLowerCase() === 'paid').length;
  const overdue = invoices.filter((r) => (r.invoice?.status || '').toLowerCase() === 'overdue').length;
  const totalRev = invoices
    .filter((r) => (r.invoice?.status || '').toLowerCase() === 'paid')
    .reduce((s, r) => s + (r.invoice?.totalAmount || 0), 0);

  const filtered = invoices.filter((r) => {
    const inv     = r.invoice || {};
    const shipper = r.shipper || {};
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      fmtInvId(inv.invoiceID).toLowerCase().includes(q) ||
      (shipper.name || '').toLowerCase().includes(q) ||
      String(inv.shipperID || '').includes(q);
    const matchS =
      statusFilter === 'ALL' ||
      (inv.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchQ && matchS;
  });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    setSaving(true);
    setError('');
    try {
      const payload = {
        shipperID:   parseInt(form.shipperID, 10),
        periodStart: `${form.periodStart}T00:00:00`,
        periodEnd:   `${form.periodEnd}T23:59:59`,
        linesJSON:   form.linesJSON.trim(),
        totalAmount: parseFloat(form.totalAmount),
        issuedAt:    form.issuedAt ? `${form.issuedAt}T00:00:00` : new Date().toISOString().substring(0, 19),
        status:      form.status,
      };
      await createInvoice(payload);
      setSuccess('Invoice generated successfully.');
      setShowForm(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteInvoice(deleteTarget);
      setSuccess('Invoice deleted.');
      setDeleteTarget(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setFormErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleExport = () => {
    const headers = ['Invoice ID','Shipper','Shipper ID','Period Start','Period End','Issued At','Total Amount','Status'];
    const rows = filtered.map((r) => {
      const inv = r.invoice || {};
      const sh  = r.shipper || {};
      return [
        fmtInvId(inv.invoiceID),
        sh.name || '',
        inv.shipperID || '',
        fmtDate(inv.periodStart),
        fmtDate(inv.periodEnd),
        fmtDate(inv.issuedAt),
        inv.totalAmount || 0,
        inv.status || '',
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'invoices.csv';
    a.click();
  };

  return (
    <Layout>
      <div className="billing-page">

        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">🧾 Invoices</h1>
            <p className="page-subtitle">Generate and manage shipper invoices with billing reconciliation</p>
          </div>
          <button className="btn-primary" onClick={openCreate}>
            + Generate Invoice
          </button>
        </div>

        {error   && <div className="error-banner">⚠️ {error}</div>}
        {success && <div className="success-banner">✅ {success}</div>}

        {/* Stats */}
        <div className="billing-stats-grid">
          <div className="stat-card">
            <span className="stat-icon">🧾</span>
            <div className="stat-label">Total Invoices</div>
            <div className="stat-value">{loading ? '—' : total}</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏳</span>
            <div className="stat-label">Pending</div>
            <div className="stat-value stat-pending">{loading ? '—' : pending}</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-label">Paid</div>
            <div className="stat-value stat-paid">{loading ? '—' : paid}</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🚨</span>
            <div className="stat-label">Overdue</div>
            <div className="stat-value stat-overdue">{loading ? '—' : overdue}</div>
          </div>
        </div>

        {/* Revenue bar */}
        <div className="invoice-total-bar" style={{ marginBottom: 24 }}>
          <div className="invoice-total-label">Total Revenue Collected (Paid Invoices)</div>
          <div className="invoice-total-amount">{loading ? '…' : fmtCurrency(totalRev)}</div>
        </div>

        {/* Table */}
        <div className="table-section">
          <div className="table-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by invoice ID or shipper name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="toolbar-right">
              <div className="filter-wrapper">
                <span style={{ fontSize: 13, color: '#64748b' }}>Status:</span>
                <select
                  className="status-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All</option>
                  {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button className="btn-export" onClick={handleExport}>⬇ Export CSV</button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading invoices…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              {search || statusFilter !== 'ALL'
                ? 'No invoices match your filters.'
                : 'No invoices yet. Click "+ Generate Invoice" to create one.'}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Shipper</th>
                    <th>Period Start</th>
                    <th>Period End</th>
                    <th>Issued At</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const inv     = r.invoice || {};
                    const shipper = r.shipper || {};
                    return (
                      <tr key={inv.invoiceID}>
                        <td className="billing-id-cell">{fmtInvId(inv.invoiceID)}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {shipper.name || `Shipper #${inv.shipperID}`}
                          </div>
                          {shipper.contactInfo && (
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{shipper.contactInfo}</div>
                          )}
                        </td>
                        <td style={{ fontSize: 13 }}>{fmtDate(inv.periodStart)}</td>
                        <td style={{ fontSize: 13 }}>{fmtDate(inv.periodEnd)}</td>
                        <td style={{ fontSize: 13 }}>{fmtDate(inv.issuedAt)}</td>
                        <td className="amount-cell">{fmtCurrency(inv.totalAmount)}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(inv.status)}`}>
                            {inv.status || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="btn-view"
                              onClick={() => navigate(`/billing/invoices/${inv.invoiceID}`)}
                            >
                              View
                            </button>
                            <button
                              className="btn-icon btn-icon-danger"
                              title="Delete"
                              onClick={() => setDeleteTarget(inv.invoiceID)}
                            >🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Generate Invoice Modal ── */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Generate Invoice</h2>
                <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="form-field">
                  <label>Shipper ID <span className="required">*</span></label>
                  <input
                    type="number"
                    name="shipperID"
                    value={form.shipperID}
                    onChange={handleField}
                    placeholder="e.g. 501"
                    min="1"
                    className={formErrors.shipperID ? 'input-error' : ''}
                  />
                  {formErrors.shipperID && <span className="field-error">{formErrors.shipperID}</span>}
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label>Period Start <span className="required">*</span></label>
                    <input
                      type="date"
                      name="periodStart"
                      value={form.periodStart}
                      onChange={handleField}
                      className={formErrors.periodStart ? 'input-error' : ''}
                    />
                    {formErrors.periodStart && <span className="field-error">{formErrors.periodStart}</span>}
                  </div>
                  <div className="form-field">
                    <label>Period End <span className="required">*</span></label>
                    <input
                      type="date"
                      name="periodEnd"
                      value={form.periodEnd}
                      onChange={handleField}
                      className={formErrors.periodEnd ? 'input-error' : ''}
                    />
                    {formErrors.periodEnd && <span className="field-error">{formErrors.periodEnd}</span>}
                  </div>
                </div>

                <div className="form-field">
                  <label>Total Amount (₹) <span className="required">*</span></label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={form.totalAmount}
                    onChange={handleField}
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className={formErrors.totalAmount ? 'input-error' : ''}
                  />
                  {formErrors.totalAmount && <span className="field-error">{formErrors.totalAmount}</span>}
                </div>

                <div className="form-field">
                  <label>Billing Lines JSON <span className="required">*</span></label>
                  <textarea
                    name="linesJSON"
                    value={form.linesJSON}
                    onChange={handleField}
                    rows={4}
                    placeholder='[{"billingLineID":1,"amount":250.75}]'
                    className={formErrors.linesJSON ? 'input-error' : ''}
                    style={{ fontFamily: 'monospace', fontSize: 13 }}
                  />
                  {formErrors.linesJSON && <span className="field-error">{formErrors.linesJSON}</span>}
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label>Issued At</label>
                    <input
                      type="date"
                      name="issuedAt"
                      value={form.issuedAt}
                      onChange={handleField}
                    />
                  </div>
                  <div className="form-field">
                    <label>Status</label>
                    <select name="status" value={form.status} onChange={handleField}>
                      {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Generate Invoice'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Confirm ── */}
        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
              <div className="delete-confirm-icon">🗑️</div>
              <p className="delete-confirm-text">
                Delete invoice <strong>{fmtInvId(deleteTarget)}</strong>?
                <br />This action cannot be undone.
              </p>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
