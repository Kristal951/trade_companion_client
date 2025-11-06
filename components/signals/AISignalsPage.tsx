import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Signal, User, TradeRecord, PlanName } from '../../types';
import Icon from '../ui/Icon';
import { useUsageTracker } from '../../hooks/useUsageTracker';

// --- HELPER & CHILD COMPONENTS ---

const TradeCard: React.FC<{ trade: TradeRecord; }> = ({ trade }) => {
    const isBuy = trade.type === 'BUY';
    const pnlColor = trade.status === 'win' ? 'text-success' : 'text-danger';
    return (
        <div className={`bg-light-surface p-4 rounded-xl shadow-sm border border-l-4 ${trade.status === 'active' ? 'border-info' : trade.status === 'win' ? 'border-success' : 'border-danger'} animate-fade-in-right`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-dark-text">{trade.instrument} - <span className={isBuy ? 'text-success' : 'text-danger'}>{trade.type}</span></h4>
                    <p className="text-xs text-mid-text">Taken: {new Date(trade.dateTaken).toLocaleString()}</p>
                    {trade.status !== 'active' && <p className="text-xs text-mid-text">Closed: {new Date(trade.dateClosed!).toLocaleString()}</p>}
                </div>
                {trade.status !== 'active' && trade.pnl !== undefined ? (
                    <div className="text-right">
                        <p className="text-sm font-semibold">P&L</p>
                        <p className={`text-lg font-bold ${pnlColor}`}>{trade.status === 'win' ? '+' : '-'}${Math.abs(trade.pnl).toFixed(2)}</p>
                    </div>
                ) : (
                    <span className="text-sm font-semibold text-info bg-info/10 px-2 py-1 rounded-full">Monitoring...</span>
                )}
            </div>
             <div className="grid grid-cols-3 gap-2 text-center my-3 text-sm">
                <div><p className="text-mid-text">Entry</p><p className="font-semibold text-dark-text">{trade.entryPrice.toFixed(5)}</p></div>
                <div><p className="text-mid-text">Stop Loss</p><p className="font-semibold text-dark-text">{trade.stopLoss.toFixed(5)}</p></div>
                <div><p className="text-mid-text">Take Profit</p><p className="font-semibold text-dark-text">{trade.takeProfit.toFixed(5)}</p></div>
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
interface AISignalsPageProps {
    user: User;
    showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
    activeTrades: TradeRecord[];
    tradeHistory: TradeRecord[];
}


const AISignalsPage: React.FC<AISignalsPageProps> = ({ user, showToast, activeTrades, tradeHistory }) => {
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [areSettingsLocked, setAreSettingsLocked] = useState(false);

    const { getUsageInfo } = useUsageTracker(user);
    const signalUsage = getUsageInfo('aiSignal');

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem(`tradeSettings_${user.email}`);
        return saved ? JSON.parse(saved) : { balance: '10000', risk: '1.0', currency: 'USD' };
    });
    
    const [filterInstrument, setFilterInstrument] = useState('all');
    const [filterTime, setFilterTime] = useState('all');
    
    useEffect(() => {
        const initialEquity = localStorage.getItem(`initialEquity_${user.email}`);
        if (initialEquity) {
            setAreSettingsLocked(true);
        }
    }, [user.email]);


    // --- Settings & Data Persistence ---

    const handleSettingsChange = (field: 'balance' | 'risk' | 'currency', value: string) => {
        setSettings((prev: any) => ({ ...prev, [field]: value }));
    };

    const saveSettings = () => {
        const EQUITY_KEY = `currentEquity_${user.email}`;
        localStorage.setItem(`tradeSettings_${user.email}`, JSON.stringify(settings));
        if (!localStorage.getItem(`initialEquity_${user.email}`)) {
            localStorage.setItem(EQUITY_KEY, settings.balance);
            localStorage.setItem(`initialEquity_${user.email}`, settings.balance);
            setAreSettingsLocked(true);
            showToast('Initial trade settings saved and locked!', 'success');
        } else {
            showToast('Settings are already locked for this subscription period.', 'info');
        }
    };
    
    // --- Filtering & Memoization ---

    const filteredHistory = useMemo(() => {
        return tradeHistory
            .filter(trade => {
                if (filterInstrument === 'all') return true;
                return trade.instrument === filterInstrument;
            })
            .filter(trade => {
                if (filterTime === 'all') return true;
                const tradeDate = new Date(trade.dateClosed!);
                const now = new Date();
                if (filterTime === 'today') {
                    return tradeDate.toDateString() === now.toDateString();
                }
                if (filterTime === '7d') {
                    const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
                    return tradeDate > sevenDaysAgo;
                }
                return true;
            });
    }, [tradeHistory, filterInstrument, filterTime]);

    const instrumentOptions = useMemo(() => ['all', ...new Set(tradeHistory.map(t => t.instrument))], [tradeHistory]);

    // --- Render Logic ---

    const renderContent = () => {
        if (user.subscribedPlan === PlanName.Free) {
            return <UpgradePrompt />;
        }

        switch (activeTab) {
            case 'active':
                return activeTrades.length > 0 ? (
                    <div className="space-y-4">{activeTrades.map(t => <TradeCard key={t.id} trade={t} />)}</div>
                ) : <EmptyState icon="analytics" title="No Active Trades" message="The AI is currently monitoring the markets for setups." />;
            case 'history':
                return (
                    <>
                        <div className="flex gap-4 mb-4">
                            <select value={filterInstrument} onChange={e => setFilterInstrument(e.target.value)} className="bg-light-surface border-light-gray rounded-md p-2 focus:ring-primary focus:border-primary text-dark-text">
                                {instrumentOptions.map(opt => <option key={opt} value={opt}>{opt === 'all' ? 'All Instruments' : opt}</option>)}
                            </select>
                            <select value={filterTime} onChange={e => setFilterTime(e.target.value)} className="bg-light-surface border-light-gray rounded-md p-2 focus:ring-primary focus:border-primary text-dark-text">
                                <option value="all">All Time</option><option value="today">Today</option><option value="7d">Last 7 Days</option>
                            </select>
                        </div>
                        {filteredHistory.length > 0 ? (
                            <div className="space-y-4">{filteredHistory.map(t => <TradeCard key={t.id} trade={t} />)}</div>
                        ) : <EmptyState icon="history" title="No Trades in History" message="Your closed trades will be journaled here." />}
                    </>
                );
            default:
                return <EmptyState icon="signals" title="Awaiting new signals..." message="Validated trade setups will appear here in real-time." />;
        }
    };

    const UpgradePrompt = () => (
         <div className="text-center py-16 text-mid-text bg-light-surface rounded-lg shadow-sm border border-light-gray">
            <Icon name="signals" className="w-12 h-12 mx-auto mb-4 text-primary/50" />
            <p className="font-semibold text-xl text-dark-text">Unlock Automated AI Signals</p>
            <p className="text-md mb-6">Your Free plan includes unlimited use of the Lot Size Calculator and Education Hub.</p>
            <button className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
                Upgrade to a Paid Plan to Receive Signals
            </button>
        </div>
    );

    const EmptyState: React.FC<{icon: string; title: string; message: string}> = ({icon, title, message}) => (
        <div className="text-center py-16 text-mid-text bg-light-surface rounded-lg shadow-sm border border-light-gray">
            <Icon name={icon} className="w-12 h-12 mx-auto mb-4 text-primary/50" />
            <p className="font-semibold">{title}</p>
            <p className="text-sm">{message}</p>
        </div>
    );
    
    const TabButton: React.FC<{tabName: 'active' | 'history'; label: string; count: number}> = ({tabName, label, count}) => (
        <button onClick={() => setActiveTab(tabName)} className={`py-2 px-4 font-semibold transition-colors flex items-center gap-2 ${activeTab === tabName ? 'border-b-2 border-primary text-primary' : 'text-mid-text hover:text-dark-text'}`}>
            {label} <span className="text-xs bg-light-hover px-2 py-0.5 rounded-full">{count}</span>
        </button>
    );

    return (
        <div className="p-4 sm:p-8 bg-light-bg min-h-screen">
            <div className="mb-8 p-6 bg-light-surface rounded-xl shadow-sm border border-light-gray">
                <h2 className="text-xl font-semibold mb-4 text-primary">Your Trade Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-dark-text mb-1">Account Balance</label>
                        <input type="number" value={settings.balance} onChange={(e) => handleSettingsChange('balance', e.target.value)} disabled={areSettingsLocked} className="w-full bg-light-hover border-light-gray rounded-md p-2 focus:ring-primary focus:border-primary text-dark-text disabled:bg-light-gray/50 disabled:cursor-not-allowed" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-dark-text mb-1">Currency</label>
                         <select value={settings.currency} onChange={(e) => handleSettingsChange('currency', e.target.value)} disabled={areSettingsLocked} className="w-full bg-light-hover border-light-gray rounded-md p-2 focus:ring-primary focus:border-primary text-dark-text disabled:bg-light-gray/50 disabled:cursor-not-allowed">
                            <option>USD</option><option>EUR</option><option>GBP</option>
                         </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-text mb-1">Risk per Trade (%)</label>
                        <input type="number" step="0.1" value={settings.risk} onChange={(e) => handleSettingsChange('risk', e.target.value)} disabled={areSettingsLocked} className="w-full bg-light-hover border-light-gray rounded-md p-2 focus:ring-primary focus:border-primary text-dark-text disabled:bg-light-gray/50 disabled:cursor-not-allowed" />
                    </div>
                    <button onClick={saveSettings} disabled={areSettingsLocked} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-md disabled:bg-light-gray disabled:cursor-not-allowed">
                        {areSettingsLocked ? 'Settings Locked' : 'Save Settings'}
                    </button>
                    {areSettingsLocked && (
                        <div className="md:col-span-4 text-sm text-info bg-info/10 p-3 rounded-md border border-info/20 flex items-center mt-2">
                            <Icon name="info" className="w-5 h-5 mr-2 flex-shrink-0" />
                            Your settings are locked to ensure accurate performance tracking for this subscription period.
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex justify-between items-center mb-4 border-b border-light-gray flex-wrap">
                 <div className="flex">
                    <TabButton tabName="active" label="Active Trades" count={activeTrades.length} />
                    <TabButton tabName="history" label="Trade History" count={tradeHistory.length} />
                 </div>
                <div className="flex items-center space-x-4 p-2">
                    {user.subscribedPlan !== PlanName.Free && (
                        <p className="text-sm text-mid-text">AI Signals Today: <span className="font-bold text-primary">{signalUsage.count} / {signalUsage.limit}</span></p>
                    )}
                     <p className="text-sm text-mid-text">AI Monitoring: 
                        <span className={`font-bold ml-1 ${user.subscribedPlan !== PlanName.Free ? 'text-success' : 'text-mid-text'}`}>
                           {user.subscribedPlan !== PlanName.Free ? 'Active' : 'Inactive'}
                        </span>
                     </p>
                </div>
            </div>

            {renderContent()}
        </div>
    );
};

export default AISignalsPage;