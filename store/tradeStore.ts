import { create } from "zustand";

export type Trade = {
  _id: string;
  instrument: string;
  entryPrice: number;
  currentPrice?: number;
  pnl?: number;
  lotSize: number;
  status: "open" | "closed";
  userId: string;
  takeProfit?: number;
  stopLoss?: number;
  [key: string]: any;
};

type TradeStore = {
  trades: Record<string, Trade>;

  /* actions */
  setTrade: (trade: Trade) => void;
  updateTrade: (tradeId: string, updates: Partial<Trade>) => void;
  removeTrade: (tradeId: string) => void;
  setTradesBulk: (trades: Trade[]) => void;
  clearTrades: () => void;

  /* selectors */
  getTrade: (tradeId: string) => Trade | undefined;
  getAllTrades: () => Trade[];
};

export const useTradeStore = create<TradeStore>((set, get) => ({
  trades: {},

  /* =========================
     SET SINGLE TRADE
  ========================== */
  setTrade: (trade) =>
    set((state) => ({
      trades: {
        ...state.trades,
        [trade._id]: trade,
      },
    })),

  /* =========================
     UPDATE TRADE (PnL, price)
  ========================== */
  updateTrade: (tradeId, updates) =>
    set((state) => {
      const existing = state.trades[tradeId];
      if (!existing) return state;

      return {
        trades: {
          ...state.trades,
          [tradeId]: {
            ...existing,
            ...updates,
          },
        },
      };
    }),

  /* =========================
     REMOVE TRADE
  ========================== */
  removeTrade: (tradeId) =>
    set((state) => {
      const newTrades = { ...state.trades };
      delete newTrades[tradeId];
      return { trades: newTrades };
    }),

  /* =========================
     BULK SET (optional)
  ========================== */
  setTradesBulk: (trades) =>
    set(() => {
      const map: Record<string, Trade> = {};
      for (const trade of trades) {
        map[trade._id] = trade;
      }
      return { trades: map };
    }),

  /* =========================
     CLEAR
  ========================== */
  clearTrades: () => set({ trades: {} }),

  /* =========================
     SELECTORS
  ========================== */
  getTrade: (tradeId) => get().trades[tradeId],

  getAllTrades: () => Object.values(get().trades),
}));
