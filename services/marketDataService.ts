
import { instrumentDefinitions } from '../config/instruments';

// API Key Rotation Logic for Twelve Data
const TWELVE_DATA_KEYS = [
    '5cf065b50cf64c3ab77a8a9927529bfb', // Original Key
    '343128a9420249c5b3e191e384b66db5', // New Key 1
    '75ebcc61250444a5b38f39b9af979de4', // New Key 2
    '1053e760968e46f5b05fc8e90d38c9c0', // New Key 3
    'c36bc29240fb4bfd9aaafc96df16d6b7', // New Key 4
    '65df8f9eadfc491dac7a3db1ab2fbc98', // New Key 5
    '36a7d432423e45108264c6336b9bd692', // New Key 6
    '0dc49b6059944d4f9c7c16688d24807d', // New Key 7
    '23d84647343f491bb18471f4ea59909d', // New Key 8
    'dd88bc459de64aa4b60738b881663f43', // New Key 9
    '095caa7fe42c4bd0864ca141451c756c'  // New Key 10
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

// --- DERIV WEBSOCKET SERVICE ---
const DERIV_WS_URL = 'wss://ws.binaryws.com/websockets/v3?app_id=1089';

const getDerivMarketData = (symbol: string): Promise<MarketContext> => {
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
            // Fetch last 50 candles (M15 granularity = 900s) for better structure analysis
            ws.send(JSON.stringify({
                ticks_history: symbol,
                adjust_start_time: 1,
                count: 50,
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
                    const shortMA = candles.slice(len - 10).reduce((a: number, c: any) => a + c.close, 0) / 10;
                    const longMA = candles.slice(len - 50).reduce((a: number, c: any) => a + c.close, 0) / 50;
                    
                    let trend: 'UP' | 'DOWN' | 'SIDEWAYS' = 'SIDEWAYS';
                    if (shortMA > longMA * 1.0005) trend = 'UP';
                    else if (shortMA < longMA * 0.9995) trend = 'DOWN';

                    // Structure details
                    const highestHigh = Math.max(...candles.slice(len - 20).map((c: any) => c.high));
                    const lowestLow = Math.min(...candles.slice(len - 20).map((c: any) => c.low));

                    const details = `Live Data (Deriv): Price ${currentPrice}. M15 Trend: ${trend}. 50-SMA: ${longMA.toFixed(2)}. Recent Range: ${lowestLow} - ${highestHigh}.`;

                    console.log(`Deriv Data Fetched for ${symbol}: Price ${currentPrice}, Trend ${trend}`);

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
        const ctx = await getDerivMarketData(instrumentData.symbol);
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

export const fetchMarketContext = async (instrument: string): Promise<MarketContext> => {
    const instrumentData = instrumentDefinitions[instrument];
    
    if (instrumentData && instrumentData.isDeriv) {
        const derivContext = await getDerivMarketData(instrumentData.symbol);
        if (!derivContext.isDataReal) {
            return {
                instrument,
                currentPrice: instrumentData.mockPrice,
                isDataReal: false,
                candles: [],
                trend: 'UNKNOWN',
                details: 'Connection to Deriv failed. Using mock data.'
            };
        }
        return { ...derivContext, instrument };
    }

    const { price, isMock } = await getLivePrice(instrument);
    const currentPrice = price || (instrumentData ? instrumentData.mockPrice : 0);

    return {
        instrument,
        currentPrice,
        isDataReal: !isMock,
        candles: [], 
        trend: 'UNKNOWN',
        details: isMock ? 'Using Placeholder Data. Verify with Search.' : 'Live API Price.'
    };
};
