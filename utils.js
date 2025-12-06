import axios from "axios";

export const API = axios.create({
  baseURL: import.meta.env.VITE_SERVER_API_URI || "http://localhost:5000/",
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export const updateUserAPI = (email, updates) => {
  return API.put("/api/user/update", { email, updates });
};
