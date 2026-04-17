import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { createException } from '../../api/exceptionsApi';
import { EXCEPTION_TYPE_CONFIG } from '../../utils/constants';
import '../../styles/Bookings.css';
import '../../styles/Exceptions.css';

// ── Validation ───────────────────────────────────────────────────────────────

function validateExceptionForm(fields) {
  const errors = {};

  if (!fields.bookingId || isNaN(Number(fields.bookingId)) || Number(fields.bookingId) <= 0) {
    errors.bookingId = 'Enter a valid Booking ID (positive number).';
  }
  if (!fields.type) {
    errors.type = 'Select an exception type.';
  }
  if (!fields.reportedBy.trim()) {
    errors.reportedBy = 'Reporter name is required.';
  }
  if (!fields.description.trim()) {
    errors.description = 'Description is required.';
  }

  return errors;
}

// ── Component ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  bookingId:   '',
  type:        '',
  reportedBy:  '',
  description: '',
};

export default function NewException() {
  const navigate = useNavigate();

  const [fields, setFields]   = useState(EMPTY_FORM);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validateExceptionForm(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      bookingId:   Number(fields.bookingId),
      type:        fields.type,
      reportedBy:  fields.reportedBy.trim(),
      description: fields.description.trim(),
    };

    setSaving(true);
    createException(payload)
      .then((created) => {
        navigate(`/exceptions/${created.exceptionID}`);
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data ||
          'Failed to report exception. Please check the Booking ID and try again.';
        setApiError(String(msg));
        setSaving(false);
      });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="bookings-page exceptions-page">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Report Exception</h1>
            <p className="page-subtitle">
              Log a freight exception such as a delay, damage or missing shipment
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => navigate('/exceptions')}
          >
            ← Back to Exceptions
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>

          {/* ── Booking Reference ── */}
          <div className="form-section">
            <div className="form-section-title">Booking Reference</div>

            <div className="form-row form-row-2">
              <div className="form-field">
                <label>
                  Booking ID <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="bookingId"
                  placeholder="e.g. 42"
                  value={fields.bookingId}
                  onChange={handleChange}
                  className={errors.bookingId ? 'input-error' : ''}
                  min="1"
                />
                {errors.bookingId && (
                  <span className="error-msg">{errors.bookingId}</span>
                )}
                <span className="field-hint">
                  The numeric booking ID this exception is linked to
                </span>
              </div>

              <div className="form-field">
                <label>
                  Exception Type <span className="required">*</span>
                </label>
                <select
                  name="type"
                  value={fields.type}
                  onChange={handleChange}
                  className={errors.type ? 'input-error' : ''}
                >
                  <option value="">— Select type —</option>
                  {Object.entries(EXCEPTION_TYPE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.icon}  {cfg.label}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <span className="error-msg">{errors.type}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Reporter Details ── */}
          <div className="form-section">
            <div className="form-section-title">Reporter Details</div>

            <div className="form-row form-row-2">
              <div className="form-field">
                <label>
                  Reported By <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="reportedBy"
                  placeholder="Full name or employee ID"
                  value={fields.reportedBy}
                  onChange={handleChange}
                  className={errors.reportedBy ? 'input-error' : ''}
                />
                {errors.reportedBy && (
                  <span className="error-msg">{errors.reportedBy}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Incident Description ── */}
          <div className="form-section">
            <div className="form-section-title">Incident Description</div>

            <div className="form-field">
              <label>
                Description <span className="required">*</span>
              </label>
              <textarea
                name="description"
                rows={5}
                placeholder="Describe what happened — include relevant details such as location, time, items affected and immediate action taken…"
                value={fields.description}
                onChange={handleChange}
                className={errors.description ? 'input-error' : ''}
              />
              {errors.description && (
                <span className="error-msg">{errors.description}</span>
              )}
              <span className="field-hint">
                Minimum 10 characters · Be as specific as possible
              </span>
            </div>
          </div>

          {/* ── API Error ── */}
          {apiError && (
            <div className="error-banner">
              <span>⚠️ {apiError}</span>
            </div>
          )}

          {/* ── Submit ── */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/exceptions')}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Submitting…' : '⚠️ Submit Exception'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
