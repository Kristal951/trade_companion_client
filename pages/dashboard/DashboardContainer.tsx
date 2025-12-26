import React, { useMemo } from "react";
import DashboardOverview from "./DashboardOverview";
import { TradeRecord, User } from "@/types";
// import { User, TradeRecord } from "../types";


interface Props {
  user: User;
  activeTrades: TradeRecord[];
  tradeHistory: TradeRecord[];
  liveEquity: number;
  floatingPnL: number;
}

const DashboardContainer: React.FC<Props> = ({
  user,
  activeTrades,
  tradeHistory,
  liveEquity,
  floatingPnL,
}) => {
  // Example: filter closed trades once
  const closedTrades = useMemo(
    () => tradeHistory.filter((t) => t.status !== "active"),
    [tradeHistory]
  );

  return (
    <DashboardOverview
      user={user}
      activeTrades={activeTrades}
      tradeHistory={tradeHistory}
      closedTrades={closedTrades}
      liveEquity={liveEquity}
      floatingPnL={floatingPnL}
    />
  );
};

export default DashboardContainer;
