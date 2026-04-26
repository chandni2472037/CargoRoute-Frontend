import axios from "axios";

const API_URL = "http://localhost:8084/cargoRoute/notifications";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`
  };
};

export const getAllNotifications = () =>
  axios.get(`${API_URL}/getAllNotifications`, {
    headers: authHeader()
  });

  export const getMyNotifications = () =>
  axios.get(`${API_URL}/my`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });
