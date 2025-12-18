import React, { useState, useRef, useEffect } from "react";
import Icon from "../ui/Icon";
import useAppStore from "@/store/useStore";
import { useOutletContext } from "react-router-dom";

interface VerifyEmailProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => void;
  onClose: () => void;
  loading?: boolean;
  isOpen: boolean;
  onAuthSuccess: (user: any) => Promise<void>;
  showToast: (msg: string, type?: "success" | "error") => void;
}

const VerifyEmail: React.FC<VerifyEmailProps> = () => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [timer, setTimer] = useState(60);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const onVerify = useAppStore((state) => state.verifyEmailCode);
  const onResendCode = useAppStore((state) => state.resendVerificationCode);
  const loading = useAppStore((state) => state.loading);
  const { showToast, onAuthSuccess } = useOutletContext() as any

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData
      .getData("Text")
      .replace(/\D/g, "")
      .slice(0, 6)
      .split("");
    setOtp((prev) => paste.map((char, i) => char || prev[i]));
    if (paste.length === 6) {
      inputsRef.current[5]?.focus();
    } else {
      inputsRef.current[paste.length]?.focus();
    }
  };

  const handleSubmit = async () => {
    try {
      const code = otp.join("");
      const res = await onVerify(code);
      const user = res;

      await onAuthSuccess({
        name: user.name,
        email: user.email,
        plan: user.subscribedPlan || "FREE",
        image: user.avatar,
      });
    } catch (error) {
      console.log(error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Authentication failed. Please try again.";
      showToast(errorMessage, "error");
    }
  };

  const handleResend = async () => {
    try {
      await onResendCode();
      setTimer(60);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col items-center text-center px-4 py-6">
      <h2 className="text-3xl font-bold text-dark-text mb-2">
        Verify Your Email
      </h2>
      <p className="text-mid-text mb-6">
        We sent a 6-digit verification code to{" "}
        {/* <span className="font-semibold">{email}</span> */}
      </p>

      <div className="flex gap-3 mb-6">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={i === 0 ? handlePaste : undefined}
            className="w-14 h-14 text-center border border-white rounded-lg text-xl font-bold
                       focus:outline-none focus:ring-2 focus:ring-white bg-light-surface"
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all disabled:opacity-50"
        disabled={loading || otp.some((digit) => digit === "")}
      >
        {loading ? (
          <svg
            className="animate-spin h-5 w-5 text-white mx-auto"
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
          "Verify Email"
        )}
      </button>

      <div className="mt-4 text-sm text-mid-text">
        {timer > 0 ? (
          <span>
            Resend code in <span className="font-semibold">{timer}s</span>
          </span>
        ) : (
          <button
            onClick={handleResend}
            className="text-primary font-semibold hover:underline"
          >
            Resend Code
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
