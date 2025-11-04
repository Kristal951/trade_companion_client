


import React, { useState } from 'react';
import { DashboardView, User, EducationArticle, PlanName, Mentor, MentorPost } from '../../types';
import Icon from '../ui/Icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AISignalsPage from '../signals/AISignalsPage';
import LotSizeCalculatorPage from '../calculator/LotSizeCalculatorPage';
import MentorDashboard from '../mentors/MentorDashboard';
import MentorProfilePage from '../mentors/MentorProfilePage';

// --- MOCK DATA ---
const signalPerformanceData = [
  { name: 'Jan', profit: 400, loss: 240 },
  { name: 'Feb', profit: 300, loss: 139 },
  { name: 'Mar', profit: 200, loss: 980 },
  { name: 'Apr', profit: 278, loss: 390 },
  { name: 'May', profit: 189, loss: 480 },
  { name: 'Jun', profit: 239, loss: 380 },
];

const winLossData = [
  { name: 'Wins', value: 78, fill: '#198754' },
  { name: 'Losses', value: 22, fill: '#DC3545' },
];

const MOCK_MENTOR_POSTS: MentorPost[] = [
    { id: 1, type: 'signal', title: 'EUR/USD Long Opportunity', content: 'Price has pulled back to a key support level and formed a bullish engulfing candle on the 4H chart. Looking for a move higher towards the previous resistance.', timestamp: '2023-10-27T14:00:00Z', signalDetails: { instrument: 'EUR/USD', direction: 'BUY', entry: '1.0760', stopLoss: '1.0730', takeProfit: '1.0820' }},
    { id: 2, type: 'analysis', title: 'Weekly Market Outlook', content: 'This week, I am watching the FOMC meeting on Wednesday. Expect volatility in USD pairs. The DXY is approaching a major resistance zone, a rejection could see a relief rally in majors like EUR/USD and GBP/USD.', timestamp: '2023-10-26T09:00:00Z' },
    { id: 3, type: 'analysis', title: 'Risk Management Tip', content: 'Never risk more than 1-2% of your account on a single trade. Consistency in risk is key to long-term survival and profitability in the markets. Stay disciplined!', timestamp: '2023-10-25T11:00:00Z' },
];


const MOCK_MENTORS_LIST: Mentor[] = [
    { id: 1, name: 'John Forex', avatar: 'https://picsum.photos/seed/mentor1/200', experience: 10, profitRatio: 85, roi: 25.5, instruments: ['EUR/USD', 'GBP/JPY', 'USD/CAD'], price: 99, strategy: 'Specializing in high-frequency scalping strategies and market psychology based on order flow.', posts: MOCK_MENTOR_POSTS, certifications: [{name: 'Pro Trader Certification', url: '#'}, {name: 'MyFxBook Verified History', url: '#'}] },
    { id: 2, name: 'Anna Indicators', avatar: 'https://picsum.photos/seed/mentor2/200', experience: 8, profitRatio: 92, roi: 31.2, instruments: ['XAU/USD', 'US30', 'NASDAQ'], price: 149, strategy: 'Master of technical analysis using custom-developed indicators and algorithmic trading systems.', posts: [], certifications: [{name: 'Funded Prop Firm Payout', url: '#'}] },
    { id: 3, name: 'Mike Waves', avatar: 'https://picsum.photos/seed/mentor3/200', experience: 12, profitRatio: 88, roi: 28.0, instruments: ['BTC/USD', 'ETH/USD'], price: 129, strategy: 'Expert in Elliot Wave theory and harmonic patterns, primarily focusing on the cryptocurrency markets.', posts: [] },
    { id: 4, name: 'Sarah Trends', avatar: 'https://picsum.photos/seed/mentor4/200', experience: 7, profitRatio: 90, roi: 29.8, instruments: ['NASDAQ', 'OIL', 'SPX500'], price: 119, strategy: 'Trend-following expert with a focus on macroeconomic analysis and long-term position trades.', posts: [], certifications: [{name: 'Certified Market Technician (CMT)', url: '#'}] },
];

const MOCK_SIGNALS = [
    { instrument: 'EUR/USD', type: 'BUY', entryPrice: 1.0750, stopLoss: 1.0720, takeProfit: 1.0800, reasoning: 'Strong bullish momentum observed on the 4H chart, breaking key resistance.', timestamp: '2023-10-27T10:30:00Z' },
    { instrument: 'GBP/JPY', type: 'SELL', entryPrice: 182.30, stopLoss: 182.80, takeProfit: 181.50, reasoning: 'Bearish divergence spotted on the RSI, coupled with a double top formation.', timestamp: '2023-10-27T09:15:00Z' },
];

const MOCK_EDUCATION_ARTICLES: EducationArticle[] = [
    { id: 1, category: "Forex Basics", title: "What is Forex Trading?", summary: "An introduction to the foreign exchange market, how it works, and key terminology for beginners.", difficulty: "Beginner" },
    { id: 2, category: "Forex Basics", title: "Understanding Pips, Lots, and Leverage", summary: "Learn the fundamental concepts of pips, lot sizes, and how leverage can amplify your trades.", difficulty: "Beginner" },
    { id: 3, category: "Technical Analysis", title: "Mastering Support and Resistance", summary: "Identify key price levels on charts to make better entry and exit decisions.", difficulty: "Intermediate" },
    { id: 4, category: "Technical Analysis", title: "A Guide to Candlestick Patterns", summary: "Recognize common candlestick patterns to predict future market movements.", difficulty: "Intermediate" },
    { id: 5, category: "Risk Management", title: "The Importance of Stop-Loss Orders", summary: "Protect your capital by learning how to properly set and manage stop-loss orders.", difficulty: "Beginner" },
    { id: 6, category: "Risk Management", title: "Position Sizing for Success", summary: "Calculate the optimal position size for any trade to manage risk effectively.", difficulty: "Advanced" },
    { id: 7, category: "Using Our Signals", title: "How to Interpret AI Signals", summary: "A step-by-step guide on how to read our AI-generated signals and incorporate them into your strategy.", difficulty: "Beginner" },
];

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

// --- SUB-COMPONENTS for different views ---

const DashboardOverview: React.FC<{user: User}> = ({user}) => (
    <div>
        <h1 className="text-3xl font-bold mb-6">Welcome back, {user.name}!</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface p-6 rounded-lg">
                <h3 className="text-gray-400">Total P/L (Month)</h3>
                <p className="text-2xl font-bold text-green-500">+$1,250.75</p>
            </div>
            <div className="bg-surface p-6 rounded-lg">
                <h3 className="text-gray-400">Win Rate</h3>
                <p className="text-2xl font-bold text-blue-400">78%</p>
            </div>
            <div className="bg-surface p-6 rounded-lg">
                <h3 className="text-gray-400">Active Signals</h3>
                <p className="text-2xl font-bold">3</p>
            </div>
            <div className="bg-surface p-6 rounded-lg">
                <h3 className="text-gray-400">Mentor Subscriptions</h3>
                <p className="text-2xl font-bold">1</p>
            </div>
        </div>
        <div className="bg-surface p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Recent AI Signals</h3>
            <div className="space-y-4">
                {MOCK_SIGNALS.slice(0, 2).map((signal, i) => (
                    <div key={i} className="bg-gray-800 p-4 rounded-md flex justify-between items-center">
                        <div>
                            <span className={`font-bold ${signal.type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>{signal.type}</span>
                            <span className="ml-4 font-semibold">{signal.instrument}</span>
                        </div>
                        <div className="text-sm">
                            <p>Entry: {signal.entryPrice}</p>
                        </div>
                        <button className="text-primary hover:underline text-sm">View Details</button>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const AnalyticsPage: React.FC = () => (
    <div>
        <h1 className="text-3xl font-bold mb-6">Analytics</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface p-6 rounded-lg h-96">
                <h3 className="text-xl font-bold mb-4">Monthly Performance</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={signalPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }} />
                        <Legend />
                        <Line type="monotone" dataKey="profit" stroke="#10B981" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="loss" stroke="#EF4444" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-surface p-6 rounded-lg h-96">
                <h3 className="text-xl font-bold mb-4">Win/Loss Ratio</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={winLossData} layout="vertical">
                         <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={80} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }} />
                        <Bar dataKey="value" barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
);

const MentorPage: React.FC<{ onViewMentor: (mentor: Mentor) => void }> = ({ onViewMentor }) => (
    <div>
        <h1 className="text-3xl font-bold mb-6">Mentors</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {MOCK_MENTORS_LIST.map(mentor => (
                <div key={mentor.id} className="bg-surface rounded-lg overflow-hidden p-6 flex flex-col transition-shadow hover:shadow-lg hover:shadow-primary/20">
                    <div className="flex-grow">
                        <div className="flex items-center mb-4">
                            <img src={mentor.avatar} alt={mentor.name} className="w-20 h-20 rounded-full mr-4 border-2 border-primary" />
                            <div>
                                <h4 className="text-xl font-bold">{mentor.name}</h4>
                                <p className="text-gray-400">{mentor.experience} Yrs Exp.</p>
                            </div>
                        </div>
                        <div className="flex justify-between text-sm my-4 bg-gray-800 p-3 rounded-md">
                            <div className="text-center">
                                <p className="text-gray-400">Profit Ratio</p>
                                <p className="font-bold text-green-400">{mentor.profitRatio}%</p>
                            </div>
                             <div className="text-center">
                                <p className="text-gray-400">Price</p>
                                <p className="font-bold">${mentor.price}/mo</p>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">Instruments: {mentor.instruments.join(', ')}</p>
                    </div>
                    <button onClick={() => onViewMentor(mentor)} className="w-full mt-auto bg-primary hover:bg-primary-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        View Profile & Posts
                    </button>
                </div>
            ))}
        </div>
    </div>
);

const EducationPage: React.FC = () => {
    const categories = [...new Set(MOCK_EDUCATION_ARTICLES.map(a => a.category))];

    const difficultyColor = (difficulty: string) => {
        switch(difficulty) {
            case 'Beginner': return 'text-green-400 bg-green-500/10';
            case 'Intermediate': return 'text-yellow-400 bg-yellow-500/10';
            case 'Advanced': return 'text-red-400 bg-red-500/10';
            default: return 'text-gray-400 bg-gray-500/10';
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Education Hub</h1>
            <p className="text-lg text-gray-400 mb-8">Empower your trading with knowledge. Explore our curated guides and tutorials.</p>
            <div className="space-y-12">
                {categories.map(category => (
                    <div key={category}>
                        <h2 className="text-2xl font-semibold mb-4 border-l-4 border-primary pl-4">{category}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {MOCK_EDUCATION_ARTICLES.filter(a => a.category === category).map(article => (
                                <div key={article.id} className="bg-surface p-6 rounded-lg flex flex-col justify-between hover:shadow-lg hover:shadow-primary/20 transition-shadow">
                                    <div>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${difficultyColor(article.difficulty)}`}>{article.difficulty}</span>
                                        <h3 className="text-xl font-bold mt-3 mb-2">{article.title}</h3>
                                        <p className="text-gray-400 text-sm mb-4">{article.summary}</p>
                                    </div>
                                    <button className="flex items-center text-primary font-semibold text-sm hover:underline mt-4">
                                        Read More <Icon name="arrowRight" className="w-4 h-4 ml-2" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const SettingsPage: React.FC<{user: User, onViewChange: (view: DashboardView) => void}> = ({user, onViewChange}) => (
     <div>
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <div className="bg-surface p-8 rounded-lg max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="space-y-4">
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <button onClick={() => onViewChange('edit_profile')} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded">Edit Profile</button>
            </div>
             <h2 className="text-xl font-semibold mt-8 mb-4">Notifications</h2>
             <div className="flex items-center">
                <input type="checkbox" id="telegram" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                <label htmlFor="telegram" className="ml-2 block text-sm">Telegram Signal Notifications</label>
             </div>
        </div>
    </div>
);

const BillingPage: React.FC<{user: User}> = ({user}) => (
    <div>
        <h1 className="text-3xl font-bold mb-6">Billing</h1>
        <div className="bg-surface p-8 rounded-lg max-w-2xl">
             <h2 className="text-xl font-semibold mb-4">Current Plan: <span className="text-primary">{user.subscribedPlan}</span></h2>
             <p className="text-gray-400 mb-6">Your plan renews on November 27, 2024.</p>
             <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4">Change Plan</button>
             <button className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel Subscription</button>
        </div>
    </div>
);

const ApplyMentorPage: React.FC = () => {
    const [stage, setStage] = useState<'form' | 'submitted' | 'challenge'>('form');

    const renderContent = () => {
        switch (stage) {
            case 'form':
                return (
                    <div className="bg-surface p-8 rounded-lg max-w-2xl">
                        <p className="text-gray-400 mb-6">Share your expertise and earn by mentoring other traders. Fill out the form below to begin your application.</p>
                        <form onSubmit={(e) => { e.preventDefault(); setStage('submitted'); }} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Link to Trading Performance (e.g., MyFxBook)</label>
                                <input type="url" placeholder="https://..." required className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">What is your core risk management philosophy?</label>
                                <textarea rows={3} required placeholder="e.g., I never risk more than 1% per trade..." className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">How do you handle a losing streak?</label>
                                <textarea rows={3} required placeholder="e.g., I take a break, analyze my trades, and reduce my position size..." className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary"></textarea>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300">Describe your primary trading strategy.</label>
                                <textarea rows={4} required placeholder="e.g., I focus on supply and demand zones on the 4H chart..." className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary"></textarea>
                            </div>
                            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg">Submit Application</button>
                        </form>
                    </div>
                );
            case 'submitted':
                return (
                    <div className="bg-surface p-8 rounded-lg max-w-2xl text-center">
                        <Icon name="check" className="w-16 h-16 mx-auto text-primary mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Application Received!</h2>
                        <p className="text-gray-400 mb-6">Thank you. The final step is to prove your skills in a controlled environment.</p>
                        <div className="bg-gray-900 p-6 rounded-lg text-left mb-6">
                            <h3 className="font-semibold text-lg mb-2">Final Step: The Demo Account Challenge</h3>
                            <p className="text-gray-400 text-sm">To complete your verification, you must grow a <strong className="text-white">$10,000</strong> demo account by <strong className="text-green-400">10%</strong> within <strong className="text-white">30 days</strong>, while keeping the drawdown below <strong className="text-red-400">5%</strong>.</p>
                        </div>
                        <button onClick={() => setStage('challenge')} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg">
                            Receive Demo Credentials & Start Challenge
                        </button>
                    </div>
                );
            case 'challenge':
                 return (
                    <div className="bg-surface p-8 rounded-lg max-w-2xl">
                        <h2 className="text-2xl font-bold mb-2 text-center">Demo Challenge Active</h2>
                        <p className="text-gray-400 mb-6 text-center">Your credentials are below. We will monitor your progress and notify you upon completion.</p>
                        <div className="bg-gray-800 p-4 rounded-lg space-y-2 mb-6 text-sm">
                            <p><strong>Account Number:</strong> MENTOR-DEMO-112358</p>
                            <p><strong>Password:</strong> yJ1aW8pZGFzMTIz</p>
                            <p><strong>Server:</strong> TradeCompanion-Demo</p>
                        </div>
                         <h3 className="font-semibold text-lg mb-4">Live Progress</h3>
                         <div className="space-y-4">
                             <div>
                                 <div className="flex justify-between text-sm mb-1">
                                     <span>Profit Target (+$1,000)</span>
                                     <span className="font-semibold text-green-400">$0 / $1,000</span>
                                 </div>
                                 <div className="w-full bg-gray-700 rounded-full h-2.5">
                                     <div className="bg-green-500 h-2.5 rounded-full" style={{width: '0%'}}></div>
                                 </div>
                             </div>
                             <div>
                                 <div className="flex justify-between text-sm mb-1">
                                     <span>Max Drawdown (&lt; -$500)</span>
                                     <span className="font-semibold text-red-400">$0 / -$500</span>
                                 </div>
                                 <div className="w-full bg-gray-700 rounded-full h-2.5">
                                     <div className="bg-red-500 h-2.5 rounded-full" style={{width: '0%'}}></div>
                                 </div>
                             </div>
                             <div className="text-center bg-gray-800 p-3 rounded-md">
                                 <p className="text-sm text-gray-400">Time Remaining</p>
                                 <p className="text-xl font-bold">30 Days</p>
                             </div>
                         </div>
                    </div>
                );
        }
    }

    return (
    <div>
        <h1 className="text-3xl font-bold mb-6">Become a Mentor</h1>
        {renderContent()}
    </div>
    );
};
const EditProfilePage: React.FC<{user: User}> = ({user}) => {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setAvatarPreview(event.target!.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    return (
     <div>
        <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
        <div className="bg-surface p-8 rounded-lg max-w-2xl">
            <form className="space-y-6">
                <div className="flex items-center space-x-4">
                    <img src={avatarPreview || `https://i.pravatar.cc/150?u=${user.email}`} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                    <div>
                        <label htmlFor="avatar-upload" className="cursor-pointer bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded">
                            Change Picture
                        </label>
                        <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        <p className="text-xs text-gray-400 mt-2">JPG, GIF or PNG. 1MB max.</p>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Name</label>
                    <input type="text" defaultValue={user.name} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Email Address</label>
                    <input type="email" defaultValue={user.email} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Telegram Number</label>
                    <input type="tel" defaultValue={user.telegramNumber} placeholder="+1234567890" className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary" />
                </div>
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded">Save Changes</button>
            </form>
        </div>
    </div>
)};


// --- MAIN DASHBOARD COMPONENT ---

const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout, activeView, onViewChange }) => {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);
  
  const handleViewMentor = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    onViewChange('mentor_profile');
  };

  const handleBackToMentors = () => {
    setSelectedMentor(null);
    onViewChange('mentors');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardOverview user={user}/>;
      case 'ai_signals': return <AISignalsPage />;
      case 'mentors': return <MentorPage onViewMentor={handleViewMentor} />;
      case 'analytics': return <AnalyticsPage />;
      case 'education': return <EducationPage />;
      case 'lot_size_calculator': return <LotSizeCalculatorPage user={user} />;
      case 'settings': return <SettingsPage user={user} onViewChange={onViewChange} />;
      case 'billing': return <BillingPage user={user} />;
      case 'apply_mentor': return <ApplyMentorPage />;
      case 'edit_profile': return <EditProfilePage user={user} />;
      case 'mentor_dashboard': return <MentorDashboard user={user} />;
      case 'mentor_profile': return selectedMentor ? <MentorProfilePage mentor={selectedMentor} onBack={handleBackToMentors} /> : <MentorPage onViewMentor={handleViewMentor} />;
      default: return <DashboardOverview user={user}/>;
    }
  };

  const NavLink: React.FC<{ view: DashboardView; icon: string; label: string }> = ({ view, icon, label }) => (
    <button
      onClick={() => onViewChange(view)}
      className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${activeView === view ? 'bg-primary text-white' : 'hover:bg-surface'}`}
    >
      <Icon name={icon} className="w-6 h-6 mr-3" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-background text-on-surface">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 p-4 flex flex-col border-r border-gray-800">
        <h1 className="text-2xl font-bold text-primary px-2 mb-8">Trade Companion</h1>
        <nav className="flex-1 space-y-2">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold px-4 mb-2">Navigation</p>
            <NavLink view="dashboard" icon="dashboard" label="Dashboard" />
            <NavLink view="ai_signals" icon="signals" label="AI Signals" />
            <NavLink view="mentors" icon="mentors" label="Mentors" />
            <NavLink view="education" icon="education" label="Education" />
            <NavLink view="analytics" icon="analytics" label="Analytics" />
          </div>
          <div className="pt-4">
            <p className="text-xs text-gray-500 uppercase font-semibold px-4 mb-2">Tools</p>
            <NavLink view="lot_size_calculator" icon="calculator" label="Lot Size Calculator" />
          </div>
           {user.isMentor && (
            <div className="pt-4">
              <p className="text-xs text-gray-500 uppercase font-semibold px-4 mb-2">Mentor Area</p>
              <NavLink view="mentor_dashboard" icon="mentors" label="Mentor Dashboard" />
            </div>
          )}
        </nav>
        <div className="relative">
          <button
            onClick={() => setAccountMenuOpen(!isAccountMenuOpen)}
            className="w-full flex items-center p-3 rounded-lg hover:bg-surface"
          >
            <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`} alt="User Avatar" className="w-8 h-8 rounded-full object-cover" />
            <div className="text-left ml-3 flex-1">
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <Icon name="chevronDown" className={`w-5 h-5 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {isAccountMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface rounded-lg shadow-xl border border-gray-700 w-full py-2 z-10">
              <a onClick={() => { onViewChange('settings'); setAccountMenuOpen(false); }} href="#" className="flex items-center px-4 py-2 text-sm hover:bg-gray-800"><Icon name="settings" className="w-5 h-5 mr-2"/>Settings</a>
              <a onClick={() => { onViewChange('billing'); setAccountMenuOpen(false); }} href="#" className="flex items-center px-4 py-2 text-sm hover:bg-gray-800"><Icon name="billing" className="w-5 h-5 mr-2"/>Billing</a>
              <a onClick={() => { onViewChange('edit_profile'); setAccountMenuOpen(false); }} href="#" className="flex items-center px-4 py-2 text-sm hover:bg-gray-800"><Icon name="edit" className="w-5 h-5 mr-2"/>Edit Profile</a>
              <hr className="border-gray-700 my-1" />
              <a onClick={() => { onViewChange('apply_mentor'); setAccountMenuOpen(false); }} href="#" className="flex items-center px-4 py-2 text-sm hover:bg-gray-800"><Icon name="apply" className="w-5 h-5 mr-2"/>Become a Mentor</a>
              <a onClick={onLogout} href="#" className="flex items-center px-4 py-2 text-sm hover:bg-gray-800 text-red-400"><Icon name="logout" className="w-5 h-5 mr-2"/>Logout</a>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default DashboardPage;