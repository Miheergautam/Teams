import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    const normalizedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    config.headers.Authorization = normalizedToken;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

export default API;
