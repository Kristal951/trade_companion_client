import React, { useState } from 'react';
import { generateForexSignal } from '../../services/geminiService';
import { Signal } from '../../types';
import Icon from '../ui/Icon';

const SignalCard: React.FC<{ signal: Signal }> = ({ signal }) => {
    const isBuy = signal.type === 'BUY';
    return (
        <div className="bg-surface p-6 rounded-lg border-l-4 border-primary/50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{signal.instrument}</h3>
                <span className={`px-4 py-1 text-sm font-bold rounded-full ${isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {signal.type}
                </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                    <p className="text-sm text-gray-400">Entry Price</p>
                    <p className="text-lg font-semibold">{signal.entryPrice.toFixed(4)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">Stop Loss</p>
                    <p className="text-lg font-semibold text-red-400">{signal.stopLoss.toFixed(4)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">Take Profit</p>
                    <p className="text-lg font-semibold text-green-400">{signal.takeProfit.toFixed(4)}</p>
                </div>
            </div>
            <div>
                <p className="text-sm text-gray-400 mb-1">Reasoning:</p>
                <p className="text-sm bg-gray-800 p-3 rounded-md">{signal.reasoning}</p>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-right">Generated: {new Date(signal.timestamp).toLocaleString()}</p>
        </div>
    );
};

const AISignalsPage: React.FC = () => {
    const [instrument, setInstrument] = useState('EUR/USD');
    const [riskLevel, setRiskLevel] = useState('Medium');
    const [signalType, setSignalType] = useState('any');
    const [signals, setSignals] = useState<Signal[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateSignal = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await generateForexSignal(instrument, riskLevel, signalType);
            const jsonStr = response.text.trim();
            const newSignalData = JSON.parse(jsonStr);

            const newSignal: Signal = {
                ...newSignalData,
                timestamp: new Date().toISOString(),
            };
            setSignals(prev => [newSignal, ...prev]);

        } catch (err) {
            console.error(err);
            setError("Failed to generate signal. The AI model might be unavailable. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold">AI Signals</h1>
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                    <select
                        value={instrument}
                        onChange={(e) => setInstrument(e.target.value)}
                        className="bg-surface border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        <option>EUR/USD</option>
                        <option>GBP/USD</option>
                        <option>USD/JPY</option>
                        <option>XAU/USD</option>
                        <option>US30</option>
                    </select>
                     <select
                        value={riskLevel}
                        onChange={(e) => setRiskLevel(e.target.value)}
                        className="bg-surface border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        <option value="Low" disabled>Low Risk (Premium)</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="High">High Risk</option>
                    </select>
                     <select
                        value={signalType}
                        onChange={(e) => setSignalType(e.target.value)}
                        className="bg-surface border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        <option value="any">Any</option>
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                    </select>
                    <button
                        onClick={handleGenerateSignal}
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-md flex items-center disabled:bg-gray-500"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </>
                        ) : (
                            <>
                                <Icon name="signals" className="w-5 h-5 mr-2" />
                                Generate New Signal
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            <div className="bg-yellow-500/10 text-yellow-400 text-sm p-3 rounded-md border border-yellow-500/20 mb-6">
                <p><strong>Pro Plan Feature:</strong> You have access to Medium and High risk signals. <a href="#" className="font-bold underline hover:text-yellow-300">Upgrade to Premium</a> for Low Risk (scalping) signals and advanced customization.</p>
            </div>

            {error && <div className="bg-red-500/20 text-red-400 p-4 rounded-md mb-4">{error}</div>}

            <div className="space-y-6">
                {signals.length === 0 && !isLoading && (
                    <div className="text-center py-16 text-gray-500 bg-surface rounded-lg">
                        <p>No signals generated yet.</p>
                        <p>Select your preferences and click "Generate New Signal" to start.</p>
                    </div>
                )}
                {signals.map((signal, index) => (
                    <SignalCard key={index} signal={signal} />
                ))}
            </div>
        </div>
    );
};

export default AISignalsPage;