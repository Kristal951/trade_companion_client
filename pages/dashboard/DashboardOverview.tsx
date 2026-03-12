// dashboard/DashboardOverview.tsx
import { StatCard } from "@/components/dashboard/DashboardPage";
import Icon from "@/components/ui/Icon";
import Spinner from "@/components/ui/Spinner";
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
}

type AISignal = {
  _id: string;
  userId: string;
  instrument: string;
  type: "BUY" | "SELL";
  status: string;
  entryPrice: number;
  stopLoss: number;
  takeProfits: number[];
  confidence?: number | null;
  createdAt?: string;
  executedAt?: string | null;
};

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

  const initialEquity = useMemo(
    () => Number(localStorage.getItem(INITIAL_EQUITY_KEY) || 10000),
    [INITIAL_EQUITY_KEY],
  );

  const [recentAISignals, setRecentAISignals] = useState<AISignal[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const uid = user?._id || (user as any)?.id || user?.email;

    if (!uid) return;

    const controller = new AbortController();

    (async () => {
      try {
        setAiLoading(true);
        setAiError(null);

        const res = await API.get(
          `/api/signals/ai/user/${encodeURIComponent(String(uid))}?limit=5`,
        );

        const data = await res.data;

        const items: AISignal[] = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.signals)
            ? data.signals
            : [];

        setRecentAISignals(items.slice(0, 5));
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setAiError(err?.message || "Failed to fetch AI signals");
      } finally {
        setAiLoading(false);
      }
    })();

    return () => controller.abort();
  }, [user]);

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
    const counts = tradeHistory.reduce((acc: any, t) => {
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
      ? (
          (closedTrades.filter((t) => t.status === "win").length /
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

  return (
    <div className="p-4 mb-4 bg-light-bg min-h-[calc(100vh-64px)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          onClick={() => navigate("/analytics")}
          className="cursor-pointer transition-transform transform hover:scale-105"
        >
          <StatCard
            title="Total P/L (Realized + Float)"
            value={`${totalProfit >= 0 ? "+" : "-"}$${Math.abs(
              totalProfit,
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

          {/* ✅ Latest AI Signals (Now fetching 5) */}
          <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
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
                  <div
                    key={signal._id}
                    className="bg-light-hover p-4 rounded-lg border border-light-gray flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-dark-text">
                        {signal.instrument} - {signal.type}
                      </p>
                      <p className="text-sm text-mid-text">
                        Entry: {fmtPrice(signal.entryPrice)} | SL:{" "}
                        {fmtPrice(signal.stopLoss)}
                      </p>

                      {signal.createdAt ? (
                        <p className="text-xs text-mid-text mt-1">
                          {new Date(signal.createdAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusBadge(
                        signal.status,
                      )}`}
                    >
                      {statusLabel(signal.status)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-mid-text py-4">
                No AI signals generated yet.
              </p>
            )}

            {
              recentAISignals.length > 0 && (
<button
              onClick={() => navigate("/ai_signals")}
              className="mt-4 w-full bg-primary/10 text-primary hover:bg-primary hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              View All AI Signals
            </button>
              )
            }
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
