import axios from "axios";

const API_URL = "http://localhost:8080/cargoRoute/tasks";

export const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const normalizeTask = (item = {}) => ({
  taskID: item.taskID ?? item.taskId ?? item.id ?? null,
  assignedTo: item.assignedTo ?? item.assignee ?? null,
  relatedEntityID: item.relatedEntityID ?? item.relatedEntityId ?? null,
  relatedCode: item.relatedCode ?? item.relatedRef ?? item.referenceCode ?? null,
  description: item.description ?? "",
  dueDate: item.dueDate ?? item.dueAt ?? null,
  status: String(item.status ?? "PENDING").toUpperCase(),
  priority: item.priority ?? null,
});

export const getAllTasks = () =>
  axios
    .get(`${API_URL}/getAllTasks`, {
      headers: authHeader(),
    })
    .then((res) => ({ ...res, data: toArray(res.data).map(normalizeTask) }));

export const getTaskById = (taskId) =>
  axios
    .get(`${API_URL}/${taskId}`, {
      headers: authHeader(),
    })
    .then((res) => ({ ...res, data: normalizeTask(res.data) }));

export const createTask = (payload) => {
  const body = {
    assignedTo: Number(payload.assignedTo),
    relatedEntityID:
      payload.relatedEntityID === "" || payload.relatedEntityID == null
        ? null
        : Number(payload.relatedEntityID),
    description: payload.description,
    dueDate: payload.dueDate,
    status: payload.status,
  };

  return axios
    .post(`${API_URL}/create`, body, {
      headers: authHeader(),
    })
    .then((res) => ({ ...res, data: normalizeTask(res.data) }));
};
