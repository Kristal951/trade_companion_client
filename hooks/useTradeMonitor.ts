import { useEffect } from "react";
import { TradeRecord } from "../types";
import { getLivePrices } from "../services/marketDataService";
import { instrumentDefinitions } from "../config/instruments";
import React from "react";

type Params = {
  user: any;
  activeTrades: TradeRecord[];
  setActiveTrades: React.Dispatch<React.SetStateAction<TradeRecord[]>>;
  setTradeHistory: React.Dispatch<React.SetStateAction<TradeRecord[]>>;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
};

export function useTradeMonitor({
  user,
  activeTrades,
  setActiveTrades,
  setTradeHistory,
  showToast,
}: Params) {
  useEffect(() => {
    if (!user?.email) return;

    const EQUITY_KEY = `currentEquity_${user.email}`;

    const monitorInterval = setInterval(async () => {
      // Use a ref-like approach or functional updates to avoid dependency loops
      // We check the length from the latest state inside the interval
      setActiveTrades(async (currentActive) => {
        if (currentActive.length === 0) return currentActive;

        // If uniqueInstruments is showing as unknown[]
        const uniqueInstruments: string[] = Array.from(
          new Set(activeTrades.map((t) => t.signal.instrument as string)),
        );
        try {
          const livePrices = await getLivePrices(uniqueInstruments);
          let totalFloating = 0;

          // 1. Calculate new PnL for everyone
          const updatedActiveTrades = currentActive.map((trade) => {
            const sig = trade.signal; // Shortcut to nested signal
            const priceData = livePrices[sig.instrument];

            if (!priceData || priceData.price === null || priceData.isMock) {
              if (typeof trade.pnl === "number") totalFloating += trade.pnl;
              return trade;
            }

            const currentPrice = priceData.price;
            const instrumentDef = instrumentDefinitions[sig.instrument];
            const contractSize = instrumentDef?.contractSize || 100000;
            const lotSize = sig.lotSize || 0;
            const direction = sig.type === "BUY" ? 1 : -1;

            let tradePnL =
              (currentPrice - sig.entryPrice) *
              (lotSize * contractSize) *
              direction;

            // Simple conversion logic
            if (instrumentDef.quoteCurrency === "JPY") tradePnL /= 150;
            else if (instrumentDef.quoteCurrency === "CHF") tradePnL /= 0.9;
            else if (instrumentDef.quoteCurrency === "CAD") tradePnL /= 1.35;
            else if (instrumentDef.quoteCurrency === "GBP") tradePnL *= 1.25;

            totalFloating += tradePnL;

            return { ...trade, pnl: tradePnL, currentPrice };
          });

          // 2. Identify trades that hit SL or TP
          const toClose: typeof updatedActiveTrades = [];
          const toStay: typeof updatedActiveTrades = [];

          updatedActiveTrades.forEach((trade) => {
            const sig = trade.signal;
            const isWin =
              sig.type === "BUY"
                ? trade.currentPrice >= sig.takeProfits[0]
                : trade.currentPrice <= sig.takeProfits[0];

            const isLoss =
              sig.type === "BUY"
                ? trade.currentPrice <= sig.stopLoss
                : trade.currentPrice >= sig.stopLoss;

            if (isWin || isLoss) toClose.push(trade);
            else toStay.push(trade);
          });

          // 3. Handle Closures
          if (toClose.length > 0) {
            let currentEquity = parseFloat(
              localStorage.getItem(EQUITY_KEY) || "10000",
            );

            const historyItems = toClose.map((trade) => {
              currentEquity += trade.pnl;
              const outcome = trade.pnl >= 0 ? "win" : "loss";

              showToast(
                `${trade.signal.instrument} closed as ${outcome}. P&L: $${trade.pnl.toFixed(2)}`,
                outcome === "win" ? "success" : "error",
              );

              return {
                ...trade,
                status: outcome,
                dateClosed: new Date().toISOString(),
                finalEquity: currentEquity,
              };
            });

            setTradeHistory((prev) => [...historyItems, ...prev]);
            localStorage.setItem(EQUITY_KEY, currentEquity.toString());
            window.dispatchEvent(new Event("storage"));

            return toStay;
          }

          return updatedActiveTrades;
        } catch (err) {
          console.error("Monitor loop error:", err);
          return currentActive;
        }
      });
    }, 5000);

    return () => clearInterval(monitorInterval);
  }, [user?.email, setActiveTrades, setTradeHistory, showToast]);
  // Dependency array is now clean and stable
}
