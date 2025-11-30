import axios from "axios";

export const API = axios.create({
  baseURL: process.env.VITE_NEXT_PUBLIC_API_URL || "http://localhost:5000/",
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
console.log(first)