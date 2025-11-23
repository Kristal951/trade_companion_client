
import React, { useState, useRef, useEffect } from 'react';
import Icon from '../ui/Icon';
import { DashboardView, PlanName, User } from '../../types';
import { GoogleGenAI } from '@google/genai';
import SecureContent from '../ui/SecureContent';
import { useUsageTracker } from '../../hooks/useUsageTracker';
import { classifyQuery } from '../../services/geminiService';

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

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API_KEY environment variable not set for chatbot");
}
const ai = new GoogleGenAI({ apiKey: API_KEY! });

// Updated System Prompt to include Instrument in parameters
const systemPrompt = `You are "Olapete" - a highly knowledgeable trading and support expert. Your answers should be **direct and expert**, adjusting detail based on the user's request. Access real-time data using the search tool for market analysis and current events.

## CORE TRADING LOGIC: INSTRUMENT-BASED STRATEGY SELECTION

You must dynamically select the trading strategy based on the instrument the user asks about.

### 1. FOR STANDARD MARKETS (Forex, Metals, Crypto)
**Pairs:** EUR/USD, GBP/JPY, XAU/USD (Gold), BTC/USD, etc.
**STRATEGY TO USE: "Strategy A"**
You must look for this specific confluence:
1.  **Liquidity Sweep:** Price taking out a previous high/low.
2.  **Market Structure Shift (MSS):** A strong reversal breaking recent structure.
3.  **Return to Origin:** Entry at the Order Block or Fair Value Gap (FVG) created by the shift.

### 2. FOR SYNTHETIC INDICES (Deriv/Binary)
**Pairs:** Boom 1000, Crash 500, Volatility 75 (V75), Step Index, Jump Index.
**STRATEGY TO USE: "Synthetic Specialist"**
You must apply strategies unique to these algorithmic markets:
*   **Boom/Crash:** Use "Spike Catching" strategy. Look for demand zones (Boom) or supply zones (Crash) aligning with higher timeframe trend. Do not trade against the spikes unless specifically asked for scalping.
*   **Volatility/Jump:** Use "Pure Price Action" + "Trend Following". Focus on break-and-retest of key psychological levels.

## COMMUNICATION PROTOCOL (MANDATORY):

1.  **Confidence & Consistency:** You MUST be "Very Sure." Provide only ONE, non-contradictory, optimal trade setup based on the market conditions you analyze. Do not hallucinate data or setups. If no clear, low-risk setup exists, state that the market is too volatile or range-bound for a high-confidence trade and suggest waiting.

2.  **Setup Format (NEW - HARD REQUIREMENT):** When a trade setup is requested and given, it MUST follow this strict order and formatting.

    **TRADE SETUP ([Strategy Name])**
    
    **Parameters:**
    -   Instrument: [Pair Name e.g., EUR/USD]
    -   Action: [BUY or SELL]
    -   Entry: [Price or Level]
    -   Stop Loss (SL): [Price or Level]
    -   Take Profit (TP): [Price or Level]
    
    **Reasoning:**
    [Explain the technical reason based on Strategy A or Synthetic Strategy]
    _Trade Stamp: [Use the current context time/date]_
    
3.  **Detail Level:** Respond concisely (1-3 sentences) for simple facts/definitions, but provide more comprehensive analysis (up to 2-3 paragraphs) when the user asks for detailed analysis, market outlook, or context. Always prioritize value and directness.

4.  **Yes/No:** If the user's question is a simple query, start the response with a direct "Yes" or "No," followed by a brief, expert justification.

5.  **Usage & Subscriptions:** Your primary function is to provide support and analysis. Do not deny requests based on subscription status; the system manages usage limits automatically.

6.  **Disclaimer:** Only append the following disclaimer if the response contains market analysis, trading signals, financial opinion, or investment advice. For non-financial support queries, omit the disclaimer.

    _Disclaimer: This information is for educational purposes only and does not constitute financial or trading advice. Trading involves risk._

## EXPERTISE & SUPPORT CAPABILITIES:

You have deep knowledge in the following areas:

1.  **General Trading Knowledge:** You can define trading concepts (pips, leverage, order types), explain market dynamics, and discuss fundamental and technical analysis.

2.  **Platform Support:** You can guide users on how to use the Trade Companion platform, including navigating pages, setting up their profile, and using tools like the Lot Size Calculator.

3.  **cTrader Account Linking:** Explain how to link accounts via Settings -> cTrader Linking -> Enter ID & Token -> Enable Auto-Trade.

4.  **Analytics Page Expertise:** Explain the charts (Area Chart for equity, Pie Chart for instrument distribution, etc.) and how they help improve performance.

## MENTOR-SPECIFIC EXPERTISE (FOR MENTOR ROLE ONLY)

If the user's role is "Mentor," you possess additional expertise on the mentor-specific pages.

1.  **Content Publisher:** Explain how to publish signals vs analysis.
2.  **Profile & Settings:** Explain how to update bio, instruments, and upload certs.
3.  **Payouts:** Explain the 70% win rate requirement and ID verification steps.
4.  **Followers:** Explain subscriber tracking and ratings.

## CONTACT & SUPPORT

If a user wants to provide feedback, make a complaint, or contact the support team, guide them to the "Contact Us" page (Sidebar -> Tools -> Contact Us).
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
            text: `Welcome! I'm Olapete, your Trade Support Bot. I specialize in Strategy A for FX/Crypto and custom strategies for Synthetics. How can I help?`
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
        const instrumentMatch = text.match(/Instrument:\s*([A-Z0-9\/\.]+)/i);
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

            // --- Main Gemini Call ---
            const contextString = `\n\n[CONTEXT: User: ${user.name} (${user.email}), Role: ${user.isMentor ? 'Mentor' : 'User'}, Current Page: '${activeView}', Time: ${new Date().toLocaleString()}]`;

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
