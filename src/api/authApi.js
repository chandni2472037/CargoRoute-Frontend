import axios from "axios";

const API_URL = "http://localhost:8082/cargoRoute/auth";

export const loginUser = (data) =>
  axios.post(`${API_URL}/login`, data);

export const signupUser = (data) =>
  axios.post(`${API_URL}/signup`, data);  