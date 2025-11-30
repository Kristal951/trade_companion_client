import axios from "axios";

export const API = axios.create({
  baseURL: import.metaVITE_SERVER_API_URI || "http://localhost:5000/",
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.response.use(
  (response) => response,
  console.log(process.env.VITE_SERVER_API_URI ),
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);
