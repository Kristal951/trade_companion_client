import React, { useState, useEffect, useMemo } from "react";
import { TradeRecord, PlanName, DashboardView, User } from "../types";
import Icon from "../components/ui/Icon";
import { useUsageTracker } from "@/hooks/useUsageTracker";
import { useNavigate } from "react-router-dom";

const StatPill: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex items-center gap-2 rounded-full border border-light-gray bg-light-surface px-3 py-1.5 shadow-sm">
    <span className="text-xs text-mid-text">{label}</span>
    <span className="text-xs font-semibold text-dark-text">{value}</span>
  </div>
);

const Chip: React.FC<{
  tone?: "info" | "success" | "warning" | "danger";
  children: React.ReactNode;
}> = ({ tone = "info", children }) => {
  const tones: Record<string, string> = {
    info: "bg-info/10 text-info border-info/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const TradeCard: React.FC<{ trade: TradeRecord }> = ({ trade }) => {
  const isBuy = trade.type === "BUY";

  const statusTone =
    trade.status === "active"
      ? "info"
      : trade.status === "win"
        ? "success"
        : "danger";

  const pnlTone =
    trade.status === "win"
      ? "success"
      : trade.status === "loss"
        ? "danger"
        : "info";

  let confTone: "success" | "info" | "warning" = "warning";
  if (trade.confidence >= 85) confTone = "success";
  else if (trade.confidence >= 75) confTone = "info";

  const leftBorder =
    trade.status === "active"
      ? "border-info"
      : trade.status === "win"
        ? "border-success"
        : "border-danger";

  return (
    <div
      className={[
        "group relative rounded-2xl border border-light-gray bg-light-surface shadow-sm",
        "transition hover:shadow-md",
        "overflow-hidden",
      ].join(" ")}
    >
      <div className={`absolute left-0 top-0 h-full w-1.5 ${leftBorder}`} />

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="truncate text-base font-bold text-dark-text">
                {trade.instrument}
              </h4>
              <span
                className={`text-xs font-bold ${isBuy ? "text-success" : "text-danger"}`}
              >
                {trade.type}
              </span>
              <Chip tone={confTone}>{trade.confidence}% Confidence</Chip>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mid-text">
              <span className="inline-flex items-center gap-1">
                <Icon name="clock" className="h-4 w-4 opacity-70" />
                Taken: {new Date(trade.dateTaken).toLocaleString()}
              </span>
              {trade.status !== "active" && trade.dateClosed ? (
                <span className="inline-flex items-center gap-1">
                  <Icon name="check" className="h-4 w-4 opacity-70" />
                  Closed: {new Date(trade.dateClosed).toLocaleString()}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {trade.status === "active" ? (
              <Chip tone="info">
                <span className="inline-flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-info/60 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-info" />
                  </span>
                  Monitoring
                </span>
              </Chip>
            ) : (
              <Chip tone={statusTone}>
                {trade.status === "win" ? "Win" : "Loss"}
              </Chip>
            )}

            {trade.status !== "active" && typeof trade.pnl === "number" ? (
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-mid-text">
                  P&amp;L
                </p>
                <p
                  className={[
                    "text-lg font-extrabold",
                    pnlTone === "success"
                      ? "text-success"
                      : pnlTone === "danger"
                        ? "text-danger"
                        : "text-info",
                  ].join(" ")}
                >
                  {trade.status === "win" ? "+" : "-"}$
                  {Math.abs(trade.pnl).toFixed(2)}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-light-hover p-3">
            <p className="text-[11px] text-mid-text">Entry</p>
            <p className="mt-0.5 font-semibold text-dark-text">
              {trade.entryPrice.toFixed(5)}
            </p>
          </div>

          <div className="rounded-xl bg-light-hover p-3">
            <p className="text-[11px] text-mid-text">Stop Loss</p>
            <p className="mt-0.5 font-semibold text-danger">
              {trade.stopLoss.toFixed(5)}
            </p>
          </div>

          <div className="rounded-xl bg-light-hover p-3">
            <p className="text-[11px] text-mid-text">TP 1</p>
            <p className="mt-0.5 font-semibold text-success">
              {trade.takeProfit.toFixed(5)}
            </p>
          </div>

          {trade.takeProfit2 ? (
            <div className="rounded-xl bg-light-hover p-3">
              <p className="text-[11px] text-mid-text">TP 2</p>
              <p className="mt-0.5 font-semibold text-success">
                {trade.takeProfit2.toFixed(5)}
              </p>
            </div>
          ) : (
            <div className="hidden sm:block rounded-xl border border-dashed border-light-gray bg-light-surface p-3">
              <p className="text-[11px] text-mid-text">TP 2</p>
              <p className="mt-0.5 text-xs text-mid-text">—</p>
            </div>
          )}
        </div>

        {/* Live / Extras row */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {trade.status === "active" && trade.currentPrice ? (
            <div className="col-span-2 rounded-2xl border border-primary/25 bg-primary/5 p-3 shadow-sm">
              <p className="text-[11px] font-bold text-primary/80">
                Live Price
              </p>
              <p className="mt-0.5 text-base font-extrabold text-dark-text">
                {trade.currentPrice.toFixed(5)}
              </p>
            </div>
          ) : (
            <div className="col-span-2 hidden sm:block" />
          )}

          {trade.lotSize ? (
            <div className="rounded-2xl bg-primary/10 p-3">
              <p className="text-[11px] text-primary/80">Lot Size</p>
              <p className="mt-0.5 font-semibold text-primary">
                {trade.lotSize.toFixed(2)}
              </p>
            </div>
          ) : null}

          {trade.status === "active" && typeof trade.pnl === "number" ? (
            <div
              className={[
                "rounded-2xl p-3",
                trade.pnl >= 0
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger",
              ].join(" ")}
            >
              <p className="text-[11px] opacity-80">Floating P&amp;L</p>
              <p className="mt-0.5 font-semibold">
                {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
              </p>
            </div>
          ) : null}
        </div>

        {trade.technicalReasoning ? (
          <div className="mt-4 rounded-2xl bg-light-hover p-3 text-xs text-mid-text">
            <span className="font-bold text-dark-text">Olapete Logic:</span>{" "}
            {trade.technicalReasoning}
          </div>
        ) : null}
      </div>
    </div>
  );
};

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
  activeTrades,
  tradeHistory,
  onViewChange,
}) => {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [areSettingsLocked, setAreSettingsLocked] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const { getUsageInfo } = useUsageTracker(user);
  const signalUsage = getUsageInfo("aiSignal");
  const navigate = useNavigate();

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(`tradeSettings_${user.email}`);
    return saved
      ? JSON.parse(saved)
      : { balance: "10000", risk: "1.0", currency: "USD" };
  });

  const [filterInstrument, setFilterInstrument] = useState("all");
  const [filterTime, setFilterTime] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const initialEquity = localStorage.getItem(`initialEquity_${user.email}`);
    if (initialEquity) setAreSettingsLocked(true);
  }, [user.email]);

  const handleSettingsChange = (
    field: "balance" | "risk" | "currency",
    value: string,
  ) => setSettings((prev: any) => ({ ...prev, [field]: value }));

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
    const EQUITY_KEY = `currentEquity_${user.email}`;
    localStorage.setItem(
      `tradeSettings_${user.email}`,
      JSON.stringify(settings),
    );
    localStorage.setItem(EQUITY_KEY, settings.balance);
    localStorage.setItem(`initialEquity_${user.email}`, settings.balance);
    setAreSettingsLocked(true);
    showToast("Initial trade settings saved and locked!", "success");
    setIsConfirmModalOpen(false);
  };

  const filteredHistory = useMemo(() => {
    return tradeHistory
      .filter((trade) =>
        filterInstrument === "all"
          ? true
          : trade.instrument === filterInstrument,
      )
      .filter((trade) =>
        filterStatus === "all" ? true : trade.status === filterStatus,
      )
      .filter((trade) => {
        if (filterTime === "all") return true;
        if (!trade.dateClosed) return false;
        const tradeDate = new Date(trade.dateClosed);
        const now = new Date();

        if (filterTime === "today")
          return tradeDate.toDateString() === now.toDateString();

        if (filterTime === "7d") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          return tradeDate > sevenDaysAgo;
        }

        if (filterTime === "30d") {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return tradeDate > thirtyDaysAgo;
        }

        return true;
      });
  }, [tradeHistory, filterInstrument, filterTime, filterStatus]);

  const instrumentOptions = useMemo(
    () => ["all", ...new Set(tradeHistory.map((t) => t.instrument))],
    [tradeHistory],
  );

  const EmptyState: React.FC<{
    icon: string;
    title: string;
    message: string;
  }> = ({ icon, title, message }) => (
    <div className="rounded-2xl border border-light-gray bg-light-surface p-10 text-center shadow-sm mb-4">
      <Icon name={icon} className="mx-auto mb-4 h-12 w-12 text-primary/50" />
      <p className="text-lg font-bold text-dark-text">{title}</p>
      <p className="mt-1 text-sm text-mid-text">{message}</p>
    </div>
  );

  const UpgradePrompt = () => (
    <div className="rounded-2xl border border-light-gray bg-light-surface p-10 text-center shadow-sm">
      <Icon name="signals" className="mx-auto mb-4 h-12 w-12 text-primary/50" />
      <p className="text-xl font-bold text-dark-text">
        Unlock Automated AI Signals
      </p>
      <p className="mt-2 text-sm text-mid-text">
        Your Free plan includes unlimited use of the Lot Size Calculator and
        Education Hub.
      </p>
      <button
        onClick={() => onViewChange("settings")}
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-sm transition hover:bg-primary-hover"
      >
        Upgrade to a Paid Plan
      </button>
    </div>
  );

  const CTraderStatus = () => {
    const isProOrPremium =
      user?.plan || user?.subscribedPlan === PlanName.Pro || user?.plan || user?.subscribedPlan === PlanName.Premium;
    const isConnected = user.cTraderConfig?.isConnected;
    const isAutoEnabled = user.cTraderConfig?.autoTradeEnabled;

    if (!isProOrPremium) {
      return (
        <div className="rounded-2xl border border-accent/20 bg-accent/10 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-accent">
                Unlock Auto-Trading with cTrader
              </p>
              <p className="mt-1 text-sm text-accent/80">
                Upgrade to Pro or Premium to automatically execute AI signals on
                your cTrader account.
              </p>
            </div>
            <button
              onClick={() => onViewChange("settings")}
              className="rounded-xl bg-accent px-4 py-2.5 font-semibold text-white transition hover:bg-purple-700"
            >
              View Plans
            </button>
          </div>
        </div>
      );
    }

    if (!isConnected) {
      return (
        <div className="rounded-2xl border border-info/20 bg-info/10 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-info">
                Automate Your Trading
              </p>
              <p className="mt-1 text-sm text-info/80">
                Connect your cTrader account to have AI signals executed
                automatically.
              </p>
            </div>
            <button
              onClick={() => navigate("/settings?tab=ctrader")}
              className="rounded-xl bg-info px-4 py-2.5 font-semibold text-white transition hover:bg-blue-600"
            >
              Connect to cTrader
            </button>
          </div>
        </div>
      );
    }

    if (isConnected && !isAutoEnabled) {
      return (
        <div className="rounded-2xl border border-warning/20 bg-warning/10 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-warning">
                Auto-Trading is Disabled
              </p>
              <p className="mt-1 text-sm text-warning/80">
                Your cTrader account is connected but auto-trading is turned
                off.
              </p>
            </div>
            <button
              onClick={() => navigate("/settings?tab=ctrader")}
              className="rounded-xl bg-warning px-4 py-2.5 font-semibold text-white transition hover:bg-yellow-600"
            >
              Enable in Settings
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-success/20 bg-success/10 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center text-sm font-extrabold text-success">
              <Icon name="check" className="mr-2 h-5 w-5" />
              cTrader Connected & Auto-Trading Active
            </p>
            <p className="mt-1 text-sm text-success/80">
              AI signals will be executed on account:{" "}
              <span className="font-semibold">
                {user.cTraderConfig?.accountId}
              </span>
              .
            </p>
          </div>
          <button
            onClick={() => navigate("/settings?tab=ctrader")}
            className="rounded-xl border border-success/20 bg-light-surface px-4 py-2.5 text-sm font-semibold text-success transition hover:bg-light-hover"
          >
            Manage Settings
          </button>
        </div>
      </div>
    );
  };

  const TabButton: React.FC<{
    tabName: "active" | "history";
    label: string;
    count: number;
  }> = ({ tabName, label, count }) => {
    const active = activeTab === tabName;
    return (
      <button
        onClick={() => setActiveTab(tabName)}
        className={[
          "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
          active
            ? "bg-primary text-white shadow-sm"
            : "bg-light-surface text-mid-text hover:bg-light-hover hover:text-dark-text border border-light-gray",
        ].join(" ")}
      >
        {label}
        <span
          className={[
            "rounded-full px-2 py-0.5 text-xs",
            active ? "bg-white/20" : "bg-light-hover",
          ].join(" ")}
        >
          {count}
        </span>
      </button>
    );
  };

  const renderContent = () => {
    if (user?.plan || user?.subscribedPlan === PlanName.Free) return <UpgradePrompt />;

    if (activeTab === "active") {
      return activeTrades.length > 0 ? (
        <div className="space-y-4">
          {activeTrades.map((t) => (
            <TradeCard key={t.id} trade={t} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="analytics"
          title="No Active Trades"
          message="The AI is currently monitoring the markets for setups."
        />
      );
    }

    // history
    return (
      <>
        <div className="rounded-2xl border border-light-gray bg-light-surface p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-semibold text-mid-text">
                Instrument
              </label>
              <select
                value={filterInstrument}
                onChange={(e) => setFilterInstrument(e.target.value)}
                className="min-w-[180px] rounded-xl border border-light-gray bg-light-hover p-2.5 text-sm text-dark-text focus:border-primary focus:ring-primary"
              >
                <option value="all">All Instruments</option>
                {instrumentOptions
                  .filter((o) => o !== "all")
                  .map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-xs font-semibold text-mid-text">
                Outcome
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="min-w-[160px] rounded-xl border border-light-gray bg-light-hover p-2.5 text-sm text-dark-text focus:border-primary focus:ring-primary"
              >
                <option value="all">All Outcomes</option>
                <option value="win">Wins</option>
                <option value="loss">Losses</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-xs font-semibold text-mid-text">
                Date Range
              </label>
              <select
                value={filterTime}
                onChange={(e) => setFilterTime(e.target.value)}
                className="min-w-[160px] rounded-xl border border-light-gray bg-light-hover p-2.5 text-sm text-dark-text focus:border-primary focus:ring-primary"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Chip tone="info">{filteredHistory.length} found</Chip>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((t) => <TradeCard key={t.id} trade={t} />)
          ) : (
            <EmptyState
              icon="history"
              title="No Trades Found"
              message="No trades match your current filters."
            />
          )}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-light-bg p-8">
      {/* Confirm modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setIsConfirmModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-light-gray bg-light-surface p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-warning/10">
                <Icon name="danger" className="h-6 w-6 text-warning" />
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-dark-text">
                  Confirm & Lock Settings
                </h3>
                <p className="mt-2 text-sm text-mid-text">
                  The AI will use this balance and risk profile to calculate all
                  signals and analytics for your current subscription period.
                  <span className="mt-2 block font-semibold text-dark-text">
                    This cannot be changed later.
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="rounded-xl border border-light-gray bg-light-surface px-4 py-2.5 font-semibold text-mid-text transition hover:bg-light-hover"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-primary px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                onClick={handleConfirmSave}
              >
                Confirm & Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-text">AI Signals</h1>
          <p className="mt-1 text-sm text-mid-text">
            Monitor active trades, review history, and keep your risk profile
            consistent.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user?.plan || user?.subscribedPlan  !== PlanName.Free ? (
            <StatPill
              label="Signals Today"
              value={
                <span className="text-primary">
                  {signalUsage.count} / {signalUsage.limit}
                </span>
              }
            />
          ) : null}
          <StatPill
            label="Monitoring"
            value={
              <span
                className={
                  user?.plan || user?.subscribedPlan !== PlanName.Free ? "text-success" : "text-mid-text"
                }
              >
                {user?.plan || user?.subscribedPlan !== PlanName.Free ? "Active" : "Inactive"}
              </span>
            }
          />
        </div>
      </div>

      {/* Settings */}
      <div className="mb-6 rounded-2xl border border-light-gray bg-light-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-dark-text">
              Your Trade Settings
            </h2>
            <p className="mt-1 text-sm text-mid-text">
              Set once per subscription period to keep performance tracking
              accurate.
            </p>
          </div>

          {areSettingsLocked ? (
            <Chip tone="info">Locked</Chip>
          ) : (
            <Chip tone="warning">Not Locked</Chip>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
          <div>
            <label className="mb-1 block text-sm font-semibold text-dark-text">
              Account Balance
            </label>
            <input
              type="number"
              value={settings.balance}
              onChange={(e) => handleSettingsChange("balance", e.target.value)}
              disabled={areSettingsLocked}
              className="w-full rounded-xl border border-light-gray bg-light-hover p-2.5 text-sm text-dark-text focus:border-primary focus:ring-primary disabled:cursor-not-allowed disabled:bg-light-gray/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-dark-text">
              Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => handleSettingsChange("currency", e.target.value)}
              disabled={areSettingsLocked}
              className="w-full rounded-xl border border-light-gray bg-light-hover p-2.5 text-sm text-dark-text focus:border-primary focus:ring-primary disabled:cursor-not-allowed disabled:bg-light-gray/50"
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-dark-text">
              Risk per Trade (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.risk}
              onChange={(e) => handleSettingsChange("risk", e.target.value)}
              disabled={areSettingsLocked}
              className="w-full rounded-xl border border-light-gray bg-light-hover p-2.5 text-sm text-dark-text focus:border-primary focus:ring-primary disabled:cursor-not-allowed disabled:bg-light-gray/50"
            />
          </div>

          <button
            onClick={handleSaveClick}
            disabled={areSettingsLocked}
            className="rounded-xl bg-primary px-4 py-2.5 font-bold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-light-gray"
          >
            {areSettingsLocked ? "Settings Locked" : "Save Settings"}
          </button>

          {areSettingsLocked ? (
            <div className="md:col-span-4 mt-1 rounded-2xl border border-info/20 bg-info/10 p-3 text-sm text-info">
              <div className="flex items-start gap-2">
                <Icon name="info" className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <p>
                  Your settings are locked to ensure accurate performance
                  tracking for this subscription period.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-6">
        <CTraderStatus />
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <TabButton
            tabName="active"
            label="Active Trades"
            count={activeTrades.length}
          />
          <TabButton
            tabName="history"
            label="Trade History"
            count={filteredHistory.length}
          />
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default AISignalsPage;
