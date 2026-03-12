import React, { useState, useEffect } from "react";
import Icon from "../ui/Icon";
import useAppStore from "@/store/useStore";
import { useNavigate, useOutletContext } from "react-router-dom";

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { setIsLogin, onAuthSuccess, showToast, handleFocus, setRobotState } =
    useOutletContext();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const loading = useAppStore((state) => state.loading);
  const signIn = useAppStore((state) => state.signIn);

  const handleSubmit = async (e) => {
    setRobotState("searching");
    try {
      e.preventDefault();
      const user = await signIn({
        email: formData.email,
        password: formData.password,
      });
      onAuthSuccess({
        name: user.name,
        email: user.email,
        plan: user.subscribedPlan || "FREE",
        image: user.picture || user.avatar,
        isMentor: user.isMentor,
        subscribedPlan: user.subscribedPlan,
        id: user._id,
        isSubscribed: user.isSubscribed,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionMethod: user.subscriptionMethod,
        subscriptionInterval: user.subscriptionInterval,
        subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
        stripeCustomerId: user.stripeCustomerId,
        cTraderConfig: {
          accountId: user.cTraderConfig.accountId,
          isConnected: user.cTraderConfig.isConnected,
          autoTradeEnabled: user.cTraderConfig.autoTradeEnabled,
        },
      });
    } catch (err) {
      console.log(err);
      setRobotState("sad");
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Authentication failed. Please try again.";
      showToast(errorMessage, "error");
    }
  };

  return (
    <div className="flex w-full max-w-sm h-full flex-col">
      <form onSubmit={handleSubmit} className="space-y-5 w-full">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mid-text">
            <Icon name="user" className="w-5 h-5" />
          </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onFocus={() => handleFocus("email")}
            onChange={handleChange}
            placeholder="Email Address"
            className="w-full pl-10 p-3 bg-light-hover border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-dark-text transition-all"
          />
        </div>
        <div className="relative">
          {/* LEFT lock icon */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mid-text">
            <Icon name="password" className="w-6 h-6" />
          </div>

          {/* INPUT */}
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onFocus={() => handleFocus("password")}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full pl-10 pr-10 p-3 bg-light-hover border border-light-gray rounded-lg 
                        focus:ring-2 focus:ring-primary focus:outline-none text-dark-text transition-all"
          />

          {/* RIGHT eye toggle */}
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-mid-text hover:text-dark-text"
          >
            <Icon
              name={showPassword ? "eyes" : "eyesOff"}
              className="w-6 h-6"
            />
          </button>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => navigate("/auth/forgot-password")}
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.email || !formData.password}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-4"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
