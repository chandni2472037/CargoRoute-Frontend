import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { createRoutingRule } from '../../api/routingApi';
import '../styles/Routing.css';

export default function RoutingRuleForm() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    conditionsJSON: '',
    priority: '',
    active: true,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Rule name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...formData,
        priority: formData.priority !== '' ? Number(formData.priority) : null,
      };
      await createRoutingRule(payload);
      navigate('/routing/rules');
    } catch (err) {
      setError('Failed to create routing rule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="routing-container">
        {/* HEADER */}
        <div className="routing-header">
          <div>
            <h1>Create Routing Rule</h1>
            <p>Define a new automated routing rule</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠</span> {error}
          </div>
        )}

        <div className="routing-table-section" style={{ padding: '28px' }}>
          <h3 style={{ marginBottom: '24px', color: '#001f5b', fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
            Rule Details
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="label">
                  Rule Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. High Priority Pharma Rule"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Priority (1–10)</label>
                <input
                  className="form-input"
                  type="number"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  placeholder="e.g. 8"
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '28px' }}>
                <input
                  type="checkbox"
                  id="activeToggle"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="activeToggle" className="label" style={{ margin: 0, cursor: 'pointer' }}>
                  Active
                </label>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Conditions JSON</label>
                <textarea
                  className="form-input"
                  name="conditionsJSON"
                  value={formData.conditionsJSON}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder='{"origin": "Mumbai", "destination": "Delhi", "commodity": "Pharma"}'
                  style={{ fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="form-actions create-form-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary icon-action-btn create-back-action-btn"
                onClick={() => navigate('/routing/rules')}
                disabled={saving}
              >
                <span className="icon-action-icon">←</span>
                <span className="icon-action-label">Back</span>
              </button>
              <button type="submit" className="btn btn-primary form-btn-short" disabled={saving}>
                {saving ? 'Creating...' : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
