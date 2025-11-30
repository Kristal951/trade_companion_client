





import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DashboardView, User, EducationArticle, PlanName, Mentor, MentorPost, TradeRecord, Notification, Signal, NotificationType, RecentSignal } from '../../types';
import Icon from '../ui/Icon';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Sector, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceLine } from 'recharts';
import AISignalsPage from '../signals/AISignalsPage';
import LotSizeCalculatorPage from '../calculator/LotSizeCalculatorPage';
import MentorDashboard from '../mentors/MentorDashboard';
import MentorProfilePage from '../mentors/MentorProfilePage';
import MarketChartPage from './MarketChartPage';
import { scanForSignals, TARGET_INSTRUMENTS } from '../../services/geminiService';
import NotificationBell from '../ui/NotificationBell';
import { useUsageTracker } from '../../hooks/useUsageTracker';
import { getLivePrices } from '../../services/marketDataService';
import { instrumentDefinitions } from '../../config/instruments';
import FollowersPage from '../mentors/FollowersPage';
import SecureContent from '../ui/SecureContent';
import { PLAN_FEATURES } from '../../config/plans';
import MentorPayoutsPage from '../mentors/MentorPayoutsPage';

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
        <div class="space-y-6 text-dark-text">
            <h2 class="text-2xl font-bold text-primary">What is Forex and Why It Matters</h2>
            <p>The Foreign Exchange Market (Forex or FX) is the global infrastructure that enables currency conversion, affecting every individual, corporation, and nation—knowingly or unknowingly.</p>

            <div class="bg-light-hover p-4 rounded-lg border border-light-gray">
                <h3 class="font-bold flex items-center"><span class="text-xl mr-2">🔄</span> Core Concept</h3>
                <p>Every international transaction—be it trade, travel, investing, or aid—involves a currency exchange. Forex is the invisible engine that allows this seamless interchange.</p>
            </div>

            <div>
                <h3 class="font-bold flex items-center"><span class="text-xl mr-2">💡</span> Forex is the lifeblood of:</h3>
                <ul class="list-disc pl-6 space-y-2 mt-2">
                    <li><strong>International Trade & Commerce:</strong> Companies buying raw materials from other countries.</li>
                    <li><strong>Capital Markets and Investments:</strong> Investors buying stocks or bonds in foreign markets.</li>
                    <li><strong>Tourism and Travel:</strong> Travelers exchanging money for local spending.</li>
                    <li><strong>Global Banking and Liquidity:</strong> Banks managing currency reserves.</li>
                </ul>
            </div>

            <div class="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                <strong>Real-World Example:</strong> A Nigerian oil exporter selling crude to China gets paid in USD. To spend those earnings locally on operations or salaries, the exporter must convert that USD to NGN. The FX market facilitates this conversion.
            </div>

            <!-- Image Placeholder 1 -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Flow of Money Diagram</p>
                <p class="text-xs text-mid-text mb-4">Visualizing Trade, Travel, and Investment connecting to Currency Exchange.</p>
                <a href="https://chatgpt.com/s/m_6924396b8fdc8191a9478e28abe3d013" target="_blank" rel="noopener noreferrer" class="text-primary text-xs hover:underline">View Reference Image</a>
            </div>

            <h2 class="text-2xl font-bold text-primary mt-8">🏛️ SECTION 2: Evolution of the Forex Market</h2>
            <ul class="space-y-3">
                <li><strong>Ancient Times:</strong> Barter systems → Metal coins → The Gold Standard.</li>
                <li><strong>Bretton Woods Agreement (1944–1971):</strong> Major currencies were pegged to the US Dollar, which was in turn pegged to gold. This provided stability but lacked flexibility.</li>
                <li><strong>Post-1971 (Nixon Shock):</strong> The USD was decoupled from gold. Floating exchange rates emerged, allowing supply and demand to drive prices naturally.</li>
                <li><strong>Modern FX Market (1990s – Present):</strong> The Internet democratized access. Online platforms, retail brokers, and algorithmic trading entered the scene. Today, over $7.5 trillion is traded daily.</li>
            </ul>

            <!-- Image Placeholder 2 -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Evolution of Trading Infographic</p>
                <a href="https://chatgpt.com/s/m_69243b4e5d388191a7b165e798b64249" target="_blank" rel="noopener noreferrer" class="text-primary text-xs hover:underline">View Reference Image</a>
            </div>

            <h3 class="font-bold text-lg mt-8">🧩 SECTION 3: The Structure of the Forex Market</h3>
            
            <h4 class="font-bold mt-2">🔄 Decentralized System</h4>
            <p>Unlike stock markets (like the NYSE) which have a centralized physical location, Forex has no central exchange. It is a decentralized network of banks, brokers, and participants connected electronically.</p>

            <h4 class="font-bold mt-4">🏦 Market Tiers</h4>
            <ol class="list-decimal pl-6 space-y-2">
                <li><strong>Tier 1 (Interbank Market):</strong> Central banks, hedge funds, commercial banks. They trade massive volumes directly with each other.</li>
                <li><strong>Tier 2 (Prime Brokers):</strong> Large institutions accessing deep liquidity.</li>
                <li><strong>Tier 3 (Retail Brokers):</strong> Companies that provide platform access to individual traders like you.</li>
                <li><strong>Tier 4 (Retail Traders):</strong> Individuals trading via platforms like MT4/MT5, cTrader, etc.</li>
            </ol>

            <!-- Image Placeholder 3 -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: The Market Hierarchy Pyramid</p>
                <a href="https://chatgpt.com/s/m_69243e2d0d488191a69599a565e2a97a" target="_blank" rel="noopener noreferrer" class="text-primary text-xs hover:underline">View Reference Image</a>
            </div>

            <h3 class="font-bold text-lg mt-8">⚖️ SECTION 4: The Big Players – Who Are You Trading Against?</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full border-collapse border border-light-gray mt-4">
                    <thead>
                        <tr class="bg-light-hover">
                            <th class="border border-light-gray p-2 text-left">Participant</th>
                            <th class="border border-light-gray p-2 text-left">Role in FX</th>
                            <th class="border border-light-gray p-2 text-left">Market Power</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Central Banks</td>
                            <td class="border border-light-gray p-2">Policy-driven buying/selling to stabilize economies (e.g., Federal Reserve, ECB).</td>
                            <td class="border border-light-gray p-2 text-danger font-bold">Very High</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Commercial Banks</td>
                            <td class="border border-light-gray p-2">Major liquidity providers; they handle trillions in FX flows for clients.</td>
                            <td class="border border-light-gray p-2 text-warning font-bold">High</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Hedge Funds</td>
                            <td class="border border-light-gray p-2">Speculate or hedge with large positions to generate profit.</td>
                            <td class="border border-light-gray p-2 text-warning font-bold">High</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Corporations</td>
                            <td class="border border-light-gray p-2">Convert profits & pay international suppliers (e.g., Apple, Toyota).</td>
                            <td class="border border-light-gray p-2 text-info font-bold">Medium</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Retail Traders</td>
                            <td class="border border-light-gray p-2">Speculate on price movements for personal profit.</td>
                            <td class="border border-light-gray p-2 text-mid-text font-bold">Low (Individually)</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 class="font-bold text-lg mt-8">🔁 SECTION 5: Understanding Currency Pairs</h3>
            <p>Every FX transaction involves two currencies. You cannot buy one without selling another.<br>Example: EUR/USD = 1.1200 means €1 = $1.12.</p>

            <h4 class="font-bold mt-4">🧮 Pair Categories:</h4>
            <ul class="list-disc pl-6 space-y-2">
                <li><strong>Majors (e.g., EUR/USD, USD/JPY, GBP/USD):</strong> Always involve the US Dollar. High liquidity, tightest spreads. Best for beginners.</li>
                <li><strong>Minors/Crosses (e.g., EUR/GBP, AUD/CAD):</strong> Major currencies traded against each other, excluding USD. Good liquidity.</li>
                <li><strong>Exotics (e.g., USD/ZAR, USD/NGN):</strong> One major currency and one emerging market currency. Low liquidity, high volatility, and larger spreads (cost).</li>
            </ul>

            <h4 class="font-bold mt-4">🧠 Key Concepts:</h4>
            <ul class="list-disc pl-6 space-y-2">
                <li><strong>Base Currency:</strong> The first currency in the pair (e.g., EUR in EUR/USD). This is the "direction" of the chart.</li>
                <li><strong>Quote Currency:</strong> The second currency in the pair (e.g., USD in EUR/USD). This is the "money" you pay.</li>
                <li><strong>Pip:</strong> Percentage in Point. It is the standard unit of movement (usually the 4th decimal place).</li>
                <li><strong>Lot Size:</strong> The volume traded (Standard Lot = 100,000 units, Mini = 10,000, Micro = 1,000).</li>
            </ul>

            <!-- Image Placeholder 4 -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Anatomy of a Currency Pair</p>
                <a href="https://chatgpt.com/s/m_69243ea03824819191424775ab1d5a68" target="_blank" rel="noopener noreferrer" class="text-primary text-xs hover:underline">View Reference Image</a>
            </div>

            <h3 class="font-bold text-lg mt-8">⚖️ SECTION 6: Advantages vs. Risks in Forex Trading</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div class="bg-success/5 p-4 rounded-lg border border-success/20">
                    <h4 class="font-bold text-success text-lg mb-3">✅ Advantages</h4>
                    <ul class="list-disc pl-5 space-y-2">
                        <li><strong>24/5 Market:</strong> Trade across sessions (Asian, London, New York).</li>
                        <li><strong>High Liquidity:</strong> Enter and exit trades instantly.</li>
                        <li><strong>Leverage:</strong> Control large positions with small equity.</li>
                        <li><strong>Diverse Strategies:</strong> Scalping, Swing, Position.</li>
                    </ul>
                </div>
                <div class="bg-danger/5 p-4 rounded-lg border border-danger/20">
                    <h4 class="font-bold text-danger text-lg mb-3">❌ Risks</h4>
                    <ul class="list-disc pl-5 space-y-2">
                        <li><strong>Leverage Amplifies Losses:</strong> It works both ways.</li>
                        <li><strong>News Volatility:</strong> Events like NFP can cause massive spikes.</li>
                        <li><strong>Overtrading & Emotions:</strong> Discipline is key.</li>
                        <li><strong>Fake Brokers:</strong> Always use regulated brokers.</li>
                    </ul>
                </div>
            </div>

            <!-- Image Placeholder 5 -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Risk vs. Reward of Leverage Chart</p>
                <a href="https://chatgpt.com/s/m_69243fb38cd48191b6b89cb74e01b53e" target="_blank" rel="noopener noreferrer" class="text-primary text-xs hover:underline">View Reference Image</a>
            </div>

            <hr class="my-10 border-t-2 border-light-gray" />

            <h2 class="text-2xl font-bold text-primary">📘 Understanding Currency Pairs & Market Sessions</h2>
            
            <h3 class="font-bold text-lg mt-4">SECTION 1: What is a Currency Pair?</h3>
            <p>Forex trading always involves two currencies quoted together. A currency pair tells you how much of the quote currency you need to buy one unit of the base currency.</p>
            <p class="mt-2"><strong>Example: EUR/USD = 1.1050</strong></p>
            <ul class="list-disc pl-6 mt-2">
                <li>This means 1 Euro is equal to 1.1050 U.S. Dollars.</li>
                <li>When you <strong>BUY</strong> EUR/USD, you are buying EUR and selling USD (betting Euro gets stronger).</li>
                <li>When you <strong>SELL</strong> EUR/USD, you are selling EUR and buying USD (betting Euro gets weaker).</li>
            </ul>

            <h3 class="font-bold text-lg mt-6">SECTION 2: Understanding Bid, Ask, and Spread</h3>
            <ul class="list-disc pl-6 space-y-2">
                <li><strong>Bid Price:</strong> The price the broker will pay to buy from you (Your Sell Price).</li>
                <li><strong>Ask Price:</strong> The price the broker charges to sell to you (Your Buy Price).</li>
                <li><strong>Spread:</strong> The difference between the Bid and Ask. This is the broker’s fee/profit.</li>
            </ul>
            <p class="mt-2 bg-light-hover p-2 rounded">Formula: <code>Ask - Bid = Spread</code>. (Smaller spreads = better conditions)</p>

            <!-- Image Placeholder 6 -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Bid/Ask Button Interface</p>
                <a href="https://chatgpt.com/s/m_6924408d1d2c8191bcd2054ab89284f2" target="_blank" rel="noopener noreferrer" class="text-primary text-xs hover:underline">View Reference Image</a>
            </div>

            <h3 class="font-bold text-lg mt-6">SECTION 3: How Do Exchange Rates Move?</h3>
            <p>Currency prices change due to supply and demand driven by:</p>
            <ul class="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Economic Indicators:</strong> GDP growth, interest rates, inflation.</li>
                <li><strong>Political Events:</strong> Elections, wars, trade treaties.</li>
                <li><strong>Central Bank Decisions:</strong> Printing money or raising rates.</li>
                <li><strong>Market Sentiment:</strong> Fear or Greed.</li>
            </ul>

            <h3 class="font-bold text-lg mt-6">SECTION 4: Forex Trading Sessions</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full border-collapse border border-light-gray mt-4">
                    <thead>
                        <tr class="bg-light-hover">
                            <th class="border border-light-gray p-2">Session</th>
                            <th class="border border-light-gray p-2">City</th>
                            <th class="border border-light-gray p-2">Time (GMT)</th>
                            <th class="border border-light-gray p-2">Highlights</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-light-gray p-2">Sydney</td>
                            <td class="border border-light-gray p-2">Sydney</td>
                            <td class="border border-light-gray p-2">22:00 – 07:00</td>
                            <td class="border border-light-gray p-2">Least volatile. Often consolidates.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2">Tokyo</td>
                            <td class="border border-light-gray p-2">Tokyo</td>
                            <td class="border border-light-gray p-2">00:00 – 09:00</td>
                            <td class="border border-light-gray p-2">Asian market activity. Focus on JPY pairs.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2">London</td>
                            <td class="border border-light-gray p-2">London</td>
                            <td class="border border-light-gray p-2">08:00 – 17:00</td>
                            <td class="border border-light-gray p-2">High liquidity and volatility. Major trend moves start here.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2">New York</td>
                            <td class="border border-light-gray p-2">New York</td>
                            <td class="border border-light-gray p-2">13:00 – 22:00</td>
                            <td class="border border-light-gray p-2">Heavy USD influence. High volatility.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 class="font-bold text-lg mt-6">SECTION 5: Session Overlaps</h3>
            <p>Market overlaps are periods when two major sessions are open simultaneously. This increases trading volume and volatility.</p>
            <div class="bg-warning/10 p-4 mt-2 rounded-lg border-l-4 border-warning">
                <strong>London–New York Overlap (13:00 – 17:00 GMT):</strong> This is the "Golden Time." The two biggest financial centers are active. Highest trading volume and biggest moves occur here.
            </div>

            <!-- Image Placeholder 7 -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: 24-Hour Session Clock</p>
                <a href="https://chatgpt.com/s/m_6924418ec6448191bf325be56fa3511e" target="_blank" rel="noopener noreferrer" class="text-primary text-xs hover:underline">View Reference Image</a>
            </div>
        </div>
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
        <div class="space-y-6 text-dark-text">
            <h2 class="text-2xl font-bold text-primary">Pips, Lots & Leverage – The Math of Trading</h2>
            <p><strong>Objective:</strong> Demystify the mathematical mechanics of Forex. To trade safely, you must understand how value is calculated, how volume is measured, and how leverage powers your trades.</p>

            <h3 class="text-xl font-bold mt-6 text-primary">📏 SECTION 1: What is a Pip?</h3>
            <p>A "Pip" stands for "Percentage in Point". It is the standard unit of measurement for price movement in Forex.</p>

            <h4 class="font-bold mt-4">How to Read Pips:</h4>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Standard Pairs (e.g., EUR/USD):</strong> The Pip is the 4th decimal place.</li>
                <li>Price moves from 1.1050 to 1.1051 = <strong>1 Pip move</strong>.</li>
                <li><strong>JPY Pairs (e.g., USD/JPY):</strong> The Pip is the 2nd decimal place.</li>
                <li>Price moves from 110.50 to 110.51 = <strong>1 Pip move</strong>.</li>
            </ul>

            <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-4">
                <h4 class="font-bold">Pip Value Calculation (Approximate):</h4>
                <ul class="list-disc pl-6 mt-2">
                    <li>If you trade a <strong>Standard Lot (1.00)</strong>, 1 Pip is worth approximately <strong>$10 USD</strong>.</li>
                    <li>If you trade a <strong>Mini Lot (0.10)</strong>, 1 Pip is worth approximately <strong>$1 USD</strong>.</li>
                </ul>
            </div>

            <h3 class="text-xl font-bold mt-8 text-primary">📦 SECTION 2: Lot Sizes (Volume)</h3>
            <p>In Forex, you don't buy "1 dollar" or "1 euro." You buy Lots. This is how we measure trade volume.</p>

            <div class="overflow-x-auto mt-4">
                <table class="min-w-full border-collapse border border-light-gray">
                    <thead>
                        <tr class="bg-light-hover">
                            <th class="border border-light-gray p-2 text-left">Lot Type</th>
                            <th class="border border-light-gray p-2 text-left">Volume (Units)</th>
                            <th class="border border-light-gray p-2 text-left">Metatrader Input</th>
                            <th class="border border-light-gray p-2 text-left">Value per Pip (Approx)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Standard Lot</td>
                            <td class="border border-light-gray p-2">100,000</td>
                            <td class="border border-light-gray p-2">1.00</td>
                            <td class="border border-light-gray p-2 font-bold text-success">$10</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Mini Lot</td>
                            <td class="border border-light-gray p-2">10,000</td>
                            <td class="border border-light-gray p-2">0.10</td>
                            <td class="border border-light-gray p-2 font-bold text-info">$1</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Micro Lot</td>
                            <td class="border border-light-gray p-2">1,000</td>
                            <td class="border border-light-gray p-2">0.01</td>
                            <td class="border border-light-gray p-2 font-bold text-mid-text">$0.10</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="bg-danger/5 p-4 rounded-lg border border-danger/20 mt-4">
                <strong class="text-danger">Critical Lesson:</strong> New traders often blow accounts because they use a Standard Lot (1.00) on a small account, meaning a tiny 20-pip move against them loses $200 instantly. Start with Micro Lots (0.01).
            </div>

            <h3 class="text-xl font-bold mt-8 text-primary">⚙️ SECTION 3: Leverage & Margin</h3>
            <p>Leverage is borrowing power provided by your broker. It allows you to open large positions with a small deposit.</p>
            <p class="mt-2">Margin is the "good faith deposit" required to open that position.</p>

            <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-4">
                <h4 class="font-bold">How Leverage Works (Example 1:100):</h4>
                <ul class="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Your Money:</strong> $100</li>
                    <li><strong>Broker's Money:</strong> $9,900</li>
                    <li><strong>Total Buying Power:</strong> $10,000</li>
                </ul>
            </div>

            <h4 class="font-bold mt-6 text-lg">The Double-Edged Sword:</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div class="bg-success/5 p-3 rounded border border-success/20">
                    <strong>Pros:</strong> You can make significant profits on small price moves.
                </div>
                <div class="bg-danger/5 p-3 rounded border border-danger/20">
                    <strong>Cons:</strong> You can lose your entire account balance just as quickly.
                </div>
            </div>
            
            <p class="mt-4 text-sm text-mid-text italic"><strong>Warning:</strong> High leverage does not change the value of a pip; it simply allows you to buy more lots than you could afford with cash.</p>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: The Lever Diagram</p>
                <p class="text-xs text-mid-text">Small weight (Your Capital) lifting massive crate (Buying Power) via 1:100 Leverage.</p>
            </div>

            <div class="bg-info/10 p-4 rounded-lg border border-info/20 mt-4">
                <h4 class="font-bold text-info">🧪 Practical Task:</h4>
                <ol class="list-decimal pl-6 mt-2 space-y-2">
                    <li>Open your MT4/MT5 demo account.</li>
                    <li>Open a calculator.</li>
                    <li>Calculate the value of a 50-pip move on a 0.05 lot size (Hint: 0.05 is 5x a micro lot).</li>
                    <li>Execute a 0.01 lot trade on EUR/USD and watch the profit/loss move by cents.</li>
                </ol>
            </div>
        </div>
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
        <div class="space-y-6 text-dark-text">
            <h1 class="text-3xl font-bold text-primary mb-4">Forex Trading for Dummies: A Beginner's Guide</h1>
            <p class="text-xl text-mid-text italic mb-6">Your Essential Handbook to Currency Markets</p>
            <p class="mb-4">From Novice to Independent Trader - Theory, Tools & Execution</p>
            <div class="bg-primary/5 p-4 rounded-lg border-l-4 border-primary mb-8">
                <p class="italic font-semibold">"Discipline + Knowledge + Execution = Profitable Trading."</p>
                <p class="text-sm text-right mt-2">— Trade Companion Educational Series</p>
            </div>

            <h2 class="text-2xl font-bold text-primary mt-8">👋 Welcome to Your Trade Companion</h2>
            <p>Before you start using our AI-generated signals, it is critical to understand the machine you are operating. The market is unforgiving to those who trade blindly. This guide is your roadmap. It transforms complex financial concepts into actionable steps, ensuring that when our AI gives you a signal, you understand the why behind the what.</p>

            <hr class="my-8 border-light-gray" />

            <h2 class="text-2xl font-bold text-primary mt-8">🧭 WEEK 1: Introduction to Forex Trading – The Foundation</h2>
            <p class="mb-4"><strong>Objective:</strong> Build foundational mastery of the foreign exchange market by understanding its structure, purpose, history, participants, and mechanisms.</p>

            <h3 class="font-bold text-lg mt-4">🔍 SECTION 1: What is Forex and Why It Matters</h3>
            <p>The Foreign Exchange Market (Forex or FX) is the global infrastructure that enables currency conversion, affecting every individual, corporation, and nation—knowingly or unknowingly.</p>

            <h4 class="font-bold mt-4">🔄 Core Concept:</h4>
            <p>Every international transaction—be it trade, travel, investing, or aid—involves a currency exchange. Forex is the invisible engine that allows this seamless interchange.</p>

            <h4 class="font-bold mt-4">💡 Forex is the lifeblood of:</h4>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>International Trade & Commerce:</strong> Companies buying raw materials from other countries.</li>
                <li><strong>Capital Markets and Investments:</strong> Investors buying stocks or bonds in foreign markets.</li>
                <li><strong>Tourism and Travel:</strong> Travelers exchanging money for local spending.</li>
                <li><strong>Global Banking and Liquidity:</strong> Banks managing currency reserves.</li>
            </ul>

            <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-4">
                <strong>Real-World Example:</strong> A Nigerian oil exporter selling crude to China gets paid in USD. To spend those earnings locally on operations or salaries, the exporter must convert that USD to NGN. The FX market facilitates this conversion.
            </div>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Flow of Money Diagram</p>
                <p class="text-xs text-mid-text">Oil tanker (Trade), Tourist (Travel), and Stock graph (Investment) connecting to central currency exchange.</p>
            </div>

            <h3 class="font-bold text-lg mt-8">🏛️ SECTION 2: Evolution of the Forex Market</h3>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Ancient Times:</strong> Barter systems → Metal coins → The Gold Standard.</li>
                <li><strong>Bretton Woods Agreement (1944–1971):</strong> Major currencies were pegged to the US Dollar, which was in turn pegged to gold. This provided stability but lacked flexibility.</li>
                <li><strong>Post-1971 (Nixon Shock):</strong> The USD was decoupled from gold. Floating exchange rates emerged, allowing supply and demand to drive prices naturally.</li>
                <li><strong>Modern FX Market (1990s – Present):</strong> The Internet democratized access. Online platforms, retail brokers, and algorithmic trading entered the scene. Today, over $7.5 trillion is traded daily.</li>
            </ul>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Evolution of Trading Infographic</p>
                <p class="text-xs text-mid-text">Timeline: 1870s Gold Coin → 1944 Bretton Woods → Modern smartphone trading.</p>
            </div>

            <h3 class="font-bold text-lg mt-8">🧩 SECTION 3: The Structure of the Forex Market</h3>
            
            <h4 class="font-bold mt-2">🔄 Decentralized System:</h4>
            <p>Unlike stock markets (like the NYSE) which have a centralized physical location, Forex has no central exchange. It is a decentralized network of banks, brokers, and participants connected electronically.</p>

            <h4 class="font-bold mt-4">🏦 Market Tiers:</h4>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Tier 1 (Interbank Market):</strong> Central banks, hedge funds, commercial banks. They trade massive volumes directly with each other.</li>
                <li><strong>Tier 2 (Prime Brokers):</strong> Large institutions accessing deep liquidity.</li>
                <li><strong>Tier 3 (Retail Brokers):</strong> Companies that provide platform access to individual traders like you.</li>
                <li><strong>Tier 4 (Retail Traders):</strong> Individuals trading via platforms like MT4/MT5, cTrader, etc.</li>
            </ul>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: The Market Hierarchy Pyramid</p>
                <p class="text-xs text-mid-text">Peak: Central Banks. Middle: Banks/Hedge Funds. Base: Retail Traders.</p>
            </div>

            <h3 class="font-bold text-lg mt-8">⚖️ SECTION 4: The Big Players – Who Are You Trading Against?</h3>
            <div class="overflow-x-auto mt-4">
                <table class="min-w-full border-collapse border border-light-gray text-sm">
                    <thead>
                        <tr class="bg-light-hover">
                            <th class="border border-light-gray p-2 text-left">Participant</th>
                            <th class="border border-light-gray p-2 text-left">Role in FX</th>
                            <th class="border border-light-gray p-2 text-left">Market Power</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Central Banks</td>
                            <td class="border border-light-gray p-2">Policy-driven buying/selling to stabilize economies (e.g., Federal Reserve, ECB).</td>
                            <td class="border border-light-gray p-2 text-danger font-bold">Very High</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Commercial Banks</td>
                            <td class="border border-light-gray p-2">Major liquidity providers; they handle trillions in FX flows for clients.</td>
                            <td class="border border-light-gray p-2 text-warning font-bold">High</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Hedge Funds</td>
                            <td class="border border-light-gray p-2">Speculate or hedge with large positions to generate profit.</td>
                            <td class="border border-light-gray p-2 text-warning font-bold">High</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Corporations</td>
                            <td class="border border-light-gray p-2">Convert profits & pay international suppliers (e.g., Apple, Toyota).</td>
                            <td class="border border-light-gray p-2 text-info font-bold">Medium</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Retail Traders</td>
                            <td class="border border-light-gray p-2">Speculate on price movements for personal profit.</td>
                            <td class="border border-light-gray p-2 text-mid-text font-bold">Low (Individually)</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 class="font-bold text-lg mt-8">🔁 SECTION 5: Understanding Currency Pairs</h3>
            <p>Every FX transaction involves two currencies. You cannot buy one without selling another.<br>Example: EUR/USD = 1.1200 means €1 = $1.12.</p>

            <h4 class="font-bold mt-4">🧮 Pair Categories:</h4>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Majors (e.g., EUR/USD, USD/JPY, GBP/USD):</strong> Always involve the US Dollar. High liquidity, tightest spreads. Best for beginners.</li>
                <li><strong>Minors/Crosses (e.g., EUR/GBP, AUD/CAD):</strong> Major currencies traded against each other, excluding USD. Good liquidity.</li>
                <li><strong>Exotics (e.g., USD/ZAR, USD/NGN):</strong> One major currency and one emerging market currency. Low liquidity, high volatility, and larger spreads (cost).</li>
            </ul>

            <h4 class="font-bold mt-4">🧠 Key Concepts:</h4>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Base Currency:</strong> The first currency in the pair (e.g., EUR in EUR/USD). This is the "direction" of the chart.</li>
                <li><strong>Quote Currency:</strong> The second currency in the pair (e.g., USD in EUR/USD). This is the "money" you pay.</li>
                <li><strong>Pip:</strong> Percentage in Point. It is the standard unit of movement (usually the 4th decimal place).</li>
                <li><strong>Lot Size:</strong> The volume traded (Standard Lot = 100,000 units, Mini = 10,000, Micro = 1,000).</li>
            </ul>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Anatomy of a Currency Pair</p>
                <p class="text-xs text-mid-text">"EUR / USD" arrows pointing to Base and Quote currencies.</p>
            </div>

            <h3 class="font-bold text-lg mt-8">⚖️ SECTION 6: Advantages vs. Risks in Forex Trading</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div class="bg-success/5 p-4 rounded-lg border border-success/20">
                    <h4 class="font-bold text-success text-lg mb-3">✅ Advantages</h4>
                    <ul class="list-disc pl-5 space-y-2">
                        <li><strong>24/5 Market:</strong> Trade across sessions (Asian, London, New York).</li>
                        <li><strong>High Liquidity:</strong> Enter and exit trades instantly.</li>
                        <li><strong>Leverage:</strong> Ability to control large positions with small equity.</li>
                        <li><strong>Diverse Strategies:</strong> Scalping, Swing, Position.</li>
                    </ul>
                </div>
                <div class="bg-danger/5 p-4 rounded-lg border border-danger/20">
                    <h4 class="font-bold text-danger text-lg mb-3">❌ Risks</h4>
                    <ul class="list-disc pl-5 space-y-2">
                        <li><strong>Leverage Amplifies Losses:</strong> It works both ways.</li>
                        <li><strong>News Volatility:</strong> Events like NFP can cause massive spikes.</li>
                        <li><strong>Overtrading & Emotions:</strong> The biggest enemy is lack of discipline.</li>
                        <li><strong>Fake Brokers:</strong> Always use regulated brokers.</li>
                    </ul>
                </div>
            </div>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Risk vs. Reward of Leverage</p>
                <p class="text-xs text-mid-text">Bar chart comparing 1:1 vs 1:100 Leverage potential.</p>
            </div>

            <hr class="my-10 border-t-2 border-light-gray" />

            <h2 class="text-2xl font-bold text-primary mt-8">📘 WEEK 2: Understanding Currency Pairs & Market Sessions</h2>
            <p class="mb-4"><strong>Objective:</strong> Learn how currency pairs function and understand when and why to trade during specific Forex market sessions.</p>

            <h3 class="font-bold text-lg mt-4">SECTION 1: What is a Currency Pair?</h3>
            <p>Forex trading always involves two currencies quoted together. A currency pair tells you how much of the quote currency you need to buy one unit of the base currency.</p>
            <div class="bg-light-hover p-3 rounded-lg my-2">
                <p><strong>Example: EUR/USD = 1.1050</strong></p>
                <p>This means 1 Euro is equal to 1.1050 U.S. Dollars.</p>
                <ul class="list-disc pl-6 mt-2 text-sm">
                    <li>When you <strong>BUY</strong> EUR/USD, you are buying EUR and selling USD (betting Euro gets stronger).</li>
                    <li>When you <strong>SELL</strong> EUR/USD, you are selling EUR and buying USD (betting Euro gets weaker).</li>
                </ul>
            </div>

            <h3 class="font-bold text-lg mt-6">SECTION 2: Understanding Bid, Ask, and Spread</h3>
            <p>In every currency pair quote, there are two prices found in your trading terminal:</p>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Bid Price:</strong> The price the broker will pay to buy from you (Your Sell Price).</li>
                <li><strong>Ask Price:</strong> The price the broker charges to sell to you (Your Buy Price).</li>
                <li><strong>Spread:</strong> The difference between the Bid and Ask. This is the broker’s fee/profit.</li>
            </ul>
            <p class="mt-2 bg-light-hover p-2 rounded text-center font-mono">Formula: Ask - Bid = Spread</p>
            <p class="text-sm text-mid-text mt-1 italic">Note: Smaller spreads = lower trading costs = better conditions.</p>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Bid/Ask Button Interface</p>
                <p class="text-xs text-mid-text">Buy/Sell buttons showing Spread.</p>
            </div>

            <h3 class="font-bold text-lg mt-6">SECTION 3: How Do Exchange Rates Move?</h3>
            <p>Currency prices change due to supply and demand driven by:</p>
            <ul class="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Economic Indicators:</strong> GDP growth, interest rates, inflation.</li>
                <li><strong>Political Events:</strong> Elections, wars, trade treaties.</li>
                <li><strong>Central Bank Decisions:</strong> Printing money or raising rates.</li>
                <li><strong>Market Sentiment:</strong> Fear or Greed in global markets.</li>
            </ul>

            <h3 class="font-bold text-lg mt-6">SECTION 4: Forex Trading Sessions</h3>
            <div class="overflow-x-auto mt-4">
                <table class="min-w-full border-collapse border border-light-gray text-sm">
                    <thead>
                        <tr class="bg-light-hover">
                            <th class="border border-light-gray p-2">Session</th>
                            <th class="border border-light-gray p-2">Time (GMT)</th>
                            <th class="border border-light-gray p-2">Highlights</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Sydney</td>
                            <td class="border border-light-gray p-2">22:00 – 07:00</td>
                            <td class="border border-light-gray p-2">Least volatile. Often consolidates.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Tokyo</td>
                            <td class="border border-light-gray p-2">00:00 – 09:00</td>
                            <td class="border border-light-gray p-2">Asian market activity. Focus on JPY pairs.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">London</td>
                            <td class="border border-light-gray p-2">08:00 – 17:00</td>
                            <td class="border border-light-gray p-2">High liquidity and volatility. Major trend moves start here.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">New York</td>
                            <td class="border border-light-gray p-2">13:00 – 22:00</td>
                            <td class="border border-light-gray p-2">Heavy USD influence. High volatility.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 class="font-bold text-lg mt-6">SECTION 5: Session Overlaps</h3>
            <p>Market overlaps are periods when two major sessions are open simultaneously. This increases trading volume and volatility, creating the best opportunities.</p>
            <div class="bg-warning/10 p-4 mt-2 rounded-lg border-l-4 border-warning">
                <strong>London–New York Overlap (13:00 – 17:00 GMT):</strong> This is the "Golden Time." The two biggest financial centers are active. Highest trading volume and biggest moves occur here.
            </div>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: 24-Hour Session Clock</p>
                <p class="text-xs text-mid-text">Highlighting London/New York Overlap.</p>
            </div>

            <hr class="my-10 border-t-2 border-light-gray" />

            <h2 class="text-2xl font-bold text-primary mt-8">📘 WEEK 3: Choosing a Broker and Setting Up a Trading Platform</h2>
            <p class="mb-4"><strong>Objective:</strong> Understand how to select a trustworthy Forex broker and successfully set up a trading platform for demo and live trading environments.</p>

            <h3 class="font-bold text-lg mt-4">🔍 SECTION 1: What is a Forex Broker?</h3>
            <p>A Forex broker acts as a middleman between retail traders and the interbank currency market. You place trades through them, and they provide the liquidity and software.</p>
            
            <h4 class="font-bold mt-4">Types of Brokers:</h4>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Market Makers (Dealing Desk):</strong> Set their own prices. Good for beginners (0 commission).</li>
                <li><strong>ECN (Electronic Communication Network):</strong> Connect orders to banks. Raw spreads, commission per trade.</li>
                <li><strong>STP (Straight Through Processing):</strong> Hybrid model.</li>
            </ul>

            <h3 class="font-bold text-lg mt-6">✅ SECTION 2: Key Factors to Consider</h3>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Regulation:</strong> Must be regulated by tier-1 authorities (FCA, ASIC, etc.) to ensure funds safety.</li>
                <li><strong>Spreads & Commissions:</strong> Low costs = more profit.</li>
                <li><strong>Leverage:</strong> 1:50 to 1:200 is standard.</li>
                <li><strong>Customer Support:</strong> 24/5 availability is critical.</li>
            </ul>

            <h3 class="font-bold text-lg mt-6">💻 SECTION 3: Setting Up Your Trading Platform (MT4/MT5)</h3>
            <ol class="list-decimal pl-6 space-y-2 mt-2">
                <li>Download MetaTrader 4 or 5 from the broker’s website.</li>
                <li>Open a Demo Account (Virtual Money).</li>
                <li>Log in with demo credentials.</li>
            </ol>

            <h4 class="font-bold mt-4">Platform Navigation:</h4>
            <ul class="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Market Watch:</strong> Real-time quotes list.</li>
                <li><strong>Navigator:</strong> Accounts and indicators.</li>
                <li><strong>Terminal/Toolbox:</strong> Active trades and history.</li>
                <li><strong>Chart Window:</strong> Main workspace.</li>
            </ul>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: MT5 Interface Map</p>
                <p class="text-xs text-mid-text">Labeled screenshot of Market Watch, Navigator, Toolbox, and Chart.</p>
            </div>

            <div class="bg-info/10 p-4 rounded-lg border border-info/20 mt-4">
                <h4 class="font-bold text-info">🧪 Interactive Exercise:</h4>
                <ol class="list-decimal pl-6 mt-2 text-sm">
                    <li>Install MT4/MT5.</li>
                    <li>Open a $10,000 Demo Account.</li>
                    <li>Execute one BUY trade and one SELL trade.</li>
                </ol>
            </div>

            <hr class="my-10 border-t-2 border-light-gray" />

            <h2 class="text-2xl font-bold text-primary mt-8">📘 WEEK 4: Introduction to Technical Analysis & Candlesticks</h2>
            <p class="mb-4"><strong>Objective:</strong> Understand how to interpret price movements using candlestick charts and identify foundational patterns.</p>

            <h3 class="font-bold text-lg mt-4">🧠 SECTION 1: What is Technical Analysis?</h3>
            <p>Study of price movements using historical data to forecast future behavior.</p>
            <ul class="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Price Discounts Everything:</strong> News is already in the price.</li>
                <li><strong>History Repeats Itself:</strong> Human psychology doesn't change.</li>
            </ul>

            <h3 class="font-bold text-lg mt-6">📊 SECTION 2: Understanding Candlestick Charts</h3>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Bullish Candle (Green/White):</strong> Close > Open (Price up).</li>
                <li><strong>Bearish Candle (Red/Black):</strong> Close < Open (Price down).</li>
                <li><strong>Body:</strong> Difference between Open and Close.</li>
                <li><strong>Wick (Shadow):</strong> Extreme High and Low prices.</li>
            </ul>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Bullish vs Bearish Candle</p>
                <p class="text-xs text-mid-text">Diagram labeling Open, Close, High, Low, Body, Wick.</p>
            </div>

            <h3 class="font-bold text-lg mt-6">🔍 SECTION 3: Basic Candlestick Patterns</h3>
            <div class="overflow-x-auto mt-4">
                <table class="min-w-full border-collapse border border-light-gray text-sm">
                    <thead>
                        <tr class="bg-light-hover">
                            <th class="border border-light-gray p-2">Pattern</th>
                            <th class="border border-light-gray p-2">Type</th>
                            <th class="border border-light-gray p-2">Meaning</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Doji</td>
                            <td class="border border-light-gray p-2">Indecision</td>
                            <td class="border border-light-gray p-2">Market is confused.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Hammer</td>
                            <td class="border border-light-gray p-2">Bullish Reversal</td>
                            <td class="border border-light-gray p-2">Buying pressure at bottom of downtrend.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Shooting Star</td>
                            <td class="border border-light-gray p-2">Bearish Reversal</td>
                            <td class="border border-light-gray p-2">Selling pressure at top of uptrend.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Engulfing</td>
                            <td class="border border-light-gray p-2">Reversal</td>
                            <td class="border border-light-gray p-2">Large candle covers previous one. Strong signal.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Candlestick Cheat Sheet</p>
                <p class="text-xs text-mid-text">Icons for Doji, Hammer, Shooting Star, Engulfing.</p>
            </div>

            <hr class="my-10 border-t-2 border-light-gray" />

            <h2 class="text-2xl font-bold text-primary mt-8">📘 WEEK 5: Pips, Lots & Leverage – The Math of Trading</h2>
            <p class="mb-4"><strong>Objective:</strong> Demystify the math. Understand value calculation, volume, and leverage.</p>

            <h3 class="font-bold text-lg mt-4">📏 SECTION 1: What is a Pip?</h3>
            <p>Percentage in Point. Standard unit of price movement.</p>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Standard Pairs (EUR/USD):</strong> 4th decimal place. (1.1050 to 1.1051 = 1 Pip).</li>
                <li><strong>JPY Pairs (USD/JPY):</strong> 2nd decimal place. (110.50 to 110.51 = 1 Pip).</li>
            </ul>

            <h3 class="font-bold text-lg mt-6">📦 SECTION 2: Lot Sizes (Volume)</h3>
            <div class="overflow-x-auto mt-4">
                <table class="min-w-full border-collapse border border-light-gray text-sm">
                    <thead>
                        <tr class="bg-light-hover">
                            <th class="border border-light-gray p-2">Lot Type</th>
                            <th class="border border-light-gray p-2">Volume</th>
                            <th class="border border-light-gray p-2">MT4 Input</th>
                            <th class="border border-light-gray p-2">Value/Pip ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-light-gray p-2">Standard</td>
                            <td class="border border-light-gray p-2">100,000</td>
                            <td class="border border-light-gray p-2">1.00</td>
                            <td class="border border-light-gray p-2">$10</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2">Mini</td>
                            <td class="border border-light-gray p-2">10,000</td>
                            <td class="border border-light-gray p-2">0.10</td>
                            <td class="border border-light-gray p-2">$1</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2">Micro</td>
                            <td class="border border-light-gray p-2">1,000</td>
                            <td class="border border-light-gray p-2">0.01</td>
                            <td class="border border-light-gray p-2">$0.10</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="bg-danger/5 text-danger p-3 rounded mt-2 border border-danger/20">
                <strong>Critical Lesson:</strong> Start with Micro Lots (0.01). A Standard Lot on a small account means a 20-pip move loses $200 instantly.
            </div>

            <h3 class="font-bold text-lg mt-6">⚙️ SECTION 3: Leverage & Margin</h3>
            <p>Leverage is borrowing power. Margin is the deposit required.</p>
            <div class="bg-light-hover p-3 rounded-lg my-2">
                <p><strong>Example 1:100 Leverage:</strong></p>
                <p>Your Money: $100. Broker's Money: $9,900. Total Power: $10,000.</p>
            </div>
            <p><strong>Double-Edged Sword:</strong> Magnifies profits AND losses. High leverage allows you to buy more lots than you can afford with cash, increasing risk.</p>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: The Lever Diagram</p>
                <p class="text-xs text-mid-text">Small capital lifting massive buying power via leverage fulcrum.</p>
            </div>

            <div class="bg-info/10 p-4 rounded-lg border border-info/20 mt-4">
                <h4 class="font-bold text-info">🧪 Practical Task:</h4>
                <p class="text-sm mt-2">Open MT4/5 demo. Execute a 0.01 lot trade on EUR/USD and watch the profit/loss move by cents to feel the value.</p>
            </div>

            <hr class="my-10 border-t-2 border-light-gray" />

            <h2 class="text-2xl font-bold text-primary mt-8">📘 WEEK 6: Trading Tools & Indicators</h2>
            <p class="mb-4"><strong>Objective:</strong> Understand key technical tools used to enhance accuracy and identify entries/exits.</p>

            <h3 class="font-bold text-lg mt-4">🧮 SECTION 2: Core Indicators</h3>
            <ul class="list-disc pl-6 space-y-4 mt-2">
                <li>
                    <strong>Moving Averages (MA):</strong> Trend-following.
                    <br><span class="text-sm">Usage: Price above 50/200 EMA = Uptrend (Buy). Below = Downtrend (Sell).</span>
                </li>
                <li>
                    <strong>Relative Strength Index (RSI):</strong> Momentum (0-100).
                    <br><span class="text-sm">Overbought (>70): Look for sells. Oversold (<30): Look for buys.</span>
                </li>
                <li>
                    <strong>MACD:</strong> Trend & Momentum. Signal line crossovers indicate shifts.
                </li>
                <li>
                    <strong>Bollinger Bands:</strong> Volatility. Squeezes often precede breakouts.
                </li>
            </ul>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Chart with Indicators</p>
                <p class="text-xs text-mid-text">Price chart with EMA lines and RSI panel below.</p>
            </div>

            <h3 class="font-bold text-lg mt-6">📊 SECTION 3: Best Practices</h3>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Confluence:</strong> Don't rely on one tool. Use indicators to confirm candles.</li>
                <li><strong>Avoid Overloading:</strong> 2-3 indicators max to avoid "Analysis Paralysis".</li>
                <li><strong>Backtest:</strong> Test settings before using real money.</li>
            </ul>

            <hr class="my-10 border-t-2 border-light-gray" />

            <h2 class="text-2xl font-bold text-primary mt-8">📘 WEEK 7: Risk Management & Trade Management</h2>
            <p class="mb-4"><strong>Objective:</strong> Equip traders with tools to protect capital. Goal: Preserve capital first, profits second.</p>

            <h3 class="font-bold text-lg mt-4">📈 SECTION 2: Core Concepts</h3>
            <ol class="list-decimal pl-6 space-y-4 mt-2">
                <li>
                    <strong>Risk Per Trade (1-2% Rule):</strong>
                    <br>Never risk more than 1-2% of account on a single trade. (e.g., $50 on a $5,000 account).
                </li>
                <li>
                    <strong>Risk-to-Reward Ratio (R:R):</strong>
                    <br>1:2 means risk $100 to make $200. Allows profitability even with a 40% win rate.
                </li>
                <li>
                    <strong>Stop Loss (SL) & Take Profit (TP):</strong>
                    <br>SL is mandatory protection. TP locks in gains.
                </li>
                <li>
                    <strong>Position Sizing:</strong>
                    <br>Formula: <code>Position Size = Risk ($) / (Stop Loss Pips × Pip Value)</code>.
                </li>
            </ol>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Win Rate vs R:R Table</p>
                <p class="text-xs text-mid-text">Table showing 1:2 R:R is profitable at 40% win rate.</p>
            </div>

            <hr class="my-10 border-t-2 border-light-gray" />

            <h2 class="text-2xl font-bold text-primary mt-8">📘 WEEK 7 (Part 2): Market Structure & Entry Strategies</h2>
            <p class="mb-4"><strong>Objective:</strong> Interpret price action via market structure and identify high-probability entries.</p>

            <h3 class="font-bold text-lg mt-4">🧠 SECTION 1: Understanding Market Structure</h3>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Uptrend:</strong> Higher Highs (HH) and Higher Lows (HL).</li>
                <li><strong>Downtrend:</strong> Lower Highs (LH) and Lower Lows (LL).</li>
                <li><strong>Break of Structure (BOS):</strong> Price breaks a previous HL or HH, confirming trend.</li>
            </ul>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Market Structure Zig-Zag</p>
                <p class="text-xs text-mid-text">Line chart labeling HH, HL, and BOS points.</p>
            </div>

            <h3 class="font-bold text-lg mt-6">🎯 SECTION 2: Entry Strategies</h3>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Breakouts:</strong> Price breaks level with volume. Risk: Fakeouts.</li>
                <li><strong>The Retest (Best):</strong> Wait for break, then wait for price to return to the broken level (Resistance becomes Support). Enter on confirmation candle.</li>
                <li><strong>Trendlines:</strong> Connect swing points. Break signals reversal.</li>
            </ul>

            <hr class="my-10 border-t-2 border-light-gray" />

            <h2 class="text-2xl font-bold text-primary mt-8">📘 WEEK 8: Trading Psychology & Discipline</h2>
            <p class="mb-4"><strong>Objective:</strong> Develop mental discipline. Success is 20% strategy, 80% psychology.</p>

            <h3 class="font-bold text-lg mt-4">🧠 SECTION 1: The Trader’s Mindset</h3>
            <p class="mb-2">The Three Deadly Sins:</p>
            <ul class="list-disc pl-6 space-y-1">
                <li><strong>Fear:</strong> Hesitating or closing early.</li>
                <li><strong>Greed:</strong> Holding too long or over-leveraging.</li>
                <li><strong>Overtrading:</strong> Boredom trading or Revenge trading.</li>
            </ul>

            <h3 class="font-bold text-lg mt-6">📝 SECTION 2: The Importance of Journaling</h3>
            <p class="mb-2">A journal is the bridge between experience and improvement.</p>
            <p class="mt-2"><strong>Log:</strong> Date, Pair, Direction, Setup, Result, and Emotion.</p>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Trading Journal Spreadsheet</p>
                <p class="text-xs text-mid-text">Screenshot of columns: Date, Pair, Risk, P/L, Mistakes.</p>
            </div>

            <hr class="my-10 border-t-2 border-light-gray" />

            <h2 class="text-2xl font-bold text-primary mt-8">📘 WEEK 9: Introduction to Fundamental Analysis</h2>
            <p class="mb-4"><strong>Objective:</strong> Understand economic news and events driving the market.</p>

            <h3 class="font-bold text-lg mt-4">📰 SECTION 2: High-Impact News Events</h3>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>NFP (Non-Farm Payrolls):</strong> US jobs report (1st Friday). Massive volatility.</li>
                <li><strong>CPI (Inflation):</strong> Dictates interest rates.</li>
                <li><strong>FOMC (Interest Rates):</strong> Powerful driver. Higher rates = Stronger Currency.</li>
            </ul>

            <h3 class="font-bold text-lg mt-6">🥇 SECTION 3: Gold & USD Correlation</h3>
            <p><strong>Inverse Correlation:</strong> Stronger USD usually means Weaker Gold. Weaker USD means Stronger Gold.</p>
            <p class="text-sm text-mid-text italic">Exception: War/Fear can make both rise (Safe Haven).</p>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: What Moves Gold Infographic</p>
                <p class="text-xs text-mid-text">Icons: USD Strength (Down), Rates (Down), Fear (Up).</p>
            </div>

            <hr class="my-10 border-t-2 border-light-gray" />

            <h2 class="text-2xl font-bold text-primary mt-8">📘 WEEK 10: Focus on Gold (XAUUSD) Trading</h2>
            <p class="mb-4"><strong>Objective:</strong> Specialize in Gold trading volatility and execution.</p>

            <h3 class="font-bold text-lg mt-4">📌 1. How Gold Behaves</h3>
            <p>Sharp, aggressive swings. Respects key levels but often "wicks" through to grab liquidity. Volume surges during London-NY overlap.</p>

            <h3 class="font-bold text-lg mt-6">📌 2. When to Trade Gold</h3>
            <p>High Volatility: 1:30 PM – 3:30 PM WAT (NY Open). Avoid late Asian session.</p>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Gold NY Open Volatility</p>
                <p class="text-xs text-mid-text">Chart showing massive candle spike at 8:30 AM EST.</p>
            </div>

            <h3 class="font-bold text-lg mt-6">📌 3. Strategy for Gold</h3>
            <ul class="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Break and Retest:</strong> Wait for clear break.</li>
                <li><strong>Fakeouts:</strong> Watch for liquidity grabs at highs/lows.</li>
                <li><strong>Correlation:</strong> Watch DXY chart.</li>
            </ul>

            <hr class="my-10 border-t-2 border-light-gray" />

            <h2 class="text-2xl font-bold text-primary mt-8">📘 WEEK 11: Building a Complete Trading Strategy</h2>
            <p class="mb-4"><strong>Objective:</strong> Synthesize concepts into a repeatable plan.</p>

            <h3 class="font-bold text-lg mt-4">📌 1. The Checklist (Plan)</h3>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Bias (4H):</strong> Trend Up or Down?</li>
                <li><strong>Zone (1H):</strong> Price at Support/Resistance?</li>
                <li><strong>Trigger (15M):</strong> Candlestick pattern?</li>
                <li><strong>Risk:</strong> Stop Loss protected? 1:2 R:R?</li>
            </ul>

            <h3 class="font-bold text-lg mt-6">📌 2. Multi-Timeframe Alignment</h3>
            <p>4H for Direction. 1H for Zones. 15M for Entry. Trade only when stories align.</p>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Trader's Checklist Graphic</p>
                <p class="text-xs text-mid-text">Clipboard with checkboxes: Trend? Zone? Pattern? Risk?</p>
            </div>

            <div class="bg-success/10 p-4 rounded-lg border border-success/20 mt-4">
                <strong>✍️ Practical Task:</strong> Trade 5 setups on demo using ONLY this written checklist.
            </div>

            <hr class="my-10 border-t-2 border-light-gray" />

            <h2 class="text-2xl font-bold text-primary mt-8">📘 WEEK 12: Final Test, Strategy Review & Next Steps</h2>
            <p class="mb-4"><strong>Objective:</strong> Consolidate learning and plan the future.</p>

            <h3 class="font-bold text-lg mt-4">📌 1. Performance Audit</h3>
            <p>Review your Demo Journal. Calculate Win Rate and Average R:R. Count mistakes (broken rules).</p>

            <h3 class="font-bold text-lg mt-6">📌 2. The Next 90 Days Roadmap</h3>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Month 1:</strong> Demo until 4 profitable weeks.</li>
                <li><strong>Month 2:</strong> Small Live Account (Micro lots). Focus on emotions.</li>
                <li><strong>Month 3:</strong> Scale up or attempt Prop Firm challenge.</li>
            </ul>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Roadmap Timeline</p>
                <p class="text-xs text-mid-text">Education → Demo Mastery → Live Trading → Professional Funding.</p>
            </div>

            <div class="mt-12 p-8 bg-primary/10 rounded-xl border border-primary/20 text-center">
                <h3 class="text-2xl font-bold text-primary mb-4">From Aspiring Trader to Strategic Operator</h3>
                <p class="mb-4">Congratulations on completing the Trade Companion 12-Week Forex & Gold Trading Masterclass.</p>
                <p class="mb-4">You now understand the mechanics, math, and psychology. You are no longer a gambler; you are a data-driven trader.</p>
                <p class="italic font-semibold">Remember: The market will always be there. Do not rush. Protect your capital, follow your plan, and let the probabilities work in your favor.</p>
                <p class="mt-4 font-bold">End of Series</p>
            </div>
        </div>
        ` 
    },
    { 
        id: 3, 
        category: "Technical Analysis", 
        title: "Mastering Support and Resistance", 
        summary: "Identify key price levels on charts to make better entry and exit decisions.", 
        difficulty: "Intermediate", 
        type: "article", 
        content: `
        <div class="space-y-6 text-dark-text">
            <h2 class="text-2xl font-bold text-primary">Mastering Support & Resistance – Key Zones</h2>
            <p><strong>Objective:</strong> Achieve mastery in identifying, drawing, and utilizing static and dynamic Support and Resistance (S&R) zones for high-probability entries and exits.</p>

            <h3 class="text-xl font-bold mt-6 text-primary">🧠 SECTION 1: The Psychology of S&R</h3>
            <p>Support and Resistance levels are not just horizontal lines; they are reflections of mass market psychology.</p>

            <div class="bg-light-hover p-4 rounded-lg border border-light-gray my-2">
                <h4 class="font-bold text-success">Support (The Floor):</h4>
                <p>A price level where buying interest (demand) is strong enough to overcome selling pressure (supply), causing the price to turn back up.</p>
                <p class="text-sm text-mid-text mt-1"><em>Psychology: Traders who missed buying previously will enter here; those who shorted will cover their positions.</em></p>
            </div>

            <div class="bg-light-hover p-4 rounded-lg border border-light-gray my-2">
                <h4 class="font-bold text-danger">Resistance (The Ceiling):</h4>
                <p>A price level where selling interest (supply) is strong enough to overcome buying pressure (demand), causing the price to turn back down.</p>
                <p class="text-sm text-mid-text mt-1"><em>Psychology: Traders who bought previously will take profit here; new sellers will enter here.</em></p>
            </div>

            <div class="bg-info/10 p-4 rounded-lg border border-info/20 mt-4">
                <strong>Rule of Thumb:</strong> The more times a price level is tested and holds, the more significant that S&R zone becomes.
            </div>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Support & Resistance Chart</p>
                <p class="text-xs text-mid-text">Arrows showing price bouncing off Support and rejecting Resistance multiple times.</p>
            </div>

            <h3 class="text-xl font-bold mt-8 text-primary">📏 SECTION 2: Drawing S&R Correctly (The Zone Concept)</h3>
            <p>S&R levels are not thin lines, but rather zones of price confluence.</p>

            <h4 class="font-bold mt-4">Wicks vs. Bodies:</h4>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li>Use the <strong>closing price (body)</strong> for the strongest confirmation of where the market 'settled.'</li>
                <li>Use the <strong>wicks (shadows)</strong> to define the full extent of the zone where liquidity was tested.</li>
            </ul>

            <p class="mt-4"><strong>Best Practice:</strong> Draw a rectangular zone that captures the majority of the candle bodies and the extremes of the wicks for a holistic view.</p>

            <h4 class="font-bold mt-6">Top-Down Analysis:</h4>
            <p>Always draw S&R on Higher Timeframes (HTF), such as the Daily (D1) or 4-Hour (H4) chart. These levels hold more weight than levels drawn on the 5-minute chart.</p>
            <p class="text-sm text-mid-text italic mt-1">If a daily resistance is broken, it is a major event. If a 5-minute resistance is broken, it is noise.</p>

            <h3 class="text-xl font-bold mt-8 text-primary">🔁 SECTION 3: The Flip Principle (Role Reversal)</h3>
            <p>This is one of the most powerful concepts in technical analysis. When a strong S&R level is broken decisively, its role is reversed.</p>

            <ul class="list-disc pl-6 space-y-4 mt-4">
                <li>
                    <strong>Broken Resistance becomes New Support:</strong> Price breaks above a strong resistance level, confirming buyer strength. When price later comes back down to retest that old resistance, traders use it as a new support level to buy.
                </li>
                <li>
                    <strong>Broken Support becomes New Resistance:</strong> Price breaks below a strong support level, confirming seller strength. When price later tries to rally back up, traders use it as a new resistance level to sell.
                </li>
            </ul>

            <div class="bg-success/10 p-4 rounded-lg border border-success/20 mt-4">
                This "Break and Retest" or "Flip" setup forms the basis of many high-probability trading entries.
            </div>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: The Flip (Role Reversal)</p>
                <p class="text-xs text-mid-text">Price breaking Support (S), returning to touch line from below as Resistance (R).</p>
            </div>

            <h3 class="text-xl font-bold mt-8 text-primary">📉 SECTION 4: Dynamic Support and Resistance</h3>
            <p>While horizontal lines are static, certain indicators can act as dynamic S&R that moves with the price.</p>

            <h4 class="font-bold mt-4">Moving Averages (MAs):</h4>
            <p>The 50-period and 200-period Exponential Moving Averages (EMAs) are crucial.</p>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li>In a strong <strong>uptrend</strong>, price often "bounces" off the 50 EMA, which acts as dynamic support.</li>
                <li>In a strong <strong>downtrend</strong>, price often hits the 50 EMA and continues falling, making it dynamic resistance.</li>
            </ul>

            <h4 class="font-bold mt-4">Trendlines:</h4>
            <p>A well-drawn trendline connecting swing highs (in a downtrend) acts as dynamic resistance, guiding price lower. A trendline connecting swing lows (in an uptrend) acts as dynamic support.</p>

            <h3 class="text-xl font-bold mt-8 text-primary">⚠️ SECTION 5: Liquidity Traps and S/R Breaks (Fakeouts)</h3>
            <p>Markets rarely move in a straight line. Large institutions often manipulate price around S&R levels to "trap" retail traders.</p>

            <div class="bg-danger/5 p-4 rounded-lg border border-danger/20 mt-4">
                <h4 class="font-bold text-danger">The Trap:</h4>
                <p>Price moves slightly above resistance, luring in breakout buyers, only to instantly reverse and trap them in losing trades. This move is often designed to grab liquidity (Stop Losses).</p>
            </div>

            <h4 class="font-bold mt-6">Confirmation is Key:</h4>
            <p>Never blindly enter on the first touch or the first break. Wait for:</p>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>A clean closure:</strong> The candlestick must close decisively above Resistance or below Support on your entry timeframe.</li>
                <li><strong>The Retest (The Flip):</strong> The highest probability entry is waiting for the price to return to the broken zone and confirm the new role reversal (as discussed in Section 3).</li>
            </ul>
        </div>
        ` 
    },
    { 
        id: 4, 
        category: "Technical Analysis", 
        title: "A Guide to Candlestick Patterns", 
        summary: "Recognize common candlestick patterns to predict future market movements.", 
        difficulty: "Intermediate", 
        type: "article", 
        content: `
        <div class="space-y-6 text-dark-text">
            <h2 class="text-2xl font-bold text-primary">Mastering Candlestick Patterns – The Language of the Market</h2>
            <p><strong>Objective:</strong> Decipher the immediate psychological battles between buyers and sellers by achieving mastery in identifying and utilizing key single, double, and triple candlestick patterns.</p>

            <h3 class="text-xl font-bold mt-6 text-primary">🧠 SECTION 1: Candlestick Anatomy and Interpretation</h3>
            <p>Candles are the visual language of price action. They show the battle results over a specific timeframe (e.g., 4 hours, 1 day).</p>

            <div class="overflow-x-auto mt-4">
                <table class="min-w-full border-collapse border border-light-gray text-sm">
                    <thead>
                        <tr class="bg-light-hover">
                            <th class="border border-light-gray p-2 text-left">Component</th>
                            <th class="border border-light-gray p-2 text-left">Bullish Candle (Green)</th>
                            <th class="border border-light-gray p-2 text-left">Bearish Candle (Red)</th>
                            <th class="border border-light-gray p-2 text-left">What It Tells You</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Body</td>
                            <td class="border border-light-gray p-2">Close > Open</td>
                            <td class="border border-light-gray p-2">Open > Close</td>
                            <td class="border border-light-gray p-2">The strength of the move. A large body indicates strong conviction.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Upper Wick</td>
                            <td class="border border-light-gray p-2">High > Close</td>
                            <td class="border border-light-gray p-2">High > Open</td>
                            <td class="border border-light-gray p-2">Price rejection from the top. Sellers pushed price back down.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Lower Wick</td>
                            <td class="border border-light-gray p-2">Low < Open</td>
                            <td class="border border-light-gray p-2">Low < Close</td>
                            <td class="border border-light-gray p-2">Price rejection from the bottom. Buyers pushed price back up.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="bg-info/10 p-4 rounded-lg border border-info/20 mt-4">
                <strong>The Big Picture:</strong> Long wicks mean rejection and indecision. Large bodies mean momentum and conviction.
            </div>

            <h3 class="text-xl font-bold mt-8 text-primary">🔍 SECTION 2: Single Candlestick Reversal Patterns</h3>
            <p>These patterns signal an immediate shift in momentum and are strongest when they occur at key Support or Resistance levels.</p>

            <div class="overflow-x-auto mt-4">
                <table class="min-w-full border-collapse border border-light-gray text-sm">
                    <thead>
                        <tr class="bg-light-hover">
                            <th class="border border-light-gray p-2 text-left">Pattern</th>
                            <th class="border border-light-gray p-2 text-left">Type/Signal</th>
                            <th class="border border-light-gray p-2 text-left">Structure & Psychology</th>
                            <th class="border border-light-gray p-2 text-left">Trading Implication</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Hammer</td>
                            <td class="border border-light-gray p-2 text-success font-bold">Strong Bullish Reversal</td>
                            <td class="border border-light-gray p-2">Small body near the top of the range with a long lower wick (tail). Shows sellers pushed price low, but buyers aggressively bought it back, indicating strong rejection of lower prices.</td>
                            <td class="border border-light-gray p-2">Look for Buy confirmation. Place Stop Loss (SL) below the wick.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Inverted Hammer</td>
                            <td class="border border-light-gray p-2 text-success font-bold">Bullish Reversal</td>
                            <td class="border border-light-gray p-2">Small body near the bottom of the range with a long upper wick. Shows buyers initially rallied the price, but sellers pushed it back down to the open, signaling a potential loss of bearish momentum.</td>
                            <td class="border border-light-gray p-2">Look for Buy confirmation. Requires careful confirmation on the next candle.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Shooting Star</td>
                            <td class="border border-light-gray p-2 text-danger font-bold">Strong Bearish Reversal</td>
                            <td class="border border-light-gray p-2">Small body near the bottom of the range with a long upper wick. Shows buyers pushed price high, but sellers aggressively sold it off, indicating strong rejection of higher prices.</td>
                            <td class="border border-light-gray p-2">Look for Sell confirmation. Place SL above the wick.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Hanging Man</td>
                            <td class="border border-light-gray p-2 text-danger font-bold">Bearish Reversal</td>
                            <td class="border border-light-gray p-2">Small body near the top of the range with a long lower wick. Similar to Hammer but occurs in an uptrend, suggesting selling pressure is entering the market.</td>
                            <td class="border border-light-gray p-2">Look for Sell confirmation. Requires careful confirmation on the next candle.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Doji</td>
                            <td class="border border-light-gray p-2 font-bold text-warning">Indecision</td>
                            <td class="border border-light-gray p-2">Open and Close are virtually the same, forming a cross or plus sign. Indicates market equilibrium—neither buyers nor sellers could gain control.</td>
                            <td class="border border-light-gray p-2">Signals exhaustion of the previous trend. Wait for confirmation on the next candle for the new direction.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Marubozu</td>
                            <td class="border border-light-gray p-2 font-bold text-info">Strong Continuation</td>
                            <td class="border border-light-gray p-2">A very large body with little to no wicks. Indicates extreme strength and conviction (all buyers or all sellers) throughout the entire period.</td>
                            <td class="border border-light-gray p-2">Suggests the current momentum is likely to continue.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Key Single Candlestick Reversal Patterns</p>
                <p class="text-xs text-mid-text">Hammer, Shooting Star, and Doji formations and their predicted price direction.</p>
            </div>

            <h3 class="text-xl font-bold mt-8 text-primary">🎯 SECTION 3: Double Candlestick Reversal Patterns</h3>
            <p>These patterns involve the interaction of two candles, providing stronger confirmation of a directional change than a single candle.</p>

            <h4 class="text-lg font-bold mt-4">1. Engulfing Patterns (The Strongest Signal)</h4>
            <p>The second candle's body must fully consume (engulf) the first candle's body.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div class="bg-success/5 p-4 rounded-lg border border-success/20">
                    <strong>Bullish Engulfing:</strong> The second (bullish/green) candle completely covers (engulfs) the body of the previous (bearish/red) candle. This occurs at Support and signals a massive shift from supply to demand.
                    <p class="mt-2 text-sm"><strong>Trading Implication:</strong> High-probability Buy signal. SL is placed below the low of the engulfing candle.</p>
                </div>
                <div class="bg-danger/5 p-4 rounded-lg border border-danger/20">
                    <strong>Bearish Engulfing:</strong> The second (bearish/red) candle completely covers the body of the previous (bullish/green) candle. This occurs at Resistance and signals a massive shift from demand to supply.
                    <p class="mt-2 text-sm"><strong>Trading Implication:</strong> High-probability Sell signal. SL is placed above the high of the engulfing candle.</p>
                </div>
            </div>

            <h4 class="text-lg font-bold mt-6">2. Piercing Line / Dark Cloud Cover</h4>
            <p>These are strong reversals where the second candle closes well into the body of the first, but does not fully engulf it.</p>
            
            <ul class="list-disc pl-6 space-y-4 mt-2">
                <li>
                    <strong>Piercing Line (Bullish):</strong> A bearish candle followed by a long bullish candle that opens low (a gap down) but closes more than halfway into the body of the first bearish candle.
                    <br><span class="text-sm text-mid-text italic">Psychology: Sellers attempted to drive price lower but were aggressively overpowered.</span>
                </li>
                <li>
                    <strong>Dark Cloud Cover (Bearish):</strong> A bullish candle followed by a bearish candle that opens above the previous high (a gap up) but closes more than halfway into the body of the first bullish candle.
                    <br><span class="text-sm text-mid-text italic">Psychology: Buyers attempted to push price higher but were violently rejected.</span>
                </li>
            </ul>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Double Candlestick Reversal Patterns</p>
                <p class="text-xs text-mid-text">Bullish Engulfing and Dark Cloud Cover examples.</p>
            </div>

            <h3 class="text-xl font-bold mt-8 text-primary">📈 SECTION 4: Three Candlestick Reversal & Continuation Patterns</h3>
            <p>These patterns represent a multi-step narrative, often providing the most reliable signals due to the confirmed struggle over three periods.</p>

            <div class="overflow-x-auto mt-4">
                <table class="min-w-full border-collapse border border-light-gray text-sm">
                    <thead>
                        <tr class="bg-light-hover">
                            <th class="border border-light-gray p-2 text-left">Pattern</th>
                            <th class="border border-light-gray p-2 text-left">Type/Signal</th>
                            <th class="border border-light-gray p-2 text-left">Structure & Psychology</th>
                            <th class="border border-light-gray p-2 text-left">Trading Implication</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Morning Star</td>
                            <td class="border border-light-gray p-2 text-success font-bold">Strong Bullish Reversal</td>
                            <td class="border border-light-gray p-2">1. Large Bearish Candle (Sell-off).<br>2. Small Indecision Candle (Star).<br>3. Large Bullish Candle closing well into first body.</td>
                            <td class="border border-light-gray p-2">The "star" shows sellers exhausted. The third candle confirms buyers control. Look for Buy.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Evening Star</td>
                            <td class="border border-light-gray p-2 text-danger font-bold">Strong Bearish Reversal</td>
                            <td class="border border-light-gray p-2">1. Large Bullish Candle (Rally).<br>2. Small Indecision Candle (Star).<br>3. Large Bearish Candle closing well into first body.</td>
                            <td class="border border-light-gray p-2">The "star" shows buyers lost conviction. The third candle confirms sellers dominated. Look for Sell.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Three White Soldiers</td>
                            <td class="border border-light-gray p-2 text-success font-bold">Strong Bullish Continuation</td>
                            <td class="border border-light-gray p-2">Three consecutive large bullish candles, each opening within the previous body and closing higher.</td>
                            <td class="border border-light-gray p-2">Signals a robust, ongoing uptrend. Often used after a correction.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Three Black Crows</td>
                            <td class="border border-light-gray p-2 text-danger font-bold">Strong Bearish Continuation</td>
                            <td class="border border-light-gray p-2">Three consecutive large bearish candles, each opening within the previous body and closing lower.</td>
                            <td class="border border-light-gray p-2">Signals a robust, ongoing downtrend. Often used after a rally correction.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Image Placeholder -->
            <div class="my-6 p-6 bg-light-surface border-2 border-dashed border-light-gray rounded-xl text-center">
                <p class="text-sm text-mid-text font-semibold mb-2">Image: Three Candlestick Patterns</p>
                <p class="text-xs text-mid-text">Morning Star, Evening Star, Three White Soldiers, and Three Black Crows.</p>
            </div>

            <h3 class="text-xl font-bold mt-8 text-primary">⚠️ SECTION 5: Context is Everything (Confluence)</h3>
            <p>A candlestick pattern in the middle of a chart tells you nothing. A candlestick pattern at a key level tells you everything.</p>

            <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-4">
                <h4 class="font-bold text-dark-text mb-2">The Confluence Rule:</h4>
                <ul class="list-disc pl-6 space-y-2">
                    <li><strong>Level:</strong> Is the pattern forming at a major Daily/4H Support or Resistance (S&R) level?</li>
                    <li><strong>Trend:</strong> Does the reversal pattern oppose a long-running, exhausted trend?</li>
                    <li><strong>Confirmation:</strong> Does the next candle open and move in the predicted direction?</li>
                </ul>
            </div>

            <div class="bg-info/10 p-4 rounded-lg border border-info/20 mt-4">
                <strong>Example:</strong> A Bullish Engulfing pattern at a Daily Support Zone in an otherwise strong downtrend is a high-probability reversal signal. A mere Hammer in the middle of nowhere is noise.
            </div>
        </div>
        ` 
    },
    { id: 8, category: "Technical Analysis", title: "Japanese Candlestick Charting Techniques (Book)", summary: "Steve Nison's classic guide to understanding and using candlestick patterns for market analysis.", difficulty: "Advanced", type: "book", content: "Full content here..." },
    { 
        id: 5, 
        category: "Risk Management", 
        title: "The Importance of Stop-Loss Orders", 
        summary: "Protect your capital by learning how to properly set and manage stop-loss orders.", 
        difficulty: "Beginner", 
        type: "article", 
        content: `
        <div class="space-y-6 text-dark-text">
            <h2 class="text-2xl font-bold text-primary">The Stop-Loss Mandate – Capital Protection</h2>
            <p><strong>Objective:</strong> Master the concept, calculation, and strategic placement of Stop-Loss (SL) orders, ensuring your capital is protected against unforeseen market volatility and eliminating the psychological damage of "hope trading."</p>

            <h3 class="text-xl font-bold mt-6 text-primary">🧠 SECTION 1: The Stop-Loss: Your Ultimate Capital Guard</h3>
            <p>The Stop-Loss (SL) is a mandatory, non-negotiable order placed at the time of trade entry that automatically closes a losing position once price reaches a pre-defined level. It is the single most important tool for ensuring long-term survival in the markets.</p>

            <h4 class="font-bold mt-4">The Purpose of the Stop-Loss:</h4>
            <ul class="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Fixed Risk:</strong> It guarantees you lose only the amount of money you planned to lose.</li>
                <li><strong>Emotional Removal:</strong> It prevents emotional trading decisions (like holding a losing trade out of "hope") by automating the exit.</li>
                <li><strong>Survival:</strong> It ensures you can withstand a streak of losing trades without blowing your account, protecting the majority of your capital for future high-probability setups.</li>
            </ul>

            <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-4">
                <h4 class="font-bold">Psychological Mandate:</h4>
                <p>A trade is not a complete trade without three components: Entry, Stop-Loss, and Take-Profit. Placing the SL immediately after the entry is a demonstration of discipline and professionalism.</p>
            </div>

            <h3 class="text-xl font-bold mt-8 text-primary">🧮 SECTION 2: Calculating Your Stop-Loss Size</h3>
            <p>Your Stop-Loss placement must be driven by two factors: Technical Analysis (where price should not go) and Risk Management (how much you can afford to lose).</p>

            <h4 class="font-bold mt-4">The 1–2% Risk Rule Re-Affirmed:</h4>
            <p>As discussed in Week 8, you must never risk more than 1-2% of your total account on any single trade.</p>

            <div class="overflow-x-auto mt-4">
                <table class="min-w-full border-collapse border border-light-gray text-sm">
                    <thead>
                        <tr class="bg-light-hover">
                            <th class="border border-light-gray p-2 text-left">Account Equity</th>
                            <th class="border border-light-gray p-2 text-left">Max Risk (1%)</th>
                            <th class="border border-light-gray p-2 text-left">Max Risk (2%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">$1,000</td>
                            <td class="border border-light-gray p-2">$10</td>
                            <td class="border border-light-gray p-2">$20</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">$5,000</td>
                            <td class="border border-light-gray p-2">$50</td>
                            <td class="border border-light-gray p-2">$100</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">$20,000</td>
                            <td class="border border-light-gray p-2">$200</td>
                            <td class="border border-light-gray p-2">$400</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="bg-info/10 p-4 rounded-lg border border-info/20 mt-4">
                <strong>Crucial Insight:</strong> Your Stop-Loss dollar value is fixed first, then your lot size is adjusted to meet that dollar limit based on the trade’s distance.
            </div>

            <h4 class="font-bold mt-6">The Stop-Loss to Position Size Formula:</h4>
            <p>You determine your ideal technical Stop-Loss (in pips) and then use the formula to calculate the correct lot size that keeps your risk below the 2% limit.</p>
            
            <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-2">
                <p><strong>Example:</strong></p>
                <ul class="list-disc pl-6 mt-2 space-y-1">
                    <li>Account: $5,000</li>
                    <li>Max Risk (1%): $50</li>
                    <li>Technical SL Distance: 50 Pips</li>
                </ul>
                <p class="mt-3"><strong>Calculation:</strong></p>
                <p class="font-mono bg-white/50 p-2 rounded mt-1">Outcome: You must use a Mini Lot (0.10) to ensure that if the 50-pip SL is hit, you only lose $50 (1% of your account).</p>
            </div>

            <h3 class="text-xl font-bold mt-8 text-primary">📐 SECTION 3: Strategic Placement of the Stop-Loss (Technical Analysis)</h3>
            <p>Placing the SL arbitrarily (e.g., always 30 pips away) is reckless. The Stop-Loss must be placed at a level that, if broken, invalidates your trade idea.</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div class="bg-success/5 p-4 rounded-lg border border-success/20">
                    <h4 class="font-bold text-success">Placing SL in an Uptrend (Buy Trade)</h4>
                    <p class="mt-2 text-sm"><strong>Rule:</strong> Place the SL safely below the most recent Higher Low (HL) or the Support Zone.</p>
                    <p class="mt-2 text-sm"><strong>Invalidation Logic:</strong> If the price breaks below the previous HL, the uptrend market structure is broken, and the trade is no longer valid.</p>
                </div>
                <div class="bg-danger/5 p-4 rounded-lg border border-danger/20">
                    <h4 class="font-bold text-danger">Placing SL in a Downtrend (Sell Trade)</h4>
                    <p class="mt-2 text-sm"><strong>Rule:</strong> Place the SL safely above the most recent Lower High (LH) or the Resistance Zone.</p>
                    <p class="mt-2 text-sm"><strong>Invalidation Logic:</strong> If the price breaks above the previous LH, the downtrend market structure is broken, and the trade is no longer valid.</p>
                </div>
            </div>

            <h4 class="font-bold mt-6">Candlestick Confirmation:</h4>
            <p>When using a reversal candlestick pattern (like a Bullish Engulfing or Hammer), the SL should be placed just outside the low of the entire reversal structure (the long wick) to protect against market noise.</p>

            <h3 class="text-xl font-bold mt-8 text-primary">⚙️ SECTION 4: Advanced Stop-Loss Management</h3>
            <p>Once a trade moves into profit, you can adjust your SL to manage risk further.</p>

            <div class="overflow-x-auto mt-4">
                <table class="min-w-full border-collapse border border-light-gray text-sm">
                    <thead>
                        <tr class="bg-light-hover">
                            <th class="border border-light-gray p-2 text-left">Order Type</th>
                            <th class="border border-light-gray p-2 text-left">Function</th>
                            <th class="border border-light-gray p-2 text-left">Usage</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Fixed Stop-Loss</td>
                            <td class="border border-light-gray p-2">The standard SL set at entry. It remains static unless manually changed.</td>
                            <td class="border border-light-gray p-2">Used to cap initial risk (1-2%).</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Break-Even (B.E.) SL</td>
                            <td class="border border-light-gray p-2">Moving your SL from its initial position to your exact entry price (or slightly above for a Buy, or slightly below for a Sell).</td>
                            <td class="border border-light-gray p-2">Used when the trade has moved into significant profit (e.g., $100 up) to guarantee you cannot lose money on the trade.</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Trailing Stop</td>
                            <td class="border border-light-gray p-2">An automated SL that follows the price as it moves deeper into profit, maintaining a fixed distance (e.g., 20 pips) behind the price.</td>
                            <td class="border border-light-gray p-2">Used to lock in guaranteed profit without manually managing the trade. Stops trailing if price reverses.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 class="text-xl font-bold mt-8 text-primary">🛑 SECTION 5: The Cost of Hope Trading (The Greatest Risk)</h3>
            <p>The biggest mistake new traders make is removing or moving their Stop-Loss order in the heat of the moment, hoping the price will return.</p>

            <div class="bg-danger/5 p-4 rounded-lg border border-danger/20 mt-4">
                <p><strong>Consequence:</strong> When the price does not return, that small, calculated loss instantly turns into a massive, uncalculated loss that can wipe out weeks or months of gains, or even the entire account (Margin Call).</p>
                <p class="mt-2 font-bold text-danger">The Rule: Never move your SL further away from the entry point. You pre-determined your maximum acceptable loss; honor that decision.</p>
            </div>
        </div>
        ` 
    },
    { 
        id: 6, 
        category: "Risk Management", 
        title: "Position Sizing for Success", 
        summary: "Calculate the optimal position size for any trade to manage risk effectively.", 
        difficulty: "Advanced", 
        type: "article", 
        content: `
        <div class="space-y-6 text-dark-text">
            <h2 class="text-2xl font-bold text-primary">Position Sizing for Success – The Non-Negotiable Math</h2>
            <p><strong>Objective:</strong> Deconstruct the mathematics of position sizing. Learn to translate your maximum acceptable risk (in dollars) into the exact lot size required for any trade, guaranteeing compliance with the 1-2% Rule regardless of the Stop-Loss distance.</p>

            <h3 class="text-xl font-bold mt-6 text-primary">🧠 SECTION 1: Why Position Sizing is Capital Protection</h3>
            <p>Position sizing is the act of determining how many lots (or units) you will trade based on your account size and the Stop-Loss distance. This is the only way to control your financial exposure before entering a trade.</p>

            <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-4">
                <h4 class="font-bold">The Position Sizing Mandate:</h4>
                <p>Your lot size must be a result of your risk calculation, not a random choice.</p>
                <p class="mt-2 text-sm">If you decide to risk $50 (1% of a $5,000 account), you must calculate the precise lot size that ensures you lose exactly $50 if your Stop-Loss is hit.</p>
            </div>

            <div class="overflow-x-auto mt-4">
                <table class="min-w-full border-collapse border border-light-gray text-sm">
                    <thead>
                        <tr class="bg-light-hover">
                            <th class="border border-light-gray p-2 text-left">Scenario</th>
                            <th class="border border-light-gray p-2 text-left">Stop-Loss Distance</th>
                            <th class="border border-light-gray p-2 text-left">Lot Size (Calculated)</th>
                            <th class="border border-light-gray p-2 text-left">Total Loss (Max)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Trade A</td>
                            <td class="border border-light-gray p-2">20 Pips</td>
                            <td class="border border-light-gray p-2">0.25 Lots</td>
                            <td class="border border-light-gray p-2">$50</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Trade B</td>
                            <td class="border border-light-gray p-2">50 Pips</td>
                            <td class="border border-light-gray p-2">0.10 Lots</td>
                            <td class="border border-light-gray p-2">$50</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold">Trade C</td>
                            <td class="border border-light-gray p-2">100 Pips</td>
                            <td class="border border-light-gray p-2">0.05 Lots</td>
                            <td class="border border-light-gray p-2">$50</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <p class="mt-4 italic text-mid-text text-sm">Notice that the risk is capped at $50, but the lot size adjusts dramatically based on the Stop-Loss distance.</p>

            <h3 class="text-xl font-bold mt-8 text-primary">🧮 SECTION 2: The Three Mandatory Variables</h3>
            <p>Every time you enter a trade, you must input these three variables into the Position Sizing Calculator (or calculate them manually):</p>

            <ul class="list-disc pl-6 space-y-4 mt-4">
                <li>
                    <strong>1. Account Equity (A):</strong> The total capital in your trading account.
                </li>
                <li>
                    <strong>2. Risk Percentage (R%):</strong> The maximum percentage of your equity you are willing to lose on one trade. This must not exceed 2%.
                    <br><span class="bg-light-hover px-2 py-1 rounded text-sm font-mono mt-1 inline-block">Dollar Risk = Equity × R%</span>
                </li>
                <li>
                    <strong>3. Stop-Loss Distance (SL):</strong> The distance, in pips, from your entry price to your technical Stop-Loss level. This distance is determined by Market Structure (Support, Resistance, Trendlines).
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-8 text-primary">📐 SECTION 3: The Position Sizing Formula (USD-Based Pairs)</h3>
            <p>The most common and critical formula is used to find the required lot size. For simplicity, we assume a standard pip value of $10 per standard lot (1.00) for USD-quoted pairs.</p>

            <div class="bg-primary/10 p-4 rounded-lg border border-primary/20 mt-4 text-center">
                <p class="font-bold text-lg font-mono">Lot Size = Account Risk ($) / (Stop Loss (Pips) × Pip Value per Lot ($10))</p>
            </div>

            <h4 class="font-bold mt-6">Step-by-Step Calculation Example:</h4>
            <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-2">
                <p><strong>Trader Profile:</strong></p>
                <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                    <li>Account Equity: $10,000</li>
                    <li>Risk Percentage: 1.5%</li>
                </ul>
                <p class="mt-3"><strong>Trade Setup:</strong></p>
                <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                    <li>Entry Price (Buy EUR/USD): 1.09500</li>
                    <li>Stop-Loss Price (Below Support): 1.09250</li>
                </ul>
                
                <hr class="my-4 border-light-gray"/>
                
                <p><strong>Calculation:</strong></p>
                <div class="space-y-2 mt-2 text-sm">
                    <p><strong>Step 1:</strong> Calculate Dollar Risk <br/> $10,000 × 0.015 = <strong>$150</strong></p>
                    <p><strong>Step 2:</strong> Calculate Stop-Loss Distance (in Pips) <br/> (1.09500 - 1.09250) × 10,000 = <strong>25 Pips</strong></p>
                    <p><strong>Step 3:</strong> Calculate Required Lot Size <br/> $150 / (25 Pips × $10) = 150 / 250 = <strong>0.60 Lots</strong></p>
                </div>
                
                <div class="bg-success/10 p-3 rounded mt-4 border border-success/20">
                    <strong>Outcome:</strong> To risk exactly $150 on this trade with a 25-pip Stop-Loss, you must use a lot size of 0.60 Standard Lots.
                </div>
            </div>

            <h3 class="text-xl font-bold mt-8 text-primary">⚠️ SECTION 4: The Danger of Fixed Lot Sizing</h3>
            <p>Beginners often use a Fixed Lot Size (e.g., always 0.10 lots) instead of calculating the size based on the Stop-Loss distance. This is highly reckless and violates the core principle of controlled risk.</p>

            <div class="overflow-x-auto mt-4">
                <table class="min-w-full border-collapse border border-light-gray text-sm">
                    <thead>
                        <tr class="bg-light-hover">
                            <th class="border border-light-gray p-2 text-left">Trader Type</th>
                            <th class="border border-light-gray p-2 text-left">Fixed SL Pips</th>
                            <th class="border border-light-gray p-2 text-left">Fixed Lot Size</th>
                            <th class="border border-light-gray p-2 text-left">Account Risk</th>
                            <th class="border border-light-gray p-2 text-left">Outcome</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-light-gray p-2">Fixed Lot Trader</td>
                            <td class="border border-light-gray p-2">20 Pips</td>
                            <td class="border border-light-gray p-2">0.10 Lots</td>
                            <td class="border border-light-gray p-2">$20 (Too Low)</td>
                            <td class="border border-light-gray p-2 text-warning">Misses Profit Potential</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2">Fixed Lot Trader</td>
                            <td class="border border-light-gray p-2">200 Pips</td>
                            <td class="border border-light-gray p-2">0.10 Lots</td>
                            <td class="border border-light-gray p-2">$200 (Too High)</td>
                            <td class="border border-light-gray p-2 text-danger font-bold">Risks 4% instead of 1%</td>
                        </tr>
                        <tr>
                            <td class="border border-light-gray p-2 font-bold text-success">Professional</td>
                            <td class="border border-light-gray p-2">Variable</td>
                            <td class="border border-light-gray p-2 font-bold">Calculated</td>
                            <td class="border border-light-gray p-2 font-bold">Fixed at 1%</td>
                            <td class="border border-light-gray p-2 text-success font-bold">Consistent Risk Management</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="bg-danger/5 p-4 rounded-lg border border-danger/20 mt-4">
                <h4 class="font-bold text-danger">Mandate:</h4>
                <p>If your trade needs a 100-pip Stop-Loss to be technically sound, your lot size must shrink (e.g., to 0.05) to maintain the 1-2% limit. If the SL is only 15 pips, your lot size must expand (e.g., to 0.33) to maximize the leverage within your safe risk limit.</p>
            </div>

            <h3 class="text-xl font-bold mt-8 text-primary">🛑 SECTION 5: Practical Application and Tools</h3>
            <p>While calculating manually is essential for understanding, professional traders use digital tools to speed up execution.</p>

            <ol class="list-decimal pl-6 space-y-4 mt-4">
                <li>
                    <strong>Integrated Platform Tools:</strong> Many modern trading platforms (and expert advisors) have integrated position sizing tools where you input your desired risk percentage and drag your Stop-Loss line on the chart. The platform then instantly calculates and suggests the correct lot size.
                </li>
                <li>
                    <strong>The Micro Lot Advantage:</strong> For small accounts (under $2,000), it is mandatory to stick to Micro Lots (0.01 - 0.09). Even risking 2% of a $1,000 account ($20) requires precise micro-lot calculation to avoid overleveraging.
                </li>
            </ol>

            <div class="bg-primary/10 p-6 rounded-xl border-l-4 border-primary mt-8 text-center">
                <h4 class="text-lg font-bold text-primary mb-2">Golden Rule for Position Sizing:</h4>
                <p class="italic font-medium">The technical requirements of the market (S&R, structure) dictate your Stop-Loss distance, and your Stop-Loss distance dictates your maximum Lot Size. Never allow your account risk tolerance to be dictated by the market's volatility.</p>
            </div>
        </div>
        ` 
    },
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

const VerificationSettings: React.FC<{ showToast: (msg: string, type: 'success' | 'info' | 'error') => void }> = ({ showToast }) => {
    // Local state to simulate verification status for the session
    const [idDoc, setIdDoc] = useState<{file?: File, type?: string} | null>(null);
    const [addressDoc, setAddressDoc] = useState<{file?: File, type?: string} | null>(null);
    const [livenessState, setLivenessState] = useState<'idle' | 'checking' | 'success'>('idle');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'Not Submitted' | 'Pending' | 'Verified' | 'Rejected'>('Not Submitted');

    const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIdDoc(prev => ({ ...prev, file: e.target.files![0] }));
        }
    };

    const handleAddressFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAddressDoc(prev => ({ ...prev, file: e.target.files![0] }));
        }
    };

    const startLivenessCheck = async () => {
        setLivenessState('checking');
        showToast("Please look into the camera.", 'info');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setTimeout(() => {
                stream.getTracks().forEach(track => track.stop());
                setLivenessState('success');
                showToast("Liveness check successful!", 'success');
            }, 3000);
        } catch (err) {
            console.error("Camera access denied:", err);
            showToast("Camera access is required for liveness check.", 'error');
            setLivenessState('idle');
        }
    };

    const handleVerificationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!idDoc || !idDoc.file || !idDoc.type || !addressDoc || !addressDoc.file || !addressDoc.type || livenessState !== 'success') {
            showToast("Please complete all verification steps, including selecting a type and uploading a file for both documents.", "error");
            return;
        }

        setIsVerifying(true);
        showToast("Submitting documents for automated verification...", "info");
        setVerificationStatus('Pending');
        
        setTimeout(() => {
            showToast("Your identity has been successfully verified!", "success");
            setVerificationStatus('Verified');
            setIsVerifying(false);
        }, 5000);
    };

    const VerificationStep: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="bg-light-hover p-4 rounded-lg border border-light-gray mb-4">
            <h5 className="font-semibold text-dark-text mb-3">{title}</h5>
            {children}
        </div>
    );

    return (
        <div className="p-6 bg-light-surface rounded-lg border border-light-gray text-dark-text animate-fade-in-right">
            <h3 className="font-bold text-lg mb-2">Identity Verification</h3>
            <p className="text-sm text-mid-text mb-6">Required for Mentors to receive payouts.</p>

            {verificationStatus === 'Verified' ? (
                <div className="p-4 bg-success/10 text-success rounded-lg border border-success/20 flex items-center">
                    <Icon name="check" className="w-5 h-5 mr-2"/> Your identity is fully verified. You are eligible for payouts.
                </div>
            ) : (
                <form onSubmit={handleVerificationSubmit}>
                    <VerificationStep title="1. Identity Document">
                        <select onChange={(e) => setIdDoc(prev => ({...prev, type: e.target.value}))} value={idDoc?.type || ""} className="w-full bg-light-surface border-light-gray rounded-md p-2 mb-2 focus:ring-primary focus:border-primary text-dark-text">
                            <option value="" disabled>Select Document Type</option>
                            <option>Driver's License</option>
                            <option>International Passport</option>
                            <option>National ID</option>
                            <option>NIN Slip</option>
                        </select>
                        <label htmlFor="id-upload" className="cursor-pointer border-2 border-dashed border-light-gray rounded-lg p-3 text-center block w-full hover:bg-light-surface text-sm text-mid-text">
                            <Icon name="image" className="w-6 h-6 mx-auto mb-1" />
                            {idDoc?.file ? idDoc.file.name : 'Click to upload'}
                        </label>
                        <input id="id-upload" type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdFileChange}/>
                    </VerificationStep>

                    <VerificationStep title="2. Liveness Check">
                            {livenessState === 'idle' ? (
                            <button type="button" onClick={startLivenessCheck} className="w-full bg-secondary hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Start Liveness Check</button>
                            ) : livenessState === 'checking' ? (
                            <div className="w-full text-center py-2 text-info animate-pulse">Checking... Please wait.</div>
                            ) : (
                            <div className="w-full text-center py-2 text-success font-semibold">Liveness Check Complete</div>
                            )}
                    </VerificationStep>
                    
                    <VerificationStep title="3. Proof of Address">
                            <select onChange={(e) => setAddressDoc(prev => ({...prev, type: e.target.value}))} value={addressDoc?.type || ""} className="w-full bg-light-surface border-light-gray rounded-md p-2 mb-2 focus:ring-primary focus:border-primary text-dark-text">
                            <option value="" disabled>Select Document Type</option>
                            <option>Utility Bill</option>
                            <option>Bank Statement</option>
                        </select>
                        <label htmlFor="address-upload" className="cursor-pointer border-2 border-dashed border-light-gray rounded-lg p-3 text-center block w-full hover:bg-light-surface text-sm text-mid-text">
                            <Icon name="image" className="w-6 h-6 mx-auto mb-1" />
                            {addressDoc?.file ? addressDoc.file.name : 'Click to upload'}
                        </label>
                        <input id="address-upload" type="file" accept="image/*,.pdf" className="hidden" onChange={handleAddressFileChange}/>
                    </VerificationStep>
                    
                    <button type="submit" disabled={isVerifying} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg disabled:bg-light-gray">
                        {isVerifying ? 'Verifying...' : 'Submit All for Verification'}
                    </button>
                </form>
            )}
        </div>
    );
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

    // Filter out synthetic indices as they are not supported for auto-trading on cTrader
    // AND ensure we only show instruments that the AI actually scans for.
    const availableInstruments = TARGET_INSTRUMENTS.filter(inst => {
        const unsupportedInstruments = [
            'Boom 1000', 
            'Crash 1000', 
            'Volatility 75', 
            'Volatility 100', 
            'Jump 10', 
            'Jump 25', 
            'Jump 50'
        ];
        return !unsupportedInstruments.includes(inst);
    });

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
    const tabs = [
        { id: 'profile', label: 'Profile' },
        { id: 'billing', label: 'Billing' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'ctrader', label: 'cTrader' }
    ];

    if (user.isMentor) {
        tabs.push({ id: 'verification', label: 'Verification' });
    }

    const [activeTab, setActiveTab] = useState(tabs[0].id);

    return (
        <div className="p-8 bg-light-bg min-h-screen">
            <h2 className="text-2xl font-bold mb-6 text-dark-text">Settings</h2>
            <div className="flex space-x-4 mb-6 border-b border-light-gray overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-4 font-medium capitalize whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-mid-text hover:text-dark-text'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="animate-fade-in-right">
                {activeTab === 'profile' && <ProfileSettings user={user} setUser={setUser} showToast={showToast} />}
                {activeTab === 'billing' && <BillingSettings user={user} setUser={setUser} showToast={showToast} />}
                {activeTab === 'notifications' && <NotificationSettings user={user} setUser={setUser} showToast={showToast} />}
                {activeTab === 'ctrader' && <CTraderSettings user={user} setUser={setUser} showToast={showToast} />}
                {activeTab === 'verification' && <VerificationSettings showToast={showToast} />}
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
        // Add Live Point
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

    // Define SafePie here to avoid type errors with activeIndex
    const SafePie = Pie as any; 

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
                                    <Pie 
                                        {...{ activeIndex: pieActiveIndex } as any}
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
        
        // Stabilize random generation for volatility chart
        const volatilityData = instrumentDistributionData.slice(0, 6).map(item => {
            // Generate a consistent "random" number based on the string
            let hash = 0;
            for (let i = 0; i < item.name.length; i++) {
                hash = item.name.charCodeAt(i) + ((hash << 5) - hash);
            }
            const normalized = Math.abs(hash % 60) + 20; // 20 to 80
            return {
                instrument: item.name,
                volatility: normalized,
            };
        });

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
                                <Pie 
                                    {...{ activeIndex: pieActiveIndex } as any}
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


const MentorPage: React.FC<{ onViewMentor: (mentor: Mentor) => void; onViewChange: (view: DashboardView) => void; user: User; }> = ({ onViewMentor, onViewChange, user }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const calculateWinRate = (signals: RecentSignal[] | undefined) => {
        if (!signals || signals.length === 0) return 0;
        const wins = signals.filter(s => s.outcome === 'win').length;
        return Math.round((wins / signals.length) * 100);
    };

    const filteredMentors = MOCK_MENTORS_LIST.filter(mentor => 
        mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mentor.instruments.some(inst => inst.toLowerCase().includes(searchQuery.toLowerCase())) ||
        mentor.strategy.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
    <div className="p-4 sm:p-8 bg-light-bg min-h-screen">
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            <div>
                 <h1 className="text-3xl font-bold text-dark-text">Mentors</h1>
                 <p className="text-mid-text">Find expert traders to follow and learn from.</p>
            </div>
            {!user.isMentor && (
                <button 
                    onClick={() => onViewChange('apply_mentor')}
                    className="bg-accent hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform hover:scale-105"
                >
                    Become a Mentor
                </button>
            )}
        </div>

        {user.subscribedPlan === PlanName.Premium && (
            <div className="bg-accent/10 text-accent p-4 rounded-lg mb-6 border border-accent/20">
                <p className="font-bold">Premium Perk Unlocked!</p>
                <p className="text-sm">As a Premium member, you get one free month of mentorship. Choose a mentor to start your free trial!</p>
            </div>
        )}
        
        {/* Search Bar */}
        <div className="mb-8 max-w-2xl relative">
            <input 
                type="text"
                placeholder="Search mentors by name, strategy, or instrument (e.g., 'Scalping', 'XAUUSD')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-4 pl-12 rounded-xl bg-light-surface border border-light-gray shadow-sm focus:ring-2 focus:ring-primary focus:outline-none text-dark-text"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-mid-text">
                <Icon name="search" className="w-5 h-5" /> 
                {/* Note: Ensure you have a search icon in your Icon component or use a fallback */}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredMentors.length > 0 ? filteredMentors.map(mentor => {
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
                        <p className="text-xs text-mid-text italic line-clamp-2 mb-4">"{mentor.strategy}"</p>
                    </div>
                    <button onClick={() => onViewMentor(mentor)} className="w-full mt-auto bg-primary hover:bg-primary-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        View Profile & Posts
                    </button>
                </div>
            )}) : (
                <div className="col-span-full text-center py-12 text-mid-text">
                    <p className="text-lg">No mentors found matching "{searchQuery}"</p>
                    <button onClick={() => setSearchQuery('')} className="mt-2 text-primary hover:underline">Clear Search</button>
                </div>
            )}
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

  // Deep Link Handling for Shared Mentor Profiles
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const sharedMentorId = params.get('mentorId');
      
      if (sharedMentorId) {
          const mentor = MOCK_MENTORS_LIST.find(m => m.id === parseInt(sharedMentorId));
          if (mentor) {
              setSelectedMentor(mentor);
              onViewChange('mentor_profile');
              // Optional: Clear URL params to avoid state stickiness on refresh
              window.history.replaceState({}, '', window.location.pathname);
          }
      }
  }, [onViewChange]);

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

  // --- REFS FOR INTERVAL ACCESS ---
  // Create refs to hold the latest state values
  const activeTradesRef = useRef(activeTrades);
  const tradeHistoryRef = useRef(tradeHistory);

  // Sync refs with state
  useEffect(() => {
      activeTradesRef.current = activeTrades;
  }, [activeTrades]);

  useEffect(() => {
      tradeHistoryRef.current = tradeHistory;
  }, [tradeHistory]);


  // --- Automatic Signal Scanner ---
  useEffect(() => {
    const scannerInterval = setInterval(async () => {
      // Access the latest state via refs inside the interval callback
      // This prevents the interval from being reset when activeTrades changes
      const currentActiveTrades = activeTradesRef.current;
      const currentTradeHistory = tradeHistoryRef.current;

      // Allow scanner to run continuously in background regardless of active view
      // if (activeView !== 'dashboard' && activeView !== 'ai_signals') return; // Removed to enable background scanning

      // SYSTEM LIMIT: Max 12 trades generated per day globally (simulated per client)
      const todayStr = new Date().toDateString();
      const tradesToday = [...currentActiveTrades, ...currentTradeHistory].filter(t => new Date(t.dateTaken).toDateString() === todayStr).length;

      if (tradesToday >= 12) {
          console.log("Daily system signal limit (12) reached. Skipping scan.");
          return;
      }

      if (!user.subscribedPlan || user.subscribedPlan === PlanName.Free || !canUseFeature('aiSignal')) {
        return;
      }

      try {
        const settings = JSON.parse(localStorage.getItem(`tradeSettings_${user.email}`) || '{"balance": "10000", "risk": "1.0", "currency": "USD"}');
        // Scan for signals using the updated service which now handles live market context internally
        // for Majors, Minors, Metals, Crypto
        const signalData = await scanForSignals(user.subscribedPlan, settings);
        
        if (signalData && signalData.signalFound) {
            const currentEquity = parseFloat(localStorage.getItem(EQUITY_KEY) || settings.balance);

            const newTrade: TradeRecord = {
              id: new Date().toISOString(),
              status: 'active',
              dateTaken: new Date().toISOString(),
              initialEquity: currentEquity,
              takeProfit: signalData.takeProfit1,
              takeProfit1: signalData.takeProfit1, // Explicitly add this to satisfy Signal interface
              timestamp: new Date().toISOString(), // Explicitly add this
              ...signalData,
            };

            // UPDATED LOGIC: Prevent any new signal if an active trade exists for that instrument
            // Check against the ref's current value
            const alreadyExists = currentActiveTrades.some(t => t.instrument === newTrade.instrument);
            
            if (!alreadyExists) {
                incrementUsage('aiSignal');
                setActiveTrades(prev => [newTrade, ...prev]);
                
                const newNotification: Notification = {
                    id: new Date().toISOString(),
                    message: `New Signal Found: ${newTrade.instrument} ${newTrade.type}`,
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
    }, 900000); // Scan every 15 minutes (900,000ms)

    return () => clearInterval(scannerInterval);
    // Removed activeTrades and tradeHistory from dependency array to prevent timer reset
  }, [user, canUseFeature, incrementUsage, showToast, EQUITY_KEY, setActiveTrades]);


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

        let totalFloating = 0;
        
        // Update trades with individual floating PnL
        const updatedActiveTrades = activeTrades.map(trade => {
             const priceData = livePrices[trade.instrument];
             // Return trade as-is if no price data available
             if (!priceData || priceData.price === null) return trade;

             // NEW: If data is mock (network interrupted), preserve current PnL state
             // instead of recalculating based on potentially stale/static mock data.
             if (priceData.isMock) {
                 if (typeof trade.pnl === 'number') {
                     totalFloating += trade.pnl;
                 }
                 return trade;
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
                 tradePnL /= 150; 
             } else if (instrumentDef.quoteCurrency === 'CHF') {
                 tradePnL /= 0.9; 
             } else if (instrumentDef.quoteCurrency === 'CAD') {
                 tradePnL /= 1.35; 
             } else if (instrumentDef.quoteCurrency === 'GBP') {
                 tradePnL *= 1.25; 
             }
             
             totalFloating += tradePnL;
             
             // Return updated trade object with current price
             return { ...trade, pnl: tradePnL, currentPrice: currentPrice };
        });
        
        setFloatingPnL(totalFloating);
        
        const closedTradeItems: { trade: TradeRecord, outcome: 'win' | 'loss', exitPrice: number }[] = [];
        
        updatedActiveTrades.forEach(trade => {
            const priceData = livePrices[trade.instrument];
            if (!priceData || priceData.price === null) return;

            // NEW: CRITICAL CHECK - Do not close trades if data is mock/fallback due to network error
            if (priceData.isMock) return;

            const currentPrice = priceData.price;

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
        });

        if (closedTradeItems.length > 0) {
            const closedTradeIds = new Set(closedTradeItems.map(item => item.trade.id));
            const newActiveTrades = updatedActiveTrades.filter(t => !closedTradeIds.has(t.id));

            let currentEquity = parseFloat(localStorage.getItem(EQUITY_KEY) || '10000');
            const newHistoryItems: TradeRecord[] = [];

            closedTradeItems.forEach(item => {
                const { trade, outcome, exitPrice } = item;
                const instrumentProps = instrumentDefinitions[trade.instrument];
                const contractSize = instrumentProps?.contractSize || 100000;
                const lotSize = trade.lotSize || 0;
                
                // Re-calculate final PnL for closing to be precise at exit price
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
        } else {
             // If no trades closed, update active trades to reflect floating PnL in UI
             setActiveTrades(updatedActiveTrades);
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
      case 'mentors': return <MentorPage onViewMentor={handleViewMentor} onViewChange={onViewChange} user={user} />;
      case 'followers': return <FollowersPage />;
      case 'analytics': return isMentorMode ? <MentorAnalyticsPage user={user} /> : <AnalyticsPage user={user} liveEquity={liveEquity} floatingPnL={floatingPnL} />;
      case 'education': return <EducationPage onViewContent={handleViewEducationContent} />;
      case 'education_content': return selectedEducationArticle ? <EducationContentPage article={selectedEducationArticle} onBack={handleBackToEducation} /> : <EducationPage onViewContent={handleViewEducationContent} />;
      case 'lot_size_calculator': return <LotSizeCalculatorPage user={user} />;
      case 'market_chart': return <MarketChartPage theme={theme} />;
      case 'settings': return <SettingsPage user={user} setUser={setUser} showToast={showToast} />;
      case 'apply_mentor': return <ApplyMentorPage />;
      case 'mentor_dashboard': return <MentorDashboard user={user} showToast={showToast} addNotification={addNotification} />;
      case 'mentor_profile': return selectedMentor ? <MentorProfilePage mentor={selectedMentor} onBack={handleBackToMentors} showToast={showToast} /> : <MentorPage onViewMentor={handleViewMentor} onViewChange={onViewChange} user={user} />;
      case 'mentor_payouts': return <MentorPayoutsPage showToast={showToast} />;
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
                    <NavLink view="followers" icon="followers" label="Followers" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
                    <NavLink view="analytics" icon="analytics" label="Analytics" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
                    <NavLink view="mentor_payouts" icon="payouts" label="Payouts" isCollapsed={isSidebarCollapsed} activeView={activeView} onViewChange={onViewChange} />
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
            <img src={user.avatar || user.image || `https://i.pravatar.cc/150?u=${user.email}`} alt="User Avatar" className="w-8 h-8 rounded-full object-cover border border-light-gray flex-shrink-0" />
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
                    <Icon name={isMentorMode ? "user" : "mentors"} className="w-5 h-5 mr-2 text-primary"/>
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
                            <path d="M15.5 6 A 0.5 0.5 0 0 1 16 6.5 A 0.5 0.5 0 0 1 15.5 7 A 0.5 0.5 0 0 1 15 6.5 A 0.5 0.5 0 0 1 15 6.5 A 0.5 0.5 0 0 1 15.5 6 Z" />
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