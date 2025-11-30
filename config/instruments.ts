
export const instrumentDefinitions: { [key: string]: any } = {
    // --- MAJORS ---
    'EUR/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, contractSize: 100000, symbol: 'EUR/USD', mockPrice: 1.08500 },
    'GBP/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, contractSize: 100000, symbol: 'GBP/USD', mockPrice: 1.25000 },
    'USD/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, contractSize: 100000, symbol: 'USD/JPY', mockPrice: 155.00 },
    'USD/CHF': { pipStep: 0.0001, quoteCurrency: 'CHF', isForex: true, contractSize: 100000, symbol: 'USD/CHF', mockPrice: 0.91500 },
    'USD/CAD': { pipStep: 0.0001, quoteCurrency: 'CAD', isForex: true, contractSize: 100000, symbol: 'USD/CAD', mockPrice: 1.36500 },
    'AUD/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, contractSize: 100000, symbol: 'AUD/USD', mockPrice: 0.65500 },
    'NZD/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, contractSize: 100000, symbol: 'NZD/USD', mockPrice: 0.60500 },
    
    // --- MINORS (CROSSES) ---
    // EUR Crosses
    'EUR/GBP': { pipStep: 0.0001, quoteCurrency: 'GBP', isForex: true, contractSize: 100000, symbol: 'EUR/GBP', mockPrice: 0.85500 },
    'EUR/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, contractSize: 100000, symbol: 'EUR/JPY', mockPrice: 167.00 },
    'EUR/AUD': { pipStep: 0.0001, quoteCurrency: 'AUD', isForex: true, contractSize: 100000, symbol: 'EUR/AUD', mockPrice: 1.6500 },
    'EUR/CAD': { pipStep: 0.0001, quoteCurrency: 'CAD', isForex: true, contractSize: 100000, symbol: 'EUR/CAD', mockPrice: 1.4700 },
    'EUR/CHF': { pipStep: 0.0001, quoteCurrency: 'CHF', isForex: true, contractSize: 100000, symbol: 'EUR/CHF', mockPrice: 0.9600 },
    'EUR/NZD': { pipStep: 0.0001, quoteCurrency: 'NZD', isForex: true, contractSize: 100000, symbol: 'EUR/NZD', mockPrice: 1.7800 },

    // GBP Crosses
    'GBP/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, contractSize: 100000, symbol: 'GBP/JPY', mockPrice: 185.00 },
    'GBP/AUD': { pipStep: 0.0001, quoteCurrency: 'AUD', isForex: true, contractSize: 100000, symbol: 'GBP/AUD', mockPrice: 1.9200 },
    'GBP/CAD': { pipStep: 0.0001, quoteCurrency: 'CAD', isForex: true, contractSize: 100000, symbol: 'GBP/CAD', mockPrice: 1.7100 },
    'GBP/CHF': { pipStep: 0.0001, quoteCurrency: 'CHF', isForex: true, contractSize: 100000, symbol: 'GBP/CHF', mockPrice: 1.1200 },
    'GBP/NZD': { pipStep: 0.0001, quoteCurrency: 'NZD', isForex: true, contractSize: 100000, symbol: 'GBP/NZD', mockPrice: 2.0800 },

    // AUD Crosses
    'AUD/CAD': { pipStep: 0.0001, quoteCurrency: 'CAD', isForex: true, contractSize: 100000, symbol: 'AUD/CAD', mockPrice: 0.90000 },
    'AUD/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, contractSize: 100000, symbol: 'AUD/JPY', mockPrice: 97.50 },
    'AUD/CHF': { pipStep: 0.0001, quoteCurrency: 'CHF', isForex: true, contractSize: 100000, symbol: 'AUD/CHF', mockPrice: 0.5900 },
    'AUD/NZD': { pipStep: 0.0001, quoteCurrency: 'NZD', isForex: true, contractSize: 100000, symbol: 'AUD/NZD', mockPrice: 1.0800 },

    // NZD Crosses
    'NZD/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, contractSize: 100000, symbol: 'NZD/JPY', mockPrice: 91.00 },
    'NZD/CAD': { pipStep: 0.0001, quoteCurrency: 'CAD', isForex: true, contractSize: 100000, symbol: 'NZD/CAD', mockPrice: 0.8200 },
    'NZD/CHF': { pipStep: 0.0001, quoteCurrency: 'CHF', isForex: true, contractSize: 100000, symbol: 'NZD/CHF', mockPrice: 0.5400 },

    // CAD/CHF Crosses
    'CAD/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, contractSize: 100000, symbol: 'CAD/JPY', mockPrice: 110.00 },
    'CAD/CHF': { pipStep: 0.0001, quoteCurrency: 'CHF', isForex: true, contractSize: 100000, symbol: 'CAD/CHF', mockPrice: 0.6600 },
    'CHF/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, contractSize: 100000, symbol: 'CHF/JPY', mockPrice: 168.00 },
    
    // --- METALS ---
    'XAU/USD': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, contractSize: 100, symbol: 'XAU/USD', mockPrice: 2300.00 },
    'XAG/USD': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, contractSize: 5000, symbol: 'XAG/USD', mockPrice: 27.00 },
    
    // --- CRYPTO ---
    'BTC/USD': { pipStep: 1, quoteCurrency: 'USD', isForex: false, contractSize: 1, symbol: 'BTC/USD', mockPrice: 65000.00 },
    'ETH/USD': { pipStep: 0.1, quoteCurrency: 'USD', isForex: false, contractSize: 1, symbol: 'ETH/USD', mockPrice: 3500.00 },
    'SOL/USD': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, contractSize: 1, symbol: 'SOL/USD', mockPrice: 145.00 },

    // --- INDICES ---
    'US500': { pipStep: 0.1, quoteCurrency: 'USD', isForex: false, contractSize: 1, symbol: 'SPX', mockPrice: 5200.00 },
    'US100': { pipStep: 0.1, quoteCurrency: 'USD', isForex: false, contractSize: 1, symbol: 'NDX', mockPrice: 18000.00 },

    // --- DERIV SYNTHETICS ---
    'Volatility 10 Index': { pipStep: 0.001, quoteCurrency: 'USD', isForex: false, isDeriv: true, contractSize: 1, symbol: 'R_10', mockPrice: 6500.00 },
    'Volatility 25 Index': { pipStep: 0.001, quoteCurrency: 'USD', isForex: false, isDeriv: true, contractSize: 1, symbol: 'R_25', mockPrice: 2000.00 },
    'Volatility 50 Index': { pipStep: 0.001, quoteCurrency: 'USD', isForex: false, isDeriv: true, contractSize: 1, symbol: 'R_50', mockPrice: 300.00 },
    'Volatility 75 Index': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, isDeriv: true, contractSize: 1, symbol: 'R_75', mockPrice: 450000.00 },
    'Volatility 100 Index': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, isDeriv: true, contractSize: 1, symbol: 'R_100', mockPrice: 2000.00 },
    'Crash 500 Index': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, isDeriv: true, contractSize: 1, symbol: 'CRASH500', mockPrice: 4500.00 },
    'Crash 1000 Index': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, isDeriv: true, contractSize: 1, symbol: 'CRASH1000', mockPrice: 6000.00 },
    'Boom 500 Index': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, isDeriv: true, contractSize: 1, symbol: 'BOOM500', mockPrice: 5500.00 },
    'Boom 1000 Index': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, isDeriv: true, contractSize: 1, symbol: 'BOOM1000', mockPrice: 12000.00 },
    'Jump 25 Index': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, isDeriv: true, contractSize: 1, symbol: 'JD25', mockPrice: 1500.00 },
};
