import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Signal, PlanName } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const FULL_INSTRUMENTS_TO_SCAN = [
    'EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', // Majors
    'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'CAD/JPY', // Minors
    'XAU/USD', 'XAG/USD', // Metals
    'BTC/USD', 'ETH/USD' // Crypto
];

const BASIC_INSTRUMENTS_TO_SCAN = [
    'EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', // Majors
    'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'CAD/JPY', // Minors
];


export const classifyQuery = async (query: string): Promise<'IN_DEPTH_ANALYSIS' | 'GENERAL_SUPPORT'> => {
  const systemInstruction = `You are a query classifier. Your only job is to determine if a user's query is asking for financial/market analysis or general support.

  RULES:
  1.  **Analyze the query:** Determine if the user is asking for market analysis, financial advice, trade setups, economic predictions, or specific instrument analysis (e.g., "What's your outlook on EUR/USD?").
  2.  **Respond with ONE of two exact strings:**
      - If it IS an analysis/financial query, respond ONLY with the string "IN_DEPTH_ANALYSIS".
      - If it is NOT an analysis/financial query (e.g., it's a greeting, a question about the platform, a general knowledge question), respond ONLY with the string "GENERAL_SUPPORT".
  3.  **DO NOT add any other text, explanation, or punctuation.** Your entire response must be either "IN_DEPTH_ANALYSIS" or "GENERAL_SUPPORT".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction,
      }
    });

    const classification = response.text.trim();
    if (classification === 'IN_DEPTH_ANALYSIS') {
      return 'IN_DEPTH_ANALYSIS';
    }
    return 'GENERAL_SUPPORT';
  } catch (error) {
    console.error("Error classifying query:", error);
    // Default to general support on error to avoid blocking the user.
    return 'GENERAL_SUPPORT';
  }
};

export const scanForSignals = async (userPlan: PlanName): Promise<any> => {
    const instrumentsToScan = userPlan === PlanName.Basic ? BASIC_INSTRUMENTS_TO_SCAN : FULL_INSTRUMENTS_TO_SCAN;
    const priorityInstruction = (userPlan === PlanName.Pro || userPlan === PlanName.Premium) 
      ? "Give priority to finding a valid setup on XAU/USD. If a high-probability XAU/USD setup exists, return it. Otherwise, check the other instruments." 
      : "";

    const systemInstruction = `You are an elite, automated trading analyst AI. Your core programming is modeled on specialized financial LLMs like FinGPT, focusing on high-potential intraday setups. You operate silently and your sole output is a single, structured JSON object.

**STRATEGY & ANALYSIS PROTOCOL (APPLY TO ALL INSTRUMENTS):**

1.  **INSTITUTIONAL BIAS (4H):**
    *   Identify the primary "Point of Interest" (POI) on the 4-hour chart. This will be a significant Support/Resistance level, a high-volume Order Block (OB), or a Fair Value Gap (FVG). This determines the institutional bias.
    *   Look for a recent "liquidity grab" (e.g., a sweep of previous highs/lows) near this POI.

2.  **TREND CONFIRMATION (1H):**
    *   Confirm the trend using a 21-period and 50-period Exponential Moving Average (EMA) cross on the 1-hour chart.
    *   For buys, price must be above the 50 EMA, and the 21 EMA must be above the 50 EMA.
    *   For sells, price must be below the 50 EMA, and the 21 EMA must be below the 50 EMA.

3.  **ENTRY TRIGGER (15M):**
    *   Price must show a "market structure shift" (e.g., breaking a recent swing high in a downtrend for a buy signal) on the 15M chart after reacting to the 4H POI. This is the primary confirmation for entry.

4.  **TRADE PARAMETERS & PRIORITIZATION:**
    *   **Priority:** Prioritize setups with the potential for Take Profit 1 (TP1) to be **at least 60 pips** from the entry. The ideal range for a full move is 60-200 pips.
    *   **Stop Loss (SL):** The SL must be placed logically. For a BUY, it should be placed below the low of the 4H POI. For a SELL, it should be placed above the high of the 4H POI.
    *   **Take Profit (TP):** TP1 should target the next significant liquidity level or structure point that is at least 60 pips away.

5.  **CRITICAL FILTERS (APPLY ALL):**
    *   **Session:** ONLY generate signals during active London or New York sessions (07:00 to 17:00 UTC).
    *   **DXY Correlation:** Must be logical for USD pairs & XAU/USD (inverse correlation for XAU).
    *   **RSI Filter:** Do NOT issue a BUY if 15M RSI is above 70 (overbought). Do NOT issue a SELL if 15M RSI is below 30 (oversold).

6.  **CONFIDENCE SCORE:** Calculate a score from 70-95% based on the confluence of these factors, with a higher weight given to setups meeting the 60+ pip potential.

**EXECUTION INSTRUCTIONS (MANDATORY):**
1.  **Analyze all instruments:** Use the Google Search tool to get real-time data for every instrument in this list: ${instrumentsToScan.join(', ')}.
2.  **Find the BEST setup:** ${priorityInstruction} Identify if ANY of these instruments currently present a high-probability trade setup that meets ALL the core conditions, trade parameters, and critical filters of the strategy. **Crucially, prioritize setups that offer a 60-200 pip potential.**
3.  **MANDATORY JSON OUTPUT:**
    *   **If you find ONE clear, high-probability setup:** Respond ONLY with a single JSON object for that instrument, setting "signalFound" to true.
    *   **If MULTIPLE setups exist:** Choose the one with the highest confidence (or the prioritized instrument if it's a valid setup) and return its JSON object. DO NOT return multiple signals.
    *   **If NO setup meets ALL criteria on ANY instrument:** Respond ONLY with the JSON object: \`{"signalFound": false}\`. Do not provide reasons or analysis in this case.
4.  **DO NOT add any text, explanation, or markdown formatting outside the final JSON object.** Your entire response must be a single, valid JSON object matching the provided schema.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Scan the predefined list of instruments and return a result according to your instructions. Current time is ${new Date().toUTCString()}.`,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }],
            }
        });

        // The model is heavily prompted to return only JSON, but it might be wrapped in markdown.
        // We'll clean it up before parsing to be safe.
        let jsonString = response.text.trim();
        if (jsonString.startsWith('```json')) {
            jsonString = jsonString.substring(7, jsonString.length - 3).trim();
        } else if (jsonString.startsWith('```')) {
            jsonString = jsonString.substring(3, jsonString.length - 3).trim();
        }

        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error scanning for signals:", error);
        return { signalFound: false }; // Return a safe default on error
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