import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { createDispatch, getAllDrivers } from '../../api/dispatchApi';
import { DISPATCH_STATUS_CONFIG } from '../../utils/constants';
import '../../styles/Bookings.css';

// ── Validation ────────────────────────────────────────────────────────────────

function validateDispatchForm(fields) {
  const errors = {};
  if (!fields.loadID || isNaN(Number(fields.loadID)) || Number(fields.loadID) <= 0) {
    errors.loadID = 'Enter a valid Load ID (positive number).';
  }
  if (!fields.assignedDriverID) {
    errors.assignedDriverID = 'Select a driver.';
  }
  if (!fields.assignedBy.trim()) {
    errors.assignedBy = 'Assigned By is required.';
  }
  return errors;
}

// ── Component ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  loadID:           '',
  assignedDriverID: '',
  assignedBy:       '',
  status:           'CREATED',
};

export default function NewDispatch() {
  const navigate = useNavigate();

  const [fields, setFields]     = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');
  const [drivers, setDrivers]   = useState([]);

  useEffect(() => {
    getAllDrivers().then(setDrivers).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError('');
    const validationErrors = validateDispatchForm(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      loadID:           Number(fields.loadID),
      assignedDriverID: Number(fields.assignedDriverID),
      assignedBy:       fields.assignedBy.trim(),
      status:           fields.status,
    };

    setSaving(true);
    createDispatch(payload)
      .then((created) => navigate(`/dispatch/${created.dispatchID}`))
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data || 'Failed to create dispatch.';
        setApiError(String(msg));
        setSaving(false);
      });
  };

  return (
    <Layout>
      <div className="bookings-page">

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">New Dispatch</h1>
            <p className="page-subtitle">Assign a load to a driver for dispatch</p>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/dispatch')}>
            ← Back to Dispatches
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Load & Driver ── */}
          <div className="form-section">
            <div className="form-section-title">Assignment Details</div>

            <div className="form-row form-row-2">
              <div className="form-field">
                <label>Load ID <span className="required">*</span></label>
                <input
                  type="number"
                  name="loadID"
                  placeholder="e.g. 5"
                  value={fields.loadID}
                  onChange={handleChange}
                  className={errors.loadID ? 'input-error' : ''}
                  min="1"
                />
                {errors.loadID && <span className="error-msg">{errors.loadID}</span>}
                <span className="field-hint">Numeric ID of the load to dispatch</span>
              </div>

              <div className="form-field">
                <label>Driver <span className="required">*</span></label>
                <select
                  name="assignedDriverID"
                  value={fields.assignedDriverID}
                  onChange={handleChange}
                  className={errors.assignedDriverID ? 'input-error' : ''}
                >
                  <option value="">— Select driver —</option>
                  {drivers.map((d) => (
                    <option key={d.driverID} value={d.driverID}>
                      {d.name} ({d.licenseNo}) — {d.status}
                    </option>
                  ))}
                </select>
                {errors.assignedDriverID && (
                  <span className="error-msg">{errors.assignedDriverID}</span>
                )}
              </div>
            </div>

            <div className="form-row form-row-2">
              <div className="form-field">
                <label>Assigned By <span className="required">*</span></label>
                <input
                  type="text"
                  name="assignedBy"
                  placeholder="Dispatcher name or ID"
                  value={fields.assignedBy}
                  onChange={handleChange}
                  className={errors.assignedBy ? 'input-error' : ''}
                />
                {errors.assignedBy && <span className="error-msg">{errors.assignedBy}</span>}
              </div>

              <div className="form-field">
                <label>Initial Status</label>
                <select name="status" value={fields.status} onChange={handleChange}>
                  {Object.entries(DISPATCH_STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── API Error ── */}
          {apiError && (
            <div className="auth-message auth-message-error" style={{ marginBottom: 14 }}>
              ⚠ {apiError}
            </div>
          )}

          {/* ── Actions ── */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/dispatch')}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating…' : '📤 Create Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
