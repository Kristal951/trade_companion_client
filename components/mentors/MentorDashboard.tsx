

import React, { useState, useRef, useMemo } from 'react';
import { User, MentorSubscriber, MentorPost, Mentor, Notification, Payout, RecentSignal } from '../../types';
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
    { id: 1, type: 'signal', title: 'EUR/USD Long Opportunity', content: 'Price has pulled back to a key support level and formed a <b>bullish engulfing candle</b> on the 4H chart. <i>Looking for a move higher towards the previous resistance.</i>', timestamp: '2023-10-27T14:00:00Z', signalDetails: { instrument: 'EUR/USD', direction: 'BUY', entry: '1.0760', stopLoss: '1.0730', takeProfit: '1.0820' }},
    { id: 2, type: 'analysis', title: 'Weekly Market Outlook', content: 'This week, I am watching the FOMC meeting on Wednesday. Expect volatility in USD pairs.', timestamp: '2023-10-26T09:00:00Z' },
];

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

const PostCard: React.FC<{ post: MentorPost }> = ({ post }) => {
    const isSignal = post.type === 'signal';
    const isBuy = post.signalDetails?.direction === 'BUY';
    return (
        <div className="bg-light-hover p-4 rounded-lg border border-light-gray">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-dark-text">{post.title}</h4>
                    <p className="text-xs text-mid-text">{new Date(post.timestamp).toLocaleString()}</p>
                </div>
                {isSignal && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${isBuy ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                        {post.signalDetails?.instrument} {post.signalDetails?.direction}
                    </span>
                )}
            </div>
            <div className="text-sm text-dark-text mt-2" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
    );
};


interface MentorDashboardProps {
    user: User;
    showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
}

const MentorDashboard: React.FC<MentorDashboardProps> = ({ user, showToast, addNotification }) => {
    const [activeTab, setActiveTab] = useState<'publisher' | 'profile' | 'payouts'>('publisher');
    const [postType, setPostType] = useState<'analysis' | 'signal'>('analysis');
    const [posts, setPosts] = useState<MentorPost[]>(MOCK_MENTOR_POSTS);

    // Profile state
    const [mentorProfile, setMentorProfile] = useState<Mentor>(MOCK_MENTOR_PROFILE);
    const [newInstrument, setNewInstrument] = useState('');
    const [newCertName, setNewCertName] = useState('');
    
    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        showToast("Profile updated successfully!", 'success');
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

    const PublisherView = () => {
        const [postContent, setPostContent] = useState('');
        const contentRef = useRef<HTMLTextAreaElement>(null);

        const applyFormat = (format: 'bold' | 'italic' | 'ul' | 'ol') => {
            const textarea = contentRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = textarea.value.substring(start, end);
            let formattedText = '';

            if (selectedText.length === 0) {
                showToast('Please select text to format.', 'info');
                return;
            }

            switch (format) {
                case 'bold':
                    formattedText = `<b>${selectedText}</b>`;
                    break;
                case 'italic':
                    formattedText = `<i>${selectedText}</i>`;
                    break;
                case 'ul':
                    formattedText = `<ul>\n${selectedText.split('\n').map(line => `<li>${line}</li>`).join('\n')}\n</ul>`;
                    break;
                case 'ol':
                    formattedText = `<ol>\n${selectedText.split('\n').map(line => `<li>${line}</li>`).join('\n')}\n</ol>`;
                    break;
                default:
                    formattedText = selectedText;
            }

            const newContent = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
            setPostContent(newContent);

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
            }, 0);
        };
        
        const handlePublish = (e: React.FormEvent) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);

            if (!postContent.trim()) {
                showToast("Post content cannot be empty.", 'error');
                return;
            }

            const newPost: MentorPost = {
                id: Date.now(),
                type: postType,
                title: formData.get('title') as string,
                content: postContent,
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
            
            addNotification({
                message: `New ${newPost.type} from your mentor, ${mentorProfile.name}.`,
                linkTo: 'mentor_profile',
                type: 'mentor'
            });
            
            if (newPost.type === 'signal') {
                const sendToTelegram = formData.get('sendTelegram') === 'on';
                if (sendToTelegram) {
                    showToast("Signal published and sent to subscribers' Telegram.", 'success');
                } else {
                    showToast("Signal published.", "info");
                }
            } else {
                 showToast("Analysis published.", "info");
            }
            
            form.reset();
            setPostContent('');
            setPostType('analysis'); // Reset to default post type
        };

        return (
            <div className="space-y-8">
                <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray">
                    <h3 className="text-xl font-bold mb-4 text-dark-text">Publish Exclusive Content</h3>
                    <div className="flex border-b border-light-gray mb-4">
                        <button onClick={() => setPostType('analysis')} className={`py-2 px-4 font-semibold transition-colors ${postType === 'analysis' ? 'border-b-2 border-primary text-primary' : 'text-mid-text hover:text-dark-text'}`}>Analysis / Update</button>
                        <button onClick={() => setPostType('signal')} className={`py-2 px-4 font-semibold transition-colors ${postType === 'signal' ? 'border-b-2 border-primary text-primary' : 'text-mid-text hover:text-dark-text'}`}>Trade Signal</button>
                    </div>
                    <form onSubmit={handlePublish} className="space-y-4">
                        <input type="text" name="title" placeholder={postType === 'signal' ? "Signal Title (e.g., EUR/USD Long Setup)" : "Title for your analysis or update"} required className="w-full bg-light-hover border-light-gray rounded-md p-3 focus:ring-primary focus:border-primary text-dark-text" />
                        
                        {postType === 'signal' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <select name="instrument" defaultValue="EUR/USD" required className="w-full bg-light-hover border-light-gray rounded-md p-3 focus:ring-primary focus:border-primary text-dark-text">
                                    <option>EUR/USD</option><option>GBP/USD</option><option>USD/JPY</option><option>XAU/USD</option>
                                </select>
                                <select name="direction" defaultValue="BUY" required className="w-full bg-light-hover border-light-gray rounded-md p-3 focus:ring-primary focus:border-primary text-dark-text">
                                    <option>BUY</option><option>SELL</option>
                                </select>
                                <input type="number" step="any" name="entry" placeholder="Entry Price" required className="w-full bg-light-hover border-light-gray rounded-md p-3 focus:ring-primary focus:border-primary text-dark-text" />
                                <input type="number" step="any" name="stopLoss" placeholder="Stop Loss" required className="w-full bg-light-hover border-light-gray rounded-md p-3 focus:ring-primary focus:border-primary text-dark-text" />
                                <input type="number" step="any" name="takeProfit" placeholder="Take Profit" required className="w-full bg-light-hover border-light-gray rounded-md p-3 focus:ring-primary focus:border-primary text-dark-text" />
                            </div>
                        )}

                        <div className="border border-light-gray rounded-md">
                            <div className="flex items-center space-x-1 p-2 bg-light-hover border-b border-light-gray rounded-t-md">
                                <button type="button" title="Bold" onClick={() => applyFormat('bold')} className="font-bold w-8 h-8 hover:bg-light-gray rounded text-dark-text">B</button>
                                <button type="button" title="Italic" onClick={() => applyFormat('italic')} className="italic w-8 h-8 hover:bg-light-gray rounded text-dark-text">I</button>
                                <button type="button" title="Bulleted List" onClick={() => applyFormat('ul')} className="w-8 h-8 hover:bg-light-gray rounded text-dark-text">
                                    <Icon name="signals" className="w-4 h-4 mx-auto rotate-90" />
                                </button>
                                <button type="button" title="Numbered List" onClick={() => applyFormat('ol')} className="w-8 h-8 hover:bg-light-gray rounded text-dark-text">
                                    1.
                                </button>
                            </div>
                            <textarea
                                name="content"
                                ref={contentRef}
                                value={postContent}
                                onChange={e => setPostContent(e.target.value)}
                                rows={5}
                                placeholder={postType === 'signal' ? "Reasoning behind the trade, chart analysis, etc..." : "Share your insights, trade ideas, or educational content..."}
                                required
                                className="w-full bg-light-hover rounded-b-md p-3 focus:ring-0 focus:outline-none border-0 text-dark-text"
                            />
                        </div>

                        <div className="flex justify-between items-center flex-wrap gap-4 pt-2">
                            <label htmlFor="attachment" className="text-sm text-primary hover:underline cursor-pointer flex items-center">
                                <Icon name="paperclip" className="w-5 h-5 mr-2" /> Attach Chart or File
                                <input type="file" id="attachment" name="attachment" className="hidden" />
                            </label>
                            <div className="flex items-center gap-4">
                                {postType === 'signal' && (
                                    <div className="flex items-center">
                                        <input type="checkbox" id="sendTelegram" name="sendTelegram" defaultChecked className="h-4 w-4 rounded border-light-gray text-primary focus:ring-primary" />
                                        <label htmlFor="sendTelegram" className="ml-2 block text-sm text-dark-text">Send Telegram Notification</label>
                                    </div>
                                )}
                                <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg">Publish</button>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray">
                    <h3 className="text-xl font-bold mb-4 text-dark-text">Your Recent Posts</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {posts.length > 0 ? [...posts].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(post => <PostCard key={post.id} post={post} />) : <p className="text-center text-mid-text py-8">You haven't published any posts yet.</p>}
                    </div>
                </div>
            </div>
        )
    };

    const ProfileSettingsView = () => {
        // FIX: Allow file and type to be optional to prevent invalid intermediate states.
        const [idDoc, setIdDoc] = useState<{file?: File, type?: Mentor['identity']['idDocument']['type']} | null>(null);
        const [addressDoc, setAddressDoc] = useState<{file?: File, type?: Mentor['identity']['addressDocument']['type']} | null>(null);
        const [livenessState, setLivenessState] = useState<'idle' | 'checking' | 'success'>('idle');
        const [isVerifying, setIsVerifying] = useState(false);
    
        // FIX: Update handler to only update the file in state, preserving the type.
        const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                setIdDoc(prev => ({ ...prev, file: e.target.files[0] }));
            }
        };
    
        // FIX: Update handler to only update the file in state, preserving the type.
        const handleAddressFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                setAddressDoc(prev => ({ ...prev, file: e.target.files[0] }));
            }
        };

        const startLivenessCheck = async () => {
            setLivenessState('checking');
            showToast("Please look into the camera.", 'info');
            try {
                // Request camera access to ensure permission is granted
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                // In a real app, you'd capture frames and send to a verification service.
                // Here, we'll just simulate the process.
                setTimeout(() => {
                    stream.getTracks().forEach(track => track.stop()); // Turn off camera
                    setLivenessState('success');
                    showToast("Liveness check successful!", 'success');
                }, 3000);
            } catch (err) {
                console.error("Camera access denied:", err);
                showToast("Camera access is required for liveness check.", 'error');
                setLivenessState('idle');
            }
        };

        const handleVerificationSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            // FIX: Add checks for file and type to prevent submission with incomplete data.
            if (!idDoc || !idDoc.file || !idDoc.type || !addressDoc || !addressDoc.file || !addressDoc.type || livenessState !== 'success') {
                showToast("Please complete all verification steps, including selecting a type and uploading a file for both documents.", "error");
                return;
            }

            setIsVerifying(true);
            showToast("Submitting documents for automated verification...", "info");
            
            // Set all statuses to pending
            setMentorProfile(prev => ({
                ...prev,
                identity: {
                    ...prev.identity!,
                    idDocument: { status: 'Pending', type: idDoc.type, fileName: idDoc.file!.name },
                    addressDocument: { status: 'Pending', type: addressDoc.type, fileName: addressDoc.file!.name },
                    livenessCheck: { status: 'Pending' },
                    overallStatus: 'Pending',
                }
            }));
            
            // Simulate async verification process
            setTimeout(() => {
                showToast("Your identity has been successfully verified!", "success");
                setMentorProfile(prev => ({
                    ...prev,
                    identity: {
                        ...prev.identity!,
                        idDocument: { ...prev.identity!.idDocument, status: 'Verified' },
                        addressDocument: { ...prev.identity!.addressDocument, status: 'Verified' },
                        livenessCheck: { status: 'Verified' },
                        overallStatus: 'Verified',
                    }
                }));
                 setIsVerifying(false);
            }, 5000); // 5-second delay
        };

        const VerificationStep: React.FC<{
            title: string;
            status: 'Not Submitted' | 'Pending' | 'Verified' | 'Rejected';
            children: React.ReactNode;
        }> = ({ title, status, children }) => {
            const statusMap = {
                'Not Submitted': { text: 'Pending Input', icon: 'info', color: 'text-mid-text' },
                'Pending': { text: 'In Review', icon: 'info', color: 'text-info' },
                'Verified': { text: 'Verified', icon: 'check', color: 'text-success' },
                'Rejected': { text: 'Rejected', icon: 'danger', color: 'text-danger' },
            };
            const currentStatus = statusMap[status];

            return (
                 <div className="bg-light-hover p-4 rounded-lg border border-light-gray">
                    <div className="flex justify-between items-center mb-3">
                        <h5 className="font-semibold text-dark-text">{title}</h5>
                        <span className={`flex items-center text-xs font-bold ${currentStatus.color}`}>
                            <Icon name={currentStatus.icon} className="w-4 h-4 mr-1.5" />
                            {currentStatus.text}
                        </span>
                    </div>
                    {status !== 'Verified' && status !== 'Pending' && children}
                </div>
            )
        };
        
        const isVerified = mentorProfile.identity?.overallStatus === 'Verified';

        return (
            <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray">
                <h3 className="text-xl font-bold mb-6 text-dark-text">Profile & Settings</h3>
                <form onSubmit={handleProfileUpdate} className="space-y-8 divide-y divide-light-gray">
                     <div className="space-y-4 pt-4">
                        <h4 className="text-lg font-semibold text-primary">Basic Information</h4>
                         <div>
                            <label className="block text-sm font-medium text-dark-text">Display Name</label>
                            <input type="text" value={mentorProfile.name} onChange={e => setMentorProfile(p => ({ ...p, name: e.target.value }))} className="mt-1 block w-full bg-light-hover border-light-gray rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary text-dark-text" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-dark-text">Trading Strategy / Bio</label>
                            <textarea rows={4} value={mentorProfile.strategy} onChange={e => setMentorProfile(p => ({ ...p, strategy: e.target.value }))} className="mt-1 block w-full bg-light-hover border-light-gray rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary text-dark-text"></textarea>
                        </div>
                    </div>

                    <div className="space-y-4 pt-8">
                         <h4 className="text-lg font-semibold text-primary">Traded Instruments</h4>
                         <div className="flex flex-wrap gap-2 p-2 bg-light-hover rounded-md min-h-[40px] border border-light-gray">
                            {mentorProfile.instruments.map(inst => (
                                <span key={inst} className="flex items-center bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full">
                                    {inst}
                                    <button type="button" onClick={() => handleRemoveInstrument(inst)} className="ml-2 text-primary/70 hover:text-primary"> &times; </button>
                                </span>
                            ))}
                         </div>
                         <div className="flex gap-2">
                            <input type="text" value={newInstrument} onChange={e => setNewInstrument(e.target.value)} placeholder="e.g., US30" className="flex-grow bg-light-hover border-light-gray rounded-md p-2 shadow-sm focus:ring-primary focus:border-primary text-dark-text" />
                            <button type="button" onClick={handleAddInstrument} className="bg-secondary hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Add</button>
                         </div>
                    </div>

                     <div className="space-y-4 pt-8">
                        <h4 className="text-lg font-semibold text-primary">Certifications & Proof</h4>
                        <div className="space-y-2">
                             {mentorProfile.certifications?.map((cert, index) => (
                                 <div key={index} className="flex items-center justify-between bg-light-hover p-2 rounded-md text-sm border border-light-gray">
                                    <span className="text-dark-text">{cert.name}</span>
                                    <button type="button" onClick={() => handleRemoveCertification(cert.name)} className="text-danger hover:text-red-700 font-bold px-2">Remove</button>
                                 </div>
                             ))}
                        </div>
                        <form onSubmit={handleAddCertification} className="flex gap-2 flex-wrap">
                            <input type="text" value={newCertName} onChange={e => setNewCertName(e.target.value)} placeholder="Certification Name (e.g., Prop Firm Payout)" required className="flex-grow bg-light-hover border-light-gray p-2 rounded-md shadow-sm focus:ring-primary focus:border-primary text-dark-text" />
                             <label htmlFor="cert-upload" className="cursor-pointer bg-secondary hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                                <Icon name="paperclip" className="w-4 h-4 mr-2" /> Upload
                            </label>
                            <input id="cert-upload" type="file" className="hidden"/>
                            <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg">Add</button>
                        </form>
                    </div>

                    <div className="space-y-4 pt-8">
                        <h4 className="text-lg font-semibold text-primary">Identity Verification for Payouts</h4>
                         {isVerified ? (
                            <div className="p-4 bg-success/10 text-success rounded-lg border border-success/20 flex items-center"><Icon name="check" className="w-5 h-5 mr-2"/> Your identity is fully verified.</div>
                         ) : (
                            <form onSubmit={handleVerificationSubmit} className="space-y-4">
                                <VerificationStep title="1. Identity Document" status={mentorProfile.identity!.idDocument.status}>
                                    {/* FIX: Update onChange to correctly update state without losing the file reference. */}
                                    <select onChange={(e) => setIdDoc(prev => ({...prev, type: e.target.value as any}))} value={idDoc?.type || ""} className="w-full bg-light-surface border-light-gray rounded-md p-2 mb-2 focus:ring-primary focus:border-primary text-dark-text">
                                        <option value="" disabled>Select Document Type</option>
                                        <option>Driver's License</option>
                                        <option>International Passport</option>
                                        <option>National ID</option>
                                        <option>NIN Slip</option>
                                    </select>
                                    <label htmlFor="id-upload" className="cursor-pointer border-2 border-dashed border-light-gray rounded-lg p-3 text-center block w-full hover:bg-light-surface text-sm text-mid-text">
                                        <Icon name="apply" className="w-6 h-6 mx-auto mb-1" />
                                        {idDoc?.file ? idDoc.file.name : 'Click to upload'}
                                    </label>
                                    {/* FIX: Update onChange to use the corrected handler. */}
                                    <input id="id-upload" type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdFileChange}/>
                                </VerificationStep>

                                <VerificationStep title="2. Liveness Check" status={mentorProfile.identity!.livenessCheck.status}>
                                     {livenessState === 'idle' ? (
                                        <button type="button" onClick={startLivenessCheck} className="w-full bg-secondary hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Start Liveness Check</button>
                                     ) : livenessState === 'checking' ? (
                                        <div className="w-full text-center py-2 text-info animate-pulse">Checking... Please wait.</div>
                                     ) : (
                                        <div className="w-full text-center py-2 text-success font-semibold">Liveness Check Complete</div>
                                     )}
                                </VerificationStep>
                                
                                <VerificationStep title="3. Proof of Address" status={mentorProfile.identity!.addressDocument.status}>
                                     {/* FIX: Update onChange to correctly update state without losing the file reference. */}
                                     <select onChange={(e) => setAddressDoc(prev => ({...prev, type: e.target.value as any}))} value={addressDoc?.type || ""} className="w-full bg-light-surface border-light-gray rounded-md p-2 mb-2 focus:ring-primary focus:border-primary text-dark-text">
                                        <option value="" disabled>Select Document Type</option>
                                        <option>Utility Bill</option>
                                        <option>Bank Statement</option>
                                    </select>
                                    <label htmlFor="address-upload" className="cursor-pointer border-2 border-dashed border-light-gray rounded-lg p-3 text-center block w-full hover:bg-light-surface text-sm text-mid-text">
                                        <Icon name="apply" className="w-6 h-6 mx-auto mb-1" />
                                        {addressDoc?.file ? addressDoc.file.name : 'Click to upload'}
                                    </label>
                                    {/* FIX: Update onChange to use the corrected handler. */}
                                    <input id="address-upload" type="file" accept="image/*,.pdf" className="hidden" onChange={handleAddressFileChange}/>
                                </VerificationStep>
                                
                                <button type="submit" disabled={isVerifying} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg disabled:bg-light-gray">
                                    {isVerifying ? 'Verifying...' : 'Submit All for Verification'}
                                </button>
                            </form>
                         )}
                    </div>

                    <div className="pt-8">
                        <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg">Save All Changes</button>
                    </div>
                </form>
             </div>
        );
    }
    
    const PayoutsView = () => {
        const [payoutAmount, setPayoutAmount] = useState('');
        
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
            // In a real app, you'd update state here after an API call
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
            <div className="space-y-8">
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
                            details={`Your ID verification status is: ${mentorProfile.identity?.overallStatus}. 'Verified' status required.`}
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
                
                 <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray">
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
        );
    }

    return (
        <div className="p-8 bg-light-bg min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-dark-text">Mentor Dashboard</h1>
            
            <div className="flex border-b border-light-gray mb-8">
                <button onClick={() => setActiveTab('publisher')} className={`py-2 px-6 font-semibold transition-colors ${activeTab === 'publisher' ? 'border-b-2 border-primary text-primary' : 'text-mid-text hover:text-dark-text'}`}>Content Publisher</button>
                <button onClick={() => setActiveTab('profile')} className={`py-2 px-6 font-semibold transition-colors ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-mid-text hover:text-dark-text'}`}>Profile & Settings</button>
                <button onClick={() => setActiveTab('payouts')} className={`py-2 px-6 font-semibold transition-colors ${activeTab === 'payouts' ? 'border-b-2 border-primary text-primary' : 'text-mid-text hover:text-dark-text'}`}>Payouts</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                   {activeTab === 'publisher' && <PublisherView />}
                   {activeTab === 'profile' && <ProfileSettingsView />}
                   {activeTab === 'payouts' && <PayoutsView />}
                </div>

                <div className="space-y-8">
                    <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray">
                        <h3 className="text-xl font-bold mb-4 text-dark-text">Key Metrics</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center text-dark-text"><span className="text-mid-text">Active Subscribers</span> <strong className="text-lg">42</strong></div>
                            <div className="flex justify-between items-center text-dark-text"><span className="text-mid-text">Monthly Earnings</span> <strong className="text-lg text-success">$4,158</strong></div>
                            <div className="flex justify-between items-center text-dark-text"><span className="text-mid-text">30-Day Churn</span> <strong className="text-lg text-danger">5.2%</strong></div>
                        </div>
                    </div>

                    <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray">
                        <h3 className="text-xl font-bold mb-4 text-dark-text">Recent Subscribers</h3>
                        <div className="space-y-4">
                            {MOCK_SUBSCRIBERS.map(sub => (
                                 <div key={sub.id} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <img src={sub.avatar} alt={sub.name} className="w-10 h-10 rounded-full mr-3" />
                                        <div>
                                            <p className="font-semibold text-dark-text">{sub.name}</p>
                                            <p className="text-xs text-mid-text">Joined: {sub.subscribedDate}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${sub.status === 'Active' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
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
