
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Signal, PlanName } from "../types";
import { instrumentDefinitions } from '../config/instruments';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Upgraded to the latest requested model
const GENERATION_MODEL = 'gemini-3-pro-preview';

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
  const systemInstruction = `You are a query classifier. Your job is to determine if a user's request requires a "Trade Setup" with specific parameters.

  CLASSIFICATION RULES:

  1. **IN_DEPTH_ANALYSIS** (Counted Usage):
     Return this ONLY if the user is asking for:
     - A specific **Trade Setup** (Entry, Stop Loss, Take Profit).
     - A **Signal** (Buy/Sell recommendation).
     - **Live Market Analysis** that implies a trade direction (e.g., "Analyze XAUUSD now", "What is the trend for BTC?").
     - A specific strategy scan (e.g., "Find me a Strategy A setup").

  2. **GENERAL_SUPPORT** (Free Usage):
     Return this for ALL other queries, including:
     - Definitions (e.g., "What is a pip?", "Explain RSI").
     - Educational questions (e.g., "How does Strategy A work?").
     - Platform support (e.g., "How do I change settings?").
     - General sentiment without trade parameters (e.g., "How is the market today?").
     - Greetings or casual chat.

  **OUTPUT:** Respond ONLY with the exact string "IN_DEPTH_ANALYSIS" or "GENERAL_SUPPORT". Do not add punctuation or explanation.`;

  try {
    const response = await ai.models.generateContent({
      model: GENERATION_MODEL,
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

    // --- MODEL 1: STRATEGY 'A' PATTERN CLASSIFIER ---
    // STRICT implementation of the user's requested strategy.
    const patternClassifierPrompt = `You are an elite algorithmic trading engine using "Strategy A". Your job is to scan a list of financial instruments using real-time data via Google Search and identify ONE high-probability trade setup.

    **STRATEGY A DEFINITION (MANDATORY):**
    A valid "Strategy A" setup MUST contain these three specific confluences:
    1.  **Liquidity Sweep:** Price has recently taken out a key High or Low (sweeping stop losses).
    2.  **Market Structure Shift (MSS):** Immediately after the sweep, price aggressively reverses and breaks structure in the opposite direction.
    3.  **Return to Origin:** Price is currently retracing into a Fair Value Gap (FVG) or Order Block created by the MSS move.

    **Instructions:**
    1.  Use the search tool to get current live price data and chart context for: ${instrumentsToScan.join(', ')}.
    2.  Find the single best intraday setup that strictly matches "Strategy A".
    3.  **Risk Management Check:**
        -   Risk-to-Reward MUST be between 1.5 and 4.0.
        -   Stop Loss must be placed logically beyond the swing point formed by the Liquidity Sweep.
        -   For XAU/USD and BTC/USD: Min TP distance 150 pips, Max SL distance 100 pips.
        -   For Forex Pairs: Max SL distance 60 pips.
    4.  **Market Hours Check:** Verify the market is currently OPEN. Do not signal on weekends.
    5.  **Output:**
        -   If a valid "Strategy A" setup is found, return the JSON object below.
        -   If NO setup matches all criteria, return \`{"pass": false}\`.
        -   Return ONLY raw JSON.

    **Pip Calculation Rules:**
    - Forex (4 decimals, e.g., EUR/USD): pips = ABS(price1 - price2) / 0.0001
    - JPY Pairs (2 decimals): pips = ABS(price1 - price2) / 0.01
    - XAU/USD: pips = ABS(price1 - price2) / 0.1
    - BTC/USD: pips = ABS(price1 - price2) / 10

    **Valid Setup JSON Schema:**
    \`\`\`json
    {
      "pass": true,
      "instrument": "XAU/USD",
      "type": "BUY",
      "entryPrice": 1985.2,
      "stopLoss": 1976.0,
      "takeProfit1": 2005.2,
      "pattern_score": 0.92,
      "tags": ["Strategy A", "Liquidity Sweep", "MSS", "FVG-Retest"],
      "reason_short": "Strategy A Validated: Price swept previous daily low liquidity, shifted structure to the upside on 15M, and is now retesting the bullish order block."
    }
    \`\`\``;

    // --- MODEL 2: FINANCIAL ANALYST ---
    const financialAnalystPrompt = `You are a senior financial analyst validating an algorithmic trade signal.
    
    **Task:**
    1.  Analyze the provided trade candidate which was generated using "Strategy A".
    2.  Use Google Search to check for **High Impact News** (Red Folder events like NFP, CPI, FOMC) scheduled for the next 4 hours.
    3.  If high-impact news is imminent (within 1 hour), LOWER the confidence score significantly or reject the trade.
    4.  Return a JSON object with your confidence assessment.

    **JSON Schema:**
    \`\`\`json
    {
      "confidence": 88,
      "reason": "Strategy A confluence is strong. Market sentiment aligns with a bullish reversal. No high-impact news scheduled for the next 4 hours.",
      "adjustment": { "sl_adjust_points": 0.0, "comment": "SL placement is safe below the swing low." }
    }
    \`\`\``;

    try {
        // --- STEP 1: Call Pattern Classifier Model ---
        const patternResponse = await ai.models.generateContent({
            model: GENERATION_MODEL,
            contents: `Scan the instruments. Current UTC time is ${new Date().toUTCString()}. Find the best Strategy A setup.`,
            config: {
                systemInstruction: patternClassifierPrompt,
                tools: [{ googleSearch: {} }],
            }
        });
        
        const patternResult = JSON.parse(cleanJsonString(patternResponse.text));

        // --- STEP 2: Check if a setup was found ---
        if (!patternResult.pass) {
            console.log("Pattern Classifier found no valid Strategy A setup.");
            return { signalFound: false };
        }
        
        const instrumentProps = instrumentDefinitions[patternResult.instrument];
        if (!instrumentProps) {
            console.warn(`Instrument definition not found for: ${patternResult.instrument}`);
            return { signalFound: false };
        }

        // --- STEP 3: Call Financial Analyst Model ---
        const analystContent = `Analyze this Strategy A setup:\n${JSON.stringify(patternResult, null, 2)}`;
        const analystResponse = await ai.models.generateContent({
            model: GENERATION_MODEL,
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
        
        // Strategy A Bonus (10% weight) - Verify tags
        let rules_score = 0;
        if (patternResult.tags?.includes('Strategy A')) rules_score += 10;
        
        const finalConfidence = Math.min(100, patternScore + analystScore + rules_score);
        
        const ACCEPTANCE_THRESHOLD = 75; // Stricter threshold for Strategy A
        if (finalConfidence < ACCEPTANCE_THRESHOLD) {
            console.log(`Signal for ${patternResult.instrument} rejected. Final confidence ${finalConfidence.toFixed(2)} is below threshold.`);
            return { signalFound: false };
        }

        // --- STEP 5: Equity-Based Lot Size Calculation ---
        // User's actual balance from settings is key here
        const currentEquity = parseFloat(userSettings.balance);
        const risk_pct = parseFloat(userSettings.risk);
        
        // 1. Calculate exact Risk Amount based on Equity
        const risk_amount = currentEquity * (risk_pct / 100);

        const entryPrice = parseFloat(patternResult.entryPrice);
        const stopLoss = parseFloat(patternResult.stopLoss);
        
        // 2. Calculate Stop Distance in Pips
        const stop_dist_price = Math.abs(entryPrice - stopLoss);
        const pip_step = instrumentProps.pipStep;
        const stopLossInPips = stop_dist_price / pip_step;
        
        // 3. Calculate Pip Value per Lot
        let pipValueInUSDForOneLot: number;
        
        // Standard contract size (e.g. 100,000 for FX, 100 for Gold)
        const contractSize = instrumentProps.contractSize;

        if (instrumentProps.quoteCurrency === 'USD') {
            // e.g. EUR/USD: 0.0001 * 100,000 = $10 per pip
            pipValueInUSDForOneLot = pip_step * contractSize;
        } else if (instrumentProps.quoteCurrency === 'JPY') {
            // e.g. USD/JPY: (0.01 * 100,000) / 150 (approx rate) = ~$6.66
            pipValueInUSDForOneLot = (pip_step * contractSize) / 150; 
        } else {
            // Fallback for other crosses, using an approximation
             pipValueInUSDForOneLot = 10; 
        }
        
        // 4. Calculate Lot Size
        // Formula: LotSize = RiskAmount / (StopLossPips * PipValuePerLot)
        let lotSize = 0;
        const totalRiskPerLot = stopLossInPips * pipValueInUSDForOneLot;
        
        if (totalRiskPerLot > 0) {
            lotSize = risk_amount / totalRiskPerLot;
        }

        // Normalize lot size (usually 2 decimals, min 0.01)
        lotSize = Math.max(0.01, parseFloat(lotSize.toFixed(2)));
        
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
            technicalReasoning: patternResult.reason_short, // Should mention Strategy A
            lotSize: lotSize,
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
1. TECHNICAL OUTLOOK (Check for Strategy A confluence: Sweep + MSS)
2. MARKET CONTEXT (Top relevant fundamental factor)
3. CONCLUSION (Actionable trade advice for this entry/SL/TP setup)`;

  try {
    const response = await ai.models.generateContent({
      model: GENERATION_MODEL,
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
