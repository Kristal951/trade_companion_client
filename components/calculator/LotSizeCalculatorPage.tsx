import React, { useState, useEffect, useRef } from 'react';
import { getTradeAnalysis } from '../../services/geminiService';
import { User } from '../../types';
import Icon from '../ui/Icon';
import SecureContent from '../ui/SecureContent';
import { useUsageTracker } from '../../hooks/useUsageTracker';

const instrumentDefinitions: { [key: string]: any } = {
    'EUR/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, contractSize: 100000, currentPrice: null, symbol: 'EUR/USD', mockPrice: 1.08500 },
    'USD/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, contractSize: 100000, currentPrice: null, symbol: 'USD/JPY', mockPrice: 155.00 },
    'GBP/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, contractSize: 100000, currentPrice: null, symbol: 'GBP/USD', mockPrice: 1.25000 },
    'USD/CAD': { pipStep: 0.0001, quoteCurrency: 'CAD', isForex: true, contractSize: 100000, currentPrice: null, symbol: 'USD/CAD', mockPrice: 1.36500 },
    'AUD/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, contractSize: 100000, currentPrice: null, symbol: 'AUD/USD', mockPrice: 0.65500 },
    'USD/CHF': { pipStep: 0.0001, quoteCurrency: 'CHF', isForex: true, contractSize: 100000, currentPrice: null, symbol: 'USD/CHF', mockPrice: 0.91500 },
    'NZD/USD': { pipStep: 0.0001, quoteCurrency: 'USD', isForex: true, contractSize: 100000, currentPrice: null, symbol: 'NZD/USD', mockPrice: 0.60500 },
    'EUR/GBP': { pipStep: 0.0001, quoteCurrency: 'GBP', isForex: true, contractSize: 100000, currentPrice: null, symbol: 'EUR/GBP', mockPrice: 0.85500 },
    'AUD/CAD': { pipStep: 0.0001, quoteCurrency: 'CAD', isForex: true, contractSize: 100000, currentPrice: null, symbol: 'AUD/CAD', mockPrice: 0.90000 },
    'GBP/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, contractSize: 100000, currentPrice: null, symbol: 'GBP/JPY', mockPrice: 185.00 },
    'EUR/JPY': { pipStep: 0.01, quoteCurrency: 'JPY', isForex: true, contractSize: 100000, currentPrice: null, symbol: 'EUR/JPY', mockPrice: 167.00 },
    'XAU/USD': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, contractSize: 100, currentPrice: null, symbol: 'XAU/USD', mockPrice: 2300.00 },
    'XAG/USD': { pipStep: 0.01, quoteCurrency: 'USD', isForex: false, contractSize: 5000, currentPrice: null, symbol: 'XAG/USD', mockPrice: 27.00 },
    'BTC/USD': { pipStep: 1, quoteCurrency: 'USD', isForex: false, contractSize: 1, currentPrice: null, symbol: 'BTC/USD', mockPrice: 65000.00 },
};

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
    const { canUseFeature, incrementUsage, getUsageInfo } = useUsageTracker(user);
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

    const usageInfo = getUsageInfo('entryAnalysis');
    const canUseAiAnalysis = canUseFeature('entryAnalysis');

    const currentLivePrice = useRef<number | null>(null);
    const lastPrice = useRef<number | null>(null);
    const lastCalculatedResults = useRef<any>(null);

    const toDecimal = (num: number, places: number) => parseFloat(num.toFixed(places));

    const isCrossRateVisible = instrumentDefinitions[instrument]?.quoteCurrency !== accountCurrency && !instrument.startsWith(accountCurrency);

    const calculateLotSize = () => {
        setError(null);
        setResults(null);
        try {
            const balance = parseFloat(accountBalance);
            const riskPct = parseFloat(riskPercentage);
            const entry = parseFloat(entryPrice);
            const stopLoss = parseFloat(stopLossPrice);
            const cross = parseFloat(crossRate);

            if (isNaN(balance) || isNaN(riskPct) || isNaN(entry) || isNaN(stopLoss) || (isCrossRateVisible && isNaN(cross))) {
                 throw new Error("Please ensure all fields have valid numbers.");
            }

            if (entry === stopLoss) {
                throw new Error("Entry and Stop Loss prices cannot be the same.");
            }

            const instrumentProps = instrumentDefinitions[instrument];
            const riskAmount = balance * (riskPct / 100);
            const stopLossPips = Math.abs(entry - stopLoss) / instrumentProps.pipStep;
            
            let pipValue;
            let tickValue = instrumentProps.pipStep;
            const contractSize = instrumentProps.contractSize || 100000;
            
            if(instrumentProps.quoteCurrency === accountCurrency){
                 pipValue = tickValue * contractSize;
            } else {
                if (instrument.startsWith(accountCurrency)) { 
                    pipValue = (tickValue * contractSize) / entry;
                } else {
                    pipValue = (tickValue * contractSize) * cross;
                }
            }
            
            if (pipValue === 0 || isNaN(pipValue) || stopLossPips === 0) {
                 throw new Error("Calculation error: Pip value is zero or invalid, or Stop-Loss is too close to Entry.");
            }

            const positionSizeUnits = (riskAmount / (stopLossPips * pipValue));
            const standardLots = positionSizeUnits / contractSize;

            const finalResults = {
                riskAmount: toDecimal(riskAmount, 2),
                stopLossPips: toDecimal(stopLossPips, 1),
                positionSizeUnits: toDecimal(positionSizeUnits, 2),
                standardLots: toDecimal(standardLots, 2),
                pipValue: toDecimal(pipValue, 5),
                isError: false,
                instrument,
                entryPrice: entry,
                stopLossPrice: stopLoss
            };
            setResults(finalResults);
            lastCalculatedResults.current = finalResults;

        } catch (e: any) {
            setError(e.message);
            setResults(null);
            lastCalculatedResults.current = { isError: true };
        }
    };

    const fetchLivePrice = async () => {
        const instrumentData = instrumentDefinitions[instrument];
        if (!instrumentData) return;

        let price: number | null = null;

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
                    price = parsedPrice;
                    break;
                }
            } catch (error) {
                console.error(`Error fetching price from ${api.name}:`, error);
            }
        }

        const decimalPlaces = Math.ceil(-Math.log10(instrumentData.pipStep));

        if (price !== null) {
            currentLivePrice.current = price;
            let change = "0.0";
            let changeClass = "text-mid-text";
            if (lastPrice.current) {
                const diff = price - lastPrice.current;
                change = diff.toFixed(decimalPlaces);
                changeClass = diff > 0 ? "text-success" : "text-danger";
            }
            setLivePriceInfo({ price: price.toFixed(decimalPlaces), change, changeClass, isMock: false });
            lastPrice.current = price;
        } else {
            setLivePriceInfo({ price: instrumentData.mockPrice.toFixed(decimalPlaces), change: 'N/A', changeClass: 'text-mid-text', isMock: true });
            currentLivePrice.current = instrumentData.mockPrice;
        }
    };
    
    const handleInstrumentChange = (newInstrument: string) => {
        setInstrument(newInstrument);
        const instrumentProps = instrumentDefinitions[newInstrument];
        const decimalPlaces = Math.ceil(-Math.log10(instrumentProps.pipStep));
        const price = instrumentProps.mockPrice;
        const slPrice = price - (instrumentProps.pipStep * 50);

        setEntryPrice(price.toFixed(decimalPlaces));
        setStopLossPrice(slPrice.toFixed(decimalPlaces));
        setLivePriceInfo(null);
        lastPrice.current = null;
    };

    const useCurrentPriceFor = (field: 'entry' | 'sl') => {
        if (currentLivePrice.current) {
            const instrumentProps = instrumentDefinitions[instrument];
            const decimalPlaces = Math.ceil(-Math.log10(instrumentProps.pipStep));
            const priceStr = currentLivePrice.current.toFixed(decimalPlaces);
            if(field === 'entry') setEntryPrice(priceStr);
            else setStopLossPrice(priceStr);
        }
    };
    
    const calculateAutoSL = (pipDistance: number) => {
        const entry = parseFloat(entryPrice);
        if (isNaN(entry)) return;
        
        const instrumentProps = instrumentDefinitions[instrument];
        const decimalPlaces = Math.ceil(-Math.log10(instrumentProps.pipStep));
        const slPrice = entry - (pipDistance * instrumentProps.pipStep);
        setStopLossPrice(slPrice.toFixed(decimalPlaces));
    };

    const handleAiAnalysis = async () => {
        if (!canUseAiAnalysis) {
            setAiInsight({ text: "You have reached your daily limit for entry analysis. Please upgrade for more.", sources: [] });
            return;
        }
        if (!lastCalculatedResults.current || lastCalculatedResults.current.isError) {
            return;
        }
        setIsAILoading(true);
        setAiInsight(null);
        try {
            incrementUsage('entryAnalysis');
            const results = lastCalculatedResults.current;
            const tradeDirection = results.entryPrice > results.stopLossPrice ? "BUY (LONG)" : "SELL (SHORT)";
            const instrumentProps = instrumentDefinitions[results.instrument];
            const decimalPlaces = Math.max(2, Math.ceil(-Math.log10(instrumentProps.pipStep)));
            const pipDistance = Math.abs(results.entryPrice - results.stopLossPrice);
            const tpPrice = tradeDirection.includes("BUY") 
                ? parseFloat((results.entryPrice + (pipDistance * 2)).toFixed(decimalPlaces))
                : parseFloat((results.entryPrice - (pipDistance * 2)).toFixed(decimalPlaces));
            const analysis = await getTradeAnalysis({ ...results, tradeDirection, tpPrice, timeFrame });
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
        const intervalId = setInterval(fetchLivePrice, 30000);
        fetchLivePrice();
        return () => clearInterval(intervalId);
    }, [instrument]);
    
    useEffect(() => {
        const handler = setTimeout(() => calculateLotSize(), 200);
        return () => clearTimeout(handler);
    }, [accountBalance, riskPercentage, entryPrice, stopLossPrice, instrument, accountCurrency, crossRate]);
    
    const renderAiInsight = () => {
        if (!aiInsight) {
             return <p className="text-mid-text">Click the button above to get comprehensive market analysis including technical levels, risk assessment, and calculated Take-Profit targets.</p>;
        }
        const formattedText = aiInsight.text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-dark-text">$1</strong>')
            .replace(/\n/g, '<br />');
        return (
            <SecureContent>
                <div dangerouslySetInnerHTML={{ __html: formattedText }} className="text-dark-text text-sm" />
                {aiInsight.sources && aiInsight.sources.length > 0 && (
                    <div className="mt-4 pt-2 border-t border-light-gray">
                        <strong className="text-xs text-primary">Sources:</strong>
                        <ul className="list-disc ml-4 text-xs text-mid-text">
                            {aiInsight.sources.map((source: any, index: number) => (
                                <li key={index}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline">{source.title}</a></li>
                            ))}
                        </ul>
                    </div>
                )}
            </SecureContent>
        );
    };

    return (
        <div className="p-4 sm:p-8 bg-light-bg min-h-screen flex items-center justify-center font-sans">
            <div className="w-full max-w-2xl">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-primary tracking-tight">Trade Companion</h1>
                    <h2 className="text-2xl font-semibold mt-1 text-dark-text">Position & Lot Size Calculator</h2>
                    <p className="text-sm text-mid-text mt-2">Accurate risk management with live market data</p>
                    <p className="text-lg font-semibold text-primary mt-4">{getGreeting(user.name)}</p>
                </header>
                
                <div className="bg-light-surface p-6 rounded-xl space-y-6 shadow-sm border border-light-gray">

                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-dark-text">Account Currency</label>
                            <select value={accountCurrency} onChange={e => setAccountCurrency(e.target.value)} className="w-full p-2.5 rounded-lg bg-light-hover border-light-gray text-dark-text focus:ring-primary focus:border-primary">
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="JPY">JPY - Japanese Yen</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-dark-text">Account Balance</label>
                            <input type="number" value={accountBalance} onChange={e => setAccountBalance(e.target.value)} className="w-full p-2.5 rounded-lg bg-light-hover border-light-gray text-dark-text focus:ring-primary focus:border-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-dark-text">Risk Percentage (%)</label>
                            <input type="number" value={riskPercentage} step="0.1" min="0.1" onChange={e => setRiskPercentage(e.target.value)} className="w-full p-2.5 rounded-lg bg-light-hover border-light-gray text-dark-text focus:ring-primary focus:border-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-dark-text">Trading Instrument</label>
                            <div className="flex space-x-2">
                                <select value={instrument} onChange={e => handleInstrumentChange(e.target.value)} className="flex-1 p-2.5 rounded-lg bg-light-hover border-light-gray text-dark-text focus:ring-primary focus:border-primary">
                                    <optgroup label="Major Forex Pairs">
                                        {Object.keys(instrumentDefinitions).filter(k => instrumentDefinitions[k].isForex).slice(0, 7).map(key => <option key={key} value={key}>{key}</option>)}
                                    </optgroup>
                                    <optgroup label="Minor/Cross Forex Pairs">
                                         {Object.keys(instrumentDefinitions).filter(k => instrumentDefinitions[k].isForex).slice(7).map(key => <option key={key} value={key}>{key}</option>)}
                                    </optgroup>
                                    <optgroup label="Metals & Crypto">
                                        {Object.keys(instrumentDefinitions).filter(k => !instrumentDefinitions[k].isForex).map(key => <option key={key} value={key}>{key}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                            {livePriceInfo && (
                                <div className="text-xs text-mid-text mt-1">
                                    {livePriceInfo.isMock ? 'Mock: ' : 'Live: '} 
                                    <span className="font-semibold text-dark-text">{livePriceInfo.price}</span>
                                    <span className={`ml-2 ${livePriceInfo.changeClass}`}>{livePriceInfo.change !== 'N/A' && (parseFloat(livePriceInfo.change) >= 0 ? '↗' : '↘')} {livePriceInfo.change}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    <hr className="border-light-gray"/>

                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-dark-text">Entry Price</label>
                            <div className="flex">
                                <input type="number" value={entryPrice} step={instrumentDefinitions[instrument]?.pipStep} onChange={e => setEntryPrice(e.target.value)} className="w-full p-2.5 rounded-l-lg bg-light-hover border-light-gray text-dark-text focus:ring-primary focus:border-primary" required />
                                <button onClick={() => useCurrentPriceFor('entry')} className="text-xs bg-success text-white px-3 py-1 rounded-r-lg hover:bg-green-600 font-semibold">
                                    LIVE
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-dark-text">Stop-Loss Price</label>
                            <div className="flex">
                                <input type="number" value={stopLossPrice} step={instrumentDefinitions[instrument]?.pipStep} onChange={e => setStopLossPrice(e.target.value)} className="w-full p-2.5 rounded-l-lg bg-light-hover border-light-gray text-dark-text focus:ring-primary focus:border-primary" required />
                                <button onClick={() => useCurrentPriceFor('sl')} className="text-xs bg-danger text-white px-3 py-1 rounded-r-lg hover:bg-red-600 font-semibold">
                                    LIVE
                                </button>
                            </div>
                        </div>
                        <div className="sm:col-span-2 bg-light-hover p-3 rounded-lg border border-light-gray">
                            <label className="block text-sm font-medium mb-2 text-dark-text">Auto Stop-Loss (pips from entry)</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[10, 20, 30, 50].map(pips => (
                                    <button key={pips} onClick={() => calculateAutoSL(pips)} className="bg-secondary/80 text-white py-1 px-3 rounded text-sm hover:bg-secondary">
                                        {pips} pips
                                    </button>
                                ))}
                            </div>
                        </div>
                        {isCrossRateVisible && (
                             <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-dark-text">
                                    Conversion Rate ({`${instrumentDefinitions[instrument]?.quoteCurrency}/${accountCurrency}`})
                                </label>
                                <input type="number" value={crossRate} onChange={e => setCrossRate(e.target.value)} className="mt-1 block w-full bg-light-hover border-accent text-accent rounded-md shadow-sm p-2 focus:ring-accent focus:border-accent" />
                            </div>
                        )}
                    </section>
                    
                    <hr className="border-light-gray"/>
                    
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-primary">Calculation Results</h3>
                        {error && <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm border border-danger/20 text-center">{error}</div>}
                        {results && !error && (
                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-light-hover border-l-4 border-danger">
                                    <p className="text-xs text-mid-text">Max Risk Amount</p>
                                    <p className="text-lg font-bold text-dark-text">${results.riskAmount}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-light-hover border-l-4 border-warning">
                                    <p className="text-xs text-mid-text">Stop-Loss Distance</p>
                                    <p className="text-lg font-bold text-dark-text">{results.stopLossPips} pips</p>
                                </div>
                                 <div className="p-3 rounded-lg col-span-2 bg-primary/10 border-l-4 border-primary">
                                    <p className="text-sm text-mid-text">Required Lot Size</p>
                                    <p className="text-3xl font-extrabold text-primary">{results.standardLots} lots</p>
                                    <p className="text-sm mt-1 text-mid-text">({results.positionSizeUnits} units)</p>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="space-y-3 bg-light-hover p-4 rounded-xl border border-light-gray">
                         <div className="flex justify-between items-center flex-wrap gap-2">
                            <h3 className="text-lg font-bold text-accent">Ask Olapete</h3>
                            <div className="text-sm bg-light-surface px-3 py-1 rounded-full border border-light-gray">
                               Daily Analyses Left: <span className="font-bold text-primary">{usageInfo.limit === 'unlimited' ? 'Unlimited' : `${Math.max(0, usageInfo.limit - usageInfo.count)} / ${usageInfo.limit}`}</span>
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1 text-dark-text">Target Analysis Time Frame</label>
                             <select value={timeFrame} onChange={e => setTimeFrame(e.target.value)} className="w-full p-2.5 rounded-lg bg-light-surface border-light-gray text-dark-text focus:ring-primary focus:border-primary">
                                <option>Daily</option><option>4 Hours</option><option>1 Hour</option><option>15 Minutes</option><option>5 Minutes</option><option>1 Minute</option>
                             </select>
                        </div>
                        <button onClick={handleAiAnalysis} disabled={isAILoading || !canUseAiAnalysis || !results || error !== null} className="w-full py-2.5 px-4 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition duration-150 flex items-center justify-center disabled:bg-light-gray disabled:text-mid-text disabled:cursor-not-allowed">
                            {isAILoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    {`Analyzing on ${timeFrame}...`}
                                </>
                            ) : "Get In-depth Analysis on your entry"}
                        </button>
                        <div className="text-mid-text text-sm mt-2 mb-4 min-h-[8rem] bg-light-surface p-3 rounded-lg border border-light-gray">
                           {renderAiInsight()}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default LotSizeCalculatorPage;