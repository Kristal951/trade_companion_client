import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useTradeStore } from "@/store/tradeStore";

export function useTradeSocket(accessToken: string | null, instrument: string) {
  const setTrade = useTradeStore((s) => s.setTrade);
  const updateTrade = useTradeStore((s) => s.updateTrade);
  const removeTrade = useTradeStore((s) => s.removeTrade);

  useEffect(() => {
    if (!accessToken || !instrument) return;

    const socket = getSocket(accessToken);

    if (!socket.connected) socket.connect();

    socket.emit("subscribe_instrument", instrument);

    /* =========================
       PRICE (optional UI use)
    ========================== */
    socket.on(`price_update:${instrument}`, (data) => {
      console.log("Price:", data);
    });

    /* =========================
       TRADE LIFECYCLE
    ========================== */

    const onOpened = (trade: any) => {
      setTrade({
        ...trade,
        status: "open",
      });
    };

    const onUpdated = (update: any) => {
      updateTrade(update.tradeId, update);
    };

    const onClosed = (closed: any) => {
      updateTrade(closed.tradeId, {
        ...closed,
        status: "closed",
      });

      // optional: remove after delay
      setTimeout(() => {
        removeTrade(closed.tradeId);
      }, 5000);
    };

    socket.on("trade:opened", onOpened);
    socket.on("trade:updated", onUpdated);
    socket.on("trade:closed", onClosed);

    return () => {
      socket.emit("unsubscribe_instrument", instrument);

      socket.off(`price_update:${instrument}`);
      socket.off("trade:opened", onOpened);
      socket.off("trade:updated", onUpdated);
      socket.off("trade:closed", onClosed);
    };
  }, [accessToken, instrument]);
}
