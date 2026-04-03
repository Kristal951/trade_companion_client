import {
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

const SignalCard = ({ signal }: { signal: any }) => {
  const [open, setOpen] = useState(false);

  const fmtPrice = (value?: number, digits = 4): string => {
    if (value === null || value === undefined) return "-";
    if (isNaN(Number(value))) return "-";

    return Number(value).toFixed(digits);
  };

  const statusBadge = (status?: string): string => {
    const s = String(status || "").toLowerCase();

    if (s === "new") return "bg-info/20 text-info";
    if (s === "executed" || s === "active")
      return "bg-info/20 text-info animate-pulse";

    if (["closed", "tp_hit", "win"].includes(s))
      return "bg-success/20 text-success";

    if (["sl_hit", "loss"].includes(s)) return "bg-danger/20 text-danger";

    if (["cancelled", "expired"].includes(s)) return "bg-dark/10 text-mid-text";

    return "bg-dark/10 text-mid-text";
  };

  const statusLabel = (status?: string): string => {
    if (!status) return "Unknown";

    const map: Record<string, string> = {
      NEW: "New",
      EXECUTED: "Executed",
      CLOSED: "Closed",
      EXPIRED: "Expired",
      CANCELLED: "Cancelled",
      TP_HIT: "Take Profit",
      SL_HIT: "Stop Loss",
    };

    return map[status.toUpperCase()] || status;
  };

  return (
    <div
      className="group bg-light-bg p-4 rounded-xl border border-light-gray hover:shadow-md hover:border-primary/30 transition-all flex flex-col gap-3 cursor-pointer"
      onClick={() => setOpen((prev) => !prev)}
    >
      {/* Top Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* BUY/SELL ICON */}
          {signal.type === "BUY" ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : (
            <TrendingDown className="w-4 h-4 text-danger" />
          )}

          <span className="text-sm font-semibold text-dark-text">
            {signal.instrument}
          </span>

          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              signal.type === "BUY"
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            }`}
          >
            {signal.type}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusBadge(
              signal.status,
            )}`}
          >
            {statusLabel(signal.status)}
          </span>

          {open ? (
            <ChevronUp className="w-4 h-4 text-mid-text" />
          ) : (
            <ChevronDown className="w-4 h-4 text-mid-text" />
          )}
        </div>
      </div>

      {/* Price Section */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-light-hover p-2 rounded-lg flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <div>
            <p className="text-xs text-mid-text">Entry</p>
            <p className="font-semibold text-dark-text">
              {fmtPrice(signal.entryPrice)}
            </p>
          </div>
        </div>

        <div className="bg-light-hover p-2 rounded-lg flex items-center gap-2">
          <Shield className="w-4 h-4 text-danger" />
          <div>
            <p className="text-xs text-mid-text">SL</p>
            <p className="font-semibold text-danger">
              {fmtPrice(signal.stopLoss)}
            </p>
          </div>
        </div>

        <div className="bg-light-hover p-2 rounded-lg flex items-center gap-2">
          <Target className="w-4 h-4 text-success" />

          <div className="flex flex-col">
            <p className="text-xs text-mid-text">TP</p>

            <div className="flex items-center gap-2">
              <p className="font-semibold text-success">
                {signal.takeProfits?.length
                  ? fmtPrice(signal.takeProfits[0])
                  : "-"}
              </p>

              {/* Multiple TP indicator */}
              {signal.takeProfits?.length > 1 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  +{signal.takeProfits.length - 1}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Extra Info */}
      <div className="flex items-center justify-between text-xs text-mid-text">
        <div className="flex items-center gap-3">
          {signal.executedPrice && (
            <span>
              Exec:{" "}
              <span className="text-dark-text font-medium">
                {fmtPrice(signal.executedPrice)}
              </span>
            </span>
          )}

          {signal.confidence && (
            <span>
              Conf:{" "}
              <span className="text-primary font-medium">
                {signal.confidence}%
              </span>
            </span>
          )}
        </div>

        {signal.createdAt && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(signal.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* EXPANDED SECTION */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pt-3 border-t border-light-gray space-y-2 text-sm">
          {/* All Take Profits */}
          {signal.takeProfits?.length > 1 && (
            <div>
              <p className="text-xs text-mid-text mb-1">All Take Profits</p>
              <div className="flex flex-wrap gap-2">
                {signal.takeProfits.map((tp: number, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs bg-success/10 text-success rounded-md"
                  >
                    TP{i + 1}: {fmtPrice(tp)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning */}
          {signal.reasoning && (
            <div>
              <p className="text-xs text-mid-text mb-1">AI Reasoning</p>
              <p className="text-dark-text text-sm leading-relaxed">
                {signal.reasoning}
              </p>
            </div>
          )}

          {signal.technicalReasoning && (
            <div>
              <p className="text-xs text-mid-text mb-1">Technical Analysis</p>
              <p className="text-dark-text text-sm leading-relaxed">
                {signal.technicalReasoning}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignalCard;
