import React, { useState, useCallback, useMemo } from "react";
import { TradeRecord, User } from "@/types";
import { MOCK_MENTORS_LIST } from "@/utils";
import Icon from "@/components/ui/Icon";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ThemedChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glassmorphism p-3 rounded-lg text-sm shadow-lg border border-light-gray">
        <p className="font-bold text-dark-text mb-1">{label}</p>
        {payload.map((pld: any, index: number) => {
          const value = pld.value;
          const name = pld.name || pld.dataKey;
          let formattedValue = value;
          if (
            name === "Equity" ||
            name === "P/L" ||
            name.includes("Net P/L") ||
            name === "Earnings"
          ) {
            formattedValue = value.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            });
          }
          if (name.toLowerCase().includes("rate")) {
            formattedValue = `${value.toFixed(2)}%`;
          }

          return (
            <p
              key={index}
              style={{ color: pld.color || pld.fill }}
              className="font-semibold"
            >
              {`${name}: ${formattedValue}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export const AnalyticsPage: React.FC<{
  user: User;
  liveEquity: number;
  floatingPnL: number;
}> = ({ user, liveEquity, floatingPnL }) => {
  const TRADE_HISTORY_KEY = `trade_history_${user.email}`;
  const INITIAL_EQUITY_KEY = user?.tradeSettings?.balance || 10000;
  const PIE_COLORS = [
    "#6366F1",
    "#A78BFA",
    "#60A5FA",
    "#34D399",
    "#FB7185",
    "#FBBF24",
  ];

  const [tradeHistory] = useState<TradeRecord[]>(() =>
    JSON.parse(localStorage.getItem(TRADE_HISTORY_KEY) || "[]"),
  );
  const [initialEquity] = useState<number>(() =>
    parseFloat(user.tradeSettings.balance || localStorage.getItem(INITIAL_EQUITY_KEY) || 10000),
  );
  const [pieActiveIndex, setPieActiveIndex] = useState(0);

  const onPieEnter = useCallback(
    (_: any, index: number) => {
      setPieActiveIndex(index);
    },
    [setPieActiveIndex],
  );

  const analyticsData = useMemo(() => {
    const closedTrades = tradeHistory
      .filter((t) => t.status !== "active")
      .sort(
        (a, b) =>
          new Date(a.dateClosed!).getTime() - new Date(b.dateClosed!).getTime(),
      );

    const equityData = [{ name: "Start", equity: initialEquity }];
    let cumulativeEquity = initialEquity;
    closedTrades.forEach((trade, index) => {
      cumulativeEquity += trade.pnl || 0;
      equityData.push({
        name: `T${index + 1}`,
        equity: parseFloat(cumulativeEquity.toFixed(2)),
      });
    });

    equityData.push({
      name: "Live",
      equity: parseFloat(liveEquity.toFixed(2)),
    });

    const totalPnl = liveEquity - initialEquity;

    const pnlPerTradeData = closedTrades.map((t, i) => ({
      name: `T${i + 1}`,
      "P/L": t.pnl || 0,
    }));

    const instrumentDistributionData = Object.entries(
      closedTrades.reduce(
        (acc, trade) => {
          acc[trade.instrument] = (acc[trade.instrument] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    ).map(([name, value]) => ({ name, value, total: closedTrades.length }));

    const profitablePairsData = Object.entries(
      closedTrades.reduce(
        (acc, trade) => {
          acc[trade.instrument] =
            (acc[trade.instrument] || 0) + (trade.pnl || 0);
          return acc;
        },
        {} as Record<string, number>,
      ),
    ).map(([name, pnl]) => ({ name, "Net P/L": pnl }));

    const volatilityData = instrumentDistributionData
      .slice(0, 6)
      .map((item) => {
        let hash = 0;
        for (let i = 0; i < item.name.length; i++) {
          hash = item.name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const normalized = Math.abs(hash % 60) + 20; 
        return {
          instrument: item.name,
          volatility: normalized,
        };
      });

    const confidenceBuckets: Record<string, { wins: number; total: number }> = {
      "70-80%": { wins: 0, total: 0 },
      "80-90%": { wins: 0, total: 0 },
      "90-100%": { wins: 0, total: 0 },
    };
    closedTrades.forEach((trade) => {
      const conf = trade.confidence;
      let bucket: string | null = null;
      if (conf >= 70 && conf < 80) bucket = "70-80%";
      else if (conf >= 80 && conf < 90) bucket = "80-90%";
      else if (conf >= 90) bucket = "90-100%";
      if (bucket) {
        confidenceBuckets[bucket].total++;
        if (trade.status === "win") confidenceBuckets[bucket].wins++;
      }
    });
    const confidenceData = Object.entries(confidenceBuckets).map(
      ([name, data]) => ({
        name,
        "Win Rate": data.total > 0 ? (data.wins / data.total) * 100 : 0,
        trades: data.total,
      }),
    );

    return {
      equityData,
      totalPnl,
      instrumentDistributionData,
      profitablePairsData,
      volatilityData,
      pnlPerTradeData,
      confidenceData,
    };
  }, [tradeHistory, initialEquity, liveEquity]);

  const topMentor = MOCK_MENTORS_LIST[1];

  const AnalyticsWidget: React.FC<{
    title: string;
    children: React.ReactNode;
    className?: string;
  }> = ({ title, children, className = "" }) => (
    <div
      className={`bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray ${className}`}
    >
      <h3 className="text-lg font-bold text-dark-text mb-4">{title}</h3>
      {children}
    </div>
  );

  const ChartEmptyState: React.FC<{
    icon: string;
    message: string;
    height: number;
  }> = ({ icon, message, height }) => (
    <div
      style={{ height: `${height}px` }}
      className="flex flex-col items-center justify-center text-center text-mid-text"
    >
      <Icon name={icon} className="w-12 h-12 text-light-gray mb-2" />
      <p className="text-sm">{message}</p>
    </div>
  );

  const CustomPieLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs mt-2">
        {payload.map((entry: any, index: number) => {
          const item = analyticsData.instrumentDistributionData[index];
          const total = item ? item.total : 0;
          const percentage =
            total > 0
              ? ((Number(entry.payload.value) / total) * 100).toFixed(0)
              : 0;
          return (
            <span key={`item-${index}`} className="flex items-center">
              <span
                className="w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span className="text-mid-text">
                {entry.value}:{" "}
                <strong className="text-dark-text">
                  {entry.payload.value} ({percentage}%)
                </strong>
              </span>
            </span>
          );
        })}
      </div>
    );
  };

  const renderActiveShapeForDonut = (props: any) => {
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
          y={numCy - 5}
          textAnchor="middle"
          fill="var(--color-text)"
          className="font-bold text-sm"
        >
          {payload.name}
        </text>
        <text
          x={cx}
          y={numCy + 15}
          textAnchor="middle"
          fill="var(--color-text-mid)"
          className="text-xs"
        >{`${(numPercent * 100).toFixed(0)}% (${payload.value} trades)`}</text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={numOuterRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="var(--color-surface)"
          strokeWidth={2}
        />
      </g>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-light-bg min-h-full font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-text">
          Analytics Overview
        </h1>
        <p className="text-mid-text">
          Your comprehensive trading performance dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
          <p className="text-sm text-mid-text">Live Equity</p>
          <p className="text-3xl font-bold text-dark-text">
            {liveEquity.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </p>
          {floatingPnL !== 0 && (
            <p
              className={`text-sm mt-1 font-semibold ${
                floatingPnL >= 0 ? "text-success" : "text-danger"
              }`}
            >
              Floating: {floatingPnL >= 0 ? "+" : ""}
              {floatingPnL.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </p>
          )}
        </div>
        <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
          <p className="text-sm text-mid-text">Total Profit/Loss</p>
          <p
            className={`text-3xl font-bold ${
              analyticsData.totalPnl >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {analyticsData.totalPnl >= 0 ? "+" : ""}
            {analyticsData.totalPnl.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </p>
        </div>
        <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray flex items-center">
          <img
            src={topMentor.avatar}
            alt={topMentor.name}
            className="w-12 h-12 rounded-full mr-4"
          />
          <div>
            <p className="text-sm text-mid-text">Top Performing Mentor</p>
            <p className="font-bold text-dark-text">
              {topMentor.name}{" "}
              <span className="text-success text-sm">
                ROI: {topMentor.roi}%
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnalyticsWidget title="Account Growth" className="lg:col-span-2">
          {analyticsData.equityData.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={analyticsData.equityData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="equityGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-light)"
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--color-text-mid)"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="var(--color-text-mid)"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(val: any) =>
                    `$${(parseFloat(String(val)) / 1000).toFixed(1)}k`
                  }
                  domain={[
                    (dataMin: any) => parseFloat(String(dataMin)) * 0.95,
                    (dataMax: any) => parseFloat(String(dataMax)) * 1.05,
                  ]}
                />
                <Tooltip content={<ThemedChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#equityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState
              icon="dashboard"
              message="Your account growth will be charted here."
              height={300}
            />
          )}
        </AnalyticsWidget>

        <AnalyticsWidget title="Signal Instrument Distribution">
          {analyticsData.instrumentDistributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  {...({ activeIndex: pieActiveIndex } as any)}
                  activeShape={renderActiveShapeForDonut}
                  data={analyticsData.instrumentDistributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={2}
                  onMouseEnter={onPieEnter}
                >
                  {analyticsData.instrumentDistributionData.map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ),
                  )}
                </Pie>
                <Legend content={<CustomPieLegend />} verticalAlign="bottom" />
                <Tooltip content={<ThemedChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState
              icon="pie-chart"
              message="A breakdown of your traded pairs will appear here."
              height={300}
            />
          )}
        </AnalyticsWidget>

        <AnalyticsWidget title="Most Profitable Pairs">
          {analyticsData.profitablePairsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={analyticsData.profitablePairsData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-light)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke="var(--color-text-mid)"
                  tick={{ fontSize: 10 }}
                  domain={["auto", "auto"]}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="var(--color-text-mid)"
                  tick={{ fontSize: 10 }}
                  width={50}
                />
                <Tooltip content={<ThemedChartTooltip />} />
                <ReferenceLine x={0} stroke="var(--color-border-dark)" />
                <Bar dataKey="Net P/L">
                  {analyticsData.profitablePairsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry["Net P/L"] >= 0
                          ? "var(--color-success)"
                          : "var(--color-danger)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState
              icon="chart-bar"
              message="Your P&L by instrument will be shown here."
              height={250}
            />
          )}
        </AnalyticsWidget>

        <AnalyticsWidget title="Instrument Volatility">
          {analyticsData.volatilityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="80%"
                data={analyticsData.volatilityData}
              >
                <PolarGrid stroke="var(--color-border-light)" />
                <PolarAngleAxis
                  dataKey="instrument"
                  tick={{ fill: "var(--color-text-mid)", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Volatility Score"
                  dataKey="volatility"
                  stroke="var(--color-accent)"
                  fill="var(--color-accent)"
                  fillOpacity={0.6}
                />
                <Tooltip content={<ThemedChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState
              icon="danger"
              message="Volatility data requires trade history."
              height={250}
            />
          )}
        </AnalyticsWidget>

         <AnalyticsWidget title="Mentor Performance">
          <div className="space-y-3 h-[250px] overflow-y-auto">
            {MOCK_MENTORS_LIST.slice(0, 2).map((mentor) => (
              <div
                key={mentor.id}
                className="bg-light-hover p-3 rounded-lg flex justify-between items-center"
              >
                <div className="flex items-center">
                  <img
                    src={mentor.avatar}
                    alt={mentor.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <p className="font-semibold text-dark-text text-sm">
                      {mentor.name}
                    </p>
                    <p className="text-xs text-mid-text">
                      {mentor.price.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                      /mo - {mentor.instruments.length} Signals
                    </p>
                  </div>
                </div>
                <span className="font-bold text-success text-sm">
                  {mentor.roi}% ROI
                </span>
              </div>
            ))}
          </div>
        </AnalyticsWidget>

        <AnalyticsWidget
          title="Profit/Loss Per Trade"
          className="lg:col-span-2"
        >
          {analyticsData.pnlPerTradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData.pnlPerTradeData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-light)"
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--color-text-mid)"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="var(--color-text-mid)"
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip content={<ThemedChartTooltip />} />
                <Bar dataKey="P/L" barSize={20}>
                  {analyticsData.pnlPerTradeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry["P/L"] >= 0
                          ? "var(--chart-green)"
                          : "var(--chart-red)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState
              icon="chart-bar"
              message="The P&L for each closed trade will appear here."
              height={250}
            />
          )}
        </AnalyticsWidget>

        <AnalyticsWidget title="AI Confidence vs. Win Rate">
          {analyticsData.confidenceData.some((d) => d.trades > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData.confidenceData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-light)"
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--color-text-mid)"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="var(--color-text-mid)"
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip content={<ThemedChartTooltip />} />
                <Bar
                  dataKey="Win Rate"
                  fill="var(--chart-purple)"
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState
              icon="pie-chart"
              message="Data will appear once you have trades with confidence scores."
              height={250}
            />
          )}
        </AnalyticsWidget>
      </div>
    </div>
  );
};
