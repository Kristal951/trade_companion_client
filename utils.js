import axios from "axios";

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];
let accessToken = null;

export const getAccessToken = () => {
  return accessToken || localStorage.getItem("accessToken");
};

export const refreshAccessToken = async () => {
  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/user/refresh_token`,
    {},
    { withCredentials: true },
  );

  const newAccessToken = res.data.accessToken;
  setAccessToken(newAccessToken);
  return newAccessToken;
};

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

export const setAccessToken = (token) => {
  accessToken = token;

  if (token) {
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common.Authorization;
  }
};

export const getValidAccessToken = async () => {
  let token = getAccessToken();

  if (!token) {
    try {
      token = await refreshAccessToken();
    } catch (error) {
      setAccessToken(null);
      throw error;
    }
  }

  return token;
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || !error.response) {
      return Promise.reject(error);
    }

    const AUTH_ROUTES = [
      "/api/user/login",
      "/api/user/register",
      "/api/user/signin",
      "/api/user/logout",
      "/api/user/refresh_token",
      "/api/user/verify_email",
      "/api/user/resend_verification_code",
    ];

    if (AUTH_ROUTES.some((r) => originalRequest.url?.endsWith(r))) {
      return Promise.reject(error);
    }

    const hasAccessToken =
      !!getAccessToken() || !!originalRequest.headers?.Authorization;

    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      hasAccessToken
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const res = await axios.post(
          "http://localhost:5000/api/user/refresh_token",
          {},
          { withCredentials: true },
        );

        const newAccessToken = res.data.accessToken;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return API(originalRequest);
      } catch (err) {
        processQueue(err);
        setAccessToken(null);

        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/auth")
        ) {
          window.location.replace("/auth/signin");
        }

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const updateUserAPI = (email, updates) => {
  return API.put("/api/user/update", { email, updates });
};

export const MOCK_MENTOR_POSTS = [
  {
    id: 1,
    type: "signal",
    title: "EUR/USD Long Opportunity",
    content:
      "Price has pulled back to a key support level and formed a bullish engulfing candle on the 4H chart. Looking for a move higher towards the previous resistance.",
    timestamp: "2023-10-27T14:00:00Z",
    signalDetails: {
      instrument: "EUR/USD",
      direction: "BUY",
      entry: "1.0760",
      stopLoss: "1.0730",
      takeProfit: "1.0820",
    },
  },
  {
    id: 2,
    type: "analysis",
    title: "Weekly Market Outlook",
    content:
      "This week, I am watching the FOMC meeting on Wednesday. Expect volatility in USD pairs. The DXY is approaching a major resistance zone, a rejection could see a relief rally in majors like EUR/USD and GBP/USD.",
    timestamp: "2023-10-26T09:00:00Z",
  },
  {
    id: 3,
    type: "analysis",
    title: "Risk Management Tip",
    content:
      "Never risk more than 1-2% of your account on a single trade. Consistency in risk is key to long-term survival and profitability in the markets. Stay disciplined!",
    timestamp: "2023-10-25T11:00:00Z",
  },
];

export const MOCK_SUBSCRIBER_GROWTH_JOHN = [
  { month: "Jan", subscribers: 10 },
  { month: "Feb", subscribers: 15 },
  { month: "Mar", subscribers: 22 },
  { month: "Apr", subscribers: 28 },
  { month: "May", subscribers: 35 },
  { month: "Jun", subscribers: 42 },
];

export const MOCK_RECENT_SIGNALS_JOHN = [
  {
    id: "s1",
    instrument: "EUR/USD",
    direction: "BUY",
    entry: "1.0750",
    stopLoss: "1.0720",
    takeProfit: "1.0800",
    outcome: "win",
    timestamp: "2023-10-26T10:00:00Z",
    pnl: 500,
  },
  {
    id: "s2",
    instrument: "GBP/JPY",
    direction: "SELL",
    entry: "185.50",
    stopLoss: "186.00",
    takeProfit: "184.50",
    outcome: "win",
    timestamp: "2023-10-25T15:00:00Z",
    pnl: 680,
  },
  {
    id: "s3",
    instrument: "USD/CAD",
    direction: "BUY",
    entry: "1.3600",
    stopLoss: "1.3570",
    takeProfit: "1.3620",
    outcome: "loss",
    timestamp: "2023-10-24T08:00:00Z",
    pnl: -220,
  },
];

export const MOCK_MENTOR_ANALYTICS = {
  earningsData: [
    { month: "Jan", earnings: 1485 },
    { month: "Feb", earnings: 1782 },
    { month: "Mar", earnings: 2178 },
    { month: "Apr", earnings: 2772 },
    { month: "May", earnings: 3465 },
    { month: "Jun", earnings: 4158 },
  ],
  subscriberData: [
    { month: "Jan", new: 5, churned: -1 },
    { month: "Feb", new: 7, churned: -2 },
    { month: "Mar", new: 8, churned: -1 },
    { month: "Apr", new: 10, churned: -3 },
    { month: "May", new: 12, churned: -2 },
    { month: "Jun", new: 15, churned: -4 },
  ],
  ratingDistribution: [
    { rating: 5, count: 85 },
    { rating: 4, count: 32 },
    { rating: 3, count: 5 },
    { rating: 2, count: 1 },
    { rating: 1, count: 1 },
  ],
  topSignals: MOCK_RECENT_SIGNALS_JOHN.filter((s) => s.outcome === "win")
    .sort((a, b) => (b.pnl || 0) - (a.pnl || 0))
    .slice(0, 3),
};

const MOCK_RECENT_SIGNALS_ANNA = [
  {
    id: "s4",
    instrument: "XAU/USD",
    direction: "SELL",
    entry: "2350.00",
    stopLoss: "2360.00",
    takeProfit: "2320.00",
    outcome: "win",
    timestamp: "2023-10-27T11:00:00Z",
    pnl: 3000,
  },
  {
    id: "s5",
    instrument: "US30",
    direction: "BUY",
    entry: "39000",
    stopLoss: "38900",
    takeProfit: "39200",
    outcome: "win",
    timestamp: "2023-10-26T18:00:00Z",
    pnl: 2000,
  },
];

const MOCK_SUBSCRIBER_GROWTH_ANNA = [
  { month: "Jan", subscribers: 25 },
  { month: "Feb", subscribers: 30 },
  { month: "Mar", subscribers: 45 },
  { month: "Apr", subscribers: 55 },
  { month: "May", subscribers: 70 },
  { month: "Jun", subscribers: 88 },
];

// export const MOCK_MENTOR_ANALYTICS = {
//   earningsData: [
//     { month: "Jan", earnings: 1485 },
//     { month: "Feb", earnings: 1782 },
//     { month: "Mar", earnings: 2178 },
//     { month: "Apr", earnings: 2772 },
//     { month: "May", earnings: 3465 },
//     { month: "Jun", earnings: 4158 },
//   ],
//   subscriberData: [
//     { month: "Jan", new: 5, churned: -1 },
//     { month: "Feb", new: 7, churned: -2 },
//     { month: "Mar", new: 8, churned: -1 },
//     { month: "Apr", new: 10, churned: -3 },
//     { month: "May", new: 12, churned: -2 },
//     { month: "Jun", new: 15, churned: -4 },
//   ],
//   ratingDistribution: [
//     { rating: 5, count: 85 },
//     { rating: 4, count: 32 },
//     { rating: 3, count: 5 },
//     { rating: 2, count: 1 },
//     { rating: 1, count: 1 },
//   ],
//   topSignals: MOCK_RECENT_SIGNALS_JOHN.filter((s) => s.outcome === "win")
//     .sort((a, b) => (b.pnl || 0) - (a.pnl || 0))
//     .slice(0, 3),
// };

export const MOCK_MENTORS_LIST = [
  {
    id: 1,
    name: "John Forex",
    avatar: "https://picsum.photos/seed/mentor1/200",
    experience: 10,
    profitRatio: 85,
    roi: 12.5,
    instruments: ["EUR/USD", "GBP/JPY", "USD/CAD"],
    price: 99,
    strategy:
      "Specializing in high-frequency scalping strategies and market psychology based on order flow.",
    posts: MOCK_MENTOR_POSTS,
    certifications: [
      { name: "Pro Trader Certification", url: "#" },
      { name: "MyFxBook Verified History", url: "#" },
    ],
    recentSignals: MOCK_RECENT_SIGNALS_JOHN,
    subscriberGrowth: MOCK_SUBSCRIBER_GROWTH_JOHN,
    rating: 4.8,
    reviewsCount: 124,
    analytics: MOCK_MENTOR_ANALYTICS,
  },
  {
    id: 2,
    name: "Anna Indicators",
    avatar: "https://picsum.photos/seed/mentor2/200",
    experience: 8,
    profitRatio: 92,
    roi: 18.2,
    instruments: ["XAU/USD", "US30", "NASDAQ"],
    price: 149,
    strategy:
      "Master of technical analysis using custom-developed indicators and algorithmic trading systems.",
    posts: [],
    certifications: [{ name: "Funded Prop Firm Payout", url: "#" }],
    recentSignals: MOCK_RECENT_SIGNALS_ANNA,
    subscriberGrowth: MOCK_SUBSCRIBER_GROWTH_ANNA,
    rating: 4.9,
    reviewsCount: 98,
  },
  {
    id: 3,
    name: "Mike Waves",
    avatar: "https://picsum.photos/seed/mentor3/200",
    experience: 12,
    profitRatio: 88,
    roi: 28.0,
    instruments: ["BTC/USD", "ETH/USD"],
    price: 129,
    strategy:
      "Expert in Elliot Wave theory and harmonic patterns, primarily focusing on the cryptocurrency markets.",
    posts: [],
    recentSignals: [],
    subscriberGrowth: [],
    rating: 4.7,
    reviewsCount: 75,
  },
  {
    id: 4,
    name: "Sarah Trends",
    avatar: "https://picsum.photos/seed/mentor4/200",
    experience: 7,
    profitRatio: 90,
    roi: 29.8,
    instruments: ["NASDAQ", "OIL", "SPX500"],
    price: 119,
    strategy:
      "Trend-following expert with a focus on macroeconomic analysis and long-term position trades.",
    posts: [],
    certifications: [{ name: "Certified Market Technician (CMT)", url: "#" }],
    recentSignals: [],
    subscriberGrowth: [],
    rating: 4.8,
    reviewsCount: 56,
  },
];

export const MOCK_EDUCATION_ARTICLES = [
  {
    id: 1,
    category: "Forex Basics",
    title: "What is Forex Trading? (Masterclass)",
    summary:
      "A comprehensive deep-dive into the foreign exchange market. Learn the history, the players, and the mechanics of the world's largest financial market.",
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
        `,
  },
  {
    id: 2,
    category: "Forex Basics",
    title: "Understanding Pips, Lots, and Leverage",
    summary:
      "The math of trading explained. Master the concepts of Pip value calculation, Lot sizing, and the double-edged sword of Leverage.",
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
        `,
  },
  {
    id: 7,
    category: "Forex Basics",
    title: "Forex Trading for Dummies: A Beginner's Guide",
    summary:
      "The ultimate handbook for the aspiring trader. From setting up your first chart to executing advanced strategies.",
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
        `,
  },
  {
    id: 3,
    category: "Technical Analysis",
    title: "Mastering Support and Resistance",
    summary:
      "Identify key price levels on charts to make better entry and exit decisions.",
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
        `,
  },
  {
    id: 4,
    category: "Technical Analysis",
    title: "A Guide to Candlestick Patterns",
    summary:
      "Recognize common candlestick patterns to predict future market movements.",
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
        `,
  },
  {
    id: 8,
    category: "Technical Analysis",
    title: "Japanese Candlestick Charting Techniques (Book)",
    summary:
      "Steve Nison's classic guide to understanding and using candlestick patterns for market analysis.",
    difficulty: "Advanced",
    type: "book",
    content: "Full content here...",
  },
  {
    id: 5,
    category: "Risk Management",
    title: "The Importance of Stop-Loss Orders",
    summary:
      "Protect your capital by learning how to properly set and manage stop-loss orders.",
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
        `,
  },
  {
    id: 6,
    category: "Risk Management",
    title: "Position Sizing for Success",
    summary:
      "Calculate the optimal position size for any trade to manage risk effectively.",
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
        `,
  },
  {
    id: 9,
    category: "Risk Management",
    title: "Trading Risk Management Essentials (Book)",
    summary:
      "An essential guide to developing a robust risk management plan for consistent trading.",
    difficulty: "Intermediate",
    type: "book",
    content: "Full content here...",
  },
  {
    id: 10,
    category: "Using Our Signals",
    title: "How to Interpret AI Signals",
    summary:
      "A step-by-step guide on how to read our AI-generated signals and incorporate them into your strategy.",
    difficulty: "Beginner",
    type: "video",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    content: "Full content here...",
  },
  {
    id: 11,
    category: "Using Our Signals",
    title: "Setting Up Your Dashboard for Success",
    summary:
      "Learn how to customize your dashboard, set your initial equity, and track your performance effectively.",
    difficulty: "Beginner",
    type: "video",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    content: "Full content here...",
  },
];
