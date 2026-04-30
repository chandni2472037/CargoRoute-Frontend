import axios from "axios";

const API_URL = (process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:8000") + "/auth";

export const loginUser = (data) =>
  axios.post(`${API_URL}/login`, data);

export const signupUser = (data) =>
  axios.post(`${API_URL}/signup`, data);  