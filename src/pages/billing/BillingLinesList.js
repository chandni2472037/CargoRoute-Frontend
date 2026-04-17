import React, { useState, useEffect, useCallback } from "react";
import Layout from "../../components/Layout";
import {
  getAllBillingLines,
  createBillingLine,
  updateBillingLine,
  deleteBillingLine,
} from "../../api/billingApi";
import "../../styles/Billing.css";

const EMPTY_FORM = { bookingID: "", loadID: "", amount: "", tariffApplied: "", notes: "" };

function validate(form) {
  const errs = {};
  if (!form.bookingID || isNaN(Number(form.bookingID))) errs.bookingID = "Valid Booking ID required.";
  if (!form.amount || Number(form.amount) <= 0) errs.amount = "Amount must be > 0.";
  if (!form.tariffApplied.trim()) errs.tariffApplied = "Tariff applied is required.";
  return errs;
}

function fmtBLId(id) { return "BL" + String(id).padStart(4, "0"); }
function fmtBKId(id) { if (!id) return "-"; return "BK" + String(id).padStart(3, "0"); }
function fmtLDId(id) { if (!id) return "-"; return "LD" + String(id).padStart(3, "0"); }
function fmtAmt(v) { return String.fromCharCode(8377) + (v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }); }

function ViewModal({ record, onClose, onEdit }) {
  if (!record) return null;
  const bl  = record.billing || record;
  const bk  = record.booking || {};
  const bkId = bl.bookingID || bk.bookingID;
  return (
    React.createElement("div", { className: "modal-overlay", onClick: onClose },
      React.createElement("div", { className: "modal", onClick: function(e){ e.stopPropagation(); } },
        React.createElement("div", { className: "modal-header-blue" },
          React.createElement("h2", { className: "modal-title" }, "Billing Line - " + fmtBLId(bl.billingLineID)),
          React.createElement("button", { className: "modal-close", onClick: onClose }, "\u2715")
        ),
        React.createElement("div", { className: "view-detail-grid" },
          React.createElement("div", { className: "view-detail-item" }, React.createElement("span", { className: "view-detail-label" }, "BL ID"), React.createElement("span", { className: "view-detail-value" }, fmtBLId(bl.billingLineID))),
          React.createElement("div", { className: "view-detail-item" }, React.createElement("span", { className: "view-detail-label" }, "Booking ID"), React.createElement("span", { className: "view-detail-value" }, fmtBKId(bkId))),
          React.createElement("div", { className: "view-detail-item" }, React.createElement("span", { className: "view-detail-label" }, "Load ID"), React.createElement("span", { className: "view-detail-value" }, fmtLDId(bl.loadID))),
          React.createElement("div", { className: "view-detail-item" }, React.createElement("span", { className: "view-detail-label" }, "Amount"), React.createElement("span", { className: "view-detail-value" }, fmtAmt(bl.amount))),
          React.createElement("div", { className: "view-detail-item full-width" }, React.createElement("span", { className: "view-detail-label" }, "Tariff Applied"), React.createElement("span", { className: "view-detail-value" }, bl.tariffApplied || "-")),
          React.createElement("div", { className: "view-detail-item" }, React.createElement("span", { className: "view-detail-label" }, "Shipper"), React.createElement("span", { className: "view-detail-value" }, (bk && bk.shipper && bk.shipper.name) || (bk.shipperID ? ("Shipper #" + bk.shipperID) : "-"))),
          React.createElement("div", { className: "view-detail-item" }, React.createElement("span", { className: "view-detail-label" }, "Booking Ref"), React.createElement("span", { className: "view-detail-value" }, bk.referenceNumber || "-")),
          React.createElement("div", { className: "view-detail-item full-width" }, React.createElement("span", { className: "view-detail-label" }, "Notes"), React.createElement("span", { className: "view-detail-value" }, bl.notes || "-"))
        ),
        React.createElement("div", { className: "modal-footer" },
          React.createElement("button", { className: "btn-secondary", onClick: onClose }, "Close"),
          React.createElement("button", { className: "btn-primary", onClick: onEdit }, "Edit")
        )
      )
    )
  );
}

export default function BillingLinesList() {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    getAllBillingLines()
      .then(setLines)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = lines.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const bl = r.billing || r;
    return (
      fmtBLId(bl.billingLineID).toLowerCase().includes(q) ||
      fmtBKId(bl.bookingID).toLowerCase().includes(q) ||
      (bl.tariffApplied || "").toLowerCase().includes(q) ||
      (bl.notes || "").toLowerCase().includes(q)
    );
  });

  const totalAmount = lines.reduce((s, r) => s + ((r.billing || r).amount || 0), 0);

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setFormErrors({}); setShowForm(true); };

  const openEdit = (r) => {
    const bl = r.billing || r;
    setEditTarget(bl.billingLineID);
    setForm({
      bookingID: bl.bookingID != null ? String(bl.bookingID) : "",
      loadID: bl.loadID != null ? String(bl.loadID) : "",
      amount: bl.amount != null ? String(bl.amount) : "",
      tariffApplied: bl.tariffApplied || "",
      notes: bl.notes || "",
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        bookingID: parseInt(form.bookingID, 10),
        loadID: form.loadID ? parseInt(form.loadID, 10) : null,
        amount: parseFloat(form.amount),
        tariffApplied: form.tariffApplied.trim(),
        notes: form.notes.trim() || null,
      };
      if (editTarget) {
        await updateBillingLine(editTarget, payload);
        setSuccess("Billing line updated successfully.");
      } else {
        await createBillingLine(payload);
        setSuccess("Billing line created successfully.");
      }
      setShowForm(false);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBillingLine(deleteTarget);
      setSuccess("Billing line deleted.");
      setDeleteTarget(null);
      load();
    } catch (e) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setFormErrors((p) => ({ ...p, [name]: undefined }));
  };

  return (
    <Layout>
      <div className="billing-page">

        <div className="page-header">
          <div>
            <h1 className="page-title">Billing Lines</h1>
            <p className="page-subtitle">Individual charge entries per booking</p>
          </div>
          <button className="btn-primary" onClick={openCreate}>+ Add Billing Line</button>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <div className="billing-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="stat-card">
            <span className="stat-icon">📄</span>
            <div className="stat-label">Total Lines</div>
            <div className="stat-value">{loading ? "-" : lines.length}</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🔍</span>
            <div className="stat-label">Filtered</div>
            <div className="stat-value">{loading ? "-" : filtered.length}</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <div className="stat-label">Total Charged</div>
            <div className="stat-value-sm">{loading ? "-" : fmtAmt(totalAmount)}</div>
          </div>
        </div>

        <div className="table-section">
          <div className="table-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search by ID, booking or tariff..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading billing lines...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">{search ? "No billing lines match your search." : "No billing lines yet."}</div>
          ) : (
            <div className="table-wrapper">
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>BL ID</th>
                    <th>Booking</th>
                    <th>Amount</th>
                    <th>Tariff Applied</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const bl = r.billing || r;
                    const bkId = bl.bookingID || ((r.booking || {}).bookingID);
                    return (
                      <tr key={bl.billingLineID}>
                        <td className="billing-id-cell">{fmtBLId(bl.billingLineID)}</td>
                        <td>{fmtBKId(bkId)}</td>
                        <td className="amount-cell">{fmtAmt(bl.amount)}</td>
                        <td><span className="rate-chip">{bl.tariffApplied || "-"}</span></td>
                        <td>
                          <div className="table-actions">
                            <button className="btn-view-blue" onClick={() => setViewRecord(r)}>View</button>
                            <button className="btn-icon" title="Edit" onClick={() => openEdit(r)}>&#9999;</button>
                            <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => setDeleteTarget(bl.billingLineID)}>&#128465;</button>
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

        <ViewModal
          record={viewRecord}
          onClose={() => setViewRecord(null)}
          onEdit={() => { const r = viewRecord; setViewRecord(null); openEdit(r); }}
        />

        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">{editTarget ? "Edit Billing Line" : "New Billing Line"}</h2>
                <button className="modal-close" onClick={() => setShowForm(false)}>&#x2715;</button>
              </div>
              <div className="modal-body">
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Booking ID <span className="required">*</span></label>
                    <input type="number" name="bookingID" value={form.bookingID} onChange={handleField} placeholder="e.g. 1" min="1" className={formErrors.bookingID ? "input-error" : ""} />
                    {formErrors.bookingID && <span className="field-error">{formErrors.bookingID}</span>}
                  </div>
                  <div className="form-field">
                    <label>Load ID <span style={{ fontSize: 12, color: "#94a3b8" }}>(optional)</span></label>
                    <input type="number" name="loadID" value={form.loadID} onChange={handleField} placeholder="e.g. 5" min="1" />
                  </div>
                </div>
                <div className="form-field">
                  <label>Amount <span className="required">*</span></label>
                  <input type="number" name="amount" value={form.amount} onChange={handleField} min="0.01" step="0.01" placeholder="0.00" className={formErrors.amount ? "input-error" : ""} />
                  {formErrors.amount && <span className="field-error">{formErrors.amount}</span>}
                </div>
                <div className="form-field">
                  <label>Tariff Applied <span className="required">*</span></label>
                  <input name="tariffApplied" value={form.tariffApplied} onChange={handleField} placeholder="e.g. Standard Freight @ 2.5/kg" className={formErrors.tariffApplied ? "input-error" : ""} />
                  {formErrors.tariffApplied && <span className="field-error">{formErrors.tariffApplied}</span>}
                </div>
                <div className="form-field">
                  <label>Notes</label>
                  <textarea name="notes" value={form.notes} onChange={handleField} rows={3} placeholder="Any remarks..." />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editTarget ? "Update" : "Create"}</button>
              </div>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
              <div className="delete-confirm-icon">🗑️</div>
              <p className="delete-confirm-text">Delete billing line <strong>{fmtBLId(deleteTarget)}</strong>? This cannot be undone.</p>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
