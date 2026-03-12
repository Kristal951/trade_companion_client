import { useEffect } from "react";
import { TradeRecord } from "../types";
import { getLivePrices } from "../services/marketDataService";
import { instrumentDefinitions } from "../config/instruments";
import React from 'react'

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
      if (activeTrades.length === 0) return;

      const uniqueInstruments = Array.from(
        new Set(activeTrades.map((t) => t.instrument)),
      );

      const livePrices = await getLivePrices(uniqueInstruments);
      let totalFloating = 0;

      const updatedActiveTrades = activeTrades.map((trade) => {
        const priceData = livePrices[trade.instrument];
        if (!priceData || priceData.price === null) return trade;

        if (priceData.isMock) {
          if (typeof trade.pnl === "number") totalFloating += trade.pnl;
          return trade;
        }

        const currentPrice = priceData.price;
        const instrumentDef = instrumentDefinitions[trade.instrument];
        const contractSize = instrumentDef.contractSize;
        const lotSize = trade.lotSize || 0;
        const direction = trade.type === "BUY" ? 1 : -1;

        let tradePnL =
          (currentPrice - trade.entryPrice) *
          (lotSize * contractSize) *
          direction;

        if (instrumentDef.quoteCurrency === "JPY") tradePnL /= 150;
        else if (instrumentDef.quoteCurrency === "CHF") tradePnL /= 0.9;
        else if (instrumentDef.quoteCurrency === "CAD") tradePnL /= 1.35;
        else if (instrumentDef.quoteCurrency === "GBP") tradePnL *= 1.25;

        totalFloating += tradePnL;

        return { ...trade, pnl: tradePnL, currentPrice };
      });

      const closedTradeItems: {
        trade: TradeRecord;
        outcome: "win" | "loss";
        exitPrice: number;
      }[] = [];

      updatedActiveTrades.forEach((trade) => {
        const priceData = livePrices[trade.instrument];
        if (!priceData || priceData.price === null || priceData.isMock) return;

        const currentPrice = priceData.price;

        const isWin =
          trade.type === "BUY"
            ? currentPrice >= trade.takeProfit
            : currentPrice <= trade.takeProfit;

        const isLoss =
          trade.type === "BUY"
            ? currentPrice <= trade.stopLoss
            : currentPrice >= trade.stopLoss;

        if (isWin) {
          closedTradeItems.push({
            trade,
            outcome: "win",
            exitPrice: trade.takeProfit,
          });
        } else if (isLoss) {
          closedTradeItems.push({
            trade,
            outcome: "loss",
            exitPrice: trade.stopLoss,
          });
        }
      });

      if (closedTradeItems.length > 0) {
        const closedTradeIds = new Set(
          closedTradeItems.map((item) => item.trade.id),
        );

        const newActiveTrades = updatedActiveTrades.filter(
          (t) => !closedTradeIds.has(t.id),
        );

        let currentEquity = parseFloat(
          localStorage.getItem(EQUITY_KEY) || "10000",
        );

        const newHistoryItems: TradeRecord[] = [];

        closedTradeItems.forEach((item) => {
          const { trade, outcome, exitPrice } = item;
          const instrumentProps = instrumentDefinitions[trade.instrument];
          const contractSize = instrumentProps?.contractSize || 100000;
          const lotSize = trade.lotSize || 0;

          let pnl =
            (exitPrice - trade.entryPrice) *
            (lotSize * contractSize) *
            (trade.type === "BUY" ? 1 : -1);

          if (instrumentProps.quoteCurrency === "JPY") pnl /= 150;
          else if (instrumentProps.quoteCurrency === "CHF") pnl /= 0.9;
          else if (instrumentProps.quoteCurrency === "CAD") pnl /= 1.35;
          else if (instrumentProps.quoteCurrency === "GBP") pnl *= 1.25;

          currentEquity += pnl;

          showToast(
            `${trade.instrument} trade closed as a ${outcome}. P&L: $${pnl.toFixed(2)}`,
            outcome === "win" ? "success" : "error",
          );

          newHistoryItems.push({
            ...trade,
            status: outcome,
            pnl,
            finalEquity: currentEquity,
            dateClosed: new Date().toISOString(),
          });
        });

        setActiveTrades(newActiveTrades);
        setTradeHistory((prev) => [...newHistoryItems, ...prev]);
        localStorage.setItem(EQUITY_KEY, currentEquity.toString());
        window.dispatchEvent(new Event("storage"));
      } else {
        setActiveTrades(updatedActiveTrades);
      }
    }, 5000);

    return () => clearInterval(monitorInterval);
  }, [activeTrades, setActiveTrades, setTradeHistory, showToast, user?.email]);
}