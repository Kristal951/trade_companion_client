import React, { useState, useEffect } from "react";
import Icon from "../ui/Icon";
import useAppStore from "@/store/useStore";
import Toast from "../ui/Toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../ui/index.css";
import { GoogleLogin } from "@react-oauth/google";
import { a } from "framer-motion/client";
import VerifyEmail from "./VerifyEmail";

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
  const [authMode, setAuthMode] = useState<"login" | "signUp" | "verifyEmail">(
    initialMode === "signup" ? "signUp" : "login"
  );
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
  const handleGoogleSignIn = useAppStore((state) => state.handleGoogleSignIn);
  const onVerify = useAppStore((state) => state.verifyEmailCode);
  const resendVerificationCode = useAppStore((state) => state.resendVerificationCode);
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
    await setAge(calculatedAge);
    await setFormData({ ...formData, age: calculatedAge.toString() });

    if (calculatedAge < 18) {
      showToast(
        "You must be up to 18 years to be able to use Trade Companion",
        "error"
      );
    }
  };

  useEffect(() => {
    setAuthMode(initialMode === "signup" ? "signUp" : "login");
    setFormData({ name: "", email: "", password: "", age: "" });
    setFormError(null);
    setError(false);
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError(null);
    setError(false);
  };
  const closeToast = () => {
    setToast(null);
  };

  const handleGoogleSuccess = async (response: any) => {
    setLoading(true);
    setError(false);
    try {
      const res = await handleGoogleSignIn({ token: response });
      const user = res.user ?? res;
      onAuthSuccess({
        name: user.name,
        email: user.email,
        plan: user.subscribedPlan || "FREE",
        image: user.picture || user.avatar,
      });
    } catch (error) {
      console.log(error);
      setFormError("Authentication failed. Please try again.");
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Authentication failed. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setError(false);
    setLoading(true);

    if (
      !formData.email ||
      !formData.password ||
      (authMode === "signUp" && (!formData.name || !formData.age))
    ) {
      setFormError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (authMode === "signUp" && parseInt(formData.age) < 18) {
      setFormError("You must be at least 18 years old to sign up.");
      setLoading(false);
      return;
    }

    try {
      let user;
      if (authMode === "signUp") {
        user = await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          age: formData.age,
        });
        setAuthMode("verifyEmail");
      } else if (authMode === "login") {
        user = await signIn({
          email: formData.email,
          password: formData.password,
        });
      }

      // onAuthSuccess({
      //   name: user.name,
      //   email: user.email,
      //   plan: user.subscribedPlan || "FREE",
      //   image: user.image || user.avatar,
      // });
      // onClose();
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
    <div className="fixed inset-0 z-[100] overflow-hidden flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm  animate-fade-in-right">
      {authMode !== "verifyEmail" && (
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
                {authMode === "login"
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
              {authMode === "signUp" && (
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

              {authMode === "signUp" && (
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

              {authMode === "login" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button onClick={() => setAuthMode("verifyEmail")} className="mb-4 text-sm text-primary hover:underline">
                Verify Email
              </button>

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
                ) : authMode === "login" ? (
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

            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
              className="mt-6 rounded-lg"
            >
              <GoogleLogin
                onSuccess={(credentialResponse) =>
                  handleGoogleSuccess(credentialResponse.credential)
                }
                onError={() => console.log("Login Failed")}
                text="continue_with"
                size="large"
                width="100%"
              />
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-mid-text">
                {authMode === "login"
                  ? "Don't have an account? "
                  : authMode === "signUp"
                  ? "Already have an account? "
                  : ""}

                {authMode !== "verifyEmail" && (
                  <button
                    onClick={() =>
                      setAuthMode(authMode === "login" ? "signUp" : "login")
                    }
                    className="text-primary font-bold hover:underline transition-colors"
                  >
                    {authMode === "login" ? "Sign Up" : "Sign In"}
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      {authMode === "verifyEmail" && (
        <VerifyEmail
          email={formData.email}
          onResend={() => console.log("Resend email")}
          onClose={onClose}
          isOpen={isOpen}
          onAuthSuccess={onAuthSuccess}
          onVerify={onVerify}
          loading={loading}
          onResendCode={resendVerificationCode}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
    </div>
  );
};
export default AuthModal;
