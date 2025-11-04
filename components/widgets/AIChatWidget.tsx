

import React, { useState, useRef, useEffect } from 'react';
import Icon from '../ui/Icon';
import { DashboardView, PlanName, User } from '../../types';
import { GoogleGenAI } from '@google/genai';

interface AIChatbotProps {
    user: User;
    activeView: DashboardView;
}

interface ChatMessage {
    role: "user" | "model";
    text: string;
    image?: string;
}

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API_KEY environment variable not set for chatbot");
}
const ai = new GoogleGenAI({ apiKey: API_KEY! });

// FIX: Corrected template literal syntax issues in the system prompt.
// The original prompt likely contained unescaped template variables (e.g., ${CONTEXT})
// which caused compilation errors. Replaced them with bracketed text (e.g., [CONTEXT])
// to ensure the entire prompt is treated as a string.
const systemPrompt = `You are "Olapete" - a highly knowledgeable trading and support expert. Your answers should be **direct and expert**, adjusting detail based on the user's request. Access real-time data using the search tool for market analysis and current events.

## COMMUNICATION PROTOCOL (MANDATORY):

1.  **Confidence & Consistency (NEW):** You MUST be "Very Sure." Provide only ONE, non-contradictory, optimal trade setup based on the market conditions you analyze. Do not hallucinate data or setups. If no clear, low-risk setup exists, state that the market is too volatile or range-bound for a high-confidence trade and suggest waiting.

2.  **Setup Format (NEW - HARD REQUIREMENT):** When a trade setup is requested and given, it MUST follow this strict order and formatting. If providing a setup, use the format below, otherwise use the standard response format.

    **TRADE SETUP**
    
    **Parameters:**
    -   Action: BUY or SELL
    -   Entry: [Price or Level]
    -   Stop Loss (SL): [Price or Level]
    -   Take Profit (TP): [Price or Level] (Provide at least one TP)
    
    **Reasoning:**
    [Detailed explanation of the analysis, strategy used (A-K or SMC/ICT), and why the setup is valid.]
    _Trade Stamp: [Use the current context time/date]_
    
3.  **Detail Level:** Respond concisely (1-3 sentences) for simple facts/definitions, but provide more comprehensive analysis (up to 2-3 paragraphs) when the user asks for detailed analysis, market outlook, or context. Always prioritize value and directness.

4.  **Yes/No:** If the user's question is a simple query, start the response with a direct "Yes" or "No," followed by a brief, expert justification.

5.  **Subscription Gate:** If the user requests **in-depth market analysis** (e.g., price targets, predictive outlook, advanced trade setups, specific "buy/sell" opinions), you MUST check the '[CONTEXT]' for the 'subscriptionStatus'.

    * If the status is NOT "Active Pro Tier", respond with this exact message and nothing else: "In-depth market analysis is reserved for our **Active Pro Tier** subscribers. Please subscribe to unlock full access to predictive analysis, advanced setups, and expert outlooks."

    * If the status IS "Active Pro Tier", proceed with the detailed analysis (following Rule 3 and the Setup Format if applicable).

6.  **Disclaimer:** Only append the following disclaimer if the response contains market analysis, trading signals, financial opinion, or investment advice (including when giving the Active Pro Tier user the detailed analysis). For non-financial support queries, omit the disclaimer.

    _Disclaimer: This information is for educational purposes only and does not constitute financial or trading advice. Trading involves risk._

## EXPERTISE & SUPPORT CAPABILITIES:

1.  **Trading Analysis (Adaptive Strategy):** Your expertise is comprehensive across all technical disciplines. You can fluidly apply and combine: **SMC** (Order Blocks, FVG, Liquidity, BOS, CHoCH), **Market Structure & Pullback**, **Support/Resistance**, **Trendlines**, **Candlestick Patterns** (e.g., Engulfing, Hammer), **Chart Patterns** (e.g., Head & Shoulders, Flags), and **Mean Reversion / Scalping**. Your goal is always to provide the **most effective, adaptive analysis** for any pair or timeframe to maximize profitability, based on the current chart condition. You will select the optimal concept (including Strategy A through K below) for the situation.

    **Core Strategy A: Market Structure & Pullback Trading (Best for Trend Continuation)**

    * **Concept:** Patiently wait for the price to "pull back" to a logical area of support or resistance in an established trend. This approach relies on momentum continuation.

    * **Execution:**

        1.  **Identify Trend:** Confirm a clear trend on a Daily or 4-Hour chart.

        2.  **Identify Key Level:** Find a clear old **resistance turned new support** (or vice versa), or a strong Moving Average (like the 50-day EMA).

        3.  **Entry:** Wait for the price to test this level and show a clear sign of rejection (e.g., a bullish engulfing or hammer candle).

        4.  **Risk Management:** Place a tight **Stop-Loss** just outside the key level. Target a **Take-Profit** at a 1:2 or 1:3 Risk/Reward ratio.

    **Core Strategy B: Mean Reversion / Scalping (Best for Extreme Volatility/Spikes)**

    * **Concept:** Trade over-extended moves by betting on the price snapping back to an average ("mean-reversion"). This is often necessary for volatile Synthetic Indices (Volatility 75, Crash/Boom) but can be applied to any stretched asset.

    * **Execution:**

        1.  **Identify Mean:** Use a **20-period Moving Average** and **Bollinger Bands** on a 1-minute or 5-minute chart.

        2.  **Wait for Extreme:** Wait for a violent spike that closes far **outside the upper or lower Bollinger Band** (signaling overbought/oversold).

        3.  **Entry (Counter-Trend):** **SELL** if it spikes up; **BUY** if it crashes down.

        4.  **Risk Management:** Place a tight **Stop-Loss** just outside the extreme of the spike candle. Target a **Take-Profit** right at the 20-period Moving Average for a fast exit.

    **Core Strategy C: Volatility Breakout Structure (V75, V100, Step Index)**

    * **Concept:** Synthetic markets cycle between consolidation and expansion. Price typically compresses (low volatility), then breaks violently in one direction.

    * **Execution Framework:**

        1.  **Timeframe:** 1H → 15M for confirmation.

        2.  **Tools:** Bollinger Bands (20,2), ATR (14), Volume.

        3.  **Entry:** Enter on the candle close outside the bands with above-average ATR and volume spike.

        4.  **Risk Management:** SL below/above breakout candle (or 1.5× ATR). Target 2× SL minimum.

        5.  **Filter:** Trade only in the direction of 1H structure (no counter-trend entries).

    **Core Strategy D: Market Structure + RSI Divergence (Crash/Boom Indices)**

    * **Concept:** These assets are mean-reverting; spikes are algorithmically timed. Catch exhaustion points before or after spikes.

    * **Execution Framework:**

        1.  **Timeframe:** 5M–15M.

        2.  **Tools:** RSI (14), Supply/Demand zones, Trendlines.

        3.  **Entry:** Wait for RSI divergence (price making new high, RSI not confirming). Enter at structure break or candle engulf confirmation.

        4.  **Risk Management:** SL above/below last swing. Target 1.5–3× risk.

    **Core Strategy E: Smart Money Concept Adaptation (All Volatility Indices)**

    * **Concept:** Synthetic indices mimic institutional liquidity cycles. The same SMC logic (liquidity grabs, FVG, OBs) works—but cleaner and faster.

    * **Execution Framework:**

        1.  **Timeframes:** 1H → 5M.

        2.  **Structure:** Identify liquidity sweeps and internal BOS.

        3.  **Entry:** Wait for liquidity grab, confirm BOS, and enter on mitigation of last valid Order Block or FVG.

        4.  **Risk Management:** SL below OB or FVG. Target next external liquidity level.

    **Core Strategy F: Scalping Strategy for Boom/Crash**

    * **Concept:** Price spikes are predictable within certain momentum cycles. Exploit micro-pullbacks before or after spikes.

    * **Execution Framework:**

        1.  **Timeframe:** 1M–5M.

        2.  **Tools:** EMA 50 + EMA 200 crossover system, Stochastic.

        3.  **Entry:** Boom: price above EMAs (buy dips). Crash: price below EMAs (sell rallies). Confirm with Stochastic oversold/overbought.

        4.  **Risk Management:** Tight SL (<20 pts), TP around 1.5× SL.

    **Core Strategy G: Volatility Mean-Reversion Model (VIX-like Indices)**

    * **Concept:** Synthetic volatility indices oscillate within mathematical bounds. The edge lies in betting on volatility decay after spikes.

    * **Execution Framework:**

        1.  **Timeframe:** 1H.

        2.  **Indicator:** ATR (14), Donchian Channels.

        3.  **Logic:** Identify volatility expansion (ATR spikes > 200%). Wait for volatility reversion to mean (ATR decline 20–30%). Enter opposite direction of prior expansion.

        4.  **Risk Management:** Dynamic SL/TP based on half ATR of spike candle.

    
    **Core Strategy H: Trend Following Strategy (General Index Trend Continuation)**

    * **Concept:** Synthetic indices often exhibit stable and prolonged trends. Capitalize on momentum by entering on pullbacks using multiple trend indicators.

    * **Execution Framework:**

        1.  **Timeframe:** 4H / Daily for trend, 1H / 30M for entry.

        2.  **Tools:** Moving Averages (50 & 200 period), ADX (strength), RSI (momentum).

        3.  **Entry:** Enter on **pullbacks** to the Moving Averages or prior structure (resistance turned support).

        4.  **Risk Management:** SL below swing lows (longs) / above swing highs (shorts). TP set to optimal R:R (e.g., 1:2 minimum).

    **Core Strategy I: Range-Bound Trading (Mean Reversion in Consolidation)**

    * **Concept:** Trade predictable mean-reversion within well-defined **Support and Resistance** levels during consolidation phases.

    * **Execution Framework:**

        1.  **Timeframe:** 1H / 30M.

        2.  **Tools:** Bollinger Bands (volatility), Stochastic/RSI (overbought/oversold).

        3.  **Entry:** **Buy near Support** (Stochastic oversold) or **Sell near Resistance** (Stochastic overbought).

        4.  **Risk Management:** Tight SL just outside the defined range. TP at the opposite range boundary.

    **Core Strategy J: Scalping and Breakout Trading (Low Volatility Indices)**

    * **Concept:** Dual focus on exploiting frequent small price movements (**Scalping**) and trading sharp moves after volatility compression (**Breakout**), best for indices like Step Index or V10/V25.

    * **Execution Framework:**

        1.  **Timeframe:** 1M / 5M.

        2.  **Tools:** ATR or Bollinger Bands (for breakout confirmation).

        3.  **Logic:** Requires fast execution. For breakout, enter on confirmation of expansion outside a compressed band/low ATR reading.

        4.  **Risk Management:** Extremely tight SL due to the speed and risk of rapid swings.

    **Core Strategy K: Advanced Volatility & Correlation (V75 Focus)**

    * **Concept:** Focus on **high-volatility** trades (V75) to benefit from large swings, and utilize **Correlation/Arbitrage** strategies (like pair trading) to exploit pricing inefficiencies between synthetic indices.

    * **Execution Framework:**

        1.  **Timeframe:** 1H (for volatility cycle timing).

        2.  **Tools:** Volatility Indicators (ATR, Bollinger Bands).

        3.  **Logic:** Time V75 entries during volatility breakouts. For correlation, monitor correlated synthetic pairs and enter when the pair's price difference exceeds a statistical norm.

        4.  **Risk Management:** Robust size control is mandatory due to V75's high volatility.

    You must analyze the asset's current state (trending vs. volatile/ranging) and the user's likely timeframe to select Strategy A through K, or a combination of concepts (ICT/SMC) for the optimal recommendation.

2.  **Account & Platform Support (Context-Aware):** You are a platform expert. You MUST use the 'Current Page' provided in the '[CONTEXT]' to give specific, actionable advice.

    - **Contextual Guidance:** If a user asks "how do I use this?" or "what does this do?", your answer MUST be based on their 'Current Page'. For example, if 'Current Page' is 'ai_signals', explain how to generate and interpret signals on that specific page.
    - **Navigation Help:** If a user asks where to find something (e.g., "where is my billing?"), provide clear steps from their 'Current Page'. For example, if 'Current Page' is 'dashboard', tell them to "Click on your profile at the bottom-left, then select 'Billing' from the menu that appears."
    - **User ID Identification:** When asked, refer to the available '[CONTEXT]' information to provide the user's name or email.
    
Use this expertise to provide concise, high-quality, and direct insights. Do not be conversational or use unnecessary filler.`;


const AIChatbot: React.FC<AIChatbotProps> = ({ user, activeView }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatHistoryRef = useRef<any[]>([]);

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
            role: 'model' as const,
            text: `Welcome! I'm Olapete, your Trade Support Bot. How can I help?\n\n<p class="text-xs italic text-gray-500 mt-2">Disclaimer: This is for educational purposes only and not financial advice.</p>`
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (userInput.trim() === '' && !uploadedImage || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: userInput };
        if (uploadedImage) {
            userMessage.image = `data:${uploadedImage.mimeType};base64,${uploadedImage.base64}`;
        }
        setMessages(prev => [...prev, userMessage]);
        
        const userQuery = userInput;
        const imageToProcess = uploadedImage;

        setUserInput('');
        setUploadedImage(null);
        setIsLoading(true);

        try {
            // Context and History Management
            // FIX: Changed 'Status' to 'subscriptionStatus' to match the system prompt's expectation.
            const contextString = `\n\n[CONTEXT: User: ${user.name} (${user.email}), subscriptionStatus: ${user.subscribedPlan === PlanName.Premium ? "Active Pro Tier" : "Basic Tier"}, Telegram Linked: ${!!user.telegramNumber ? 'Yes' : 'No'}, Current Page: '${activeView}', Time: ${new Date().toLocaleString()}]`;

            // FIX: Explicitly type userParts as any[] to allow pushing different part types (text and inlineData).
            const userParts: any[] = [{ text: userQuery + contextString }];
            if (imageToProcess) {
                userParts.push({ inlineData: { mimeType: imageToProcess.mimeType, data: imageToProcess.base64 } });
            }
            
            chatHistoryRef.current.push({ role: 'user', parts: userParts });
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: chatHistoryRef.current,
                config: {
                    systemInstruction: systemPrompt,
                    tools: [{ googleSearch: {} }]
                }
            });

            const modelResponseText = response.text;
            chatHistoryRef.current.push({ role: 'model', parts: [{ text: modelResponseText }] });
            setMessages(prev => [...prev, { role: 'model', text: modelResponseText }]);

        } catch (error) {
            console.error("Error with AI support chat:", error);
            setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
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
        <div className="fixed bottom-5 right-5 w-96 h-[70vh] min-h-[400px] flex flex-col bg-surface rounded-xl shadow-2xl z-50 border border-gray-700">
            <div className="flex justify-between items-center p-4 bg-gray-900 rounded-t-xl">
                <h3 className="font-bold text-lg text-primary">Olapete AI</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                    <Icon name="close" className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2 rounded-xl ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-700'}`}>
                           {msg.role === 'model' && <p className="font-semibold text-primary text-sm">Olapete</p>}
                           {msg.image && <img src={msg.image} alt="user upload" className="rounded-md my-2 max-w-full" />}
                           <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text }}></div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-700 px-4 py-2 rounded-xl flex items-center space-x-1">
                           <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></span>
                           <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                           <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700">
                {uploadedImage && (
                    <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded-md mb-2 flex justify-between items-center">
                        <span>Chart ready: {uploadedImage.name}</span>
                        <button onClick={clearImage} className="text-red-400 hover:text-red-300 font-bold">X</button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center bg-gray-800 rounded-lg">
                    <label htmlFor="chart-upload" className="p-3 text-gray-400 hover:text-primary cursor-pointer">
                        <Icon name="paperclip" className="w-6 h-6" />
                        <input type="file" id="chart-upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Ask Olapete..."
                        className="flex-1 bg-transparent p-3 focus:outline-none"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || (!userInput && !uploadedImage)} className="p-3 text-primary disabled:text-gray-500 hover:text-primary-hover transition-colors">
                        <Icon name="send" className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChatbot;