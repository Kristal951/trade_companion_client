
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

// Helper to shuffle array and pick subset
const getRandomSubset = (array: string[], count: number) => {
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// Strategy Guidelines - Olapete AI-Aligned Bot Logic
// NOTE: This logic is EXCLUSIVELY for the Automated Signal Generator.
const STRATEGY_GUIDELINES = `
STRATEGY: Olapete Quantitative Bot (Math-Driven + Market Regime Filter)

**CORE PHILOSOPHY:** 
Do NOT guess. Use the provided CALCULATED indicators.

1. **Market Regime Filter (CRITICAL):**
   - **ADX Indicator (14):**
     - If ADX < 20: The market is **RANGING/CHOPPY**. 
       - **ACTION:** REJECT all Trend Follow setups. ONLY accept Reversal/Bounce setups at key levels.
     - If ADX >= 20: The market is **TRENDING**.
       - **ACTION:** ACCEPT Trend Follow (Breakout/Pullback) setups.

2. **Trend Alignment (Quantitative):**
   - **Bullish:** Price > EMA(14) AND EMA(14) > EMA(34).
   - **Bearish:** Price < EMA(14) AND EMA(14) < EMA(34).

3. **RSI Momentum Filter (No Exceptions):**
   - **BUY Signal:** RSI must be between 40 and 65. (Not Overbought).
   - **SELL Signal:** RSI must be between 35 and 60. (Not Oversold).
   - **REJECT** if RSI > 70 (Overbought) or RSI < 30 (Oversold) unless trading a specific Mean Reversion strategy.

4. **Risk Management (ATR Based):**
   - **Stop Loss (SL):** Entry +/- (1.5 * ATR).
   - **Take Profit 1 (TP1):** Entry +/- (2.0 * ATR).
   - **Take Profit 2 (TP2):** Entry +/- (4.0 * ATR).
   - **Risk/Reward:** Minimum 1:1.5 required.

5. **News Filter:**
   - Use Google Search to ensure NO High-Impact news in the next 2 hours.
   
6. **Data Source Exception:**
   - If DATA SOURCE is 'SIMULATED/MOCK', treat it as valid real-time data for testing purposes. Do not reject based on 'MOCK' label.
`;

// Strategy Guidelines - Manual / Chatbot & Calculator Logic
const MANUAL_TRADING_GUIDELINES = `
STRATEGY: Advanced Discretionary & Smart Money Concepts (SMC)

1. Major FX Pairs (EUR/USD, GBP/USD, USD/JPY)
   Context: Zero-sum game manipulated by central banks.
   Best Strategy: "Session Overlap" & Liquidity Grab.
   Logic: 70-80% of volume occurs during London/NY overlap (13:00 – 17:00 GMT).
   Setup (SMC/ICT):
   - Wait for "Judas Swing" (fake-out at session open).
   - Look for Displacement (sharp reversal breaking structure).
   - Entry: Retracement to Fair Value Gap (FVG) or 62-79% Fib.
   - Target: Opposing liquidity pool.
   - Specific Advice (GBP/USD): Wait for 15-min candle close to confirm breakouts to avoid "fake-outs."

2. Gold (XAU/USD)
   Context: Currency + Commodity. Volatile based on Real Yields/Geopolitics.
   Best Strategy: Macro-Driven Supply/Demand Zones.
   Logic: Inverse relationship with US Dollar (DXY) and US 10Y Treasury Yields (Yields Drop = Gold Rally).
   Setup:
   - Trade from fresh Daily/4H Supply & Demand zones.
   - Filter: Check US 10Y Yields before entry.
   - News Fade: Wait 15 mins after high-impact news; fade spikes into resistance.
   - Risk Warning: Gold volatility is lethal. Suggest reducing risk to 0.5% (vs 1% on FX) due to slippage potential.

3. Bitcoin (BTC/USD)
   Context: Pure Momentum asset driven by Global Liquidity & Halving Cycles.
   Best Strategy: Trend Following on Weekly/Daily.
   Logic: Respects higher timeframe MAs; ignores intraday noise.
   Setup:
   - Indicator: 20-Week MA (or 21 EMA).
   - Bull Rule: Price > 20W MA = Longs only (buy Daily dips to RSI 40-45).
   - Bear Rule: Price < 20W MA = Cash/Short.
   - Breakouts: Enter immediately on volume breakouts (Wedge/Triangle); do not wait for retests.

Logic Alignment Summary:
- FX: Mean Reversion / Liquidity Grabs (Tight SL).
- Gold: Volatile Trend / Yield Correlation (Wide SL).
- Bitcoin: Extreme Momentum / Trend Following (Percentage SL).
`;

// Retry Utility
export const withRetry = async <T>(fn: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    // Retry on 429 (Rate Limit) or 500 (Server Error)
    if (retries > 0 && (error.status === 429 || error.status === 500 || error.message?.includes('429') || error.message?.includes('500') || error.status === 'RESOURCE_EXHAUSTED')) {
      console.warn(`API Error (${error.status || 'Unknown'}). Retrying in ${baseDelay}ms... (${retries} attempts left)`);
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
    // Remove markdown code blocks and whitespace
    let clean = text.replace(/```json\n?|```/g, '');
    return clean.trim();
};

export const scanForSignals = async (userPlan: PlanName, userSettings: { balance: string; risk: string; currency: string; }): Promise<any> => {
    // 1. BATCHING: Only scan a random subset of 5 instruments to avoid API Rate Limits and Context Overload (500 Error)
    const instrumentsToScan = getRandomSubset(TARGET_INSTRUMENTS, 5);
    
    console.log(`Scanning subset: ${instrumentsToScan.join(', ')}`);

    const marketContextPromises = instrumentsToScan.map(inst => fetchMarketContext(inst));
    const marketContexts = await Promise.all(marketContextPromises);
    
    // Convert context to QUANTITATIVE string for AI
    const marketDataString = marketContexts.map((ctx: MarketContext) => {
        return `
INSTRUMENT: ${ctx.instrument}
PRICE: ${ctx.currentPrice}
DATA SOURCE: ${ctx.isDataReal ? 'LIVE FEED' : 'SIMULATED/MOCK'}
INDICATORS (Calculated):
- RSI (14): ${ctx.indicators.rsi}
- ADX (14): ${ctx.indicators.adx} (Regime: ${ctx.indicators.regime})
- EMA (14): ${ctx.indicators.emaFast}
- EMA (34): ${ctx.indicators.emaSlow}
- ATR (14): ${ctx.indicators.atr}
- Trend Status: ${ctx.indicators.trend}
--------------------------------`;
    }).join('\n');

    // --- MODEL 1: QUANTITATIVE ANALYST (Olapete Bot) ---
    const patternClassifierPrompt = `You are the **Olapete Quantitative Bot**. You generate trade signals based STRICTLY on the calculated math provided.
    
    **TASK:**
    Analyze the provided **INDICATORS** for each instrument. Do NOT search for new indicators. Use the values provided in the prompt.
    
    **CRITICAL EXECUTION RULES:**
    1. **Market Regime Check (ADX):** 
       - If ADX < 20, you MUST REJECT any Trend Following trade. 
       - If ADX >= 20, Trend Following is allowed.
    2. **Indicator Confirmation:**
       - RSI must be within safe zones (40-65 for Buy, 35-60 for Sell).
       - EMAs must be aligned with the direction.
    3. **Stop Loss:** Use the provided ATR to calculate dynamic Stop Loss (Price +/- 1.5 * ATR).
    4. **Data Integrity:** Trust the "INDICATORS (Calculated)" section above all else. Treat 'SIMULATED/MOCK' data as valid.
    
    **STRATEGY LOGIC:**
    ${STRATEGY_GUIDELINES}

    **ANALYSIS RULES:**
    1.  **Select Best:** Choose the single best setup from the provided list that passes the ADX and RSI filters.
    2.  **Pass/Fail:** If NO instrument passes the strict math filters, return {"pass": false}. Do not force a trade.
    
    **MARKET DATA:**
    ${marketDataString}

    **Valid Setup JSON Schema (Example):**
    {
      "pass": true,
      "instrument": "XAU/USD",
      "type": "BUY",
      "entryPrice": 2300.50,
      "stopLoss": 2290.00,
      "takeProfit1": 2315.00,
      "takeProfit2": 2330.00,
      "pattern_score": 0.95,
      "tags": ["ADX > 20", "RSI 55", "EMA Bullish"],
      "reason_short": "Strong Trend Regime (ADX 32). Price above EMAs. RSI healthy."
    }`;

    // --- MODEL 2: RISK MANAGER & NEWS ANALYST ---
    const financialAnalystPrompt = `You are a Senior Risk Manager validating an algorithmic trade.
    
    **Task:**
    1.  Review the trade candidate.
    2.  **NEWS CHECK:** Use Google Search to find if there is High Impact News (CPI, NFP, FOMC, Rate Decision) for this instrument in the next 2 hours.
    3.  **VERDICT:** 
        - If High Impact News is imminent -> REJECT (confidence 0).
        - If the quantitative logic (ADX/RSI) holds up -> APPROVE.
    4.  Return a JSON object with your confidence assessment.
    
    **CRITICAL OUTPUT RULE:** 
    - Output ONLY valid JSON. Do not use Markdown.

    **JSON Schema:**
    {
      "confidence": 88,
      "reason": "Quantitative metrics pass (ADX > 20). No high-impact news found for next 2 hours.",
      "adjustment": { "sl_adjust_points": 0.0 }
    }`;

    try {
        const ai = getAI();
        
        // --- STEP 1: Call Quantitative Model ---
        // FIX: Use responseMimeType: 'application/json' to prevent parsing errors and 500s.
        const patternResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: GENERATION_MODEL,
            contents: `Analyze the provided quantitative market data. Current UTC time is ${new Date().toUTCString()}.`,
            config: {
                systemInstruction: patternClassifierPrompt,
                responseMimeType: 'application/json', // Force JSON
            }
        }));
        
        let patternResult;
        try {
            // Even with mimeType, sometimes it sends markdown code blocks in preview models. Clean it just in case.
            const cleanText = cleanJsonString(patternResponse.text || '');
            patternResult = JSON.parse(cleanText);
        } catch (jsonError) {
            console.warn("JSON Parse Error in Pattern Classifier:", jsonError);
            return { signalFound: false };
        }

        // --- STEP 2: Check if a setup was found ---
        if (!patternResult.pass) {
            console.log("Pattern Classifier found no valid setups passing quantitative filters (ADX/RSI).");
            return { signalFound: false };
        }
        
        const instrumentProps = instrumentDefinitions[patternResult.instrument];
        
        // --- STEP 3: Call Risk Manager Model (With Search) ---
        // NOTE: We wrap this in a dedicated try/catch. If Google Search causes a 500 error (common),
        // we shouldn't kill the whole signal. We'll fallback to the Technical Score.
        
        let analystResult = { confidence: 80, reason: "News check skipped (Service Unavailable), proceeding with technicals." };
        
        try {
            const analystContent = `Validate this trade:\n${JSON.stringify(patternResult, null, 2)}`;
            
            const analystResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: GENERATION_MODEL,
                contents: analystContent,
                config: {
                    systemInstruction: financialAnalystPrompt,
                    tools: [{ googleSearch: {} }] // Risk Manager gets Search for News
                }
            }));
            
            try {
                const cleanText = cleanJsonString(analystResponse.text || '');
                analystResult = JSON.parse(cleanText);
            } catch (e) {
                console.warn("Analyst returned malformed JSON, using fallback.");
            }
        } catch (analystError) {
            console.warn("Risk Manager (Search) failed, likely 500 or Timeout. Falling back to technicals.", analystError);
            // Fallback remains as initialized above
        }

        // --- STEP 4: Decision Layer ---
        const patternScore = (patternResult.pattern_score || 0) * 50; // 50% weight
        const analystScore = (analystResult.confidence || 0) * 0.50; // 50% weight
        
        const finalConfidence = patternScore + analystScore;
        
        // Threshold
        const ACCEPTANCE_THRESHOLD = 80; // Set to 80 per user request
        
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
        
        if (isNaN(entryPrice) || isNaN(stopLoss)) return { signalFound: false };

        const pip_step = instrumentProps ? instrumentDefinitions[patternResult.instrument].pipStep : 0.0001;
        const stop_dist_price = Math.abs(entryPrice - stopLoss);
        const stopLossInPips = stop_dist_price / pip_step;
        
        // Calculate Lot Size (Simplified)
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
        
        // --- STEP 6: Format and Return Final Signal ---
        const finalSignal = {
            signalFound: true,
            instrument: patternResult.instrument,
            type: patternResult.type,
            entryPrice: entryPrice,
            stopLoss: stopLoss,
            takeProfit1: parseFloat(patternResult.takeProfit1),
            takeProfit2: patternResult.takeProfit2 ? parseFloat(patternResult.takeProfit2) : undefined,
            confidence: parseFloat(finalConfidence.toFixed(2)),
            reasoning: `${analystResult.reason} (Tech: ${patternResult.reason_short})`,
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
  
  // Use MANUAL_TRADING_GUIDELINES specifically for the manual calculator analysis
  const systemPrompt = `You are an expert financial analyst. 
  
  STRATEGY GUIDELINES TO CONSIDER:
  ${MANUAL_TRADING_GUIDELINES}
  
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
