import InstrumentPieChart from "@/components/dashboard/EquityChart";
import MentorPostCard from "@/components/dashboard/MentorPostCard";
import SignalCard from "@/components/dashboard/SignalCard";
import Icon from "@/components/ui/Icon";
import Spinner from "@/components/ui/Spinner";
import { StatCard } from "@/components/ui/StatCard";
import { useSignalStore } from "@/store/signalStore";
import { TradeRecord, User } from "@/types";
import { API, MOCK_MENTOR_POSTS } from "@/utils";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";

interface Props {
  user: User;
  activeTrades: TradeRecord[];
  tradeHistory: TradeRecord[];
  closedTrades: TradeRecord[];
  liveEquity: number;
  floatingPnL: number;
  setActiveTrades: React.Dispatch<React.SetStateAction<TradeRecord[]>>;
  setTradeHistory: React.Dispatch<React.SetStateAction<TradeRecord[]>>;
}

const DashboardOverview: React.FC<Props> = ({
  user,
  activeTrades,
  tradeHistory,
  closedTrades,
  liveEquity,
  floatingPnL,
  getUserMentorPost,
  dashboardMentorPosts,
  isFetchingDashboardMentorPosts,
  setActiveTrades,
  setTradeHistory,
}) => {
  const navigate = useNavigate();

  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
    } = props;

    const numCy = Number(cy);
    const numOuterRadius = Number(outerRadius);
    const numPercent = Number(percent);

    return (
      <g>
        <text
          x={cx}
          y={numCy - 10}
          textAnchor="middle"
          fill="var(--color-text)"
          className="font-bold"
        >
          {payload.name}
        </text>
        <text
          x={cx}
          y={numCy + 10}
          textAnchor="middle"
          fill="var(--color-text-mid)"
        >{`${(numPercent * 100).toFixed(0)}%`}</text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={numOuterRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="var(--color-surface)"
          strokeWidth={2}
        />
      </g>
    );
  };

  const INITIAL_EQUITY_KEY = `initialEquity_${user?.email}`;
  const PIE_COLORS = ["#6366F1", "#A78BFA", "#60A5FA", "#34D399", "#FB7185"];

  const [pieActiveIndex, setPieActiveIndex] = useState(0);

  const brokerBalance = user?.cTraderConfig?.isConnected
    ? user?.cTraderConfig?.cachedBalance
    : user?.tradeSettings?.balance;

  const initialEquity = parseFloat(
    brokerBalance?.toString() ||
      localStorage.getItem(INITIAL_EQUITY_KEY) ||
      "10000",
  );

  const chartEquityData = useMemo(() => {
    let cumulative = initialEquity;
    const data = [{ name: "Start", equity: cumulative }];

    tradeHistory
      .filter((t: any) => t.status !== "active")
      .forEach((trade: any, i: number) => {
        cumulative += trade.pnl || 0;
        data.push({ name: `T${i + 1}`, equity: +cumulative.toFixed(2) });
      });

    if (activeTrades.length) {
      data.push({ name: "Live", equity: +liveEquity.toFixed(2) });
    }

    return data;
  }, [tradeHistory, activeTrades, initialEquity, liveEquity]);

  const instrumentDistribution = useMemo(() => {
    const counts = tradeHistory.reduce((acc: any, t: any) => {
      acc[t.instrument] = (acc[t.instrument] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tradeHistory]);

  const onPieEnter = useCallback((_: any, index: number) => {
    setPieActiveIndex(index);
  }, []);

  const totalProfit =
    user?.tradeSettings?.balance > 0 ? liveEquity - initialEquity : 0;

  const winRate =
    closedTrades.length > 0
      ? (
          (closedTrades.filter((t: any) => t.status === "win").length /
            closedTrades.length) *
          100
        ).toFixed(2)
      : "0";

  const profitType = totalProfit >= 0 ? "gain" : "loss";
  const safeInitialEquity = isNaN(Number(initialEquity))
    ? 0
    : Number(initialEquity);

  const profitPercentage =
    safeInitialEquity > 0
      ? ((totalProfit / safeInitialEquity) * 100).toFixed(2)
      : "0.00";

  const safeLiveEquity = isNaN(Number(liveEquity)) ? 0 : Number(liveEquity);
  const safeLiveBalance = isNaN(Number(user?.tradeSettings?.balance))
    ? 0
    : Number(user?.tradeSettings?.balance);
  const safeProfit = Number(totalProfit) || 0;

  const fmtPrice = (n: number, digits = 4) =>
    Number.isFinite(Number(n)) ? Number(n).toFixed(digits) : "-";

  const statusBadge = (status?: string) => {
    const s = String(status || "").toLowerCase();

    if (["new"].includes(s)) return "bg-info/20 text-info";
    if (["executed", "active"].includes(s))
      return "bg-info/20 text-info animate-pulse";
    if (["win", "closed", "tp"].includes(s))
      return "bg-success/20 text-success";
    if (["loss", "sl"].includes(s)) return "bg-danger/20 text-danger";
    if (["cancelled", "expired"].includes(s)) return "bg-dark/10 text-mid-text";
    return "bg-dark/10 text-mid-text";
  };

  const statusLabel = (status?: string) => {
    const s = String(status || "");
    if (!s) return "Unknown";
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  };

  const { recentAISignals, aiLoading, aiError, loadRecentAISignals } =
    useSignalStore();

  const uid = user?._id || (user as any)?.id || user?.email;

  useEffect(() => {
    if (!uid) return;

    loadRecentAISignals(String(uid));

    const interval = setInterval(() => {
      loadRecentAISignals(String(uid));
    }, 60000);

    return () => clearInterval(interval);
  }, [uid]);

  useEffect(() => {
    if (!recentAISignals || recentAISignals.length === 0) return;

    const trades: TradeRecord[] = recentAISignals.map((signal) => ({
      id: signal._id,

      status: "active",

      pnl: 0,
      currentPrice: signal.entryPrice,

      // ✅ FIX: use createdAt safely
      dateTaken: signal.createdAt ?? new Date().toISOString(),

      // ✅ FIX: AISignal has executedAt (NOT dateClosed)
      dateClosed: signal.executedAt ?? undefined,

      initialEquity: liveEquity,
      finalEquity: 0,

      // ✅ FIX: takeProfits array → single number
      takeProfit: signal.takeProfits?.[0] ?? 0,

      // keep original signal if needed
      signal,
    }));

    setActiveTrades(trades);
  }, [recentAISignals, liveEquity, setActiveTrades]);

  const sign = safeProfit > 0 ? "+" : safeProfit < 0 ? "-" : "";

  const formatCurrency = (num: number) => {
    const value = Number(num) || 0;
    const sign = value > 0 ? "+" : value < 0 ? "-" : "";

    return `${sign}$${Math.abs(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  useEffect(() => {
    getUserMentorPost();
  }, []);

  const PALETTE = [
    "#818CF8", // indigo
    "#34D399", // green
    "#F59E0B", // amber
    "#EF4444", // red
    "#60A5FA", // blue
    "#A78BFA", // purple
    "#F472B6", // pink
    "#22C55E", // lime
  ];

  const hashStringToIndex = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const getPairColor = (pair: string) => {
    const index = hashStringToIndex(pair) % PALETTE.length;
    return PALETTE[index];
  };

  return (
    <div className="p-4 mb-4 bg-light-bg min-h-[calc(100vh-64px)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          onClick={() => navigate("/analytics")}
          className="cursor-pointer transition-transform transform hover:scale-105"
        >
          <StatCard
            title="Balance"
            value={`$${safeLiveBalance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            percentageType={totalProfit >= 0 ? "gain" : "loss"}
            icon={<Icon name="wallet" className="w-6 h-6" />}
            subValue={
              <span className="text-blue-500 font-semibold">
                Realized Balance
              </span>
            }
          />
        </div>

        <div
          onClick={() => navigate("/analytics")}
          className="cursor-pointer transition-transform transform hover:scale-105"
        >
          <StatCard
            title="Live Equity"
            value={`$${safeLiveEquity.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            percentage={`${
              profitType === "gain" ? "+" : ""
            }${profitPercentage}% Total`}
            percentageType={profitType}
            icon={<Icon name="signals" className="w-5 h-5" />}
            subValue={
              activeTrades.length > 0 ? (
                <span
                  className={floatingPnL >= 0 ? "text-success" : "text-danger"}
                >
                  Floating: {floatingPnL >= 0 ? "+" : "-"}$
                  {Math.abs(floatingPnL).toFixed(2)}
                </span>
              ) : null
            }
          />
        </div>

        <div
          onClick={() => navigate("/analytics")}
          className="cursor-pointer transition-transform transform hover:scale-105"
        >
          <StatCard
            title="AI Signal Win Rate"
            value={`${winRate}%`}
            percentageType={parseFloat(winRate) >= 50 ? "gain" : "loss"}
            icon={<Icon name="check" className="w-5 h-5" />}
          />
        </div>

        <div
          onClick={() => navigate("/ai_signals")}
          className="cursor-pointer transition-transform transform hover:scale-105"
        >
          <StatCard
            title="Open Positions"
            value={activeTrades.length.toString()}
            percentage="From AI Signals"
            percentageType="info"
            icon={<Icon name="analytics" className="w-5 h-5" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
            <h3 className="text-xl font-bold text-dark-text mb-4">
              Account Equity Growth
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={chartEquityData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818CF8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border-light)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  stroke="var(--color-text-mid)"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  stroke="var(--color-text-mid)"
                  domain={[
                    (dataMin: any) => parseFloat(String(dataMin)) * 0.99,
                    (dataMax: any) => parseFloat(String(dataMax)) * 1.01,
                  ]}
                  tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border-dark)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "var(--color-text)" }}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="var(--color-primary)"
                  fillOpacity={1}
                  fill="url(#colorEquity)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
            {/* <div className="w-full flex items-center justify-between"> */}
            <h3 className="text-xl font-bold text-dark-text mb-4">
              Latest AI Signals
            </h3>

            {aiLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Spinner w="5" h="5" />
              </div>
            ) : aiError ? (
              <p className="text-center text-danger py-8">{aiError}</p>
            ) : recentAISignals.length > 0 ? (
              <div className="space-y-4">
                {recentAISignals.map((signal) => (
                  <div key={signal._id}>
                    <SignalCard signal={signal} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-mid-text py-4">
                No AI signals generated yet.
              </p>
            )}

            {recentAISignals.length > 0 && (
              <button
                onClick={() => navigate("/ai_signals")}
                className="mt-4 w-full bg-primary/10 text-primary hover:bg-primary hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                View All AI Signals
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
            <h3 className="text-xl font-bold text-dark-text mb-4">
              Most Traded Instruments
            </h3>

            {instrumentDistribution.length > 0 ? (
              <InstrumentPieChart
                instrumentDistribution={instrumentDistribution}
              />
            ) : (
              <p className="text-center text-mid-text py-16">
                No trade history to analyze.
              </p>
            )}
          </div>

          <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
            <h3 className="text-xl font-bold text-dark-text mb-4">
              You are following
            </h3>

            <div className="space-y-2">
              {isFetchingDashboardMentorPosts && dashboardMentorPosts <= 0 ? (
                <div className="w-full h-full p-4 flex items-center justify-center">
                  <Spinner w={5} h={5} />
                </div>
              ) : (
                dashboardMentorPosts.map((post) => (
                  <MentorPostCard post={post} />
                ))
              )}
            </div>

            <button
              onClick={() => navigate("/mentors")}
              className="mt-4 w-full bg-primary/10 text-primary hover:bg-primary hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              View All Mentors
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
