import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { createInvoice } from '../../api/billingApi';
import '../../styles/Billing.css';

const STATUS_OPTIONS = ['Pending', 'Paid', 'Overdue', 'Cancelled', 'Draft', 'Issued'];

const EMPTY_FORM = {
  shipperID:   '',
  periodStart: '',
  periodEnd:   '',
  linesJSON:   '',
  totalAmount: '',
  issuedAt:    '',
  status:      '',
};

function parseYMD(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function validate(form) {
  const errs = {};

  if (!form.shipperID) {
    errs.shipperID = 'Shipper ID is required.';
  } else if (isNaN(Number(form.shipperID)) || !Number.isInteger(Number(form.shipperID)) || Number(form.shipperID) <= 0) {
    errs.shipperID = 'Shipper ID must be a positive whole number (e.g. 501).';
  }

  if (!form.periodStart) errs.periodStart = 'Period start is required. Please select a date.';
  if (!form.periodEnd) {
    errs.periodEnd = 'Period end is required. Please select a date.';
  } else if (form.periodStart && form.periodEnd && form.periodEnd < form.periodStart) {
    errs.periodEnd = 'Period end must be on or after Period start.';
  }

  let linesTotal = null;
  if (!form.linesJSON.trim()) {
    errs.linesJSON = 'Billing lines JSON is required.';
  } else {
    let parsed;
    try { parsed = JSON.parse(form.linesJSON); } catch { errs.linesJSON = 'Invalid JSON format. Check your syntax.'; }
    if (parsed !== undefined) {
      if (!Array.isArray(parsed)) {
        errs.linesJSON = 'Billing lines must be a JSON array [ ... ].';
      } else if (parsed.length === 0) {
        errs.linesJSON = 'Billing lines cannot be empty. Add at least one line item.';
      } else {
        let sum = 0;
        parsed.forEach((line) => {
          if (line.quantity > 0 && line.unitPrice > 0) {
            sum += Math.round(Number(line.quantity) * Number(line.unitPrice) * 100) / 100;
          }
        });
        linesTotal = Math.round(sum * 100) / 100;
      }
    }
  }

  if (!form.totalAmount) {
    errs.totalAmount = 'Total amount is required.';
  } else if (isNaN(Number(form.totalAmount)) || Number(form.totalAmount) <= 0) {
    errs.totalAmount = 'Total amount must be a number greater than 0.';
  }

  if (form.issuedAt) {
    const d = parseYMD(form.issuedAt);
    if (!d) {
      errs.issuedAt = 'Please select a valid issued date.';
    } else {
      const today = new Date(); today.setHours(23, 59, 59, 999);
      if (d > today) errs.issuedAt = 'Issued date cannot be a future date.';
    }
  }

  if (!form.status) errs.status = 'Please select a status.';

  return errs;
}

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setFormErrors((p) => ({ ...p, [name]: undefined }));
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
      navigate('/billing/invoices', { state: { success: 'Invoice created successfully.' } });
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: '100%', width: '100%', margin: '0 auto', padding: '24px 16px' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button className="btn-export" onClick={() => navigate('/billing/invoices')} style={{ flexShrink: 0, fontSize: 20, padding: '8px 12px' }}>
            ←
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2b45', margin: 0 }}>🧾 New Invoice</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>Fill in all required fields to create a new invoice.</p>
          </div>
        </div>

        {/* ── Error banner ── */}
        {Object.keys(formErrors).length > 0 && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#dc2626',
          }}>
            ⚠️ Please fix the following errors before submitting:
            <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
              {Object.values(formErrors).filter(Boolean).map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#dc2626',
          }}>⚠️ {error}</div>
        )}

        {/* ── Form Card ── */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '32px 36px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 20,
        }}>

          {/* Shipper ID */}
          <div className="form-field">
            <label>Shipper ID <span className="required">*</span></label>
            <input
              type="number" name="shipperID" value={form.shipperID}
              onChange={handleField} placeholder="e.g. 501" min="1"
              className={formErrors.shipperID ? 'input-error' : ''}
            />
            {formErrors.shipperID && <span className="field-error">{formErrors.shipperID}</span>}
          </div>

          {/* Period Start & End */}
          <div className="form-row-2">
            <div className="form-field">
              <label>Period Start <span className="required">*</span></label>
              <input
                type="date" name="periodStart" value={form.periodStart}
                onChange={handleField}
                className={formErrors.periodStart ? 'input-error' : ''}
              />
              {formErrors.periodStart && <span className="field-error">{formErrors.periodStart}</span>}
            </div>
            <div className="form-field">
              <label>Period End <span className="required">*</span></label>
              <input
                type="date" name="periodEnd" value={form.periodEnd}
                onChange={handleField} min={form.periodStart || undefined}
                className={formErrors.periodEnd ? 'input-error' : ''}
              />
              {formErrors.periodEnd && <span className="field-error">{formErrors.periodEnd}</span>}
            </div>
          </div>

          {/* Total Amount */}
          <div className="form-field">
            <label>Total Amount (₹) <span className="required">*</span></label>
            <input
              type="number" name="totalAmount" value={form.totalAmount}
              onChange={handleField} min="0.01" step="0.01" placeholder="0.00"
              className={formErrors.totalAmount ? 'input-error' : ''}
            />
            {formErrors.totalAmount && <span className="field-error">{formErrors.totalAmount}</span>}
          </div>

          {/* Billing Lines JSON */}
          <div className="form-field">
            <label>Billing Lines JSON <span className="required">*</span></label>
            <textarea
              name="linesJSON" value={form.linesJSON} onChange={handleField} rows={7}
              placeholder={'[\n  {\n    "description": "Freight Charge",\n    "quantity": 2,\n    "unitPrice": 500.00,\n    "lineTotal": 1000.00\n  }\n]'}
              className={formErrors.linesJSON ? 'input-error' : ''}
              style={{ fontFamily: 'monospace', fontSize: 13, overflow: 'hidden', resize: 'none' }}
            />
            {formErrors.linesJSON && <span className="field-error">{formErrors.linesJSON}</span>}
          </div>

          {/* Issued At & Status */}
          <div className="form-row-2">
            <div className="form-field">
              <label>Issued At <span style={{ fontSize: 11, color: '#94a3b8' }}>(optional)</span></label>
              <input
                type="date" name="issuedAt" value={form.issuedAt}
                onChange={handleField} max={new Date().toISOString().split('T')[0]}
                className={formErrors.issuedAt ? 'input-error' : ''}
              />
              {formErrors.issuedAt && <span className="field-error">{formErrors.issuedAt}</span>}
              {!form.issuedAt && !formErrors.issuedAt && (
                <span style={{ fontSize: 11, color: '#f59e0b' }}>⚠ If not set, today's date will be used.</span>
              )}
            </div>
            <div className="form-field">
              <label>Status <span className="required">*</span></label>
              <select name="status" value={form.status} onChange={handleField}
                className={formErrors.status ? 'input-error' : ''}>
                <option value="">-- Select Status --</option>
                {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
              {formErrors.status && <span className="field-error">{formErrors.status}</span>}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8, borderTop: '1px solid #e4e7ed', marginTop: 4 }}>
            <button className="btn-secondary" onClick={() => setForm({ shipperID: '', periodStart: '', periodEnd: '', linesJSON: '', totalAmount: '', issuedAt: '', status: '' })}>Reset</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '⏳ Saving…' : 'Create'}
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
