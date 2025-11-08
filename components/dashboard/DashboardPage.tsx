import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    { id: 1, category: "Forex Basics", title: "What is Forex Trading?", summary: "An introduction to the foreign exchange market, how it works, and key terminology for beginners.", difficulty: "Beginner", type: "article",
      content: `
        <h3 class="text-2xl font-semibold mt-6 mb-3">Introduction</h3>
        <p class="mb-4">Foreign Exchange (Forex or FX) trading is the global marketplace where currencies are exchanged against one another. It is the largest and most liquid financial market in the world, with a daily trading volume exceeding $7 trillion (as of 2024). Forex trading operates 24 hours a day, five days a week, connecting financial centers such as London, New York, Tokyo, and Sydney.</p>
        <p class="mb-4">Unlike stock markets that trade centralized assets on an exchange, the forex market is decentralized—meaning transactions occur directly between participants via electronic networks. This global and continuous operation allows traders to speculate on currency price movements at almost any time.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">How the Forex Market Works</h3>
        <p class="mb-4">At its core, forex trading involves buying one currency while simultaneously selling another. Currencies are traded in pairs, such as:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>EUR/USD (Euro vs. US Dollar)</li>
            <li>GBP/JPY (British Pound vs. Japanese Yen)</li>
            <li>XAU/USD (Gold vs. US Dollar)</li>
        </ul>
        <p class="mb-4">If a trader believes the Euro will strengthen against the Dollar, they buy EUR/USD. If they expect the Euro to weaken, they sell EUR/USD. Profit (or loss) comes from the change in the exchange rate between the two currencies.</p>
        <p class="mb-4">The forex market includes several layers of participants:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Central banks, which influence currency supply and interest rates.</li>
            <li>Commercial banks and hedge funds, which execute large-scale speculative and hedging trades.</li>
            <li>Corporations, which use forex to pay for goods and services internationally.</li>
            <li>Retail traders, who speculate on currency movements using online platforms and brokers.</li>
        </ul>
        <h3 class="text-2xl font-semibold mt-6 mb-3">The Structure of the Forex Market</h3>
        <p class="mb-4">The forex market operates through three main tiers:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Spot Market</strong> – This is the primary forex market where currencies are bought and sold for immediate delivery. It’s where most retail traders operate.</li>
            <li><strong>Forward Market</strong> – Here, participants agree to exchange currencies at a future date for a fixed rate.</li>
            <li><strong>Futures Market</strong> – Similar to the forward market but standardized and traded on exchanges.</li>
        </ul>
        <p class="mb-4">For individual traders, the spot market is where real-time trading takes place and prices are influenced by supply and demand dynamics.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">Why Forex Trading Exists</h3>
        <p class="mb-4">Forex trading exists to facilitate international trade, investments, and travel. For example, a Nigerian company importing machinery from Germany needs to exchange Naira for Euros. Similarly, investors and institutions use the forex market to hedge risks and diversify portfolios.</p>
        <p class="mb-4">However, over 80% of daily trading volume comes from speculative activity — traders seeking to profit from short-term price movements, not physical currency exchange.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">Key Features of Forex Trading</h3>
        <div class="space-y-3">
            <p><strong>1. High Liquidity:</strong> The sheer size of the forex market ensures quick execution of trades without large price fluctuations, even for significant positions.</p>
            <p><strong>2. Leverage:</strong> Forex brokers allow traders to control large positions with relatively small capital through leverage (e.g., 1:100). However, leverage magnifies both profits and losses.</p>
            <p><strong>3. 24-Hour Market:</strong> The forex market operates continuously from Monday 12 AM (Sydney) to Friday 10 PM (New York). This allows traders from all time zones to participate.</p>
            <p><strong>4. Low Entry Barrier:</strong> With online brokers, anyone can start trading forex with as little as $100. However, success requires knowledge, discipline, and a solid strategy.</p>
            <p><strong>5. Diverse Instruments:</strong> Beyond major currency pairs, forex brokers offer commodities (like Gold, Oil), indices (like S&P 500), and cryptocurrencies, all quoted in major currencies such as USD or EUR.</p>
        </div>
        <h3 class="text-2xl font-semibold mt-6 mb-3">Major Currency Pairs</h3>
        <p class="mb-4">Currencies are grouped into three main categories:</p>
        <div class="overflow-x-auto">
            <table class="w-full text-left border border-light-gray">
                <thead class="bg-light-hover">
                    <tr>
                        <th class="p-3 border-b border-light-gray">Category</th>
                        <th class="p-3 border-b border-light-gray">Examples</th>
                        <th class="p-3 border-b border-light-gray">Characteristics</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b border-light-gray">
                        <td class="p-3 font-semibold">Major Pairs</td>
                        <td class="p-3">EUR/USD, GBP/USD, USD/JPY, USD/CHF</td>
                        <td class="p-3">Most traded, highly liquid, low spreads</td>
                    </tr>
                    <tr class="border-b border-light-gray">
                        <td class="p-3 font-semibold">Minor Pairs</td>
                        <td class="p-3">EUR/GBP, AUD/JPY, NZD/CHF</td>
                        <td class="p-3">Moderate liquidity, slightly higher spreads</td>
                    </tr>
                    <tr>
                        <td class="p-3 font-semibold">Exotic Pairs</td>
                        <td class="p-3">USD/ZAR, EUR/TRY, USD/NGN</td>
                        <td class="p-3">Low liquidity, high volatility, wider spreads</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <h3 class="text-2xl font-semibold mt-6 mb-3">Understanding Price Movement</h3>
        <p class="mb-4">Forex prices are driven by the law of supply and demand, which is influenced by multiple factors:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Economic indicators – GDP, inflation, employment data.</li>
            <li>Monetary policy – Interest rate decisions by central banks.</li>
            <li>Political stability – Elections, wars, or policy changes.</li>
            <li>Market sentiment – Traders’ collective perception of economic health.</li>
        </ul>
        <p class="mb-4">For example, if the U.S. Federal Reserve raises interest rates, the U.S. dollar tends to appreciate as investors seek higher returns in dollar-denominated assets.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">How Traders Make Money</h3>
        <p class="mb-4">Traders aim to buy low and sell high (or sell high and buy low). They use technical and fundamental analysis to forecast price movements.</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Technical analysis</strong> relies on price charts, patterns, and indicators to predict future moves.</li>
            <li><strong>Fundamental analysis</strong> studies economic data, news releases, and geopolitical factors to understand currency strength.</li>
        </ul>
        <p class="mb-4">Profits are measured in <strong>pips</strong> (percentage in point), the smallest price movement in a currency pair. For example, if EUR/USD rises from 1.1000 to 1.1050, that’s a 50-pip increase.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">Risks in Forex Trading</h3>
        <p class="mb-4">While the forex market offers vast opportunities, it carries significant risks:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Leverage risk</strong> – Amplifies losses if used recklessly.</li>
            <li><strong>Market volatility</strong> – Sudden price spikes due to news or economic releases.</li>
            <li><strong>Emotional trading</strong> – Fear and greed can lead to poor decisions.</li>
            <li><strong>Broker risk</strong> – Choosing unregulated brokers can lead to fraud or fund mismanagement.</li>
        </ul>
        <p class="mb-4">Effective risk management (using stop-loss, position sizing, and proper leverage) is crucial for long-term success.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">Why People Trade Forex</h3>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Accessibility</strong> – Anyone with a smartphone or computer can participate.</li>
            <li><strong>Flexibility</strong> – Trade any time during the week.</li>
            <li><strong>Profit potential</strong> – Both rising and falling markets offer opportunities.</li>
            <li><strong>Learning curve</strong> – Skills can be developed and refined over time.</li>
        </ul>
        <p class="mb-4">For professional traders, forex offers a career path filled with analytical depth, strategic thinking, and financial independence.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">Conclusion</h3>
        <p class="mb-4">Forex trading is not a get-rich-quick scheme—it’s a professional discipline that rewards patience, precision, and consistency. Understanding how the market functions, mastering analysis techniques, and managing risk effectively are the pillars of success.</p>
        <p class="mb-4">The forex market is where global economics meets human psychology. To thrive, one must blend knowledge with emotional control and develop a system that adapts to ever-changing market conditions.</p>
      `
    },
    { id: 2, category: "Forex Basics", title: "Understanding Pips, Lots, and Leverage", summary: "Learn the fundamental concepts of pips, lot sizes, and how leverage can amplify your trades.", difficulty: "Beginner", type: "article",
      content: `
        <h3 class="text-2xl font-semibold mt-6 mb-3">Introduction</h3>
        <p class="mb-4">Every professional trader must master three foundational building blocks of Forex trading: Pips, Lots, and Leverage. These determine how profits and losses are calculated, how much risk each trade carries, and how efficiently a trader’s capital is used.</p>
        <p class="mb-4">Without understanding these mechanics, trading becomes guesswork. But with proper mastery, you can measure and manage risk like an institutional trader.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">1. What Is a Pip?</h3>
        <p class="mb-4">A pip stands for “percentage in point” or “price interest point” — the smallest measurable movement in the exchange rate of a currency pair.</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>It’s how traders measure changes in value between two currencies.</li>
            <li>For most pairs, one pip = 0.0001 (1/10,000th of a unit).</li>
        </ul>
        <p class="mb-4">For example:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>If EUR/USD moves from 1.1000 → 1.1050, it has moved 50 pips.</li>
            <li>If GBP/JPY moves from 150.00 → 150.50, it has moved 50 pips.</li>
        </ul>
        <p class="mb-4">However, the JPY pairs (currencies involving the Japanese Yen) are quoted differently, with one pip equal to 0.01 (1/100th of a unit).</p>
        <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-4">
            <h4 class="text-xl font-semibold mb-2 flex items-center"><span class="text-2xl mr-2">💡</span> Fractional Pips (Pipettes)</h4>
            <p class="mb-4">Modern brokers often quote prices with an extra decimal place for precision.</p>
            <p class="mb-4">For example, EUR/USD = 1.10508, where the last digit (8) represents a fractional pip (pipette) — one-tenth of a pip.</p>
            <p class="font-semibold">10 pipettes = 1 pip.</p>
        </div>
        <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-4">
            <h4 class="text-xl font-semibold mb-2 flex items-center"><span class="text-2xl mr-2">📊</span> Why Pips Matter</h4>
            <p class="mb-4">Pips measure price change, but when multiplied by your lot size, they represent money gained or lost.</p>
            <p class="mb-4">Understanding pip value is essential to know how much you’re risking per trade.</p>
        </div>

        <h3 class="text-2xl font-semibold mt-6 mb-3">2. What Is a Lot?</h3>
        <p class="mb-4">A lot represents the standardized quantity of a currency pair traded in the Forex market.</p>
        <p class="mb-4">Since currency movements are tiny (fractions of a cent), traders use lots to control larger positions without physically owning the currency.</p>
        <p class="mb-4">There are three main lot sizes used in Forex:</p>
        <div class="overflow-x-auto my-4">
            <table class="w-full text-left border border-light-gray">
                <thead class="bg-light-hover">
                    <tr>
                        <th class="p-3 border-b border-light-gray">Lot Type</th>
                        <th class="p-3 border-b border-light-gray">Units</th>
                        <th class="p-3 border-b border-light-gray">Pip Value (on USD pairs)</th>
                        <th class="p-3 border-b border-light-gray">Example Use Case</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b border-light-gray">
                        <td class="p-3 font-semibold">Standard Lot</td>
                        <td class="p-3">100,000 units</td>
                        <td class="p-3">≈ $10 per pip</td>
                        <td class="p-3">Professional traders</td>
                    </tr>
                    <tr class="border-b border-light-gray">
                        <td class="p-3 font-semibold">Mini Lot</td>
                        <td class="p-3">10,000 units</td>
                        <td class="p-3">≈ $1 per pip</td>
                        <td class="p-3">Intermediate traders</td>
                    </tr>
                    <tr>
                        <td class="p-3 font-semibold">Micro Lot</td>
                        <td class="p-3">1,000 units</td>
                        <td class="p-3">≈ $0.10 per pip</td>
                        <td class="p-3">Beginners / small accounts</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <p class="mb-4">So, if EUR/USD moves 10 pips:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>A trader with 1 standard lot earns or loses $100 (10 pips × $10).</li>
            <li>A trader with 1 mini lot earns or loses $10.</li>
            <li>A trader with 1 micro lot earns or loses $1.</li>
        </ul>
        <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-4">
            <h4 class="text-xl font-semibold mb-2">📘 Example Calculation</h4>
            <p class="mb-2">Let’s assume:</p>
            <ul class="list-disc list-inside mb-2 pl-4">
                <li>Pair: EUR/USD</li>
                <li>Trade Size: 1 standard lot (100,000 units)</li>
                <li>Movement: +25 pips</li>
            </ul>
            <p class="mb-2"><strong>Profit</strong> = 25 pips × $10 = $250.</p>
            <p>If the same move went against you:<br/><strong>Loss</strong> = 25 pips × $10 = $250.</p>
            <p class="mt-4">This direct relationship between pips, lots, and dollar value is why position sizing is crucial.</p>
        </div>
        <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-4">
            <h4 class="text-xl font-semibold mb-2">⚖️ Position Sizing Formula</h4>
            <p class="mb-4">Position size determines how many lots you should trade based on your account size and risk tolerance.</p>
            <p class="font-semibold mb-2">Formula:</p>
            <p class="mb-4 p-3 bg-light-surface rounded-md font-mono text-sm">Position Size (lots) = (Account Size × Risk %) / (Stop Loss (pips) × Pip Value per Lot)</p>
            <p class="font-semibold mb-2">Example:</p>
            <ul class="list-disc list-inside mb-2 pl-4">
                <li>Account: $1,000</li>
                <li>Risk: 2% ($20)</li>
                <li>Stop loss: 20 pips</li>
                <li>Pip value per micro lot: $0.10</li>
            </ul>
            <p class="mb-4 p-3 bg-light-surface rounded-md font-mono text-sm">Position Size = $20 / (20 pips × $0.10) = 10 micro lots = 0.10 lot</p>
            <p>Thus, you’d open 0.10 lot to risk only 2% of your account.</p>
        </div>

        <h3 class="text-2xl font-semibold mt-6 mb-3">3. What Is a Lot?</h3>
        <p class="mb-4">Leverage allows traders to control large positions with a relatively small amount of capital by borrowing funds from their broker.</p>
        <p class="mb-4">It’s expressed as a ratio, such as 1:50, 1:100, or 1:500, depending on your broker and regulatory region.</p>
        <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-4">
            <h4 class="text-xl font-semibold mb-2 flex items-center"><span class="text-2xl mr-2">💡</span> How It Works</h4>
            <p class="mb-4">Leverage multiplies your buying power. For example:</p>
            <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
                <li>With 1:100 leverage, $100 in your account lets you control $10,000 in trades.</li>
                <li>With 1:500 leverage, $100 lets you control $50,000.</li>
            </ul>
            <p class="font-semibold text-danger">However, while leverage amplifies profits, it also amplifies losses.</p>
        </div>
        <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-4">
            <h4 class="text-xl font-semibold mb-2">📊 Leverage Example</h4>
            <p class="mb-2">Let’s assume:</p>
            <ul class="list-disc list-inside mb-2 pl-4">
                <li>Account Balance: $1,000</li>
                <li>Leverage: 1:100</li>
                <li>You want to trade 1 standard lot (100,000 units)</li>
            </ul>
            <p class="font-semibold mb-2">Required Margin = Trade Size ÷ Leverage</p>
            <p class="mb-4 p-3 bg-light-surface rounded-md font-mono text-sm">Margin = 100,000 / 100 = $1,000</p>
            <p class="mb-2">That means your entire account is tied up in one trade — very risky.</p>
            <p>If the market moves just 10 pips against you, you could lose $100 (10% of your account).</p>
        </div>

        <h3 class="text-2xl font-semibold mt-6 mb-3">4. Margin and Free Margin</h3>
        <p class="mb-4">When trading with leverage, brokers set aside a portion of your funds called margin — a security deposit to maintain your position.</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Used Margin:</strong> The amount locked for open trades.</li>
            <li><strong>Free Margin:</strong> Funds available for new trades.</li>
            <li><strong>Margin Level (%):</strong> (Equity ÷ Used Margin) × 100.</li>
        </ul>
        <p class="mb-4">If your margin level drops too low (often below 50–80%), you may face a <strong>margin call</strong> — your broker automatically closes positions to prevent further loss.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">5. How Pips, Lots & Leverage Work Together</h3>
        <p class="mb-4">These three elements determine your profit, loss, and risk exposure per trade.</p>
        <div class="overflow-x-auto my-4">
            <table class="w-full text-left border border-light-gray">
                <thead class="bg-light-hover">
                    <tr>
                        <th class="p-3 border-b border-light-gray">Component</th>
                        <th class="p-3 border-b border-light-gray">Definition</th>
                        <th class="p-3 border-b border-light-gray">Impact</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b border-light-gray">
                        <td class="p-3 font-semibold">Pip</td>
                        <td class="p-3">Smallest unit of price movement</td>
                        <td class="p-3">Measures gains/losses</td>
                    </tr>
                    <tr class="border-b border-light-gray">
                        <td class="p-3 font-semibold">Lot</td>
                        <td class="p-3">Trade size (position volume)</td>
                        <td class="p-3">Determines pip value</td>
                    </tr>
                    <tr>
                        <td class="p-3 font-semibold">Leverage</td>
                        <td class="p-3">Borrowed capital</td>
                        <td class="p-3">Amplifies both profits and losses</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <h4 class="text-xl font-semibold mb-2">Example Summary</h4>
        <p class="mb-4">You trade 1 mini lot (0.10) on EUR/USD with 1:100 leverage:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Each pip = $1.</li>
            <li>Market moves +50 pips → +$50 profit.</li>
            <li>Market moves –50 pips → –$50 loss.</li>
        </ul>
        <p class="mb-4">If you had used 1 standard lot, the same move would be +$500 or –$500.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">6. Recommended Risk Practices</h3>
        <p class="mb-4">To trade professionally, risk must always be controlled and measurable.</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-2">
            <li><strong class="text-success">✅ Use Low Leverage:</strong> Stick to 1:30 to 1:100 — manageable exposure, minimal stress.</li>
            <li><strong class="text-success">✅ Risk 1–2% per Trade:</strong> Never risk more than 2% of your total account on one position.</li>
            <li><strong class="text-success">✅ Know Your Pip Value Before Entry:</strong> Calculate your potential loss in dollars before clicking “Buy” or “Sell.”</li>
            <li><strong class="text-success">✅ Use Stop Loss Consistently:</strong> A fixed stop loss ensures you live to trade another day.</li>
            <li><strong class="text-success">✅ Backtest and Journal:</strong> Track your pip gains, lot sizes, and leverage use over time for improvement.</li>
        </ul>

        <h3 class="text-2xl font-semibold mt-6 mb-3">7. Common Mistakes to Avoid</h3>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-2">
            <li><strong class="text-danger">🚫 Overleveraging:</strong> The biggest reason new traders blow accounts.</li>
            <li><strong class="text-danger">🚫 Ignoring Pip Value:</strong> Trading without knowing pip value equals blind risk.</li>
            <li><strong class="text-danger">🚫 Using Oversized Lots:</strong> Big positions magnify emotional pressure and poor decisions.</li>
            <li><strong class="text-danger">🚫 No Risk Plan:</strong> Every trade must have pre-defined stop loss and target.</li>
        </ul>

        <h3 class="text-2xl font-semibold mt-6 mb-3">Conclusion</h3>
        <p class="mb-4">Understanding Pips, Lots, and Leverage is the foundation of responsible trading. These metrics tell you exactly how much you’re risking, how much you can gain, and how to scale your positions safely.</p>
        <p class="mb-4">Trading success isn’t about predicting the market perfectly — it’s about managing risk intelligently. Professional traders win not because they never lose, but because they know exactly how much they can afford to lose every time they trade.</p>
        <p class="mb-4 font-semibold">In essence:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Pips measure price.</li>
            <li>Lots measure volume.</li>
            <li>Leverage magnifies everything.</li>
        </ul>
        <p class="mb-4">Master them — and you master control over your trading future.</p>
      `
    },
    { id: 7, category: "Forex Basics", title: "Forex Trading for Dummies: A Beginner's Guide", summary: "A comprehensive guide covering the very basics of Forex trading in an easy-to-understand format.", difficulty: "Beginner", type: "book",
      content: `
        <h3 class="text-2xl font-semibold mt-6 mb-3">🎯 Chapter 1: The Macro View – Understanding the Forex Ecosystem</h3>
        <p class="mb-4">Forex (Foreign Exchange) is the <strong>Interbank Market</strong>, the decentralized global network where major commercial banks trade currencies, setting the benchmark prices. Retail traders gain access through a broker, who acts as an intermediary to this market, which moves over $6.6 trillion per day.</p>
        <p class="mb-4"><strong>Market Structure:</strong> Trading is hierarchical. Tier 1 (Major Banks) provide the deepest liquidity, followed by Tier 2 (Investment Firms and ECNs), and finally Tier 3 (Retail Traders).</p>
        <p class="mb-4"><strong>The 24-Hour Cycle:</strong> The market is divided into four major sessions: Sydney, Tokyo, London, and New York. The periods of highest liquidity and volatility, offering the best trading opportunities, occur when the London and New York sessions overlap (roughly 12:00 PM to 4:00 PM GMT).</p>
        <p class="mb-4"><strong>Defining Quotes:</strong> Currencies are always traded in pairs. The <strong>Base Currency</strong> is always quoted as one unit (e.g., EUR in EUR/USD), and the <strong>Quote Currency</strong> is the price (e.g., 1.1000). A <strong>Cross Currency Pair</strong> is any pair that does not include the USD (e.g., EUR/JPY).</p>
        
        <h3 class="text-2xl font-semibold mt-6 mb-3">🔬 Chapter 2: The Core Mechanics – Position Sizing and Leverage</h3>
        <p class="mb-4">Understanding the value of price movement and how to size your trade is fundamental to controlling risk.</p>
        <p class="mb-4"><strong>Pip (Point in Percentage):</strong> The smallest unit of movement, usually the fourth decimal place (0.0001) for most pairs. The approximate value of one pip for a standard lot ($100,000 units) in USD-quoted pairs is $10.</p>
        <p class="mb-4"><strong>Lot Size and Pip Value:</strong> Position size is measured in Lots. A <strong>Standard Lot</strong> is 100,000 units, a <strong>Mini Lot</strong> is 10,000 units (~$1 per pip), and a <strong>Micro Lot</strong> is 1,000 units (~$0.10 per pip).</p>
        <p class="mb-4"><strong>Leverage:</strong> The use of borrowed capital from your broker to control a larger position with a small amount of margin. While a broker might offer 100:1 leverage, professional traders use minimal effective leverage (often less than 10:1) to prevent ruin. The danger of leverage is the amplification of losses, leading to a <strong>Margin Call</strong> (forced liquidation of your position).</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Order Types:</h4>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
          <li><strong>Market Order:</strong> Immediate execution at the current price.</li>
          <li><strong>Limit Order:</strong> An instruction to buy below or sell above the current price (used for pullbacks).</li>
          <li><strong>Stop Order:</strong> An instruction to buy above or sell below the current price (used for breakouts).</li>
        </ul>
        
        <h3 class="text-2xl font-semibold mt-6 mb-3">🛡️ Chapter 3: Advanced Risk and Money Management</h3>
        <p class="mb-4">This is the single most important component of trading. Your primary job is to protect capital.</p>
        <p class="mb-4"><strong>The 1% Rule (Maximum Risk):</strong> Never risk more than 1% of your total account equity on any single trade. This mathematical control ensures you can sustain long losing streaks without being mathematically ruined.</p>
        <p class="mb-4"><strong>The Position Sizing Formula:</strong> This links your risk tolerance and your technical stop loss distance to determine the precise lot size.</p>
        <p class="mb-4"><strong>Stop Loss (The Lifeline):</strong> A mandatory, automatic exit for a losing trade. It must be set based on market structure (e.g., just beyond a swing high/low), not an arbitrary pip amount.</p>
        <p class="mb-4"><strong>Risk/Reward Ratio (R:R):</strong> The ratio of your potential profit (Reward) to your maximum risk. Aim for a minimum <strong>1:2 R:R</strong> (risk 1 unit to gain 2 units). This means you only need a 34% win rate to break even, removing pressure from being constantly "right."</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Trade Management:</h4>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Breakeven Stop:</strong> Moving your Stop Loss to the entry price once the trade has reached 1R profit.</li>
            <li><strong>Partial Take Profit:</strong> Closing a portion of the position at a major resistance level to lock in profit, allowing the remainder to run.</li>
        </ul>
        
        <h3 class="text-2xl font-semibold mt-6 mb-3">📊 Chapter 4: Technical Analysis Mastery – Beyond the Basics</h3>
        <p class="mb-4">Technical Analysis (TA) is the study of price charts to predict future movements, assuming history tends to repeat.</p>
        <p class="mb-4"><strong>Candlesticks:</strong> Provide high/low/open/close data. Look for reversal patterns like the <strong>Engulfing Pattern</strong> or the <strong>Pin Bar</strong> (Hammer/Shooting Star) forming at key price zones.</p>
        <p class="mb-4"><strong>Support and Resistance (S/R):</strong> Psychological price barriers where buying/selling interest has previously reversed the price. A broken Resistance level often becomes new Support (and vice-versa). <strong>Psychological Levels</strong> (prices ending in '00' or '50') often act as strong S/R.</p>
        <p class="mb-4"><strong>Trend Confirmation:</strong> An <strong>Uptrend</strong> is defined by higher highs (HH) and higher lows (HL). A <strong>Downtrend</strong> is defined by lower lows (LL) and lower highs (LH).</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Technical Indicators (Confirmation):</h4>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Moving Averages (MAs):</strong> Used to define the trend (e.g., using the 20 and 50 EMA crossover).</li>
            <li><strong>Relative Strength Index (RSI):</strong> A momentum oscillator used to find overbought (above 70) or oversold (below 30) conditions. Look for <strong>Divergence</strong> (price makes a new high but the indicator does not) as a high-probability reversal signal.</li>
            <li><strong>Fibonacci Retracement:</strong> A tool based on a mathematical sequence used to predict potential pullback S/R levels before the trend resumes (key levels are 50% and 61.8%).</li>
        </ul>

        <h3 class="text-2xl font-semibold mt-6 mb-3">🌍 Chapter 5: Fundamental Analysis Deep Dive</h3>
        <p class="mb-4">Fundamental Analysis (FA) evaluates the economic, social, and political health of the nations behind the currencies, determining long-term value.</p>
        <p class="mb-4"><strong>Central Banks (The Primary Driver):</strong> Monetary policy decisions, particularly on <strong>Interest Rates</strong>, drive global capital flow. A <strong>Hawkish Stance</strong> (raising rates to fight inflation) strengthens a currency; a <strong>Dovish Stance</strong> (cutting rates to stimulate growth) weakens it.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Key Economic Indicators (High Impact):</h4>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Non-Farm Payroll (NFP):</strong> US employment data. Strong numbers typically strengthen the USD.</li>
            <li><strong>Consumer Price Index (CPI):</strong> Inflation data. High inflation often forces rate hikes, strengthening the currency.</li>
            <li><strong>Gross Domestic Product (GDP):</strong> Economic growth. Strong growth strengthens the currency.</li>
        </ul>
        <p class="mb-4"><strong>The Economic Calendar:</strong> Essential for FA traders to track the time and expected impact of major news releases. Beginners should avoid trading 30 minutes before and after high-impact news due to high volatility and potential slippage.</p>
        <p class="mb-4"><strong>Intermarket Correlation:</strong> Currencies are interconnected. The <strong>USD and Gold (XAU/USD)</strong> typically have an <strong>inverse correlation</strong>. During "Risk Off" periods (global uncertainty), capital flows to safe-haven currencies like the USD, JPY, and CHF.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">🧠 Chapter 6: Trading Psychology and Discipline</h3>
        <p class="mb-4">Trading success is 80% psychology and 20% mechanics. Discipline is your most critical edge.</p>
        <p class="mb-4"><strong>The Four Horsemen of Doom:</strong> <strong>Fear, Greed, Hope, and Revenge Trading</strong> are the primary reasons traders fail. <strong>Revenge Trading</strong> (trying to instantly recoup a loss) is the quickest way to zero out an account.</p>
        <p class="mb-4"><strong>Focus on Expectancy:</strong> Your goal is to develop a system with a positive mathematical <strong>Expectancy</strong>, measuring the average profit/loss over many trades.</p>
        <p class="mb-4"><strong>The Power of Consistency:</strong> Focus on consistent execution of your positive-expectancy strategy, not on maximizing the profit from a single trade. Accept losses as a cost of doing business.</p>
        <p class="mb-4"><strong>Emotional Routine:</strong> Develop a <strong>pre-trade checklist</strong> to ensure your entry criteria are met and your emotional state is calm. <strong>Never trade when angry, tired, or rushed.</strong></p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">📝 Chapter 7: Developing the Complete Trading Plan and Advanced Analysis</h3>
        <p class="mb-4">A Trading Plan is your strict, written set of business rules that dictate how, when, and why you trade.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">The Trading Plan Blueprint</h4>
        <p class="mb-4">Includes: Market Selection, Strategy, Risk Management (1% rule/R:R), and mandatory Journaling.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Multiple Timeframe Analysis (MTFA)</h4>
        <p class="mb-4">This technique uses three timeframes to confirm the trend and pinpoint entries, preventing you from trading against the dominant force.</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Long-Term (D1/W1):</strong> Determines the main trend and bias.</li>
            <li><strong>Medium-Term (H4):</strong> Identifies the setup and market structure.</li>
            <li><strong>Short-Term (H1/M15):</strong> Pinpoints the precise entry trigger.</li>
        </ul>
        <h4 class="text-xl font-semibold mt-4 mb-2">Advanced Chart Patterns (High-Probability Signals)</h4>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Reversal Patterns:</strong> Head and Shoulders (H&S), Double Top/Bottom.</li>
            <li><strong>Continuation Patterns:</strong> Triangles (Ascending/Descending), Flags/Pennants.</li>
        </ul>

        <h3 class="text-2xl font-semibold mt-6 mb-3">🚀 Chapter 8: Developing Your Edge – Strategies for Different Market Conditions</h3>
        <p class="mb-4">Your trading strategy must adapt to the prevailing market condition: trending or ranging.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Trend-Following Strategies (High R:R Potential)</h4>
        <p class="mb-4">These strategies capture the largest moves by trading in the direction of the dominant trend.</p>
        <p class="mb-4"><strong>Strategy Example: MA Crossover:</strong> Wait for a fast Moving Average (e.g., 20 EMA) to cross a slow MA (e.g., 50 EMA) in the direction of the higher timeframe trend, then wait for a pullback to the MAs for entry confirmation.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Range-Bound Strategies (High Win Rate Potential)</h4>
        <p class="mb-4">These strategies trade the boundaries of a defined horizontal range.</p>
        <p class="mb-4"><strong>Strategy Example: S/R Bounce:</strong> Sell at Resistance and buy at Support, using a tight Stop Loss just outside the range boundaries.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Volatility/Breakout Strategies (Fast Moves)</h4>
        <p class="mb-4">These strategies attempt to capitalize on a sudden surge of momentum as price escapes a key consolidation area.</p>
        <p class="mb-4"><strong>Strategy Example: London Breakout:</strong> Identify the tight range established during the quiet Asian session, and place Buy Stop and Sell Stop orders just outside that range to capture the explosive move often seen at the London Open.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Transitioning to Live Trading</h4>
        <p class="mb-4"><strong>Demo Trading is Mandatory:</strong> Prove your strategy works with a positive expectancy on a Demo Account for at least 3-6 months. Treat the demo money as if it were real.</p>
        <p class="mb-4"><strong>Start Small:</strong> When going live, begin with <strong>Micro Lots</strong> only, regardless of your account size. This allows you to handle the psychological shock of real money trading while maintaining minimal risk. Your focus should be on consistent execution of your plan, not immediate profits.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">Recommended Brokers for Beginners</h3>
        <p class="mb-4">For those just starting, choosing a reliable broker is crucial. Here are a couple of recommended options:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-2">
            <li><a href="https://one.exnessonelink.com/a/7jgnvfcl19?source=app" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">Exness</a></li>
            <li><a href="https://octa.click/iMZmxQURQMx" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">OctaFX</a></li>
        </ul>
      `
    },
    { id: 3, category: "Technical Analysis", title: "Mastering Support and Resistance", summary: "Identify key price levels on charts to make better entry and exit decisions.", difficulty: "Intermediate", type: "article",
      content: `
        <h3 class="text-2xl font-semibold mt-6 mb-3">1. What Are Support and Resistance?</h3>
        <p class="mb-4"><strong>Support</strong> is a price level where demand is strong enough to prevent the market from falling further. Think of it as a floor — buyers step in at these levels to push prices higher.</p>
        <p class="mb-4"><strong>Resistance</strong> is the opposite — a price level where selling pressure prevents the market from climbing further. It acts as a ceiling, where sellers dominate and push the price back down.</p>
        <p class="mb-4">In simple terms:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Support = Demand Zone (Buyers’ Territory)</li>
            <li>Resistance = Supply Zone (Sellers’ Territory)</li>
        </ul>
        <p class="mb-4">When price hits support, traders look for buying opportunities.<br/>When price hits resistance, traders look for selling opportunities.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">2. Why Support and Resistance Work</h3>
        <p class="mb-4">These levels represent human behavior and market psychology.</p>
        <p class="mb-2">At <strong>support</strong>:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Buyers perceive price as “cheap” and start buying.</li>
            <li>Sellers hesitate to sell further, creating an imbalance.</li>
        </ul>
        <p class="mb-2">At <strong>resistance</strong>:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Buyers hesitate, fearing overvaluation.</li>
            <li>Sellers see profit-taking opportunities.</li>
        </ul>
        <p class="mb-4">Because traders remember these areas, they become self-fulfilling. When price revisits a known level, the market reacts — again.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">3. Identifying Support and Resistance Levels</h3>
        <p class="mb-4">Here are several reliable ways to pinpoint them:</p>
        <div class="space-y-4">
            <div>
                <h4 class="text-xl font-semibold">a. Horizontal Levels</h4>
                <p>Draw horizontal lines across previous swing highs and lows on your chart. These are your classic support and resistance levels. Multiple touches = strong level. The more rejections at that level, the more significant it becomes.</p>
            </div>
            <div>
                <h4 class="text-xl font-semibold">b. Round Numbers</h4>
                <p>Markets respect psychological levels — such as 1.1000, 1.2000 on EUR/USD or 2000.00 on XAUUSD. Big institutions often set pending orders around these round figures.</p>
            </div>
            <div>
                <h4 class="text-xl font-semibold">c. Dynamic Support and Resistance</h4>
                <p>These are moving averages, such as the 50 EMA or 200 EMA. They move with price and act as dynamic zones where price often bounces or rejects.</p>
            </div>
            <div>
                <h4 class="text-xl font-semibold">d. Trendlines and Channels</h4>
                <p>Trendlines connect higher lows in an uptrend (support) or lower highs in a downtrend (resistance). Channels form when both are drawn parallel, framing price movement.</p>
            </div>
            <div>
                <h4 class="text-xl font-semibold">e. Supply and Demand Zones (ICT-Aligned Concept)</h4>
                <p>Instead of thin lines, view these areas as zones — where institutional orders sit. A support zone is where large buy orders are placed; resistance zones hold sell orders. These align with the Inner Circle Trader (ICT) methodology of identifying institutional footprints.</p>
            </div>
        </div>

        <h3 class="text-2xl font-semibold mt-6 mb-3">4. How Support Becomes Resistance (and Vice Versa)</h3>
        <p class="mb-4">This is one of the most powerful concepts in trading. When price breaks below a support, that level often turns into new resistance when retested — and vice versa.</p>
        <p class="mb-4">This happens because:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Traders who bought at support now find themselves in losing positions.</li>
            <li>When price revisits that zone, they close their trades, creating selling pressure.</li>
        </ul>
        <p class="mb-4">It’s the same psychology reversed when resistance becomes new support.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">5. Using Support and Resistance in Trading</h3>
        <p class="mb-4">Here’s how to effectively trade them:</p>
        <div class="space-y-4">
            <div>
                <h4 class="text-xl font-semibold">a. The Reversal Approach</h4>
                <p>Wait for price to touch a strong level and show rejection signals, like:</p>
                <ul class="list-disc list-inside pl-4"><li>Pin bar</li><li>Engulfing candle</li><li>Doji or bullish/bearish hammer</li></ul>
                <p>This method is ideal for counter-trend traders or those looking for turning points.</p>
            </div>
            <div>
                <h4 class="text-xl font-semibold">b. The Breakout Approach</h4>
                <p>Wait for a clear breakout through a level, confirmed by:</p>
                <ul class="list-disc list-inside pl-4"><li>Strong volume</li><li>Momentum candle close beyond the zone</li><li>Retest of the broken level (Break-and-Retest setup)</li></ul>
                <p>This is the preferred method for trend-following traders.</p>
            </div>
            <div>
                <h4 class="text-xl font-semibold">c. The ICT Way (Liquidity Perspective)</h4>
                <p>ICT traders look at support/resistance as liquidity pools — where stop losses rest.</p>
                <ul class="list-disc list-inside pl-4"><li>Equal highs/lows = liquidity traps.</li><li>Smart money drives price beyond these areas to collect liquidity before reversing.</li></ul>
                <p>By understanding where liquidity lies, you can anticipate false breakouts (stop hunts) and trade in the direction of smart money.</p>
            </div>
        </div>

        <h3 class="text-2xl font-semibold mt-6 mb-3">6. Common Mistakes Traders Make</h3>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Drawing too many lines:</strong> Keep charts clean. Focus on key levels.</li>
            <li><strong>Ignoring context:</strong> A support in a downtrend is weaker than in an uptrend.</li>
            <li><strong>Entering without confirmation:</strong> Wait for rejection or breakout confirmation.</li>
            <li><strong>Forcing trades:</strong> Not every level is tradable; patience is the key.</li>
        </ul>

        <h3 class="text-2xl font-semibold mt-6 mb-3">7. Practical Example: Gold (XAUUSD)</h3>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Key resistance: $2400</li>
            <li>Key support: $2320</li>
        </ul>
        <p class="mb-4">When price nears $2400, watch for exhaustion candles — that’s your sell signal zone. If price breaks and retests above $2400, the level flips into support — ideal for a continuation buy.</p>
        <p class="mb-4">During NFP or CPI events, gold often pierces these zones to collect liquidity before reversing sharply — a classic ICT-style move.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">8. Combining Support/Resistance with Other Confluences</h3>
        <p class="mb-4">For higher probability trades:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Align with trend direction.</li>
            <li>Add Fibonacci retracement levels (e.g., 61.8%).</li>
            <li>Check volume spikes or session overlaps.</li>
            <li>Confirm with higher timeframes (4H/Daily).</li>
        </ul>
        <p class="mb-4">The more confluences align, the stronger the setup.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">9. Final Thoughts</h3>
        <p class="mb-4">Support and resistance aren’t magic lines — they’re reflections of crowd behavior and institutional order flow. As a trader, your goal is not to predict, but to react when price reaches those key levels.</p>
        <p class="mb-4">Over the years, the traders who master these zones — respecting them, timing them, and adapting to them — are the ones who consistently pull profits from the market.</p>
        <p class="mb-4">So next time you open a chart, don’t just see candles. See where the market remembers. That’s where your opportunity lies.</p>
      `
    },
    { id: 4, category: "Technical Analysis", title: "A Guide to Candlestick Patterns", summary: "Recognize common candlestick patterns to predict future market movements.", difficulty: "Intermediate", type: "article",
      content: `
        <p class="mb-4">Candlestick patterns are the language of price action — the visual story of what buyers and sellers are doing at every moment in the market. They are not just pretty shapes on a chart — they are psychological footprints of fear, greed, hesitation, and confidence.</p>
        <p class="mb-4">Understanding candlestick patterns gives you the ability to read the market’s emotions and anticipate potential moves before they happen. Let’s go deep into how these patterns work and how to use them effectively in your trading.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">1. What Are Candlesticks?</h3>
        <p class="mb-4">A candlestick represents price movement within a specific period (1 minute, 1 hour, 4 hours, daily, etc.). Each candle provides four critical data points:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Open:</strong> Where price started during that period.</li>
            <li><strong>Close:</strong> Where price ended.</li>
            <li><strong>High:</strong> The highest point reached.</li>
            <li><strong>Low:</strong> The lowest point reached.</li>
        </ul>
        <p class="mb-4">Visually, each candle consists of:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>The <strong>body</strong> (the distance between open and close).</li>
            <li>The <strong>wick</strong> or <strong>shadow</strong> (the high and low beyond the body).</li>
        </ul>
        <p class="mb-4">If the close is above the open, the candle is typically bullish (often colored green or white). If the close is below the open, the candle is bearish (often red or black).</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">2. Why Candlestick Patterns Matter</h3>
        <p class="mb-4">Each candlestick captures a battle between buyers and sellers. By studying their shape and sequence, we can gauge market sentiment, momentum, and reversal potential.</p>
        <p class="mb-4">Candlestick analysis is crucial for:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Spotting reversals before they fully form.</li>
            <li>Confirming entries and exits at key levels.</li>
            <li>Understanding market psychology at support and resistance zones.</li>
        </ul>

        <h3 class="text-2xl font-semibold mt-6 mb-3">3. Types of Candlestick Patterns</h3>
        <p class="mb-4">Candlestick patterns can be categorized into reversal, continuation, and indecision formations.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">A. Reversal Patterns</h4>
        <p class="mb-4">These signal that the market may be about to change direction.</p>
        <div class="space-y-4">
            <div>
                <h5 class="font-semibold text-lg">1. Hammer (Bullish Reversal)</h5>
                <ul class="list-disc list-inside pl-4 text-sm space-y-1">
                    <li>Appears after a downtrend.</li>
                    <li>Has a small body and a long lower wick (at least twice the body length).</li>
                    <li>Indicates buyers have stepped in to absorb selling pressure.</li>
                </ul>
                <div class="bg-light-hover p-3 rounded-md border border-light-gray mt-2 text-sm"><strong>📈 Interpretation:</strong> The market rejected lower prices — a possible sign of reversal upward.</div>
            </div>
            <div>
                <h5 class="font-semibold text-lg">2. Shooting Star (Bearish Reversal)</h5>
                <ul class="list-disc list-inside pl-4 text-sm space-y-1">
                    <li>Appears after an uptrend.</li>
                    <li>Small body, long upper wick.</li>
                    <li>Shows that buyers pushed price up, but sellers regained control before the candle closed.</li>
                </ul>
                <div class="bg-light-hover p-3 rounded-md border border-light-gray mt-2 text-sm"><strong>📉 Interpretation:</strong> Weakening bullish momentum; potential for downside reversal.</div>
            </div>
            <div>
                <h5 class="font-semibold text-lg">3. Bullish Engulfing</h5>
                <ul class="list-disc list-inside pl-4 text-sm space-y-1">
                    <li>Appears after a downtrend.</li>
                    <li>A large bullish candle completely engulfs the previous smaller bearish one.</li>
                    <li>Strong sign that buying momentum has taken over.</li>
                </ul>
                <div class="bg-light-hover p-3 rounded-md border border-light-gray mt-2 text-sm"><strong>📈 Interpretation:</strong> Trend reversal to the upside; ideal when near a key support zone.</div>
            </div>
            <div>
                <h5 class="font-semibold text-lg">4. Bearish Engulfing</h5>
                <ul class="list-disc list-inside pl-4 text-sm space-y-1">
                    <li>Appears after an uptrend.</li>
                    <li>A large bearish candle engulfs the smaller bullish one before it.</li>
                </ul>
                <div class="bg-light-hover p-3 rounded-md border border-light-gray mt-2 text-sm"><strong>📉 Interpretation:</strong> Trend may reverse downward; confirms seller dominance.</div>
            </div>
            <div>
                <h5 class="font-semibold text-lg">5. Morning Star</h5>
                <p class="mb-2 text-sm">A three-candle pattern marking the end of a downtrend:</p>
                <ul class="list-disc list-inside pl-4 text-sm space-y-1">
                    <li>Large bearish candle.</li>
                    <li>Small indecisive candle (doji or small body).</li>
                    <li>Large bullish candle confirming reversal.</li>
                </ul>
                <div class="bg-light-hover p-3 rounded-md border border-light-gray mt-2 text-sm"><strong>📈 Interpretation:</strong> A reliable signal of bottoming and trend reversal upward.</div>
            </div>
            <div>
                <h5 class="font-semibold text-lg">6. Evening Star</h5>
                <p class="mb-2 text-sm">The opposite of the Morning Star, appearing at the top of an uptrend:</p>
                <ul class="list-disc list-inside pl-4 text-sm space-y-1">
                    <li>Large bullish candle.</li>
                    <li>Small indecisive candle.</li>
                    <li>Large bearish candle closing below the midpoint of the first candle.</li>
                </ul>
                <div class="bg-light-hover p-3 rounded-md border border-light-gray mt-2 text-sm"><strong>📉 Interpretation:</strong> Strong bearish reversal signal.</div>
            </div>
        </div>

        <h4 class="text-xl font-semibold mt-6 mb-2">B. Continuation Patterns</h4>
        <p class="mb-4">These indicate that the current trend is likely to continue.</p>
        <div class="space-y-4">
            <div>
                <h5 class="font-semibold text-lg">1. Rising Three Methods (Bullish Continuation)</h5>
                <p class="mb-2 text-sm">Consists of:</p>
                <ul class="list-disc list-inside pl-4 text-sm space-y-1">
                    <li>Long bullish candle.</li>
                    <li>Three or more small bearish candles staying within the range of the first.</li>
                    <li>Another bullish candle breaking the previous high.</li>
                </ul>
                <div class="bg-light-hover p-3 rounded-md border border-light-gray mt-2 text-sm"><strong>📈 Interpretation:</strong> Temporary consolidation before upward continuation.</div>
            </div>
            <div>
                <h5 class="font-semibold text-lg">2. Falling Three Methods (Bearish Continuation)</h5>
                <p class="mb-2 text-sm">Mirror of the rising three:</p>
                <ul class="list-disc list-inside pl-4 text-sm space-y-1">
                    <li>Long bearish candle.</li>
                    <li>Three or more small bullish candles inside its range.</li>
                    <li>Final bearish candle confirming trend continuation.</li>
                </ul>
                <div class="bg-light-hover p-3 rounded-md border border-light-gray mt-2 text-sm"><strong>📉 Interpretation:</strong> Short pause before continuation of downtrend.</div>
            </div>
        </div>

        <h4 class="text-xl font-semibold mt-6 mb-2">C. Indecision Patterns</h4>
        <p class="mb-4">These reflect uncertainty — a tug-of-war between buyers and sellers.</p>
        <div class="space-y-4">
            <div>
                <h5 class="font-semibold text-lg">1. Doji</h5>
                <ul class="list-disc list-inside pl-4 text-sm space-y-1">
                    <li>Candle with almost equal open and close.</li>
                    <li>Long wicks, small or no body.</li>
                </ul>
                <div class="bg-light-hover p-3 rounded-md border border-light-gray mt-2 text-sm"><strong>📊 Interpretation:</strong> Market indecision; strong at key support/resistance. Often precedes reversals or major breakouts.</div>
            </div>
            <div>
                <h5 class="font-semibold text-lg">2. Spinning Top</h5>
                <ul class="list-disc list-inside pl-4 text-sm space-y-1">
                    <li>Small body with upper and lower wicks of similar length.</li>
                    <li>Reflects balanced sentiment between buyers and sellers.</li>
                </ul>
                <div class="bg-light-hover p-3 rounded-md border border-light-gray mt-2 text-sm"><strong>📊 Interpretation:</strong> Pause in market direction — often a precursor to breakout.</div>
            </div>
        </div>

        <h3 class="text-2xl font-semibold mt-6 mb-3">4. How to Use Candlestick Patterns Effectively</h3>
        <p class="mb-4">Candlestick patterns alone are not a trading strategy — they are confirmation tools. To use them effectively, combine them with other technical factors:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Support and Resistance Zones:</strong> A bullish reversal at support or a bearish reversal at resistance increases reliability.</li>
            <li><strong>Trend Context:</strong> Always identify the dominant trend. Reversal patterns against strong trends are less reliable.</li>
            <li><strong>Volume Confirmation:</strong> A pattern forming with high trading volume gives stronger conviction.</li>
            <li><strong>Multiple Timeframe Analysis:</strong> Patterns confirmed on higher timeframes (4H, Daily) hold greater weight.</li>
        </ul>

        <h3 class="text-2xl font-semibold mt-6 mb-3">5. Common Mistakes Traders Make</h3>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Relying on single-candle signals without context.</li>
            <li>Ignoring trend direction or key levels.</li>
            <li>Trading without confirmation from higher timeframes.</li>
            <li>Overcomplicating charts with every minor pattern.</li>
        </ul>
        <p class="mb-4">Professional traders focus on context and confluence, not just isolated patterns.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">6. Advanced Insight – ICT Perspective</h3>
        <p class="mb-4">Under the Inner Circle Trader (ICT) framework, candlestick formations represent the footprints of smart money.</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Stop hunts and liquidity grabs often appear as false breakouts followed by engulfing or pin bar candles.</li>
            <li>The wicks reveal where liquidity was engineered and absorbed.</li>
        </ul>
        <p class="mb-4">Understanding these patterns in relation to liquidity pools and market structure gives traders a deeper institutional perspective — beyond retail chart reading.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">7. Conclusion</h3>
        <p class="mb-4">Candlestick patterns are a timeless language spoken by every trader across the globe. They show who’s in control — buyers or sellers — and when the tide is turning.</p>
        <p class="mb-4">However, mastery doesn’t come from memorizing patterns; it comes from understanding the story behind each candle and where it forms in the broader market structure.</p>
        <p class="mb-4">A single hammer in isolation means little — but a hammer rejecting a key support after a liquidity grab? That’s a trade with institutional-grade confluence.</p>
        <p class="mb-4">So, train your eyes not just to see candles, but to interpret them. The market speaks clearly — only disciplined traders learn to listen.</p>
      `
    },
    { id: 8, category: "Technical Analysis", title: "Japanese Candlestick Charting Techniques (Book)", summary: "Steve Nison's classic guide to understanding and using candlestick patterns for market analysis.", difficulty: "Advanced", type: "book",
      content: `
        <h3 class="text-2xl font-semibold mt-6 mb-3">I. Historical Foundations and Market Psychology</h3>
        <h4 class="text-xl font-semibold mt-4 mb-2">The Origin of Candlesticks: Munehisa Homma and the Dōjima Rice Exchange</h4>
        <p class="mb-4">Japanese candlestick charting techniques represent one of the oldest and most enduring forms of technical analysis employed in financial markets globally. The methodology was developed in the 1700s by Munehisa Homma (Honma Munehisa), a wealthy and influential rice merchant from Sakata, Japan. Homma initially created this system specifically for analyzing the fluctuations of rice futures prices at the Dōjima Rice Exchange in Osaka during the Tokugawa Shogunate.</p>
        <p class="mb-4">This period marked a transition in the rice market; around 1710, a futures market emerged based on trading coupons that promised future rice delivery, shifting away from exclusive spot trading. Homma excelled in the secondary market that developed around this coupon trading. His trading acumen was legendary; historical accounts suggest his profits were equivalent to roughly $10 billion in modern currency. To communicate rapidly across long distances, stories claim he established a personal network of men spaced every six kilometers between Sakata and Osaka, a distance of approximately 600 kilometers, to relay market prices quickly.</p>
        <p class="mb-4">While Homma laid the foundation for the system, the widespread adoption and expert interpretation of candlestick charting in Western financial markets are generally credited to Steve Nison.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Integrating Psychology: The True Engine of Homma’s Strategy</h4>
        <p class="mb-4">Crucially, Homma’s methodology transcended simple price tracking. His written work, <strong>The Fountain of Gold — The Three Monkey Record of Money (1755)</strong>, focused extensively on the psychological aspects of trading, asserting that a nuanced understanding of market emotions is critical to long-term success. Homma claimed that the collective emotional state of traders significantly influenced rice prices.</p>
        <p class="mb-4">The candlestick method itself is a sophisticated visual mechanism for capturing and quantifying collective trader emotion. Unlike simpler line charts, candlesticks utilize color and body size to immediately communicate the outcome of the underlying conflict between buyers and sellers—the emotional state of the market (fear, optimism, indecision) during that specific period. This makes candlesticks fundamentally psychological visualization tools. Homma described market movements using the classical concept of <strong>Yin</strong> (bear market) and <strong>Yang</strong> (bull market), noting the critical point that an instance of the opposing force exists even within the dominant market type.</p>
        <p class="mb-4">This understanding led to Homma's most enduring strategic contribution: the foundation of contrarian trading. He identified that success lay in recognizing psychological extremes and taking a counter-market position. Specifically, he noted that "when all are bearish, there is cause for prices to rise," and vice versa. The modern utility of candlestick reversal patterns—such as the Doji, Hammer, or Engulfing patterns —therefore rests on this original contrarian philosophy, as these formations signal visually that market exhaustion (the extreme emotional state) has been reached, indicating a psychological tipping point and a potential shift in momentum.</p>
        
        <h3 class="text-2xl font-semibold mt-6 mb-3">II. The Structural Anatomy and Immediate Interpretation</h3>
        <p class="mb-4">Each individual candlestick provides a powerful summary of price movement, momentum, and volatility over a specific, chosen time period. Understanding the components of a candle—the body and the shadows—is prerequisite to interpreting any patterns formed by them.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Decoding the OHLC Data and Timeframe Context</h4>
        <p class="mb-4">Every candle is a comprehensive visual record displaying four key data points, collectively known as <strong>OHLC</strong>: the <strong>Open, High, Low, and Close</strong> price. These four points reveal the full range of price activity and the net directional outcome of the buying and selling battle within that time frame.</p>
        <p class="mb-4">The context provided by the chosen timeframe is absolutely critical for analysis. The same candlestick shape will carry different analytical weight depending on its granularity. For instance, a strong reversal signal on a daily chart, reflecting an entire 24-hour cycle of trading, signals a more significant institutional shift than an identical pattern appearing on a one-minute chart, emphasizing that the time interval is paramount to determining the structural significance of any identified pattern.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">The Real Body: Momentum and Conviction</h4>
        <p class="mb-4">The real body is the rectangular portion of the candle, representing the distance between the Open and the Close price points.</p>
        <p class="mb-4"><strong>Color Significance:</strong> The body's color denotes the net direction of the price movement. A green or hollow body indicates that the Close price was higher than the Open price, signifying a bullish session. Conversely, a red or filled body means the Close price was lower than the Open price, signaling a bearish session.</p>
        <p class="mb-4"><strong>Size Significance:</strong> The length of the body is a direct reflection of momentum and conviction. A long real body indicates strong directional movement; a long green body suggests aggressive buying power and optimism, while a long red body suggests aggressive selling pressure driven by fear.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">The Shadows (Wicks): Interpreting Price Rejection</h4>
        <p class="mb-4">The shadows, or wicks, are the thin lines extending above and below the real body. They mark the High and Low prices reached during the period. These lines show how far the price extended beyond the open and close range before being rejected.</p>
        <p class="mb-4">The upper shadow indicates the highest price reached. If it is long, it signals that buyers pushed the price up, but sellers ultimately entered and rejected that higher level, pushing the price back down toward the close. Conversely, a long lower shadow indicates strong buying pressure came in to reject the lower price points, reversing losses and forcing a close near the high.</p>
        <p class="mb-4">A critical metric in assessing a candle is the ratio of the real body to the total range (body plus shadows). A high ratio, exemplified by a <strong>Marubozu</strong>, signals highly efficient price movement and strong conviction, as nearly all the trading occurred in the final direction. A low ratio, such as a <strong>Doji</strong>, signals high indecision or volatility without any net directional progress. Furthermore, the existence of long shadows serves as a "market memory" marker. Since these rejections often happen at pivotal support or resistance levels , the length and placement of the shadow indicate a historical price zone where aggressive intervention occurred, signaling future battles at that same location.</p>
        <div class="overflow-x-auto my-6"><table class="w-full text-left border border-light-gray"><caption class="text-lg font-semibold mb-2 text-dark-text">Candlestick Anatomy and Interpretation</caption><thead class="bg-light-hover"><tr><th class="p-3 border-b border-light-gray">Component</th><th class="p-3 border-b border-light-gray">Description</th><th class="p-3 border-b border-light-gray">Bullish Implication (Example: Green)</th><th class="p-3 border-b border-light-gray">Bearish Implication (Example: Red)</th></tr></thead><tbody><tr><td class="p-3 border-b border-light-gray">Real Body</td><td class="p-3 border-b border-light-gray">Distance between Open and Close price points.</td><td class="p-3 border-b border-light-gray">Close > Open. Indicates buying pressure dominance.</td><td class="p-3 border-b border-light-gray">Close < Open. Indicates selling pressure dominance.</td></tr><tr><td class="p-3 border-b border-light-gray">Long Body</td><td class="p-3 border-b border-light-gray">Large difference between Open and Close.</td><td class="p-3 border-b border-light-gray">Strong directional momentum (Optimism).</td><td class="p-3 border-b border-light-gray">Aggressive selling pressure (Fear).</td></tr><tr><td class="p-3 border-b border-light-gray">Upper Shadow</td><td class="p-3 border-b border-light-gray">Highest price above the Close (or Open).</td><td class="p-3 border-b border-light-gray">Price extended higher but was pushed back before the close.</td><td class="p-3 border-b border-light-gray">Rejection of higher prices; sellers entered decisively.</td></tr><tr><td class="p-3 border-b border-light-gray">Lower Shadow</td><td class="p-3 border-b border-light-gray">Lowest price below the Open (or Close).</td><td class="p-3 border-b border-light-gray">Rejection of lower prices; temporary buying pressure.</td></tr></tbody></table></div>
        
        <h3 class="text-2xl font-semibold mt-6 mb-3">III. Comprehensive Taxonomy of Single Candlestick Patterns</h3>
        <p class="mb-4">Single candlestick patterns provide immediate insight into market sentiment, focusing on conviction, indecision, or direct price rejection within a single time period.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Marubozu (Bullish and Bearish)</h4>
        <p class="mb-4">The Marubozu is characterized by a long body with little to no shadows or wicks. This structure implies that the price opened very near the low (Bullish Marubozu) or high (Bearish Marubozu) and closed very near the high or low, respectively. A Bullish Marubozu signifies extreme, uncontested buying interest, confirming strong momentum that may lead to either a continuation of an uptrend or a powerful reversal from a prior downtrend. The lack of shadows suggests no significant resistance was encountered, indicating unchallenged strength in the direction of the close.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">The Doji Family: Indecision and Equilibrium</h4>
        <p class="mb-4">The Doji pattern is identified by an Open price and a Close price that are virtually identical, resulting in a thin or non-existent real body. The Doji signals a momentary equilibrium where buying and selling pressures have reached a match, leading to market indecision. This signal is most important when it appears after a prolonged trend, as it suggests the potential exhaustion of the prevailing directional move.</p>
        <p class="mb-4">The Doji family includes several variations: the <strong>Dragonfly Doji</strong>, which has a long lower shadow (a bullish rejection of lows); the <strong>Gravestone Doji</strong>, which has a long upper shadow (a bearish rejection of highs); and the <strong>Long-Legged Doji</strong>, which features large shadows in both directions, indicating extreme volatility during the period but ultimately resulting in no net directional progress.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Hammer and Hanging Man</h4>
        <p class="mb-4">These two patterns share an identical, unique structure: a small body positioned at the top of the price range, a long lower shadow that is typically two to three times the length of the body, and a minimal or non-existent upper shadow. The difference lies entirely in the context of the preceding trend.</p>
        <p class="mb-4"><strong>The Hammer (Bullish Reversal):</strong> This formation occurs during a downtrend. The long lower shadow demonstrates that sellers attempted to push the price significantly lower, but strong buying pressure intervened, rejecting the low and forcing the close near the high. This definitive rejection signals a potential uptrend reversal.</p>
        <p class="mb-4"><strong>The Hanging Man (Bearish Reversal):</strong> This pattern forms at the conclusion of an uptrend. While structurally identical to the Hammer, the preceding uptrend changes the interpretation. The long lower shadow shows a major sell-off occurred during the session, which, despite buyers managing to push the price back up, is interpreted as the bulls losing substantial control of the market. It forecasts a potential reversal to the downside.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Inverted Hammer and Shooting Star</h4>
        <p class="mb-4">These patterns also share a structure: a small body located at the bottom of the price range, a long upper shadow, and minimal or no lower shadow.</p>
        <p class="mb-4"><strong>The Inverted Hammer (Bullish Reversal):</strong> Appearing in a downtrend, this pattern shows that buyers made a strong attempt to drive the price higher, as evidenced by the long upper shadow. Although they failed to hold the high by the close, the forceful buying attempt itself signals a weakness in the bearish trend, potentially preceding a bullish reversal.</p>
        <p class="mb-4"><strong>The Shooting Star (Bearish Reversal):</strong> Forming during an uptrend, the Shooting Star represents a significant rejection of higher prices. Sellers aggressively entered the market and pushed the price back down to close near the open or low. This demonstrates that the high could not be sustained, signaling a potential turning point where bears are gaining control.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">IV. In-Depth Analysis of Double Candlestick Patterns</h3>
        <p class="mb-4">Two-candle patterns typically provide a more reliable signal than single candles because they chronicle a definitive shift in momentum between two consecutive periods.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Engulfing Patterns (Bullish and Bearish)</h4>
        <p class="mb-4"><strong>Bullish Engulfing:</strong> This reversal occurs when a small bearish candle is immediately followed by a much larger bullish candle whose real body completely covers (engulfs) the real body of the first candle. This signifies that buyers have forcefully overcome the selling pressure of the prior period and taken decisive control, indicating that the price is likely to move higher.</p>
        <p class="mb-4"><strong>Bearish Engulfing:</strong> The inverse, this occurs when a small bullish candle is followed by a larger bearish candle that completely encompasses the first. This suggests the bears have overwhelmed the buyers, indicating a potential near-term decline.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Harami Patterns (Bullish and Bearish)</h4>
        <p class="mb-4">The Harami pattern, meaning "pregnant" in Japanese, is the opposite of the engulfing pattern. It consists of a large candle (the 'mother') followed by a small-bodied candle (the 'baby') that is entirely contained within the body of the preceding candle. This formation signals a pause, hesitation, or sudden indecision following a period of strong movement.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Piercing Line and Dark Cloud Cover</h4>
        <p class="mb-4"><strong>Piercing Line (Bullish Reversal):</strong> Forming after a downtrend, the pattern consists of a bearish candle followed by a bullish candle. The bullish candle typically gaps lower (opens below the prior close) but then rallies aggressively to close above the midpoint of the preceding bearish candle’s real body.</p>
        <p class="mb-4"><strong>Dark Cloud Cover (Bearish Reversal):</strong> The bearish equivalent, forming after an uptrend. The first candle is bullish; the second is bearish. The bearish candle gaps higher but then sells off sharply, closing below the midpoint of the preceding bullish candle’s real body.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Tweezer Tops and Tweezer Bottoms</h4>
        <p class="mb-4"><strong>Tweezer Bottoms (Bullish Reversal):</strong> Occurring during a downtrend, this pattern consists of a bearish candle followed by a bullish candle that both share the exact same low. This signals that the selling pressure was precisely matched by buying pressure at that specific price point across two sessions, suggesting the formation of strong, precise support.</p>
        <p class="mb-4"><strong>Tweezer Tops (Bearish Reversal):</strong> Occurring during an uptrend, these are two consecutive candles (bullish then bearish) that share the exact same high. This indicates that the bulls failed to push the price beyond that level across two periods, signaling a specific resistance point and a potential reversal to the downside.</p>
        <div class="overflow-x-auto my-6"><table class="w-full text-left border border-light-gray"><caption class="text-lg font-semibold mb-2 text-dark-text">Comparison of Key Two-Candle Reversal Patterns</caption><thead class="bg-light-hover"><tr><th class="p-3 border-b border-light-gray">Pattern Type</th><th class="p-3 border-b border-light-gray">Reversal Signal</th><th class="p-3 border-b border-light-gray">Trend Context</th><th class="p-3 border-b border-light-gray">Formation Rule</th><th class="p-3 border-b border-light-gray">Interpretation</th></tr></thead><tbody><tr><td class="p-3 border-b border-light-gray">Bullish Engulfing</td><td class="p-3 border-b border-light-gray">Bullish Reversal</td><td class="p-3 border-b border-light-gray">Downtrend</td><td class="p-3 border-b border-light-gray">Small bearish candle followed by a larger bullish candle that fully encompasses the first.</td><td class="p-3 border-b border-light-gray">Buyers overpower sellers; shift in momentum.</td></tr><tr><td class="p-3 border-b border-light-gray">Piercing Line</td><td class="p-3 border-b border-light-gray">Bullish Reversal</td><td class="p-3 border-b border-light-gray">Downtrend</td><td class="p-3 border-b border-light-gray">Bearish candle followed by a bullish candle that gaps down, then closes above the midpoint of the bearish body.</td><td class="p-3 border-b border-light-gray">Strong buying pressure regaining significant control.</td></tr><tr><td class="p-3 border-b border-light-gray">Dark Cloud Cover</td><td class="p-3 border-b border-light-gray">Bearish Reversal</td><td class="p-3 border-b border-light-gray">Uptrend</td><td class="p-3 border-b border-light-gray">Bullish candle followed by a bearish candle that gaps up, then closes below the midpoint of the bullish body.</td><td class="p-3 border-b border-light-gray">Warning of weakening buying pressure; sellers dominating.</td></tr><tr><td class="p-3 border-b border-light-gray">Tweezer Bottoms</td><td class="p-3 border-b border-light-gray">Bullish Reversal</td><td class="p-3 border-b border-light-gray">Downtrend</td><td class="p-3 border-b border-light-gray">Bearish candle followed by a bullish candle with identical lows.</td><td class="p-3 border-b border-light-gray">Dual rejection of a specific low price level; strong support.</td></tr></tbody></table></div>

        <h3 class="text-2xl font-semibold mt-6 mb-3">V. Advanced Multi-Candle and Continuation Formations</h3>
        <h4 class="text-xl font-semibold mt-4 mb-2">The Morning Star and Evening Star (Three-Candle Reversals)</h4>
        <p class="mb-4"><strong>The Morning Star (Bullish):</strong> This pattern follows a downtrend and details the failure of sellers. (1) It begins with a large bearish candle. (2) This is followed by a small-bodied candle (often a Doji) that gaps lower, signaling exhaustion. (3) The pattern concludes with a large bullish candle that closes strongly beyond the halfway mark of the first bearish candle.</p>
        <p class="mb-4"><strong>The Evening Star (Bearish):</strong> This pattern follows an uptrend. (1) It starts with a large bullish candle. (2) This is followed by a small-bodied candle showing hesitation. (3) It finishes with a large bearish candle, signaling sellers are dominating.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Three White Soldiers and Three Black Crows</h4>
        <p class="mb-4"><strong>Three White Soldiers (Bullish):</strong> Three consecutive long-bodied bullish candlesticks. Each candle should open within the previous candle's real body and close higher than the previous high with small or no wicks.</p>
        <p class="mb-4"><strong>Three Black Crows (Bearish):</strong> The mirror image, signaling a potential reversal of an uptrend. It consists of three consecutive long-bodied bearish candlesticks, each opening within the preceding real body and closing at a new low.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Continuation Patterns: Rising and Falling Three Methods</h4>
        <p class="mb-4"><strong>Falling Three Methods (Bearish Continuation):</strong> A long bearish body, followed by three smaller bullish bodies, and then another long bearish body. The three inner candles must be fully contained within the range of the two outer bearish bodies.</p>
        <p class="mb-4"><strong>Rising Three Methods (Bullish Continuation):</strong> The opposite scenario, with three short bearish candles sandwiched within the range of two long bullish candles.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">VI. Strategic Confirmation and Practical Application</h3>
        <p class="mb-4">Candlestick patterns should be validated by a convergence of other analytical tools, a concept known as confluence.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Volume Analysis: Validation of Commitment</h4>
        <p class="mb-4">High volume accompanying a reversal pattern indicates strong participation and commitment from major market participants, increasing the probability of a sustained trend.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Structural Confluence: Support and Resistance</h4>
        <p class="mb-4">A pattern is significantly more reliable when it forms at a predefined, critical price level like support, resistance, trendlines, or Fibonacci retracement zones.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Indicator Integration (The Synergy Approach)</h4>
        <p class="mb-4"><strong>RSI (Relative Strength Index):</strong> Confirms overbought/oversold conditions. Divergence between price action and the RSI is a highly valuable confirmation signal.</p>
        <p class="mb-4"><strong>MACD (Moving Average Convergence Divergence):</strong> A bullish crossover on the MACD, occurring concurrently with a bullish candlestick pattern, strengthens the case for upward movement.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">VII. Critical Evaluation and Limitations of Candlestick Techniques</h3>
        <p class="mb-4">Analysts must critically evaluate the inherent drawbacks of Japanese candlestick patterns.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">The Subjectivity Challenge and Interpretation Nuances</h4>
        <p class="mb-4">One of the primary limitations is the subjective nature of pattern identification. Definitions regarding what constitutes a "long shadow" or "small body" can vary widely between traders.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">The Problem of False Signals and Market Noise</h4>
        <p class="mb-4">Candlestick patterns frequently produce false signals, especially when the market is consolidating or moving sideways.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Limited Intra-Candle Detail and Narrow Focus</h4>
        <p class="mb-4">A candle showing a large net gain might have experienced extreme internal volatility—sudden spikes, flash crashes, and recoveries—that are completely obscured by the final OHLC endpoints.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">Adapting to 24-Hour Markets (Gaps in Data)</h4>
        <p class="mb-4">Many traditional patterns rely on a price gap between candles. In continuous 24-hour markets like Forex, significant gaps are rare, forcing analysts to modify the historical definitions of these patterns.</p>
      `
    },
    { id: 5, category: "Risk Management", title: "The Importance of Stop-Loss Orders", summary: "Protect your capital by learning how to properly set and manage stop-loss orders.", difficulty: "Beginner", type: "article",
      content: `
        <p class="mb-4">In trading, survival is everything. No matter how skilled you are, how accurate your strategy is, or how confident you feel — if you trade without a stop-loss, you are gambling, not trading.</p>
        <p class="mb-4">The stop-loss order is the trader’s safety net. It’s the one tool that stands between a controlled loss and a devastating wipeout. Let’s break down what it is, how it works, and why every serious trader must master it.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">1. What Is a Stop-Loss Order?</h3>
        <p class="mb-4">A stop-loss order is an instruction you give to your broker to automatically close your trade once price moves against you by a specified amount.</p>
        <p class="mb-4">For example: If you buy EUR/USD at 1.1000 and set your stop-loss at 1.0950, your trade will automatically close when the market hits that level, limiting your loss to 50 pips.</p>
        <p class="mb-4">Think of it as your “emergency exit” — it protects your capital when the market doesn’t go your way.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">2. Why Stop-Loss Orders Matter</h3>
        <h4 class="text-xl font-semibold mt-4 mb-2">A. Capital Protection</h4>
        <p class="mb-4">Your first job as a trader is not to make money — it’s to protect money. The stop-loss prevents one bad trade from turning into a disaster. Without it, a single market spike can wipe out months of profits.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">B. Emotional Control</h4>
        <p class="mb-4">Without a stop-loss, emotions take over. You’ll start hoping, praying, and holding losing trades for too long. A stop-loss takes emotion out of the equation — it enforces discipline, ensuring your decision is made logically, not emotionally.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">C. Risk Management Consistency</h4>
        <p class="mb-4">Every professional trader calculates their risk per trade — usually 1–2% of account balance. The stop-loss defines this risk clearly. It lets you size your position accurately, maintain consistency, and ensure your account can survive long-term.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">D. Professionalism and Automation</h4>
        <p class="mb-4">Pros don’t babysit trades. They manage risk automatically. A stop-loss is a sign of professionalism — it shows that your trades are planned, structured, and data-driven.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">3. Types of Stop-Loss Orders</h3>
        <p class="mb-4">Different traders use different stop-loss types depending on their strategy:</p>
        <div class="space-y-4">
            <div>
                <h5 class="font-semibold text-lg">A. Fixed Stop-Loss</h5>
                <p class="mb-2 text-sm">A simple, predefined number of pips (e.g., 30 pips per trade).</p>
                <div class="bg-light-hover p-3 rounded-md border border-light-gray text-sm"><strong>✅ Best for:</strong> Scalpers and short-term traders.</div>
            </div>
            <div>
                <h5 class="font-semibold text-lg">B. Technical Stop-Loss</h5>
                <p class="mb-2 text-sm">Placed beyond a key technical level such as:</p>
                <ul class="list-disc list-inside pl-4 text-sm space-y-1">
                    <li>Support/resistance</li>
                    <li>Swing high or low</li>
                    <li>Trendline</li>
                    <li>Moving average</li>
                </ul>
                <div class="bg-light-hover p-3 rounded-md border border-light-gray mt-2 text-sm"><strong>✅ Best for:</strong> Price action and swing traders.<br/><strong>Example:</strong> If price is forming higher lows in an uptrend, your stop should be placed below the most recent swing low.</div>
            </div>
            <div>
                <h5 class="font-semibold text-lg">C. Volatility-Based Stop-Loss</h5>
                <p class="mb-2 text-sm">Adjusted based on market volatility, often using the ATR (Average True Range) indicator.</p>
                <div class="bg-light-hover p-3 rounded-md border border-light-gray mt-2 text-sm"><strong>✅ Useful in:</strong> High-volatility pairs like XAUUSD (Gold).<br/><strong>Example:</strong> If the ATR (14) shows 100 pips of average movement, a stop-loss might be placed 1.5× ATR = 150 pips away.</div>
            </div>
            <div>
                <h5 class="font-semibold text-lg">D. Trailing Stop-Loss</h5>
                <p class="mb-2 text-sm">This is a dynamic stop that moves with price as it goes in your favor — locking in profits as the trade progresses.</p>
                <div class="bg-light-hover p-3 rounded-md border border-light-gray mt-2 text-sm"><strong>✅ Ideal for:</strong> Trend-followers and swing traders.<br/><strong>Example:</strong> If you buy at 1.1000 and the price moves to 1.1050, your trailing stop automatically shifts up, maintaining a set distance (e.g., 50 pips).</div>
            </div>
        </div>
        <h3 class="text-2xl font-semibold mt-6 mb-3">4. How to Place an Effective Stop-Loss</h3>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Always place it beyond noise:</strong> Don’t set stops too tight; give price room to breathe.</li>
            <li><strong>Respect structure:</strong> Place stops beyond swing points or liquidity levels.</li>
            <li><strong>Don’t move stops impulsively:</strong> Once placed, only adjust for logical reasons — not emotion.</li>
            <li><strong>Avoid round numbers:</strong> Market makers often trigger stops around key levels like 1.2000 or 1900.</li>
            <li><strong>Account for spread & volatility:</strong> Especially during high-impact news events.</li>
        </ul>
        <h3 class="text-2xl font-semibold mt-6 mb-3">5. Stop-Loss and Risk-to-Reward Ratio</h3>
        <p class="mb-4">Stop-loss is not just about limiting loss — it’s about defining your risk-reward framework. Professional traders aim for a 1:2 or 1:3 Risk-to-Reward (R:R) ratio.</p>
        <p class="mb-4"><strong>Example:</strong> If you risk $100 on a trade (via stop-loss), your take-profit should be set at $200 or $300. This ensures that even if you win only 40% of your trades, you remain profitable.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">6. Common Stop-Loss Mistakes</h3>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong class="text-danger">❌ No Stop-Loss:</strong> Holding hope instead of strategy.</li>
            <li><strong class="text-danger">❌ Too Tight Stops:</strong> Getting stopped out by normal volatility.</li>
            <li><strong class="text-danger">❌ Moving Stops Further:</strong> Refusing to accept a small loss, which often becomes a big one.</li>
            <li><strong class="text-danger">❌ Placing Stops on Obvious Levels:</strong> Easy targets for liquidity grabs.</li>
            <li><strong class="text-danger">❌ Not Accounting for Spread:</strong> Especially dangerous during news spikes.</li>
        </ul>
        <h3 class="text-2xl font-semibold mt-6 mb-3">7. Advanced Insight — ICT Stop-Loss Philosophy</h3>
        <p class="mb-4">In ICT (Inner Circle Trader) methodology, the stop-loss represents liquidity — where retail traders are trapped, and smart money hunts.</p>
        <p class="mb-4">Instead of placing stops at the obvious high/low, professionals position them beyond liquidity pools — where genuine protection exists. ICT teaches that your stop is not just protection — it’s also an indicator of where your trade becomes invalid.</p>
        <p class="mb-4">If price sweeps liquidity and continues against your bias, the market structure has shifted — exit immediately and reassess.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">8. Psychological Value of a Stop-Loss</h3>
        <p class="mb-4">A trader without a stop-loss carries emotional weight on every trade — anxiety, doubt, and denial. A trader with a stop-loss trades freely, knowing the outcome is predefined and controlled.</p>
        <p class="mb-4">Freedom in trading doesn’t come from winning every trade — it comes from knowing exactly how much you can lose and still survive.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">9. Conclusion</h3>
        <p class="mb-4">The stop-loss is not a sign of weakness — it’s a sign of wisdom. Every professional trader uses it not because they expect to lose, but because they respect the market’s unpredictability.</p>
        <p class="mb-4">Even with 30 years of experience, I’ve seen perfect setups fail. That’s why I never risk what I can’t afford to lose, and I never trade without a stop.</p>
        <p class="mb-4">In the end, the market rewards discipline, not ego. A stop-loss keeps you in the game long enough to learn, adapt, and win consistently.</p>
      `
    },
    { id: 6, category: "Risk Management", title: "Position Sizing for Success", summary: "Calculate the optimal position size for any trade to manage risk effectively.", difficulty: "Advanced", type: "article",
      content: `
        <p class="mb-4">If risk management is the backbone of trading, then position sizing is its heartbeat. It determines how much you risk per trade, how consistent your equity curve stays, and ultimately, whether you survive or get wiped out.</p>
        <p class="mb-4">In my 30 years of trading, I’ve seen more traders blow accounts from oversized positions than from bad analysis. You can have the best entry strategy in the world — but without correct position sizing, you’re one wrong move away from margin call.</p>
        <p class="mb-4">Let’s break down what position sizing really is, how to calculate it properly, and why using tools like Trade Companion’s Lot Size Calculator can protect your capital while scaling your success.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">1. What Is Position Sizing?</h3>
        <p class="mb-4">Position sizing simply means determining how many lots or units to trade based on your account balance, risk tolerance, and stop-loss distance.</p>
        <p class="mb-4">It answers one critical question: <strong>👉 “How big should my trade be, given how much I’m willing to lose?”</strong></p>
        <p class="mb-4">It’s the balance between risk and opportunity — too small and you stagnate, too big and you implode.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">2. Why Position Sizing Matters</h3>
        <h4 class="text-xl font-semibold mt-4 mb-2">A. Controls Risk Exposure</h4>
        <p class="mb-4">Your position size dictates how much money is on the line. Even if your stop-loss is well placed, risking too much per trade can destroy your account after a few losses.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">B. Builds Long-Term Consistency</h4>
        <p class="mb-4">Consistent position sizing ensures that your account grows smoothly. You can take 10 trades, lose 4, win 6, and still end up profitable — because your winners outweigh your losers in controlled proportions.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">C. Removes Emotional Pressure</h4>
        <p class="mb-4">When you risk a small, defined portion of your account, you can think clearly. No panic, no revenge trades. You’re operating like a professional, not a gambler.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">D. Enables Scaling</h4>
        <p class="mb-4">Proper sizing allows you to scale up safely as your account grows. Risk 1% on $1,000 today, and it’s $10. Risk 1% on $10,000 tomorrow, and it’s $100 — same logic, bigger capital, same peace of mind.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">3. The Position Sizing Formula</h3>
        <p class="mb-4">Here’s the universal formula every trader must know:</p>
        <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-4 text-center">
            <p class="font-semibold mb-2">Position Size (Lots) = </p>
            <p class="font-mono text-sm">(Account Balance × Risk %) / (Stop Loss (pips) × Pip Value)</p>
        </div>
        <p class="mb-4 mt-4">Let’s break it down:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li><strong>Account Balance:</strong> Total equity in your account.</li>
            <li><strong>Risk %:</strong> Usually between 1%–2% per trade.</li>
            <li><strong>Stop Loss (pips):</strong> The distance between your entry and stop-loss level.</li>
            <li><strong>Pip Value:</strong> The dollar value per pip, depending on currency pair and lot size.</li>
        </ul>
        <div class="bg-light-hover p-4 rounded-lg border border-light-gray mt-4">
            <h4 class="text-xl font-semibold mb-2">Example Calculation:</h4>
            <ul class="list-disc list-inside mb-2 pl-4 text-sm">
                <li>Account balance = $5,000</li>
                <li>Risk = 2% → $100</li>
                <li>Stop-loss = 50 pips</li>
                <li>Pip value (for 1 standard lot on EUR/USD) = $10/pip</li>
            </ul>
            <p class="mb-2 p-3 bg-light-surface rounded-md font-mono text-sm">Lot Size = $100 / (50 pips × $10) = 0.20 lots</p>
            <p class="font-semibold text-success">✅ You should trade 0.20 lots to risk exactly 2% of your account.</p>
            <p class="text-sm mt-2">If your stop-loss was tighter (say 25 pips), your lot size would double (0.40 lots). If your stop-loss was wider (say 100 pips), your lot size would halve (0.10 lots).</p>
            <p class="text-sm mt-2">That’s the beauty of position sizing — your risk stays constant, regardless of trade structure.</p>
        </div>
        <h3 class="text-2xl font-semibold mt-6 mb-3">4. The Role of Leverage</h3>
        <p class="mb-4">Leverage amplifies your exposure but not your risk — unless you misuse it.</p>
        <p class="mb-4">For example, with 1:100 leverage, a $1,000 account can control up to $100,000 in position size. That’s powerful — but dangerous if you’re not managing your position size properly.</p>
        <p class="mb-4">Always calculate your lot size before placing a trade. Never let leverage dictate your risk; let your position sizing formula do the work.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">5. The Smart Way – Use Trade Companion’s Lot Size Calculator</h3>
        <p class="mb-4">Manual calculations are useful for understanding the concept, but when it comes to speed, precision, and reliability, technology wins. That’s why I recommend using the Lot Size Calculator built into the Trade Companion platform.</p>
        <p class="mb-4">It’s designed to:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Automatically calculate your exact lot size based on risk percentage.</li>
            <li>Adjust for different account currencies (USD, GBP, NGN, etc.).</li>
            <li>Factor in your stop-loss, pip value, and pair volatility.</li>
            <li>Work seamlessly with your TradingView or MT4/MT5 setups.</li>
        </ul>
        <p class="mb-4">✅ Simply input:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Account balance</li>
            <li>Risk percentage (e.g., 1–2%)</li>
            <li>Stop-loss in pips</li>
            <li>Pair (e.g., XAUUSD, EURUSD, GBPJPY)</li>
        </ul>
        <p class="mb-4">…and the calculator gives you your perfect position size instantly. This eliminates human error and ensures every trade aligns with your risk management system.</p>
        <div class="bg-primary/10 p-4 rounded-lg border border-primary/20 text-center mt-4">
            <p class="font-semibold text-primary">🔗 Try it yourself!</p>
            <p class="text-sm text-dark-text">Use the "Lot Size Calculator" from the main menu for instant, accurate calculations.</p>
        </div>
        <h3 class="text-2xl font-semibold mt-6 mb-3">6. Position Sizing and Risk-Reward Harmony</h3>
        <p class="mb-4">Position sizing works hand-in-hand with your Risk-to-Reward (R:R) ratio.</p>
        <p class="mb-4">If your trade setup has:</p>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>Risk = 50 pips</li>
            <li>Reward = 150 pips</li>
            <li>R:R = 1:3</li>
        </ul>
        <p class="mb-4">Then, with consistent 2% risk per trade, you could lose 3 trades (–6%) and win just 2 (+12%) and still be profitable. Consistency + Controlled Sizing = Compounding Growth.</p>
        <h3 class="text-2xl font-semibold mt-6 mb-3">7. The Professional Trader’s Rulebook</h3>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
            <li>🎯 Never risk more than 2% per trade.</li>
            <li>🎯 Recalculate position size for every trade — conditions change daily.</li>
            <li>🎯 Adjust your size, not your stop-loss. Let the structure dictate your risk.</li>
            <li>🎯 Use tools, not guesswork. Always confirm with a calculator.</li>
            <li>🎯 Preserve capital first. Growth comes later.</li>
        </ul>
        <h3 class="text-2xl font-semibold mt-6 mb-3">8. Conclusion</h3>
        <p class="mb-4">In trading, it’s not the number of trades you take that defines your success — it’s how you manage the size of each one. Position sizing turns a random set of trades into a controlled financial plan.</p>
        <p class="mb-4">With the right sizing discipline, you don’t just survive losing streaks — you outlast 95% of traders who gamble on oversized positions.</p>
        <p class="mb-4">So before your next trade, pause. Don’t just ask, “Where should I enter?” Ask instead, “How much should I risk?”</p>
        <p class="mb-4">Then open your Trade Companion Lot Size Calculator, input your data, and trade with precision, confidence, and control.</p>
      `
    },
    { id: 9, category: "Risk Management", title: "Trading Risk Management Essentials (Book)", summary: "An essential guide to developing a robust risk management plan for consistent trading.", difficulty: "Intermediate", type: "book",
      content: `
        <div class="bg-light-hover p-4 rounded-lg border border-light-gray mb-6">
            <h3 class="text-xl font-semibold mb-3">Table of Contents</h3>
            <ul class="list-disc list-inside space-y-2 pl-4">
                <li>Introduction: The Most Important Book You Will Ever Read on Trading</li>
                <li>Chapter 1: The Cardinal Rule – You Are a Risk Manager First</li>
                <li>Chapter 2: The Core Mathematics of Survival – Position Sizing</li>
                <li>Chapter 3: The Tools of Defense – The Art of the Stop-Loss</li>
                <li>Chapter 4: The Offensive Strategy – Risk/Reward and Expectancy</li>
                <li>Chapter 5: Advanced Risk – Portfolio and Correlation</li>
                <li>Chapter 6: The Unseen Dangers – Systemic and Broker Risk</li>
                <li>Chapter 7: The Final Boss – Psychological Risk</li>
                <li>Conclusion: Risk Is Not the Enemy; It Is the Tool</li>
            </ul>
        </div>
        <h3 class="text-2xl font-semibold mt-6 mb-3">Introduction: The Most Important Book You Will Ever Read on Trading</h3>
        <p class="mb-4">Welcome. If you are reading this, you are likely at the beginning of your trading journey. You have probably consumed dozens of hours of content on strategies, indicators, chart patterns, and "holy grail" systems.</p>
        <p class="mb-4">I am here to tell you that 90% of that is useless without what is in this book.</p>
        <p class="mb-4">Most new traders believe they fail because their analysis is wrong. They believe they need to find a better indicator, a better strategy, or a better guru.</p>
        <p class="mb-4">They are wrong.</p>
        <p class="mb-4">Traders fail for one reason and one reason only: they fail to manage risk. They go out of business. They lose their capital. They blow up their accounts.</p>
        <p class="mb-4">This is not a book about finding winning trades. This is a book about not losing. It is a book about survival. In trading, survival is the only strategy that guarantees an opportunity to win. You can have a mediocre strategy and be wildly profitable if you have world-class risk management. You can have a "perfect" strategy and go broke in a week if you have none.</p>
        <p class="mb-4">This is the most important book you will ever read on trading. Let's build your fortress.</p>
        
        <h3 class="text-2xl font-semibold mt-6 mb-3">Chapter 1: The Cardinal Rule – You Are a Risk Manager First</h3>
        <h4 class="text-xl font-semibold mt-4 mb-2">1.1 The Great Misconception: Trading vs. Analysis</h4>
        <p class="mb-4">Your primary, non-negotiable job is to be a Risk Manager. You are not a Forex Trader. You are a Risk Manager who trades Forex.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">1.2 Your Capital is Your Inventory</h4>
        <p class="mb-4">In trading, your capital is your inventory. It is the single tool you have to do your job. The amateur trader treats their capital like a stack of lottery tickets. The professional trader treats it like the oxygen tank on a deep-sea dive.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">1.3 The House Always Wins: The Casino Analogy</h4>
        <p class="mb-4">The casino makes money because it has a small, statistical edge that plays out over thousands of events. But more importantly, it has impenetrable risk management. You must learn to be the casino.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">1.4 The Goal: Stay in the Game</h4>
        <p class="mb-4">The market will be here tomorrow. The only question is: Will you be? The goal of every single trade is not "to make money." The goal is to survive to trade another day.</p>
        
        <h3 class="text-2xl font-semibold mt-6 mb-3">Chapter 2: The Core Mathematics of Survival – Position Sizing</h3>
        <h4 class="text-xl font-semibold mt-4 mb-2">2.1 The 1% Rule: Your Indestructible Shield</h4>
        <p class="mb-4">You will never, ever risk more than 1% of your total account equity on any single trade. If you have a $10,000 account, the absolute maximum you can lose on one trade is $100.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">2.2 The Compounding Power of Small Losses</h4>
        <div class="overflow-x-auto my-6"><table class="w-full text-left border border-light-gray"><caption class="text-lg font-semibold mb-2 text-dark-text">Account Drawdown vs. Gain Needed to Recover</caption><thead class="bg-light-hover"><tr><th class="p-3 border-b border-light-gray">Account Drawdown</th><th class="p-3 border-b border-light-gray">% Gain Needed to Break Even</th></tr></thead><tbody><tr><td class="p-3 border-b border-light-gray">-10%</td><td class="p-3 border-b border-light-gray">+11.1%</td></tr><tr><td class="p-3 border-b border-light-gray">-20%</td><td class="p-3 border-b border-light-gray">+25.0%</td></tr><tr><td class="p-3 border-b border-light-gray">-30%</td><td class="p-3 border-b border-light-gray">+42.9%</td></tr><tr><td class="p-3 border-b border-light-gray">-40%</td><td class="p-3 border-b border-light-gray">+66.7%</td></tr><tr><td class="p-3 border-b border-light-gray">-50%</td><td class="p-3 border-b border-light-gray">+100.0%</td></tr><tr><td class="p-3 border-b border-light-gray">-75%</td><td class="p-3 border-b border-light-gray">+300.0%</td></tr><tr><td class="p-3 border-b border-light-gray">-90%</td><td class="p-3 border-b border-light-gray">+900.0%</td></tr></tbody></table></div>
        <h4 class="text-xl font-semibold mt-4 mb-2">2.3 The Position Sizing Formula</h4>
        <p class="mb-4">Position Size (Lots) = (Risk in Dollars) / (Stop Loss in Pips * Pip Value per Lot)</p>
        
        <h3 class="text-2xl font-semibold mt-6 mb-3">Chapter 3: The Tools of Defense – The Art of the Stop-Loss</h3>
        <p class="mb-4">A stop-loss is a pre-determined order you place with your broker to close your trade at a specific, losing price.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">3.1 The Myth of the "Mental Stop-Loss"</h4>
        <p class="mb-4">A mental stop is not a stop. It is hope. A hard stop-loss (a real order in the system) removes all emotion.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">3.2 The Chart Stop (The Professional's Stop)</h4>
        <p class="mb-4">Place your stop-loss based on market structure. For a Buy Trade, place your stop just below a recent, valid support level. For a Sell Trade, place it just above a recent resistance.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">3.3 Never, Ever Move Your Stop-Loss (Except in One Direction)</h4>
        <p class="mb-4">The single most destructive act in trading is moving your stop-loss further away from your entry to "give the trade more room." The only exception is moving it in the direction of the trade to lock in profit (a trailing stop).</p>
        
        <h3 class="text-2xl font-semibold mt-6 mb-3">Chapter 4: The Offensive Strategy – Risk/Reward and Expectancy</h3>
        <h4 class="text-xl font-semibold mt-4 mb-2">4.1 The High Win-Rate Trap</h4>
        <p class="mb-4">A high win rate is meaningless if your losses are larger than your wins. Focus on expectancy, not just win rate.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">4.2 Asymmetrical Risk: The 1:2 Minimum</h4>
        <p class="mb-4">The Risk/Reward Ratio (R:R) compares how much you risk to how much you stand to gain. You should never take a trade with less than a 1:2 R:R. With a 1:2 R:R, you only need to be right 34% of the time to be profitable.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">4.3 The "Holy Grail" of Trading: Positive Expectancy</h4>
        <p class="mb-4"><strong>Expectancy = (Win % * Average Win $) – (Loss % * Average Loss $)</strong>. A positive expectancy means your system makes money over the long run.</p>
        
        <h3 class="text-2xl font-semibold mt-6 mb-3">Chapter 5: Advanced Risk – Portfolio and Correlation</h3>
        <p class="mb-4">If you BUY EUR/USD, BUY GBP/USD, and SELL USD/JPY, you have one massive trade: you are short the US Dollar. Understanding correlation is crucial to avoid unintended over-exposure.</p>
        
        <h3 class="text-2xl font-semibold mt-6 mb-3">Chapter 6: The Unseen Dangers – Systemic and Broker Risk</h3>
        <p class="mb-4">Black Swan Events are unpredictable. Your only defense is not being over-leveraged. Your risk management is your only defense against the unknown. Also, ensure your broker is well-regulated and segregates client funds.</p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">Chapter 7: The Final Boss – Psychological Risk</h3>
        <p class="mb-4">You can have a fortress of mathematical rules, but it is all useless if you open the gates and invite the enemy in. You must build rules to protect yourself from yourself.</p>
        <h4 class="text-xl font-semibold mt-4 mb-2">The Four Horsemen of Financial Ruin</h4>
        <ul class="list-disc list-inside mb-4 pl-4 space-y-1">
          <li><strong>Greed</strong> (Overleveraging)</li>
          <li><strong>Fear</strong> (Cutting Winners Short)</li>
          <li><strong>Hope</strong> (Holding Losers)</li>
          <li><strong>Revenge Trading</strong> (Abandoning the Plan)</li>
        </ul>

        <h3 class="text-2xl font-semibold mt-6 mb-3">Conclusion: Risk Is Not the Enemy; It Is the Tool</h3>
        <p class="mb-4">For the professional, risk is the tool. It is the price of admission to opportunity. The entire game of trading is to take on a small, known, managed risk in exchange for a large, potential, asymmetrical reward.</p>
      `
    },
    { id: 10, category: "Using Our Signals", title: "How to Interpret AI Signals", summary: "A step-by-step guide on how to read our AI-generated signals and incorporate them into your strategy.", difficulty: "Beginner", type: "video", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      content: `
        <p class="mb-4">This video provides a walkthrough on interpreting the signals from the AI Signal Dashboard. You will learn about each component of the signal and how to apply it with proper risk management.</p>
      `
    },
    { id: 11, category: "Using Our Signals", title: "Setting Up Your Dashboard for Success", summary: "Learn how to customize your dashboard, set your initial equity, and track your performance effectively.", difficulty: "Beginner", type: "video", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      content: `
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
  activeRole: 'user' | 'mentor';
  handleRoleSwitch: () => void;
}


// --- SETTINGS PAGE & SUB-COMPONENTS (MOVED OUTSIDE DASHBOARD) ---

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
                            <input type="tel" value={telegramInput} onChange={e => setTelegramInput(e.target.value)} placeholder="+1234567890" className="flex-1 bg-light-surface border-light-gray rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary text-dark-text" disabled={isConnecting} />
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

const CTraderSettings: React.FC<{user: User, setUser: React.Dispatch<React.SetStateAction<User | null>>, showToast: (message: string, type?: 'success' | 'info' | 'error') => void;}> = ({user, setUser, showToast}) => {
    const [accountId, setAccountId] = useState(user.cTraderConfig?.accountId || '');
    const [accessToken, setAccessToken] = useState(user.cTraderConfig?.accessToken || '');
    const [isConnecting, setIsConnecting] = useState(false);

    const isConnected = user.cTraderConfig?.isConnected || false;
    const isAutoTradeEnabled = user.cTraderConfig?.autoTradeEnabled || false;
    const isProOrPremium = user.subscribedPlan === PlanName.Pro || user.subscribedPlan === PlanName.Premium;

    const handleConnect = (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountId || !accessToken) {
            showToast("Please provide both Account ID and Access Token.", 'error');
            return;
        }
        setIsConnecting(true);
        // Simulate API call with validation
        setTimeout(() => {
            // Mock validation: real ID format might be different, this is for demonstration
            if (!/^\d{7,8}$/.test(accountId)) { 
                showToast('Invalid cTrader Account ID. Please verify your account number.', 'error');
                setIsConnecting(false);
                return;
            }
            // Mock validation: check for a specific "bad" token or short length
            if (accessToken === 'invalid-token' || accessToken.length < 20) { 
                showToast('Invalid Access Token. Please check your token and try again.', 'error');
                setIsConnecting(false);
                return;
            }

            setUser(prev => prev ? {
                ...prev,
                cTraderConfig: {
                    ...prev.cTraderConfig,
                    accountId,
                    accessToken,
                    isConnected: true,
                }
            } as User : null);
            setIsConnecting(false);
            showToast(`Successfully connected to cTrader account ${accountId}!`, 'success');
        }, 1500);
    };

    const handleDisconnect = () => {
        setUser(prev => prev ? {
            ...prev,
            cTraderConfig: {
                accountId: '',
                accessToken: '',
                isConnected: false,
                autoTradeEnabled: false,
            }
        } : null);
        setAccountId('');
        setAccessToken('');
        showToast("cTrader account disconnected.", 'info');
    };

    const handleToggleAutoTrade = (enabled: boolean) => {
        if (!isConnected) {
            showToast("Please connect to your cTrader account first.", 'error');
            return;
        }
        setUser(prev => prev ? {
            ...prev,
            cTraderConfig: {
                ...prev.cTraderConfig!,
                autoTradeEnabled: enabled,
            }
        } : null);
        showToast(`Auto-trading has been ${enabled ? 'enabled' : 'disabled'}.`, 'info');
    };
    
    if (!isProOrPremium) {
        return (
            <div className="text-center p-8 bg-light-hover rounded-lg border border-light-gray">
                <Icon name="info" className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-bold text-dark-text">Upgrade to Unlock cTrader Auto-Trading</h3>
                <p className="text-mid-text mt-2">To connect your cTrader account and enable automated signal execution, please upgrade to a Pro or Premium plan.</p>
                <button className="mt-4 bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-lg">View Plans</button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold mb-4 text-dark-text">cTrader Account Linking</h2>
                <div className="bg-light-hover p-6 rounded-lg border border-light-gray">
                    {isConnected ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-dark-text">Connected Account: <span className="font-semibold">{user.cTraderConfig?.accountId}</span></p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <p className="text-sm text-mid-text">Status:</p>
                                      <div className="flex items-center gap-1.5 text-sm font-semibold text-success bg-success/10 px-2 py-1 rounded-full">
                                          <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                                          Active
                                      </div>
                                    </div>
                                </div>
                                <button onClick={handleDisconnect} className="bg-danger hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Disconnect</button>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-light-gray">
                                <div>
                                    <p className="font-semibold text-dark-text">Enable AI Auto-Trading</p>
                                    <p className="text-xs text-mid-text">Automatically execute AI signals on your account.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isAutoTradeEnabled} onChange={(e) => handleToggleAutoTrade(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-light-gray rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleConnect} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-text">cTrader Account ID</label>
                                <input type="text" value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="e.g., 1234567" className="mt-1 block w-full bg-light-surface border-light-gray rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary text-dark-text" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-text">cTrader Access Token</label>
                                <input type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="••••••••••••••••" className="mt-1 block w-full bg-light-surface border-light-gray rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary text-dark-text" />
                            </div>
                            <button type="submit" disabled={isConnecting} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:bg-light-gray">
                                {isConnecting ? 'Connecting...' : 'Connect to cTrader'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
            
            <div className="text-sm text-mid-text space-y-2 prose prose-sm max-w-none bg-light-hover p-4 rounded-lg border border-light-gray">
                <h4 className="font-semibold text-dark-text">How to link your cTrader account:</h4>
                <ol className="list-decimal pl-5">
                    <li>Log in to your cTrader account settings on their official website.</li>
                    <li>Navigate to the 'API' or 'FIX API' section to generate an Access Token with 'Trade' permissions.</li>
                    <li>Enter your cTrader Account ID and the generated Access Token in the fields above.</li>
                    <li>Click "Connect". Once connected, you can enable auto-trading to have AI signals executed directly on your account.</li>
                </ol>
                <p className="text-xs text-danger font-semibold">Note: Your credentials are encrypted and stored securely. Never share your Access Token with anyone.</p>
            </div>
        </div>
    );
};


const SettingsPage: React.FC<{user: User, setUser: React.Dispatch<React.SetStateAction<User | null>>, showToast: (message: string, type?: 'success' | 'info' | 'error') => void}> = ({ user, setUser, showToast }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'notifications' | 'ctrader'>('profile');

    const TabButton: React.FC<{tabName: 'profile' | 'billing' | 'notifications' | 'ctrader', label: string}> = ({tabName, label}) => (
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
                        <TabButton tabName="ctrader" label="cTrader Linking" />
                    </div>
                </aside>
                <main className="flex-1 bg-light-surface p-8 rounded-lg shadow-sm border border-light-gray">
                    {activeTab === 'profile' && <ProfileSettings user={user} setUser={setUser} showToast={showToast} />}
                    {activeTab === 'billing' && <BillingSettings user={user} />}
                    {activeTab === 'notifications' && <NotificationSettings user={user} setUser={setUser} showToast={showToast} />}
                    {activeTab === 'ctrader' && <CTraderSettings user={user} setUser={setUser} showToast={showToast} />}
                </main>
            </div>
        </div>
    );
};


// --- MAIN DASHBOARD COMPONENT ---

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, setUser, onLogout, activeView, onViewChange, showToast, theme, toggleTheme, activeRole, handleRoleSwitch }) => {
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

                if (user.cTraderConfig?.isConnected && user.cTraderConfig?.autoTradeEnabled) {
                    showToast(`Signal for ${newTrade.instrument} sent to cTrader for execution.`, 'success');
                    // In a real app, an API call to a backend service would be made here.
                }
            }
        }
      } catch (error) {
        console.error("Error during signal scan:", error);
      }
    }, 900000); // Scan every 15 minutes

    return () => clearInterval(scannerInterval);
  }, [activeView, user, canUseFeature, incrementUsage, showToast, activeTrades, EQUITY_KEY, addNotification]);


  // --- Live Trade Monitoring ---
  useEffect(() => {
    const monitorInterval = setInterval(async () => {
        if (activeTrades.length === 0) return;

        const uniqueInstruments = [...new Set(activeTrades.map(t => t.instrument))];
        const livePrices = await getLivePrices(uniqueInstruments);

        const closedTradeItems: { trade: TradeRecord, outcome: 'win' | 'loss', exitPrice: number }[] = [];
        
        activeTrades.forEach(trade => {
            const priceData = livePrices[trade.instrument];
            if (!priceData || priceData.price === null) return;
            
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
            const newActiveTrades = activeTrades.filter(t => !closedTradeIds.has(t.id));

            let currentEquity = parseFloat(localStorage.getItem(EQUITY_KEY) || '10000');
            const newHistoryItems: TradeRecord[] = [];

            closedTradeItems.forEach(item => {
                const { trade, outcome, exitPrice } = item;
                const instrumentProps = instrumentDefinitions[trade.instrument];
                const contractSize = instrumentProps?.contractSize || 100000;
                const lotSize = trade.lotSize || 0;
                const units = lotSize * contractSize;
                
                const priceDifference = exitPrice - trade.entryPrice;
                const pnl = (trade.type === 'BUY' ? 1 : -1) * priceDifference * units;

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
            window.dispatchEvent(new Event('storage'));
        }

    }, 30000); // Check every 30 seconds

    return () => clearInterval(monitorInterval);
  }, [activeTrades, showToast, EQUITY_KEY]);


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
            data.push({ name: `T${index + 1}`, equity: parseFloat(cumulativeEquity.toFixed(2)) });
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
                <div onClick={() => onViewChange('analytics')} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard 
                        title="Current Equity" 
                        value={`$${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                        percentage={`${profitType === 'gain' ? '+' : ''}${profitPercentage}% Total`} 
                        percentageType={profitType} 
                        icon={<Icon name="signals" className="w-5 h-5" />} 
                    />
                </div>
                <div onClick={() => onViewChange('analytics')} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard 
                        title="AI Signal Win Rate" 
                        value={`${winRate}%`} 
                        percentage={`${totalTrades} Trades`} 
                        percentageType={parseFloat(winRate) >= 50 ? 'gain' : 'loss'} 
                        icon={<Icon name="check" className="w-5 h-5" />} 
                    />
                </div>
                <div onClick={() => onViewChange('analytics')} className="cursor-pointer transition-transform transform hover:scale-105">
                    <StatCard 
                        title="Total Profit/Loss" 
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
                                {/* FIX: The domain prop's callback from the charting library can receive non-numeric values, causing a type error on arithmetic operations. This is fixed by explicitly casting values to Number before calculation. */}
                                <YAxis axisLine={false} tickLine={false} stroke="var(--color-text-mid)" domain={[(dataMin: any) => (Number(dataMin) * 0.99), (dataMax: any) => (Number(dataMax) * 1.01)]} tickFormatter={(value) => `$${Number(value).toFixed(0)}`} />
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
                 {payload[0].payload.trades !== undefined && <p className="text-xs text-mid-text mt-1">Trades: {payload[0].payload.trades}</p>}
                 {payload[0].payload.equity !== undefined && <p className="text-xs text-mid-text mt-1">Equity: {payload[0].payload.equity.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>}
            </div>
        );
    }
    return null;
};

const AnalyticsPage: React.FC<{ user: User }> = ({ user }) => {
    const TRADE_HISTORY_KEY = `trade_history_${user.email}`;
    const EQUITY_KEY = `currentEquity_${user.email}`;
    const INITIAL_EQUITY_KEY = `initialEquity_${user.email}`;
    const PIE_COLORS = ['#6366F1', '#A78BFA', '#60A5FA', '#34D399', '#FB7185', '#FBBF24'];

    const [tradeHistory] = useState<TradeRecord[]>(() => JSON.parse(localStorage.getItem(TRADE_HISTORY_KEY) || '[]'));
    const [currentEquity] = useState<number>(() => parseFloat(localStorage.getItem(EQUITY_KEY) || '10000'));
    const [initialEquity] = useState<number>(() => parseFloat(localStorage.getItem(INITIAL_EQUITY_KEY) || '10000'));
    
    const analyticsData = useMemo(() => {
        const closedTrades = tradeHistory.filter(t => t.status !== 'active').sort((a,b) => new Date(a.dateClosed!).getTime() - new Date(b.dateClosed!).getTime());
        
        const equityData = [{ name: 'Start', equity: initialEquity }];
        let cumulativeEquity = initialEquity;
        closedTrades.forEach((trade, index) => {
            cumulativeEquity += trade.pnl || 0;
            equityData.push({ name: `T${index + 1}`, equity: parseFloat(cumulativeEquity.toFixed(2)) });
        });

        const totalPnl = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
        
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
    }, [tradeHistory, initialEquity]);

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
                    const percentage = analyticsData.instrumentDistributionData[index].total > 0
                        ? ((entry.payload.value / analyticsData.instrumentDistributionData[index].total) * 100).toFixed(0)
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

    return (
         <div className="p-4 md:p-8 bg-light-bg min-h-full font-sans">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-dark-text">Analytics Overview</h1>
                <p className="text-mid-text">Your comprehensive trading performance dashboard.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                    <p className="text-sm text-mid-text">Current Equity</p>
                    <p className="text-3xl font-bold text-dark-text">{currentEquity.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
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
                            {/* FIX: The domain prop's callback from the charting library can receive non-numeric values, causing a type error on arithmetic operations. This is fixed by explicitly casting values to a number before calculation. */}
                            <YAxis stroke="var(--color-text-mid)" tick={{ fontSize: 12 }} tickFormatter={(val: any) => `$${(Number(val)/1000).toFixed(1)}k`} domain={[(dataMin: any) => Number(dataMin) * 0.95, (dataMax: any) => Number(dataMax) * 1.05]}/>
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
                                <Pie data={analyticsData.instrumentDistributionData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={60} outerRadius={85} paddingAngle={2}>
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

const EducationContentPage: React.FC<{ article: EducationArticle; onBack: () => void }> = ({ article, onBack }) => (
    <div className="p-8 bg-light-bg min-h-screen">
        <button onClick={onBack} className="flex items-center text-primary hover:underline mb-6 font-semibold no-print">
            <Icon name="arrowRight" className="w-5 h-5 mr-2 transform rotate-180" />
            Back to Education Hub
        </button>
        <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray max-w-3xl mx-auto">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${article.difficulty === 'Beginner' ? 'text-success bg-success/10' : article.difficulty === 'Intermediate' ? 'text-warning bg-warning/10' : 'text-danger bg-danger/10'}`}>
                {article.difficulty}
            </span>
            <h1 className="text-3xl font-bold mt-3 mb-4 text-dark-text">{article.title}</h1>

            <SecureContent>
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
            </SecureContent>
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
                        <button onClick={() => setStage('challenge')} className="w