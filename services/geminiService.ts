
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PlanName } from "../types";
import { instrumentDefinitions } from '../config/instruments';
import { fetchMarketContext, MarketContext } from "./marketDataService";

// Helper to safely get AI instance
const getAI = () => {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    console.error("API_KEY environment variable not set");
    throw new Error("API_KEY not set");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

// Upgraded to the latest requested model
const GENERATION_MODEL = 'gemini-3-pro-preview';

// Filtered list based on user request (All Majors, All Minors, Metals, Crypto)
// Synthetics have been removed.
export const TARGET_INSTRUMENTS = [
    // --- Majors ---
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD', 'AUD/USD', 'NZD/USD',
    
    // --- Minors & Crosses ---
    'EUR/GBP', 'EUR/JPY', 'EUR/AUD', 'EUR/CAD', 'EUR/CHF', 'EUR/NZD',
    'GBP/JPY', 'GBP/AUD', 'GBP/CAD', 'GBP/CHF', 'GBP/NZD',
    'AUD/JPY', 'AUD/CAD', 'AUD/CHF', 'AUD/NZD',
    'NZD/JPY', 'NZD/CAD', 'NZD/CHF',
    'CAD/JPY', 'CAD/CHF', 'CHF/JPY',
    
    // --- Metals ---
    'XAU/USD', 'XAG/USD',
    
    // --- Crypto ---
    'BTC/USD', 'ETH/USD', 'SOL/USD'
];

// Strategy Guidelines
const STRATEGY_GUIDELINES = `
1. Major FX Pairs (e.g., EUR/USD, GBP/USD, USD/JPY)
   Strategy: Session Overlap & Liquidity Grab (SMC)
   - Core Logic: 70–80% of daily volume occurs during the London–New York overlap.
   - Setup: Look for a "Judas Swing" (fake breakout) followed by aggressive displacement.
   - Entry: Retracement into a Fair Value Gap (FVG) or 62–79% Fibonacci zone on the M15 chart.

2. Minor FX Pairs (e.g., EUR/GBP, GBP/JPY, AUD/CAD)
   Strategy: Trend Continuation & Cross-Pair Correlation
   - Core Logic: Trade based on currency strength divergence (e.g., Strong GBP vs Weak JPY).
   - Setup: Break and retest of key consolidation zones on M15.
   - Entry: Bullish/Bearish Engulfing or Pin Bar rejection at support/resistance.

3. Metals (XAU/USD, XAG/USD)
   Strategy: Macro-Driven Supply & Demand Zoning
   - Core Logic: Reacts to US Yields and Geopolitics.
   - Setup: Price approaching a fresh 4H/Daily Supply or Demand zone.
   - Confirmation: M15 rejection wick or engulfing candle at the zone.

4. Crypto (BTC/USD, ETH/USD)
   Strategy: Trend Following & Momentum Breakout
   - Core Logic: Momentum-heavy assets.
   - Setup: Price above 20-period Moving Average (Bullish) or below (Bearish).
   - Entry: Breakout of consolidation patterns (Flags, Pennants) on M15/H1.

5. Synthetic Indices (Deriv: Volatility, Crash, Boom)
   Strategy: Algorithmic Price Action & Spike Catching
   - Volatility Indices (V75, V10): Pure technicals. Respects support/resistance strictly. Trend following on H1/H4.
   - Crash (500/1000): "Crash" implies sharp drops. Trend trading: Sell the trend. Reversal: Buy ONLY on confirmed structure shift after a spike series.
   - Boom (500/1000): "Boom" implies sharp spikes UP. Trend trading: Buy the trend. Reversal: Sell ONLY on confirmed break of structure.

6. **Trading Analysis (Adaptive Strategy):** 
   Your expertise is comprehensive across all technical disciplines. You can fluidly apply and combine: **SMC** (Order Blocks, FVG, Liquidity, BOS, CHoCH), **Market Structure & Pullback**, **Support/Resistance**, **Trendlines**, **Candlestick Patterns** (e.g., Engulfing, Hammer), **Chart Patterns** (e.g., Head & Shoulders, Flags), and **Mean Reversion / Scalping**. Your goal is always to provide the **most effective, adaptive analysis** for any pair or timeframe to maximize profitability, based on the current chart condition. You will select the optimal concept (including Strategy A through K below) for the situation.

   **Core Strategy A: Market Structure & Pullback Trading (Best for Trend Continuation)**
   * **Concept:** Patiently wait for the price to "pull back" to a logical area of support or resistance in an established trend. This approach relies on momentum continuation.
   * **Execution:**
     1. **Identify Trend:** Confirm a clear trend on a Daily or 4-Hour chart.
     2. **Identify Key Level:** Find a clear old **resistance turned new support** (or vice versa), or a strong Moving Average (like the 50-day EMA).
     3. **Entry:** Wait for the price to test this level and show a clear sign of rejection (e.g., a bullish engulfing or hammer candle).
     4. **Risk Management:** Place a tight **Stop-Loss** just outside the key level. Target a **Take-Profit** at a 1:2 or 1:3 Risk/Reward ratio.
`;

// Retry Utility
export const withRetry = async <T>(fn: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED')) {
      console.warn(`API Quota exceeded. Retrying in ${baseDelay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, baseDelay));
      return withRetry(fn, retries - 1, baseDelay * 2);
    }
    throw error;
  }
};

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
    const ai = getAI();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: query,
      config: {
        systemInstruction,
      }
    }));

    const classification = response.text ? response.text.trim() : 'GENERAL_SUPPORT';
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

const cleanJsonString = (text: string): string => {
    // Remove markdown code blocks and whitespace
    let clean = text.replace(/```json\n?|```/g, '');
    return clean.trim();
};

export const scanForSignals = async (userPlan: PlanName, userSettings: { balance: string; risk: string; currency: string; }): Promise<any> => {
    // Determine which instruments to scan based on plan, but strictly adhering to the requested list
    const marketContextPromises = TARGET_INSTRUMENTS.map(inst => fetchMarketContext(inst));
    const marketContexts = await Promise.all(marketContextPromises);
    
    // Convert context to string for AI
    // NOTE: We flag if the data is REAL or MOCK so the AI knows how much to trust the price vs search results.
    const marketDataString = marketContexts.map((ctx: MarketContext) => {
        return `Instrument: ${ctx.instrument}
Current Price: ${ctx.currentPrice} ${ctx.isDataReal ? '(LIVE API)' : '(MOCK/PLACEHOLDER)'}
Trend: ${ctx.trend}
${ctx.details ? `Details: ${ctx.details}` : ''}
--------------------------------`;
    }).join('\n');

    // --- MODEL 1: MULTI-STRATEGY SCANNER ---
    const patternClassifierPrompt = `You are an elite algorithmic trading engine. 
    
    **TASK:**
    Analyze the provided **Prices** for the instruments below. 
    
    **CRITICAL EXECUTION RULES:**
    1. **Data Integrity:** 
       - If price is marked (LIVE API), use it as the definitive Entry Price.
       - If price is marked (MOCK/PLACEHOLDER), you **MUST** use the \`googleSearch\` tool to find the ACTUAL current price before deciding.
    2. **Trend Validation:** You **MUST USE THE \`googleSearch\` TOOL** to find the current M15/H1 technical analysis, trend direction, and key levels (Market Structure) for EACH instrument you consider.
    3. **Pass Condition:** If the Google Search results indicate chop/consolidation, or if the direction contradicts the strategy, return {"pass": false}.
    
    **STRATEGY GUIDELINES:**
    ${STRATEGY_GUIDELINES}

    **ANALYSIS RULES:**
    1.  **Risk Management:** Risk-to-Reward MUST be > 1.5.
    2.  **Profit Targets (CRITICAL):** Prioritize **Intraday/Swing** setups with **150 pips to 300 pips** profit potential.
        -   **Forex (Majors):** Target price movement of ~0.0150 to 0.0300 (e.g. 1.0800 -> 1.0650).
        -   **Forex (JPY):** Target price movement of ~1.50 to 3.00.
        -   **Gold (XAU):** Target price movement of ~$15.00 to $30.00 (e.g. 2300 -> 2320).
        -   **Crypto (BTC):** Target substantial intraday moves ($150+), but keep it within day-trade range.
        -   **Strictness:** Do NOT generate small scalp signals (<100 pips). Only return a signal if the market structure allows for this magnitude of profit (e.g. clean breakouts, key level rejections).
    3.  **Select Best:** Choose the single best setup from the provided list based on the clearer trend found via Search.
    
    **MARKET DATA:**
    ${marketDataString}

    **Output:**
    -   If a valid setup is found, return the JSON object below.
    -   If NO setup matches all criteria, return \`{"pass": false}\`.
        
    **CRITICAL OUTPUT RULE:** 
    - You MUST output ONLY valid JSON. 
    - Do NOT output markdown blocks.
    - Start immediately with {.

    **Valid Setup JSON Schema:**
    {
      "pass": true,
      "instrument": "XAU/USD",
      "type": "BUY",
      "entryPrice": 2300.50,
      "stopLoss": 2290.00,
      "takeProfit1": 2320.00,
      "pattern_score": 0.95,
      "tags": ["Bullish Trend", "Search Confirmed", "150+ Pips Potential"],
      "reason_short": "Google Search indicates strong bullish momentum on M15 breaking resistance with clear 200 pip target."
    }`;

    // --- MODEL 2: FINANCIAL ANALYST ---
    const financialAnalystPrompt = `You are a senior financial analyst validating an algorithmic trade signal.
    
    **Task:**
    1.  Analyze the provided trade candidate.
    2.  Check for **High Impact News** relevant to the instrument (e.g., NFP for USD, CPI, FOMC) in the next 4 hours using Google Search.
    3.  Verify the logic against the provided strategy type.
    4.  Return a JSON object with your confidence assessment.
    
    **CRITICAL OUTPUT RULE:** 
    - Output ONLY valid JSON.

    **JSON Schema:**
    {
      "confidence": 88,
      "reason": "Setup aligns with Session Overlap strategy. No major news events scheduled. Volume is supporting the move.",
      "adjustment": { "sl_adjust_points": 0.0 }
    }`;

    try {
        const ai = getAI();
        
        // --- STEP 1: Call Pattern Classifier Model ---
        const patternResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: GENERATION_MODEL,
            contents: `Analyze the live market data provided in system prompt. Current UTC time is ${new Date().toUTCString()}.`,
            config: {
                systemInstruction: patternClassifierPrompt,
                tools: [{ googleSearch: {} }] // KEY: Search is now critical for context
            }
        }));
        
        let patternResult;
        try {
            // Manual JSON parsing since we can't enforce MIME type with Search tool
            const cleanText = cleanJsonString(patternResponse.text || '');
            patternResult = JSON.parse(cleanText);
        } catch (jsonError) {
            console.warn("JSON Parse Error in Pattern Classifier:", jsonError);
            console.debug("Raw Text:", patternResponse.text);
            return { signalFound: false };
        }

        // --- STEP 2: Check if a setup was found ---
        if (!patternResult.pass) {
            console.log("Pattern Classifier found no valid setups in current market conditions.");
            return { signalFound: false };
        }
        
        const instrumentProps = instrumentDefinitions[patternResult.instrument];
        
        // --- STEP 3: Call Financial Analyst Model ---
        const analystContent = `Analyze this setup:\n${JSON.stringify(patternResult, null, 2)}`;
        
        const analystResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: GENERATION_MODEL,
            contents: analystContent,
            config: {
                systemInstruction: financialAnalystPrompt,
                tools: [{ googleSearch: {} }]
            }
        }));
        
        let analystResult;
        try {
            const cleanText = cleanJsonString(analystResponse.text || '');
            analystResult = JSON.parse(cleanText);
        } catch (jsonError) {
            console.warn("JSON Parse Error in Analyst:", jsonError);
            // Fallback if analyst JSON fails but pattern was good
            analystResult = { confidence: 70, reason: "Analyst validation failed format check, proceeding with pattern score." };
        }

        // --- STEP 4: Decision Layer ---
        const patternScore = (patternResult.pattern_score || 0) * 60; // 60% weight
        const analystScore = (analystResult.confidence || 0) * 0.40; // 40% weight
        
        const finalConfidence = Math.min(100, patternScore + analystScore);
        
        const ACCEPTANCE_THRESHOLD = 70;
        if (finalConfidence < ACCEPTANCE_THRESHOLD) {
            console.log(`Signal for ${patternResult.instrument} rejected. Confidence ${finalConfidence.toFixed(2)} < ${ACCEPTANCE_THRESHOLD}.`);
            return { signalFound: false };
        }

        // --- STEP 5: Equity-Based Lot Size Calculation ---
        const currentEquity = parseFloat(userSettings.balance);
        const risk_pct = parseFloat(userSettings.risk);
        const risk_amount = currentEquity * (risk_pct / 100);

        const entryPrice = parseFloat(patternResult.entryPrice);
        const stopLoss = parseFloat(patternResult.stopLoss);
        
        // Safety check for pricing
        if (isNaN(entryPrice) || isNaN(stopLoss)) return { signalFound: false };

        const pip_step = instrumentProps ? instrumentDefinitions[patternResult.instrument].pipStep : 0.0001;
        const stop_dist_price = Math.abs(entryPrice - stopLoss);
        const stopLossInPips = stop_dist_price / pip_step;
        
        // Calculate Lot Size (Simplified)
        let pipValueInUSDForOneLot = 10; // Default
        const contractSize = instrumentProps ? instrumentDefinitions[patternResult.instrument].contractSize : 100000;
        const quoteCurrency = instrumentProps ? instrumentDefinitions[patternResult.instrument].quoteCurrency : 'USD';

        if (quoteCurrency === 'USD') {
            pipValueInUSDForOneLot = pip_step * contractSize;
        } else if (quoteCurrency === 'JPY') {
            pipValueInUSDForOneLot = (pip_step * contractSize) / 150; 
        }
        
        let lotSize = 0;
        const totalRiskPerLot = stopLossInPips * pipValueInUSDForOneLot;
        
        if (totalRiskPerLot > 0) {
            lotSize = risk_amount / totalRiskPerLot;
        }

        lotSize = Math.max(0.01, parseFloat(lotSize.toFixed(2)));
        
        // --- STEP 6: Format and Return Final Signal ---
        const finalSignal = {
            signalFound: true,
            instrument: patternResult.instrument,
            type: patternResult.type,
            entryPrice: entryPrice,
            stopLoss: stopLoss,
            takeProfit1: parseFloat(patternResult.takeProfit1),
            confidence: parseFloat(finalConfidence.toFixed(2)),
            reasoning: analystResult.reason,
            technicalReasoning: patternResult.reason_short,
            lotSize: lotSize,
            riskAmount: parseFloat(risk_amount.toFixed(2)),
        };
        
        return finalSignal;

    } catch (error) {
        console.error("Error during the new signal generation pipeline:", error);
        return { signalFound: false };
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
  
  const systemPrompt = `You are an expert financial analyst. 
  
  STRATEGY GUIDELINES TO CONSIDER:
  ${STRATEGY_GUIDELINES}
  
  Provide a brief, concise, and straight-to-the-point analysis using these guidelines where applicable.`;

  const userPrompt = `
Analyze ${instrument} on the ${timeFrame} chart. The trade is a ${tradeDirection} from Entry ${entryPrice} with a Stop Loss at ${stopLossPrice} and a 1:2 Take-Profit at ${tpPrice}.

Provide a brief and actionable summary in three short, direct sections:
1. TECHNICAL OUTLOOK (Pattern & Strategy Fit)
2. MARKET CONTEXT (Fundamental/News)
3. CONCLUSION (Actionable trade advice)`;

  try {
    const ai = getAI();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }],
      }
    }));

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web) => web && web && web.uri && web.title);

    return { text, sources };
  } catch (error) {
    console.error("Error getting trade analysis:", error);
    throw error;
  }
};
