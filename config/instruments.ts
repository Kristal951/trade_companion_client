
export const instrumentDefinitions: { [key: string]: any } = {
    'EUR/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, contractSize: 100000, symbol: 'EUR/USD', mockPrice: 1.08500 },
    'USD/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, contractSize: 100000, symbol: 'USD/JPY', mockPrice: 155.00 },
    'GBP/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, contractSize: 100000, symbol: 'GBP/USD', mockPrice: 1.25000 },
    'USD/CAD': { pipStep: 0.0001, quoteCurrency: 'CAD', isForex: true, contractSize: 100000, symbol: 'USD/CAD', mockPrice: 1.36500 },
    'AUD/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, contractSize: 100000, symbol: 'AUD/USD', mockPrice: 0.65500 },
    'USD/CHF': { pipStep: 0.0001, quoteCurrency: 'CHF', isForex: true, contractSize: 100000, symbol: 'USD/CHF', mockPrice: 0.91500 },
    'NZD/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, contractSize: 100000, symbol: 'NZD/USD', mockPrice: 0.60500 },
    'EUR/GBP': { pipStep: 0.0001, quoteCurrency: 'GBP', isForex: true, contractSize: 100000, symbol: 'EUR/GBP', mockPrice: 0.85500 },
    'AUD/CAD': { pipStep: 0.0001, quoteCurrency: 'CAD', isForex: true, contractSize: 100000, symbol: 'AUD/CAD', mockPrice: 0.90000 },
    'GBP/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, contractSize: 100000, symbol: 'GBP/JPY', mockPrice: 185.00 },
    'EUR/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, contractSize: 100000, symbol: 'EUR/JPY', mockPrice: 167.00 },
    'XAU/USD': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, contractSize: 100, symbol: 'XAU/USD', mockPrice: 2300.00 },
    'XAG/USD': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, contractSize: 5000, symbol: 'XAG/USD', mockPrice: 27.00 },
    'BTC/USD': { pipStep: 1, quoteCurrency: 'USD', isForex: false, contractSize: 1, symbol: 'BTC/USD', mockPrice: 65000.00 },
};
