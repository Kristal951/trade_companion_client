
import { instrumentDefinitions } from '../config/instruments';

const forexAPIs = [
    { 
        name: 'Twelvedata', 
        id: 'twelvedata',
        url: (symbol: string) => `https://api.twelvedata.com/price?symbol=${symbol}&apikey=demo`, 
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
