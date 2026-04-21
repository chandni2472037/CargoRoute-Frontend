import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { createClaim } from '../../api/exceptionsApi';
import '../../styles/Bookings.css';
import '../../styles/Exceptions.css';

// ── Validation ───────────────────────────────────────────────────────────────

function validateClaimForm(fields) {
  const errors = {};
  if (!fields.exceptionId || isNaN(Number(fields.exceptionId)) || Number(fields.exceptionId) <= 0) {
    errors.exceptionId = 'Enter a valid Exception ID (positive number).';
  }
  if (!fields.filedBy.trim()) {
    errors.filedBy = 'Filer name is required.';
  }
  if (!fields.amountClaimed || isNaN(Number(fields.amountClaimed)) || Number(fields.amountClaimed) <= 0) {
    errors.amountClaimed = 'Enter a valid amount (greater than 0).';
  }
  return errors;
}

// ── Component ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  exceptionId:     '',
  filedBy:         '',
  amountClaimed:   '',
  resolutionNotes: '',
};

export default function NewClaim() {
  const navigate = useNavigate();

  const [fields, setFields]     = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validateClaimForm(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      exceptionID:     Number(fields.exceptionId),
      filedBy:         fields.filedBy.trim(),
      amountClaimed:   Number(fields.amountClaimed),
      resolutionNotes: fields.resolutionNotes.trim() || null,
    };

    setSaving(true);
    createClaim(payload)
      .then(() => {
        navigate('/claims');
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data ||
          'Failed to file claim. Check the Exception ID and try again.';
        setApiError(String(msg));
        setSaving(false);
      });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="booking-form-page">

        {/* ── Page Header ── */}
        <div className="form-page-header">
          <button className="back-btn" onClick={() => navigate('/claims')}>←</button>
          <div>
            <h1 className="page-title">File a Claim</h1>
            <p className="page-subtitle">
              Submit a compensation claim linked to a freight exception
            </p>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate>

          <div className="form-section">
            <h2 className="form-section-title">Claim Details</h2>

            <div className="form-row form-row-2">
              <div className="form-field">
                <label>
                  Exception ID <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="exceptionId"
                  placeholder="e.g. 7"
                  value={fields.exceptionId}
                  onChange={handleChange}
                  className={errors.exceptionId ? 'input-error' : ''}
                  min="1"
                />
                {errors.exceptionId && (
                  <span className="error-msg">{errors.exceptionId}</span>
                )}
                <span className="field-hint">
                  The numeric ID of the exception this claim is linked to
                </span>
              </div>

              <div className="form-field">
                <label>
                  Filed By <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="filedBy"
                  placeholder="Full name or employee ID"
                  value={fields.filedBy}
                  onChange={handleChange}
                  className={errors.filedBy ? 'input-error' : ''}
                />
                {errors.filedBy && (
                  <span className="error-msg">{errors.filedBy}</span>
                )}
              </div>
            </div>

            <div className="form-row form-row-2">
              <div className="form-field">
                <label>
                  Amount Claimed (₹) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="amountClaimed"
                  placeholder="e.g. 50000"
                  value={fields.amountClaimed}
                  onChange={handleChange}
                  className={errors.amountClaimed ? 'input-error' : ''}
                  min="0.01"
                  step="0.01"
                />
                {errors.amountClaimed && (
                  <span className="error-msg">{errors.amountClaimed}</span>
                )}
              </div>
            </div>

            <div className="form-field">
              <label>Resolution Notes</label>
              <textarea
                name="resolutionNotes"
                rows={4}
                placeholder="Optional — describe the basis for this claim or any supporting details…"
                value={fields.resolutionNotes}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* ── API Error ── */}
          {apiError && (
            <div className="error-banner">
              <span>⚠️ {apiError}</span>
            </div>
          )}

          {/* ── Submit ── */}
          <div className="form-actions-row">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Filing…' : 'File Claim'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/claims')}
              disabled={saving}
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </Layout>
  );
}
