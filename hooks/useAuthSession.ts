import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAccessToken } from "../utils";
import { TradeRecord } from "../types";

type Params = {
  user: any;
  setUser: (data: any, persist?: boolean) => void;
  logout: () => Promise<void>;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
};

export function useAuthSession({ user, setUser, logout, showToast }: Params) {
  const navigate = useNavigate();

  const [activeTrades, setActiveTrades] = useState<TradeRecord[]>([]);

  const TRADE_HISTORY_KEY = `trade_history_${user.email}`;

  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>(() =>
    JSON.parse(localStorage.getItem(TRADE_HISTORY_KEY) || "[]"),
  );
  const [floatingPnL, setFloatingPnL] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) setAccessToken(token);
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    localStorage.setItem(
      `active_trades_${user.email}`,
      JSON.stringify(activeTrades),
    );
  }, [activeTrades, user]);

  useEffect(() => {
    try {
      if (!user?.email) return;

      const saved = localStorage.getItem(`active_trades_${user.email}`);
      if (saved) {
        setActiveTrades(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to load active trades:", err);
    }
  }, [user?.email]);

  const EQUITY_KEY = useMemo(
    () => `currentEquity_${user?.email ?? "guest"}`,
    [user?.email],
  );

  const currentBalance = parseFloat(
    user?.tradeSettings?.balance?.toString() ||
      localStorage.getItem(EQUITY_KEY) ||
      "10000",
  );

  const liveEquity = currentBalance + floatingPnL;

  const handleLoginRequest = useCallback(
    (data: any) => {
      setUser(data, true);

      try {
        const savedTrades = localStorage.getItem(`active_trades_${data.email}`);
        setActiveTrades(savedTrades ? JSON.parse(savedTrades) : []);
      } catch {
        setActiveTrades([]);
      }

      showToast(`Welcome back, ${data.name.split(" ")[0]}!`, "success");
      navigate("/dashboard");
    },
    [navigate, setUser, showToast],
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      localStorage.removeItem("app-storage");
      setActiveTrades([]);
      window.location.replace("/auth/signIn");
    } catch (error) {
      console.log(error);
      showToast(
        "There was an error logging you out, try again later.",
        "error",
      );
    }
  }, [logout, showToast]);

  const handleScreenshotAttempt = useCallback(() => {
    showToast(
      "Screenshot attempt detected. Repeated attempts may lead to account suspension.",
      "error",
    );
    console.warn(`[SYSTEM LOG] Screenshot attempt by user: ${user?.email}`);
  }, [showToast, user?.email]);

  return {
    activeTrades,
    setActiveTrades,
    tradeHistory,
    setTradeHistory,
    floatingPnL,
    setFloatingPnL,
    liveEquity,
    EQUITY_KEY,
    handleLoginRequest,
    handleLogout,
    handleScreenshotAttempt,
  };
}
