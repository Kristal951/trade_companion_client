import React, { useState, useEffect } from "react";
import LandingPage from "./components/onboarding/LandingPage";
import {
  AnalyticsPage,
  EducationPage,
} from "./components/dashboard/DashboardPage";
import AIChatbot from "./components/widgets/AIChatWidget";
import Toast from "./components/ui/Toast";
import ScreenshotDetector from "./components/ui/ScreenshotDetector";
import { DashboardView, TradeRecord } from "./types";
import { instrumentDefinitions } from "./config/instruments";
import useAppStore from "./store/useStore";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import MentorProfilePage from "./components/mentors/MentorProfilePage";
import LotSizeCalculatorPage from "./components/calculator/LotSizeCalculatorPage";
import MarketChartPage from "./components/dashboard/MarketChartPage";
import AISignalsPage from "./pages/AISignalsPage";
import MentorPage from "./pages/MentorPage";
import DashboardContainer from "./pages/dashboard/DashboardContainer";
import VerifyEmail from "./components/auth/VerifyEmail";
import ForgotPassword from "./components/auth/ForgotPassword";
import AuthLayout from "./components/auth/AuthLayout";
import LoginForm from "./components/auth/LoginForm";
import RootLayout from "./RootLayout";
import SignupForm from "./components/auth/SignupForm";
import ResetPassword from "./components/auth/ResetPassword";

export const App: React.FC = () => {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const logout = useAppStore((state) => state.logout);
  const updateUser = useAppStore((state) => state.updateUser);
  const loading = useAppStore((state) => state.loading);

  const [activeView, setActiveView] = useState<DashboardView>("dashboard");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("theme") as "light" | "dark";
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const [activeTrades, setActiveTrades] = useState<TradeRecord[]>(() => {
    if (!user) return [];
    try {
      const saved = localStorage.getItem(`active_trades_${user.email}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMentorMode, setIsMentorMode] = useState(false);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);

  // Theme effect
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Persist trades
  useEffect(() => {
    if (user)
      localStorage.setItem(
        `active_trades_${user.email}`,
        JSON.stringify(activeTrades)
      );
  }, [activeTrades, user]);

  useEffect(() => {
    setIsMentorMode(user?.isMentor || false);
  }, [isMentorMode, user]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const navigate = useNavigate();

  const toggleMentorMode = () => {
    const newMode = !isMentorMode;
    setIsMentorMode(newMode);
    setAccountMenuOpen(false);

    // Todo: Switch sidebar links based on mode
    // Automatically switch view to the main dashboard of the respective mode
    // if (newMode) {
    //   onViewChange("mentor_dashboard");
    // } else {
    //   onViewChange("dashboard");
    // }
  };

  const showToast = (
    message: string,
    type: "success" | "info" | "error" = "info"
  ) => setToast({ message, type });
  const closeToast = () => setToast(null);

  const handleLoginRequest = (user) => {
    setUser(user, true);
    try {
      const savedTrades = localStorage.getItem(`active_trades_${user.email}`);
      setActiveTrades(savedTrades ? JSON.parse(savedTrades) : []);
      navigate("/dashboard");
    } catch {
      setActiveTrades([]);
    }
    showToast(`Welcome back, ${user.name.split(" ")[0]}!`, "success");
  };

  const handleLogout = async () => {
    try {
      await logout();
      setActiveTrades([]);
      setActiveView("dashboard");
      showToast("You have been logged out.", "info");
    } catch (error) {
      console.log(error);
      showToast(
        "There was an error logging you out, try again later.",
        "error"
      );
    }
  };

  const handleScreenshotAttempt = () => {
    showToast(
      "Screenshot attempt detected. Repeated attempts may lead to account suspension.",
      "error"
    );
    console.warn(`[SYSTEM LOG] Screenshot attempt by user: ${user?.email}`);
  };

  const handleExecuteTrade = (tradeDetails: {
    instrument: string;
    type: "BUY" | "SELL";
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    confidence: number;
    reasoning: string;
  }) => {
    if (!user) return;

    if (activeTrades.some((t) => t.instrument === tradeDetails.instrument)) {
      showToast(
        `You already have an active trade for ${tradeDetails.instrument}`,
        "error"
      );
      return;
    }

    // Load user settings
    let currentEquity = 10000;
    let riskPct = 1.0;
    try {
      const settings = JSON.parse(
        localStorage.getItem(`tradeSettings_${user.email}`) ||
          '{"balance":"10000","risk":"1.0"}'
      );
      currentEquity = parseFloat(
        localStorage.getItem(`currentEquity_${user.email}`) || settings.balance
      );
      riskPct = parseFloat(settings.risk);
    } catch {}

    // Lot size calculation
    let lotSize = 0.01;
    let riskAmount = currentEquity * (riskPct / 100);

    try {
      const props = instrumentDefinitions[tradeDetails.instrument];
      if (props) {
        const stopPips =
          Math.abs(tradeDetails.entryPrice - tradeDetails.stopLoss) /
          props.pipStep;
        const pipValue =
          props.quoteCurrency === "USD"
            ? props.pipStep * props.contractSize
            : props.quoteCurrency === "JPY"
            ? (props.pipStep * props.contractSize) / 150
            : 10;
        const totalRisk = stopPips * pipValue;
        if (totalRisk > 0)
          lotSize = Math.max(
            0.01,
            parseFloat((riskAmount / totalRisk).toFixed(2))
          );
      }
    } catch (err) {
      console.error("Lot calculation failed", err);
    }

    const newTrade: TradeRecord = {
      id: new Date().toISOString(),
      status: "active",
      dateTaken: new Date().toISOString(),
      initialEquity: currentEquity,
      instrument: tradeDetails.instrument,
      type: tradeDetails.type,
      entryPrice: tradeDetails.entryPrice,
      stopLoss: tradeDetails.stopLoss,
      takeProfit: tradeDetails.takeProfit,
      confidence: tradeDetails.confidence,
      reasoning: tradeDetails.reasoning,
      lotSize,
      riskAmount: isNaN(riskAmount) ? 0 : parseFloat(riskAmount.toFixed(2)),
      technicalReasoning: "Manual AI Execution from Chat",
      takeProfit1: tradeDetails.takeProfit,
      timestamp: new Date().toISOString(),
    };

    setActiveTrades((prev) => [newTrade, ...prev]);
    showToast(
      `${tradeDetails.instrument} ${tradeDetails.type} executed successfully!`,
      "success"
    );
  };

  // if (!user) {
  //   return (
  //     <>
  //       <AuthLayout />
  //       {toast && (
  //         <Toast
  //           message={toast.message}
  //           type={toast.type}
  //           onClose={closeToast}
  //         />
  //       )}
  //     </>
  //   );
  // }

  return (
    <div className="w-full h-screen flex flex-col">
      <section
        className={`flex-1 relative transition-all duration-300 flex flex-col h-screen overflow-hidden`}
      >
        <ScreenshotDetector onScreenshotAttempt={handleScreenshotAttempt}>
          <Routes>
            {/* Public routes */}
            <Route
              path="auth"
              element={
                <AuthLayout
                  onAuthSuccess={handleLoginRequest}
                  showToast={showToast}
                />
              }
            >
              <Route index element={<Navigate to="signIn" replace />} />
              <Route path="signIn" element={<LoginForm />} />
              <Route path="signUp" element={<SignupForm />} />
              <Route path="verify-email" element={<VerifyEmail />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password/:token" element={<ResetPassword />} />
            </Route>

            {/* Protected routes */}
            <Route
              element={
                user ? (
                  <RootLayout
                    user={user}
                    toggleTheme={toggleTheme}
                    theme={theme}
                    isSidebarCollapsed={isSidebarCollapsed}
                    setIsSidebarCollapsed={setIsSidebarCollapsed}
                    activeTrades={activeTrades}
                    isMentorMode={isMentorMode}
                    setAccountMenuOpen={setAccountMenuOpen}
                    onLogout={handleLogout}
                    isAccountMenuOpen={isAccountMenuOpen}
                  />
                ) : (
                  <Navigate to="/auth/signIn" replace />
                )
              }
            >
              <Route
                path="dashboard"
                element={
                  <DashboardContainer
                    user={user}
                    activeTrades={activeTrades}
                    tradeHistory={tradeHistory}
                  />
                }
              />
              <Route
                path="ai_signals"
                element={
                  <AISignalsPage
                    user={user}
                    activeTrades={activeTrades}
                    showToast={showToast}
                    tradeHistory={tradeHistory}
                  />
                }
              />
              <Route path="mentors" element={<MentorPage user={user} />} />
              <Route path="mentor/:mentorId" element={<MentorProfilePage />} />
              <Route path="education" element={<EducationPage />} />
              <Route path="analytics" element={<AnalyticsPage user={user} />} />
              <Route path="ls_calculator" element={<LotSizeCalculatorPage />} />
              <Route path="market_chart" element={<MarketChartPage />} />
            </Route>

            {/* Landing page */}
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LandingPage onLoginRequest={handleLoginRequest} />
                )
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ScreenshotDetector>

        {user && (
          <AIChatbot
            user={user}
            activeView={activeView}
            onExecuteTrade={handleExecuteTrade}
          />
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        )}
      </section>
    </div>
  );
};
