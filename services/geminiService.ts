import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Signal, PlanName } from "../types";
import { instrumentDefinitions } from '../config/instruments';

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

export const scanForSignals = async (userPlan: PlanName, userSettings: { balance: string; risk: string; currency: string; }): Promise<any> => {
    const instrumentsToScan = userPlan === PlanName.Basic ? BASIC_INSTRUMENTS_TO_SCAN : FULL_INSTRUMENTS_TO_SCAN;
    
    // --- UTILITY TO CLEAN JSON FROM MODEL ---
    const cleanJsonString = (rawText: string): string => {
        let text = rawText.trim();
        if (text.startsWith('```json')) {
            text = text.substring(7, text.length - 3).trim();
        } else if (text.startsWith('```')) {
            text = text.substring(3, text.length - 3).trim();
        }
        return text;
    };

    // --- MODEL 1: PATTERN CLASSIFIER ---
    const patternClassifierPrompt = `You are a deterministic technical pattern classifier. Your job is to scan a list of financial instruments using real-time data from Google Search. You must identify ONE single high-probability setup based on Smart Money Concepts (SMC) and Institutional order flow (e.g., order blocks, liquidity grabs, market structure shifts).

    **Instructions:**
    1.  Use the search tool to get current market data for this list: ${instrumentsToScan.join(', ')}.
    2.  Find the single best intraday setup that matches the SMC criteria AND the following MANDATORY risk parameters:
        - The Risk-to-Reward ratio (distance to Take Profit / distance to Stop Loss) MUST be between 1.5 and 4.0.
        - For volatile pairs ('XAU/USD', 'BTC/USD'), the Take Profit distance MUST be at least 150 pips and the Stop Loss distance MUST be less than 100 pips.
        - For all other pairs, the Stop Loss distance MUST be less than 100 pips.
    3.  **Market Hours Check:** You MUST verify that the market for the instrument you select is currently open before providing a setup. Do not generate signals for closed markets (e.g., Forex and commodities like XAU/USD are closed on weekends). Use the current UTC time to determine market status.
    4.  If a valid setup is found, you MUST return a single JSON object with the exact following structure.
    5.  If NO setup meets all criteria (including market hours), you MUST return the JSON object: \`{"pass": false}\`.
    6.  Your entire response must be only the raw JSON. No markdown, no text before or after.
    
    **Pip Calculation Rules for Risk Parameters:**
    - Forex (4 decimals, e.g., EUR/USD): pips = ABS(price1 - price2) / 0.0001
    - Forex (2 decimals, e.g., USD/JPY): pips = ABS(price1 - price2) / 0.01
    - XAU/USD (Gold): pips = ABS(price1 - price2) / 0.1
    - BTC/USD (Bitcoin): pips = ABS(price1 - price2) / 10
    
    **Valid Setup JSON Schema:**
    \`\`\`json
    {
      "pass": true,
      "instrument": "XAU/USD",
      "type": "BUY",
      "entryPrice": 1985.2,
      "stopLoss": 1976.0,
      "takeProfit1": 2005.2,
      "pattern_score": 0.85,
      "tags": ["order-block", "liquidity-grab"],
      "reason_short": "Price reacted to a 4H order block after sweeping liquidity, showing a 15M market structure shift."
    }
    \`\`\``;

    // --- MODEL 2: FINANCIAL ANALYST ---
    const financialAnalystPrompt = `You are a senior financial analyst. You will be given a trade setup candidate that has already passed a technical pattern check. Your task is to provide a deeper analysis, consider market context using Google Search, and return a confidence score and detailed reasoning in a specific JSON format.

    **Instructions:**
    1.  Analyze the provided trade candidate.
    2.  Use the search tool to check for relevant high-impact news (e.g., FOMC, CPI, NFP) or market sentiment that could affect this trade.
    3.  Return a single JSON object with your findings.
    4.  Your entire response must be only the raw JSON. No markdown, no text before or after.

    **JSON Schema:**
    \`\`\`json
    {
      "confidence": 88,
      "reason": "The technical setup is strong due to the clear market structure shift at a key demand zone. However, be mindful of upcoming CPI data which could introduce volatility. The risk/reward to TP1 is favorable.",
      "adjustment": { "sl_adjust_points": 0.0, "comment": "SL is well-placed below the structural low." }
    }
    \`\`\``;

    try {
        // --- STEP 1: Call Pattern Classifier Model ---
        const patternResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Scan the predefined list of instruments and return a result according to your instructions. Current UTC time is ${new Date().toUTCString()}.`,
            config: {
                systemInstruction: patternClassifierPrompt,
                tools: [{ googleSearch: {} }],
            }
        });
        
        const patternResult = JSON.parse(cleanJsonString(patternResponse.text));

        // --- STEP 2: Check if a setup was found ---
        if (!patternResult.pass) {
            console.log("Pattern Classifier found no valid setup.");
            return { signalFound: false };
        }

        // --- STEP 3: Call Financial Analyst Model ---
        const analystContent = `Analyze the following trade candidate:\n${JSON.stringify(patternResult, null, 2)}`;
        const analystResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: analystContent,
            config: {
                systemInstruction: financialAnalystPrompt,
                tools: [{ googleSearch: {} }],
            }
        });
        const analystResult = JSON.parse(cleanJsonString(analystResponse.text));

        // --- STEP 4: Decision Layer ---
        const patternScore = (patternResult.pattern_score || 0) * 60; // 60% weight
        const analystScore = (analystResult.confidence || 0) * 0.30; // 30% weight
        
        // Simple rule-based score (10% weight)
        let rules_score = 0;
        if (patternResult.tags?.includes('order-block')) rules_score += 5;
        if (patternResult.tags?.includes('liquidity-grab')) rules_score += 5;
        
        const finalConfidence = Math.min(100, patternScore + analystScore + rules_score);
        
        const ACCEPTANCE_THRESHOLD = 70;
        if (finalConfidence < ACCEPTANCE_THRESHOLD) {
            console.log(`Signal for ${patternResult.instrument} rejected. Final confidence ${finalConfidence.toFixed(2)} is below threshold.`);
            return { signalFound: false };
        }

        // --- STEP 5: Calculate Lot Size based on User Settings ---
        const account_size = parseFloat(userSettings.balance);
        const risk_pct = parseFloat(userSettings.risk);
        const risk_amount = account_size * (risk_pct / 100);

        const entryPrice = parseFloat(patternResult.entryPrice);
        const stopLoss = parseFloat(patternResult.stopLoss);
        const stop_dist = Math.abs(entryPrice - stopLoss);
        
        const instrumentProps = instrumentDefinitions[patternResult.instrument];
        const pip_step = instrumentProps.pipStep;
        
        const stopLossInPips = stop_dist / pip_step;
        
        let pipValueInUSDForOneLot: number;
        
        if (instrumentProps.quoteCurrency === 'USD') {
            pipValueInUSDForOneLot = instrumentProps.contractSize * pip_step;
        } else if (instrumentProps.quoteCurrency === 'JPY') {
            // This is an approximation and would need a live USD/JPY rate for full accuracy
            pipValueInUSDForOneLot = (instrumentProps.contractSize * pip_step) / 150; 
        } else {
             // For non-USD pairs, this is a simplification. A live cross-rate is needed for accuracy.
             // We assume a rough value of $10 per pip for a standard lot for simplification.
            pipValueInUSDForOneLot = 10;
        }
        
        const totalRiskInUSDPerLot = stopLossInPips * pipValueInUSDForOneLot;
        const lotSize = totalRiskInUSDPerLot > 0 ? risk_amount / totalRiskInUSDPerLot : 0;
        
        // --- STEP 6: Format and Return Final Signal ---
        const finalSignal = {
            signalFound: true,
            instrument: patternResult.instrument,
            type: patternResult.type,
            entryPrice: parseFloat(patternResult.entryPrice),
            stopLoss: parseFloat(patternResult.stopLoss),
            takeProfit1: parseFloat(patternResult.takeProfit1),
            confidence: parseFloat(finalConfidence.toFixed(2)),
            reasoning: analystResult.reason,
            technicalReasoning: patternResult.reason_short,
            lotSize: parseFloat(lotSize.toFixed(2)),
            riskAmount: parseFloat(risk_amount.toFixed(2)),
        };
        
        return finalSignal;

    } catch (error) {
        console.error("Error during the new signal generation pipeline:", error);
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