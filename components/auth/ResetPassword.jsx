import React, { useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Icon from "../ui/Icon";
import axios from "axios";
import useAppStore from "@/store/useStore";

const ResetPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useOutletContext();

  const resetPassword = useAppStore((state) => state.resetPassword);

  useEffect(() => {
    if (!token) {
      navigate("/auth/signIn");
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      newPassword,
      token,
    };

    try {
      const res = await resetPassword(data);
      console.log(res);

      if (!res.ok) {
        showToast(data.error || "Failed to reset password", "error");
        return;
      }

      showToast("Password reset successfully, relogin !", "success");
      setNewPassword("");
      setIsOpen(false);
      navigate("/auth/signIn");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[110] ${
        isOpen ? "flex" : "hidden"
      } items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-right`}
    >
      <div className=" bg-light-surface w-full max-w-md rounded-2xl shadow-2xl px-6 py-8 border border-light-gray">
        <button
          onClick={() => {
            setIsOpen(false);
            navigate("/auth/signIn");
          }}
          className="absolute top-4 right-4 flex items-center text-mid-text hover:text-dark-text transition-colors z-20 p-2 rounded-full hover:bg-light-hover"
        >
          <Icon name="close" className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-center">Reset Password</h2>
        <p className="text-mid-text mb-6 text-center">
          Please enter a new password
        </p>

        <form onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-dark-text mb-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mid-text">
                <Icon name="password" className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
          </div>

          <button
            type="submit"
            className="w-full bg-primary flex justify-center items-center hover:bg-primary-hover mt-6 disabled:opacity-50 text-white p-3 rounded-lg font-bold transition-all"
            disabled={loading || !newPassword}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
