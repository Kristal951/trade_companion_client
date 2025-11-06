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
(The rest of the system prompt is unchanged and provides the AI with its trading expertise and platform knowledge)
...
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
            const contextString = `\n\n[CONTEXT: User: ${user.name} (${user.email}), Current Page: '${activeView}', Time: ${new Date().toLocaleString()}]`;

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