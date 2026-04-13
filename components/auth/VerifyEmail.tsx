import React, { useState, useRef, useEffect } from "react";
import useAppStore from "@/store/useStore";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";

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
  const location = useLocation();
  const navigate = useNavigate();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const onVerify = useAppStore((state) => state.verifyEmailCode);
  const onResendCode = useAppStore((state) => state.resendVerificationCode);
  const loading = useAppStore((state) => state.loading);
  const { showToast, onAuthSuccess } = useOutletContext() as any;
  const selectedPlan = location.state?.selectedPlan || "Free";
  const email = location.state?.email || "unknown email";
  const name = location.state?.name || "uknown user";

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

      const user = await onVerify(code);

      if (selectedPlan && selectedPlan !== "Free") {
        navigate(`/subscribe/${selectedPlan}`, {
          replace: true,
          state: { name: user.name, email: user.email },
        });
        return;
      }

      await onAuthSuccess({
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
          cachedBalance: user.cTraderConfig.cachedBalance,
          cachedEquity: user.cTraderConfig.cachedEquity,
        },
        tradeSettings: {
          balance:
            user.cTraderConfig?.isConnected && user.cTraderConfig?.cachedBalance
              ? user.cTraderConfig.cachedBalance
              : user.tradeSettings?.balance || 10000,

          riskPerTrade: user.tradeSettings?.riskPerTrade || 1,
          currency: user.tradeSettings?.currency || "USD",
        },
        notificationSettings: user.notificationSettings || {
          email: false,
          push: false,
          telegram: false,
        },
        telegram: user.telegram || {
          chatId: null,
          username: null,
          linkedAt: null,
        },
      });
    } catch (error: any) {
      console.log(error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Authentication failed. Please try again.";
      showToast(errorMessage, "error");
    }
  };

  const handleResend = async () => {
    try {
      await onResendCode();
      setTimer(60);
      showToast("Verification code has been resent.", "success");
    } catch (error) {
      console.log(error);
      showToast(
        "Could not resend verification code, please try again",
        "error",
      );
    }
  };

  return (
    <div className="flex flex-col items-center text-center px-4 py-6">
      <h2 className="text-3xl font-bold text-dark-text mb-2">
        Verify Your Email
      </h2>
      <p className="text-mid-text mb-6">
        We sent a 6-digit verification code to{" "}
        <span className="font-semibold">{email}</span>
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
        className="w-full py-3 bg-primary text-white rounded-xl flex items-center justify-center font-semibold hover:bg-primary-dark transition-all disabled:opacity-50"
        disabled={loading || otp.some((digit) => digit === "")}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
