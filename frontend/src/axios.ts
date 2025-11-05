import axios from "axios";
import { getToken } from "./lib/auth";

const axiosInstance = axios.create({
  baseURL: window.VITE_API_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
