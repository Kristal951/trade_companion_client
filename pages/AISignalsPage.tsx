import React, { useState, useEffect, useMemo, useCallback } from "react";
import { DashboardView, PlanName, TradeRecord, User } from "@/types";
import Icon from "@/components/ui/Icon";
import { useUsageTracker } from "@/hooks/useUsageTracker";

/* -----------------------------
   REUSABLE METRIC COMPONENT
------------------------------ */
const Metric = ({
  label,
  value,
  danger,
  success,
  highlight,
}: {
  label: string;
  value: string;
  danger?: boolean;
  success?: boolean;
  highlight?: boolean;
}) => {
  return (
    <div
      className={`p-2 rounded-xl text-center ${
        highlight
          ? "bg-primary/10 border border-primary/20"
          : "bg-light-hover"
      }`}
    >
      <p className="text-[10px] text-mid-text">{label}</p>
      <p
        className={`font-semibold ${
          danger
            ? "text-danger"
            : success
            ? "text-success"
            : highlight
            ? "text-primary"
            : "text-dark-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
};

/* -----------------------------
        TRADE CARD
------------------------------ */
const TradeCard: React.FC<{ trade: TradeRecord }> = ({ trade }) => {
  const isBuy = trade.type === "BUY";
  const pnlColor = trade.status === "win" ? "text-success" : "text-danger";

  const [prevPrice, setPrevPrice] = useState<number | undefined>(
    trade.currentPrice
  );

  const [priceColor, setPriceColor] = useState<
    "text-dark-text" | "text-success" | "text-danger"
  >("text-dark-text");

  useEffect(() => {
    if (trade.currentPrice && prevPrice) {
      if (trade.currentPrice > prevPrice) setPriceColor("text-success");
      else if (trade.currentPrice < prevPrice) setPriceColor("text-danger");
    }
    setPrevPrice(trade.currentPrice);
  }, [trade.currentPrice]);

  let confColor = "text-mid-text";
  if (trade.confidence >= 85) confColor = "text-success";
  else if (trade.confidence >= 75) confColor = "text-info";
  else confColor = "text-warning";

  return (
    <div
      className={`rounded-2xl p-5 bg-light-surface shadow-sm hover:shadow-md transition-all border-l-4 ${
        trade.status === "active"
          ? "border-info"
          : trade.status === "win"
          ? "border-success"
          : "border-danger"
      }`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-dark-text text-lg">
            {trade.instrument}{" "}
            <span className={isBuy ? "text-success" : "text-danger"}>
              {trade.type}
            </span>
          </h4>

          <div className="flex items-center gap-3 mt-1 text-xs text-mid-text">
            <span>{new Date(trade.dateTaken).toLocaleString()}</span>

            <span
              className={`px-2 py-0.5 rounded-full border font-semibold ${confColor}`}
            >
              {trade.confidence}% confidence
            </span>
          </div>

          {trade.status !== "active" && (
            <p className="text-xs text-mid-text mt-1">
              Closed: {new Date(trade.dateClosed!).toLocaleString()}
            </p>
          )}
        </div>

        {trade.status !== "active" ? (
          <div className="text-right">
            <p className="text-xs text-mid-text">P&L</p>
            <p className={`font-bold text-lg ${pnlColor}`}>
              {trade.status === "win" ? "+" : "-"}$
              {Math.abs(trade.pnl ?? 0).toFixed(2)}
            </p>
          </div>
        ) : (
          <span className="text-xs bg-info/10 text-info px-3 py-1 rounded-full">
            Active
          </span>
        )}
      </div>

      {/* BODY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Metric
          label="Entry"
          value={trade.entryPrice.toFixed(5)}
        />
        <Metric label="SL" value={trade.stopLoss.toFixed(5)} danger />
        <Metric label="TP1" value={trade.takeProfit.toFixed(5)} success />

        {trade.status === "active" && trade.currentPrice && (
          <Metric
            label="Live"
            value={trade.currentPrice.toFixed(5)}
            highlight
          />
        )}
      </div>

      {/* FOOTER */}
      <div className="flex justify-between mt-4 text-xs text-mid-text">
        {trade.lotSize && <span>Lot: {trade.lotSize.toFixed(2)}</span>}

        {trade.status === "active" && typeof trade.pnl === "number" && (
          <span
            className={
              trade.pnl >= 0 ? "text-success font-semibold" : "text-danger"
            }
          >
            Floating P&L: {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
          </span>
        )}
      </div>

      {trade.technicalReasoning && (
        <div className="mt-4 text-xs text-mid-text bg-light-hover p-3 rounded-xl">
          <span className="font-bold text-dark-text">Olapete Logic: </span>
          {trade.technicalReasoning}
        </div>
      )}
    </div>
  );
};

/* -----------------------------
        MAIN PAGE
------------------------------ */
const AISignalsPage: React.FC<any> = ({
  user,
  showToast,
  activeTrades,
  tradeHistory,
  onViewChange,
}) => {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [areSettingsLocked, setAreSettingsLocked] = useState(false);

  const { getUsageInfo } = useUsageTracker(user);
  const signalUsage = getUsageInfo("aiSignal");

  const [settings, setSettings] = useState({
    balance: "",
    risk: "",
    currency: "USD",
  });

  const handleSettingsChange = useCallback((field: string, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`tradeSettings_${user.email}`);
    if (saved) setSettings(JSON.parse(saved));

    const locked = localStorage.getItem(`initialEquity_${user.email}`);
    if (locked) setAreSettingsLocked(true);
  }, [user.email]);

  const handleConfirmSave = () => {
    localStorage.setItem(
      `tradeSettings_${user.email}`,
      JSON.stringify(settings)
    );
    localStorage.setItem(
      `initialEquity_${user.email}`,
      settings.balance
    );

    setAreSettingsLocked(true);
    setIsConfirmModalOpen(false);
    showToast("Settings locked successfully", "success");
  };

  /* FILTERS */
  const [filterInstrument, setFilterInstrument] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTime, setFilterTime] = useState("all");

  const filteredHistory = useMemo(() => {
    return tradeHistory
      .filter((t) =>
        filterInstrument === "all" ? true : t.instrument === filterInstrument
      )
      .filter((t) =>
        filterStatus === "all" ? true : t.status === filterStatus
      )
      .filter((t) => {
        if (filterTime === "all") return true;
        const date = new Date(t.dateClosed!);
        const now = new Date();

        if (filterTime === "today")
          return date.toDateString() === now.toDateString();

        if (filterTime === "7d")
          return date > new Date(Date.now() - 7 * 86400000);

        if (filterTime === "30d")
          return date > new Date(Date.now() - 30 * 86400000);

        return true;
      });
  }, [tradeHistory, filterInstrument, filterStatus, filterTime]);

  const instrumentOptions = useMemo(
    () => ["all", ...new Set(tradeHistory.map((t) => t.instrument))],
    [tradeHistory]
  );

  const TabButton = ({ tabName, label, count }: any) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`relative px-4 py-2 text-sm font-semibold transition ${
        activeTab === tabName
          ? "text-primary"
          : "text-mid-text hover:text-dark-text"
      }`}
    >
      {label}
      <span className="ml-2 text-xs bg-light-hover px-2 py-0.5 rounded-full">
        {count}
      </span>

      {activeTab === tabName && (
        <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-primary rounded-full" />
      )}
    </button>
  );

  const EmptyState = ({ icon, title, message }: any) => (
    <div className="text-center py-16 bg-light-surface rounded-2xl shadow-sm">
      <Icon name={icon} className="w-12 h-12 mx-auto mb-3 text-primary/50" />
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-mid-text">{message}</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 bg-light-bg min-h-screen">
      {/* SETTINGS */}
      <div className="mb-8 p-6 bg-light-surface rounded-2xl shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-primary">
          Trade Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            className="p-3 rounded-xl bg-light-hover"
            placeholder="Balance"
            value={settings.balance}
            onChange={(e) =>
              handleSettingsChange("balance", e.target.value)
            }
            disabled={areSettingsLocked}
          />

          <select
            className="p-3 rounded-xl bg-light-hover"
            value={settings.currency}
            onChange={(e) =>
              handleSettingsChange("currency", e.target.value)
            }
            disabled={areSettingsLocked}
          >
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
          </select>

          <input
            className="p-3 rounded-xl bg-light-hover"
            placeholder="Risk %"
            value={settings.risk}
            onChange={(e) =>
              handleSettingsChange("risk", e.target.value)
            }
            disabled={areSettingsLocked}
          />

          <button
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={areSettingsLocked}
            className="bg-primary text-white rounded-xl font-semibold"
          >
            {areSettingsLocked ? "Locked" : "Save"}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex justify-between items-center border-b mb-4">
        <div className="flex">
          <TabButton
            tabName="active"
            label="Active"
            count={activeTrades.length}
          />
          <TabButton
            tabName="history"
            label="History"
            count={filteredHistory.length}
          />
        </div>
      </div>

      {/* CONTENT */}
      {activeTab === "active" ? (
        activeTrades.length ? (
          <div className="space-y-4">
            {activeTrades.map((t) => (
              <TradeCard key={t.id} trade={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="analytics"
            title="No Active Trades"
            message="AI is scanning the market..."
          />
        )
      ) : filteredHistory.length ? (
        <div className="space-y-4">
          {filteredHistory.map((t) => (
            <TradeCard key={t.id} trade={t} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="history"
          title="No History"
          message="No trades found for filters."
        />
      )}

      {/* MODAL */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-light-surface p-6 rounded-2xl max-w-md w-full">
            <h3 className="font-bold mb-2">Confirm Settings</h3>
            <p className="text-sm text-mid-text mb-4">
              This will lock your trading settings for this cycle.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmSave}
                className="bg-primary text-white px-4 py-2 rounded-xl"
              >
                Confirm
              </button>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="bg-light-hover px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISignalsPage;