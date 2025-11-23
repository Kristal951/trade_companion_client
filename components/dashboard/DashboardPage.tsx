
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DashboardView, User, EducationArticle, PlanName, Mentor, MentorPost, TradeRecord, Notification, Signal, NotificationType, RecentSignal } from '../../types';
import Icon from '../ui/Icon';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Sector, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceLine } from 'recharts';
import AISignalsPage from '../signals/AISignalsPage';
import LotSizeCalculatorPage from '../calculator/LotSizeCalculatorPage';
import MentorDashboard from '../mentors/MentorDashboard';
import MentorProfilePage from '../mentors/MentorProfilePage';
import MarketChartPage from './MarketChartPage';
import { scanForSignals } from '../../services/geminiService';
import NotificationBell from '../ui/NotificationBell';
import { useUsageTracker } from '../../hooks/useUsageTracker';
import { getLivePrices } from '../../services/marketDataService';
import { instrumentDefinitions } from '../../config/instruments';
import FollowersPage from '../mentors/FollowersPage';
import SecureContent from '../ui/SecureContent';
import { PLAN_FEATURES } from '../../config/plans';

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

const MOCK_RECENT_SIGNALS_JOHN: RecentSignal[] = [
    { id: 's1', instrument: 'EUR/USD', direction: 'BUY', entry: '1.0750', stopLoss: '1.0720', takeProfit: '1.0800', outcome: 'win', timestamp: '2023-10-26T10:00:00Z', pnl: 500 },
    { id: 's2', instrument: 'GBP/JPY', direction: 'SELL', entry: '185.50', stopLoss: '186.00', takeProfit: '184.50', outcome: 'win', timestamp: '2023-10-25T15:00:00Z', pnl: 680 },
    { id: 's3', instrument: 'USD/CAD', direction: 'BUY', entry: '1.3600', stopLoss: '1.3570', takeProfit: '1.3620', outcome: 'loss', timestamp: '2023-10-24T08:00:00Z', pnl: -220 },
];

const MOCK_RECENT_SIGNALS_ANNA: RecentSignal[] = [
    { id: 's4', instrument: 'XAU/USD', direction: 'SELL', entry: '2350.00', stopLoss: '2360.00', takeProfit: '2320.00', outcome: 'win', timestamp: '2023-10-27T11:00:00Z', pnl: 3000 },
    { id: 's5', instrument: 'US30', direction: 'BUY', entry: '39000', stopLoss: '38900', takeProfit: '39200', outcome: 'win', timestamp: '2023-10-26T18:00:00Z', pnl: 2000 },
];

const MOCK_SUBSCRIBER_GROWTH_JOHN = [
    { month: 'Jan', subscribers: 10 }, { month: 'Feb', subscribers: 15 }, { month: 'Mar', subscribers: 22 }, { month: 'Apr', subscribers: 28 }, { month: 'May', subscribers: 35 }, { month: 'Jun', subscribers: 42 }
];

const MOCK_SUBSCRIBER_GROWTH_ANNA = [
    { month: 'Jan', subscribers: 25 }, { month: 'Feb', subscribers: 30 }, { month: 'Mar', subscribers: 45 }, { month: 'Apr', subscribers: 55 }, { month: 'May', subscribers: 70 }, { month: 'Jun', subscribers: 88 }
];

const MOCK_MENTOR_ANALYTICS = {
  earningsData: [
    { month: 'Jan', earnings: 1485 }, { month: 'Feb', earnings: 1782 }, { month: 'Mar', earnings: 2178 },
    { month: 'Apr', earnings: 2772 }, { month: 'May', earnings: 3465 }, { month: 'Jun', earnings: 4158 },
  ],
  subscriberData: [
    { month: 'Jan', new: 5, churned: -1 }, { month: 'Feb', new: 7, churned: -2 }, { month: 'Mar', new: 8, churned: -1 },
    { month: 'Apr', new: 10, churned: -3 }, { month: 'May', new: 12, churned: -2 }, { month: 'Jun', new: 15, churned: -4 },
  ],
  ratingDistribution: [
    { rating: 5, count: 85 }, { rating: 4, count: 32 }, { rating: 3, count: 5 },
    { rating: 2, count: 1 }, { rating: 1, count: 1 },
  ],
  topSignals: MOCK_RECENT_SIGNALS_JOHN.filter(s => s.outcome === 'win').sort((a, b) => (b.pnl || 0) - (a.pnl || 0)).slice(0, 3),
};

const MOCK_MENTORS_LIST: Mentor[] = [
    { id: 1, name: 'John Forex', avatar: 'https://picsum.photos/seed/mentor1/200', experience: 10, profitRatio: 85, roi: 12.5, instruments: ['EUR/USD', 'GBP/JPY', 'USD/CAD'], price: 99, strategy: 'Specializing in high-frequency scalping strategies and market psychology based on order flow.', posts: MOCK_MENTOR_POSTS, certifications: [{name: 'Pro Trader Certification', url: '#'}, {name: 'MyFxBook Verified History', url: '#'}], recentSignals: MOCK_RECENT_SIGNALS_JOHN, subscriberGrowth: MOCK_SUBSCRIBER_GROWTH_JOHN, rating: 4.8, reviewsCount: 124, analytics: MOCK_MENTOR_ANALYTICS },
    { id: 2, name: 'Anna Indicators', avatar: 'https://picsum.photos/seed/mentor2/200', experience: 8, profitRatio: 92, roi: 18.2, instruments: ['XAU/USD', 'US30', 'NASDAQ'], price: 149, strategy: 'Master of technical analysis using custom-developed indicators and algorithmic trading systems.', posts: [], certifications: [{name: 'Funded Prop Firm Payout', url: '#'}], recentSignals: MOCK_RECENT_SIGNALS_ANNA, subscriberGrowth: MOCK_SUBSCRIBER_GROWTH_ANNA, rating: 4.9, reviewsCount: 98 },
    { id: 3, name: 'Mike Waves', avatar: 'https://picsum.photos/seed/mentor3/200', experience: 12, profitRatio: 88, roi: 28.0, instruments: ['BTC/USD', 'ETH/USD'], price: 129, strategy: 'Expert in Elliot Wave theory and harmonic patterns, primarily focusing on the cryptocurrency markets.', posts: [], recentSignals: [], subscriberGrowth: [], rating: 4.7, reviewsCount: 75 },
    { id: 4, name: 'Sarah Trends', avatar: 'https://picsum.photos/seed/mentor4/200', experience: 7, profitRatio: 90, roi: 29.8, instruments: ['NASDAQ', 'OIL', 'SPX500'], price: 119, strategy: 'Trend-following expert with a focus on macroeconomic analysis and long-term position trades.', posts: [], certifications: [{name: 'Certified Market Technician (CMT)', url: '#'}] , recentSignals: [], subscriberGrowth: [], rating: 4.8, reviewsCount: 56 },
];

const MOCK_EDUCATION_ARTICLES: EducationArticle[] = [
    { 
        id: 1, 
        category: "Forex Basics", 
        title: "What is Forex Trading? (Masterclass)", 
        summary: "A comprehensive deep-dive into the foreign exchange market. Learn the history, the players, and the mechanics of the world's largest financial market.", 
        difficulty: "Beginner", 
        type: "article", 
        content: `
        <h2>The World's Largest Marketplace</h2>
        <p>Forex, also known as foreign exchange, FX, or currency trading, is a decentralized global market where all the world's currencies trade. With an average daily trading volume exceeding <strong>$7.5 trillion</strong>, the forex market dwarfs the New York Stock Exchange (NYSE) and all other equities markets combined. It is the lifeblood of the global economy, facilitating international trade, tourism, and investment.</p>
        
        <p>Unlike stock markets, which operate from a central location (like Wall Street), the forex market is an over-the-counter (OTC) market. This means trades are conducted electronically between computer networks of traders around the world, rather than on one centralized exchange. The market is open 24 hours a day, five and a half days a week, and currencies are traded worldwide in the major financial centers of London, New York, Tokyo, Zurich, Frankfurt, Hong Kong, Singapore, Paris, and Sydney.</p>

        <h3>A Brief History of Forex</h3>
        <p>To understand where we are, we must look back. The modern forex market is a relatively new phenomenon.</p>
        <ul>
            <li><strong>The Gold Standard (1876-1914):</strong> Currencies were pegged to gold. This provided stability but limited monetary policy flexibility.</li>
            <li><strong>Bretton Woods System (1944-1971):</strong> The US Dollar replaced gold as the world's reserve currency, and other currencies were pegged to the dollar.</li>
            <li><strong>The Free Float (1971-Present):</strong> The agreement ended, and currencies began to "float" against one another, with exchange rates determined by supply and demand. This birth of volatility created the modern trading opportunities we see today.</li>
        </ul>

        <h3>Who Trades Forex? The Market Hierarchy</h3>
        <p>Understanding who you are trading against is crucial.</p>
        <ol>
            <li><strong>Central Banks:</strong> The "whales." They intervene to stabilize their nation's currency (e.g., Federal Reserve, ECB).</li>
            <li><strong>Major Banks:</strong> The "Interbank Market." Citibank, JPMorgan, Deutsche Bank. They trade billions daily for themselves and clients.</li>
            <li><strong>Multinational Corporations:</strong> Hedging against currency risk when doing business overseas (e.g., Apple converting sales in Europe back to USD).</li>
            <li><strong>Retail Traders (You):</strong> Individuals trading their own capital. Thanks to the internet and leverage, retail trading has exploded in popularity.</li>
        </ol>

        <h3>Understanding Currency Pairs</h3>
        <p>In Forex, you never simply "buy" a currency; you buy one and sell another simultaneously. They always come in pairs.</p>
        <p>Example: <strong>EUR/USD</strong></p>
        <ul>
            <li><strong>EUR</strong> is the <em>Base Currency</em>.</li>
            <li><strong>USD</strong> is the <em>Quote Currency</em>.</li>
        </ul>
        <p>If EUR/USD = 1.1000, it means 1 Euro costs 1.10 US Dollars.</p>
        <ul>
            <li><strong>Long (Buy):</strong> You believe the Base currency (EUR) will rise against the Quote (USD).</li>
            <li><strong>Short (Sell):</strong> You believe the Base currency (EUR) will fall against the Quote (USD).</li>
        </ul>

        <h3>The Major Trading Sessions</h3>
        <p>Since the market is global, liquidity moves with the sun:</p>
        <ul>
            <li><strong>Sydney Session:</strong> The day begins here. Generally lower volatility.</li>
            <li><strong>Tokyo (Asian) Session:</strong> Focus on JPY, AUD, and NZD pairs.</li>
            <li><strong>London (European) Session:</strong> The volatility hub. London accounts for ~40% of all forex transactions. Huge moves happen here.</li>
            <li><strong>New York (North American) Session:</strong> High volatility, especially during the "Overlap" (8:00 AM - 12:00 PM EST) when both London and New York are open.</li>
        </ul>

        <h3>Why Trade Forex?</h3>
        <p><strong>Liquidity:</strong> You can enter and exit positions instantly.<br>
        <strong>Leverage:</strong> You can control large positions with small capital (explained in our Leverage guide).<br>
        <strong>24/5 Access:</strong> Trade on your schedule.<br>
        <strong>Low Costs:</strong> Most brokers charge no commission, making money on the "spread" (difference between buy and sell price).</p>

        <p><em>Forex trading offers immense opportunities, but it demands respect. It is not a get-rich-quick scheme; it is a skill that requires discipline, analysis, and emotional control.</em></p>
        ` 
    },
    { 
        id: 2, 
        category: "Forex Basics", 
        title: "Understanding Pips, Lots, and Leverage", 
        summary: "The math of trading explained. Master the concepts of Pip value calculation, Lot sizing, and the double-edged sword of Leverage.", 
        difficulty: "Beginner", 
        type: "article", 
        content: `
        <h2>The Mathematics of Money</h2>
        <p>Before you place a single trade, you must understand the mechanics of how profit and loss are calculated. Three concepts form the foundation of every forex transaction: Pips, Lots, and Leverage.</p>

        <h3>1. What is a Pip?</h3>
        <p>PIP stands for <strong>"Percentage in Point"</strong> or "Price Interest Point." It is the smallest standardized unit of price change in a currency pair.</p>
        
        <h4>Standard Pairs (4 Decimals)</h4>
        <p>For most pairs (EUR/USD, GBP/USD), a pip is the <strong>4th decimal place</strong> (0.0001).</p>
        <p><em>Example:</em> If EUR/USD moves from 1.1050 to 1.1051, that is a <strong>1 pip</strong> rise.</p>

        <h4>Yen Pairs (2 Decimals)</h4>
        <p>For Japanese Yen pairs (USD/JPY, GBP/JPY), a pip is the <strong>2nd decimal place</strong> (0.01).</p>
        <p><em>Example:</em> If USD/JPY moves from 150.00 to 150.01, that is a <strong>1 pip</strong> rise.</p>
        
        <p><strong>Pipettes:</strong> Many brokers now use 5-digit precision (or 3 for JPY). The 5th decimal is a "pipette" (1/10th of a pip).</p>

        <h3>2. What is a Lot?</h3>
        <p>You don't trade "dollars" or "euros" directly; you trade <strong>Lots</strong>. A Lot is a standardized batch of currency units.</p>
        
        <div class="overflow-x-auto">
            <table class="min-w-full border border-light-gray mt-4 mb-4">
                <thead>
                    <tr class="bg-light-hover">
                        <th class="p-2 border">Lot Type</th>
                        <th class="p-2 border">Units of Base Currency</th>
                        <th class="p-2 border">Volume</th>
                        <th class="p-2 border">Approx value per pip (USD)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="p-2 border">Standard Lot</td>
                        <td class="p-2 border">100,000</td>
                        <td class="p-2 border">1.00</td>
                        <td class="p-2 border">$10.00</td>
                    </tr>
                    <tr>
                        <td class="p-2 border">Mini Lot</td>
                        <td class="p-2 border">10,000</td>
                        <td class="p-2 border">0.10</td>
                        <td class="p-2 border">$1.00</td>
                    </tr>
                    <tr>
                        <td class="p-2 border">Micro Lot</td>
                        <td class="p-2 border">1,000</td>
                        <td class="p-2 border">0.01</td>
                        <td class="p-2 border">$0.10</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <p><strong>Formula for Pip Value:</strong> <code>(0.0001 / Current Exchange Rate) * Lot Size</code>.</p>
        <p>Fortunately, our <strong>Lot Size Calculator</strong> tool does this math for you automatically.</p>

        <h3>3. Understanding Leverage</h3>
        <p>Leverage is the ability to control a large amount of money using none or very little of your own money and borrowing the rest. It is expressed as a ratio (e.g., 1:50, 1:100, 1:500).</p>

        <h4>How it works:</h4>
        <p>With <strong>1:100 leverage</strong>, every $1 in your account can control $100 in the market.</p>
        <ul>
            <li>To open a $100,000 position (1 Standard Lot), you don't need $100,000.</li>
            <li>You only need <strong>$1,000</strong> in <strong>Margin</strong> (Deposit).</li>
        </ul>

        <h4>The Double-Edged Sword</h4>
        <p>Leverage magnifies both profits and losses.</p>
        <p><em>Scenario: You buy 1 Lot of EUR/USD ($100,000 position).</em></p>
        <ul>
            <li><strong>Price moves UP 1% (100 pips):</strong><br> You gain $1,000. If your account was $1,000, you just made <strong>100% profit</strong>.</li>
            <li><strong>Price moves DOWN 1% (100 pips):</strong><br> You lose $1,000. If your account was $1,000, you just lost <strong>100% of your capital</strong> (Margin Call).</li>
        </ul>

        <h3>Risk Management</h3>
        <p>Because of leverage, risk management is not optional—it is survival.</p>
        <ol>
            <li><strong>Never risk more than 1-2%</strong> of your account balance on a single trade.</li>
            <li><strong>Always use a Stop Loss.</strong> This is an automatic order to close the trade if price moves against you by a certain amount.</li>
            <li><strong>Understand Margin Call.</strong> If your floating losses eat up your free margin, your broker will automatically close your trades to protect their loan.</li>
        </ol>

        <p><em>Master these three concepts, and you master the language of the market. Ignore them, and you are gambling, not trading.</em></p>
        ` 
    },
    { 
        id: 7, 
        category: "Forex Basics", 
        title: "Forex Trading for Dummies: A Beginner's Guide", 
        summary: "The ultimate handbook for the aspiring trader. From setting up your first chart to executing advanced strategies.", 
        difficulty: "Beginner", 
        type: "book", 
        content: `
        <div class="book-container">
            <h1 class="text-4xl font-bold mb-6 text-center text-primary">Forex Trading for Beginners</h1>
            <p class="text-center text-mid-text italic mb-10">The Complete Guide to Financial Freedom through Currency Trading</p>

            <div class="bg-light-hover p-6 rounded-lg border border-light-gray mb-10">
                <h3 className="font-bold text-lg mb-4">Table of Contents</h3>
                <ul class="space-y-2 text-sm">
                    <li><strong>Chapter 1:</strong> Welcome to the Jungle - Understanding the Market</li>
                    <li><strong>Chapter 2:</strong> The Mechanics - Software, Brokers, and Setup</li>
                    <li><strong>Chapter 3:</strong> Fundamental Analysis - Reading the News</li>
                    <li><strong>Chapter 4:</strong> Technical Analysis - The Art of Charts</li>
                    <li><strong>Chapter 5:</strong> The Psychology of Trading - Mastering Your Mind</li>
                    <li><strong>Chapter 6:</strong> Risk Management - The Holy Grail</li>
                    <li><strong>Chapter 7:</strong> Building a Strategy</li>
                    <li><strong>Chapter 8:</strong> Advanced Techniques</li>
                </ul>
            </div>

            <hr class="my-8 border-light-gray" />

            <h2 class="text-2xl font-bold mb-4">Chapter 1: Welcome to the Jungle</h2>
            
            <p class="mb-4">Imagine a market that never sleeps. A market where fortunes are made and lost in the blink of an eye. A market that is larger than all the stock markets in the world combined. Welcome to the Foreign Exchange Market.</p>

            <h3 class="text-xl font-semibold mb-2">What are we actually trading?</h3>
            <p class="mb-4">The answer is simple: <strong>Money.</strong> Because you are not buying anything physical, forex trading can be confusing. Think of buying a currency as buying a share in a particular country, kind of like buying stocks of a company. The price of the currency is a direct reflection of what the market thinks about the current and future health of the Japanese economy, for example.</p>
            
            <p class="mb-4">In general, the exchange rate of a currency versus other currencies is a reflection of the condition of that country's economy, compared to other countries' economies.</p>

            <h3 class="text-xl font-semibold mb-2">Major Currencies</h3>
            <p class="mb-4">While there are many currencies you can trade, as a new trader, you will mostly likely trade the "majors." These symbols always look like three letters, where the first two letters identify the name of the country and the third letter identifies the name of that country’s currency.</p>
            <ul class="list-disc pl-6 mb-4">
                <li><strong>USD:</strong> United States Dollar (The Buck)</li>
                <li><strong>EUR:</strong> Euro (Fiber)</li>
                <li><strong>JPY:</strong> Japanese Yen (Yen)</li>
                <li><strong>GBP:</strong> Great British Pound (Cable)</li>
                <li><strong>CHF:</strong> Swiss Franc (Swissy)</li>
                <li><strong>CAD:</strong> Canadian Dollar (Loonie)</li>
                <li><strong>AUD:</strong> Australian Dollar (Aussie)</li>
                <li><strong>NZD:</strong> New Zealand Dollar (Kiwi)</li>
            </ul>

            <h3 class="text-xl font-semibold mb-2">Speculation vs. Reality</h3>
            <p class="mb-4">One important thing to note about the forex market is that while commercial and financial transactions are part of the trading volume, most currency trading is based on speculation.</p>
            <p class="mb-4">In other words, most trading volume comes from traders that buy and sell based on intraday price movements. The trading volume brought about by speculators is estimated to be more than 90% of the entire market volume!</p>
            
            <p class="mb-4">This speculation is what creates the volatility (price movement). Without volatility, it would be very difficult to make money. You need price to move to profit.</p>

            <hr class="my-8 border-light-gray" />
            
            <h2 class="text-2xl font-bold mb-4">Chapter 2: The Mechanics</h2>
            <p class="mb-4">To start trading, you need three things: A computer/smartphone, an internet connection, and a Broker.</p>

            <h3 class="text-xl font-semibold mb-2">The Broker</h3>
            <p class="mb-4">Your broker is your gateway to the market. They provide you with the software (like MetaTrader 4/5 or cTrader) and the liquidity to execute trades. In exchange, they charge a spread (commission).</p>
            
            <h3 class="text-xl font-semibold mb-2">Bid and Ask</h3>
            <p class="mb-4">Every currency pair has two prices:</p>
            <ul class="list-disc pl-6 mb-4">
                <li><strong>Bid:</strong> The price at which your broker is willing to buy the base currency from you.</li>
                <li><strong>Ask:</strong> The price at which your broker is willing to sell the base currency to you.</li>
            </ul>
            <p class="mb-4">The difference between these two is the <strong>Spread</strong>. This is the cost of the trade. If EUR/USD is 1.1050 / 1.1052, the spread is 2 pips.</p>

            <h3 class="text-xl font-semibold mb-2">Types of Orders</h3>
            <p class="mb-4">You don't just click "Buy." You need to know how you are buying.</p>
            <ul class="list-disc pl-6 mb-4">
                <li><strong>Market Order:</strong> Execute immediately at the best available price. "Get me in now!"</li>
                <li><strong>Limit Order:</strong> Buy or Sell only at a specific price or better. "I want to buy, but only if price drops to 1.1000."</li>
                <li><strong>Stop Order:</strong> Buy or Sell once price reaches a certain point (often used for breakouts).</li>
            </ul>

            <div class="bg-primary/10 p-6 rounded-lg border-l-4 border-primary mt-8">
                <p class="font-bold text-lg mb-2">Continue Reading...</p>
                <p>This is just the beginning. The full version of this book covers detailed technical analysis patterns, how to read economic calendars, and the psychological tricks your mind will play on you.</p>
                <p class="mt-2 text-sm"><em>To unlock Chapters 3-8, please upgrade to our Pro or Premium plan for full access to our extensive digital library.</em></p>
            </div>
        </div>
        ` 
    },
    { id: 3, category: "Technical Analysis", title: "Mastering Support and Resistance", summary: "Identify key price levels on charts to make better entry and exit decisions.", difficulty: "Intermediate", type: "article", content: "Full content here..." },
    { id: 4, category: "Technical Analysis", title: "A Guide to Candlestick Patterns", summary: "Recognize common candlestick patterns to predict future market movements.", difficulty: "Intermediate", type: "article", content: "Full content here..." },
    { id: 8, category: "Technical Analysis", title: "Japanese Candlestick Charting Techniques (Book)", summary: "Steve Nison's classic guide to understanding and using candlestick patterns for market analysis.", difficulty: "Advanced", type: "book", content: "Full content here..." },
    { id: 5, category: "Risk Management", title: "The Importance of Stop-Loss Orders", summary: "Protect your capital by learning how to properly set and manage stop-loss orders.", difficulty: "Beginner", type: "article", content: "Full content here..." },
    { id: 6, category: "Risk Management", title: "Position Sizing for Success", summary: "Calculate the optimal position size for any trade to manage risk effectively.", difficulty: "Advanced", type: "article", content: "Full content here..." },
    { id: 9, category: "Risk Management", title: "Trading Risk Management Essentials (Book)", summary: "An essential guide to developing a robust risk management plan for consistent trading.", difficulty: "Intermediate", type: "book", content: "Full content here..." },
    { id: 10, category: "Using Our Signals", title: "How to Interpret AI Signals", summary: "A step-by-step guide on how to read our AI-generated signals and incorporate them into your strategy.", difficulty: "Beginner", type: "video", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", content: "Full content here..." },
    { id: 11, category: "Using Our Signals", title: "Setting Up Your Dashboard for Success", summary: "Learn how to customize your dashboard, set your initial equity, and track your performance effectively.", difficulty: "Beginner", type: "video", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", content: "Full content here..." },
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
  activeTrades: TradeRecord[];
  setActiveTrades: React.Dispatch<React.SetStateAction<TradeRecord[]>>;
}


// --- SETTINGS PAGE & SUB-COMPONENTS ---

interface SettingsProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const ProfileSettings: React.FC<SettingsProps> = ({user, setUser, showToast}) => {
    const [displayName, setDisplayName] = useState(user.name);
    const [avatarPreview, setAvatarPreview] = useState(user.avatar || `https://i.pravatar.cc/150?u=${user.email}`);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        setUser(prev => prev ? ({ ...prev, name: displayName, avatar: avatarPreview }) : null);
        showToast('Profile updated successfully.', 'success');
    };

    return (
        <div className="p-6 bg-light-surface rounded-lg border border-light-gray text-dark-text space-y-6">
            <h3 className="font-bold text-lg">My Profile</h3>
            
            <div className="flex items-center space-x-6">
                <div className="relative">
                    <img src={avatarPreview} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-light-hover" />
                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-hover shadow-md transition-transform transform hover:scale-110">
                        <Icon name="edit" className="w-4 h-4" />
                        <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                </div>
                <div>
                    <p className="text-sm text-mid-text mb-1">Profile Picture</p>
                    <p className="text-xs text-mid-text">PNG, JPG up to 5MB</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Display Name / Username</label>
                <input 
                    type="text" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full p-3 rounded-lg bg-light-hover border border-light-gray focus:ring-2 focus:ring-primary focus:outline-none" 
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input 
                    type="text" 
                    value={user.email} 
                    readOnly 
                    className="w-full p-3 rounded-lg bg-light-hover border border-light-gray text-mid-text cursor-not-allowed" 
                />
                <p className="text-xs text-mid-text mt-1">Email cannot be changed. Contact support for assistance.</p>
            </div>

            <button onClick={handleSave} className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-hover font-semibold shadow-sm transition-colors">
                Save Changes
            </button>
        </div>
    );
};

const BillingSettings: React.FC<{user: User; setUser: React.Dispatch<React.SetStateAction<User | null>>; showToast: (msg: string) => void}> = ({user, setUser, showToast}) => {
    const [isManaging, setIsManaging] = useState(false);

    const PLAN_COSTS = {
        [PlanName.Free]: { price: 0, label: 'Free' },
        [PlanName.Basic]: { price: 29, label: 'Basic' },
        [PlanName.Pro]: { price: 59, label: 'Pro' },
        [PlanName.Premium]: { price: 99, label: 'Premium' },
    };

    const handlePlanChange = (plan: PlanName) => {
        setUser(prev => prev ? ({ ...prev, subscribedPlan: plan }) : null);
        showToast(`Subscription updated to ${plan} plan.`);
        setIsManaging(false);
    };

    return (
        <div className="p-6 bg-light-surface rounded-lg border border-light-gray text-dark-text">
             <h3 className="font-bold text-lg mb-4">Subscription & Billing</h3>
             
             <div className="p-6 bg-primary/5 rounded-xl border border-primary/10 mb-6">
                 <div className="flex justify-between items-center flex-wrap gap-4">
                     <div>
                         <p className="text-mid-text text-sm uppercase tracking-wider font-semibold">Current Plan</p>
                         <p className="text-primary font-extrabold text-3xl mt-1">{user.subscribedPlan || 'Free'}</p>
                         <p className="text-sm text-mid-text mt-2 flex items-center">
                            <Icon name="check" className="w-4 h-4 mr-1 text-success" />
                            {user.subscribedPlan === PlanName.Free ? 'Standard Features' : 'Renews on Nov 1, 2024'}
                         </p>
                     </div>
                     <button 
                        onClick={() => setIsManaging(!isManaging)} 
                        className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-hover font-semibold shadow-sm transition-colors"
                     >
                        {isManaging ? 'Cancel Management' : 'Manage Subscription'}
                     </button>
                 </div>
             </div>

             {isManaging && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-right">
                    {Object.values(PlanName).map(plan => (
                        <div key={plan} className={`p-4 rounded-lg border-2 flex flex-col ${user.subscribedPlan === plan ? 'border-primary bg-primary/5' : 'border-light-gray bg-light-hover'}`}>
                            <h4 className="font-bold text-lg">{plan}</h4>
                            <p className="text-2xl font-bold my-2">${PLAN_COSTS[plan].price}<span className="text-sm font-normal text-mid-text">/mo</span></p>
                            <ul className="text-xs text-mid-text space-y-2 mb-4 flex-grow">
                                {PLAN_FEATURES[plan].slice(0, 4).map((f, i) => (
                                    <li key={i} className="flex items-start"><Icon name="check" className="w-3 h-3 mr-1 text-success mt-0.5"/>{f}</li>
                                ))}
                            </ul>
                            <button 
                                onClick={() => handlePlanChange(plan)}
                                disabled={user.subscribedPlan === plan}
                                className={`w-full py-2 rounded-md font-bold text-sm ${
                                    user.subscribedPlan === plan 
                                    ? 'bg-success/20 text-success cursor-default' 
                                    : 'bg-primary text-white hover:bg-primary-hover'
                                }`}
                            >
                                {user.subscribedPlan === plan ? 'Current' : 'Select'}
                            </button>
                        </div>
                    ))}
                 </div>
             )}
        </div>
    );
};

const NotificationSettings: React.FC<SettingsProps> = ({user, setUser, showToast}) => {
    const [telegramStep, setTelegramStep] = useState<'initial' | 'input' | 'verify'>('initial');
    const [telegramId, setTelegramId] = useState('');

    const handleConnectTelegram = () => {
        if (telegramId.length < 5) {
            showToast('Please enter a valid Telegram Chat ID.', 'error');
            return;
        }
        // Simulate Verification
        setTimeout(() => {
            setUser(prev => prev ? ({ ...prev, telegramNumber: telegramId }) : null);
            showToast('Telegram connected successfully!', 'success');
            setTelegramStep('initial');
        }, 1000);
    };

    const handleDisconnect = () => {
        setUser(prev => prev ? ({ ...prev, telegramNumber: undefined }) : null);
        showToast('Telegram disconnected.', 'info');
    };

    return (
        <div className="p-6 bg-light-surface rounded-lg border border-light-gray text-dark-text space-y-6">
            <h3 className="font-bold text-lg">Notification Preferences</h3>
            
            <div className="flex items-center justify-between p-3 bg-light-hover rounded-lg">
                <span>Email Notifications</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-light-gray text-primary focus:ring-primary" />
            </div>
            <div className="flex items-center justify-between p-3 bg-light-hover rounded-lg">
                <span>Push Notifications</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-light-gray text-primary focus:ring-primary" />
            </div>

            <div className="border-t border-light-gray pt-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h4 className="font-bold flex items-center"><Icon name="send" className="w-4 h-4 mr-2" /> Telegram Alerts</h4>
                        <p className="text-sm text-mid-text">Receive instant signal alerts directly to your Telegram.</p>
                    </div>
                    {user.telegramNumber && (
                         <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-bold border border-success/20">Connected</span>
                    )}
                </div>

                {!user.telegramNumber ? (
                    <div className="bg-light-bg p-4 rounded-lg border border-light-gray">
                        {telegramStep === 'initial' && (
                             <div className="text-center">
                                <p className="mb-4 text-sm">Connect your account to our bot to start receiving signals.</p>
                                <button onClick={() => setTelegramStep('input')} className="bg-info text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold">Connect Telegram</button>
                             </div>
                        )}

                        {telegramStep === 'input' && (
                            <div className="space-y-4 animate-fade-in-right">
                                <div className="space-y-2">
                                    <p className="text-sm font-bold">Step 1: Start the Bot</p>
                                    <p className="text-xs text-mid-text">Open Telegram and search for <span className="text-primary font-mono">@TradeCompanionBot</span> or click the link below. Click "Start".</p>
                                    <a href="https://t.me/" target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline flex items-center"><Icon name="link" className="w-3 h-3 mr-1"/> Open Bot</a>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-bold">Step 2: Get your ID</p>
                                    <p className="text-xs text-mid-text">The bot will send you a "Chat ID". Copy it and paste it below.</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-bold">Step 3: Verify</p>
                                    <input 
                                        type="text" 
                                        placeholder="Enter Telegram Chat ID" 
                                        value={telegramId}
                                        onChange={(e) => setTelegramId(e.target.value)}
                                        className="w-full p-2 rounded border border-light-gray bg-light-surface text-dark-text"
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={handleConnectTelegram} className="bg-success text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm font-bold">Verify & Connect</button>
                                        <button onClick={() => setTelegramStep('initial')} className="text-mid-text px-4 py-2 rounded-lg hover:bg-light-hover text-sm">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex justify-between items-center bg-light-hover p-3 rounded-lg">
                        <span className="text-sm font-mono">{user.telegramNumber}</span>
                        <button onClick={handleDisconnect} className="text-danger text-sm hover:underline">Disconnect</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const CTraderSettings: React.FC<SettingsProps> = ({user, setUser, showToast}) => {
    const [selectedInstruments, setSelectedInstruments] = useState<string[]>(() => {
        const saved = localStorage.getItem(`ctrader_instruments_${user.email}`);
        return saved ? JSON.parse(saved) : ['EUR/USD', 'GBP/JPY', 'XAU/USD'];
    });
    
    // Form state for connection
    const [accountIdInput, setAccountIdInput] = useState('');
    const [tokenInput, setTokenInput] = useState('');

    const availableInstruments = Object.keys(instrumentDefinitions);

    const toggleInstrument = (instrument: string) => {
        setSelectedInstruments(prev => {
            if (prev.includes(instrument)) {
                return prev.filter(i => i !== instrument);
            } else {
                return [...prev, instrument];
            }
        });
    };

    const handleSaveInstruments = () => {
        localStorage.setItem(`ctrader_instruments_${user.email}`, JSON.stringify(selectedInstruments));
        showToast('Auto-trading instrument preferences saved!', 'success');
    };

    const handleConnect = (e: React.FormEvent) => {
        e.preventDefault();
        if (accountIdInput.length < 3 || tokenInput.length < 5) {
            showToast('Please enter valid Account ID and Token', 'error');
            return;
        }
        
        // Simulate Connection API Call
        setTimeout(() => {
            setUser(prev => prev ? ({
                ...prev,
                cTraderConfig: { 
                    ...prev.cTraderConfig!, 
                    isConnected: true, 
                    accountId: accountIdInput, 
                    accessToken: tokenInput, 
                    autoTradeEnabled: true 
                }
            }) : null);
             if (!localStorage.getItem(`ctrader_instruments_${user.email}`)) {
                 localStorage.setItem(`ctrader_instruments_${user.email}`, JSON.stringify(selectedInstruments));
             }
            showToast('cTrader account connected successfully!', 'success');
            setAccountIdInput('');
            setTokenInput('');
        }, 800);
    };

    const handleDisconnect = () => {
         setUser(prev => prev ? ({
            ...prev,
            cTraderConfig: { ...prev.cTraderConfig!, isConnected: false, accountId: '', accessToken: '', autoTradeEnabled: false }
        }) : null);
        showToast('cTrader account disconnected.', 'info');
    };

    const isConnected = user.cTraderConfig?.isConnected;

    return (
        <div className="p-6 bg-light-surface rounded-lg border border-light-gray text-dark-text space-y-6 animate-fade-in-right">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">cTrader Connection</h3>
                    {isConnected && <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-bold">Active</span>}
                </div>

                {!isConnected ? (
                    <div className="bg-light-bg p-5 rounded-lg border border-light-gray">
                        <p className="text-sm mb-4">Link your cTrader account to enable automated execution of AI signals.</p>
                        
                        <div className="mb-6 bg-light-hover p-3 rounded text-xs text-mid-text space-y-1">
                            <p className="font-bold text-dark-text">How to connect:</p>
                            <p>1. Log in to the <a href="#" className="text-primary underline">cTrader ID Site</a>.</p>
                            <p>2. Navigate to "Open API" settings.</p>
                            <p>3. Generate a new Access Token for your trading account.</p>
                            <p>4. Copy the Account ID and Token below.</p>
                        </div>

                        <form onSubmit={handleConnect} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-mid-text mb-1">Account ID</label>
                                <input 
                                    type="text" 
                                    value={accountIdInput}
                                    onChange={e => setAccountIdInput(e.target.value)}
                                    placeholder="e.g., 1234567"
                                    className="w-full p-2 rounded border border-light-gray bg-light-surface text-dark-text"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-mid-text mb-1">Access Token</label>
                                <input 
                                    type="password" 
                                    value={tokenInput}
                                    onChange={e => setTokenInput(e.target.value)}
                                    placeholder="Paste your token here..."
                                    className="w-full p-2 rounded border border-light-gray bg-light-surface text-dark-text"
                                />
                            </div>
                            <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover font-bold w-full">
                                Connect Account
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-light-hover p-4 rounded-lg border border-light-gray">
                            <div>
                                <p className="font-bold text-dark-text">Connected Account</p>
                                <p className="text-sm text-mid-text font-mono">ID: {user.cTraderConfig?.accountId}</p>
                            </div>
                            <button onClick={handleDisconnect} className="text-danger text-sm font-semibold hover:underline">Disconnect</button>
                        </div>

                        <div className="animate-fade-in-right border-t border-light-gray pt-6">
                            <h3 className="font-bold text-lg mb-2">Auto-Trading Instruments</h3>
                            <p className="text-sm text-mid-text mb-4">Select which instruments you want the AI to automatically trade on your account.</p>
                            
                            <div className="mb-4 flex justify-between items-center">
                                <span className="text-xs font-bold text-primary">{selectedInstruments.length} Selected</span>
                                <div className="space-x-2">
                                    <button onClick={() => setSelectedInstruments(availableInstruments)} className="text-xs text-info hover:underline">Select All</button>
                                    <button onClick={() => setSelectedInstruments([])} className="text-xs text-danger hover:underline">Clear All</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6 max-h-60 overflow-y-auto p-2 border border-light-gray rounded-lg custom-scrollbar">
                                {availableInstruments.map(inst => (
                                    <label key={inst} className={`flex items-center space-x-2 cursor-pointer p-2 rounded transition-colors ${selectedInstruments.includes(inst) ? 'bg-primary/10 border border-primary/20' : 'hover:bg-light-hover border border-transparent'}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedInstruments.includes(inst)} 
                                            onChange={() => toggleInstrument(inst)}
                                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                        />
                                        <span className={`text-sm font-medium ${selectedInstruments.includes(inst) ? 'text-primary' : 'text-mid-text'}`}>{inst}</span>
                                    </label>
                                ))}
                            </div>
                            
                            <div className="flex justify-end">
                                <button onClick={handleSaveInstruments} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-transform transform hover:scale-105">
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SettingsPage: React.FC<SettingsProps> = ({ user, setUser, showToast }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'notifications' | 'ctrader'>('profile');
    return (
        <div className="p-8 bg-light-bg min-h-screen">
            <h2 className="text-2xl font-bold mb-6 text-dark-text">Settings</h2>
            <div className="flex space-x-4 mb-6 border-b border-light-gray overflow-x-auto">
                {(['profile', 'billing', 'notifications', 'ctrader'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-2 px-4 font-medium capitalize whitespace-nowrap transition-colors ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-mid-text hover:text-dark-text'}`}
                    >
                        {tab.replace('ctrader', 'cTrader')}
                    </button>
                ))}
            </div>
            <div className="animate-fade-in-right">
                {activeTab === 'profile' && <ProfileSettings user={user} setUser={setUser} showToast={showToast} />}
                {activeTab === 'billing' && <BillingSettings user={user} setUser={setUser} showToast={showToast} />}
                {activeTab === 'notifications' && <NotificationSettings user={user} setUser={setUser} showToast={showToast} />}
                {activeTab === 'ctrader' && <CTraderSettings user={user} setUser={setUser} showToast={showToast} />}
            </div>
        </div>
    );
};


// --- SUB-COMPONENTS for different views ---

const StatCard: React.FC<{ title: string; value: string; percentage?: string; percentageType?: 'gain' | 'loss' | 'info'; icon?: React.ReactNode; subValue?: React.ReactNode }> = ({ title, value, percentage, percentageType = 'gain', icon, subValue }) => {
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
                {subValue && (
                    <div className="mt-1 text-xs">{subValue}</div>
                )}
            </div>
        </div>
    );
};

const DashboardOverview: React.FC<{user: User; onViewChange: (view: DashboardView) => void, activeTrades: TradeRecord[], tradeHistory: TradeRecord[], liveEquity: number, floatingPnL: number}> = ({user, onViewChange, activeTrades, tradeHistory, liveEquity, floatingPnL}) => {
    const INITIAL_EQUITY_KEY = `initialEquity_${user.email}`;
    const PIE_COLORS = ['#6366F1', '#A78BFA', '#60A5FA', '#34D399', '#FB7185'];
    
    const [pieActiveIndex, setPieActiveIndex] = useState(0);
    const [initialEquity] = useState<number>(() => parseFloat(localStorage.getItem(INITIAL_EQUITY_KEY) || '10000'));

    const chartEquityData = useMemo(() => {
        const data: { name: string; equity: number }[] = [{ name: 'Start', equity: initialEquity }];
        let cumulativeEquity = initialEquity;
        tradeHistory.filter(t => t.status !== 'active').forEach((trade, index) => {
            cumulativeEquity += trade.pnl || 0;
            data.push({ name: `T${index + 1}`, equity: parseFloat(cumulativeEquity.toFixed(2)) });
        });
        // Add live equity point
        if (activeTrades.length > 0) {
            data.push({ name: 'Live', equity: parseFloat(liveEquity.toFixed(2)) });
        }
        return data;
    }, [tradeHistory, initialEquity, liveEquity, activeTrades]);
    
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
        })).sort((a, b) => Number(b.value) - Number(a.value));
    }, [tradeHistory]);
    
    const onPieEnter = useCallback((_: any, index: number) => {
        setPieActiveIndex(index);
    }, [setPieActiveIndex]);

    // FIX: Use explicit Number() casting to ensure arithmetic operations are valid.
    const renderActiveShape = (props: any) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
        const numCy = Number(cy);
        const numOuterRadius = Number(outerRadius);
        const numPercent = Number(percent);

        return (
            <g>
                <text x={cx} y={numCy - 10} textAnchor="middle" fill="var(--color-text)" className="font-bold">{payload.name}</text>
                <text x={cx} y={numCy + 10} textAnchor="middle" fill="var(--color-text-mid)">{`${(numPercent * 100).toFixed(0)}%`}</text>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={numOuterRadius + 8} // Pop out
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                />
            </g>
        );
    };

    const closedTrades = tradeHistory.filter(trade => trade.status !== 'active');
    // Total profit includes realized + floating
    // FIX: Ensure strictly numbers for arithmetic and handle NaN
    const safeLiveEquity = isNaN(Number(liveEquity)) ? 0 : Number(liveEquity);
    const safeInitialEquity = isNaN(Number(initialEquity)) ? 0 : Number(initialEquity);
    const totalProfit = safeLiveEquity - safeInitialEquity;
    const profitPercentage = safeInitialEquity > 0 ? ((totalProfit / safeInitialEquity) * 100).toFixed(2) : '0.00';
    const profitType = totalProfit >= 0 ? 'gain' : 'loss';

    const totalWins = closedTrades.filter(trade => trade.status === 'win').length;
    const totalTrades = closedTrades.length;
    const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(2) : '0';

    return (
        <div className="p-4 bg-light-bg min-h-[calc(100vh-64px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div onClick={() => onViewChange('analytics')} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard 
                        title="Live Equity" 
                        value={`$${safeLiveEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                        percentage={`${profitType === 'gain' ? '+' : ''}${profitPercentage}% Total`} 
                        percentageType={profitType} 
                        icon={<Icon name="signals" className="w-5 h-5" />}
                        subValue={activeTrades.length > 0 ? (
                            <span className={floatingPnL >= 0 ? 'text-success' : 'text-danger'}>
                                Floating: {floatingPnL >= 0 ? '+' : '-'}${Math.abs(floatingPnL).toFixed(2)}
                            </span>
                        ) : null}
                    />
                </div>
                <div onClick={() => onViewChange('analytics')} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard 
                        title="AI Signal Win Rate" 
                        value={`${winRate}%`} 
                        percentage={`${totalTrades} Closed Trades`} 
                        percentageType={parseFloat(winRate) >= 50 ? 'gain' : 'loss'} 
                        icon={<Icon name="check" className="w-5 h-5" />} 
                    />
                </div>
                <div onClick={() => onViewChange('analytics')} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard 
                        title="Total P/L (Realized + Float)" 
                        value={`${totalProfit >= 0 ? '+' : '-'}$${Math.abs(totalProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                        percentageType={totalProfit >= 0 ? 'gain' : 'loss'} 
                        icon={<Icon name="dashboard" className="w-5 h-5" />} 
                    />
                </div>
                <div onClick={() => onViewChange('ai_signals')} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard 
                        title="Open Positions" 
                        value={activeTrades.length.toString()}
                        percentage="From AI Signals" 
                        percentageType="info" 
                        icon={<Icon name="analytics" className="w-5 h-5" />} 
                    />
                </div>
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
                                <YAxis axisLine={false} tickLine={false} stroke="var(--color-text-mid)" domain={[(dataMin: any) => (parseFloat(String(dataMin)) * 0.99), (dataMax: any) => (parseFloat(String(dataMax)) * 1.01)]} tickFormatter={(value) => `$${Number(value).toFixed(0)}`} />
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
                                    {/* @ts-ignore */}
                                    <Pie 
                                        activeIndex={pieActiveIndex}
                                        activeShape={renderActiveShape}
                                        data={instrumentDistribution} 
                                        cx="50%" 
                                        cy="50%" 
                                        labelLine={false} 
                                        label={false}
                                        outerRadius={80} 
                                        fill="#8884d8" 
                                        dataKey="value" 
                                        onMouseEnter={onPieEnter}
                                    >
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
            <div className="glassmorphism p-3 rounded-lg text-sm shadow-lg border border-light-gray">
                <p className="font-bold text-dark-text mb-1">{label}</p>
                {payload.map((pld: any, index: number) => {
                    const value = pld.value;
                    const name = pld.name || pld.dataKey;
                    let formattedValue = value;
                    if (name === 'Equity' || name === 'P/L' || name.includes('Net P/L') || name === 'Earnings') {
                        formattedValue = value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                    }
                     if (name.toLowerCase().includes('rate')) {
                        formattedValue = `${value.toFixed(2)}%`;
                    }
                    
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

const AnalyticsPage: React.FC<{ user: User, liveEquity: number, floatingPnL: number }> = ({ user, liveEquity, floatingPnL }) => {
    const TRADE_HISTORY_KEY = `trade_history_${user.email}`;
    const INITIAL_EQUITY_KEY = `initialEquity_${user.email}`;
    const PIE_COLORS = ['#6366F1', '#A78BFA', '#60A5FA', '#34D399', '#FB7185', '#FBBF24'];

    const [tradeHistory] = useState<TradeRecord[]>(() => JSON.parse(localStorage.getItem(TRADE_HISTORY_KEY) || '[]'));
    const [initialEquity] = useState<number>(() => parseFloat(localStorage.getItem(INITIAL_EQUITY_KEY) || '10000'));
    const [pieActiveIndex, setPieActiveIndex] = useState(0);

    const onPieEnter = useCallback((_: any, index: number) => {
        setPieActiveIndex(index);
    }, [setPieActiveIndex]);

    const analyticsData = useMemo(() => {
        const closedTrades = tradeHistory.filter(t => t.status !== 'active').sort((a,b) => new Date(a.dateClosed!).getTime() - new Date(b.dateClosed!).getTime());
        
        const equityData = [{ name: 'Start', equity: initialEquity }];
        let cumulativeEquity = initialEquity;
        closedTrades.forEach((trade, index) => {
            cumulativeEquity += trade.pnl || 0;
            equityData.push({ name: `T${index + 1}`, equity: parseFloat(cumulativeEquity.toFixed(2)) });
        });
        
        // Add Live Point
        equityData.push({ name: 'Live', equity: parseFloat(liveEquity.toFixed(2)) });

        const totalPnl = liveEquity - initialEquity;
        
        const pnlPerTradeData = closedTrades.map((t, i) => ({ name: `T${i+1}`, 'P/L': t.pnl || 0 }));
        
        const instrumentDistributionData = Object.entries(
            closedTrades.reduce((acc, trade) => {
                acc[trade.instrument] = (acc[trade.instrument] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value, total: closedTrades.length }));

        const profitablePairsData = Object.entries(closedTrades.reduce((acc, trade) => {
            acc[trade.instrument] = (acc[trade.instrument] || 0) + (trade.pnl || 0);
            return acc;
        }, {} as Record<string, number>)).map(([name, pnl]) => ({ name, 'Net P/L': pnl }));
        
        const volatilityData = instrumentDistributionData.slice(0, 6).map(item => ({
            instrument: item.name,
            volatility: Math.random() * 80 + 20, 
        }));

        const confidenceBuckets: Record<string, {wins: number, total: number}> = {
            '70-80%': { wins: 0, total: 0 },
            '80-90%': { wins: 0, total: 0 },
            '90-100%': { wins: 0, total: 0 },
        };
        closedTrades.forEach(trade => {
            const conf = trade.confidence;
            let bucket: string | null = null;
            if (conf >= 70 && conf < 80) bucket = '70-80%';
            else if (conf >= 80 && conf < 90) bucket = '80-90%';
            else if (conf >= 90) bucket = '90-100%';
            if (bucket) {
                confidenceBuckets[bucket].total++;
                if (trade.status === 'win') confidenceBuckets[bucket].wins++;
            }
        });
        const confidenceData = Object.entries(confidenceBuckets).map(([name, data]) => ({
            name,
            'Win Rate': data.total > 0 ? (data.wins / data.total) * 100 : 0,
            trades: data.total,
        }));

        return { equityData, totalPnl, instrumentDistributionData, profitablePairsData, volatilityData, pnlPerTradeData, confidenceData };
    }, [tradeHistory, initialEquity, liveEquity]);

    const topMentor = MOCK_MENTORS_LIST[1];
    
    const AnalyticsWidget: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
        <div className={`bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray ${className}`}>
            <h3 className="text-lg font-bold text-dark-text mb-4">{title}</h3>
            {children}
        </div>
    );
    
    const ChartEmptyState: React.FC<{icon: string, message: string, height: number}> = ({icon, message, height}) => (
        <div style={{height: `${height}px`}} className="flex flex-col items-center justify-center text-center text-mid-text">
            <Icon name={icon} className="w-12 h-12 text-light-gray mb-2" />
            <p className="text-sm">{message}</p>
        </div>
    );
    
    const CustomPieLegend = (props: any) => {
        const { payload } = props;
        return (
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs mt-2">
                {payload.map((entry: any, index: number) => {
                    // FIX: Ensure safe arithmetic and array access
                    const item = analyticsData.instrumentDistributionData[index];
                    const total = item ? item.total : 0;
                    const percentage = total > 0
                        ? ((Number(entry.payload.value) / total) * 100).toFixed(0)
                        : 0;
                    return (
                        <span key={`item-${index}`} className="flex items-center">
                            <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }}></span>
                            <span className="text-mid-text">{entry.value}: <strong className="text-dark-text">{entry.payload.value} ({percentage}%)</strong></span>
                        </span>
                    );
                })}
            </div>
        );
    };

    const renderActiveShapeForDonut = (props: any) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
        const numCy = Number(cy);
        const numOuterRadius = Number(outerRadius);
        const numPercent = Number(percent);

        return (
            <g>
                <text x={cx} y={numCy - 5} textAnchor="middle" fill="var(--color-text)" className="font-bold text-sm">{payload.name}</text>
                <text x={cx} y={numCy + 15} textAnchor="middle" fill="var(--color-text-mid)" className="text-xs">{`${(numPercent * 100).toFixed(0)}% (${payload.value} trades)`}</text>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={numOuterRadius + 6}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                />
            </g>
        );
    };

    return (
         <div className="p-4 md:p-8 bg-light-bg min-h-full font-sans">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-dark-text">Analytics Overview</h1>
                <p className="text-mid-text">Your comprehensive trading performance dashboard.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                    <p className="text-sm text-mid-text">Live Equity</p>
                    <p className="text-3xl font-bold text-dark-text">{liveEquity.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                    {floatingPnL !== 0 && (
                        <p className={`text-sm mt-1 font-semibold ${floatingPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                            Floating: {floatingPnL >= 0 ? '+' : ''}{floatingPnL.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                    )}
                </div>
                 <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                    <p className="text-sm text-mid-text">Total Profit/Loss</p>
                    <p className={`text-3xl font-bold ${analyticsData.totalPnl >= 0 ? 'text-success' : 'text-danger'}`}>{analyticsData.totalPnl >= 0 ? '+' : ''}{analyticsData.totalPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                </div>
                 <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray flex items-center">
                    <img src={topMentor.avatar} alt={topMentor.name} className="w-12 h-12 rounded-full mr-4"/>
                    <div>
                        <p className="text-sm text-mid-text">Top Performing Mentor</p>
                        <p className="font-bold text-dark-text">{topMentor.name} <span className="text-success text-sm">ROI: {topMentor.roi}%</span></p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AnalyticsWidget title="Account Growth" className="lg:col-span-2">
                   {analyticsData.equityData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analyticsData.equityData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                            <XAxis dataKey="name" stroke="var(--color-text-mid)" tick={{ fontSize: 12 }}/>
                            <YAxis stroke="var(--color-text-mid)" tick={{ fontSize: 12 }} tickFormatter={(val: any) => `$${(parseFloat(String(val))/1000).toFixed(1)}k`} domain={[(dataMin: any) => parseFloat(String(dataMin)) * 0.95, (dataMax: any) => parseFloat(String(dataMax)) * 1.05]}/>
                            <Tooltip content={<ThemedChartTooltip />}/>
                            <Area type="monotone" dataKey="equity" stroke="var(--color-primary)" strokeWidth={2} fill="url(#equityGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                   ) : <ChartEmptyState icon="dashboard" message="Your account growth will be charted here." height={300} />}
                </AnalyticsWidget>
                
                <AnalyticsWidget title="Signal Instrument Distribution">
                     {analyticsData.instrumentDistributionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                {/* @ts-ignore */}
                                <Pie 
                                    activeIndex={pieActiveIndex}
                                    activeShape={renderActiveShapeForDonut}
                                    data={analyticsData.instrumentDistributionData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="45%" 
                                    innerRadius={60} 
                                    outerRadius={85} 
                                    paddingAngle={2}
                                    onMouseEnter={onPieEnter}
                                >
                                    {analyticsData.instrumentDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend content={<CustomPieLegend />} verticalAlign="bottom" />
                                <Tooltip content={<ThemedChartTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                     ) : <ChartEmptyState icon="pie-chart" message="A breakdown of your traded pairs will appear here." height={300} />}
                </AnalyticsWidget>

                <AnalyticsWidget title="Most Profitable Pairs">
                     {analyticsData.profitablePairsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={analyticsData.profitablePairsData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" horizontal={false} />
                                <XAxis type="number" stroke="var(--color-text-mid)" tick={{ fontSize: 10 }} domain={['auto', 'auto']}/>
                                <YAxis type="category" dataKey="name" stroke="var(--color-text-mid)" tick={{ fontSize: 10 }} width={50} />
                                <Tooltip content={<ThemedChartTooltip />} />
                                <ReferenceLine x={0} stroke="var(--color-border-dark)" />
                                <Bar dataKey="Net P/L">
                                    {analyticsData.profitablePairsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry['Net P/L'] >= 0 ? 'var(--color-success)' : 'var(--color-danger)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                     ) : <ChartEmptyState icon="chart-bar" message="Your P&L by instrument will be shown here." height={250} />}
                </AnalyticsWidget>

                 <AnalyticsWidget title="Instrument Volatility">
                    {analyticsData.volatilityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analyticsData.volatilityData}>
                                <PolarGrid stroke="var(--color-border-light)" />
                                <PolarAngleAxis dataKey="instrument" tick={{ fill: 'var(--color-text-mid)', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Volatility Score" dataKey="volatility" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.6} />
                                <Tooltip content={<ThemedChartTooltip />} />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : <ChartEmptyState icon="danger" message="Volatility data requires trade history." height={250} />}
                </AnalyticsWidget>
                
                <AnalyticsWidget title="Profit/Loss Per Trade" className="lg:col-span-2">
                     {analyticsData.pnlPerTradeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                           <BarChart data={analyticsData.pnlPerTradeData}>
                             <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                             <XAxis dataKey="name" stroke="var(--color-text-mid)" tick={{ fontSize: 12 }} />
                             <YAxis stroke="var(--color-text-mid)" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 10 }}/>
                             <Tooltip content={<ThemedChartTooltip />} />
                             <Bar dataKey="P/L" barSize={20}>
                                {analyticsData.pnlPerTradeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry['P/L'] >= 0 ? 'var(--chart-green)' : 'var(--chart-red)'} />
                                ))}
                             </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     ) : <ChartEmptyState icon="chart-bar" message="The P&L for each closed trade will appear here." height={250} />}
                </AnalyticsWidget>

                <AnalyticsWidget title="AI Confidence vs. Win Rate">
                     {analyticsData.confidenceData.some(d => d.trades > 0) ? (
                        <ResponsiveContainer width="100%" height={250}>
                           <BarChart data={analyticsData.confidenceData}>
                             <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                             <XAxis dataKey="name" stroke="var(--color-text-mid)" tick={{ fontSize: 12 }} />
                             <YAxis type="number" domain={[0, 100]} stroke="var(--color-text-mid)" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }}/>
                             <Tooltip content={<ThemedChartTooltip />} />
                             <Bar dataKey="Win Rate" fill="var(--chart-purple)" barSize={30} />
                           </BarChart>
                        </ResponsiveContainer>
                     ) : <ChartEmptyState icon="pie-chart" message="Data will appear once you have trades with confidence scores." height={250} />}
                </AnalyticsWidget>

                <AnalyticsWidget title="Mentor Performance">
                    <div className="space-y-3 h-[250px] overflow-y-auto">
                        {MOCK_MENTORS_LIST.slice(0,2).map(mentor => (
                            <div key={mentor.id} className="bg-light-hover p-3 rounded-lg flex justify-between items-center">
                                <div className="flex items-center">
                                    <img src={mentor.avatar} alt={mentor.name} className="w-10 h-10 rounded-full mr-3"/>
                                    <div>
                                        <p className="font-semibold text-dark-text text-sm">{mentor.name}</p>
                                        <p className="text-xs text-mid-text">{mentor.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/mo - {mentor.instruments.length} Signals</p>
                                    </div>
                                </div>
                                <span className="font-bold text-success text-sm">{mentor.roi}% ROI</span>
                            </div>
                        ))}
                    </div>
                </AnalyticsWidget>
            </div>
        </div>
    );
};


const MentorPage: React.FC<{ onViewMentor: (mentor: Mentor) => void; user: User; }> = ({ onViewMentor, user }) => {
    const calculateWinRate = (signals: RecentSignal[] | undefined) => {
        if (!signals || signals.length === 0) return 0;
        const wins = signals.filter(s => s.outcome === 'win').length;
        return Math.round((wins / signals.length) * 100);
    };

    return (
    <div>
        <h1 className="text-3xl font-bold mb-6 text-dark-text">Mentors</h1>
        {user.subscribedPlan === PlanName.Premium && (
            <div className="bg-accent/10 text-accent p-4 rounded-lg mb-6 border border-accent/20">
                <p className="font-bold">Premium Perk Unlocked!</p>
                <p className="text-sm">As a Premium member, you get one free month of mentorship. Choose a mentor to start your free trial!</p>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {MOCK_MENTORS_LIST.map(mentor => {
                const winRate = calculateWinRate(mentor.recentSignals);
                return (
                <div key={mentor.id} className="bg-light-surface rounded-lg overflow-hidden p-6 flex flex-col shadow-sm border border-light-gray transition-shadow hover:shadow-md hover:shadow-primary/10">
                    <div className="flex-grow">
                        <div className="flex items-center mb-4">
                            <img src={mentor.avatar} alt={mentor.name} className="w-20 h-20 rounded-full mr-4 border-2 border-primary" />
                            <div>
                                <h4 className="text-xl font-bold text-dark-text">{mentor.name}</h4>
                                <p className="text-mid-text">{mentor.experience} Yrs Exp.</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-sm my-4 bg-light-hover p-3 rounded-md">
                            <div className="text-center">
                                <p className="text-mid-text">Win Rate</p>
                                <p className="font-bold text-success">{winRate > 0 ? `${winRate}%` : 'N/A'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-mid-text">Rating</p>
                                <p className="font-bold text-dark-text flex items-center gap-1">
                                    {mentor.rating?.toFixed(1)}
                                    <Icon name="star" className="w-4 h-4 text-warning fill-current" />
                                </p>
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
            )})}
        </div>
    </div>
    )
};

const NavLink: React.FC<{
    view: DashboardView;
    icon: string;
    label: string;
    isCollapsed: boolean;
    activeView: DashboardView;
    onViewChange: (view: DashboardView) => void;
    badgeCount?: number;
}> = ({ view, icon, label, isCollapsed, activeView, onViewChange, badgeCount }) => {
    const isActive = activeView === view;
    return (
        <button
            onClick={() => onViewChange(view)}
            className={`w-full flex items-center p-3 transition-colors relative ${isActive ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-mid-text hover:bg-light-hover hover:text-dark-text'}`}
            title={isCollapsed ? label : ''}
        >
            <Icon name={icon} className={`w-6 h-6 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
            {!isCollapsed && <span className="font-medium">{label}</span>}
            {badgeCount !== undefined && badgeCount > 0 && (
                <span className={`absolute ${isCollapsed ? 'top-2 right-2 h-2 w-2 rounded-full bg-danger' : 'right-3 bg-primary text-white text-xs py-0.5 px-2 rounded-full'}`}>
                    {!isCollapsed && badgeCount}
                </span>
            )}
        </button>
    );
};

const MentorAnalyticsPage: React.FC<{ user: User }> = ({ user }) => {
    // Use mock data for the mentor view (assuming user ID 1 corresponds to the mock mentor data)
    const mentorData = MOCK_MENTOR_ANALYTICS;
    
    // Signal Accuracy Calculation
    const signalAccuracy = useMemo(() => {
        const total = mentorData.topSignals.length + 2; // Adding some mock loss data implicitly for chart
        const wins = mentorData.topSignals.filter(s => s.outcome === 'win').length;
        const losses = total - wins;
        return [
            { name: 'Wins', value: wins + 5, fill: '#22C55E' }, // Boosting for visual
            { name: 'Losses', value: losses + 2, fill: '#EF4444' }
        ];
    }, [mentorData]);

    return (
        <div className="p-8 bg-light-bg min-h-full">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-dark-text">Mentor Analytics</h2>
                <p className="text-mid-text">Track your performance, subscriber growth, and earnings.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-mid-text">Total Earnings (YTD)</p>
                            <h3 className="text-3xl font-bold text-dark-text">$15,762</h3>
                        </div>
                        <div className="p-2 bg-success/10 rounded-lg text-success">
                             <Icon name="billing" className="w-6 h-6" />
                        </div>
                    </div>
                     <p className="text-xs text-success mt-2 flex items-center"><Icon name="check" className="w-3 h-3 mr-1"/> +12% from last month</p>
                </div>

                <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-mid-text">Active Subscribers</p>
                            <h3 className="text-3xl font-bold text-dark-text">142</h3>
                        </div>
                         <div className="p-2 bg-primary/10 rounded-lg text-primary">
                             <Icon name="mentors" className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-xs text-success mt-2 flex items-center"><Icon name="check" className="w-3 h-3 mr-1"/> +5 new this week</p>
                </div>

                <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                    <div className="flex justify-between items-start">
                         <div>
                            <p className="text-sm text-mid-text">Signal Accuracy</p>
                            <h3 className="text-3xl font-bold text-dark-text">78%</h3>
                        </div>
                         <div className="p-2 bg-warning/10 rounded-lg text-warning">
                             <Icon name="signals" className="w-6 h-6" />
                        </div>
                    </div>
                     <p className="text-xs text-mid-text mt-2">Based on last 50 signals</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Earnings Growth Chart */}
                <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                    <h3 className="text-lg font-bold text-dark-text mb-4">Earnings Growth</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={mentorData.earningsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="var(--color-text-mid)" />
                            <YAxis stroke="var(--color-text-mid)" tickFormatter={(val) => `$${val}`} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-light)' }} />
                            <Area type="monotone" dataKey="earnings" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorEarnings)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Subscriber Retention Chart */}
                <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                    <h3 className="text-lg font-bold text-dark-text mb-4">Subscriber Retention (New vs Churned)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={mentorData.subscriberData}>
                             <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                             <XAxis dataKey="month" stroke="var(--color-text-mid)" />
                             <YAxis stroke="var(--color-text-mid)" />
                             <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-light)' }} cursor={{fill: 'transparent'}} />
                             <Legend />
                             <Bar dataKey="new" name="New Subs" fill="var(--color-success)" barSize={20} radius={[4, 4, 0, 0]} />
                             <Bar dataKey="churned" name="Churned" fill="var(--color-danger)" barSize={20} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Signal Accuracy Pie */}
                <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                    <h3 className="text-lg font-bold text-dark-text mb-4">Signal Accuracy Distribution</h3>
                    <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={signalAccuracy}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {signalAccuracy.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-light)' }} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Rating Distribution */}
                <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                    <h3 className="text-lg font-bold text-dark-text mb-4">Rating Distribution</h3>
                    <div className="space-y-4">
                        {mentorData.ratingDistribution.map((item) => (
                            <div key={item.rating} className="flex items-center">
                                <span className="w-8 text-sm font-bold text-dark-text">{item.rating} <Icon name="star" className="w-3 h-3 inline text-warning" /></span>
                                <div className="flex-1 h-3 mx-3 bg-light-hover rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-warning" 
                                        style={{ width: `${(item.count / 124) * 100}%` }} // 124 total reviews mock
                                    ></div>
                                </div>
                                <span className="text-xs text-mid-text">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

// Updated EducationPage with Modern UI
const EducationPage: React.FC<{ onViewContent: (article: EducationArticle) => void }> = ({ onViewContent }) => {
    const sections = [
        { title: "Beginner's Guide to Forex", category: "Forex Basics", description: "Start your journey here. Learn the terminology and fundamentals of the market." },
        { title: "Technical Analysis Masterclass", category: "Technical Analysis", description: "Learn to read charts, identify patterns, and predict future market movements." },
        { title: "Risk Management Essentials", category: "Risk Management", description: "Strategies to protect your capital and trade sustainably." },
        { title: "Using Our Signals", category: "Using Our Signals", description: "A guide to interpreting and executing our AI-generated trade setups effectively." }
    ];

    return (
        <div className="p-8 bg-light-bg min-h-full font-sans">
            {/* Hero Header */}
            <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-10 mb-12 text-white shadow-lg">
                <h1 className="text-4xl font-extrabold mb-4">Trading Academy</h1>
                <p className="text-lg opacity-90 max-w-2xl">
                    Elevate your trading skills with our curated library of articles, books, and video tutorials. Structured for every level of trader.
                </p>
            </div>

            <div className="space-y-16">
                {sections.map((section) => {
                    const articles = MOCK_EDUCATION_ARTICLES.filter(a => a.category === section.category);
                    if (articles.length === 0) return null;

                    return (
                        <section key={section.category} className="animate-fade-in-right">
                            <div className="flex items-end justify-between mb-6 border-b border-light-gray pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-dark-text flex items-center">
                                        <span className="w-2 h-8 bg-primary rounded-full mr-3"></span>
                                        {section.title}
                                    </h2>
                                    <p className="text-mid-text mt-1 ml-5">{section.description}</p>
                                </div>
                            </div>
                            
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {articles.map(article => (
                                    <div 
                                        key={article.id} 
                                        onClick={() => onViewContent(article)}
                                        className="bg-light-surface rounded-xl shadow-sm border border-light-gray overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full transform hover:-translate-y-1"
                                    >
                                        <div className={`h-1.5 w-full ${article.difficulty === 'Beginner' ? 'bg-success' : article.difficulty === 'Intermediate' ? 'bg-warning' : 'bg-danger'}`}></div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="flex items-center text-xs font-bold text-primary uppercase tracking-wide">
                                                    <Icon name={article.type === 'video' ? 'play' : article.type === 'book' ? 'book' : 'education'} className="w-3 h-3 mr-1" />
                                                    {article.type}
                                                </span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${article.difficulty === 'Beginner' ? 'bg-success/5 text-success border-success/20' : article.difficulty === 'Intermediate' ? 'bg-warning/5 text-warning border-warning/20' : 'bg-danger/5 text-danger border-danger/20'}`}>
                                                    {article.difficulty}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-dark-text mb-2 group-hover:text-primary transition-colors line-clamp-2">{article.title}</h3>
                                            <p className="text-sm text-mid-text line-clamp-3 flex-1 mb-4">{article.summary}</p>
                                            <div className="pt-4 border-t border-light-gray flex items-center text-xs font-bold text-primary uppercase tracking-wider">
                                                Read Now <Icon name="arrowRight" className="w-3 h-3 ml-2 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
};

const EducationContentPage: React.FC<{ article: EducationArticle, onBack: () => void }> = ({ article, onBack }) => (
    <div className="p-8 bg-light-bg min-h-full">
        <button onClick={onBack} className="mb-6 flex items-center text-primary hover:underline font-semibold">
            <Icon name="arrowLeft" className="w-5 h-5 mr-2" /> Back to Academy
        </button>
        <div className="bg-light-surface p-8 rounded-2xl shadow-md border border-light-gray max-w-4xl mx-auto animate-fade-in-right">
            <div className="flex gap-3 mb-4">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-semibold uppercase">{article.type}</span>
                <span className="text-xs bg-light-hover text-mid-text px-2 py-1 rounded font-semibold">{article.category}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-dark-text">{article.title}</h1>
            {article.videoUrl && (
                <div className="aspect-w-16 aspect-h-9 mb-8 rounded-xl overflow-hidden bg-black shadow-lg">
                    <iframe src={article.videoUrl} title={article.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>
                </div>
            )}
            <div className="prose prose-lg text-dark-text max-w-none">
                {/* Use DangerouslySetInnerHTML for content to allow formatting tags from mock data */}
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
                
                <div className="bg-light-hover p-4 rounded-lg border border-light-gray mt-8">
                    <p className="text-sm text-mid-text italic">
                        <Icon name="info" className="w-4 h-4 inline mr-2" />
                        This content is for educational purposes only and does not constitute financial advice.
                    </p>
                </div>
            </div>
        </div>
    </div>
);

const ApplyMentorPage: React.FC = () => (
    <div className="p-8 bg-light-bg min-h-full flex items-center justify-center">
        <div className="bg-light-surface p-8 rounded-lg shadow-lg border border-light-gray max-w-2xl w-full text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="mentors" className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-dark-text">Become a Mentor</h2>
            <p className="text-mid-text mb-8 text-lg">Share your expertise, signal your trades, and earn monthly income from subscribers.</p>
            <div className="grid md:grid-cols-3 gap-4 mb-8 text-left">
                <div className="p-4 bg-light-hover rounded-lg">
                    <h4 className="font-bold text-dark-text mb-2">1. Apply</h4>
                    <p className="text-sm text-mid-text">Submit your trading history and proof of identity.</p>
                </div>
                 <div className="p-4 bg-light-hover rounded-lg">
                    <h4 className="font-bold text-dark-text mb-2">2. Verify</h4>
                    <p className="text-sm text-mid-text">We vet your performance to ensure quality.</p>
                </div>
                 <div className="p-4 bg-light-hover rounded-lg">
                    <h4 className="font-bold text-dark-text mb-2">3. Earn</h4>
                    <p className="text-sm text-mid-text">Publish content and get paid for every subscriber.</p>
                </div>
            </div>
            <button className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
                Start Application
            </button>
        </div>
    </div>
);

const ContactUsPage: React.FC<{ showToast: (msg: string, type: 'success' | 'info' | 'error') => void }> = ({ showToast }) => (
    <div className="p-8 bg-light-bg min-h-full flex items-center justify-center">
        <div className="bg-light-surface p-8 rounded-lg shadow-md border border-light-gray max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-6 text-dark-text">Contact Support</h2>
            <p className="text-mid-text mb-6">Have a question or need assistance? We're here to help.</p>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-dark-text mb-1">Subject</label>
                    <select className="w-full bg-light-hover border-light-gray rounded-md p-2 text-dark-text">
                        <option>General Inquiry</option>
                        <option>Technical Support</option>
                        <option>Billing Issue</option>
                        <option>Report a Bug</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-dark-text mb-1">Message</label>
                    <textarea rows={5} className="w-full bg-light-hover border-light-gray rounded-md p-2 text-dark-text" placeholder="Describe your issue..."></textarea>
                </div>
                <button onClick={() => showToast('Message sent! We will get back to you shortly.', 'success')} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg">
                    Send Message
                </button>
                <div className="text-center mt-4">
                     <p className="text-sm text-mid-text">Or email us directly at <a href="mailto:support@tradecompanion.app" className="text-primary hover:underline">support@tradecompanion.app</a></p>
                </div>
            </div>
        </div>
    </div>
);

// --- MAIN DASHBOARD COMPONENT ---

const DashboardPage: React.FC<DashboardPageProps> = ({ user, setUser, onLogout, activeView, onViewChange, showToast, theme, toggleTheme, activeTrades, setActiveTrades }) => {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedEducationArticle, setSelectedEducationArticle] = useState<EducationArticle | null>(null);
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Tracks if the user is currently viewing the app in Mentor mode (if eligible)
  const [isMentorMode, setIsMentorMode] = useState(false);

  const TRADE_HISTORY_KEY = `trade_history_${user.email}`;
  const EQUITY_KEY = `currentEquity_${user.email}`;
  const NOTIFICATIONS_KEY = `notifications_${user.email}`;

  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>(() => JSON.parse(localStorage.getItem(TRADE_HISTORY_KEY) || '[]'));
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    if (saved.length > 0) return saved;
    return [
        { id: 'promo-1', message: 'Premium plan is 20% off this week!', timestamp: new Date().toISOString(), isRead: false, linkTo: 'settings', type: 'promo' },
        { id: 'update-1', message: 'The Analytics page has been updated with new charts.', timestamp: new Date(Date.now() - 86400000).toISOString(), isRead: true, linkTo: 'analytics', type: 'app_update' },
    ];
  });
  
  // NEW: State for Floating P/L
  const [floatingPnL, setFloatingPnL] = useState(0);
  
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
  
  // Sync isMentorMode with user capability only initially or when user changes
  useEffect(() => {
      if (!user.isMentor) {
          setIsMentorMode(false);
      }
  }, [user.isMentor]);

  const toggleMentorMode = () => {
      const newMode = !isMentorMode;
      setIsMentorMode(newMode);
      setAccountMenuOpen(false);
      // Automatically switch view to the main dashboard of the respective mode
      if (newMode) {
          onViewChange('mentor_dashboard');
      } else {
          onViewChange('dashboard');
      }
  };


  // --- Automatic Signal Scanner ---
  useEffect(() => {
    const scannerInterval = setInterval(async () => {
      if (activeView !== 'dashboard' && activeView !== 'ai_signals') return;
      if (!user.subscribedPlan || user.subscribedPlan === PlanName.Free || !canUseFeature('aiSignal')) {
        return;
      }

      try {
        const settings = JSON.parse(localStorage.getItem(`tradeSettings_${user.email}`) || '{"balance": "10000", "risk": "1.0", "currency": "USD"}');
        const signalData = await scanForSignals(user.subscribedPlan, settings);
        
        if (signalData && signalData.signalFound) {
            const currentEquity = parseFloat(localStorage.getItem(EQUITY_KEY) || settings.balance);

            const newTrade: TradeRecord = {
              id: new Date().toISOString(),
              status: 'active',
              dateTaken: new Date().toISOString(),
              initialEquity: currentEquity,
              takeProfit: signalData.takeProfit1,
              ...signalData,
            };

            // UPDATED LOGIC: Prevent any new signal if an active trade exists for that instrument
            const alreadyExists = activeTrades.some(t => t.instrument === newTrade.instrument);
            
            if (!alreadyExists) {
                incrementUsage('aiSignal');
                setActiveTrades(prev => [newTrade, ...prev]);
                
                const newNotification: Notification = {
                    id: new Date().toISOString(),
                    message: `New Strategy A signal for ${newTrade.instrument}!`,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    linkTo: 'ai_signals',
                    type: 'signal',
                };
                setNotifications(prev => [newNotification, ...prev]);
                showToast(newNotification.message, 'success');

                if (user.cTraderConfig?.isConnected && user.cTraderConfig?.autoTradeEnabled) {
                    // CHECK IF INSTRUMENT IS SELECTED FOR AUTO-TRADING
                    const allowedInstruments = JSON.parse(localStorage.getItem(`ctrader_instruments_${user.email}`) || '[]');
                    
                    // Only execute if the list is populated and includes the instrument.
                    // If list is empty, default behavior: execute nothing (safety first)
                    if (allowedInstruments.length > 0 && allowedInstruments.includes(newTrade.instrument)) {
                        showToast(`Signal for ${newTrade.instrument} sent to cTrader for execution.`, 'success');
                    } else {
                        console.log(`Auto-trade skipped for ${newTrade.instrument}: Not in allowed list.`);
                    }
                }

                // --- TELEGRAM NOTIFICATION ---
                const isPremiumTier = user.subscribedPlan === PlanName.Pro || user.subscribedPlan === PlanName.Premium;
                if (isPremiumTier && user.telegramNumber) {
                    showToast(`Signal for ${newTrade.instrument} also sent to Telegram: ${user.telegramNumber}.`, 'info');
                }
            }
        }
      } catch (error) {
        console.error("Error during signal scan:", error);
      }
    }, 900000); // Scan every 15 minutes

    return () => clearInterval(scannerInterval);
  }, [activeView, user, canUseFeature, incrementUsage, showToast, activeTrades, EQUITY_KEY, addNotification, setActiveTrades]);


  // --- Live Trade Monitoring & Equity Calculation ---
  useEffect(() => {
    // Running this more frequently to update equity
    const monitorInterval = setInterval(async () => {
        if (activeTrades.length === 0) {
            setFloatingPnL(0);
            return;
        }

        const uniqueInstruments: string[] = Array.from(new Set(activeTrades.map((t: TradeRecord) => t.instrument)));
        const livePrices = await getLivePrices(uniqueInstruments);

        const closedTradeItems: { trade: TradeRecord, outcome: 'win' | 'loss', exitPrice: number }[] = [];
        let totalFloating = 0;
        
        activeTrades.forEach(trade => {
            const priceData = livePrices[trade.instrument];
            if (!priceData || priceData.price === null) {
                return;
            }
            
            const currentPrice = priceData.price;
            
            // Calculate Floating P/L
            const instrumentDef = instrumentDefinitions[trade.instrument];
            const contractSize = instrumentDef.contractSize;
            const lotSize = trade.lotSize || 0;
            const direction = trade.type === 'BUY' ? 1 : -1;
            
            let tradePnL = (currentPrice - trade.entryPrice) * (lotSize * contractSize) * direction;

            // Simplified conversion to USD
            if (instrumentDef.quoteCurrency === 'JPY') {
                tradePnL /= 150; // Approx USD/JPY
            } else if (instrumentDef.quoteCurrency === 'CHF') {
                tradePnL /= 0.9; // Approx USD/CHF
            } else if (instrumentDef.quoteCurrency === 'CAD') {
                tradePnL /= 1.35; // Approx USD/CAD
            } else if (instrumentDef.quoteCurrency === 'GBP') {
                tradePnL *= 1.25; // Approx GBP/USD
            }
            
            totalFloating += tradePnL;

            // Check Stop Loss / Take Profit
            if (!priceData.isMock) { // Only close trades on real price data
                let isWin = false;
                let isLoss = false;

                if (trade.type === 'BUY') {
                    isWin = currentPrice >= trade.takeProfit;
                    isLoss = currentPrice <= trade.stopLoss;
                } else { // SELL
                    isWin = currentPrice <= trade.takeProfit;
                    isLoss = currentPrice >= trade.stopLoss;
                }

                if (isWin) {
                    closedTradeItems.push({ trade, outcome: 'win', exitPrice: trade.takeProfit });
                } else if (isLoss) {
                    closedTradeItems.push({ trade, outcome: 'loss', exitPrice: trade.stopLoss });
                }
            }
        });
        
        setFloatingPnL(totalFloating);

        if (closedTradeItems.length > 0) {
            const closedTradeIds = new Set(closedTradeItems.map(item => item.trade.id));
            const newActiveTrades = activeTrades.filter(t => !closedTradeIds.has(t.id));

            let currentEquity = parseFloat(localStorage.getItem(EQUITY_KEY) || '10000');
            const newHistoryItems: TradeRecord[] = [];

            closedTradeItems.forEach(item => {
                const { trade, outcome, exitPrice } = item;
                const instrumentProps = instrumentDefinitions[trade.instrument];
                const contractSize = instrumentProps?.contractSize || 100000;
                const lotSize = trade.lotSize || 0;
                
                // Re-calculate final PnL for closing (simpler version of loop logic above but using exitPrice)
                let pnl = (exitPrice - trade.entryPrice) * (lotSize * contractSize) * (trade.type === 'BUY' ? 1 : -1);
                
                if (instrumentProps.quoteCurrency === 'JPY') pnl /= 150;
                else if (instrumentProps.quoteCurrency === 'CHF') pnl /= 0.9;
                else if (instrumentProps.quoteCurrency === 'CAD') pnl /= 1.35;
                else if (instrumentProps.quoteCurrency === 'GBP') pnl *= 1.25;

                currentEquity += pnl;

                showToast(
                    `${trade.instrument} trade closed as a ${outcome}. P&L: $${pnl.toFixed(2)}`,
                    outcome === 'win' ? 'success' : 'error'
                );

                newHistoryItems.push({
                    ...trade,
                    status: outcome,
                    pnl,
                    finalEquity: currentEquity,
                    dateClosed: new Date().toISOString(),
                });
            });

            // BATCH UPDATE STATE
            setActiveTrades(newActiveTrades);
            setTradeHistory(prev => [...newHistoryItems, ...prev]);
            localStorage.setItem(EQUITY_KEY, currentEquity.toString());
            // Force storage event update if needed
            window.dispatchEvent(new Event('storage'));
        }

    }, 5000); // Check every 5 seconds for "Live" feel

    return () => clearInterval(monitorInterval);
  }, [activeTrades, showToast, EQUITY_KEY, setActiveTrades]);

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

  const currentBalance = parseFloat(localStorage.getItem(EQUITY_KEY) || '10000');
  const liveEquity = currentBalance + floatingPnL;

  const renderContent = () => {
    switch (activeView) {
      // Fix: Standard user dashboard shouldn't auto-switch based on user.isMentor
      case 'dashboard': return <DashboardOverview user={user} onViewChange={onViewChange} activeTrades={activeTrades} tradeHistory={tradeHistory} liveEquity={liveEquity} floatingPnL={floatingPnL} />;
      case 'ai_signals': return <AISignalsPage user={user} showToast={showToast} activeTrades={activeTrades} tradeHistory={tradeHistory} onViewChange={onViewChange} />;
      case 'mentors': return <MentorPage onViewMentor={handleViewMentor} user={user} />;
      case 'followers': return <FollowersPage />;
      case 'analytics': return isMentorMode ? <MentorAnalyticsPage user={user} /> : <AnalyticsPage user={user} liveEquity={liveEquity} floatingPnL={floatingPnL} />;
      case 'education': return <EducationPage onViewContent={handleViewEducationContent} />;
      case 'education_content': return selectedEducationArticle ? <EducationContentPage article={selectedEducationArticle} onBack={handleBackToEducation} /> : <EducationPage onViewContent={handleViewEducationContent} />;
      case 'lot_size_calculator': return <LotSizeCalculatorPage user={user} />;
      case 'market_chart': return <MarketChartPage theme={theme} />;
      case 'settings': return <SettingsPage user={user} setUser={setUser} showToast={showToast} />;
      case 'apply_mentor': return <ApplyMentorPage />;
      case 'mentor_dashboard': return <MentorDashboard user={user} showToast={showToast} addNotification={addNotification} />;
      case 'mentor_profile': return selectedMentor ? <MentorProfilePage mentor={selectedMentor} onBack={handleBackToMentors} /> : <MentorPage onViewMentor={handleViewMentor} user={user} />;
      case 'contact_us': return <ContactUsPage showToast={showToast} />;
      default: return <DashboardOverview user={user} onViewChange={onViewChange} activeTrades={activeTrades} tradeHistory={tradeHistory} liveEquity={liveEquity} floatingPnL={floatingPnL} />;
    }
  };

  return (
    <div className="flex h-screen bg-light-bg text-dark-text">
      {/* Sidebar */}
      <aside className={`bg-light-surface p-4 flex flex-col border-r border-light-gray shadow-sm transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex items-center justify-between px-2 mb-8">
            {!isSidebarCollapsed && <h1 className="text-2xl font-bold text-primary">Trade Companion</h1>}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className={`p-1 rounded-md hover:bg-light-hover text-mid-text ${isSidebarCollapsed && 'mx-auto'}`}>
                <Icon name={isSidebarCollapsed ? "arrowRight" : "arrowLeft"} className="w-6 h-6" />
            </button>
        </div>
        
        <nav className="flex-1 space-y-4">
          {isMentorMode ? (
             <>
                <div>
                    <p className={`text-xs text-mid-text uppercase font-semibold mb-2 ${isSidebarCollapsed ? 'hidden' : 'px-4'}`}>Mentor Area</p>
                    <NavLink view="mentor_dashboard" icon="dashboard" label="Dashboard" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
                    <NavLink view="followers" icon="mentors" label="Followers" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
                    <NavLink view="analytics" icon="analytics" label="Analytics" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
                </div>
             </>
          ) : (
             <>
                <div>
                    <p className={`text-xs text-mid-text uppercase font-semibold mb-2 ${isSidebarCollapsed ? 'hidden' : 'px-4'}`}>Navigation</p>
                    <NavLink view="dashboard" icon="dashboard" label="Dashboard" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
                    <NavLink view="ai_signals" icon="signals" label="AI Signals" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} badgeCount={activeTrades.length} />
                    <NavLink view="mentors" icon="mentors" label="Mentors" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
                    <NavLink view="education" icon="education" label="Education" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
                    <NavLink view="analytics" icon="analytics" label="Analytics" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
                </div>
                <div className="pt-4 border-t border-light-gray">
                    <p className={`text-xs text-mid-text uppercase font-semibold mb-2 ${isSidebarCollapsed ? 'hidden' : 'px-4'}`}>Tools</p>
                    <NavLink view="lot_size_calculator" icon="calculator" label="Lot Size Calculator" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
                    <NavLink view="market_chart" icon="chart-bar" label="Market Chart" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
                </div>
             </>
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
            <div className={`absolute z-10 w-56 bg-light-surface rounded-lg shadow-xl border border-light-gray py-2 animate-fade-in-right ${isSidebarCollapsed ? 'left-full bottom-0 ml-2' : 'bottom-full left-0 right-0 mb-2'}`}>
              <a onClick={() => { onViewChange('settings'); setAccountMenuOpen(false); }} href="#" className="flex items-center px-4 py-2 text-sm text-dark-text hover:bg-light-hover"><Icon name="settings" className="w-5 h-5 mr-2 text-mid-text"/>Settings</a>
              <a onClick={() => { onViewChange('contact_us'); setAccountMenuOpen(false); }} href="#" className="flex items-center px-4 py-2 text-sm text-dark-text hover:bg-light-hover"><Icon name="mail" className="w-5 h-5 mr-2 text-mid-text"/>Contact Us</a>
              <hr className="border-light-gray my-1" />
              {user.isMentor ? (
                 <button onClick={toggleMentorMode} className="w-full flex items-center px-4 py-2 text-sm text-primary font-semibold hover:bg-light-hover">
                    <Icon name="mentors" className="w-5 h-5 mr-2 text-primary"/>
                    {isMentorMode ? "Switch to User" : "Switch to Mentor"}
                 </button>
              ) : (
                <a onClick={() => { onViewChange('apply_mentor'); setAccountMenuOpen(false); }} href="#" className="flex items-center px-4 py-2 text-sm text-dark-text hover:bg-light-hover"><Icon name="apply" className="w-5 h-5 mr-2 text-mid-text"/>Become a Mentor</a>
              )}
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
                            <path d="M14.5 12 A 0.5 0.5 0 0 1 15 12.5 A 0.5 0.5 0 0 1 14.5 13 A 0.5 0.5 0 0 1 14 12.5 A 0.5 0.5 0 0 1 14 12.5 A 0.5 0.5 0 0 1 14.5 12 Z" />
                        </svg>
                    </span>
                </label>
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
