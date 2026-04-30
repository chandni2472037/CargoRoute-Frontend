import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import { getTaskById } from "../../api/taskApi";
import { getUserFromToken } from "../../utils/jwtUtils";
import "../../styles/Tasks.css";

const DRIVER_ROLE = "DRIVER";

const getUserId = (user) => {
  const raw = user?.userId ?? user?.userID ?? user?.id ?? null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeStatus = (status) => {
  const s = String(status || "PENDING").replace(/\s|_/g, "").toUpperCase();
  if (s === "INPROGRESS") return "INPROGRESS";
  if (s === "COMPLETED") return "COMPLETED";
  if (s === "CANCELLED") return "CANCELLED";
  return "PENDING";
};

const statusText = (status) => {
  if (status === "INPROGRESS") return "In Progress";
  if (status === "COMPLETED") return "Completed";
  if (status === "CANCELLED") return "Cancelled";
  return "Pending";
};

export default function TaskDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = getUserFromToken() || {};
  const role = String(user?.role || "").toUpperCase();
  const isDriver = role === DRIVER_ROLE;
  const currentUserId = getUserId(user);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getTaskById(id);
        setTask(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load task.");
        setTask(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const blockedByScope = useMemo(() => {
    if (!task) return false;
    if (!isDriver) return false;
    if (currentUserId == null) return true;
    return Number(task.assignedTo) !== currentUserId;
  }, [task, isDriver, currentUserId]);

  const normalizedStatus = normalizeStatus(task?.status);

  return (
    <Layout>
      <div className="tasks-page">
        <div className="tasks-header">
          <div>
            <h1 className="tasks-title">Task Details</h1>
            <p className="tasks-subtitle">Review task information</p>
          </div>
          <div className="tasks-header-actions">
            <button className="tasks-btn" onClick={() => navigate("/tasks")}>← Back to Tasks</button>
          </div>
        </div>

        {loading ? (
          <div className="tasks-card"><div className="tasks-empty">Loading task...</div></div>
        ) : error ? (
          <div className="tasks-error">⚠ {error}</div>
        ) : blockedByScope ? (
          <div className="tasks-error">⚠ You are not allowed to view this task.</div>
        ) : !task ? (
          <div className="tasks-card"><div className="tasks-empty">Task not found.</div></div>
        ) : (
          <div className="tasks-detail-card">
            <div className="tasks-detail-grid">
              <div className="tasks-detail-row"><span>Task ID</span><strong>{task.taskID ?? "-"}</strong></div>
              <div className="tasks-detail-row"><span>Status</span><strong><span className={`tasks-status tasks-status-${normalizedStatus.toLowerCase()}`}>{statusText(normalizedStatus)}</span></strong></div>
              <div className="tasks-detail-row"><span>Assigned To</span><strong>{task.assignedTo ?? "-"}</strong></div>
              <div className="tasks-detail-row"><span>Related Entity</span><strong>{task.relatedCode || task.relatedEntityID || "-"}</strong></div>
              <div className="tasks-detail-row"><span>Due Date</span><strong>{task.dueDate || "-"}</strong></div>
            </div>

            <div className="tasks-detail-description">
              <h3>Description</h3>
              <p>{task.description || "-"}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
