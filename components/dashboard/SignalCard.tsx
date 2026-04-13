import { TrendingUp, TrendingDown } from "lucide-react";

const SignalCard = ({ signal }: { signal: any }) => {
  const isBuy = signal.type === "BUY";

  const fmtPrice = (value?: number, digits = 5) => {
    if (typeof value !== "number") return "-";
    const d = value > 100 ? 2 : digits;
    return value.toLocaleString(undefined, {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  };

  const statusStyles: Record<string, string> = {
    NEW: "text-slate-500",
    ACTIVE: "text-amber-500",
    EXECUTED: "text-amber-500",
    WIN: "text-emerald-500",
    TP_HIT: "text-emerald-500",
    LOSS: "text-rose-500",
    SL_HIT: "text-rose-500",
    FAILED: "text-red-500"
  };

  const status = signal.status?.toUpperCase();
  const statusColor = statusStyles[status] || "text-slate-400";

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diff < 60) return "just now";

    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

    return past.toLocaleDateString();
  };

  return (
    <div className="group flex items-center justify-between p-4 rounded-lg bg-light-hover hover:bg-muted/40 transition">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-md ${isBuy ? "bg-emerald-500/10" : "bg-rose-500/10"}`}
        >
          {isBuy ? (
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-500" />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <p className="text-sm font-semibold text-foreground">
              {signal.instrument}
              <span
                className={`ml-2 text-xs font-medium ${isBuy ? "text-emerald-500 bg-emerald/500/20" : "text-rose-500 bg-rose-500/10"} p-1 rounded-md`}
              >
                {signal.type}
              </span>
            </p>
          </div>

          <div className="w-full flex gap-4 items-center">
            <div className="pr-3 flex items-center justify-center border-r">
              <p className="text-mid-text">
                Entry: {fmtPrice(signal.entryPrice)}
              </p>
            </div>
            <div className="pr-3 flex items-center justify-center border-r">
              <p className="text-mid-text">SL: {fmtPrice(signal.stopLoss)}</p>
            </div>
            <div className="pr-3 flex items-center justify-center border-r">
              <p className="text-mid-text">
                TP: {fmtPrice(signal.takeProfits?.[0])}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-right">
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${statusColor}`}
        >
          {signal.status}
        </p>

        <p className="text-[11px] text-muted-foreground">
          {formatTimeAgo(signal.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default SignalCard;
