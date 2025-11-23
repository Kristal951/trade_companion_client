
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Signal, User, TradeRecord, PlanName, DashboardView } from '../../types';
import Icon from '../ui/Icon';
import { useUsageTracker } from '../../hooks/useUsageTracker';

// --- HELPER & CHILD COMPONENTS ---

const TradeCard: React.FC<{ trade: TradeRecord; }> = ({ trade }) => {
    const isBuy = trade.type === 'BUY';
    const pnlColor = trade.status === 'win' ? 'text-success' : 'text-danger';
    
    // Determine confidence color
    let confColor = 'text-mid-text';
    if (trade.confidence >= 85) confColor = 'text-success';
    else if (trade.confidence >= 75) confColor = 'text-info';
    else confColor = 'text-warning';

    return (
        <div className={`bg-light-surface p-4 rounded-xl shadow-sm border border-l-4 ${trade.status === 'active' ? 'border-info' : trade.status === 'win' ? 'border-success' : 'border-danger'} animate-fade-in-right`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-dark-text">{trade.instrument} - <span className={isBuy ? 'text-success' : 'text-danger'}>{trade.type}</span></h4>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-mid-text">Taken: {new Date(trade.dateTaken).toLocaleString()}</p>
                        {/* REQUIREMENT: Display Signal Confidence */}
                        <span className={`text-xs font-bold border px-1.5 rounded ${confColor} border-current opacity-80`}>
                            {trade.confidence}% Conf.
                        </span>
                    </div>
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
             <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-light-gray text-sm">
                <div className="text-center bg-light-hover p-2 rounded-md">
                    <p className="text-xs text-mid-text">Entry</p>
                    <p className="font-semibold text-dark-text">{trade.entryPrice.toFixed(5)}</p>
                </div>
                <div className="text-center bg-light-hover p-2 rounded-md">
                    <p className="text-xs text-mid-text">Stop Loss</p>
                    <p className="font-semibold text-danger">{trade.stopLoss.toFixed(5)}</p>
                </div>
                <div className="text-center bg-light-hover p-2 rounded-md">
                    <p className="text-xs text-mid-text">Take Profit</p>
                    <p className="font-semibold text-success">{trade.takeProfit.toFixed(5)}</p>
                </div>
                {trade.lotSize && (
                    <div className="text-center bg-primary/10 p-2 rounded-md">
                        <p className="text-xs text-primary/80">Lot Size</p>
                        <p className="font-semibold text-primary">{trade.lotSize.toFixed(2)}</p>
                    </div>
                )}
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
    onViewChange: (view: DashboardView) => void;
}


const AISignalsPage: React.FC<AISignalsPageProps> = ({ user, showToast, activeTrades, tradeHistory, onViewChange }) => {
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [areSettingsLocked, setAreSettingsLocked] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const { getUsageInfo } = useUsageTracker(user);
    const signalUsage = getUsageInfo('aiSignal');

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem(`tradeSettings_${user.email}`);
        return saved ? JSON.parse(saved) : { balance: '10000', risk: '1.0', currency: 'USD' };
    });
    
    // --- FILTERS ---
    const [filterInstrument, setFilterInstrument] = useState('all');
    const [filterTime, setFilterTime] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all'); // NEW: Status Filter
    
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

    const handleSaveClick = () => {
        if (areSettingsLocked) {
            showToast('Settings are already locked for this subscription period.', 'info');
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSave = () => {
        const EQUITY_KEY = `currentEquity_${user.email}`;
        localStorage.setItem(`tradeSettings_${user.email}`, JSON.stringify(settings));
        localStorage.setItem(EQUITY_KEY, settings.balance);
        localStorage.setItem(`initialEquity_${user.email}`, settings.balance);
        setAreSettingsLocked(true);
        showToast('Initial trade settings saved and locked!', 'success');
        setIsConfirmModalOpen(false); // Close modal after saving
    };
    
    // --- Filtering & Memoization ---

    const filteredHistory = useMemo(() => {
        return tradeHistory
            .filter(trade => {
                if (filterInstrument === 'all') return true;
                return trade.instrument === filterInstrument;
            })
            .filter(trade => {
                if (filterStatus === 'all') return true;
                return trade.status === filterStatus;
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
                if (filterTime === '30d') {
                    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
                    return tradeDate > thirtyDaysAgo;
                }
                return true;
            });
    }, [tradeHistory, filterInstrument, filterTime, filterStatus]);

    const instrumentOptions = useMemo(() => ['all', ...new Set(tradeHistory.map(t => t.instrument))], [tradeHistory]);

    // --- Render Logic ---
    const CTraderStatus = () => {
        const isProOrPremium = user.subscribedPlan === PlanName.Pro || user.subscribedPlan === PlanName.Premium;
        const isConnected = user.cTraderConfig?.isConnected;
        const isAutoEnabled = user.cTraderConfig?.autoTradeEnabled;

        if (!isProOrPremium) {
            return (
                 <div className="mb-6 p-4 bg-accent/10 rounded-lg border border-accent/20 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="font-bold text-accent">Unlock Auto-Trading with cTrader</h3>
                        <p className="text-sm text-accent/80">Upgrade to Pro or Premium to automatically execute AI signals on your cTrader account.</p>
                    </div>
                    <button onClick={() => onViewChange('settings')} className="bg-accent text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                        View Plans
                    </button>
                </div>
            );
        }
    
        if (!isConnected) {
            return (
                <div className="mb-6 p-4 bg-info/10 rounded-lg border border-info/20 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="font-bold text-info">Automate Your Trading</h3>
                        <p className="text-sm text-info/80">Connect your cTrader account to have AI signals executed automatically.</p>
                    </div>
                    <button onClick={() => onViewChange('settings')} className="bg-info text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                        Connect to cTrader
                    </button>
                </div>
            );
        }
    
        if (isConnected && !isAutoEnabled) {
             return (
                <div className="mb-6 p-4 bg-warning/10 rounded-lg border border-warning/20 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="font-bold text-warning">Auto-Trading is Disabled</h3>
                        <p className="text-sm text-warning/80">Your cTrader account is connected but auto-trading is turned off.</p>
                    </div>
                    <button onClick={() => onViewChange('settings')} className="bg-warning text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors">
                        Enable in Settings
                    </button>
                </div>
            );
        }
        
        return (
            <div className="mb-6 p-4 bg-success/10 rounded-lg border border-success/20 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h3 className="font-bold text-success flex items-center"><Icon name="check" className="w-5 h-5 mr-2"/> cTrader Connected & Auto-Trading Active</h3>
                    <p className="text-sm text-success/80">AI signals will be automatically executed on account: {user.cTraderConfig?.accountId}.</p>
                </div>
                <button onClick={() => onViewChange('settings')} className="text-sm text-primary hover:underline font-semibold">
                    Manage Settings
                </button>
            </div>
        );
    };

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
                        <div className="flex flex-wrap gap-4 mb-4 bg-light-surface p-4 rounded-lg border border-light-gray shadow-sm">
                            <div className="flex flex-col">
                                <label className="text-xs text-mid-text mb-1">Instrument</label>
                                <select value={filterInstrument} onChange={e => setFilterInstrument(e.target.value)} className="bg-light-hover border border-light-gray rounded-md p-2 focus:ring-primary focus:border-primary text-dark-text text-sm">
                                    <option value="all">All Instruments</option>
                                    {instrumentOptions.filter(o => o !== 'all').map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs text-mid-text mb-1">Status</label>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-light-hover border border-light-gray rounded-md p-2 focus:ring-primary focus:border-primary text-dark-text text-sm">
                                    <option value="all">All Outcomes</option>
                                    <option value="win">Wins</option>
                                    <option value="loss">Losses</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs text-mid-text mb-1">Date Range</label>
                                <select value={filterTime} onChange={e => setFilterTime(e.target.value)} className="bg-light-hover border border-light-gray rounded-md p-2 focus:ring-primary focus:border-primary text-dark-text text-sm">
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="7d">Last 7 Days</option>
                                    <option value="30d">Last 30 Days</option>
                                </select>
                            </div>
                        </div>
                        {filteredHistory.length > 0 ? (
                            <div className="space-y-4">{filteredHistory.map(t => <TradeCard key={t.id} trade={t} />)}</div>
                        ) : <EmptyState icon="history" title="No Trades Found" message="No trades match your current filters." />}
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
            {isConfirmModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-right">
                    <div className="bg-light-surface rounded-lg shadow-xl p-6 max-w-md w-full m-4">
                        <div className="flex items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-warning/10 sm:mx-0 sm:h-10 sm:w-10">
                                <Icon name="danger" className="h-6 w-6 text-warning" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-bold text-dark-text">Confirm & Lock Settings</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-mid-text">
                                        Are you sure? The AI will use this balance and risk profile to calculate all signals and analytics for your current subscription period.
                                        <strong className="block mt-2 text-dark-text">This cannot be changed later.</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                            <button
                                type="button"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:w-auto sm:text-sm"
                                onClick={handleConfirmSave}
                            >
                                Confirm & Lock
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-light-gray shadow-sm px-4 py-2 bg-light-surface text-base font-medium text-mid-text hover:bg-light-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
                                onClick={() => setIsConfirmModalOpen(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    <button onClick={handleSaveClick} disabled={areSettingsLocked} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-md disabled:bg-light-gray disabled:cursor-not-allowed">
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
            
            <CTraderStatus />

            <div className="flex justify-between items-center mb-4 border-b border-light-gray flex-wrap">
                 <div className="flex">
                    <TabButton tabName="active" label="Active Trades" count={activeTrades.length} />
                    <TabButton tabName="history" label="Trade History" count={filteredHistory.length} />
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
