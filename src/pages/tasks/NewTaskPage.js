import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { createTask } from "../../api/taskApi";
import { getUserFromToken } from "../../utils/jwtUtils";
import axios from "axios";
import "../../styles/Tasks.css";

const DRIVER_ROLE = "DRIVER";

const ENTITY_TYPES = [
  { id: "bookings", label: "Bookings" },
  { id: "manifests", label: "Manifests" },
  { id: "exceptions", label: "Exceptions" },
  { id: "dispatch", label: "Dispatch" },
  { id: "vehicles", label: "Vehicles & Fleet" },
  { id: "routes", label: "Routes" },
  { id: "invoices", label: "Invoices" },
];

const getUserId = (user) => {
  const raw = user?.userId ?? user?.userID ?? user?.id ?? null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function NewTaskPage() {
  const navigate = useNavigate();
  const user = getUserFromToken() || {};
  const role = String(user?.role || "").toUpperCase();
  const currentUserId = getUserId(user);
  const isDriver = role === DRIVER_ROLE;

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [form, setForm] = useState({
    assignedTo: isDriver ? String(currentUserId ?? "") : "",
    relatedEntityType: "",
    description: "",
    dueDate: "",
    status: "PENDING",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch all users on mount
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await axios.get("http://localhost:8080/cargoRoute/user/getAllUsers", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const list = Array.isArray(res.data) ? res.data : [];
        setUsers(list);
      } catch (err) {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  const validation = useMemo(() => {
    const e = {};
    if (!form.assignedTo) e.assignedTo = "Assignee is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.dueDate) e.dueDate = "Due date is required";
    return e;
  }, [form]);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (Object.keys(validation).length > 0) {
      setError("Please complete required fields.");
      return;
    }

    setSaving(true);
    try {
      const res = await createTask({
        assignedTo: Number(form.assignedTo),
        relatedEntityID: form.relatedEntityType === "" ? null : form.relatedEntityType,
        description: form.description,
        dueDate: form.dueDate,
        status: form.status,
      });

      const newId = res?.data?.taskID;
      if (newId) {
        navigate(`/tasks/${newId}`);
      } else {
        navigate("/tasks");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create task.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="tasks-page">
        <div className="tasks-header">
          <div>
            <h1 className="tasks-title">Add Task</h1>
            <p className="tasks-subtitle">Create a new task and assign ownership</p>
          </div>
          <div className="tasks-header-actions">
            <button className="tasks-btn" onClick={() => navigate("/tasks")}>← Back</button>
          </div>
        </div>

        {error && <div className="tasks-error">⚠ {error}</div>}

        <form className="tasks-form-card" onSubmit={onSubmit}>
          <div className="tasks-form-grid">
            <div className="tasks-form-field">
              <label>Assigned To *</label>
              <select
                value={form.assignedTo}
                onChange={(e) => onChange("assignedTo", e.target.value)}
                disabled={isDriver || loadingUsers}
              >
                <option value="">Select a user...</option>
                {users.map((u) => (
                  <option key={u.userID} value={String(u.userID)}>
                    {u.name || "Unknown"} - {u.role || "N/A"}
                  </option>
                ))}
              </select>
              <small>{validation.assignedTo || " "}</small>
            </div>

            <div className="tasks-form-field">
              <label>Related To (Entity Type)</label>
              <select
                value={form.relatedEntityType}
                onChange={(e) => onChange("relatedEntityType", e.target.value)}
              >
                <option value="">Select a table...</option>
                {ENTITY_TYPES.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.label}
                  </option>
                ))}
              </select>
              <small> </small>
            </div>

            <div className="tasks-form-field tasks-form-field-full">
              <label>Description *</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => onChange("description", e.target.value)}
                placeholder="Describe the action item"
              />
              <small>{validation.description || " "}</small>
            </div>

            <div className="tasks-form-field">
              <label>Due Date *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => onChange("dueDate", e.target.value)}
              />
              <small>{validation.dueDate || " "}</small>
            </div>

            <div className="tasks-form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => onChange("status", e.target.value)}>
                <option value="PENDING">Pending</option>
                <option value="INPROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <small> </small>
            </div>
          </div>

          <div className="tasks-form-actions">
            <button type="button" className="tasks-btn" onClick={() => navigate("/tasks")}>Cancel</button>
            <button type="submit" className="tasks-btn tasks-btn-primary" disabled={saving}>
              {saving ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
