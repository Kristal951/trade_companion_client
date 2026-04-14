import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const destination = location.state?.from?.pathname || "/dashboard";

  const [activeTrades, setActiveTrades] = useState<TradeRecord[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [floatingPnL, setFloatingPnL] = useState(0);

  // Load user-specific data only when the email changes
  useEffect(() => {
    if (!user?.email) {
      setActiveTrades([]);
      setTradeHistory([]);
      return;
    }

    const historyKey = `trade_history_${user.email}`;
    const tradesKey = `active_trades_${user.email}`;

    try {
      const savedHistory = localStorage.getItem(historyKey);
      const savedTrades = localStorage.getItem(tradesKey);
      
      setTradeHistory(savedHistory ? JSON.parse(savedHistory) : []);
      setActiveTrades(savedTrades ? JSON.parse(savedTrades) : []);
    } catch (err) {
      console.error("Storage parse error", err);
    }
  }, [user?.email]);

  // Persist Active Trades when they change
  useEffect(() => {
    if (user?.email && activeTrades.length > 0) {
      localStorage.setItem(`active_trades_${user.email}`, JSON.stringify(activeTrades));
    }
  }, [activeTrades, user?.email]);

  const liveEquity = useMemo(() => {
    const currentBalance = parseFloat(user?.tradeSettings?.balance?.toString() || "0");
    if (user?.cTraderConfig?.isConnected && user?.cTraderConfig?.cachedEquity) {
      return user.cTraderConfig.cachedEquity;
    }
    return currentBalance + floatingPnL;
  }, [user?.tradeSettings?.balance, user?.cTraderConfig, floatingPnL]);

  const handleLoginRequest = useCallback(
    (data: any) => {
      setUser(data, true);
      showToast(`Welcome back, ${data.name.split(" ")[0]}!`, "success");
      // Use replace to prevent back-button loops
      navigate(destination, { replace: true });
    },
    [navigate, setUser, showToast, destination]
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      localStorage.removeItem("accessToken"); // Explicitly clear token
      setActiveTrades([]);
      window.location.replace("/auth/signIn");
    } catch (error) {
      showToast("Logout failed. Please try again.", "error");
    }
  }, [logout, showToast]);

  const handleScreenshotAttempt = useCallback(() => {
    showToast("Screenshot attempt detected. Security protocols active.", "error");
  }, [showToast]);

  return {
    activeTrades,
    setActiveTrades,
    tradeHistory,
    setTradeHistory,
    floatingPnL,
    setFloatingPnL,
    liveEquity,
    handleLoginRequest,
    handleLogout,
    handleScreenshotAttempt,
  };
}