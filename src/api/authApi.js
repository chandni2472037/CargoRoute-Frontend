import axios from "axios";

const AUTH_URL = "http://localhost:8084/auth";
const USER_URL = "http://localhost:8084/user";

export const loginUser = (data) =>
  axios.post(`${AUTH_URL}/login`, data);

export const signupUser = (data) =>
  axios.post(`${AUTH_URL}/signup`, data);

// ── Admin-only user management ────────────────────────────────────────────────

/** Admin: create a new user (including Shipper-linked users) */
export const createAdminUser = (data) =>
  axios.post(`${USER_URL}/register`, data).then(r => r.data);

/** Admin: get all users */
export const getAllUsersAdmin = () =>
  axios.get(`${USER_URL}`).then(r => r.data);

/** Admin: get single user by ID */
export const getUserByIdAdmin = (id) =>
  axios.get(`${USER_URL}/${id}`).then(r => r.data);

/** Admin: update an existing user */
export const updateAdminUser = (id, data) =>
  axios.put(`${USER_URL}/${id}`, data).then(r => r.data);
