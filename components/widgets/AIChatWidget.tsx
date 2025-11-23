
import React, { useState, useRef, useEffect } from 'react';
import Icon from '../ui/Icon';
import { DashboardView, User } from '../../types';
import { GoogleGenAI } from '@google/genai';
import SecureContent from '../ui/SecureContent';
import { useUsageTracker } from '../../hooks/useUsageTracker';
import { classifyQuery } from '../../services/geminiService';
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
   Strategy: Session Overlap & Liquidity Grab (SMC)
   - Core Logic: 70–80% of daily volume occurs during the London–New York overlap.
   - Setup: Look for a "Judas Swing" (fake breakout) followed by aggressive displacement.
   - Entry: Retracement into a Fair Value Gap (FVG) or 62–79% Fibonacci zone on the M15 chart.

2. Metals (XAU/USD, XAG/USD)
   Strategy: Macro-Driven Supply & Demand Zoning
   - Core Logic: Reacts to US Yields and Geopolitics.
   - Setup: Price approaching a fresh 4H/Daily Supply or Demand zone.
   - Confirmation: M15 rejection wick or engulfing candle at the zone.

3. Crypto (BTC/USD, ETH/USD)
   Strategy: Trend Following & Breakout
   - Core Logic: Momentum-heavy assets.
   - Setup: Price above 20-period Moving Average (Bullish) or below (Bearish).
   - Entry: Breakout of consolidation patterns (Flags, Pennants) on M15/H1.

4. Boom & Crash Indices (Synthetics)
   Strategy A: 'Spike Catching' (Sniper)
   - Direction: Buy Boom, Sell Crash.
   - Setup: Price touching a previous spike zone + RSI extreme.
   Strategy B: 'Tick Scalping'
   - Direction: Sell Boom, Buy Crash (Trend following only).

5. Volatility Indices (V75, V100)
   Strategy: Market Structure Shifts (MSS)
   - Setup: Break of Market Structure (BMS) on M15.
   - Entry: Retest of the Order Block that caused the break.

6. Jump Indices & Minor FX
   Strategy: Gap Recovery & Cross-Pair Strength
   - Setup: Fade huge gaps (Jump) or trade major strength divergence (Minors).
`;

// Updated System Prompt to include Instrument in parameters and Data Priority instructions
const systemPrompt = `You are "Olapete" - a highly knowledgeable trading and support expert. Your answers should be **direct and expert**.

**CRITICAL INSTRUCTION ON MARKET DATA:**
- You will often receive **[LIVE MARKET DATA INJECTION]** in the user's message.
- You **MUST** prioritize this injected data (Current Price, Trend, Candles) over any external information found via Google Search or your internal knowledge.
- Google Search results for "current price" are often outdated. **Trust the injected data implicitly** for defining Entry, Stop Loss, and Take Profit levels.
- Use Google Search ONLY for finding news, fundamental events, or sentiment analysis.

${STRATEGY_CONTEXT}

## CORE INSTRUCTIONS:

1.  **Analyze based on the Instrument:**
    - If user asks about XAUUSD or XAGUSD, check US Yields and Supply/Demand zones.
    - If user asks about EURUSD, look for Liquidity Grabs and Session times.
    - If user asks about Boom/Crash, look for Spikes and Zones.

2.  **Trade Setup Format (Strict):**
    When providing a trade, use this format:
    **TRADE SETUP**
    -   Instrument: [Name]
    -   Action: [BUY/SELL]
    -   Entry: [Price]
    -   Stop Loss (SL): [Price]
    -   Take Profit (TP): [Price]
    **Reasoning:** [Brief strategy-based reason]

3.  **Communication:**
    -   Be "Very Sure". No wishy-washy language.
    -   If market conditions are bad, say "No clear setup".
    -   For general questions, be concise.

4.  **Platform Support:**
    -   Guide users to "Settings" for cTrader linking.
    -   Explain features like Lot Size Calculator.

5.  **Disclaimer:**
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
            text: `Welcome! I'm Olapete, your Trade Support Bot. I can analyze Majors, Minors, Crypto, Metals, and Synthetics using our proven strategies. How can I help?`
        };
        setMessages([welcomeMessage]);
        chatHistoryRef.current = [{ role: "model", parts: [{ text: welcomeMessage.text }] }];
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
        const instrumentMatch = text.match(/Instrument:\s*([A-Z0-9\/\.\s]+)/i);
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
            'v75': 'Volatility 75', 'boom': 'Boom 1000', 'crash': 'Crash 1000'
        };
        
        for (const [alias, canonical] of Object.entries(aliases)) {
            if (lowerText.includes(alias)) return canonical;
        }

        // Check defined instruments
        const instruments = Object.keys(instrumentDefinitions);
        for (const inst of instruments) {
             const cleanInst = inst.toLowerCase();
             const noSlash = cleanInst.replace('/', '');
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
            const detectedInst = findInstrumentInQuery(userQuery);
            
            if (detectedInst && !imageToProcess) {
                // Only inject for text queries to prevent conflict with chart image interpretation
                try {
                    const marketData = await fetchMarketContext(detectedInst);
                    liveContextMsg = `
\n\n*** [LIVE MARKET DATA INJECTION] ***
Instrument: ${marketData.instrument}
Current Live Price: ${marketData.currentPrice}
Current Trend (M15): ${marketData.trend}
Recent Candle History (Last 5 M15): ${JSON.stringify(marketData.candles)}
TIMESTAMP: ${new Date().toISOString()}
INSTRUCTION: You MUST use the 'Current Live Price' provided above for calculating Entry, Stop Loss, and Take Profit. Do NOT use old data from search results.
*** END DATA ***`;
                } catch (err) {
                    console.error("Error fetching live context for chat:", err);
                }
            }

            // --- Main Gemini Call ---
            const contextString = `\n\n[CONTEXT: User: ${user.name} (${user.email}), Role: ${user.isMentor ? 'Mentor' : 'User'}, Current Page: '${activeView}', Time: ${new Date().toLocaleString()}]` + liveContextMsg;

            const userParts: any[] = [{ text: userQuery + contextString }];
            if (imageToProcess) {
                userParts.push({ inlineData: { mimeType: imageToProcess.mimeType, data: imageToProcess.base64 } });
            }
            
            chatHistoryRef.current.push({ role: 'user', parts: userParts });
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: chatHistoryRef.current,
                config: {
                    systemInstruction: systemPrompt,
                    tools: [{ googleSearch: {} }]
                }
            });

            const modelResponseText = response.text;
            chatHistoryRef.current.push({ role: 'model', parts: [{ text: modelResponseText }] });
            
            // Parse for trade data
            const tradeData = parseTradeData(modelResponseText);

            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                role: 'model', 
                text: modelResponseText,
                tradeData: tradeData 
            }]);

        } catch (error) {
            console.error("Error with AI support chat:", error);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
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
                <Icon name="chat" className="w-7 h-7" />
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
