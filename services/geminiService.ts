
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PlanName } from "../types";
import { instrumentDefinitions } from '../config/instruments';
import { fetchMarketContext, MarketContext, Candle } from "./marketDataService";

// Helper to safely get AI instance
const getAI = () => {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    console.error("API_KEY environment variable not set");
    throw new Error("API_KEY not set");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

const GENERATION_MODEL = 'gemini-3-pro-preview';

// Filtered list based on user request (All Majors, All Minors, Metals, Crypto, Indices)
// Total: 20 Instruments
export const TARGET_INSTRUMENTS = [
    // --- Majors (7) ---
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD', 'AUD/USD', 'NZD/USD',
    
    // --- Crosses (7) ---
    'EUR/JPY', 'GBP/JPY', 'EUR/GBP', 'AUD/JPY', 'NZD/JPY', 'AUD/NZD', 'EUR/CHF',
    
    // --- Commodities (2) ---
    'XAU/USD', 'XAG/USD',
    
    // --- Crypto (2) ---
    'BTC/USD', 'ETH/USD',

    // --- Indices (2) ---
    'US500', 'US100'
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
   Strategy: Supply/Demand + FVG & Retest
   - Core Logic: Reacts to US Yields and Geopolitics with aggressive volatility.
   - Primary Setup (FVG): Look for aggressive displacement candles (marubozu) that create a Fair Value Gap (FVG). Enter on the wick retrace into the FVG.
   - Secondary Setup (Break & Retest): Wait for price to cleanly break a 1H/4H Supply or Demand zone. Enter ONLY on the retest of the broken zone.
   - Confirmation: M15 rejection wick or engulfing candle at the FVG or Retest level.

4. Crypto (BTC/USD, ETH/USD)
   Strategy: Momentum Breakouts & FVG Fills
   - Core Logic: Momentum-heavy assets prone to fakeouts.
   - Setup (Break & Retest): Identify consolidation patterns (Flags, Pennants). Do NOT trade the initial breakout. Enter on the retest of the pattern boundary to confirm validity.
   - Setup (FVG Continuation): In a strong trend, look for price to pull back into a 15m/1H FVG (Inefficiency) before continuing the trend.
   - Indicator: Price must be above 20 EMA (Bullish) or below (Bearish).

5. Indices (US500, US100)
   Strategy: Session Open Volatility & Key Levels
   - Core Logic: Highly sensitive to US Market Open (9:30 AM EST).
   - Setup: Wait for the first 15-30 mins range to be established. Trade the breakout or rejection of the daily high/low.
   - Trend: Often trends strongly intraday. Use 50 EMA on H1 for trend bias.

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
    return 'GENERAL_SUPPORT';
  }
};

const cleanJsonString = (text: string): string => {
    // Find the first '{' and the last '}' to extract the JSON object
    const firstOpen = text.indexOf('{');
    const lastClose = text.lastIndexOf('}');
    
    if (firstOpen !== -1 && lastClose !== -1 && firstOpen < lastClose) {
        return text.substring(firstOpen, lastClose + 1);
    }
    
    // Fallback: simple cleanup if braces are not strictly found in order
    let clean = text.replace(/```json\n?|```/g, '');
    return clean.trim();
};

// Global rotation index for scanning batches
let rotationIndex = 0;

// Technical Analysis Helper
const calculateTechnicalSummary = (candles: Candle[]) => {
    if (candles.length < 200) {
        return { trend: 'NEUTRAL (Insufficient Data)', sma200: 0 };
    }
    
    const closes = candles.map(c => c.close);
    const lastPrice = closes[closes.length - 1];
    
    // SMA 200
    const sma200Slice = closes.slice(closes.length - 200);
    const sma200 = sma200Slice.reduce((a, b) => a + b, 0) / 200;
    
    // SMA 50
    const sma50Slice = closes.slice(closes.length - 50);
    const sma50 = sma50Slice.reduce((a, b) => a + b, 0) / 50;

    let trend = 'SIDEWAYS';
    if (lastPrice > sma200) {
        trend = lastPrice > sma50 ? 'STRONG BULLISH' : 'BULLISH PULLBACK';
    } else {
        trend = lastPrice < sma50 ? 'STRONG BEARISH' : 'BEARISH RETRACEMENT';
    }

    return { trend, sma200, sma50, lastPrice };
};

// Helper to check if market is open
const isMarketOpen = (instrument: string): boolean => {
    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getUTCHours();
    
    const def = instrumentDefinitions[instrument];
    if (!def) return false;

    // 1. Always Open: Synthetics (Deriv) & Crypto
    // Synthetics flag
    if (def.isDeriv) return true;
    
    // Explicit Crypto Check (BTC/ETH/SOL)
    const cryptoPairs = ['BTC/USD', 'ETH/USD', 'SOL/USD'];
    if (cryptoPairs.includes(instrument)) return true;

    // 2. Closed on Weekends (Forex, Metals, Indices)
    // Saturday (6) is fully closed for FX/Metals
    if (day === 6) return false;
    
    // Sunday (0) is closed until roughly 21:00 UTC (Market Open)
    // Adjust logic: If Sunday AND hour < 21, consider closed.
    if (day === 0 && hour < 21) return false;

    // Weekdays are open
    return true;
};

export const scanForSignals = async (userPlan: PlanName, userSettings: { balance: string; risk: string; currency: string; }): Promise<any> => {
    // 1. Define Priority Instruments (Always scanned if open)
    const PRIORITY_INSTRUMENTS = ['XAU/USD', 'BTC/USD'];
    
    // 2. Define Rotation Pool (All other instruments)
    const ROTATION_POOL = TARGET_INSTRUMENTS.filter(inst => !PRIORITY_INSTRUMENTS.includes(inst));
    
    // 3. Determine Batch Construction (Hybrid Batch)
    const BATCH_SIZE = 5;
    const SLOTS_FOR_ROTATION = BATCH_SIZE - PRIORITY_INSTRUMENTS.length; // 3 slots
    
    let currentBatch = [...PRIORITY_INSTRUMENTS];
    
    // 4. Fill Rotating Slots
    for (let i = 0; i < SLOTS_FOR_ROTATION; i++) {
        const index = (rotationIndex + i) % ROTATION_POOL.length;
        currentBatch.push(ROTATION_POOL[index]);
    }
    
    // 5. Update Rotation Index for next call
    rotationIndex = (rotationIndex + SLOTS_FOR_ROTATION) % ROTATION_POOL.length;
    
    // 6. Filter for Open Markets
    const openBatch = currentBatch.filter(isMarketOpen);

    if (openBatch.length === 0) {
        console.log(`[Hybrid AI Scanner] All instruments in batch are currently closed: ${currentBatch.join(', ')}`);
        return { signalFound: false };
    }
    
    console.log(`[Hybrid AI Scanner] Scanning open markets: ${openBatch.join(', ')}`);

    // Fetch 500 candles for deep analysis using filtered OPEN batch
    const marketContextPromises = openBatch.map(inst => fetchMarketContext(inst, 500));
    const allMarketContexts = await Promise.all(marketContextPromises);
    
    const marketContexts = allMarketContexts.filter(ctx => ctx.isDataReal || ctx.candles.length > 0);

    if (marketContexts.length === 0) {
        console.log("Scan aborted: No market data available.");
        return { signalFound: false };
    }
    
    const marketDataString = marketContexts.map((ctx: MarketContext) => {
        // 1. Calculate Long Term Trend locally (Method A)
        const techSummary = calculateTechnicalSummary(ctx.candles);
        
        // 2. Slice Data for AI Prompt (Method B - 24 Hours / 96 Candles)
        let rawCandlesStr = "Candle Data: Unavailable (Use Google Search for Structure)";
        if (ctx.candles && ctx.candles.length >= 5) {
            // Take last 96 candles (approx 24h on M15)
            const last96 = ctx.candles.slice(-96);
            rawCandlesStr = `Raw Candles (Last 24h - M15):\n` + last96.map(c => 
                `[${c.time.split('T')[1]?.slice(0,5)}] O:${c.open} H:${c.high} L:${c.low} C:${c.close}`
            ).join('\n');
        }

        // 3. Construct Hybrid Context Block
        return `
=== INSTRUMENT: ${ctx.instrument} ===
Current Price: ${ctx.currentPrice}
MACRO TREND (Calculated on 500 candles): ${techSummary.trend}
(Price vs 200 SMA: ${ctx.currentPrice > techSummary.sma200 ? 'ABOVE' : 'BELOW'})
${rawCandlesStr}
${ctx.details ? `Details: ${ctx.details}` : ''}
================================
`;
    }).join('\n');

    const patternClassifierPrompt = `You are "Olapete-Alpha", an elite algorithmic trading engine running a Hybrid 96-Candle Scan.
    
    **TASK:**
    Analyze the provided **Macro Trend** and **24-Hour Raw Candle Data** to find a high-probability setup.
    
    **CRITICAL EXECUTION RULES:**
    1.  **Trend Alignment (MANDATORY):** 
        - You MUST trade WITH the "Macro Trend" provided. 
        - If Trend is BULLISH, look ONLY for BUYS.
        - If Trend is BEARISH, look ONLY for SELLS.
        - If Trend is NEUTRAL, output {"pass": false}.
        
    2.  **Pattern Recognition (Visual):**
        - Use the 96 lines of raw candle data to visualize the chart shape for the last 24 hours.
        - Look for specific patterns: Bull/Bear Flags, Pennants, Head & Shoulders, Double Tops/Bottoms.
        - Look for Liquidity Wicks (stop hunts) near recent highs/lows.
    
    3.  **Pass Condition (STRICT):** 
        - If the 24h price action is chopping/ranging with no clear pattern: {"pass": false}.
        - If the Pattern opposes the Macro Trend: {"pass": false}.
    
    **STRATEGY GUIDELINES:**
    ${STRATEGY_GUIDELINES}

    **ANALYSIS RULES:**
    1.  **Risk Management:** Risk-to-Reward MUST be > 1.5.
    2.  **Profit Targets (CRITICAL):** Generate **Day Trading** setups where a 0.01 lot size yields **$10 to $15 profit**.
        -   **Forex (Majors/Minors):** Target price movement of **100 to 150 pips**.
        -   **Gold (XAU):** Target price movement of **$10.00 to $15.00**.
        -   **Crypto (BTC):** Target price movement of **$1,000 to $1,500**.
    3.  **Select Best:** Choose the single best setup from the batch.
    
    **MARKET DATA:**
    ${marketDataString}

    **Output:**
    -   If a valid setup is found, return the JSON object below.
    -   If NO setup matches all criteria, return \`{"pass": false}\`.
    -   Output ONLY valid JSON. Start immediately with {.

    **Valid Setup JSON Schema:**
    {
      "pass": true,
      "instrument": "XAU/USD",
      "type": "BUY",
      "entryPrice": 2300.50,
      "stopLoss": 2292.00,
      "takeProfit1": 2312.50,
      "pattern_score": 0.95,
      "tags": ["Trend Aligned", "Bull Flag", "SMA Support"],
      "reason_short": "Macro Trend is Bullish. 24h price action formed a clean Bull Flag pattern retesting the 200 SMA."
    }`;

    const financialAnalystPrompt = `You are a senior financial analyst validating an algorithmic trade signal.
    
    **Task:**
    1.  Analyze the provided trade candidate.
    2.  **NEWS CHECK (CRITICAL):** Check for **High Impact News** (Red Folder events like NFP, CPI, FOMC, Rate Decisions) relevant to the instrument's currencies in the next **60 minutes** using Google Search.
    3.  Verify the logic against the provided strategy type.
    
    **DECISION RULES:**
    - **IF HIGH IMPACT NEWS IS IMMINENT (< 60 mins):** You MUST set "confidence" to 0. Reason: "High Impact News Imminent - Trading Suspended".
    - **IF NO NEWS:** Evaluate technical strength normally.
    
    **CRITICAL OUTPUT RULE:** 
    - Output ONLY valid JSON.

    **JSON Schema:**
    {
      "confidence": 88,
      "reason": "Setup aligns with Macro Trend. No major news events scheduled. Volume is supporting the move.",
      "adjustment": { "sl_adjust_points": 0.0 }
    }`;

    try {
        const ai = getAI();
        
        const patternResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: GENERATION_MODEL,
            contents: `Analyze the hybrid market data (Trend + 96 Candles) provided in system prompt. Current UTC time is ${new Date().toUTCString()}.`,
            config: {
                systemInstruction: patternClassifierPrompt,
                tools: [{ googleSearch: {} }] // Keep search for extra validation if needed
            }
        }));
        
        let patternResult;
        try {
            const cleanText = cleanJsonString(patternResponse.text || '');
            patternResult = JSON.parse(cleanText);
        } catch (jsonError) {
            console.warn("JSON Parse Error in Pattern Classifier:", jsonError);
            return { signalFound: false };
        }

        if (!patternResult.pass) {
            console.log("Hybrid Scanner found no valid setups in current market conditions.");
            return { signalFound: false };
        }
        
        const instrumentProps = instrumentDefinitions[patternResult.instrument];
        
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
            analystResult = { confidence: 70, reason: "Analyst validation failed format check, proceeding with pattern score." };
        }

        const patternScore = (patternResult.pattern_score || 0) * 60; 
        const analystScore = (analystResult.confidence || 0) * 0.40;
        
        const finalConfidence = Math.min(100, patternScore + analystScore);
        
        const ACCEPTANCE_THRESHOLD = 85;
        if (finalConfidence < ACCEPTANCE_THRESHOLD) {
            console.log(`Signal for ${patternResult.instrument} rejected. Confidence ${finalConfidence.toFixed(2)} < ${ACCEPTANCE_THRESHOLD}.`);
            return { signalFound: false };
        }

        // Risk Calculation Logic (Unchanged)
        const currentEquity = parseFloat(userSettings.balance);
        const risk_pct = parseFloat(userSettings.risk);
        const risk_amount = currentEquity * (risk_pct / 100);

        const entryPrice = parseFloat(patternResult.entryPrice);
        const stopLoss = parseFloat(patternResult.stopLoss);
        
        if (isNaN(entryPrice) || isNaN(stopLoss)) return { signalFound: false };

        const pip_step = instrumentProps ? instrumentDefinitions[patternResult.instrument].pipStep : 0.0001;
        const stop_dist_price = Math.abs(entryPrice - stopLoss);
        const stopLossInPips = stop_dist_price / pip_step;
        
        let pipValueInUSDForOneLot = 10;
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
