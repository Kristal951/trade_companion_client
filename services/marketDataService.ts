import { TopSignal } from "@/types";
import { instrumentDefinitions } from "../config/instruments";

const keysRaw = import.meta.env.VITE_TWELVE_DATA_KEYS || "";
const TWELVE_DATA_KEYS = keysRaw.split(",").map((key) => key.trim());

let tdKeyIndex = 0;

const getNextTwelveDataKey = () => {
  // Safety check in case the env didn't load
  if (TWELVE_DATA_KEYS.length === 0 || TWELVE_DATA_KEYS[0] === "") {
    console.error("No TwelveData API keys found in environment variables.");
    return "";
  }

  const key = TWELVE_DATA_KEYS[tdKeyIndex];

  // Cycle to next index
  tdKeyIndex = (tdKeyIndex + 1) % TWELVE_DATA_KEYS.length;

  return key;
};

const forexAPIs = [
  {
    name: "Twelvedata",
    id: "twelvedata",
    url: (symbol: string) =>
      `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${getNextTwelveDataKey()}`,
    parser: (data: any) => (data?.price ? parseFloat(data.price) : null),
  },
  {
    name: "Alpha Vantage",
    id: "alphavantage",
    url: (symbol: string) => {
      const [from, to] = symbol.split("/");
      const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_KEY || "demo";

      return `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`;
    },
    parser: (data: any) => {
      const rate =
        data?.["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"];
      return rate ? parseFloat(rate) : null;
    },
  },
];

interface PriceResult {
  price: number | null;
  isMock: boolean;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketContext {
  instrument: string;
  currentPrice: number;
  isDataReal: boolean;
  candles: Candle[];
  trend: "UP" | "DOWN" | "SIDEWAYS" | "UNKNOWN";
  details?: string;
}

const generateSyntheticHistory = (
  currentPrice: number,
  count: number,
  volatilityPips: number = 10,
  pipSize: number = 0.0001,
): Candle[] => {
  const candles: Candle[] = [];
  let open = currentPrice;

  for (let i = 0; i < count; i++) {
    const time = new Date(Date.now() - i * 15 * 60 * 1000).toISOString(); // 15 min candles

    // Random walk logic
    const change = (Math.random() - 0.5) * volatilityPips * pipSize * 5;
    const close = open;
    const prevOpen = close - change;

    const high =
      Math.max(prevOpen, close) + Math.random() * volatilityPips * pipSize;
    const low =
      Math.min(prevOpen, close) - Math.random() * volatilityPips * pipSize;

    candles.unshift({
      time,
      open: parseFloat(prevOpen.toFixed(5)),
      high: parseFloat(high.toFixed(5)),
      low: parseFloat(low.toFixed(5)),
      close: parseFloat(close.toFixed(5)),
      volume: Math.floor(Math.random() * 1000),
    });

    open = prevOpen;
  }
  return candles;
};

// --- DERIV WEBSOCKET SERVICE ---
const DERIV_WS_URL = "wss://ws.binaryws.com/websockets/v3?app_id=1089";

const getDerivMarketData = (
  symbol: string,
  count: number = 50,
): Promise<MarketContext> => {
  return new Promise((resolve) => {
    const ws = new WebSocket(DERIV_WS_URL);
    let isResolved = false;

    // Increased timeout to 10 seconds for robustness
    const timeout = setTimeout(() => {
      if (!isResolved) {
        console.warn(`Deriv WS timeout for ${symbol}. Using fallback.`);
        isResolved = true;
        if (ws.readyState === WebSocket.OPEN) ws.close();
        resolve({
          instrument: symbol,
          currentPrice: 0,
          isDataReal: false,
          candles: [],
          trend: "UNKNOWN",
        });
      }
    }, 10000);

    ws.onopen = () => {
      // Fetch candles (M15 granularity = 900s)
      ws.send(
        JSON.stringify({
          ticks_history: symbol,
          adjust_start_time: 1,
          count: count,
          end: "latest",
          style: "candles",
          granularity: 900,
        }),
      );
    };

    ws.onmessage = (msg) => {
      if (isResolved) return;

      try {
        const data = JSON.parse(msg.data);

        if (data.error) {
          console.warn(`Deriv API Error for ${symbol}:`, data.error.message);
          isResolved = true;
          resolve({
            instrument: symbol,
            currentPrice: 0,
            isDataReal: false,
            candles: [],
            trend: "UNKNOWN",
          });
          ws.close();
          return;
        }

        if (data.candles) {
          const candles = data.candles.map((c: any) => ({
            time: new Date(c.epoch * 1000).toISOString(),
            open: parseFloat(c.open),
            high: parseFloat(c.high),
            low: parseFloat(c.low),
            close: parseFloat(c.close),
            volume: 0,
          }));

          const currentPrice = candles[candles.length - 1].close;

          // Improved Trend Calculation
          const len = candles.length;
          // Use longer periods if we have more data
          const shortPeriod = Math.min(len, 10);
          const longPeriod = Math.min(len, 50);

          const shortMA =
            candles
              .slice(len - shortPeriod)
              .reduce((a: number, c: any) => a + c.close, 0) / shortPeriod;
          const longMA =
            candles
              .slice(len - longPeriod)
              .reduce((a: number, c: any) => a + c.close, 0) / longPeriod;

          let trend: "UP" | "DOWN" | "SIDEWAYS" = "SIDEWAYS";
          if (shortMA > longMA * 1.0005) trend = "UP";
          else if (shortMA < longMA * 0.9995) trend = "DOWN";

          // Structure details
          const details = `Live Data (Deriv): Price ${currentPrice}. M15 Trend: ${trend}. ${longPeriod}-SMA: ${longMA.toFixed(2)}.`;

          clearTimeout(timeout);
          isResolved = true;
          resolve({
            instrument: symbol,
            currentPrice,
            isDataReal: true,
            candles,
            trend,
            details,
          });
          ws.close();
        }
      } catch (e) {
        console.error("Error parsing Deriv message", e);
      }
    };

    ws.onerror = () => {
      if (!isResolved) {
        clearTimeout(timeout);
        isResolved = true;
        resolve({
          instrument: symbol,
          currentPrice: 0,
          isDataReal: false,
          candles: [],
          trend: "UNKNOWN",
        });
      }
    };
  });
};

export const getLivePrice = async (
  instrument: string,
): Promise<PriceResult> => {
  const instrumentData = instrumentDefinitions[instrument];
  if (!instrumentData) return { price: null, isMock: true };

  if (instrumentData.isDeriv) {
    const ctx = await getDerivMarketData(instrumentData.symbol, 1);
    if (ctx.isDataReal) {
      return { price: ctx.currentPrice, isMock: false };
    }
    return { price: instrumentData.mockPrice, isMock: true };
  }

  for (const api of forexAPIs) {
    if (api.id === "alphavantage" && !instrumentData.isForex) continue;
    try {
      const response = await fetch(api.url(instrumentData.symbol));
      if (!response.ok) continue;
      const data = await response.json();
      const parsedPrice = api.parser(data);

      if (parsedPrice && !isNaN(parsedPrice)) {
        return { price: parsedPrice, isMock: false };
      }
    } catch (error) {
      console.warn(
        `Error fetching price from ${api.name} for ${instrument}:`,
        error,
      );
    }
  }

  console.warn(`All APIs failed for ${instrument}. Using mock price.`);
  return { price: instrumentData.mockPrice, isMock: true };
};

export const getLivePrices = async (
  instruments: string[],
): Promise<Record<string, PriceResult>> => {
  const prices: Record<string, PriceResult> = {};
  const pricePromises = instruments.map((instrument) =>
    getLivePrice(instrument).then((result) => ({ instrument, ...result })),
  );

  const results = await Promise.all(pricePromises);
  for (const result of results) {
    prices[result.instrument] = { price: result.price, isMock: result.isMock };
  }
  return prices;
};

// Updated signature to accept depth
export const fetchMarketContext = async (
  instrument: string,
  depth: number = 50,
): Promise<MarketContext> => {
  const instrumentData = instrumentDefinitions[instrument];

  if (instrumentData && instrumentData.isDeriv) {
    const derivContext = await getDerivMarketData(instrumentData.symbol, depth);
    if (!derivContext.isDataReal) {
      return {
        instrument,
        currentPrice: instrumentData.mockPrice,
        isDataReal: false,
        candles: generateSyntheticHistory(
          instrumentData.mockPrice,
          depth,
          20,
          instrumentData.pipStep,
        ),
        trend: "UNKNOWN",
        details: "Connection to Deriv failed. Using synthetic data.",
      };
    }
    return { ...derivContext, instrument };
  }

  const { price, isMock } = await getLivePrice(instrument);
  const currentPrice = price || (instrumentData ? instrumentData.mockPrice : 0);
  const pipStep = instrumentData ? instrumentData.pipStep : 0.0001;

  // For Forex/Crypto, since we only get price, we generate synthetic history
  // to satisfy the AI's data requirement if depth is requested.
  const candles = generateSyntheticHistory(currentPrice, depth, 15, pipStep);

  return {
    instrument,
    currentPrice,
    isDataReal: !isMock,
    candles: candles,
    trend: "UNKNOWN", // Will be calculated by consumer if needed
    details: isMock
      ? "Using Placeholder Data. Verify with Search."
      : "Live API Price.",
  };
};

export const fetchTopPerformer = async (): Promise<TopSignal> => {
  // 1. Get a random date within last 3 days to simulate "Previous Top Pick" or "Best recent trade"
  // Using a seeded random based on today's date to keep it consistent for the day.
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  let seed = todayStr
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const daysAgo = Math.floor(random() * 3) + 1; // 1 to 3 days ago
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  // 3. Pool of high-volatility instruments likely to be top performers
  const instruments = [
    { name: "XAU/USD", basePrice: 2300, spread: 25 }, // Gold usually has big moves
    { name: "BTC/USD", basePrice: 65000, spread: 1500 }, // Bitcoin
    { name: "US500", basePrice: 5200, spread: 60 }, // S&P 500 (US500 in definitions)
    { name: "GBP/JPY", basePrice: 190, spread: 1.5 }, // Guppy
    { name: "US100", basePrice: 18000, spread: 250 }, // Nasdaq (US100 in definitions)
  ];

  // 4. Select instrument deterministically
  const selectedInst = instruments[Math.floor(random() * instruments.length)];
  const direction = random() > 0.5 ? "BUY" : "SELL";

  // 5. Generate Profit (between $800 and $2,500 for a standard lot equivalent)
  const profitUSD = Math.floor(800 + random() * 1700);

  // 6. Calculate Prices based on profit
  // Profit = (Exit - Entry) * ContractSize * Lots
  // Simplified: We just set realistic price distance

  let entryPrice = selectedInst.basePrice + random() * selectedInst.spread;
  // Adjust entry slightly to look "clean"
  if (selectedInst.name.includes("JPY") || selectedInst.name.includes("USD")) {
    entryPrice = parseFloat(entryPrice.toFixed(2));
  } else {
    entryPrice = parseFloat(entryPrice.toFixed(4));
  }

  // Determine exit based on profit.
  // Standard Lot (1.0) approx $10/pip for FX, $1/point for Indices/Crypto usually scaled.
  // For visual simplicity on the landing page, we calculate the move magnitude relative to price.
  // Approx 0.5% to 1.5% move for a big win.
  const movePercent = (0.5 + random()) / 100;
  const moveAmount = entryPrice * movePercent;

  let exitPrice =
    direction === "BUY" ? entryPrice + moveAmount : entryPrice - moveAmount;

  // Formatting
  if (
    selectedInst.name.includes("JPY") ||
    selectedInst.name === "XAU/USD" ||
    selectedInst.name === "US500" ||
    selectedInst.name === "US100"
  ) {
    exitPrice = parseFloat(exitPrice.toFixed(2));
  } else if (selectedInst.name === "BTC/USD") {
    exitPrice = parseFloat(exitPrice.toFixed(0));
  } else {
    exitPrice = parseFloat(exitPrice.toFixed(5));
  }

  const hour = 8 + Math.floor(random() * 10);
  const minute = Math.floor(random() * 60);
  date.setHours(hour, minute, 0, 0);

  const def = instrumentDefinitions[selectedInst.name];
  const pipStep = def ? def.pipStep : 0.0001;
  const pips = Math.abs(exitPrice - entryPrice) / pipStep;

  return {
    instrument: selectedInst.name,
    type: direction,
    entryPrice,
    exitPrice,
    profit: profitUSD,
    pips: Math.round(pips),
    timestamp: date.toISOString(),
  };
};
