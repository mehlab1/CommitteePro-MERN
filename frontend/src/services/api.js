import axios from "axios";

const resolveApiBaseURL = () => {
  const url = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(
    /\/$/,
    ""
  );
  return url.endsWith("/api") ? url : `${url}/api`;
};

const api = axios.create({
  baseURL: resolveApiBaseURL(),
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
