
import React, { useState, useMemo } from 'react';
import { Mentor, RecentSignal, Payout } from '../../types';
import Icon from '../ui/Icon';

const MOCK_RECENT_SIGNALS_FOR_PAYOUT: RecentSignal[] = [
    { id: 'p1', instrument: 'EUR/USD', direction: 'BUY', entry: '1.07', stopLoss: '1.068', takeProfit: '1.074', outcome: 'win', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), pnl: 400 },
    { id: 'p2', instrument: 'GBP/JPY', direction: 'SELL', entry: '185', stopLoss: '185.5', takeProfit: '184', outcome: 'win', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), pnl: 1000 },
    { id: 'p3', instrument: 'XAU/USD', direction: 'BUY', entry: '2300', stopLoss: '2290', takeProfit: '2320', outcome: 'win', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), pnl: 2000 },
    { id: 'p4', instrument: 'USD/CAD', direction: 'SELL', entry: '1.36', stopLoss: '1.363', takeProfit: '1.355', outcome: 'loss', timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), pnl: -300 },
    { id: 'p5', instrument: 'BTC/USD', direction: 'BUY', entry: '65000', stopLoss: '64000', takeProfit: '67000', outcome: 'win', timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), pnl: 2000 },
    { id: 'p6', instrument: 'ETH/USD', direction: 'SELL', entry: '3500', stopLoss: '3600', takeProfit: '3300', outcome: 'win', timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), pnl: 200 },
];

const MOCK_MENTOR_PROFILE: Mentor = {
    id: 1, name: 'John Doe', avatar: 'https://picsum.photos/seed/userJD/200', experience: 10, profitRatio: 85, roi: 25.5, instruments: ['EUR/USD', 'GBP/JPY', 'USD/CAD'], price: 99, strategy: 'Specializing in high-frequency scalping strategies and market psychology based on order flow.', certifications: [{name: 'Pro Trader Certification', url: '#'}, {name: 'MyFxBook Verified History', url: '#'}],
    recentSignals: MOCK_RECENT_SIGNALS_FOR_PAYOUT,
    earnings: {
        currentBalance: 4158,
        lifetime: 12500
    },
    payoutHistory: [
        { id: 'po_1', amount: 2500, dateRequested: '2023-09-01T10:00:00Z', dateCompleted: '2023-09-03T10:00:00Z', status: 'Completed', method: 'Bank Transfer' },
        { id: 'po_2', amount: 3000, dateRequested: '2023-08-01T10:00:00Z', dateCompleted: '2023-08-03T10:00:00Z', status: 'Completed', method: 'Bank Transfer' }
    ],
    identity: {
        idDocument: { status: 'Not Submitted' },
        addressDocument: { status: 'Not Submitted' },
        livenessCheck: { status: 'Not Submitted' },
        overallStatus: 'Not Submitted',
    }
};

interface MentorPayoutsPageProps {
    showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const MentorPayoutsPage: React.FC<MentorPayoutsPageProps> = ({ showToast }) => {
    const [payoutAmount, setPayoutAmount] = useState('');
    const mentorProfile = MOCK_MENTOR_PROFILE; // In a real app, fetch this

    const winRateCheck = useMemo(() => {
        const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
        const recentSignals = mentorProfile.recentSignals?.filter(s => new Date(s.timestamp) > fourWeeksAgo) || [];
        
        if (recentSignals.length === 0) {
            return { rate: 0, passed: false, trades: 0 };
        }
        const wins = recentSignals.filter(s => s.outcome === 'win').length;
        const rate = Math.round((wins / recentSignals.length) * 100);
        return { rate, passed: rate >= 70, trades: recentSignals.length };
    }, [mentorProfile.recentSignals]);

    // Assume identity is verified for the mock if "Verified" in status, or manually toggle logic
    // For consistency with the split, let's assume if status is 'Verified' it works.
    // However, the initial mock state is 'Not Submitted'.
    // Since verification happens in Settings now, let's assume for this view it reads the status.
    const idVerified = mentorProfile.identity?.overallStatus === 'Verified'; 
    const isEligible = winRateCheck.passed && idVerified;

    const handleRequestPayout = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(payoutAmount);
        if (isNaN(amount) || amount <= 0 || amount > mentorProfile.earnings!.currentBalance) {
            showToast("Please enter a valid amount.", "error");
            return;
        }
        showToast(`Payout request for $${amount.toFixed(2)} submitted!`, 'success');
    }
    
    const EligibilityCheckItem: React.FC<{label: string; isMet: boolean; details: string}> = ({label, isMet, details}) => (
        <div className={`flex items-start p-3 rounded-lg ${isMet ? 'bg-success/10' : 'bg-danger/10'}`}>
            <Icon name={isMet ? 'check' : 'close'} className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${isMet ? 'text-success' : 'text-danger'}`} />
            <div>
                <p className={`font-semibold ${isMet ? 'text-success' : 'text-danger'}`}>{label}</p>
                <p className="text-xs text-mid-text">{details}</p>
            </div>
        </div>
    )

    return (
        <div className="p-8 bg-light-bg min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-dark-text">Payouts & Earnings</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray text-center">
                            <p className="text-sm text-mid-text">Available for Payout</p>
                            <p className="text-4xl font-bold text-primary">${mentorProfile.earnings?.currentBalance.toLocaleString()}</p>
                        </div>
                        <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray text-center">
                            <p className="text-sm text-mid-text">Lifetime Earnings</p>
                            <p className="text-4xl font-bold text-dark-text">${mentorProfile.earnings?.lifetime.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray space-y-4">
                        <h3 className="text-xl font-bold text-dark-text">Payout Request</h3>
                        <div className="space-y-3 p-4 bg-light-hover rounded-lg border border-light-gray">
                            <h4 className="font-semibold text-dark-text">Eligibility Checklist</h4>
                            <EligibilityCheckItem 
                                label="Signal Performance"
                                isMet={winRateCheck.passed}
                                details={`Your 4-week win rate is ${winRateCheck.rate}% (${winRateCheck.trades} trades). Minimum 70% required.`}
                            />
                            <EligibilityCheckItem 
                                label="Identity Verification"
                                isMet={idVerified}
                                details={`Your ID verification status is: ${mentorProfile.identity?.overallStatus}. 'Verified' status required (Check Settings).`}
                            />
                        </div>
                        <form onSubmit={handleRequestPayout} className="space-y-3 pt-4 border-t border-light-gray">
                            <div>
                                <label className="block text-sm font-medium text-dark-text mb-1">Payout Amount ($)</label>
                                <div className="flex">
                                    <input type="number" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} placeholder="0.00" disabled={!isEligible} className="w-full bg-light-hover border-light-gray rounded-l-md p-3 focus:ring-primary focus:border-primary text-dark-text disabled:bg-light-gray/50" />
                                    <button type="button" onClick={() => setPayoutAmount(String(mentorProfile.earnings?.currentBalance))} disabled={!isEligible} className="bg-secondary text-white px-4 font-semibold rounded-r-md hover:bg-gray-600 disabled:bg-light-gray disabled:cursor-not-allowed">Max</button>
                                </div>
                            </div>
                            <button type="submit" disabled={!isEligible} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg disabled:bg-light-gray disabled:cursor-not-allowed">
                                {isEligible ? "Request Payout" : "Ineligible for Payout"}
                            </button>
                            <p className="text-xs text-mid-text text-center">Payouts are processed via Bank Transfer within 3-5 business days.</p>
                        </form>
                    </div>
                </div>

                <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray h-fit">
                    <h3 className="text-xl font-bold text-dark-text mb-4">Payout History</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                           <thead className="text-xs text-mid-text uppercase bg-light-hover">
                               <tr>
                                   <th className="px-4 py-2">Date</th>
                                   <th className="px-4 py-2">Amount</th>
                                   <th className="px-4 py-2">Status</th>
                               </tr>
                           </thead>
                           <tbody className="text-dark-text">
                               {mentorProfile.payoutHistory?.map(payout => (
                                   <tr key={payout.id} className="border-b border-light-gray">
                                       <td className="px-4 py-3">{new Date(payout.dateRequested).toLocaleDateString()}</td>
                                       <td className="px-4 py-3 font-semibold">${payout.amount.toLocaleString()}</td>
                                       <td className="px-4 py-3">
                                           <span className={`px-2 py-1 text-xs font-bold rounded-full ${payout.status === 'Completed' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                                               {payout.status}
                                           </span>
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                        </table>
                    </div>
                 </div>
            </div>
        </div>
    );
}

export default MentorPayoutsPage;
