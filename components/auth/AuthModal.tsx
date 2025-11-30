import React, { useState, useEffect } from "react";
import Icon from "../ui/Icon";
import useAppStore from "@/store/useStore";
import Toast from "../ui/Toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../ui/index.css";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: "login" | "signup";
  onAuthSuccess: (details: { name: string; email: string }) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode,
  onAuthSuccess,
}) => {
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);
  const [Dob, setDob] = useState<Date | null>(null);
  const [Age, setAge] = useState("");

  const signup = useAppStore((state) => state.signup);
  const signIn = useAppStore((state) => state.signIn);
  const loading = useAppStore((state) => state.loading);
  const setLoading = useAppStore((state) => state.setLoading);
  const error = useAppStore((state) => state.error);
  const setError = useAppStore((state) => state.setError);
  const showToast = (
    message: string,
    type: "success" | "info" | "error" = "info"
  ) => {
    setToast({ message, type });
  };

  const checkAge = async (date: any) => {
    setDob(date);
    const today = new Date();
    let calculatedAge = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      calculatedAge--;
    }
    console.log(calculatedAge);
    await setAge(calculatedAge);
    await setFormData({ ...formData, age: calculatedAge.toString() });
    console.log(formData);

    if (calculatedAge < 18) {
      showToast(
        "You must be up to 18 years to be able to use Trade Companion",
        "error"
      );
    }
  };

  useEffect(() => {
    setIsLogin(initialMode === "login");
    setFormData({ name: "", email: "", password: "", age: "" });
    setFormError(null);
    setError(false);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError(null);
    setError(false);
  };
  const closeToast = () => {
    setToast(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setError(false);
    setLoading(true);

    if (
      !formData.email ||
      !formData.password ||
      (!isLogin && (!formData.name || !formData.age))
    ) {
      setFormError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (!isLogin && parseInt(formData.age) < 18) {
      setFormError("You must be at least 18 years old to sign up.");
      setLoading(false);
      return;
    }

    try {
      let user;
      if (!isLogin) {
        user = await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          age: formData.age,
        });
      } else {
        user = await signIn({
          email: formData.email,
          password: formData.password,
        });
      }

      onAuthSuccess({
        name: user.name,
        email: user.email,
        plan: user.subscribedPlan || "FREE",
        image: user.image || user.avatar,
      });
      onClose();
    } catch (err: any) {
      console.log(err);
      setFormError("Authentication failed. Please try again.");
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Authentication failed. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm  animate-fade-in-right">
      <div className="bg-light-surface w-full max-w-md rounded-2xl shadow-2xl border border-light-gray overflow-hidden relative">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-3xl"></div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center text-mid-text hover:text-dark-text transition-colors z-20 p-2 rounded-full hover:bg-light-hover"
        >
          <Icon name="close" className="w-6 h-6" />
        </button>

        <div className="p-8 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Trade Companion
            </h1>
            <p className="text-mid-text">
              {isLogin
                ? "Welcome back, trader."
                : "Start your trading journey."}
            </p>
          </div>

          {(formError || error) && (
            <div className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-lg border border-danger/20 flex items-center">
              <Icon name="danger" className="w-4 h-4 mr-2" />
              {formError || "Something went wrong."}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mid-text">
                    <Icon name="user" className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-10 p-3 bg-light-hover border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-dark-text transition-all"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mid-text">
                  <Icon name="mail" className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full pl-10 p-3 bg-light-hover border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-dark-text transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mid-text">
                  <Icon name="password" className="w-6 h-6" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 p-3 bg-light-hover border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-dark-text transition-all"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  {/* Calendar Icon */}
                  <div
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mid-text"
                    style={{ zIndex: 100 }}
                  >
                    <Icon name="calendar" className="w-5 h-5" />
                  </div>

                  <DatePicker
                    selected={Dob}
                    onChange={(date) => checkAge(date)}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Date of Birth"
                    className="w-full pl-10 p-3 bg-light-hover border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-dark-text transition-all"
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                    //   selectsMultiple
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || parseInt(formData.age) < 18}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center shadow-md"
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
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <span className="h-px bg-light-gray flex-1"></span>
            <span className="text-xs text-mid-text px-2 uppercase">
              Or continue with
            </span>
            <span className="h-px bg-light-gray flex-1"></span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            {/* Social login buttons */}
            {/* Google */}
            <button className="flex items-center justify-center p-2 border border-light-gray rounded-lg hover:bg-light-hover transition-colors bg-white dark:bg-gray-700">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Google
              </span>
            </button>
            {/* Apple */}
            <button className="flex items-center justify-center p-2 border border-light-gray rounded-lg hover:bg-light-hover transition-colors bg-white dark:bg-gray-700">
              <svg
                className="w-5 h-5 mr-2 text-black dark:text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M13.0729 1.36547C13.7054 0.632969 14.763 0.0929688 15.598 0C15.7255 1.05797 15.188 2.12297 14.5505 2.87047C13.9655 3.55047 12.993 4.07297 12.083 3.99797C11.9405 2.93797 12.5405 2.09047 13.0729 1.36547Z" />
                <path d="M17.3483 16.3983C16.3808 17.8033 15.2908 19.1783 13.7433 19.1783C12.2233 19.1783 11.7658 18.2883 10.0358 18.2883C8.32082 18.2883 7.80082 19.1483 6.34832 19.1783C4.85832 19.2083 3.55082 17.6733 2.58332 16.2758C0.63082 13.4558 0.63082 9.13328 4.22832 8.59078C6.00582 8.33078 7.26582 9.53578 8.32082 9.53578C9.34832 9.53578 10.7983 8.09828 12.7758 8.30078C13.5983 8.33078 15.7033 8.62078 17.1383 10.7133C17.0608 10.7633 14.6258 12.1983 14.6633 15.0633C14.6933 17.5658 16.7533 18.6358 17.3483 16.3983Z" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Apple
              </span>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-mid-text">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-bold hover:underline transition-colors"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </div>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
    </div>
  )};
export default AuthModal;
