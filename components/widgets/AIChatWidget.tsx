
import React, { useState, useRef, useEffect } from 'react';
import Icon from '../ui/Icon';
import { DashboardView, User } from '../../types';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import SecureContent from '../ui/SecureContent';
import { useUsageTracker } from '../../hooks/useUsageTracker';
import { classifyQuery, withRetry } from '../../services/geminiService';
import { fetchMarketContext } from '../../services/marketDataService';
import { instrumentDefinitions } from '../../config/instruments';

interface AIChatbotProps {
    user: User;
    activeView: DashboardView;
    onExecuteTrade: (tradeDetails: {
        instrument: string;
        type: 'BUY' | 'SELL';
        entryPrice: number;
        stopLoss: number;
        takeProfit: number;
        confidence: number;
        reasoning: string;
    }) => void;
}

interface ChatMessage {
    id: string;
    role: "user" | "model";
    text: string;
    image?: string;
    tradeData?: {
        instrument: string;
        type: 'BUY' | 'SELL';
        entry: number;
        sl: number;
        tp: number;
    };
    isTradeExecuted?: boolean;
}

// --- NEW KNOWLEDGE BASE: DERIV SYNTHETICS ---
const DERIV_KNOWLEDGE_BASE = `
7. **DERIV SYNTHETIC INDICES EXPERTISE (SPECIALIZED DOMAIN)**
   **Core Principles:**
   - **Nature:** Simulated markets based on cryptographically secure RNG.
   - **Independence:** Unaffected by real-world news (NFP, CPI, wars). Fundamental analysis does NOT apply. Use strict Price Action & Technical Analysis.
   - **Availability:** 24/7/365.
   
   **Market Structure & Strategy Guide:**
   - **Boom & Crash (B1000, C1000, B500, C500):**
     * *Structure:* "Ticks" (slow steady) vs "Spikes" (sudden large moves). Boom spikes UP. Crash spikes DOWN.
     * *Safe Strategy (Spike Catching):* Place Buy Limits on Boom (at Support) and Sell Limits on Crash (at Resistance). Target the spike.
     * *Riskier Strategy (Tick Scalping):* Trade against the spike (Sell Boom, Buy Crash) using EMA 200 as trend filter.
   
   - **Volatility Indices (V10, V25, V75, V100):**
     * *Structure:* Constant volatility. V75 = 75% volatility.
     * *Strategy (Trend Flow):* Use Bollinger Bands + MA 50. Buy when price > MA50 & breaks Upper BB. Sell when price < MA50 & breaks Lower BB.
   
   - **Jump Indices:**
     * *Structure:* Normal volatility with random massive "Jumps" every ~20 mins.
     * *Strategy (Reversal Recovery):* Wait for Jump. If RSI < 30 (Oversold) immediately after a jump down, Buy for recovery.
   
   - **Step Index:**
     * *Structure:* Price moves in strict steps of 0.1.
     * *Strategy (Staircase Breakout):* Draw trendline connecting "steps". Wait for breakout with full candle close.

   **MANDATORY MATH RULE ($15 TARGET):**
   - The user has a strict goal: **$15 Profit** using **0.02 Lot Size**.
   - You MUST recommend Take Profit levels based on the calculated points provided in the system context.
`;

const STRATEGY_CONTEXT = `
1. Major FX Pairs (EUR/USD, GBP/USD, USD/JPY)
   Strategy: Session Overlap & Liquidity Grab (SMC)
   - Core Logic: 70–80% of daily volume occurs during the London–New York overlap.
   - Setup: Look for a "Judas Swing" (fake breakout) followed by aggressive displacement.
   - Entry: Retracement into a Fair Value Gap (FVG) or 62–79% Fibonacci zone on the M15 chart.

2. Metals (XAU/USD, XAG/USD)
   Strategy: Supply/Demand + FVG & Retest
   - Core Logic: Reacts to US Yields and Geopolitics with aggressive volatility.
   - Primary Setup (FVG): Look for aggressive displacement candles (marubozu) that create a Fair Value Gap (FVG). Enter on the wick retrace into the FVG.
   - Secondary Setup (Break & Retest): Wait for price to cleanly break a 1H/4H Supply or Demand zone. Enter ONLY on the retest of the broken zone.
   - Confirmation: M15 rejection wick or engulfing candle at the FVG or Retest level.

3. Crypto (BTC/USD, ETH/USD)
   Strategy: Momentum Breakouts & FVG Fills
   - Core Logic: Momentum-heavy assets prone to fakeouts.
   - Setup (Break & Retest): Identify consolidation patterns (Flags, Pennants). Do NOT trade the initial breakout. Enter on the retest of the pattern boundary to confirm validity.
   - Setup (FVG Continuation): In a strong trend, look for price to pull back into a 15m/1H FVG (Inefficiency) before continuing the trend.
   - Indicator: Price must be above 20 EMA (Bullish) or below (Bearish).

4. Minor FX Pairs & Crosses
   Strategy: Trend Continuation & Cross-Pair Correlation
   - Core Logic: Trade based on currency strength divergence.
   - Setup: Break and retest of key consolidation zones.

5. **Trading Analysis (Adaptive Strategy):** 
   Your expertise is comprehensive across all technical disciplines. You can fluidly apply and combine: **SMC** (Order Blocks, FVG, Liquidity, BOS, CHoCH), **Market Structure & Pullback**, **Support/Resistance**, **Trendlines**, **Candlestick Patterns** (e.g., Engulfing, Hammer), **Chart Patterns** (e.g., Head & Shoulders, Flags), and **Mean Reversion / Scalping**. Your goal is always to provide the **most effective, adaptive analysis** for any pair or timeframe to maximize profitability, based on the current chart condition. You will select the optimal concept (including Strategy A through K below) for the situation.

   **Core Strategy A: Market Structure & Pullback Trading (Best for Trend Continuation)**
   * **Concept:** Patiently wait for the price to "pull back" to a logical area of support or resistance in an established trend. This approach relies on momentum continuation.
   * **Execution:**
     1. **Identify Trend:** Confirm a clear trend on a Daily or 4-Hour chart.
     2. **Identify Key Level:** Find a clear old **resistance turned new support** (or vice versa), or a strong Moving Average (like the 50-day EMA).
     3. **Entry:** Wait for the price to test this level and show a clear sign of rejection (e.g., a bullish engulfing or hammer candle).
     4. **Risk Management:** Place a tight **Stop-Loss** just outside the key level. Target a **Take-Profit** at a 1:2 or 1:3 Risk/Reward ratio.

${DERIV_KNOWLEDGE_BASE}
`;

// Updated System Prompt to prioritize Injected Data for Synthetics
const systemPrompt = `You are "Olapete" - a highly knowledgeable trading and support expert. 

**CORE OBJECTIVE:**
Provide precise, live trade setups.

**CRITICAL DATA HANDLING:**

1. **LIVE API DATA (Injected):**
   - If you receive [LIVE MARKET DATA INJECTION] with "Data Source: LIVE API" or "Deriv WS":
     - **TRUST THIS PRICE & STRUCTURE IMPLICITLY.**
     - **Synthetic Indices:** The "Details" field contains the live structure (Trend, SMA, Range) fetched from the API. **Do NOT** attempt to Search for this. Use the provided details to form your bias.
     - **Forex/Crypto:** Use the injected price for Entry. You may use \`googleSearch\` (if enabled) to validate macro news/sentiment, but priority goes to the live price.

2. **MOCK/FALLBACK DATA:**
   - If "Data Source: MOCK/FALLBACK":
     - You **MUST** use \`googleSearch\` (if enabled) to find the actual price and structure.

**CRITICAL INSTRUCTION FOR ANALYSIS:**

1. **IF USER PROVIDES AN IMAGE:**
   - Analyze the chart image directly for Price Action, Trends, and Key Levels.
   - Generate the setup based on what you SEE in the image.

2. **IF USER DOES NOT PROVIDE AN IMAGE (TEXT ONLY):**
   - **Synthetics:** Analyze the [LIVE MARKET DATA INJECTION] Details (Trend, SMA, Highs/Lows) to determine the setup. Utilize the **DERIV SYNTHETIC INDICES EXPERTISE** section.
   - **Forex/Crypto:** Synthesize the Injected Price + Search Results (News/Levels).
   - **DECISION:**
     - If Price is at Support + Bullish Structure -> BUY.
     - If Price is at Resistance + Bearish Structure -> SELL.
     - If uncertain -> "No clear setup".

${STRATEGY_CONTEXT}

## CORE INSTRUCTIONS:

1.  **Analyze based on the Instrument:**
    - If user asks about XAUUSD, check current US Yields/News via Search.
    - If user asks about Synthetic Indices (e.g. Volatility 75, Boom 1000), refer to the **DERIV EXPERTISE** section. **DO NOT** use Google Search for Synthetics as they are simulated.

2.  **Trade Setup Format (Strict):**
    When providing a trade, use this format:
    **TRADE SETUP**
    -   Instrument: [Name]
    -   Action: [BUY/SELL]
    -   Entry: [Price] (Must be close to Current Live Price)
    -   Stop Loss (SL): [Price]
    -   Take Profit (TP): [Price] (If Synthetic, verify it meets the $15 profit target rule).
    **Reasoning:** [Reason based on Strategy Guide, Injected Trend, or Image Analysis]

3.  **Communication:**
    -   Be "Very Sure". No wishy-washy language.
    -   If market conditions are unclear from Search/Injection, say "No clear setup found currently".
    -   For Synthetics, explicitly mention you are analyzing "Live Deriv Market Structure".

4.  **Disclaimer:**
    -   Include a brief disclaimer for financial advice.
`;


const AIChatbot: React.FC<AIChatbotProps> = ({ user, activeView, onExecuteTrade }) => {
    const { canUseFeature, incrementUsage, getUsageInfo } = useUsageTracker(user);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatHistoryRef = useRef<any[]>([]);
    
    const chartAnalysisUsage = getUsageInfo('chartAnalysis');
    const inDepthAnalysisUsage = getUsageInfo('inDepthAnalysis');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
       if (isOpen) {
        scrollToBottom();
       }
    }, [messages, isOpen]);
    
    useEffect(() => {
        const welcomeMessage = {
            id: 'welcome',
            role: 'model' as const,
            text: `Welcome! I'm Olapete, your Trade Support Bot. I can analyze the market for you. Upload a chart for precise analysis, or ask me for a setup and I'll scan the market.`
        };
        // We display the welcome message in the UI state
        setMessages([welcomeMessage]);
        
        // FIX: We do NOT add the model's welcome message to the API history.
        // The API requires the conversation to generally start with a USER message to avoid 500 errors.
        chatHistoryRef.current = [];
    }, []);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = (e.target?.result as string)?.split(',')[1];
            if (base64) {
                setUploadedImage({ base64, mimeType: file.type, name: file.name });
            }
        };
        reader.readAsDataURL(file);
    };

    const clearImage = () => setUploadedImage(null);

    const parseTradeData = (text: string) => {
        // Regex to extract parameters more robustly
        const instrumentMatch = text.match(/Instrument:\s*([A-Z0-9\/\.\s_]+)/i);
        const actionMatch = text.match(/Action:\s*(BUY|SELL)/i);
        const entryMatch = text.match(/Entry:\s*([\d\.]+)/i);
        const slMatch = text.match(/Stop Loss.*:\s*([\d\.]+)/i);
        const tpMatch = text.match(/Take Profit.*:\s*([\d\.]+)/i);

        if (instrumentMatch && actionMatch && entryMatch && slMatch && tpMatch) {
            return {
                instrument: instrumentMatch[1].trim(),
                type: actionMatch[1].toUpperCase() as 'BUY' | 'SELL',
                entry: parseFloat(entryMatch[1]),
                sl: parseFloat(slMatch[1]),
                tp: parseFloat(tpMatch[1]),
            };
        }
        return undefined;
    };

    const handleExecuteClick = (msgId: string, tradeData: any) => {
        onExecuteTrade({
            instrument: tradeData.instrument,
            type: tradeData.type,
            entryPrice: tradeData.entry,
            stopLoss: tradeData.sl,
            takeProfit: tradeData.tp,
            confidence: 85, // Default confidence for AI chat signals
            reasoning: "Generated via AI Chat Analysis"
        });

        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isTradeExecuted: true } : m));
    };

    // Helper to find instrument in query to fetch live data
    const findInstrumentInQuery = (text: string): string | null => {
        const lowerText = text.toLowerCase();
        
        // Check aliases first
        const aliases: {[key: string]: string} = {
            'gold': 'XAU/USD', 'xau': 'XAU/USD',
            'silver': 'XAG/USD', 'xag': 'XAG/USD',
            'btc': 'BTC/USD', 'bitcoin': 'BTC/USD',
            'eth': 'ETH/USD', 'ethereum': 'ETH/USD',
            'eu': 'EUR/USD', 'gu': 'GBP/USD',
            'uj': 'USD/JPY', 'gj': 'GBP/JPY',
            'nasdaq': 'NASDAQ', 'us30': 'US30',
            
            // Synthetics Aliases (Expanded for better detection)
            'v75': 'Volatility 75 Index', 
            'vol 75': 'Volatility 75 Index',
            'volatility 75': 'Volatility 75 Index',
            'v 75': 'Volatility 75 Index',
            
            'v10': 'Volatility 10 Index', 
            'vol 10': 'Volatility 10 Index',
            'volatility 10': 'Volatility 10 Index',
            
            'v100': 'Volatility 100 Index', 
            'vol 100': 'Volatility 100 Index',
            'volatility 100': 'Volatility 100 Index',
            
            'c500': 'Crash 500 Index', 
            'crash 500': 'Crash 500 Index',
            'c1000': 'Crash 1000 Index', 
            'crash 1000': 'Crash 1000 Index',
            
            'b500': 'Boom 500 Index', 
            'boom 500': 'Boom 500 Index',
            'b1000': 'Boom 1000 Index', 
            'boom 1000': 'Boom 1000 Index',
            
            'j25': 'Jump 25 Index', 
            'jump 25': 'Jump 25 Index',
        };
        
        for (const [alias, canonical] of Object.entries(aliases)) {
            if (lowerText.includes(alias)) return canonical;
        }

        // Check defined instruments
        const instruments = Object.keys(instrumentDefinitions);
        for (const inst of instruments) {
             const cleanInst = inst.toLowerCase();
             const noSlash = cleanInst.replace('/', '');
             // Ensure strict partial match against the full name in query if not aliased
             if (lowerText.includes(cleanInst) || lowerText.includes(noSlash)) {
                 return inst;
             }
        }
        return null;
    };

    // --- ALGORITHMIC MATH FOR SYNTHETICS ---
    const calculateDerivTarget = (instrument: string, targetUsd = 15, lotSize = 0.02) => {
        const def = instrumentDefinitions[instrument];
        if (!def) return null;
        
        // Formula: Profit = PointsMoved * LotSize * ContractSize
        // Therefore: PointsMoved = Profit / (LotSize * ContractSize)
        
        // Ensure contract size isn't zero
        const size = def.contractSize || 1; 
        const requiredPoints = targetUsd / (lotSize * size);
        
        return requiredPoints;
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((userInput.trim() === '' && !uploadedImage) || isLoading) return;

        // --- Setup for the whole process ---
        const userQuery = userInput;
        const imageToProcess = uploadedImage;

        // Display user message immediately
        const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: userQuery };
        if (imageToProcess) {
            userMessage.image = `data:${imageToProcess.mimeType};base64,${imageToProcess.base64}`;
        }
        setMessages(prev => [...prev, userMessage]);
        
        // Clear inputs
        setUserInput('');
        setUploadedImage(null);
        setIsLoading(true);
        
        try {
            const API_KEY = process.env.API_KEY;
            if (!API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: API_KEY });

            let isPaidFeature = false;
            let analysisType: 'chartAnalysis' | 'inDepthAnalysis' | null = null;
            
            // --- Classification & Usage Check ---
            if (imageToProcess) {
                isPaidFeature = true;
                analysisType = 'chartAnalysis';
            } else if (userQuery.trim()) {
                const queryType = await classifyQuery(userQuery.trim());
                if (queryType === 'IN_DEPTH_ANALYSIS') {
                    isPaidFeature = true;
                    analysisType = 'inDepthAnalysis';
                }
            }

            if (isPaidFeature && analysisType) {
                if (!canUseFeature(analysisType)) {
                    const featureName = analysisType === 'chartAnalysis' ? 'Chart Analysis' : 'Trade Setup Request';
                    const limitMessage = `You've reached your daily limit for ${featureName}. This is a premium feature used for live market scanning and trade setups. General support questions are always free.`;
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: limitMessage }]);
                    setIsLoading(false); // Ensure loading state is reset
                    return; // Stop execution
                }
                // If usage is allowed, increment it
                incrementUsage(analysisType);
            }

            // --- LIVE DATA INJECTION LOGIC ---
            let liveContextMsg = "";
            let useGoogleSearch = true; // Default to true

            const detectedInst = findInstrumentInQuery(userQuery);
            
            if (detectedInst && !imageToProcess) {
                // Only inject for text queries.
                try {
                    const marketData = await fetchMarketContext(detectedInst);
                    const isReal = marketData.isDataReal;
                    const isDeriv = instrumentDefinitions[detectedInst]?.isDeriv;
                    
                    let mathInjection = "";
                    if (isDeriv) {
                        useGoogleSearch = false; // Disable search for Synthetics to prevent 500 errors (unindexed data)
                        
                        // Calculate specific profit target points
                        const requiredPoints = calculateDerivTarget(detectedInst);
                        if (requiredPoints) {
                            mathInjection = `
\n[ALGORITHMIC MATH INJECTION]
Target: $15 Profit @ 0.02 Lot Size.
Required Price Movement: ${requiredPoints.toFixed(2)} Points.
Formula: Profit / (Lot * ContractSize).
INSTRUCTION: You MUST use this calculated distance for Take Profit levels.`;
                        }
                    }

                    liveContextMsg = `
\n\n*** [LIVE MARKET DATA INJECTION] ***
Instrument: ${marketData.instrument}
Current Price: ${marketData.currentPrice}
Data Source: ${isReal ? (isDeriv ? 'LIVE API (Deriv WS)' : 'LIVE API') : 'FALLBACK/MOCK'}
${marketData.details ? `Details (Market Structure): ${marketData.details}` : ''}
${mathInjection}

INSTRUCTION:
1. **SOURCE CHECK:**
   - If Source is "LIVE API (Deriv WS)": TRUST this structure details implicitly. Do NOT use search.
   - If Source is "FALLBACK/MOCK": You MUST use \`googleSearch\` to find the *actual* price/structure.
2. **VERIFY (Forex/Crypto):** Compare the "Provided Price" with search results if needed.
3. **ANALYZE:** Look for technical breakouts based on the Trend/Price provided.
4. **OUTPUT:** Generate the trade setup based on this synthesized real-time info.
*** END DATA ***`;
                } catch (err) {
                    console.error("Error fetching live context for chat:", err);
                }
            }

            // --- Main Gemini Call ---
            const contextString = `\n\n[CONTEXT: User: ${user.name}, Page: '${activeView}', Time: ${new Date().toLocaleString()}]` + liveContextMsg;

            const userParts: any[] = [{ text: userQuery + contextString }];
            if (imageToProcess) {
                userParts.push({ inlineData: { mimeType: imageToProcess.mimeType, data: imageToProcess.base64 } });
            }
            
            chatHistoryRef.current.push({ role: 'user', parts: userParts });
            
            // Conditionally enable Google Search only if it's NOT a synthetic index (to avoid errors)
            const tools = useGoogleSearch ? [{ googleSearch: {} }] : undefined;

            const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: chatHistoryRef.current,
                config: {
                    systemInstruction: systemPrompt,
                    tools: tools
                }
            }));

            const modelResponseText = response.text || "I couldn't generate a response.";
            chatHistoryRef.current.push({ role: 'model', parts: [{ text: modelResponseText }] });
            
            // Parse for trade data
            const tradeData = parseTradeData(modelResponseText);

            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                role: 'model', 
                text: modelResponseText,
                tradeData: tradeData 
            }]);

        } catch (error: any) {
            console.error("Error with AI support chat:", error);
            let errorMessage = "I'm sorry, I'm having trouble connecting right now. Please try again later.";
            // Specific handling for Quota Exceeded
            if (error.status === 429 || error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED') {
                errorMessage = "I'm currently experiencing very high traffic (Quota Limit). Please wait a minute and try again.";
            }
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-5 right-5 bg-primary hover:bg-primary-hover text-white rounded-full p-4 shadow-lg z-50 transition-transform transform hover:scale-110"
                aria-label="Open AI Chat"
            >
                <Icon name="robot" className="w-7 h-7" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-5 right-5 w-96 h-[70vh] min-h-[400px] flex flex-col glassmorphism rounded-xl shadow-2xl z-50 border border-light-gray">
            <div className="flex justify-between items-center p-4 bg-light-hover rounded-t-xl">
                <h3 className="font-bold text-lg text-primary">Trade Companion AI</h3>
                <button onClick={() => setIsOpen(false)} className="text-mid-text hover:text-dark-text">
                    <Icon name="close" className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-xs rounded-xl shadow ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-light-surface border border-light-gray'}`}>
                           {msg.role === 'model' ? (
                                <SecureContent>
                                    <div className="px-4 py-2">
                                        <p className="font-semibold text-primary text-sm">Olapete</p>
                                        {msg.image && <img src={msg.image} alt="model upload" className="rounded-md my-2 max-w-full" />}
                                        <div className="text-sm whitespace-pre-wrap text-dark-text" dangerouslySetInnerHTML={{ __html: msg.text }}></div>
                                    </div>
                                </SecureContent>
                            ) : (
                                <div className="px-4 py-2">
                                    {msg.image && <img src={msg.image} alt="user upload" className="rounded-md my-2 max-w-full" />}
                                    <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text }}></div>
                                </div>
                            )}
                        </div>
                        
                        {/* Trade Execution Button */}
                        {msg.role === 'model' && msg.tradeData && (
                            <div className="mt-2 animate-fade-in-right">
                                <button 
                                    onClick={() => handleExecuteClick(msg.id, msg.tradeData)}
                                    disabled={msg.isTradeExecuted}
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all ${
                                        msg.isTradeExecuted 
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                        : 'bg-success text-white hover:bg-green-600 hover:scale-105'
                                    }`}
                                >
                                    {msg.isTradeExecuted ? (
                                        <>
                                            <Icon name="check" className="w-4 h-4 mr-2" />
                                            Trade Executed
                                        </>
                                    ) : (
                                        <>
                                            ⚡ Trade {msg.tradeData.instrument} {msg.tradeData.type}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-light-surface px-4 py-2 rounded-xl flex items-center space-x-1 shadow border border-light-gray">
                           <span className="w-2 h-2 bg-mid-text rounded-full animate-pulse delay-75"></span>
                           <span className="w-2 h-2 bg-mid-text rounded-full animate-pulse delay-150"></span>
                           <span className="w-2 h-2 bg-mid-text rounded-full animate-pulse delay-300"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-light-gray">
                 <div className="text-xs text-mid-text flex justify-around mb-2">
                    <span>Chart Analysis: <strong className="text-dark-text">{chartAnalysisUsage.count}/{chartAnalysisUsage.limit}</strong></span>
                    <span>Trade Setups: <strong className="text-dark-text">{inDepthAnalysisUsage.count}/{inDepthAnalysisUsage.limit}</strong></span>
                </div>
                {uploadedImage && (
                    <div className="text-xs text-mid-text bg-light-hover p-2 rounded-md mb-2 flex justify-between items-center">
                        <span>Chart ready: {uploadedImage.name}</span>
                        <button onClick={clearImage} className="text-danger hover:text-red-700 font-bold">X</button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center bg-light-hover rounded-lg border border-light-gray">
                    <label htmlFor="chart-upload" className="p-3 text-mid-text hover:text-primary cursor-pointer">
                        <Icon name="paperclip" className="w-6 h-6" />
                        <input type="file" id="chart-upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Ask Olapete..."
                        className="flex-1 bg-transparent p-3 focus:outline-none text-dark-text"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || (!userInput && !uploadedImage)} className="p-3 text-primary disabled:text-light-gray hover:text-primary-hover transition-colors">
                        <Icon name="send" className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChatbot;
