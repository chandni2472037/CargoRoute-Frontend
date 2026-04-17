import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { createManifest } from '../../api/manifestApi';
import { SITES } from '../../utils/constants';
import '../../styles/Bookings.css';

const EMPTY_FORM = {
  loadID:      '',
  warehouseID: '',
  itemsJSON:   '',
  createdBy:   '',
  manifestURI: '',
};

function validateManifestForm(form) {
  const err = {};
  if (!form.loadID || Number(form.loadID) <= 0) err.loadID    = 'Valid Load ID is required';
  if (!form.createdBy.trim())                    err.createdBy = 'Created By is required';
  return err;
}

export default function NewManifest() {
  const navigate = useNavigate();
  const [form, setForm]             = useState(EMPTY_FORM);
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage]       = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateManifestForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const payload = {
      loadID:      Number(form.loadID),
      warehouseID: form.warehouseID ? Number(form.warehouseID) : null,
      itemsJSON:   form.itemsJSON.trim() || null,
      createdBy:   form.createdBy.trim(),
      manifestURI: form.manifestURI.trim() || null,
    };

    try {
      const created = await createManifest(payload);
      setMessage({ type: 'success', text: 'Manifest created successfully! Redirecting…' });
      setTimeout(() => navigate(`/manifests/${created.manifestID}`), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create manifest. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="booking-form-page">

        {/* Page header */}
        <div className="form-page-header">
          <button className="back-btn" onClick={() => navigate('/manifests')}>←</button>
          <div>
            <h1 className="page-title">New Manifest</h1>
            <p className="page-subtitle">Create a shipment manifest for a load</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Load Information ──────────────────────────────────── */}
          <div className="form-section">
            <h2 className="form-section-title">Load Information</h2>
            <div className="form-row form-row-2">
              <div className="form-field">
                <label>Load ID <span className="required">*</span></label>
                <input
                  type="number"
                  name="loadID"
                  value={form.loadID}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  min="1"
                  className={errors.loadID ? 'input-error' : ''}
                />
                {errors.loadID && <span className="error-msg">{errors.loadID}</span>}
              </div>
              <div className="form-field">
                <label>Warehouse</label>
                <select name="warehouseID" value={form.warehouseID} onChange={handleChange}>
                  <option value="">— Select warehouse (optional) —</option>
                  {SITES.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Manifest Details ──────────────────────────────────── */}
          <div className="form-section">
            <h2 className="form-section-title">Manifest Details</h2>
            <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
              <div className="form-field">
                <label>Created By <span className="required">*</span></label>
                <input
                  type="text"
                  name="createdBy"
                  value={form.createdBy}
                  onChange={handleChange}
                  placeholder="Your name or system identifier"
                  className={errors.createdBy ? 'input-error' : ''}
                />
                {errors.createdBy && <span className="error-msg">{errors.createdBy}</span>}
              </div>
              <div className="form-field">
                <label>Manifest URI</label>
                <input
                  type="text"
                  name="manifestURI"
                  value={form.manifestURI}
                  onChange={handleChange}
                  placeholder="https://… (optional document link)"
                />
              </div>
            </div>
            <div className="form-field">
              <label>Items JSON</label>
              <textarea
                name="itemsJSON"
                rows={4}
                value={form.itemsJSON}
                onChange={handleChange}
                placeholder='[{"sku":"ABC","qty":10},…] — optional list of items in this manifest'
              />
            </div>
          </div>

          {/* ── Actions ───────────────────────────────────────────── */}
          <div className="form-section">
            <h2 className="form-section-title">Actions</h2>
            {message.text && (
              <div className={`auth-message auth-message-${message.type}`} style={{ marginBottom: 14 }}>
                <span>{message.type === 'success' ? '✔' : '⚠'}</span> {message.text}
              </div>
            )}
            <div className="action-buttons">
              <button type="submit" className="btn-primary btn-full" disabled={submitting}>
                💾 {submitting ? 'Creating…' : 'Create Manifest'}
              </button>
              <button type="button" className="btn-secondary btn-full" onClick={() => navigate('/manifests')}>
                Cancel
              </button>
            </div>
          </div>

        </form>
      </div>
    </Layout>
  );
}
