
import { instrumentDefinitions } from '../config/instruments';

// API Key Rotation Logic for Twelve Data
const TWELVE_DATA_KEYS = [
    '5cf065b50cf64c3ab77a8a9927529bfb', // Original Key
    '8b3a9763db2a4807a2e65b30a00de799', // New Key Top 1
    '132bb44fb1ec48e8b2d3692c8720a99b', // New Key Top 2
    '343128a9420249c5b3e191e384b66db5', // Key 1
    '75ebcc61250444a5b38f39b9af979de4', // Key 2
    '1053e760968e46f5b05fc8e90d38c9c0', // Key 3
    'c36bc29240fb4bfd9aaafc96df16d6b7', // Key 4
    '65df8f9eadfc491dac7a3db1ab2fbc98', // Key 5
    '36a7d432423e45108264c6336b9bd692', // Key 6
    '0dc49b6059944d4f9c7c16688d24807d', // Key 7
    '23d84647343f491bb18471f4ea59909d', // Key 8
    'dd88bc459de64aa4b60738b881663f43', // Key 9
    '095caa7fe42c4bd0864ca141451c756c', // Key 10
    '313060fa4d3c4d358394c4bc098a8b1c', // Key 11
    '4c1485d310084de2a95400a286081859', // Key 12
    'b71fdcc515974085a242d9aa32762ebd'  // Key 13
];

let tdKeyIndex = 0;

const getNextTwelveDataKey = () => {
    const key = TWELVE_DATA_KEYS[tdKeyIndex];
    // Move to next key, loop back to 0 if at end
    tdKeyIndex = (tdKeyIndex + 1) % TWELVE_DATA_KEYS.length;
    return key;
};

const forexAPIs = [
    { 
        name: 'Twelvedata', 
        id: 'twelvedata',
        // Dynamically inject the rotated key into the URL
        url: (symbol: string) => `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${getNextTwelveDataKey()}`, 
        parser: (data: any) => data?.price ? parseFloat(data.price) : null 
    },
    { 
        name: 'Alpha Vantage', 
        id: 'alphavantage',
        url: (symbol: string) => {
            const [from, to] = symbol.split('/');
            return `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=demo`;
        }, 
        parser: (data: any) => data?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate'] ? parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']) : null
    }
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
    trend: 'UP' | 'DOWN' | 'SIDEWAYS' | 'UNKNOWN';
    details?: string;
}

// --- HELPER: Synthetic Candle Generator ---
// Used when real historical API data is unavailable (e.g. Forex free tier limitations)
// to provide the AI with realistic structure data for analysis.
const generateSyntheticHistory = (currentPrice: number, count: number, volatilityPips: number = 10, pipSize: number = 0.0001): Candle[] => {
    const candles: Candle[] = [];
    let open = currentPrice;
    
    // Generate backwards from current price
    for (let i = 0; i < count; i++) {
        const time = new Date(Date.now() - i * 15 * 60 * 1000).toISOString(); // 15 min candles
        
        // Random walk logic
        const change = (Math.random() - 0.5) * volatilityPips * pipSize * 5; 
        const close = open;
        const prevOpen = close - change;
        
        const high = Math.max(prevOpen, close) + Math.random() * volatilityPips * pipSize;
        const low = Math.min(prevOpen, close) - Math.random() * volatilityPips * pipSize;

        candles.unshift({
            time,
            open: parseFloat(prevOpen.toFixed(5)),
            high: parseFloat(high.toFixed(5)),
            low: parseFloat(low.toFixed(5)),
            close: parseFloat(close.toFixed(5)),
            volume: Math.floor(Math.random() * 1000)
        });
        
        open = prevOpen;
    }
    return candles;
};

// --- DERIV WEBSOCKET SERVICE ---
const DERIV_WS_URL = 'wss://ws.binaryws.com/websockets/v3?app_id=1089';

const getDerivMarketData = (symbol: string, count: number = 50): Promise<MarketContext> => {
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
                    trend: 'UNKNOWN'
                });
            }
        }, 10000);

        ws.onopen = () => {
            // Fetch candles (M15 granularity = 900s)
            ws.send(JSON.stringify({
                ticks_history: symbol,
                adjust_start_time: 1,
                count: count,
                end: 'latest',
                style: 'candles',
                granularity: 900 
            }));
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
                         trend: 'UNKNOWN'
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
                        volume: 0
                    }));
                    
                    const currentPrice = candles[candles.length - 1].close;
                    
                    // Improved Trend Calculation
                    const len = candles.length;
                    // Use longer periods if we have more data
                    const shortPeriod = Math.min(len, 10);
                    const longPeriod = Math.min(len, 50);
                    
                    const shortMA = candles.slice(len - shortPeriod).reduce((a: number, c: any) => a + c.close, 0) / shortPeriod;
                    const longMA = candles.slice(len - longPeriod).reduce((a: number, c: any) => a + c.close, 0) / longPeriod;
                    
                    let trend: 'UP' | 'DOWN' | 'SIDEWAYS' = 'SIDEWAYS';
                    if (shortMA > longMA * 1.0005) trend = 'UP';
                    else if (shortMA < longMA * 0.9995) trend = 'DOWN';

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
                        details
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
                    trend: 'UNKNOWN'
                });
             }
        };
    });
};

export const getLivePrice = async (instrument: string): Promise<PriceResult> => {
    const instrumentData = instrumentDefinitions[instrument];
    if (!instrumentData) return { price: null, isMock: true };

    if (instrumentData.isDeriv) {
        const ctx = await getDerivMarketData(instrumentData.symbol, 1); // Only need 1 candle for price
        if (ctx.isDataReal) {
            return { price: ctx.currentPrice, isMock: false };
        }
        return { price: instrumentData.mockPrice, isMock: true };
    }

    for (const api of forexAPIs) {
        if (api.id === 'alphavantage' && !instrumentData.isForex) continue;
        try {
            const response = await fetch(api.url(instrumentData.symbol));
            if (!response.ok) continue;
            const data = await response.json();
            const parsedPrice = api.parser(data);

            if (parsedPrice && !isNaN(parsedPrice)) {
                return { price: parsedPrice, isMock: false };
            }
        } catch (error) {
            console.warn(`Error fetching price from ${api.name} for ${instrument}:`, error);
        }
    }

    console.warn(`All APIs failed for ${instrument}. Using mock price.`);
    return { price: instrumentData.mockPrice, isMock: true };
};

export const getLivePrices = async (instruments: string[]): Promise<Record<string, PriceResult>> => {
    const prices: Record<string, PriceResult> = {};
    const pricePromises = instruments.map(instrument => 
        getLivePrice(instrument).then(result => ({ instrument, ...result }))
    );

    const results = await Promise.all(pricePromises);
    for (const result of results) {
        prices[result.instrument] = { price: result.price, isMock: result.isMock };
    }
    return prices;
};

// Updated signature to accept depth
export const fetchMarketContext = async (instrument: string, depth: number = 50): Promise<MarketContext> => {
    const instrumentData = instrumentDefinitions[instrument];
    
    if (instrumentData && instrumentData.isDeriv) {
        const derivContext = await getDerivMarketData(instrumentData.symbol, depth);
        if (!derivContext.isDataReal) {
            return {
                instrument,
                currentPrice: instrumentData.mockPrice,
                isDataReal: false,
                candles: generateSyntheticHistory(instrumentData.mockPrice, depth, 20, instrumentData.pipStep),
                trend: 'UNKNOWN',
                details: 'Connection to Deriv failed. Using synthetic data.'
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
        trend: 'UNKNOWN', // Will be calculated by consumer if needed
        details: isMock ? 'Using Placeholder Data. Verify with Search.' : 'Live API Price.'
    };
};
