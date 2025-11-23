
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
    candles: Candle[]; // Last 5 candles (M15)
    trend: 'UP' | 'DOWN' | 'SIDEWAYS';
}

export const getLivePrice = async (instrument: string): Promise<PriceResult> => {
    const instrumentData = instrumentDefinitions[instrument];
    if (!instrumentData) return { price: null, isMock: true };

    for (const api of forexAPIs) {
        if (api.id === 'alphavantage' && !instrumentData.isForex) {
            continue;
        }
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
    return { price: instrumentData.mockPrice, isMock: true }; // Fallback to mock price
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

// Generates M15 candle context anchored to the live price
export const fetchMarketContext = async (instrument: string): Promise<MarketContext> => {
    const { price, isMock } = await getLivePrice(instrument);
    const currentPrice = price || instrumentDefinitions[instrument].mockPrice;
    const pipSize = instrumentDefinitions[instrument].pipStep;

    // Simulate last 4 candles based on current price to create a pattern
    // In a real production app, this would fetch historical OHLC data
    const candles: Candle[] = [];
    let refPrice = currentPrice;
    
    // Generate simulated history (going backwards then reversing)
    const volatility = isMock ? 0.0005 : 0.0015; // Higher volatility for live
    
    for (let i = 4; i >= 0; i--) {
        const time = new Date(Date.now() - i * 15 * 60000).toISOString().substr(11, 5);
        
        // Random movement simulation to create candle structure
        const move = (Math.random() - 0.5) * (currentPrice * volatility); 
        const open = refPrice - move;
        const close = i === 0 ? currentPrice : refPrice; // Ensure last candle closes at live price
        
        const high = Math.max(open, close) + (Math.random() * pipSize * 5);
        const low = Math.min(open, close) - (Math.random() * pipSize * 5);

        candles.push({
            time,
            open: parseFloat(open.toFixed(5)),
            high: parseFloat(high.toFixed(5)),
            low: parseFloat(low.toFixed(5)),
            close: parseFloat(close.toFixed(5)),
            volume: Math.floor(Math.random() * 1000)
        });

        refPrice = open; // Next candle opens where previous closed (roughly)
    }

    // Determine simple trend based on open of first candle vs close of last
    const trend = candles[4].close > candles[0].open ? 'UP' : candles[4].close < candles[0].open ? 'DOWN' : 'SIDEWAYS';

    return {
        instrument,
        currentPrice,
        candles,
        trend
    };
};
