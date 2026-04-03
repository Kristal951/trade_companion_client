import { API } from "@/utils";

export type SaveSignalPayload = {
  userId: string;
  instrument: string;
  type: "BUY" | "SELL";
  isAI: boolean;

  entryPrice: number;
  stopLoss: number;
  takeProfits: number[];

  confidence: number;
  reasoning: string;
  technicalReasoning?: string;

  lotSize?: number;
  riskAmount?: number;

  meta?: any;
};

export async function saveSignalToDb(payload: SaveSignalPayload) {
  try {
    const res = await API.post("/api/signals/save_signal", payload);

    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 409) {
      return { duplicate: true };
    }
    console.error("Save signal error:", error);

    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to save signal",
    );
  }
}

export async function markSignalAsExecuted(
  signalId: string,
  payload: {
    executedPrice: number;
    executedAt?: string;
    brokerOrderId?: string;
  }
) {
  const res = await API.patch(
    `/api/signals/${signalId}/execute_signal`,
    payload
  );

  return res.data;
}