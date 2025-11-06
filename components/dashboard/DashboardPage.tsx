import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardView, User, EducationArticle, PlanName, Mentor, MentorPost, TradeRecord, Notification, Signal, NotificationType } from '../../types';
import Icon from '../ui/Icon';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Sector, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import AISignalsPage from '../signals/AISignalsPage';
import LotSizeCalculatorPage from '../calculator/LotSizeCalculatorPage';
import MentorDashboard from '../mentors/MentorDashboard';
import MentorProfilePage from '../mentors/MentorProfilePage';
import MarketChartPage from './MarketChartPage';
import { scanForSignals } from '../../services/geminiService';
import NotificationBell from '../ui/NotificationBell';
import { useUsageTracker } from '../../hooks/useUsageTracker';

// --- MOCK DATA ---
const signalPerformanceData = [
  { name: 'Jan', profit: 400, loss: 240 },
  { name: 'Feb', profit: 300, loss: 139 },
  { name: 'Mar', profit: 200, loss: 980 },
  { name: 'Apr', profit: 278, loss: 390 },
  { name: 'May', profit: 189, loss: 480 },
  { name: 'Jun', profit: 239, loss: 380 },
];

const winLossData = [
  { name: 'Wins', value: 78, fill: '#22C55E' },
  { name: 'Losses', value: 22, fill: '#EF4444' },
];

const MOCK_MENTOR_POSTS: MentorPost[] = [
    { id: 1, type: 'signal', title: 'EUR/USD Long Opportunity', content: 'Price has pulled back to a key support level and formed a bullish engulfing candle on the 4H chart. Looking for a move higher towards the previous resistance.', timestamp: '2023-10-27T14:00:00Z', signalDetails: { instrument: 'EUR/USD', direction: 'BUY', entry: '1.0760', stopLoss: '1.0730', takeProfit: '1.0820' }},
    { id: 2, type: 'analysis', title: 'Weekly Market Outlook', content: 'This week, I am watching the FOMC meeting on Wednesday. Expect volatility in USD pairs. The DXY is approaching a major resistance zone, a rejection could see a relief rally in majors like EUR/USD and GBP/USD.', timestamp: '2023-10-26T09:00:00Z' },
    { id: 3, type: 'analysis', title: 'Risk Management Tip', content: 'Never risk more than 1-2% of your account on a single trade. Consistency in risk is key to long-term survival and profitability in the markets. Stay disciplined!', timestamp: '2023-10-25T11:00:00Z' },
];


const MOCK_MENTORS_LIST: Mentor[] = [
    { id: 1, name: 'John Forex', avatar: 'https://picsum.photos/seed/mentor1/200', experience: 10, profitRatio: 85, roi: 25.5, instruments: ['EUR/USD', 'GBP/JPY', 'USD/CAD'], price: 99, strategy: 'Specializing in high-frequency scalping strategies and market psychology based on order flow.', posts: MOCK_MENTOR_POSTS, certifications: [{name: 'Pro Trader Certification', url: '#'}, {name: 'MyFxBook Verified History', url: '#'}] },
    { id: 2, name: 'Anna Indicators', avatar: 'https://picsum.photos/seed/mentor2/200', experience: 8, profitRatio: 92, roi: 31.2, instruments: ['XAU/USD', 'US30', 'NASDAQ'], price: 149, strategy: 'Master of technical analysis using custom-developed indicators and algorithmic trading systems.', posts: [], certifications: [{name: 'Funded Prop Firm Payout', url: '#'}] },
    { id: 3, name: 'Mike Waves', avatar: 'https://picsum.photos/seed/mentor3/200', experience: 12, profitRatio: 88, roi: 28.0, instruments: ['BTC/USD', 'ETH/USD'], price: 129, strategy: 'Expert in Elliot Wave theory and harmonic patterns, primarily focusing on the cryptocurrency markets.', posts: [] },
    { id: 4, name: 'Sarah Trends', avatar: 'https://picsum.photos/seed/mentor4/200', experience: 7, profitRatio: 90, roi: 29.8, instruments: ['NASDAQ', 'OIL', 'SPX500'], price: 119, strategy: 'Trend-following expert with a focus on macroeconomic analysis and long-term position trades.', posts: [], certifications: [{name: 'Certified Market Technician (CMT)', url: '#'}] },
];

const MOCK_EDUCATION_ARTICLES: EducationArticle[] = [
    { id: 1, category: "Forex Basics", title: "What is Forex Trading?", summary: "An introduction to the foreign exchange market, how it works, and key terminology for beginners.", difficulty: "Beginner", type: "article",
      content: `
        <h2 class="text-3xl font-bold mb-4">What is Forex Trading? The Ultimate Beginner's Guide</h2>
        <p class="mb-4 text-lg">Forex, short for foreign exchange, is the largest financial market in the world. It’s a global, decentralized marketplace where individuals, companies, and banks exchange foreign currencies. Unlike other financial markets, there’s no central exchange; instead, forex is traded electronically over-the-counter (OTC) between a global network of banks.</p>
        <h3 class="text-2xl font-semibold mb-3">Understanding the Forex Market</h3>
        <p class="mb-4">At its core, forex trading is about exchanging one currency for another with the expectation that the price of the purchased currency will rise relative to the sold currency, allowing you to profit from the difference. Think of it like exchanging your home currency for another when traveling abroad, but on a much larger scale and with the primary goal of making money.</p>
      `
    },
    { id: 2, category: "Forex Basics", title: "Understanding Pips, Lots, and Leverage", summary: "Learn the fundamental concepts of pips, lot sizes, and how leverage can amplify your trades.", difficulty: "Beginner", type: "article",
      content: `
        <h2 class="text-2xl font-bold mb-4">Understanding Pips, Lots, and Leverage</h2>
        <p class="mb-4">To navigate the forex market effectively, you must grasp these fundamental concepts.</p>
        <h3 class="text-xl font-semibold mb-3">What is a Pip?</h3>
        <p class="mb-4">A Pip (Percentage in Point) is the smallest price movement an exchange rate can make. For most currency pairs, a pip is the fourth decimal place (0.0001). For JPY pairs, it's the second decimal place (0.01).</p>
      `
    },
    { id: 7, category: "Forex Basics", title: "Forex Trading for Dummies: A Beginner's Guide", summary: "A comprehensive guide covering the very basics of Forex trading in an easy-to-understand format.", difficulty: "Beginner", type: "book",
      content: `
        <h2 class="text-2xl font-bold mb-4">Forex Trading for Dummies: A Beginner's Guide</h2>
        <p class="mb-4">Welcome to the world of Forex! This guide is designed to get you started with the absolute fundamentals, explaining complex ideas in simple terms.</p>
        <h3 class="text-xl font-semibold mb-3">Chapter 1: The Basics of Currency Pairs</h3>
        <p class="mb-4">Forex trading always involves currency pairs. You're simultaneously buying one currency and selling another. The first currency in the pair is the "base currency," and the second is the "quote currency."</p>
      `
    },
    { id: 3, category: "Technical Analysis", title: "Mastering Support and Resistance", summary: "Identify key price levels on charts to make better entry and exit decisions.", difficulty: "Intermediate", type: "article",
      content: `
        <h2 class="text-2xl font-bold mb-4">Mastering Support and Resistance</h2>
        <p class="mb-4">Support and resistance levels are among the most fundamental concepts in technical analysis. They represent price levels where the price action is likely to pause or reverse.</p>
      `
    },
    { id: 4, category: "Technical Analysis", title: "A Guide to Candlestick Patterns", summary: "Recognize common candlestick patterns to predict future market movements.", difficulty: "Intermediate", type: "article",
      content: `
        <h2 class="text-2xl font-bold mb-4">A Guide to Candlestick Patterns</h2>
        <p class="mb-4">Candlestick charts are a popular way to visualize price movements in financial markets. Each candlestick provides information about the open, high, low, and close price for a specific period, offering insights into market sentiment.</p>
      `
    },
    { id: 8, category: "Technical Analysis", title: "Japanese Candlestick Charting Techniques (Book)", summary: "Steve Nison's classic guide to understanding and using candlestick patterns for market analysis.", difficulty: "Advanced", type: "book",
      content: `
        <h2 class="text-2xl font-bold mb-4">Japanese Candlestick Charting Techniques</h2>
        <p class="mb-4">This book, originally by Steve Nison, is considered the bible for understanding candlestick charting. It delves deep into the history, psychology, and practical application of Japanese candlesticks.</p>
      `
    },
    { id: 5, category: "Risk Management", title: "The Importance of Stop-Loss Orders", summary: "Protect your capital by learning how to properly set and manage stop-loss orders.", difficulty: "Beginner", type: "article",
      content: `
        <h2 class="text-2xl font-bold mb-4">The Importance of Stop-Loss Orders</h2>
        <p class="mb-4">A stop-loss order is one of the most critical tools in a trader's arsenal for protecting capital. It's an order placed with a broker to buy or sell a security once it reaches a certain price, designed to limit an investor's potential loss on a security position.</p>
      `
    },
    { id: 6, category: "Risk Management", title: "Position Sizing for Success", summary: "Calculate the optimal position size for any trade to manage risk effectively.", difficulty: "Advanced", type: "article",
      content: `
        <h2 class="text-2xl font-bold mb-4">Position Sizing for Success</h2>
        <p class="mb-4">Position sizing is the cornerstone of effective risk management. It refers to determining the number of units (or lot size) of a currency pair to trade based on your risk tolerance and account size, ensuring no single trade can severely damage your capital.</p>
      `
    },
    { id: 9, category: "Risk Management", title: "Trading Risk Management Essentials (Book)", summary: "An essential guide to developing a robust risk management plan for consistent trading.", difficulty: "Intermediate", type: "book",
      content: `
        <h2 class="text-2xl font-bold mb-4">Trading Risk Management Essentials</h2>
        <p class="mb-4">This book provides a foundational understanding of robust risk management principles, essential for long-term survival and profitability in trading.</p>
      `
    },
    { id: 10, category: "Using Our Signals", title: "How to Interpret AI Signals", summary: "A step-by-step guide on how to read our AI-generated signals and incorporate them into your strategy.", difficulty: "Beginner", type: "video", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      content: `
        <h2 class="text-2xl font-bold mb-4">How to Interpret AI Signals</h2>
        <p class="mb-4">This video provides a walkthrough on interpreting the signals from the AI Signal Dashboard. You will learn about each component of the signal and how to apply it with proper risk management.</p>
      `
    },
    { id: 11, category: "Using Our Signals", title: "Setting Up Your Dashboard for Success", summary: "Learn how to customize your dashboard, set your initial equity, and track your performance effectively.", difficulty: "Beginner", type: "video", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      content: `
        <h2 class="text-2xl font-bold mb-4">Setting Up Your Dashboard for Success</h2>
        <p class="mb-4">This tutorial covers the initial setup of your Trade Companion account. We guide you through the dashboard widgets, how to lock in your trading settings on the AI Signals page, and how to use the analytics to monitor your growth.</p>
      `
    },
];

interface DashboardPageProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  onLogout: () => void;
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// --- SUB-COMPONENTS for different views ---

const StatCard: React.FC<{ title: string; value: string; percentage?: string; percentageType?: 'gain' | 'loss' | 'info'; icon?: React.ReactNode }> = ({ title, value, percentage, percentageType = 'gain', icon }) => {
    const isGain = percentageType === 'gain';
    const isInfo = percentageType === 'info';
    const textColor = isGain ? 'text-success' : (isInfo ? 'text-info' : 'text-danger');
    const bgColor = isGain ? 'bg-success/10' : (isInfo ? 'bg-info/10' : 'bg-danger/10');

    return (
        <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray flex items-center">
            {icon && <div className={`p-3 rounded-full mr-4 ${bgColor} ${textColor}`}>{icon}</div>}
            <div>
                <h3 className="text-mid-text text-sm font-medium">{title}</h3>
                <p className="text-2xl font-bold text-dark-text">{value}</p>
                {percentage && (
                    <p className={`text-xs font-semibold ${textColor}`}>{percentage}</p>
                )}
            </div>
        </div>
    );
};

const DashboardOverview: React.FC<{user: User; onViewChange: (view: DashboardView) => void, activeTrades: TradeRecord[], tradeHistory: TradeRecord[]}> = ({user, onViewChange, activeTrades, tradeHistory}) => {
    const EQUITY_KEY = `currentEquity_${user.email}`;
    const INITIAL_EQUITY_KEY = `initialEquity_${user.email}`;
    const PIE_COLORS = ['#6366F1', '#A78BFA', '#60A5FA', '#34D399', '#FB7185'];

    const [currentEquity, setCurrentEquity] = useState<number>(() => parseFloat(localStorage.getItem(EQUITY_KEY) || '10000'));
    const [initialEquity] = useState<number>(() => parseFloat(localStorage.getItem(INITIAL_EQUITY_KEY) || '10000'));

    useEffect(() => {
        const handleStorageChange = () => {
            setCurrentEquity(parseFloat(localStorage.getItem(EQUITY_KEY) || '10000'));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [EQUITY_KEY]);

    const chartEquityData = useMemo(() => {
        const data: { name: string; equity: number }[] = [{ name: 'Start', equity: initialEquity }];
        let cumulativeEquity = initialEquity;
        tradeHistory.filter(t => t.status !== 'active').forEach((trade, index) => {
            cumulativeEquity += trade.pnl || 0;
            data.push({ name: `Trade ${index + 1}`, equity: parseFloat(cumulativeEquity.toFixed(2)) });
        });
        return data;
    }, [tradeHistory, initialEquity]);
    
    const latestSignals = useMemo(() => {
        const allSignals = [...activeTrades, ...tradeHistory];
        return allSignals.sort((a, b) => new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime()).slice(0, 2);
    }, [activeTrades, tradeHistory]);

    const instrumentDistribution = useMemo(() => {
        if (tradeHistory.length === 0) return [];
        const counts = tradeHistory.reduce((acc, trade) => {
            acc[trade.instrument] = (acc[trade.instrument] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({
            name,
            value,
        })).sort((a, b) => b.value - a.value);
    }, [tradeHistory]);
    
    const closedTrades = tradeHistory.filter(trade => trade.status !== 'active');
    const totalProfit = currentEquity - initialEquity;
    const profitPercentage = initialEquity > 0 ? ((totalProfit / initialEquity) * 100).toFixed(2) : '0.00';
    const profitType = totalProfit >= 0 ? 'gain' : 'loss';

    const totalWins = closedTrades.filter(trade => trade.status === 'win').length;
    const totalTrades = closedTrades.length;
    const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(2) : '0';

    return (
        <div className="p-4 bg-light-bg min-h-[calc(100vh-64px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Current Equity" 
                    value={`$${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                    percentage={`${profitType === 'gain' ? '+' : ''}${profitPercentage}% Total`} 
                    percentageType={profitType} 
                    icon={<Icon name="signals" className="w-5 h-5" />} 
                />
                <StatCard 
                    title="AI Signal Win Rate" 
                    value={`${winRate}%`} 
                    percentage={`${totalTrades} Trades`} 
                    percentageType={parseFloat(winRate) >= 50 ? 'gain' : 'loss'} 
                    icon={<Icon name="check" className="w-5 h-5" />} 
                />
                <StatCard 
                    title="Total Profit/Loss" 
                    value={`${totalProfit >= 0 ? '+' : '-'}$${Math.abs(totalProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                    percentageType={totalProfit >= 0 ? 'gain' : 'loss'} 
                    icon={<Icon name="dashboard" className="w-5 h-5" />} 
                />
                <StatCard 
                    title="Open Positions" 
                    value={activeTrades.length.toString()}
                    percentage="From AI Signals" 
                    percentageType="info" 
                    icon={<Icon name="analytics" className="w-5 h-5" />} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                        <h3 className="text-xl font-bold text-dark-text mb-4">Account Equity Growth</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartEquityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818CF8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="var(--color-text-mid)" />
                                <YAxis axisLine={false} tickLine={false} stroke="var(--color-text-mid)" domain={['dataMin - 500', 'dataMax + 500']} tickFormatter={(value) => `$${value}`} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-dark)', borderRadius: '8px' }} itemStyle={{ color: 'var(--color-text)' }} />
                                <Area type="monotone" dataKey="equity" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorEquity)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                        <h3 className="text-xl font-bold text-dark-text mb-4">Latest AI Signals</h3>
                         {latestSignals.length > 0 ? (
                            <div className="space-y-4">
                                {latestSignals.map(signal => (
                                    <div key={signal.id} className="bg-light-hover p-4 rounded-lg border border-light-gray flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-dark-text">{signal.instrument} - {signal.type}</p>
                                            <p className="text-sm text-mid-text">Entry: {signal.entryPrice.toFixed(4)} | SL: {signal.stopLoss.toFixed(4)}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${signal.status === 'active' ? 'bg-info/20 text-info animate-pulse' : signal.status === 'win' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                            {signal.status.charAt(0).toUpperCase() + signal.status.slice(1)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                         ) : (
                            <p className="text-center text-mid-text py-4">No AI signals generated yet.</p>
                         )}
                        <button onClick={() => onViewChange('ai_signals')} className="mt-4 w-full bg-primary/10 text-primary hover:bg-primary hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            View All AI Signals
                        </button>
                    </div>
                </div>
                <div className="space-y-6">
                     <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                        <h3 className="text-xl font-bold text-dark-text mb-4">Most Traded Instruments</h3>
                        {instrumentDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={instrumentDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {instrumentDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-dark)', borderRadius: '8px' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                             <p className="text-center text-mid-text py-16">No trade history to analyze.</p>
                        )}
                    </div>
                    <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                        <h3 className="text-xl font-bold text-dark-text mb-4">You are following</h3>
                        <div className="space-y-4">
                            {MOCK_MENTOR_POSTS.slice(0, 2).map(post => (
                                <div key={post.id} className="bg-light-hover p-4 rounded-lg border border-light-gray">
                                    <h4 className="font-semibold text-dark-text">{post.title}</h4>
                                    <p className="text-sm text-mid-text line-clamp-2">{post.content}</p>
                                    <p className="text-xs text-mid-text mt-2">{new Date(post.timestamp).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => onViewChange('mentors')} className="mt-4 w-full bg-primary/10 text-primary hover:bg-primary hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            View All Mentors
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ThemedChartTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glassmorphism p-3 rounded-lg text-sm shadow-lg">
                <p className="font-bold text-dark-text mb-1">{label}</p>
                {payload.map((pld: any, index: number) => {
                    const value = pld.value;
                    const name = pld.name || pld.dataKey;
                    // Format currency for specific data keys
                    const formattedValue = (name === 'Equity' || name === 'P&L')
                        ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                        : value;
                    
                    return (
                        <p key={index} style={{ color: pld.color || pld.fill }} className="font-semibold">
                           {`${name}: ${formattedValue}`}
                        </p>
                    );
                })}
            </div>
        );
    }
    return null;
};

const AnalyticsPage: React.FC<{ user: User }> = ({ user }) => {
    const TRADE_HISTORY_KEY = `trade_history_${user.email}`;
    const EQUITY_KEY = `currentEquity_${user.email}`;
    const INITIAL_EQUITY_KEY = `initialEquity_${user.email}`;
    const CHART_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

    // --- Data Fetching and State ---
    const [tradeHistory] = useState<TradeRecord[]>(() => JSON.parse(localStorage.getItem(TRADE_HISTORY_KEY) || '[]'));
    const [currentEquity] = useState<number>(() => parseFloat(localStorage.getItem(EQUITY_KEY) || '10000'));
    const [initialEquity] = useState<number>(() => parseFloat(localStorage.getItem(INITIAL_EQUITY_KEY) || '10000'));
    
    // --- Mock Data ---
    const MOCK_INSTRUMENT_VOLATILITY = useMemo(() => {
        const instruments = [...new Set(tradeHistory.map(t => t.instrument))];
        if (instruments.length === 0) return [];
        const volatilityData: { instrument: string; volatility: number }[] = [];
        instruments.forEach(inst => {
            let score = 5; // Base score
            if (inst.includes('JPY') || inst.includes('GBP')) score += 3;
            if (inst.includes('XAU') || inst.includes('BTC')) score = 10;
            if (inst === 'EUR/USD') score = 3;
            volatilityData.push({ instrument: inst, volatility: score });
        });
        return volatilityData;
    }, [tradeHistory]);

    const MOCK_MENTOR_PERFORMANCE = [
        { id: 1, name: 'John Forex', roi: 12.5, pnl: 1250, signals: 15 },
        { id: 2, name: 'Anna Indicators', roi: 18.2, pnl: 1820, signals: 11 },
    ];

    // --- Data Processing ---
    const processedData = useMemo(() => {
        const closedTrades = tradeHistory.filter(t => t.status !== 'active');
        const totalPnl = currentEquity - initialEquity;

        const pnlByInstrument = closedTrades.reduce((acc, trade) => {
            acc[trade.instrument] = (acc[trade.instrument] || 0) + (trade.pnl || 0);
            return acc;
        }, {} as Record<string, number>);

        const mostProfitableInstrument = Object.entries(pnlByInstrument).sort((a, b) => b[1] - a[1])[0];
        const profitableInstrumentsChartData = Object.entries(pnlByInstrument)
            .map(([name, pnl]) => ({ name, pnl }))
            .sort((a, b) => b.pnl - a.pnl);

        const instrumentDistribution = closedTrades.reduce((acc, trade) => {
            acc[trade.instrument] = (acc[trade.instrument] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const instrumentDistributionChartData = Object.entries(instrumentDistribution)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
            
        const equityChartData = [{ name: 'Start', equity: initialEquity }];
        let cumulativeEquity = initialEquity;
        closedTrades.forEach((trade, index) => {
            cumulativeEquity += trade.pnl || 0;
            equityChartData.push({ name: `T${index + 1}`, equity: parseFloat(cumulativeEquity.toFixed(2)) });
        });

        const topMentor = MOCK_MENTOR_PERFORMANCE.sort((a, b) => b.roi - a.roi)[0];

        return {
            totalPnl,
            mostProfitableInstrument: mostProfitableInstrument ? { name: mostProfitableInstrument[0], pnl: mostProfitableInstrument[1] } : { name: 'N/A', pnl: 0 },
            profitableInstrumentsChartData,
            instrumentDistributionChartData,
            equityChartData,
            topMentor,
        };
    }, [tradeHistory, currentEquity, initialEquity]);

    // --- Reusable UI Components ---
    const AnalyticsWidget: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
        <div className={`bg-light-surface p-6 rounded-2xl border border-light-gray ${className}`}>
            <h3 className="text-lg font-semibold text-dark-text mb-4">{title}</h3>
            {children}
        </div>
    );
    
    const AnalyticsStatCard: React.FC<{ title: string; value: string; subValue?: string; change?: string; changeUp?: boolean }> = ({ title, value, subValue, change, changeUp }) => (
        <AnalyticsWidget title={title} className="flex flex-col">
            <div className="flex-grow">
                <p className="text-3xl font-bold text-dark-text">{value}</p>
                {subValue && <p className="text-sm text-mid-text">{subValue}</p>}
            </div>
            {change && <p className={`text-sm font-semibold ${changeUp ? 'text-green-400' : 'text-red-400'}`}>{change}</p>}
        </AnalyticsWidget>
    );

    const DoughnutLegend = ({ payload }: any) => (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
            {payload.map((entry: any, index: number) => (
                <li key={`item-${index}`} className="flex items-center text-sm text-mid-text">
                    <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                    <span className="font-semibold">{entry.payload.name}:</span>
                    <span className="ml-auto text-dark-text">{entry.payload.value}</span>
                </li>
            ))}
        </ul>
    );

    const ChartEmptyState: React.FC<{ icon: string; title: string; message: string; height: number; }> = ({ icon, title, message, height }) => (
        <div style={{ height: `${height}px`}} className="flex items-center justify-center text-center text-mid-text">
            <div>
                <Icon name={icon} className="w-12 h-12 mx-auto text-light-gray" />
                <p className="mt-2 font-semibold text-sm">{title}</p>
                <p className="text-xs">{message}</p>
            </div>
        </div>
    );


    return (
         <div className="p-4 md:p-6 bg-light-bg min-h-full text-mid-text font-sans">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-dark-text">Analytics Overview</h1>
                <p className="text-mid-text">Your comprehensive trading performance dashboard.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnalyticsStatCard title="Current Equity" value={`$${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                <AnalyticsStatCard 
                    title="Total Profit/Loss" 
                    value={`${processedData.totalPnl >= 0 ? '+' : '-'}$${Math.abs(processedData.totalPnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
                    changeUp={processedData.totalPnl >= 0}
                />
                <AnalyticsStatCard 
                    title="Top Performing Mentor" 
                    value={processedData.topMentor.name} 
                    subValue={`ROI: ${processedData.topMentor.roi}%`}
                    changeUp={processedData.topMentor.roi >= 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
                <AnalyticsWidget title="Account Growth" className="lg:col-span-3">
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={processedData.equityChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.6}/>
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                            <XAxis dataKey="name" stroke="var(--color-text-mid)" tick={{ fontSize: 12, fill: 'var(--color-text-mid)' }} />
                            <YAxis stroke="var(--color-text-mid)" tick={{ fontSize: 12, fill: 'var(--color-text-mid)' }} tickFormatter={(value) => `$${Number(value)/1000}k`} />
                            <Tooltip content={<ThemedChartTooltip />} />
                            <Area type="monotone" dataKey="equity" stroke="#A78BFA" fill="url(#equityGradient)" strokeWidth={2} name="Equity"/>
                        </AreaChart>
                    </ResponsiveContainer>
                </AnalyticsWidget>

                <AnalyticsWidget title="Signal Instrument Distribution" className="lg:col-span-2">
                    {processedData.instrumentDistributionChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={processedData.instrumentDistributionChartData}
                                    cx="50%"
                                    cy="40%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {processedData.instrumentDistributionChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend content={<DoughnutLegend />} verticalAlign="bottom" />
                                <Tooltip content={<ThemedChartTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <ChartEmptyState icon="pie-chart" title="No Instrument Data" message="Closed trades will appear here." height={300} />
                    )}
                </AnalyticsWidget>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                <AnalyticsWidget title="Most Profitable Pairs">
                     {processedData.profitableInstrumentsChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={processedData.profitableInstrumentsChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                                <XAxis dataKey="name" stroke="var(--color-text-mid)" tick={{ fontSize: 12, fill: 'var(--color-text-mid)' }} />
                                <YAxis stroke="var(--color-text-mid)" tick={{ fontSize: 10, fill: 'var(--color-text-mid)' }} tickFormatter={(value) => `$${value}`} />
                                <Tooltip content={<ThemedChartTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }} />
                                <Bar dataKey="pnl" name="P&L">
                                    {processedData.profitableInstrumentsChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <ChartEmptyState icon="chart-bar" title="No Profit Data" message="Complete some trades to see your performance." height={250} />
                    )}
                </AnalyticsWidget>

                <AnalyticsWidget title="Instrument Volatility">
                    {MOCK_INSTRUMENT_VOLATILITY.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={MOCK_INSTRUMENT_VOLATILITY}>
                                <PolarGrid stroke="var(--color-border-light)"/>
                                <PolarAngleAxis dataKey="instrument" stroke="var(--color-text-mid)" tick={{ fontSize: 12, fill: 'var(--color-text-mid)' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                <Radar name="Volatility" dataKey="volatility" stroke="#A78BFA" fill="#8B5CF6" fillOpacity={0.6} />
                                <Tooltip content={<ThemedChartTooltip />} />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <ChartEmptyState icon="analytics" title="No Volatility Data" message="Trade on different instruments to analyze." height={250} />
                    )}
                </AnalyticsWidget>

                <AnalyticsWidget title="Mentor Performance">
                    <div className="space-y-4">
                        {MOCK_MENTOR_PERFORMANCE.map(mentor => (
                             <div key={mentor.id} className="bg-light-hover p-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-dark-text">{mentor.name}</p>
                                    <span className={`font-bold ${mentor.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>{mentor.roi}% ROI</span>
                                </div>
                                 <div className="flex justify-between items-center text-xs text-mid-text mt-1">
                                    <span>P&L: ${mentor.pnl.toLocaleString()}</span>
                                    <span>{mentor.signals} Signals</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </AnalyticsWidget>
            </div>
        </div>
    );
};


const MentorPage: React.FC<{ onViewMentor: (mentor: Mentor) => void; user: User; }> = ({ onViewMentor, user }) => (
    <div>
        <h1 className="text-3xl font-bold mb-6 text-dark-text">Mentors</h1>
        {user.subscribedPlan === PlanName.Premium && (
            <div className="bg-accent/10 text-accent p-4 rounded-lg mb-6 border border-accent/20">
                <p className="font-bold">Premium Perk Unlocked!</p>
                <p className="text-sm">As a Premium member, you get one free month of mentorship. Choose a mentor to start your free trial!</p>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {MOCK_MENTORS_LIST.map(mentor => (
                <div key={mentor.id} className="bg-light-surface rounded-lg overflow-hidden p-6 flex flex-col shadow-sm border border-light-gray transition-shadow hover:shadow-md hover:shadow-primary/10">
                    <div className="flex-grow">
                        <div className="flex items-center mb-4">
                            <img src={mentor.avatar} alt={mentor.name} className="w-20 h-20 rounded-full mr-4 border-2 border-primary" />
                            <div>
                                <h4 className="text-xl font-bold text-dark-text">{mentor.name}</h4>
                                <p className="text-mid-text">{mentor.experience} Yrs Exp.</p>
                            </div>
                        </div>
                        <div className="flex justify-between text-sm my-4 bg-light-hover p-3 rounded-md">
                            <div className="text-center">
                                <p className="text-mid-text">Profit Ratio</p>
                                <p className="font-bold text-success">{mentor.profitRatio}%</p>
                            </div>
                             <div className="text-center">
                                <p className="text-mid-text">Price</p>
                                <p className="font-bold text-dark-text">${mentor.price}/mo</p>
                            </div>
                        </div>
                        <p className="text-mid-text text-sm mb-4">Instruments: {mentor.instruments.join(', ')}</p>
                    </div>
                    <button onClick={() => onViewMentor(mentor)} className="w-full mt-auto bg-primary hover:bg-primary-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        View Profile & Posts
                    </button>
                </div>
            ))}
        </div>
    </div>
);

const EducationContentPage: React.FC<{ article: EducationArticle; onBack: () => void }> = ({ article, onBack }) => (
    <div className="p-8 bg-light-bg min-h-screen">
        <button onClick={onBack} className="flex items-center text-primary hover:underline mb-6 font-semibold">
            <Icon name="arrowRight" className="w-5 h-5 mr-2 transform rotate-180" />
            Back to Education Hub
        </button>
        <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray max-w-3xl mx-auto">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${article.difficulty === 'Beginner' ? 'text-success bg-success/10' : article.difficulty === 'Intermediate' ? 'text-warning bg-warning/10' : 'text-danger bg-danger/10'}`}>
                {article.difficulty}
            </span>
            <h1 className="text-3xl font-bold mt-3 mb-4 text-dark-text">{article.title}</h1>

            {article.type === 'video' && article.videoUrl ? (
                <div className="mt-6">
                    <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                        <iframe
                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                            src={article.videoUrl}
                            title={article.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                     <div className="text-dark-text prose prose-indigo max-w-none mt-4" dangerouslySetInnerHTML={{ __html: article.content }}></div>
                </div>
            ) : (
                <div className="text-dark-text prose prose-indigo max-w-none" dangerouslySetInnerHTML={{ __html: article.content }}></div>
            )}
        </div>
    </div>
);


const EducationPage: React.FC<{onViewContent: (article: EducationArticle) => void}> = ({ onViewContent }) => {
    const categories = [...new Set(MOCK_EDUCATION_ARTICLES.map(a => a.category))];

    const difficultyColor = (difficulty: string) => {
        switch(difficulty) {
            case 'Beginner': return 'text-success bg-success/10';
            case 'Intermediate': return 'text-warning bg-warning/10';
            case 'Advanced': return 'text-danger bg-danger/10';
            default: return 'text-mid-text bg-light-gray';
        }
    };

    const getActionText = (type: 'article' | 'book' | 'video') => {
        switch(type) {
            case 'book': return 'Read Book';
            case 'video': return 'Watch Video';
            default: return 'Read Article';
        }
    };
    
    const getTypeIcon = (type: 'article' | 'book' | 'video') => {
        switch(type) {
            case 'book': return 'book';
            case 'video': return 'play';
            default: return 'education';
        }
    }


    return (
        <div className="p-8 bg-light-bg min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-dark-text">Education Hub</h1>
            <p className="text-lg text-mid-text mb-8">Empower your trading with knowledge. Explore our curated guides and tutorials.</p>
            <div className="space-y-12">
                {categories.map(category => (
                    <div key={category}>
                        <h2 className="text-2xl font-semibold mb-4 border-l-4 border-primary pl-4 text-dark-text">{category}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {MOCK_EDUCATION_ARTICLES.filter(a => a.category === category).map(item => (
                                <div key={item.id} className="bg-light-surface p-6 rounded-lg flex flex-col justify-between shadow-sm border border-light-gray hover:shadow-md hover:shadow-primary/10 transition-shadow">
                                    <div>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${difficultyColor(item.difficulty)}`}>{item.difficulty}</span>
                                            <Icon name={getTypeIcon(item.type)} className="w-5 h-5 text-mid-text" />
                                        </div>
                                        <h3 className="text-xl font-bold mt-3 mb-2 text-dark-text">{item.title}</h3>
                                        <p className="text-mid-text text-sm mb-4">{item.summary}</p>
                                    </div>
                                    <button 
                                        onClick={() => onViewContent(item)} 
                                        className="flex items-center text-primary font-semibold text-sm hover:underline mt-4"
                                    >
                                        {getActionText(item.type)} <Icon name="arrowRight" className="w-4 h-4 ml-2" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- START NEW SETTINGS COMPONENTS ---

const ProfileSettings: React.FC<{user: User, setUser: React.Dispatch<React.SetStateAction<User | null>>, showToast: (message: string, type?: 'success' | 'info' | 'error') => void}> = ({user, setUser, showToast}) => {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null);
    const [userName, setUserName] = useState(user.name);
    const [userEmail, setUserEmail] = useState(user.email);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setAvatarPreview(event.target!.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        setUser(prev => prev ? {
            ...prev,
            name: userName,
            email: userEmail,
            avatar: avatarPreview !== null ? avatarPreview : undefined,
        } : null);
        showToast("Profile saved successfully!", 'success');
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast("New passwords do not match.", 'error');
            return;
        }
        if (newPassword.length < 8) {
            showToast("New password must be at least 8 characters long.", 'error');
            return;
        }
        // In a real app, you'd call an API here.
        showToast("Password changed successfully!", 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
     <div className="space-y-8">
        <form className="space-y-6" onSubmit={handleProfileSave}>
            <h2 className="text-xl font-semibold text-dark-text">Account Information</h2>
            <div className="flex items-center space-x-4">
                <img src={avatarPreview || `https://i.pravatar.cc/150?u=${user.email}`} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                <div>
                    <label htmlFor="avatar-upload" className="cursor-pointer bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded">
                        Change Picture
                    </label>
                    <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    <p className="text-xs text-mid-text mt-2">JPG, GIF or PNG. 1MB max.</p>
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-dark-text">Name</label>
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="mt-1 block w-full bg-light-hover border-light-gray rounded-md shadow-sm focus:ring-primary focus:border-primary text-dark-text" />
            </div>
             <div>
                <label className="block text-sm font-medium text-dark-text">Email Address</label>
                <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="mt-1 block w-full bg-light-hover border-light-gray rounded-md shadow-sm focus:ring-primary focus:border-primary text-dark-text" />
            </div>
            <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded">Save Changes</button>
        </form>

        <form className="space-y-6 pt-8 border-t border-light-gray" onSubmit={handlePasswordChange}>
            <h2 className="text-xl font-semibold text-dark-text">Change Password</h2>
            <div>
                <label className="block text-sm font-medium text-dark-text">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 block w-full bg-light-hover border-light-gray rounded-md shadow-sm focus:ring-primary focus:border-primary text-dark-text" />
            </div>
            <div>
                <label className="block text-sm font-medium text-dark-text">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full bg-light-hover border-light-gray rounded-md shadow-sm focus:ring-primary focus:border-primary text-dark-text" />
            </div>
            <div>
                <label className="block text-sm font-medium text-dark-text">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full bg-light-hover border-light-gray rounded-md shadow-sm focus:ring-primary focus:border-primary text-dark-text" />
            </div>
            <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded">Update Password</button>
        </form>
    </div>
)};

const BillingSettings: React.FC<{user: User}> = ({user}) => {
    const [autoRenew, setAutoRenew] = useState(true);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-dark-text">Current Plan: <span className="text-primary">{user.subscribedPlan}</span></h2>
            <div className="space-y-4">
                <div className="bg-light-hover p-4 rounded-lg border border-light-gray">
                    <p className="text-sm text-mid-text">Renewal Date</p>
                    <p className="font-semibold text-dark-text">November 27, 2024</p>
                </div>
                <div className="bg-light-hover p-4 rounded-lg border border-light-gray flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-dark-text">Auto-Renewal</p>
                        <p className="text-sm text-mid-text">{autoRenew ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={autoRenew} onChange={() => setAutoRenew(!autoRenew)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-light-gray rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                <div className="pt-4 flex flex-wrap gap-4">
                     <button className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded">Change Plan</button>
                     <button className="bg-secondary hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Renew Now</button>
                     <button className="text-danger hover:underline font-semibold py-2 px-4 rounded">Cancel Subscription</button>
                </div>
            </div>
        </div>
    );
};

const NotificationSettings: React.FC<{user: User, setUser: React.Dispatch<React.SetStateAction<User | null>>, showToast: (message: string, type?: 'success' | 'info' | 'error') => void;}> = ({user, setUser, showToast}) => {
    const [telegramInput, setTelegramInput] = useState(user.telegramNumber || '');
    const [isConnecting, setIsConnecting] = useState(false);
    
    const isPremiumTier = user.subscribedPlan === PlanName.Pro || user.subscribedPlan === PlanName.Premium;

    const handleTelegramConnect = () => {
        if (!telegramInput.match(/^\+?[1-9]\d{1,14}$/)) {
            showToast("Please enter a valid phone number with country code.", 'error');
            return;
        }
        setIsConnecting(true);
        setTimeout(() => {
            setUser(prev => prev ? { ...prev, telegramNumber: telegramInput } : null);
            setIsConnecting(false);
            showToast("Telegram connected successfully!", 'success');
        }, 1500);
    };

    const handleTelegramDisconnect = () => {
        setUser(prev => prev ? { ...prev, telegramNumber: undefined } : null);
        setTelegramInput('');
        showToast("Telegram disconnected.", 'info');
    };
    
    if (!isPremiumTier) {
        return (
            <div className="text-center p-8 bg-light-hover rounded-lg border border-light-gray">
                <Icon name="info" className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-bold text-dark-text">Upgrade for Instant Notifications</h3>
                <p className="text-mid-text mt-2">To receive signal alerts via Telegram or Email, please upgrade to a Pro or Premium plan.</p>
                <button className="mt-4 bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-lg">View Plans</button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold mb-4 text-dark-text">Telegram Notifications</h2>
                <div className="bg-light-hover p-6 rounded-lg border border-light-gray">
                    {user.telegramNumber ? (
                        <div className="flex items-center justify-between">
                            <p className="text-dark-text">Connected as: <span className="font-semibold">{user.telegramNumber}</span></p>
                            <button onClick={handleTelegramDisconnect} className="bg-danger hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Disconnect</button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <input type="tel" value={telegramInput} onChange={e => setTelegramInput(e.target.value)} placeholder="+1234567890" className="flex-1 bg-light-surface border-light-gray rounded-md shadow-sm focus:ring-primary focus:border-primary p-2 text-dark-text" disabled={isConnecting} />
                            <button onClick={handleTelegramConnect} disabled={isConnecting || !telegramInput} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded w-32 disabled:bg-light-gray disabled:text-mid-text disabled:cursor-not-allowed">
                                {isConnecting ? 'Connecting...' : 'Connect'}
                            </button>
                        </div>
                    )}
                    <div className="mt-4 text-sm text-mid-text space-y-2 prose prose-sm max-w-none">
                        <h4 className="font-semibold text-dark-text">How to connect:</h4>
                        <ol className="list-decimal pl-5">
                            <li>Enter your full phone number including the country code (e.g., +1 for USA).</li>
                            <li>Click "Connect". You will receive a message from our bot on Telegram.</li>
                            <li>Start the chat with the bot and enter the confirmation code provided on screen.</li>
                            <li>You're all set to receive instant signal notifications!</li>
                        </ol>
                    </div>
                </div>
            </div>
            
            <div>
                <h2 className="text-xl font-semibold mb-4 text-dark-text">Email Notifications</h2>
                 <div className="bg-light-hover p-6 rounded-lg border border-light-gray">
                    <div className="flex items-center justify-between">
                        <p className="text-dark-text">Send notifications to: <span className="font-semibold">{user.email}</span></p>
                        <button className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded">Send Test Email</button>
                    </div>
                    <div className="mt-4 text-sm text-mid-text space-y-2 prose prose-sm max-w-none">
                        <h4 className="font-semibold text-dark-text">How it works:</h4>
                        <ol className="list-decimal pl-5">
                            <li>Signal notifications will be automatically sent to your registered email address.</li>
                            <li>To ensure delivery, please add <code className="text-xs bg-light-surface px-1 py-0.5 rounded">alerts@tradecompanion.app</code> to your contacts.</li>
                            <li>You can change your registered email in the "Profile" tab.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SettingsPage: React.FC<{user: User, setUser: React.Dispatch<React.SetStateAction<User | null>>, showToast: (message: string, type?: 'success' | 'info' | 'error') => void}> = ({ user, setUser, showToast }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'notifications'>('profile');

    const TabButton: React.FC<{tabName: 'profile' | 'billing' | 'notifications', label: string}> = ({tabName, label}) => (
        <button 
            onClick={() => setActiveTab(tabName)} 
            className={`px-4 py-2 font-semibold transition-colors text-sm rounded-md ${activeTab === tabName ? 'bg-primary text-white' : 'text-mid-text hover:bg-light-hover'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-dark-text">Settings</h1>
            <div className="flex flex-col lg:flex-row gap-8">
                <aside className="lg:w-1/4">
                    <div className="space-y-2 flex lg:flex-col flex-wrap">
                        <TabButton tabName="profile" label="Profile" />
                        <TabButton tabName="billing" label="Billing & Subscription" />
                        <TabButton tabName="notifications" label="Notifications" />
                    </div>
                </aside>
                <main className="flex-1 bg-light-surface p-8 rounded-lg shadow-sm border border-light-gray">
                    {activeTab === 'profile' && <ProfileSettings user={user} setUser={setUser} showToast={showToast} />}
                    {activeTab === 'billing' && <BillingSettings user={user} />}
                    {activeTab === 'notifications' && <NotificationSettings user={user} setUser={setUser} showToast={showToast} />}
                </main>
            </div>
        </div>
    );
};


const ApplyMentorPage: React.FC = () => {
    const [stage, setStage] = useState<'form' | 'submitted' | 'challenge'>('form');

    const renderContent = () => {
        switch (stage) {
            case 'form':
                return (
                    <div className="bg-light-surface p-8 rounded-lg shadow-sm border border-light-gray max-w-2xl">
                        <p className="text-mid-text mb-6">Share your expertise and earn by mentoring other traders. Fill out the form below to begin your application.</p>
                        <form onSubmit={(e) => { e.preventDefault(); setStage('submitted'); }} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-dark-text">Link to Trading Performance (e.g., MyFxBook)</label>
                                <input type="url" placeholder="https://..." required className="mt-1 block w-full bg-light-hover border-light-gray rounded-md shadow-sm focus:ring-primary focus:border-primary text-dark-text" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-text">What is your core risk management philosophy?</label>
                                <textarea rows={3} required placeholder="e.g., I never risk more than 1% per trade..." className="mt-1 block w-full bg-light-hover border-light-gray rounded-md shadow-sm focus:ring-primary focus:border-primary text-dark-text"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-text">How do you handle a losing streak?</label>
                                <textarea rows={3} required placeholder="e.g., I take a break, analyze my trades, and reduce my position size..." className="mt-1 block w-full bg-light-hover border-light-gray rounded-md shadow-sm focus:ring-primary focus:border-primary text-dark-text"></textarea>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-dark-text">Describe your primary trading strategy.</label>
                                <textarea rows={4} required placeholder="e.g., I focus on supply and demand zones on the 4H chart..." className="mt-1 block w-full bg-light-hover border-light-gray rounded-md shadow-sm focus:ring-primary focus:border-primary text-dark-text"></textarea>
                            </div>
                            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg">Submit Application</button>
                        </form>
                    </div>
                );
            case 'submitted':
                return (
                    <div className="bg-light-surface p-8 rounded-lg shadow-sm border border-light-gray max-w-2xl text-center">
                        <Icon name="check" className="w-16 h-16 mx-auto text-primary mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-dark-text">Application Received!</h2>
                        <p className="text-mid-text mb-6">Thank you. The final step is to prove your skills in a controlled environment.</p>
                        <div className="bg-light-hover p-6 rounded-lg text-left mb-6 border border-light-gray">
                            <h3 className="font-semibold text-lg mb-2 text-dark-text">Final Step: The Demo Account Challenge</h3>
                            <p className="text-mid-text text-sm">To complete your verification, you must grow a <strong className="text-dark-text">$10,000</strong> demo account by <strong className="text-success">10%</strong> within <strong className="text-dark-text">30 days</strong>, while keeping the drawdown below <strong className="text-danger">5%</strong>.</p>
                        </div>
                        <button onClick={() => setStage('challenge')} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg">
                            Receive Demo Credentials & Start Challenge
                        </button>
                    </div>
                );
            case 'challenge':
                 return (
                    <div className="bg-light-surface p-8 rounded-lg shadow-sm border border-light-gray max-w-2xl">
                        <h2 className="text-2xl font-bold mb-2 text-center text-dark-text">Demo Challenge Active</h2>
                        <p className="text-mid-text mb-6 text-center">Your credentials are below. We will monitor your progress and notify you upon completion.</p>
                        <div className="bg-light-hover p-4 rounded-lg space-y-2 mb-6 text-sm border border-light-gray">
                            <p className="text-dark-text"><strong>Account Number:</strong> MENTOR-DEMO-112358</p>
                            <p className="text-dark-text"><strong>Password:</strong> yJ1aW8pZGFzMTIz</p>
                            <p className="text-dark-text"><strong>Server:</strong> TradeCompanion-Demo</p>
                        </div>
                         <h3 className="font-semibold text-lg mb-4 text-dark-text">Live Progress</h3>
                         <div className="space-y-4">
                             <div>
                                 <div className="flex justify-between text-sm mb-1 text-dark-text">
                                     <span>Profit Target (+$1,000)</span>
                                     <span className="font-semibold text-success">$0 / $1,000</span>
                                 </div>
                                 <div className="w-full bg-light-gray rounded-full h-2.5">
                                     <div className="bg-success h-2.5 rounded-full" style={{width: '0%'}}></div>
                                 </div>
                             </div>
                             <div>
                                 <div className="flex justify-between text-sm mb-1 text-dark-text">
                                     <span>Max Drawdown (&lt; -$500)</span>
                                     <span className="font-semibold text-danger">$0 / -$500</span>
                                 </div>
                                 <div className="w-full bg-light-gray rounded-full h-2.5">
                                     <div className="bg-danger h-2.5 rounded-full" style={{width: '0%'}}></div>
                                 </div>
                             </div>
                             <div className="text-center bg-light-hover p-3 rounded-md border border-light-gray">
                                 <p className="text-sm text-mid-text">Time Remaining</p>
                                 <p className="text-xl font-bold text-dark-text">30 Days</p>
                             </div>
                         </div>
                    </div>
                );
        }
    }

    return (
    <div>
        <h1 className="text-3xl font-bold mb-6 text-dark-text">Become a Mentor</h1>
        {renderContent()}
    </div>
    );
};

const NavLink: React.FC<{ view: DashboardView; icon: string; label: string; isCollapsed: boolean; activeView: DashboardView; onViewChange: (view: DashboardView) => void; }> = ({ view, icon, label, isCollapsed, activeView, onViewChange }) => {
    const isActive = activeView === view || (activeView === 'education_content' && view === 'education');
    return (
      <button
        onClick={() => onViewChange(view)}
        className={`relative flex items-center w-full py-3 rounded-lg transition-colors group ${isCollapsed ? 'justify-center' : 'px-4'}
                  ${isActive ? 'text-primary bg-primary/10' : 'text-mid-text hover:bg-light-hover'}`}
        title={isCollapsed ? label : ''}
      >
        <Icon name={icon} className={`w-5 h-5 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''} ${isActive ? 'text-primary' : 'group-hover:text-dark-text'}`} />
        {!isCollapsed && <span className={`font-medium whitespace-nowrap ${isActive ? 'text-dark-text' : ''}`}>{label}</span>}
        {isActive && !isCollapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-primary rounded-r-md"></span>
        )}
      </button>
    );
};


// --- MAIN DASHBOARD COMPONENT ---

const DashboardPage: React.FC<DashboardPageProps> = ({ user, setUser, onLogout, activeView, onViewChange, showToast, theme, toggleTheme }) => {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedEducationArticle, setSelectedEducationArticle] = useState<EducationArticle | null>(null);
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // --- State Lifted for Global Access ---
  const ACTIVE_TRADES_KEY = `active_trades_${user.email}`;
  const TRADE_HISTORY_KEY = `trade_history_${user.email}`;
  const EQUITY_KEY = `currentEquity_${user.email}`;
  const NOTIFICATIONS_KEY = `notifications_${user.email}`;

  const [activeTrades, setActiveTrades] = useState<TradeRecord[]>(() => JSON.parse(localStorage.getItem(ACTIVE_TRADES_KEY) || '[]'));
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>(() => JSON.parse(localStorage.getItem(TRADE_HISTORY_KEY) || '[]'));
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    if (saved.length > 0) return saved;
    // If no saved notifications, add some initial ones to showcase the feature.
    return [
        { id: 'promo-1', message: 'Premium plan is 20% off this week!', timestamp: new Date().toISOString(), isRead: false, linkTo: 'settings', type: 'promo' },
        { id: 'update-1', message: 'The Analytics page has been updated with new charts.', timestamp: new Date(Date.now() - 86400000).toISOString(), isRead: true, linkTo: 'analytics', type: 'app_update' },
    ];
  });
  
  const { canUseFeature, incrementUsage } = useUsageTracker(user);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: Notification = {
        ...notification,
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    showToast(notification.message, 'info');
  }, [showToast]);

  // --- Automatic Signal Scanner ---
  useEffect(() => {
    const scannerInterval = setInterval(async () => {
      // Don't scan if the user is not on the dashboard or AI signals page
      if (activeView !== 'dashboard' && activeView !== 'ai_signals') return;

      // Check user's plan and daily signal limit
      if (!user.subscribedPlan || user.subscribedPlan === PlanName.Free || !canUseFeature('aiSignal')) {
        return;
      }

      try {
        const signalData = await scanForSignals(user.subscribedPlan);
        
        if (signalData && signalData.signalFound) {
            const settings = JSON.parse(localStorage.getItem(`tradeSettings_${user.email}`) || '{"balance": "10000", "risk": "1.0"}');
            const account_size = parseFloat(settings.balance);
            const risk_pct = parseFloat(settings.risk);
            const risk_amount = account_size * (risk_pct / 100);
            const stop_dist = Math.abs(signalData.entryPrice - signalData.stopLoss);
            
            const getPipStep = (instrument: string) => instrument.includes('JPY') ? 0.01 : 0.0001;
            const pip_step = signalData.instrument.includes('XAU') || signalData.instrument.includes('BTC') ? 0.01 : getPipStep(signalData.instrument);
            const contractSize = signalData.instrument.includes('XAU') ? 100 : signalData.instrument.includes('BTC') ? 1 : 100000;
            const value_per_unit = signalData.instrument.endsWith('USD') ? pip_step : pip_step / signalData.entryPrice;
            const risk_per_unit = stop_dist * value_per_unit;
            const units = risk_per_unit > 0 ? risk_amount / risk_per_unit : 0;
            const lotSize = units / contractSize;
            
            const currentEquity = parseFloat(localStorage.getItem(EQUITY_KEY) || settings.balance);

            const newTrade: TradeRecord = {
              ...(signalData as Omit<Signal, 'lotSize'|'riskAmount'>),
              id: new Date().toISOString(),
              status: 'active',
              dateTaken: new Date().toISOString(),
              initialEquity: currentEquity,
              takeProfit: signalData.takeProfit1,
              lotSize,
              riskAmount: risk_amount,
            };

            const alreadyExists = activeTrades.some(t => t.instrument === newTrade.instrument && t.type === newTrade.type);
            if (!alreadyExists) {
                incrementUsage('aiSignal');
                setActiveTrades(prev => [newTrade, ...prev]);
                const newNotification: Notification = {
                    id: new Date().toISOString(),
                    message: `New ${newTrade.type} signal for ${newTrade.instrument}!`,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    linkTo: 'ai_signals',
                    type: 'signal',
                };
                setNotifications(prev => [newNotification, ...prev]);
                showToast(newNotification.message, 'success');
            }
        }
      } catch (error) {
        console.error("Error during signal scan:", error);
      }
    }, 30000); // Scan every 30 seconds

    return () => clearInterval(scannerInterval);
  }, [activeView, user, canUseFeature, incrementUsage, showToast, activeTrades, EQUITY_KEY, addNotification]);


  // --- Auto-close Trade Simulation ---
  const autoCloseTrade = useCallback((tradeToClose: TradeRecord) => {
    const settings = JSON.parse(localStorage.getItem(`tradeSettings_${user.email}`) || '{"risk": "1.0"}');
    const riskRewardRatio = 1.5;
    const outcome = Math.random() < 0.7 ? 'win' : 'loss';
    const pnl = outcome === 'win' 
        ? (tradeToClose.riskAmount || 0) * riskRewardRatio 
        : -(tradeToClose.riskAmount || 0);

    const currentEquity = parseFloat(localStorage.getItem(EQUITY_KEY) || '10000');
    const newEquity = currentEquity + pnl;

    const closedTrade: TradeRecord = {
        ...tradeToClose,
        status: outcome,
        pnl,
        finalEquity: newEquity,
        dateClosed: new Date().toISOString(),
    };

    setTradeHistory(prev => [closedTrade, ...prev]);
    localStorage.setItem(EQUITY_KEY, newEquity.toString());
    window.dispatchEvent(new Event('storage'));
    showToast(
        `${tradeToClose.instrument} trade closed as a ${outcome}. P&L: $${pnl.toFixed(2)}`,
        outcome === 'win' ? 'success' : 'error'
    );
  }, [user.email, showToast, EQUITY_KEY]);
  
  useEffect(() => {
    const interval = setInterval(() => {
        setActiveTrades(prevActiveTrades => {
            if (prevActiveTrades.length === 0) return prevActiveTrades;
            let tradeClosed = false;
            const remainingTrades = prevActiveTrades.filter(trade => {
                if (Math.random() < 0.15) { // 15% chance to close each interval
                    autoCloseTrade(trade);
                    tradeClosed = true;
                    return false;
                }
                return true;
            });
            return tradeClosed ? remainingTrades : prevActiveTrades;
        });
    }, 5000);
    return () => clearInterval(interval);
  }, [autoCloseTrade]);

  // --- Data Persistence ---
  useEffect(() => {
      localStorage.setItem(ACTIVE_TRADES_KEY, JSON.stringify(activeTrades));
  }, [activeTrades, ACTIVE_TRADES_KEY]);

  useEffect(() => {
      localStorage.setItem(TRADE_HISTORY_KEY, JSON.stringify(tradeHistory));
  }, [tradeHistory, TRADE_HISTORY_KEY]);
  
  useEffect(() => {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications, NOTIFICATIONS_KEY]);


  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  const handleViewMentor = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    onViewChange('mentor_profile');
  };

  const handleBackToMentors = () => {
    setSelectedMentor(null);
    onViewChange('mentors');
  };

  const handleViewEducationContent = (article: EducationArticle) => {
    setSelectedEducationArticle(article);
    onViewChange('education_content');
  };

  const handleBackToEducation = () => {
    setSelectedEducationArticle(null);
    onViewChange('education');
  };


  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardOverview user={user} onViewChange={onViewChange} activeTrades={activeTrades} tradeHistory={tradeHistory} />;
      case 'ai_signals': return <AISignalsPage user={user} showToast={showToast} activeTrades={activeTrades} tradeHistory={tradeHistory} />;
      case 'mentors': return <MentorPage onViewMentor={handleViewMentor} user={user} />;
      case 'analytics': return <AnalyticsPage user={user} />;
      case 'education': return <EducationPage onViewContent={handleViewEducationContent} />;
      case 'education_content': return selectedEducationArticle ? <EducationContentPage article={selectedEducationArticle} onBack={handleBackToEducation} /> : <EducationPage onViewContent={handleViewEducationContent} />;
      case 'lot_size_calculator': return <LotSizeCalculatorPage user={user} />;
      case 'market_chart': return <MarketChartPage theme={theme} />;
      case 'settings': return <SettingsPage user={user} setUser={setUser} showToast={showToast} />;
      case 'apply_mentor': return <ApplyMentorPage />;
      case 'mentor_dashboard': return <MentorDashboard user={user} showToast={showToast} addNotification={addNotification} />;
      case 'mentor_profile': return selectedMentor ? <MentorProfilePage mentor={selectedMentor} onBack={handleBackToMentors} /> : <MentorPage onViewMentor={handleViewMentor} user={user} />;
      default: return <DashboardOverview user={user} onViewChange={onViewChange} activeTrades={activeTrades} tradeHistory={tradeHistory} />;
    }
  };

  return (
    <div className="flex h-screen bg-light-bg text-dark-text">
      {/* Sidebar */}
      <aside className={`bg-light-surface p-4 flex flex-col border-r border-light-gray shadow-sm transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex items-center justify-between px-2 mb-4">
            {!isSidebarCollapsed && <h1 className="text-2xl font-bold text-primary">Trade Companion</h1>}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className={`p-1 rounded-md hover:bg-light-hover text-mid-text ${isSidebarCollapsed && 'mx-auto'}`}>
                <Icon name={isSidebarCollapsed ? "arrowRight" : "arrowLeft"} className="w-6 h-6" />
            </button>
        </div>
        <div className={`px-2 mb-6 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
            <label htmlFor="theme-toggle" className="theme-toggle-label no-print">
                <input
                    id="theme-toggle"
                    type="checkbox"
                    className="theme-toggle-input"
                    onChange={toggleTheme}
                    checked={theme === 'dark'}
                    aria-label="Toggle theme"
                />
                <span className="theme-toggle-slider"></span>
                <span className="theme-toggle-icon sun-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFD700" stroke="none">
                        <circle cx="12" cy="12" r="5"></circle>
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"></path>
                    </svg>
                </span>
                <span className="theme-toggle-icon moon-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4A5568" stroke="none">
                        <path d="M21.64,13.24a1,1,0,0,0-1.12.33A6.87,6.87,0,0,1,11.33,5.1a1,1,0,0,0-.33-1.12,1,1,0,0,0-1.29.21A10,10,0,1,0,21.93,14.41,1,1,0,0,0,21.64,13.24Z" />
                        <path d="M15.5 6 A 0.5 0.5 0 0 1 16 6.5 A 0.5 0.5 0 0 1 15.5 7 A 0.5 0.5 0 0 1 15 6.5 A 0.5 0.5 0 0 1 15.5 6 Z" />
                        <path d="M18.5 9 A 0.5 0.5 0 0 1 19 9.5 A 0.5 0.5 0 0 1 18.5 10 A 0.5 0.5 0 0 1 18 9.5 A 0.5 0.5 0 0 1 18.5 9 Z" />
                        <path d="M14.5 12 A 0.5 0.5 0 0 1 15 12.5 A 0.5 0.5 0 0 1 14.5 13 A 0.5 0.5 0 0 1 14 12.5 A 0.5 0.5 0 0 1 14.5 12 Z" />
                    </svg>
                </span>
            </label>
        </div>
        <nav className="flex-1 space-y-4">
          <div>
            <p className={`text-xs text-mid-text uppercase font-semibold mb-2 ${isSidebarCollapsed ? 'hidden' : 'px-4'}`}>Navigation</p>
            <NavLink view="dashboard" icon="dashboard" label="Dashboard" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
            <NavLink view="ai_signals" icon="signals" label="AI Signals" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
            <NavLink view="mentors" icon="mentors" label="Mentors" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
            <NavLink view="education" icon="education" label="Education" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
            <NavLink view="analytics" icon="analytics" label="Analytics" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
          </div>
          <div className="pt-4 border-t border-light-gray">
            <p className={`text-xs text-mid-text uppercase font-semibold mb-2 ${isSidebarCollapsed ? 'hidden' : 'px-4'}`}>Tools</p>
            <NavLink view="lot_size_calculator" icon="calculator" label="Lot Size Calculator" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
            <NavLink view="market_chart" icon="chart-bar" label="Market Chart" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
          </div>
           {user.isMentor && (
            <div className="pt-4 border-t border-light-gray">
              <p className={`text-xs text-mid-text uppercase font-semibold mb-2 ${isSidebarCollapsed ? 'hidden' : 'px-4'}`}>Mentor Area</p>
              <NavLink view="mentor_dashboard" icon="mentors" label="Mentor Dashboard" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
            </div>
          )}
        </nav>
        <div className="relative mt-auto pt-4 border-t border-light-gray">
          <button
            onClick={() => setAccountMenuOpen(!isAccountMenuOpen)}
            className={`w-full flex items-center p-3 rounded-lg hover:bg-light-hover ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`} alt="User Avatar" className="w-8 h-8 rounded-full object-cover border border-light-gray flex-shrink-0" />
            {!isSidebarCollapsed && (
                <>
                    <div className="text-left ml-3 flex-1 overflow-hidden">
                      <p className="font-semibold text-sm text-dark-text truncate">{user.name}</p>
                      <p className="text-xs text-mid-text truncate">{user.email}</p>
                    </div>
                    <Icon name="chevronDown" className={`w-5 h-5 text-mid-text transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                </>
            )}
          </button>
          {isAccountMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-light-surface rounded-lg shadow-xl border border-light-gray w-full py-2 z-10">
              <a onClick={() => { onViewChange('settings'); setAccountMenuOpen(false); }} href="#" className="flex items-center px-4 py-2 text-sm text-dark-text hover:bg-light-hover"><Icon name="settings" className="w-5 h-5 mr-2 text-mid-text"/>Settings</a>
              <hr className="border-light-gray my-1" />
              <a onClick={() => { onViewChange('apply_mentor'); setAccountMenuOpen(false); }} href="#" className="flex items-center px-4 py-2 text-sm text-dark-text hover:bg-light-hover"><Icon name="apply" className="w-5 h-5 mr-2 text-mid-text"/>Become a Mentor</a>
              <a onClick={onLogout} href="#" className="flex items-center px-4 py-2 text-sm hover:bg-light-hover text-danger"><Icon name="logout" className="w-5 h-5 mr-2 text-danger"/>Logout</a>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-light-surface border-b border-light-gray p-4 flex justify-between items-center flex-shrink-0">
            <h1 className="text-2xl font-bold text-dark-text capitalize">{activeView.replace(/_/g, ' ')}</h1>
            <div className="flex items-center space-x-4">
                <NotificationBell 
                    notifications={notifications} 
                    setNotifications={setNotifications} 
                    onViewChange={onViewChange}
                />
                <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`} alt="User Avatar" className="w-10 h-10 rounded-full" />
            </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 overflow-y-auto">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;