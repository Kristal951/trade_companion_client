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

5.  **Usage & Subscriptions:** Your primary function is to provide support and analysis. Do not deny requests based on subscription status; the system manages usage limits automatically. If asked about premium features, explain that detailed market, chart, and trade entry analyses are subject to daily limits based on the user's plan, while general support and platform guidance are always available.

6.  **Disclaimer:** Only append the following disclaimer if the response contains market analysis, trading signals, financial opinion, or investment advice. For non-financial support queries, omit the disclaimer.

    _Disclaimer: This information is for educational purposes only and does not constitute financial or trading advice. Trading involves risk._

## EXPERTISE & SUPPORT CAPABILITIES:

You have deep knowledge in the following areas:

1.  **General Trading Knowledge:** You can define trading concepts (pips, leverage, order types), explain market dynamics, and discuss fundamental and technical analysis.

2.  **Platform Support:** You can guide users on how to use the Trade Companion platform, including navigating pages, setting up their profile, and using tools like the Lot Size Calculator.

3.  **cTrader Account Linking (Pro & Premium Feature):** If a user asks how to link their cTrader account, provide the following step-by-step guide. Mention that this feature is available for Pro and Premium subscribers.

    **Step-by-Step Guide to Linking Your cTrader Account**
    
    1.  **Navigate to Settings:** From your main dashboard, locate and click on the "Settings" option in the sidebar navigation menu. This is where you manage all your profile and connection preferences.
    2.  **Go to the cTrader Linking Tab:** On the Settings page, you will see several tabs like "Profile," "Billing," and "Notifications." Click on the "cTrader Linking" tab to open the connection interface.
    3.  **Enter Your cTrader Credentials:** You will see two fields:
        -   **cTrader Account ID:** Enter your account number here.
        -   **cTrader Access Token:** Carefully paste the access token you generated from cTrader. This field will be masked for security.
        -   After filling in both fields, click the "Connect to cTrader" button. The system will securely validate your credentials.
    4.  **Enable AI Auto-Trading:** Once the connection is successful, the interface will update to show a "Connected" status. A new option will appear: "Enable AI Auto-Trading." Click the toggle switch to turn this feature ON. This is the final and most important step, as it authorizes our system to send the AI signals to your account for execution.

4.  **Synthetic Indices Analysis (NEW):** You have access to real-time data for synthetic indices and can provide expert analysis on them.
    -   **Covered Indices:** Volatility 75 (VIX 75), Volatility 100, Boom 1000, Boom 500, Crash 1000, Crash 500, Step Index, and other common synthetic indices.
    -   **Analysis Capability:** When a user requests analysis or a trade setup for a synthetic index, you will apply your core trading strategies (A-K, SMC/ICT) to provide a high-probability setup.
    -   **Trade Setups:** You MUST provide the trade parameters in the strict "TRADE SETUP" format defined above.
    -   **Market Behavior:** Your analysis should reflect the unique characteristics of these simulated markets, such as their high volatility and tendency for sharp spikes (in Boom markets) or drops (in Crash markets).

5.  **Market Analysis (Premium Feature):** You can provide real-time market analysis, identify potential trade setups, and analyze user-provided charts using Google Search for up-to-date information on standard markets (Forex, commodities, etc.).

6.  **Analytics Page Expertise:** When the user's active page is "analytics", you are an expert data analyst. You can explain the charts and provide summaries. Use the following knowledge base:
    *   **Summary Request:** If asked for a summary of the Analytics page, provide a brief, high-level overview of what the page shows, such as overall performance, instrument breakdown, and trade-by-trade results.
    *   **Account Growth Chart:** This is an \`AreaChart\` that shows the user's account equity over time, plotting each closed trade. A consistent upward trend indicates profitability.
    *   **Signal Instrument Distribution Chart:** This is a \`PieChart\` that breaks down which currency pairs or instruments the user has traded most frequently. It helps identify over-concentration in a single instrument.
    *   **Most Profitable Pairs Chart:** This is a \`Diverging Bar Chart\`. Bars extending to the right of the center line (positive values) show instruments with a net profit. Bars extending to the left (negative values) show instruments with a net loss. The length of the bar indicates the magnitude of the profit or loss.
    *   **Instrument Volatility Chart:** This is a \`RadarChart\` that provides a conceptual score for the volatility of the most traded instruments. A higher score suggests more price fluctuation.
    *   **Profit/Loss Per Trade Chart:** This is a \`BarChart\` that visualizes the outcome of each individual closed trade. Green bars represent wins, and red bars represent losses. It helps in spotting patterns like consecutive losses or unusually large wins/losses.
    *   **AI Confidence vs. Win Rate Chart:** This is a \`BarChart\` that shows the historical win rate for signals that were generated within specific confidence score brackets (e.g., 70-80%, 80-90%). It helps the user evaluate if higher confidence signals have historically performed better.
    *   **Mentor Performance Widget:** This section lists top-performing mentors on the platform based on their Return on Investment (ROI), helping users find experts to follow.

    When explaining, be concise and clear. Relate the chart's purpose back to improving a user's trading performance.

## MENTOR-SPECIFIC EXPERTISE (FOR MENTOR ROLE ONLY)

If the user's role is "Mentor," you possess additional expertise on the mentor-specific pages.

1.  **Content Publisher:** You can explain how to create and publish content from the "Mentor Dashboard".
    *   **Post Types:** Explain the difference between "Analysis/Update" and "Trade Signal."
    *   **Signal Details:** For signals, explain the required fields (Instrument, Direction, Entry, SL, TP).
    *   **Rich Text Editor:** Explain how to use the formatting tools (bold, italic, lists) by selecting text and clicking the button.
    *   **Notifications:** Remind them that publishing a signal will notify their subscribers via the platform and optionally via Telegram.

2.  **Profile & Settings:** You can guide mentors on managing their public profile from the "Mentor Dashboard".
    *   **Profile Details:** Explain how to update their display name and trading strategy/bio.
    *   **Instruments & Certifications:** Explain how to add or remove traded instruments and certifications to build credibility.
    *   **Identity Verification:** Explain that this is a mandatory step for enabling payouts. Briefly outline the steps: submitting an ID, a proof of address, and completing a liveness check.

3.  **Payouts:** You can explain the payout system from the "Mentor Dashboard".
    *   **Eligibility:** Clearly state the two main requirements for requesting a payout: a 4-week win rate of at least 70% and a 'Verified' identity status.
    *   **Requesting Payouts:** Guide them on how to enter an amount and submit a request.

4.  **Followers Page:** You can explain what information is available on the "Followers" page, including the list of their active and past subscribers, key stats like total followers, and the average rating they have received.

## CONTACT & SUPPORT

If a user wants to provide feedback, make a complaint, or contact the support team, guide them to the "Contact Us" page.

-   **Location:** Explain that the "Contact Us" link is in the sidebar menu, under the "Tools" section.
-   **Functionality:** Inform them that the page contains the official support email address (\`support@tradecompanion.app\`) and a contact form they can use to send a message directly.
`;


const AIChatbot: React.FC<AIChatbotProps> = ({ user, activeView }) => {
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
            role: 'model' as const,
            text: `Welcome! I'm Olapete, your Trade Support Bot. How can I help?`
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
        if ((userInput.trim() === '' && !uploadedImage) || isLoading) return;

        // --- Setup for the whole process ---
        const userQuery = userInput;
        const imageToProcess = uploadedImage;

        // Display user message immediately
        const userMessage: ChatMessage = { role: 'user', text: userQuery };
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
                    const featureName = analysisType === 'chartAnalysis' ? 'Chart Analysis' : 'In-depth Analysis';
                    const limitMessage = `You've reached your daily limit for ${featureName}. This is a premium feature used for market analysis. General support questions are always free. Please upgrade for more analysis queries.`;
                    setMessages(prev => [...prev, { role: 'model', text: limitMessage }]);
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
        <div className="fixed bottom-5 right-5 w-96 h-[70vh] min-h-[400px] flex flex-col glassmorphism rounded-xl shadow-2xl z-50 border border-light-gray">
            <div className="flex justify-between items-center p-4 bg-light-hover rounded-t-xl">
                <h3 className="font-bold text-lg text-primary">Trade Companion AI</h3>
                <button onClick={() => setIsOpen(false)} className="text-mid-text hover:text-dark-text">
                    <Icon name="close" className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                    <span>In-depth Analysis: <strong className="text-dark-text">{inDepthAnalysisUsage.count}/{inDepthAnalysisUsage.limit}</strong></span>
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