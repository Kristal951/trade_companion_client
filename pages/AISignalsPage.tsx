import React, { useEffect, useMemo, useState } from "react";
import { TradeRecord, PlanName, DashboardView, User } from "../types";
import Icon from "../components/ui/Icon";
import { useUsageTracker } from "@/hooks/useUsageTracker";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/ui/StatCard";
import { ArrowUpDown, Check, Filter, Unlock } from "lucide-react";
import SignalDistributionBarChart from "@/components/ui/SignalDistributionChart";
import { useSignalStore } from "@/store/signalStore";

type SettingsState = {
  balance: string;
  risk: string;
  currency: string;
};

const DEFAULT_SETTINGS: SettingsState = {
  balance: "10000",
  risk: "1.0",
  currency: "USD",
};

const getCurrentPlan = (user: User) =>
  user?.subscribedPlan || user?.plan || PlanName.Free;

const formatDateTime = (value?: string | Date) => {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatPrice = (value?: number, digits = 5) => {
  if (typeof value !== "number") return "—";
  return value.toFixed(digits);
};

const formatMoney = (value?: number) => {
  if (typeof value !== "number") return "—";
  const abs = Math.abs(value).toFixed(2);
  return `${value >= 0 ? "+" : "-"}$${abs}`;
};

const safeLoadSettings = (key: string): SettingsState => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(saved);
    return {
      balance: parsed?.balance ?? DEFAULT_SETTINGS.balance,
      risk: parsed?.risk ?? DEFAULT_SETTINGS.risk,
      currency: parsed?.currency ?? DEFAULT_SETTINGS.currency,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const toneMap = {
  success: "border-success/20 bg-success/10 text-success",
  danger: "border-danger/20 bg-danger/10 text-danger",
  warning: "border-warning/20 bg-warning/10 text-warning",
  info: "border-info/20 bg-info/10 text-info",
  neutral: "border-light-gray bg-light-hover text-dark-text",
} as const;

const Chip: React.FC<{
  children: React.ReactNode;
  tone?: keyof typeof toneMap;
}> = ({ children, tone = "neutral" }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneMap[tone]}`}
    >
      {children}
    </span>
  );
};

const TerminalCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={[
      "rounded-[28px] border border-white/10 bg-[#0d1117] text-white shadow-[0_10px_40px_rgba(0,0,0,0.25)]",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={[
      "rounded-[24px] border border-light-gray bg-light-surface shadow-sm",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const EmptyState: React.FC<{
  icon: string;
  title: string;
  message: string;
}> = ({ icon, title, message }) => (
  <GlassCard className="p-10 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
      <Icon name={icon} className="h-8 w-8 text-primary/70" />
    </div>
    <p className="mt-4 text-lg font-bold text-dark-text">{title}</p>
    <p className="mt-1 text-sm text-mid-text">{message}</p>
  </GlassCard>
);

const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 className="text-lg font-extrabold text-dark-text">{title}</h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-mid-text">{subtitle}</p>
      ) : null}
    </div>
    {action}
  </div>
);

const TradeCard: React.FC<{ trade: TradeRecord }> = ({ trade }) => {
  const isBuy = trade.type === "BUY";
  const isActive = trade.status === "active";
  const isWin = trade.status === "win";
  const isLoss = trade.status === "loss";

  const confidenceTone =
    trade.confidence >= 85
      ? "success"
      : trade.confidence >= 75
        ? "info"
        : "warning";

  const statusTone = isActive ? "info" : isWin ? "success" : "danger";

  return (
    <GlassCard className="overflow-hidden">
      <div
        className={[
          "h-1.5 w-full",
          isActive ? "bg-info" : isWin ? "bg-success" : "bg-danger",
        ].join(" ")}
      />

      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-extrabold text-dark-text">
                {trade.instrument}
              </h3>

              <Chip tone={isBuy ? "success" : "danger"}>{trade.type}</Chip>
              <Chip tone={confidenceTone}>{trade.confidence}% Confidence</Chip>
              <Chip tone={statusTone}>
                {isActive ? "Active" : isWin ? "Win" : "Loss"}
              </Chip>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-mid-text">
              <span className="inline-flex items-center gap-2">
                <Icon name="clock" className="h-4 w-4 opacity-70" />
                Taken: {formatDateTime(trade.dateTaken)}
              </span>

              {!isActive && trade.dateClosed ? (
                <span className="inline-flex items-center gap-2">
                  <Icon name="check" className="h-4 w-4 opacity-70" />
                  Closed: {formatDateTime(trade.dateClosed)}
                </span>
              ) : null}
            </div>
          </div>

          {typeof trade.pnl === "number" ? (
            <div className="min-w-[120px] rounded-2xl border border-light-gray bg-light-hover px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mid-text">
                P&amp;L
              </p>
              <p
                className={[
                  "mt-1 text-xl font-extrabold",
                  trade.pnl >= 0 ? "text-success" : "text-danger",
                ].join(" ")}
              >
                {formatMoney(trade.pnl)}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl bg-light-hover p-3.5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-mid-text">
              Entry
            </p>
            <p className="mt-1 font-bold text-dark-text">
              {formatPrice(trade.entryPrice)}
            </p>
          </div>

          <div className="rounded-2xl bg-light-hover p-3.5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-mid-text">
              Stop Loss
            </p>
            <p className="mt-1 font-bold text-danger">
              {formatPrice(trade.stopLoss)}
            </p>
          </div>

          <div className="rounded-2xl bg-light-hover p-3.5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-mid-text">
              Take Profit 1
            </p>
            <p className="mt-1 font-bold text-success">
              {formatPrice(trade.takeProfit)}
            </p>
          </div>

          <div className="rounded-2xl bg-light-hover p-3.5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-mid-text">
              Take Profit 2
            </p>
            <p className="mt-1 font-bold text-success">
              {trade.takeProfit2 ? formatPrice(trade.takeProfit2) : "—"}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {isActive && typeof trade.currentPrice === "number" ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
              <p className="text-[11px] uppercase tracking-[0.12em] text-primary/80">
                Live Price
              </p>
              <p className="mt-1 text-base font-extrabold text-dark-text">
                {formatPrice(trade.currentPrice)}
              </p>
            </div>
          ) : null}

          {typeof trade.lotSize === "number" ? (
            <div className="rounded-2xl border border-primary/15 bg-primary/10 p-3.5">
              <p className="text-[11px] uppercase tracking-[0.12em] text-primary/80">
                Lot Size
              </p>
              <p className="mt-1 text-base font-bold text-primary">
                {trade.lotSize.toFixed(2)}
              </p>
            </div>
          ) : null}

          {isActive && typeof trade.pnl === "number" ? (
            <div
              className={`rounded-2xl p-3.5 ${
                trade.pnl >= 0
                  ? "border border-success/20 bg-success/10 text-success"
                  : "border border-danger/20 bg-danger/10 text-danger"
              }`}
            >
              <p className="text-[11px] uppercase tracking-[0.12em] opacity-80">
                Floating P&amp;L
              </p>
              <p className="mt-1 text-base font-bold">
                {formatMoney(trade.pnl)}
              </p>
            </div>
          ) : null}
        </div>

        {trade.technicalReasoning ? (
          <div className="mt-4 rounded-2xl border border-light-gray bg-light-hover p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-dark-text">
              Olapete Logic
            </p>
            <p className="mt-2 text-sm leading-6 text-mid-text">
              {trade.technicalReasoning}
            </p>
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
};

const UpgradePrompt: React.FC<{
  onViewChange: (view: DashboardView) => void;
}> = ({ onViewChange }) => (
  <TerminalCard className="overflow-hidden">
    <div className="relative p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_24%)]" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
          <Icon name="signals" className="h-4 w-4" />
          Premium AI Signals
        </div>

        <h2 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight text-white">
          Upgrade to unlock live AI signals, trade history intelligence, and
          cTrader automation.
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
          Your current plan gives you access to core tools. Move to Pro or
          Premium for the full live signal experience with automation-ready
          workflows.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => onViewChange("settings")}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#0d1117] transition hover:opacity-90"
          >
            Upgrade Plan
          </button>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
            Includes live monitoring, signal history, and cTrader integration
          </div>
        </div>
      </div>
    </div>
  </TerminalCard>
);

const FilterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}> = ({ label, value, onChange, options }) => (
  <div>
    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-mid-text">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-light-gray bg-light-hover px-3.5 py-3 text-sm text-dark-text outline-none transition focus:border-primary"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const TabButton: React.FC<{
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}> = ({ active, label, count, onClick }) => (
  <button
    onClick={onClick}
    className={[
      "relative inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
      active
        ? "bg-dark-text text-white shadow-sm"
        : "border border-light-gray bg-light-surface text-mid-text hover:bg-light-hover hover:text-dark-text",
    ].join(" ")}
  >
    <span>{label}</span>
    <span
      className={[
        "rounded-full px-2 py-0.5 text-xs",
        active ? "bg-white/15 text-white" : "bg-light-hover text-dark-text",
      ].join(" ")}
    >
      {count}
    </span>
  </button>
);

interface AISignalsPageProps {
  user: User;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  activeTrades: TradeRecord[];
  tradeHistory: TradeRecord[];
  onViewChange: (view: DashboardView) => void;
}

const AISignalsPage: React.FC<AISignalsPageProps> = ({
  user,
  showToast,
  tradeHistory,
  onViewChange,
}) => {
  const navigate = useNavigate();

  const currentPlan = getCurrentPlan(user);
  const isFreePlan = currentPlan === PlanName.Free;
  const isPaidPlan = !isFreePlan;
  const userTradeSettings = user.tradeSettings || {
    balance: 10000,
    risk: 1,
    currency: "USD",
  };
  const isProOrPremium =
    currentPlan === PlanName.Pro || currentPlan === PlanName.Premium;

  const { getUsageInfo } = useUsageTracker(user);
  const signalUsage = getUsageInfo("aiSignal");

  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [areSettingsLocked, setAreSettingsLocked] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [openFilter, setOpenFilter] = useState(false);
  const [openSort, setOpenSort] = useState(false);

  const {
    signals,
    loading,
    page,
    totalPages,
    fetchSignals,
    setPage,
    activeTrades,
  } = useSignalStore();
  const activeTradesCount = useSignalStore(
    (state) => state.activeTrades.length,
  );

  const [settings, setSettings] = useState<SettingsState>(() =>
    safeLoadSettings(`tradeSettings_${user.email}`),
  );

  useEffect(() => {
    const initialEquity = localStorage.getItem(`initialEquity_${user.email}`);
    if (initialEquity) {
      setAreSettingsLocked(true);
    }
  }, [user.email]);

  const handleSettingsChange = (field: keyof SettingsState, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = () => {
    if (areSettingsLocked) {
      showToast(
        "Settings are already locked for this subscription period.",
        "info",
      );
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handleConfirmSave = () => {
    const settingsKey = `tradeSettings_${user.email}`;
    const currentEquityKey = `currentEquity_${user.email}`;
    const initialEquityKey = `initialEquity_${user.email}`;

    localStorage.setItem(settingsKey, JSON.stringify(settings));
    localStorage.setItem(currentEquityKey, settings.balance);
    localStorage.setItem(initialEquityKey, settings.balance);

    setAreSettingsLocked(true);
    setIsConfirmModalOpen(false);
    showToast("Initial trade settings saved and locked!", "success");
  };

  const filteredSignals = useMemo(() => {
    let data = [...activeTrades];

    // 🔹 Filter
    if (filter !== "ALL") {
      data = data.filter((s) => s.status.toUpperCase() === filter);
    }

    // 🔹 Sort
    data.sort((a, b) => {
      if (sortBy === "latest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }

      if (sortBy === "confidence") {
        return (b.confidence || 0) - (a.confidence || 0);
      }

      return 0;
    });

    return data;
  }, [activeTrades, filter, sortBy]);

  const instrumentOptions = useMemo(() => {
    return ["all", ...new Set(tradeHistory.map((trade) => trade.instrument))];
  }, [tradeHistory]);

  const closedTrades = useMemo(
    () => tradeHistory.filter((trade) => trade.status !== "active"),
    [tradeHistory],
  );

  const historyWins = useMemo(
    () => closedTrades.filter((trade) => trade.status === "win").length,
    [closedTrades],
  );

  const historyLosses = useMemo(
    () => closedTrades.filter((trade) => trade.status === "loss").length,
    [closedTrades],
  );

  const winRate = useMemo(() => {
    if (!closedTrades.length) return 0;
    return Math.round((historyWins / closedTrades.length) * 100);
  }, [closedTrades, historyWins]);

  const totalClosedPnl = useMemo(() => {
    return closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  }, [closedTrades]);

  const CTraderStatus = () => {
    const isConnected = !!user.cTraderConfig?.isConnected;
    const isAutoEnabled = !!user.cTraderConfig?.autoTradeEnabled;

    if (!isProOrPremium) {
      return (
        <GlassCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-accent">
                Unlock Auto-Trading with cTrader
              </p>
              <p className="mt-1 text-sm text-mid-text">
                Upgrade to Pro or Premium to automatically execute AI signals on
                your cTrader account.
              </p>
            </div>

            <button
              onClick={() => onViewChange("settings")}
              className="rounded-2xl bg-accent px-4 py-2.5 font-semibold text-white transition hover:bg-purple-700"
            >
              View Plans
            </button>
          </div>
        </GlassCard>
      );
    }

    if (!isConnected) {
      return (
        <GlassCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-info">
                Connect cTrader to automate execution
              </p>
              <p className="mt-1 text-sm text-mid-text">
                Your plan supports automation. Connect your cTrader account to
                let AI signals flow into execution-ready workflows.
              </p>
            </div>

            <button
              onClick={() => navigate("/settings?tab=ctrader")}
              className="rounded-2xl bg-info px-4 py-2.5 font-semibold text-white transition hover:bg-blue-600"
            >
              Connect cTrader
            </button>
          </div>
        </GlassCard>
      );
    }

    if (isConnected && !isAutoEnabled) {
      return (
        <GlassCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-warning">
                cTrader connected, auto-trading disabled
              </p>
              <p className="mt-1 text-sm text-mid-text">
                Your account is connected successfully, but auto-trading is
                still turned off in settings.
              </p>
            </div>

            <button
              onClick={() => navigate("/settings?tab=ctrader")}
              className="rounded-2xl bg-warning px-4 py-2.5 font-semibold text-white transition hover:bg-yellow-600"
            >
              Enable Auto-Trading
            </button>
          </div>
        </GlassCard>
      );
    }

    return (
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-extrabold text-success">
              <Icon name="check" className="h-5 w-5" />
              cTrader connected and auto-trading active
            </p>
            <p className="mt-1 text-sm text-mid-text">
              Signals are ready to execute on account{" "}
              <span className="font-semibold text-dark-text">
                {user.cTraderConfig?.accountId || "—"}
              </span>
              .
            </p>
          </div>

          <button
            onClick={() => navigate("/settings?tab=ctrader")}
            className="rounded-2xl border border-success/20 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success transition hover:bg-success/15"
          >
            Manage Connection
          </button>
        </div>
      </GlassCard>
    );
  };

  useEffect(() => {
    fetchSignals();
  }, [page]);

  return (
    <div className="min-h-screen bg-light-bg px-4 py-6 sm:px-6 lg:px-8">
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
            onClick={() => setIsConfirmModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-[28px] border border-light-gray bg-light-surface p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10">
                <Icon name="danger" className="h-6 w-6 text-warning" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-dark-text">
                  Confirm and lock settings
                </h3>
                <p className="mt-2 text-sm leading-6 text-mid-text">
                  These values will be used to calculate your AI trade sizing
                  and performance metrics for the current subscription cycle.
                </p>
                <p className="mt-2 text-sm font-semibold text-dark-text">
                  You will not be able to edit them afterward.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="rounded-2xl border border-light-gray bg-light-surface px-4 py-3 font-semibold text-mid-text transition hover:bg-light-hover"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="rounded-2xl bg-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                onClick={handleConfirmSave}
              >
                Confirm & Lock
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full space-y-6">
        <TerminalCard className="overflow-hidden">
          <div className="relative p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_24%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </span>
                    AI Market Engine
                  </div>

                  <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    AI Signals Dashboard
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                    Monitor open positions, review performance analytics, manage
                    risk configuration, and connect cTrader for automated execution.
                  </p>
                </div>

                <div className="grid min-w-[240px] grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                      Current Plan
                    </p>
                    <p className="mt-1 text-lg font-bold text-white">{currentPlan}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                      Signal Usage
                    </p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {isPaidPlan
                        ? `${signalUsage.count} / ${signalUsage.limit}`
                        : "Locked"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TerminalCard>

        {!isFreePlan ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Active Trades"
              value={activeTradesCount}
              icon={<Icon name="analytics" className="w-5 h-5" />}
              subtext="Live positions under watch"
            />
            <StatCard
              title="Closed Trades"
              value={closedTrades.length}
              icon={<Icon name="closedTrades" className="w-5 h-5" />}
              //  percentageType={winRate >= 50 ? "gain" : "loss"}
            />
            <StatCard
              title="Win Rate"
              value={`${winRate}%`}
              icon={<Icon name="check" className="w-5 h-5" />}
              //  percentageType={winRate >= 50 ? "gain" : "loss"}
            />
            <StatCard
              title="Net P&L"
              value={
                <span
                  className={
                    totalClosedPnl >= 0 ? "text-success" : "text-danger"
                  }
                >
                  {formatMoney(totalClosedPnl)}
                </span>
              }
              icon={<Icon name="wallet" className="w-5 h-5" />}
              accent={totalClosedPnl >= 0 ? "success" : "danger"}
              subtext="Closed-trade total performance"
            />
          </div>
        ) : null}

        <div className="w-full flex flex-col bg-light-surface rounded-2xl border border-light-gray p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="analytics" className="w-5 h-5" />
              <h1 className="text-lg font-bold text-dark-text">
                Active Signals
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <button
                  onClick={() => {
                    setOpenFilter(!openFilter);
                    setOpenSort(false);
                  }}
                  className={`p-2 rounded-lg border hover:bg-light-hover ${
                    filter !== "ALL"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-light-surface border-light-gray"
                  }`}
                >
                  <Filter className="w-5 h-5" />
                </button>

                {openFilter && !openSort && (
                  <div className="absolute right-0 mt-2 w-40 bg-light-surface border border-light-gray rounded-lg shadow-md transition-opacity z-10">
                    {["ALL", "NEW", "EXECUTED", "WIN", "LOSS"].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilter(status);
                          setOpenFilter(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-light-hover flex justify-between items-center ${
                          filter === status
                            ? "font-bold text-primary bg-primary/5"
                            : ""
                        }`}
                      >
                        <span>{status}</span>

                        {filter === status && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative group">
                <button
                  onClick={() => {
                    setOpenSort(!openFilter);
                    setOpenFilter(false);
                  }}
                  className={`p-2 rounded-lg border hover:bg-light-hover ${
                    sortBy !== "latest"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-light-surface border-light-gray"
                  }`}
                >
                  <ArrowUpDown className="w-5 h-5" />
                </button>

                {openSort && !openFilter && (
                  <div className="absolute right-0 mt-2 w-40 bg-light-surface border border-light-gray rounded-lg shadow-md transition-opacity z-10">
                    {[
                      { key: "latest", label: "Latest" },
                      { key: "oldest", label: "Oldest" },
                      { key: "confidence", label: "Confidence" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => {
                          setSortBy(item.key);
                          setOpenSort(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-light-hover flex justify-between items-center ${
                          sortBy === item.key
                            ? "font-bold text-primary bg-primary/5"
                            : ""
                        }`}
                      >
                        <span>{item.label}</span>

                        {sortBy === item.key && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-mid-text border-b border-light-gray">
                  <th className="py-3 px-2">Instrument</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Entry</th>
                  <th className="py-3 px-2">SL</th>
                  <th className="py-3 px-2">TP</th>
                  <th className="py-3 px-2">Confidence</th>
                  <th className="py-3 px-2">AI</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Created</th>
                </tr>
              </thead>

              <tbody>
                {/* 🔄 Loading State */}
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-mid-text">
                      Loading signals...
                    </td>
                  </tr>
                ) : signals.length === 0 ? (
                  /* 📭 Empty State */
                  <tr>
                    <td colSpan={9} className="py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <p className="font-semibold text-dark-text">
                          No active signals
                        </p>

                        <p className="text-sm text-mid-text mt-1">
                          The AI is currently scanning the market. Check back
                          soon.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* ✅ Data */
                  signals.map((signal) => (
                    <tr
                      key={signal._id}
                      className="border-b border-light-gray hover:bg-light-hover transition"
                    >
                      <td className="py-3 px-2 font-medium">
                        {signal.instrument}
                      </td>

                      <td className="py-3 px-2">
                        <span
                          className={
                            signal.type === "BUY"
                              ? "text-success font-semibold"
                              : "text-danger font-semibold"
                          }
                        >
                          {signal.type}
                        </span>
                      </td>

                      <td className="py-3 px-2">
                        {signal.entryPrice?.toFixed(2)}
                      </td>

                      <td className="py-3 px-2 text-danger">
                        {signal.stopLoss?.toFixed(2)}
                      </td>

                      <td className="py-3 px-2 text-success">
                        {signal.takeProfits?.[0]?.toFixed(2) || "-"}
                      </td>

                      <td className="py-3 px-2">{signal.confidence}%</td>

                      <td className="py-3 px-2">
                        {signal.isAI ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                            AI
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            Manual
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-light-hover border border-light-gray">
                          {signal.status}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-mid-text">
                        {new Date(signal.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* ✅ Pagination (hide if empty or loading) */}
            {!loading && signals.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-mid-text">
                  Page {currentPage} of {totalPages}
                </p>

                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3 py-1 rounded-lg border border-light-gray disabled:opacity-50"
                  >
                    Prev
                  </button>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1 rounded-lg border border-light-gray disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full md:grid-cols-6 h-max">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="settings" className="w-5 h-5" />
              <h1 className="text-lg font-bold text-dark-text">
                Trade Settings
              </h1>
            </div>

            <div className="bg-light-surface p-6 w-[90%] rounded-xl border border-light-gray space-y-6">
              {/* Balance */}
              <div className="flex flex-col gap-2">
                <h4 className="text-sm text-mid-text">Account balance</h4>

                <div className="flex items-center justify-between gap-2 bg-light-bg rounded-3xl py-3 px-4 w-full">
                  <div className="flex gap-2 items-center ">
                    <Icon name="wallet" className="h-4 w-4 text-mid-text" />

                    <input
                      type="text"
                      readOnly
                      className="bg-transparent outline-none w-28 text-sm"
                      value={Number(userTradeSettings.balance || 0).toFixed(2)}
                    />
                  </div>

                  <p>USD</p>
                </div>
              </div>

              {/* Currency */}
              <div className="flex flex-col gap-2">
                <h4 className="text-sm text-mid-text">Currency</h4>

                <select
                  value={userTradeSettings.currency}
                  onChange={(e) =>
                    handleSettingsChange("currency", e.target.value)
                  }
                  disabled={areSettingsLocked}
                  className="w-full rounded-2xl border border-light-gray bg-light-hover px-4 py-3 text-sm text-dark-text outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:bg-light-gray/50"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              {/* Risk */}
              <div className="flex flex-col gap-2">
                <h4 className="text-sm text-mid-text">Risk Per Trade</h4>

                <div className="flex items-center justify-between gap-2 border border-light-gray bg-light-hover px-4 py-3 rounded-2xl w-full">
                  <input
                    type="text"
                    value={Number(
                      userTradeSettings.riskPerTrade ||
                        userTradeSettings.risk ||
                        0,
                    ).toFixed(2)}
                    onChange={(e) =>
                      handleSettingsChange("risk", e.target.value)
                    }
                    disabled={areSettingsLocked}
                    className="w-full rounded-2xl text-sm outline-none bg-transparent transition focus:border-primary disabled:cursor-not-allowed disabled:bg-light-gray/50"
                  />

                  <p>%</p>
                </div>
              </div>

              <button
                // onClick={toggleLock} // Assuming you have a function to flip the state
                className={`
    group flex items-center justify-center gap-3 w-full mt-8 py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-sm
    ${
      areSettingsLocked
        ? "bg-surface-container border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high"
        : "bg-primary text-on-primary hover:bg-primary-container hover:shadow-primary/20 active:scale-[0.98]"
    }
  `}
              >
                {areSettingsLocked ? (
                  <>
                    <Lock
                      size={18}
                      className="transition-transform group-hover:scale-110"
                    />
                    <span>Settings Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock
                      size={18}
                      className="transition-transform group-hover:scale-110"
                    />
                    <span>Lock Settings</span>
                  </>
                )}
              </button>
            </div>

            {areSettingsLocked ? (
              <div className="mt-4 rounded-2xl border border-info/20 bg-info/10 p-4 text-sm text-info">
                <div className="flex items-start gap-2">
                  <Icon name="info" className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p>
                    Your trade settings are locked for this subscription cycle
                    so analytics remain consistent.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="col-span-4">
            <h2 className="text-lg font-semibold mb-4">Signals Distribution</h2>
            <div className="bg-light-surface rounded-xl p-4 h-full border border-light-gray ">
              <SignalDistributionBarChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISignalsPage;
