import { TradeRecord } from "../types";
import { instrumentDefinitions } from "../config/instruments";
import React from "react";

type Params = {
  user: any;
  activeTrades: TradeRecord[];
  setActiveTrades: React.Dispatch<React.SetStateAction<TradeRecord[]>>;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
};

export function useTradeExecution({
  user,
  activeTrades,
  setActiveTrades,
  showToast,
}: Params) {
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

    if (
      activeTrades.some((t) => t.signal.instrument === tradeDetails.instrument)
    ) {
      showToast(
        `You already have an active trade for ${tradeDetails.instrument}`,
        "error",
      );
      return;
    }

    let currentEquity = 10000;
    let riskPct = 1.0;

    try {
      const settings = JSON.parse(
        localStorage.getItem(`tradeSettings_${user.email}`) ||
          '{"balance":"10000","risk":"1.0"}',
      );

      currentEquity = parseFloat(
        localStorage.getItem(`currentEquity_${user.email}`) || settings.balance,
      );

      riskPct = parseFloat(settings.risk);
    } catch {}

    let lotSize = 0.01;
    const riskAmount = currentEquity * (riskPct / 100);

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

        if (totalRisk > 0) {
          lotSize = Math.max(
            0.01,
            parseFloat((riskAmount / totalRisk).toFixed(2)),
          );
        }
      }
    } catch (err) {
      console.error("Lot calculation failed", err);
    }

    const newTrade: TradeRecord = {
      id: new Date().getTime().toString(), 
      status: "active",
      pnl: 0,
      currentPrice: tradeDetails.entryPrice,
      dateTaken: new Date().toISOString(),
      initialEquity: currentEquity,
      takeProfit: tradeDetails.takeProfit,

      signal: {
        _id: `manual_${new Date().getTime()}`,
        userId: user._id || user.id,
        instrument: tradeDetails.instrument,
        type: tradeDetails.type,
        status: "executed",
        entryPrice: tradeDetails.entryPrice,
        stopLoss: tradeDetails.stopLoss,
        takeProfits: [tradeDetails.takeProfit], // Expects number[]
        confidence: tradeDetails.confidence,
        reasoning: tradeDetails.reasoning,
        technicalReasoning: "Manual AI Execution from Chat",
        createdAt: new Date().toISOString(),
        executedAt: new Date().toISOString(),
        executedPrice: tradeDetails.entryPrice,
        lotSize: lotSize,
        riskAmount: isNaN(riskAmount) ? 0 : parseFloat(riskAmount.toFixed(2)),
      },
    };
    setActiveTrades((prev) => [newTrade, ...prev]);
    showToast(
      `${tradeDetails.instrument} ${tradeDetails.type} executed successfully!`,
      "success",
    );
  };

  return { handleExecuteTrade };
}
