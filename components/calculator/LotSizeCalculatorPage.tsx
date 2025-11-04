
import React, { useState, useEffect, useRef } from 'react';
import { getTradeAnalysis } from '../../services/geminiService';
import { PlanName, User } from '../../types';
import Icon from '../ui/Icon';

const instrumentDefinitions: { [key: string]: any } = {
    'EUR/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, currentPrice: null, symbol: 'EURUSD', mockPrice: 1.08500 },
    'USD/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, currentPrice: null, symbol: 'USDJPY', mockPrice: 155.00 },
    'GBP/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, currentPrice: null, symbol: 'GBPUSD', mockPrice: 1.25000 },
    'USD/CAD': { pipStep: 0.0001, quoteCurrency: 'CAD', isForex: true, currentPrice: null, symbol: 'USDCAD', mockPrice: 1.36500 },
    'AUD/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, currentPrice: null, symbol: 'AUDUSD', mockPrice: 0.65500 },
    'USD/CHF': { pipStep: 0.0001, quoteCurrency: 'CHF', isForex: true, currentPrice: null, symbol: 'USDCHF', mockPrice: 0.91500 },
    'NZD/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, currentPrice: null, symbol: 'NZDUSD', mockPrice: 0.60500 },
    'EUR/GBP': { pipStep: 0.0001, quoteCurrency: 'GBP', isForex: true, currentPrice: null, symbol: 'EURGBP', mockPrice: 0.85500 },
    'AUD/CAD': { pipStep: 0.0001, quoteCurrency: 'CAD', isForex: true, currentPrice: null, symbol: 'AUDCAD', mockPrice: 0.90000 },
    'GBP/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, currentPrice: null, symbol: 'GBPJPY', mockPrice: 185.00 },
    'EUR/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, currentPrice: null, symbol: 'EURJPY', mockPrice: 167.00 },
    'XAU/USD': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, contractSize: 100, currentPrice: null, symbol: 'XAUUSD', mockPrice: 2300.00 },
    'XAG/USD': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, contractSize: 5000, currentPrice: null, symbol: 'XAGUSD', mockPrice: 27.00 },
    'BTC/USD': { pipStep: 1, quoteCurrency: 'USD', isForex: false, contractSize: 1, currentPrice: null, symbol: 'BTCUSD', mockPrice: 65000.00 },
};

const forexAPIs = [
    { name: 'Twelvedata', url: (symbol: string) => `https://api.twelvedata.com/price?symbol=${symbol}&apikey=demo`, parser: (data: any) => parseFloat(data.price) },
    { name: 'Alpha Vantage', url: (symbol: string) => `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`, parser: (data: any) => data['Global Quote']?.['05. price'] }
];

interface LotSizeCalculatorPageProps {
    user: User;
}

const getGreeting = (name: string) => {
    const hour = new Date().getHours();
    const username = name.split(' ')[0];
    let greeting;
    if (hour < 12) {
        greeting = "Good morning";
    } else if (hour < 18) {
        greeting = "Good afternoon";
    } else {
        greeting = "Good evening";
    }
    return `${greeting}, ${username}! 👋`;
}

const LotSizeCalculatorPage: React.FC<LotSizeCalculatorPageProps> = ({ user }) => {
    const [accountCurrency, setAccountCurrency] = useState('USD');
    const [accountBalance, setAccountBalance] = useState('10000');
    const [riskPercentage, setRiskPercentage] = useState('1.0');
    const [instrument, setInstrument] = useState('EUR/USD');
    const [timeFrame, setTimeFrame] = useState('Daily');
    const [entryPrice, setEntryPrice] = useState('1.08500');
    const [stopLossPrice, setStopLossPrice] = useState('1.08000');
    const [crossRate, setCrossRate] = useState('1.2500');
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [livePriceInfo, setLivePriceInfo] = useState<{ price: string; change: string; changeClass: string; isMock: boolean } | null>(null);
    const [isAILoading, setIsAILoading] = useState(false);
    const [aiInsight, setAiInsight] = useState<any>(null);

    const isSubscribedForAI = user.subscribedPlan === PlanName.Premium;
    const currentLivePrice = useRef<number | null>(null);
    const lastPrice = useRef<number | null>(null);
    const lastCalculatedResults = useRef<any>(null);

    const toDecimal = (num: number, places: number) => parseFloat(num.toFixed(places));

    const calculateLotSize = () => {
        const balance = parseFloat(accountBalance);
        const riskPct = parseFloat(riskPercentage);
        const entry = parseFloat(entryPrice);
        const stop = parseFloat(stopLossPrice);
        
        if (isNaN(balance) || isNaN(riskPct) || isNaN(entry) || isNaN(stop) || instrument === "" || stop === entry) {
            setError('Please ensure all fields are filled correctly and Stop-Loss is not equal to Entry Price.');
            setResults(null);
            return;
        }
        setError(null);

        const props = instrumentDefinitions[instrument];
        let conversionRate = 1.0;
        const instrumentQuote = props.quoteCurrency;
        
        const isQuoteCurrencyDifferent = instrumentQuote !== accountCurrency;
        
        if (isQuoteCurrencyDifferent) {
            conversionRate = parseFloat(crossRate);
            if (isNaN(conversionRate) || conversionRate <= 0) {
                setError('Conversion Rate is required for cross-pairs and must be positive.');
                setResults(null);
                return;
            }
        }

        const riskAmount = balance * (riskPct / 100);
        const pipsRisky = toDecimal(Math.abs(entry - stop) / props.pipStep, 2);
        const standardForexLotUnits = 100000;
        const contractSize = props.isForex ? standardForexLotUnits : props.contractSize;
        const pipValueQC = (contractSize * props.pipStep);
        let pipValueAC;

        if (instrumentQuote === accountCurrency) {
            pipValueAC = pipValueQC;
        } else if (instrumentQuote === 'JPY' && accountCurrency === 'USD') {
            pipValueAC = pipValueQC / entry; 
        } else {
            pipValueAC = pipValueQC * conversionRate;
        }

        if (pipValueAC === 0 || isNaN(pipValueAC) || pipsRisky === 0) {
            setError('Calculation error: Pip value is zero or invalid, or Stop-Loss is too close to Entry.');
            setResults(null);
            return;
        }
        
        const lotSize = riskAmount / (pipsRisky * pipValueAC);
        const positionSizeInUnits = lotSize * contractSize;

        const newResults = {
            riskAmount: `${accountCurrency} ${toDecimal(riskAmount, 2).toLocaleString()}`,
            pipsRisky: `${toDecimal(pipsRisky, 2).toLocaleString()} pips`,
            lotSize: `${toDecimal(lotSize, 4).toLocaleString()} lots`,
            units: `Units: ${toDecimal(positionSizeInUnits, 2).toLocaleString()}`
        };

        setResults(newResults);
        lastCalculatedResults.current = {
            instrument, accountBalance: balance, riskPct, riskAmount: toDecimal(riskAmount, 2),
            pipsRisky, lotSize: toDecimal(lotSize, 4), accountCurrency, isError: false,
            entryPrice: entry, stopLossPrice: stop, timeFrame, pipValueAC: toDecimal(pipValueAC, 4)
        };
    };

    const fetchLivePrice = async () => {
        const props = instrumentDefinitions[instrument];
        const decimalPlaces = Math.max(2, Math.ceil(-Math.log10(props.pipStep)));
        let price = null;

        for (const api of forexAPIs) {
            try {
                const response = await fetch(api.url(props.symbol));
                if (response.ok) {
                    const data = await response.json();
                    const parsedPrice = api.parser(data);
                    if (parsedPrice && !isNaN(parsedPrice)) {
                        price = parsedPrice;
                        break;
                    }
                }
            } catch (error) { continue; }
        }

        let isMock = false;
        if (!price || isNaN(price)) {
            price = props.mockPrice;
            isMock = true;
        }

        currentLivePrice.current = price;
        let changeText = '';
        let changeClass = 'text-gray-400';

        if (lastPrice.current) {
            const change = price - lastPrice.current;
            changeClass = change >= 0 ? 'text-green-400' : 'text-red-400';
            const changeSymbol = change >= 0 ? '↗' : '↘';
            changeText = `${changeSymbol} ${Math.abs(change).toFixed(5)}`;
        }
        lastPrice.current = price;

        setLivePriceInfo({ price: price.toFixed(decimalPlaces), change: changeText, changeClass, isMock });
    };

    const handleInstrumentChange = (newInstrument: string) => {
        setInstrument(newInstrument);
        const props = instrumentDefinitions[newInstrument];
        const decimalPlaces = Math.max(2, Math.ceil(-Math.log10(props.pipStep)));
        const initialEntry = props.mockPrice.toFixed(decimalPlaces);
        const initialSL = (props.mockPrice - (50 * props.pipStep)).toFixed(decimalPlaces);
        setEntryPrice(initialEntry);
        setStopLossPrice(initialSL);
        currentLivePrice.current = null;
        lastPrice.current = null;
        setLivePriceInfo(null);
    };

    const useCurrentPriceFor = (field: 'entry' | 'sl') => {
        if (currentLivePrice.current) {
            const props = instrumentDefinitions[instrument];
            const decimalPlaces = Math.max(2, Math.ceil(-Math.log10(props.pipStep)));
            const formattedPrice = currentLivePrice.current.toFixed(decimalPlaces);
            if (field === 'entry') setEntryPrice(formattedPrice);
            else setStopLossPrice(formattedPrice);
        }
    };
    
    const calculateAutoSL = (pipDistance: number) => {
        const entry = parseFloat(entryPrice);
        if (isNaN(entry)) return;
        const props = instrumentDefinitions[instrument];
        const priceChange = pipDistance * props.pipStep;
        const newSL = entry + priceChange;
        const decimalPlaces = Math.max(2, Math.ceil(-Math.log10(props.pipStep)));
        setStopLossPrice(newSL.toFixed(decimalPlaces));
    };

    const handleAiAnalysis = async () => {
        if (!isSubscribedForAI || !lastCalculatedResults.current || lastCalculatedResults.current.isError) {
            return;
        }
        setIsAILoading(true);
        setAiInsight(null);

        try {
            const results = lastCalculatedResults.current;
            const tradeDirection = results.entryPrice > results.stopLossPrice ? "BUY (LONG)" : "SELL (SHORT)";
            const instrumentProps = instrumentDefinitions[results.instrument];
            const decimalPlaces = Math.max(2, Math.ceil(-Math.log10(instrumentProps.pipStep)));
            const pipDistance = Math.abs(results.entryPrice - results.stopLossPrice);
            const tpPrice = tradeDirection.includes("BUY") 
                ? parseFloat((results.entryPrice + (pipDistance * 2)).toFixed(decimalPlaces))
                : parseFloat((results.entryPrice - (pipDistance * 2)).toFixed(decimalPlaces));

            const analysis = await getTradeAnalysis({ ...results, tradeDirection, tpPrice });
            setAiInsight(analysis);
        } catch (e) {
            setAiInsight({ text: "Sorry, the AI analysis failed. Please try again later.", sources: [] });
        } finally {
            setIsAILoading(false);
        }
    };

    useEffect(() => {
        handleInstrumentChange('EUR/USD');
    }, []);

    useEffect(() => {
        fetchLivePrice();
        const interval = setInterval(fetchLivePrice, 30000);
        return () => clearInterval(interval);
    }, [instrument]);
    
    useEffect(() => {
        const handler = setTimeout(() => calculateLotSize(), 200);
        return () => clearTimeout(handler);
    }, [accountBalance, riskPercentage, entryPrice, stopLossPrice, instrument, accountCurrency, crossRate]);
    
    const renderAiInsight = () => {
        if (!aiInsight) {
             return <p className="text-gray-400">Click the button above to get comprehensive market analysis including technical levels, risk assessment, and calculated Take-Profit targets.</p>;
        }
        const formattedText = aiInsight.text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-on-surface">$1</strong>')
            .replace(/\n/g, '<br />');

        return (
            <div>
                <div dangerouslySetInnerHTML={{ __html: formattedText }} />
                {aiInsight.sources && aiInsight.sources.length > 0 && (
                    <div className="mt-4 pt-2 border-t border-gray-700">
                        <strong className="text-xs text-primary">Sources:</strong>
                        <ul className="list-disc ml-4 text-xs text-gray-400">
                            {aiInsight.sources.map((source: any, index: number) => (
                                <li key={index}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline">{source.title}</a></li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    const isCrossRateVisible = instrumentDefinitions[instrument]?.quoteCurrency !== accountCurrency;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Position & Lot Size Calculator</h1>
            <p className="text-lg font-semibold text-primary mb-2">{getGreeting(user.name)}</p>
            <p className="text-gray-400 mb-6">Accurate risk management with live market data.</p>
            <div className="bg-surface p-6 rounded-xl space-y-6 max-w-4xl mx-auto">
                {/* Inputs */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="accountCurrency" className="block text-sm font-medium mb-1 text-gray-400">Account Currency</label>
                        <select id="accountCurrency" value={accountCurrency} onChange={e => setAccountCurrency(e.target.value)} className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-600 focus:ring-primary focus:border-primary">
                            <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="JPY">JPY</option><option value="CAD">CAD</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="accountBalance" className="block text-sm font-medium mb-1 text-gray-400">Account Balance</label>
                        <input type="number" id="accountBalance" value={accountBalance} onChange={e => setAccountBalance(e.target.value)} min="1" className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-600 focus:ring-primary focus:border-primary" />
                    </div>
                     <div>
                        <label htmlFor="riskPercentage" className="block text-sm font-medium mb-1 text-gray-400">Risk Percentage (%)</label>
                        <input type="number" id="riskPercentage" value={riskPercentage} onChange={e => setRiskPercentage(e.target.value)} min="0.1" max="100" step="0.1" className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-600 focus:ring-primary focus:border-primary" />
                    </div>
                     <div>
                        <label htmlFor="instrument" className="block text-sm font-medium mb-1 text-gray-400">Trading Instrument</label>
                        <select id="instrument" value={instrument} onChange={e => handleInstrumentChange(e.target.value)} className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-600 focus:ring-primary focus:border-primary">
                            <optgroup label="Major Forex Pairs">
                                {Object.keys(instrumentDefinitions).slice(0, 7).map(key => <option key={key} value={key}>{key}</option>)}
                            </optgroup>
                            <optgroup label="Minor/Cross Forex Pairs">
                                {Object.keys(instrumentDefinitions).slice(7, 11).map(key => <option key={key} value={key}>{key}</option>)}
                            </optgroup>
                            <optgroup label="Metals & Crypto">
                                {Object.keys(instrumentDefinitions).slice(11).map(key => <option key={key} value={key}>{key.replace(' (', ' - ')}</option>)}
                            </optgroup>
                        </select>
                        {livePriceInfo && (
                             <div className="text-xs text-gray-400 mt-1">
                                Live: <span className="font-semibold text-on-surface">{livePriceInfo.price}</span>
                                <span className={`ml-2 ${livePriceInfo.changeClass}`}>{livePriceInfo.change}</span>
                                {livePriceInfo.isMock && <span className="ml-2 text-yellow-500">(Mock)</span>}
                            </div>
                        )}
                    </div>
                </section>
                <hr className="border-gray-700"/>
                {/* Trade Parameters */}
                 <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label htmlFor="timeFrame" className="block text-sm font-medium mb-1 text-gray-400">Analysis Time Frame</label>
                        <select id="timeFrame" value={timeFrame} onChange={e => setTimeFrame(e.target.value)} className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-600 focus:ring-primary focus:border-primary">
                            <option value="Daily">Daily (D1)</option><option value="H4">4-Hour (H4)</option><option value="W1">Weekly (W1)</option>
                            <option value="H1">1-Hour (H1)</option><option value="M30">30-Min (M30)</option><option value="M15">15-Min (M15)</option><option value="M5">5-Min (M5)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="entryPrice" className="block text-sm font-medium mb-1 text-gray-400">Entry Price</label>
                         <div className="relative">
                            <input type="number" id="entryPrice" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} step={instrumentDefinitions[instrument]?.pipStep / 10} className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-600 focus:ring-primary focus:border-primary pr-16" />
                             <button type="button" onClick={() => useCurrentPriceFor('entry')} className="absolute inset-y-0 right-0 text-xs bg-green-600 text-white px-2 rounded-r-lg hover:bg-green-700">Use Live</button>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="stopLossPrice" className="block text-sm font-medium mb-1 text-gray-400">Stop-Loss Price</label>
                         <div className="relative">
                            <input type="number" id="stopLossPrice" value={stopLossPrice} onChange={e => setStopLossPrice(e.target.value)} step={instrumentDefinitions[instrument]?.pipStep / 10} className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-600 focus:ring-primary focus:border-primary pr-16" />
                             <button type="button" onClick={() => useCurrentPriceFor('sl')} className="absolute inset-y-0 right-0 text-xs bg-red-600 text-white px-2 rounded-r-lg hover:bg-red-700">Use Live</button>
                        </div>
                    </div>
                    <div className="md:col-span-2 bg-gray-900 p-3 rounded-lg">
                        <label className="block text-sm font-medium mb-2 text-gray-300">Auto Stop-Loss (from Entry)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[-10, -20, -30, -50].map(pips => (
                                <button key={pips} onClick={() => calculateAutoSL(pips)} className="bg-primary/20 text-primary py-1 px-3 rounded text-sm hover:bg-primary hover:text-white transition-colors">{pips} pips</button>
                            ))}
                        </div>
                    </div>
                    {isCrossRateVisible && (
                        <div className="md:col-span-2">
                            <label htmlFor="crossRateInput" className="block text-sm font-medium mb-1 text-yellow-400">Conversion Rate</label>
                            <input type="number" id="crossRateInput" value={crossRate} onChange={e => setCrossRate(e.target.value)} step="0.0001" className="w-full p-2.5 rounded-lg bg-gray-900 border border-yellow-600 focus:ring-primary focus:border-primary" />
                            <span className="text-xs text-gray-500 block mt-0.5">e.g., If trading {instrument} with {accountCurrency} account, enter {instrumentDefinitions[instrument]?.quoteCurrency}/{accountCurrency} rate.</span>
                        </div>
                    )}
                </section>
                <hr className="border-gray-700"/>
                {/* Results */}
                 <section className="space-y-4">
                    <h3 className="text-lg font-bold text-primary">Calculation Results</h3>
                    {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm border border-red-500/20">{error}</div>}
                    {results && !error && (
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-900 p-3 rounded-lg">
                                <p className="text-xs text-gray-400">Max Risk Amount</p>
                                <p className="text-lg font-bold text-green-400">{results.riskAmount}</p>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-lg">
                                <p className="text-xs text-gray-400">Stop-Loss Distance</p>
                                <p className="text-lg font-bold text-on-surface">{results.pipsRisky}</p>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-lg col-span-2">
                                <p className="text-sm text-gray-300">Required Lot Size (Volume)</p>
                                <p className="text-3xl font-extrabold text-primary">{results.lotSize}</p>
                                <p className="text-sm mt-1 text-gray-400">{results.units}</p>
                            </div>
                        </div>
                    )}
                 </section>
                {/* AI Analysis */}
                <section className="space-y-3 bg-gray-900 p-4 rounded-xl relative">
                     {!isSubscribedForAI && (
                        <div className="absolute inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 rounded-xl text-center">
                            <Icon name="billing" className="h-10 w-10 text-yellow-400" />
                            <p className="mt-2 text-xl font-bold text-white">Premium Feature</p>
                            <p className="text-sm text-gray-300">AI Market Analysis is reserved for Premium subscribers.</p>
                        </div>
                     )}
                    <h3 className="text-lg font-bold text-yellow-400">AI Market Analysis</h3>
                    <button onClick={handleAiAnalysis} disabled={isAILoading || !isSubscribedForAI || !results} className="w-full py-2.5 px-4 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition duration-150 flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {isAILoading ? (
                             <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Analyzing...
                            </>
                        ) : "Get In-Depth Market Analysis"}
                    </button>
                     <div className="text-gray-300 text-sm mt-2 mb-4 min-h-8 bg-surface p-3 rounded-lg border border-gray-700">
                        {renderAiInsight()}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default LotSizeCalculatorPage;
