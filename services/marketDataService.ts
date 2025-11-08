
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
