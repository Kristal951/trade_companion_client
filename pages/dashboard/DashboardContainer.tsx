import React, { useMemo } from "react";
import DashboardOverview from "./DashboardOverview";
import { TradeRecord, User } from "@/types";

interface Props {
  user: User;
  activeTrades: TradeRecord[];
  tradeHistory: TradeRecord[];
  liveEquity: number;
  floatingPnL: number;
  setActiveTrades: any;
}

const DashboardContainer: React.FC<Props> = ({
  user,
  activeTrades,
  tradeHistory,
  liveEquity,
  floatingPnL,
  setActiveTrades,
  setTradeHistory
}) => {
  const closedTrades = useMemo(
    () => tradeHistory.filter((t) => t.status !== "active"),
    [tradeHistory],
  );

  return (
    <DashboardOverview
      user={user}
      activeTrades={activeTrades}
      tradeHistory={tradeHistory}
      closedTrades={closedTrades}
      liveEquity={liveEquity}
      floatingPnL={floatingPnL}
      setActiveTrades={setActiveTrades}
      setTradeHistory={setTradeHistory}
    />
  );
};

export default DashboardContainer;
