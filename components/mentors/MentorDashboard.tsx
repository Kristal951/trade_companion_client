

import React, { useState } from 'react';
import { User, MentorSubscriber, MentorPost, Mentor } from '../../types';
import Icon from '../ui/Icon';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_SUBSCRIBERS: MentorSubscriber[] = [
    { id: 1, name: 'Alice Johnson', avatar: 'https://picsum.photos/seed/sub1/100', subscribedDate: '2023-10-15', status: 'Active' },
    { id: 2, name: 'Bob Williams', avatar: 'https://picsum.photos/seed/sub2/100', subscribedDate: '2023-10-12', status: 'Active' },
    { id: 3, name: 'Charlie Brown', avatar: 'https://picsum.photos/seed/sub3/100', subscribedDate: '2023-10-01', status: 'Cancelled' },
    { id: 4, name: 'Diana Miller', avatar: 'https://picsum.photos/seed/sub4/100', subscribedDate: '2023-09-28', status: 'Active' },
];

const earningsData = [
  { name: 'Jan', earnings: 2400 },
  { name: 'Feb', earnings: 2800 },
  { name: 'Mar', earnings: 3500 },
  { name: 'Apr', earnings: 3200 },
  { name: 'May', earnings: 4100 },
  { name: 'Jun', earnings: 4250 },
];

const MOCK_MENTOR_POSTS: MentorPost[] = [
    { id: 1, type: 'signal', title: 'EUR/USD Long Opportunity', content: 'Price has pulled back to a key support level and formed a bullish engulfing candle on the 4H chart. Looking for a move higher towards the previous resistance.', timestamp: '2023-10-27T14:00:00Z', signalDetails: { instrument: 'EUR/USD', direction: 'BUY', entry: '1.0760', stopLoss: '1.0730', takeProfit: '1.0820' }},
    { id: 2, type: 'analysis', title: 'Weekly Market Outlook', content: 'This week, I am watching the FOMC meeting on Wednesday. Expect volatility in USD pairs.', timestamp: '2023-10-26T09:00:00Z' },
];

const MOCK_MENTOR_PROFILE: Mentor = {
    id: 1, name: 'John Doe', avatar: 'https://picsum.photos/seed/userJD/200', experience: 10, profitRatio: 85, roi: 25.5, instruments: ['EUR/USD', 'GBP/JPY', 'USD/CAD'], price: 99, strategy: 'Specializing in high-frequency scalping strategies and market psychology based on order flow.', certifications: [{name: 'Pro Trader Certification', url: '#'}, {name: 'MyFxBook Verified History', url: '#'}]
};

const PostCard: React.FC<{ post: MentorPost }> = ({ post }) => {
    const isSignal = post.type === 'signal';
    const isBuy = post.signalDetails?.direction === 'BUY';
    return (
        <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold">{post.title}</h4>
                    <p className="text-xs text-gray-400">{new Date(post.timestamp).toLocaleString()}</p>
                </div>
                {isSignal && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {post.signalDetails?.instrument} {post.signalDetails?.direction}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-300 mt-2">{post.content}</p>
        </div>
    );
};


interface MentorDashboardProps {
    user: User;
}

const MentorDashboard: React.FC<MentorDashboardProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'publisher' | 'profile'>('publisher');
    const [postType, setPostType] = useState<'analysis' | 'signal'>('analysis');
    const [posts, setPosts] = useState<MentorPost[]>(MOCK_MENTOR_POSTS);

    // Profile state
    const [mentorProfile, setMentorProfile] = useState<Mentor>(MOCK_MENTOR_PROFILE);
    const [newInstrument, setNewInstrument] = useState('');
    const [newCertName, setNewCertName] = useState('');

    const handlePublish = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const newPost: MentorPost = {
            id: Date.now(),
            type: postType,
            title: formData.get('title') as string,
            content: formData.get('content') as string,
            timestamp: new Date().toISOString(),
        };

        if (postType === 'signal') {
            newPost.signalDetails = {
                instrument: formData.get('instrument') as string,
                direction: formData.get('direction') as 'BUY' | 'SELL',
                entry: formData.get('entry') as string,
                stopLoss: formData.get('stopLoss') as string,
                takeProfit: formData.get('takeProfit') as string,
            };
        }
        setPosts(prev => [newPost, ...prev]);
        form.reset();
        setPostType('analysis'); // Reset to default post type
    };

    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically send the data to a backend
        alert("Profile updated successfully! (Frontend demo)");
    };

    const handleAddInstrument = () => {
        if (newInstrument && !mentorProfile.instruments.includes(newInstrument.toUpperCase())) {
            setMentorProfile(prev => ({
                ...prev,
                instruments: [...prev.instruments, newInstrument.toUpperCase()]
            }));
            setNewInstrument('');
        }
    };
    
     const handleRemoveInstrument = (instrumentToRemove: string) => {
        setMentorProfile(prev => ({
            ...prev,
            instruments: prev.instruments.filter(inst => inst !== instrumentToRemove)
        }));
    };
    
    const handleAddCertification = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCertName) {
             setMentorProfile(prev => ({
                ...prev,
                certifications: [...(prev.certifications || []), { name: newCertName, url: '#' }]
            }));
            setNewCertName('');
            // also clear the file input if it existed
        }
    };

     const handleRemoveCertification = (certNameToRemove: string) => {
        setMentorProfile(prev => ({
            ...prev,
            certifications: prev.certifications?.filter(cert => cert.name !== certNameToRemove)
        }));
    };

    const PublisherView = () => (
        <div className="space-y-8">
            <div className="bg-surface p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Publish Exclusive Content</h3>
                <div className="flex border-b border-gray-700 mb-4">
                    <button onClick={() => setPostType('analysis')} className={`py-2 px-4 font-semibold transition-colors ${postType === 'analysis' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-white'}`}>Analysis / Update</button>
                    <button onClick={() => setPostType('signal')} className={`py-2 px-4 font-semibold transition-colors ${postType === 'signal' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-white'}`}>Trade Signal</button>
                </div>
                <form onSubmit={handlePublish} className="space-y-4">
                    <input type="text" name="title" placeholder={postType === 'signal' ? "Signal Title (e.g., EUR/USD Long Setup)" : "Title for your analysis or update"} required className="w-full bg-gray-800 border-gray-600 rounded-md p-3 focus:ring-primary focus:border-primary" />
                    
                    {postType === 'signal' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <select name="instrument" defaultValue="EUR/USD" required className="w-full bg-gray-800 border-gray-600 rounded-md p-3 focus:ring-primary focus:border-primary">
                                <option>EUR/USD</option><option>GBP/USD</option><option>USD/JPY</option><option>XAU/USD</option>
                            </select>
                            <select name="direction" defaultValue="BUY" required className="w-full bg-gray-800 border-gray-600 rounded-md p-3 focus:ring-primary focus:border-primary">
                                <option>BUY</option><option>SELL</option>
                            </select>
                            <input type="number" step="any" name="entry" placeholder="Entry Price" required className="w-full bg-gray-800 border-gray-600 rounded-md p-3 focus:ring-primary focus:border-primary" />
                            <input type="number" step="any" name="stopLoss" placeholder="Stop Loss" required className="w-full bg-gray-800 border-gray-600 rounded-md p-3 focus:ring-primary focus:border-primary" />
                            <input type="number" step="any" name="takeProfit" placeholder="Take Profit" required className="w-full bg-gray-800 border-gray-600 rounded-md p-3 focus:ring-primary focus:border-primary" />
                        </div>
                    )}

                    <textarea name="content" rows={5} placeholder={postType === 'signal' ? "Reasoning behind the trade, chart analysis, etc..." : "Share your insights, trade ideas, or educational content..."} required className="w-full bg-gray-800 border-gray-600 rounded-md p-3 focus:ring-primary focus:border-primary"></textarea>
                        <div className="flex justify-between items-center">
                        <label htmlFor="attachment" className="text-sm text-primary hover:underline cursor-pointer flex items-center">
                            <Icon name="paperclip" className="w-5 h-5 mr-2" /> Attach Chart or File
                            <input type="file" id="attachment" name="attachment" className="hidden" />
                        </label>
                        <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg">Publish</button>
                        </div>
                </form>
            </div>
            <div className="bg-surface p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Your Recent Posts</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {posts.length > 0 ? posts.map(post => <PostCard key={post.id} post={post} />) : <p className="text-center text-gray-500 py-8">You haven't published any posts yet.</p>}
                </div>
            </div>
        </div>
    );

    const ProfileSettingsView = () => (
         <div className="bg-surface p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-6">Profile & Settings</h3>
            <form onSubmit={handleProfileUpdate} className="space-y-8">
                 <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-primary">Basic Information</h4>
                     <div>
                        <label className="block text-sm font-medium text-gray-300">Display Name</label>
                        <input type="text" value={mentorProfile.name} onChange={e => setMentorProfile(p => ({ ...p, name: e.target.value }))} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300">Trading Strategy / Bio</label>
                        <textarea rows={4} value={mentorProfile.strategy} onChange={e => setMentorProfile(p => ({ ...p, strategy: e.target.value }))} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"></textarea>
                    </div>
                </div>

                <div className="space-y-4">
                     <h4 className="text-lg font-semibold text-primary">Traded Instruments</h4>
                     <div className="flex flex-wrap gap-2 p-2 bg-gray-800 rounded-md min-h-[40px]">
                        {mentorProfile.instruments.map(inst => (
                            <span key={inst} className="flex items-center bg-primary/20 text-primary text-sm font-semibold px-3 py-1 rounded-full">
                                {inst}
                                <button type="button" onClick={() => handleRemoveInstrument(inst)} className="ml-2 text-primary/70 hover:text-white"> &times; </button>
                            </span>
                        ))}
                     </div>
                     <div className="flex gap-2">
                        <input type="text" value={newInstrument} onChange={e => setNewInstrument(e.target.value)} placeholder="e.g., US30" className="flex-grow bg-gray-800 border-gray-600 rounded-md p-2 shadow-sm focus:ring-primary focus:border-primary" />
                        <button type="button" onClick={handleAddInstrument} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Add</button>
                     </div>
                </div>

                 <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-primary">Certifications & Proof</h4>
                    <div className="space-y-2">
                         {mentorProfile.certifications?.map((cert, index) => (
                             <div key={index} className="flex items-center justify-between bg-gray-800 p-2 rounded-md text-sm">
                                <span>{cert.name}</span>
                                <button type="button" onClick={() => handleRemoveCertification(cert.name)} className="text-red-400 hover:text-red-300 font-bold px-2">Remove</button>
                             </div>
                         ))}
                    </div>
                    <form onSubmit={handleAddCertification} className="flex gap-2 flex-wrap">
                        <input type="text" value={newCertName} onChange={e => setNewCertName(e.target.value)} placeholder="Certification Name (e.g., Prop Firm Payout)" required className="flex-grow bg-gray-800 border-gray-600 p-2 rounded-md shadow-sm focus:ring-primary focus:border-primary" />
                         <label htmlFor="cert-upload" className="cursor-pointer bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                            <Icon name="paperclip" className="w-4 h-4 mr-2" /> Upload
                        </label>
                        <input id="cert-upload" type="file" className="hidden"/>
                        <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg">Add</button>
                    </form>
                </div>

                <div className="pt-4 border-t border-gray-700">
                    <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg">Save All Changes</button>
                </div>
            </form>
         </div>
    );

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Mentor Dashboard</h1>
            
            <div className="flex border-b border-gray-700 mb-8">
                <button onClick={() => setActiveTab('publisher')} className={`py-2 px-6 font-semibold transition-colors ${activeTab === 'publisher' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-white'}`}>Content Publisher</button>
                <button onClick={() => setActiveTab('profile')} className={`py-2 px-6 font-semibold transition-colors ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-white'}`}>Profile & Settings</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                   {activeTab === 'publisher' ? <PublisherView /> : <ProfileSettingsView />}
                </div>

                <div className="space-y-8">
                    <div className="bg-surface p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-4">Key Metrics</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center"><span className="text-gray-400">Active Subscribers</span> <strong className="text-lg">42</strong></div>
                            <div className="flex justify-between items-center"><span className="text-gray-400">Monthly Earnings</span> <strong className="text-lg text-green-400">$4,158</strong></div>
                            <div className="flex justify-between items-center"><span className="text-gray-400">30-Day Churn</span> <strong className="text-lg text-red-400">5.2%</strong></div>
                        </div>
                    </div>

                    <div className="bg-surface p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-4">Recent Subscribers</h3>
                        <div className="space-y-4">
                            {MOCK_SUBSCRIBERS.map(sub => (
                                 <div key={sub.id} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <img src={sub.avatar} alt={sub.name} className="w-10 h-10 rounded-full mr-3" />
                                        <div>
                                            <p className="font-semibold">{sub.name}</p>
                                            <p className="text-xs text-gray-400">Joined: {sub.subscribedDate}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${sub.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {sub.status}
                                     </span>
                                 </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MentorDashboard;