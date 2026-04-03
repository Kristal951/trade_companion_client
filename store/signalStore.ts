import { API } from "@/utils";
import { create } from "zustand";

type Signal = {
  _id: string;
  instrument: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  stopLoss: number;
  takeProfits: number[];
  confidence: number;
  status: string;
  createdAt: string;
};

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
  reasoning?: string;
  technicalReasoning?: string;
  createdAt?: string;
  executedAt?: string | null;
  executedPrice?: number | null;
  lotSize?: number | null;
  riskAmount?: number | null;
  meta?: Record<string, any>;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type SignalStore = {
  signals: Signal[];
  activeTrades: Signal[];
  loading: boolean;
  recentAISignals: AISignal[];
  aiLoading: boolean;
  aiError: string | null;

  page: number;
  limit: number;
  totalPages: number;
  total: number;

  setPage: (page: number) => void;

  fetchSignals: (page?: number) => Promise<void>;

  loadActiveSignalsFromStorage: (email: string) => void;
  loadRecentAISignals: (uid: string) => void;
  setActiveTrades: (trades: Signal[], email: string) => void;
};

export const useSignalStore = create<SignalStore>((set, get) => ({
  signals: [],
  activeTrades: [],
  loading: false,
  recentAISignals: [],
  aiLoading: false,
  aiError: null,

  page: 1,
  limit: 5,
  totalPages: 1,
  total: 0,

  setPage: (page) => set({ page }),

  // ✅ Load from localStorage
  loadActiveSignalsFromStorage: (email) => {
    try {
      const saved = localStorage.getItem(`active_trades_${email}`);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        set({ activeTrades: parsed });
      }
    } catch (err) {
      console.error("Failed to load storage:", err);
    }
  },

  // ✅ Save to localStorage + state
  setActiveTrades: (trades, email) => {
    try {
      localStorage.setItem(`active_trades_${email}`, JSON.stringify(trades));
      set({ activeTrades: trades });
    } catch (err) {
      console.error("Failed to save storage:", err);
    }
  },

  loadRecentAISignals: async (uid: string) => {
    if (!uid) return;

    try {
      set({ aiLoading: true, aiError: null });

      const res = await API.get(
        `/api/signals/ai/user/${encodeURIComponent(String(uid))}?limit=5`,
      );

      const data = res?.data;

      const items: AISignal[] = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.signals)
          ? data.signals
          : [];

      set({
        recentAISignals: items.slice(0, 5),
      });
    } catch (err: any) {
      set({
        aiError: err?.message || "Failed to fetch AI signals",
      });
    } finally {
      set({ aiLoading: false });
    }
  },

  fetchSignals: async (pageOverride) => {
    const { page, limit } = get();
    const currentPage = pageOverride || page;

    try {
      set({ loading: true });

      const res = await API.get(
        `/api/signals/my-active-signals?page=${currentPage}&limit=${limit}`,
      );

      const response = res.data;

      // ✅ Handle both API shapes
      const signals: Signal[] = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.signals)
          ? response.signals
          : [];

      const pagination: Pagination = response?.pagination || {
        page: currentPage,
        limit,
        total: signals.length,
        totalPages: 1,
      };

      const activeSignals = signals.filter((signal: Signal) =>
        ["NEW", "EXECUTED"].includes(String(signal.status || "").toUpperCase()),
      );

      set({
        signals,
        activeTrades: activeSignals,
        page: pagination.page || currentPage,
        totalPages: pagination.totalPages || 1,
        total: pagination.total || signals.length,
      });
    } catch (err) {
      console.error("Failed to fetch signals:", err);
    } finally {
      set({ loading: false });
    }
  },
}));
