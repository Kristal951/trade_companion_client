// dashboard/DashboardOverview.tsx
import { StatCard } from "@/components/dashboard/DashboardPage";
import Icon from "@/components/ui/Icon";
import { TradeRecord, User } from "@/types";
import { MOCK_MENTOR_POSTS } from "@/utils";
import React, { useState, useMemo, useCallback } from "react";
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
}

const DashboardOverview: React.FC<Props> = ({
  user,
  activeTrades,
  tradeHistory,
  closedTrades,
  liveEquity,
  floatingPnL,
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
          outerRadius={numOuterRadius + 8} // Pop out
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="var(--color-surface)"
          strokeWidth={2}
        />
      </g>
    );
  };

  const INITIAL_EQUITY_KEY = `initialEquity_${user.email}`;
  const PIE_COLORS = ["#6366F1", "#A78BFA", "#60A5FA", "#34D399", "#FB7185"];

  const [pieActiveIndex, setPieActiveIndex] = useState(0);

  const initialEquity = useMemo(
    () => Number(localStorage.getItem(INITIAL_EQUITY_KEY) || 10000),
    [INITIAL_EQUITY_KEY]
  );

  const chartEquityData = useMemo(() => {
    let cumulative = initialEquity;
    const data = [{ name: "Start", equity: cumulative }];

    tradeHistory
      .filter((t) => t.status !== "active")
      .forEach((trade, i) => {
        cumulative += trade.pnl || 0;
        data.push({ name: `T${i + 1}`, equity: +cumulative.toFixed(2) });
      });

    if (activeTrades.length) {
      data.push({ name: "Live", equity: +liveEquity.toFixed(2) });
    }

    return data;
  }, [tradeHistory, activeTrades, initialEquity, liveEquity]);

  const instrumentDistribution = useMemo(() => {
    const counts = tradeHistory.reduce((acc, t) => {
      acc[t.instrument] = (acc[t.instrument] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tradeHistory]);

  const onPieEnter = useCallback((_: any, index: number) => {
    setPieActiveIndex(index);
  }, []);

  const totalProfit = liveEquity - initialEquity;
  const winRate =
    closedTrades.length > 0
      ? ((closedTrades.filter((t) => t.status === "win").length /
          closedTrades.length) *
          100).toFixed(2)
      : "0";

      const latestSignals = useMemo(() => {
    const allSignals = [...activeTrades, ...tradeHistory];
    return allSignals
      .sort(
        (a, b) =>
          new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime()
      )
      .slice(0, 2);
  }, [activeTrades, tradeHistory]);

  const profitType = totalProfit >= 0 ? "gain" : "loss";
  const safeInitialEquity = isNaN(Number(initialEquity))
    ? 0
    : Number(initialEquity);
  const profitPercentage =
    safeInitialEquity > 0
      ? ((totalProfit / safeInitialEquity) * 100).toFixed(2)
      : "0.00";
      const safeLiveEquity = isNaN(Number(liveEquity)) ? 0 : Number(liveEquity);
    //   const totalTrades = signals.length;

  return (
    <div className="p-4 mb-4 bg-light-bg min-h-[calc(100vh-64px)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          onClick={() => navigate('/analytics')}
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
            // percentage={`${totalTrades} Closed Trades`}
            percentageType={parseFloat(winRate) >= 50 ? "gain" : "loss"}
            icon={<Icon name="check" className="w-5 h-5" />}
          />
        </div>
        <div
          onClick={() => navigate("/analytics")}
          className="cursor-pointer transition-transform transform hover:scale-105"
        >
          <StatCard
            title="Total P/L (Realized + Float)"
            value={`${totalProfit >= 0 ? "+" : "-"}$${Math.abs(
              totalProfit
            ).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            percentageType={totalProfit >= 0 ? "gain" : "loss"}
            icon={<Icon name="dashboard" className="w-5 h-5" />}
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
            <h3 className="text-xl font-bold text-dark-text mb-4">
              Latest AI Signals
            </h3>
            {latestSignals.length > 0 ? (
              <div className="space-y-4">
                {latestSignals.map((signal) => (
                  <div
                    key={signal.id}
                    className="bg-light-hover p-4 rounded-lg border border-light-gray flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-dark-text">
                        {signal.instrument} - {signal.type}
                      </p>
                      <p className="text-sm text-mid-text">
                        Entry: {signal.entryPrice.toFixed(4)} | SL:{" "}
                        {signal.stopLoss.toFixed(4)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        signal.status === "active"
                          ? "bg-info/20 text-info animate-pulse"
                          : signal.status === "win"
                          ? "bg-success/20 text-success"
                          : "bg-danger/20 text-danger"
                      }`}
                    >
                      {signal.status.charAt(0).toUpperCase() +
                        signal.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-mid-text py-4">
                No AI signals generated yet.
              </p>
            )}
            <button
              onClick={() => navigate("/ai_signals")}
              className="mt-4 w-full bg-primary/10 text-primary hover:bg-primary hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              View All AI Signals
            </button>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
            <h3 className="text-xl font-bold text-dark-text mb-4">
              Most Traded Instruments
            </h3>
            {instrumentDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    {...({ activeIndex: pieActiveIndex } as any)}
                    shape={renderActiveShape}
                    data={instrumentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                  >
                    {instrumentDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border-dark)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
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
            <div className="space-y-4">
              {MOCK_MENTOR_POSTS.slice(0, 2).map((post) => (
                <div
                  key={post.id}
                  className="bg-light-hover p-4 rounded-lg border border-light-gray"
                >
                  <h4 className="font-semibold text-dark-text">{post.title}</h4>
                  <p className="text-sm text-mid-text line-clamp-2">
                    {post.content}
                  </p>
                  <p className="text-xs text-mid-text mt-2">
                    {new Date(post.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
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
