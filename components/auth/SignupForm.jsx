import React, { useState, useEffect } from "react";
import Icon from "../ui/Icon";
import useAppStore from "@/store/useStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../ui/index.css";
import { useNavigate, useOutletContext } from "react-router-dom";

const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
  });
  const [Dob, setDob] = useState(null);
  const [Age, setAge] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const loading = useAppStore((state) => state.loading);
  const signup = useAppStore((state) => state.signup);
  const navigate = useNavigate();
  const { setIsLogin, showToast, handleFocus, handleBlur } = useOutletContext();

  useEffect(() => {
    setIsLogin(false);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const checkAge = async (date) => {
    setDob(date);
    const today = new Date();
    let calculatedAge = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      calculatedAge--;
    }
    setAge(calculatedAge);
    setFormData({ ...formData, age: calculatedAge.toString() });

    if (calculatedAge < 18) {
      showToast(
        "You must be up to 18 years to be able to use Trade Companion",
        "error"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        age: formData.age,
      });

      navigate("/auth/verify-email");
    } catch (err) {
      console.log(err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Authentication failed. Please try again.";
      showToast(errorMessage, "error");
    }
  };

  return (
    <div className="flex w-full max-w-sm h-full flex-col justify-center items-center">
      <form onSubmit={handleSubmit} className="space-y-5 w-full">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mid-text">
            <Icon name="user" className="w-5 h-5" />
          </div>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onFocus={() => handleFocus("name")}
            placeholder="Name"
            className="w-full pl-10 p-3 bg-light-hover border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-dark-text transition-all"
          />
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mid-text">
            <Icon name="user" className="w-5 h-5" />
          </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => handleFocus("email")}
            placeholder="Email Address"
            className="w-full pl-10 p-3 bg-light-hover border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-dark-text transition-all"
          />
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mid-text">
            <Icon name="password" className="w-5 h-5" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => handleFocus("password")}
            placeholder="Password"
            className="w-full pl-10 p-3 bg-light-hover border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-dark-text transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mid-text"
          >
            {showPassword ? (
              <Icon name="eyes" className="w-5 h-5" />
            ) : (
              <Icon name="eyesOff" className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="group">
          <div className="relative transition-all duration-300">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
            </div>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={checkAge}
              onFocus={() => handleFocus("dob")}
              onBlur={handleBlur}
              max={new Date().toISOString().split("T")[0]}
              className="w-full pl-10 p-3 bg-light-hover border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-dark-text transition-all"
              style={{ colorScheme: "dark" }}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            // onClick={() => setAuthMode("forgotPassword")}
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            !formData.name ||
            !formData.email ||
            !formData.password ||
            !formData.age ||
            parseInt(formData.age) < 18
          }
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-4"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            "Sign Up"
          )}
        </button>
      </form>
    </div>
  );
};

export default SignupForm;
