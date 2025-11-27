
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

const STRATEGY_CONTEXT = `
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

4. Synthetic Indices (Deriv: Volatility, Crash, Boom)
   Strategy: Algorithmic Price Action & Spike Catching
   - **CRITICAL**: Real-time structure is provided via "Details" injection. Do NOT use Google Search for price.
   - Volatility Indices (V75, V10): Respects support/resistance strictly. Trend following on M15/H1.
   - Crash (500/1000): "Crash" implies sharp drops. Trend trading: Sell the trend. Reversal: Buy ONLY on confirmed structure shift.
   - Boom (500/1000): "Boom" implies sharp spikes UP. Trend trading: Buy the trend.

5. **Trading Analysis (Adaptive Strategy):** 
   Your expertise is comprehensive across all technical disciplines. You can fluidly apply and combine: **SMC** (Order Blocks, FVG, Liquidity, BOS, CHoCH), **Market Structure & Pullback**, **Support/Resistance**, **Trendlines**, **Candlestick Patterns** (e.g., Engulfing, Hammer), **Chart Patterns** (e.g., Head & Shoulders, Flags), and **Mean Reversion / Scalping**. Your goal is always to provide the **most effective, adaptive analysis** for any pair or timeframe to maximize profitability, based on the current chart condition. You will select the optimal concept (including Strategy A through K below) for the situation.
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
   - **Synthetics:** Analyze the [LIVE MARKET DATA INJECTION] Details (Trend, SMA, Highs/Lows) to determine the setup.
   - **Forex/Crypto:** Synthesize the Injected Price + Search Results (News/Levels).
   - **DECISION:**
     - If Price is at Support + Bullish Structure -> BUY.
     - If Price is at Resistance + Bearish Structure -> SELL.
     - If uncertain -> "No clear setup".

${STRATEGY_CONTEXT}

## CORE INSTRUCTIONS:

1.  **Analyze based on the Instrument:**
    - If user asks about XAUUSD, check current US Yields/News via Search.
    - If user asks about Synthetic Indices (e.g. Volatility 75), rely ONLY on the injected Trend details.

2.  **Trade Setup Format (Strict):**
    When providing a trade, use this format:
    **TRADE SETUP**
    -   Instrument: [Name]
    -   Action: [BUY/SELL]
    -   Entry: [Price] (Must be close to Current Live Price)
    -   Stop Loss (SL): [Price]
    -   Take Profit (TP): [Price]
    **Reasoning:** [Reason based on Search Results, Injected Trend, or Image Analysis]

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
                    
                    if (isDeriv) {
                        useGoogleSearch = false; // Disable search for Synthetics to prevent 500 errors (unindexed data)
                    }

                    liveContextMsg = `
\n\n*** [LIVE MARKET DATA INJECTION] ***
Instrument: ${marketData.instrument}
Current Price: ${marketData.currentPrice}
Data Source: ${isReal ? (isDeriv ? 'LIVE API (Deriv WS)' : 'LIVE API') : 'FALLBACK/MOCK'}
${marketData.details ? `Details (Market Structure): ${marketData.details}` : ''}

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
