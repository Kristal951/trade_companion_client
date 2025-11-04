import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateForexSignal = async (instrument: string, riskLevel: string, signalType: string): Promise<GenerateContentResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the current market conditions for ${instrument} and generate a potential trade signal. The signal should be for a ${riskLevel} risk profile. ${signalType !== 'any' ? `Specifically, look for a ${signalType.toUpperCase()} opportunity.` : ''} Provide entry price, stop loss, and take profit levels. Also, include a brief reasoning for the signal.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            instrument: { type: Type.STRING },
            type: { type: Type.STRING },
            entryPrice: { type: Type.NUMBER },
            stopLoss: { type: Type.NUMBER },
            takeProfit: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
          },
          required: ["instrument", "type", "entryPrice", "stopLoss", "takeProfit", "reasoning"],
        },
      },
    });
    return response;
  } catch (error)
 {
    console.error("Error generating Forex signal:", error);
    throw error;
  }
};

export const getTradeAnalysis = async (tradeDetails: {
  instrument: string;
  timeFrame: string;
  tradeDirection: string;
  entryPrice: number;
  stopLossPrice: number;
  tpPrice: number;
}): Promise<{ text: string; sources: any[] }> => {
  const { instrument, timeFrame, tradeDirection, entryPrice, stopLossPrice, tpPrice } = tradeDetails;
  
  const systemPrompt = "You are an expert forex and commodities trading analyst. Provide a brief, concise, and straight-to-the-point analysis. Use up-to-date market information via Google Search.";
  const userPrompt = `
Analyze ${instrument} on the ${timeFrame} chart. The trade is a ${tradeDirection} from Entry ${entryPrice} with a Stop Loss at ${stopLossPrice} and a 1:2 Take-Profit at ${tpPrice}.

Provide a brief and actionable summary in three short, direct sections:
1. TECHNICAL OUTLOOK (Current trend & key levels)
2. MARKET CONTEXT (Top relevant fundamental factor)
3. CONCLUSION (Actionable trade advice for this entry/SL/TP setup)`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web) => web && web.uri && web.title);

    return { text, sources };
  } catch (error) {
    console.error("Error getting trade analysis:", error);
    throw error;
  }
};
