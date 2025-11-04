import React from 'react';
import { Mentor, MentorPost } from '../../types';
import Icon from '../ui/Icon';

const PostCard: React.FC<{ post: MentorPost }> = ({ post }) => {
    const isSignal = post.type === 'signal';
    const isBuy = post.signalDetails?.direction === 'BUY';

    return (
        <div className="bg-surface p-6 rounded-lg mb-6 border-l-4 border-primary/50 shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold">{post.title}</h3>
                    <p className="text-xs text-gray-400">Posted on {new Date(post.timestamp).toLocaleString()}</p>
                </div>
                {isSignal && (
                    <span className={`px-4 py-1 text-sm font-bold rounded-full ${isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {post.signalDetails?.instrument} {post.signalDetails?.direction}
                    </span>
                )}
            </div>

            {isSignal && post.signalDetails && (
                <div className="grid grid-cols-3 gap-4 text-center mb-4 bg-gray-800 p-4 rounded-md">
                    <div>
                        <p className="text-sm text-gray-400">Entry Price</p>
                        <p className="text-lg font-semibold">{post.signalDetails.entry}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Stop Loss</p>
                        <p className="text-lg font-semibold text-red-400">{post.signalDetails.stopLoss}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Take Profit</p>
                        <p className="text-lg font-semibold text-green-400">{post.signalDetails.takeProfit}</p>
                    </div>
                </div>
            )}

            <div className="text-gray-300 text-sm mb-4" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}></div>
            
            {post.imageUrl && (
                <div className="mt-4">
                    <img src={post.imageUrl} alt="Chart analysis" className="rounded-lg max-w-full h-auto" />
                </div>
            )}
        </div>
    );
};


interface MentorProfilePageProps {
  mentor: Mentor;
  onBack: () => void;
}

const MentorProfilePage: React.FC<MentorProfilePageProps> = ({ mentor, onBack }) => {

    const StatsCard: React.FC<{label: string; value: string | number; color?: string}> = ({ label, value, color = 'text-on-surface' }) => (
        <div className="bg-gray-800 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
    );

    return (
        <div>
            <button onClick={onBack} className="flex items-center text-primary hover:underline mb-6 font-semibold">
                <Icon name="arrowRight" className="w-5 h-5 mr-2 transform rotate-180" />
                Back to All Mentors
            </button>
            
            <div className="bg-surface p-6 rounded-lg mb-8">
                <div className="flex flex-col md:flex-row items-center text-center md:text-left">
                    <img src={mentor.avatar} alt={mentor.name} className="w-24 h-24 rounded-full mb-4 md:mb-0 md:mr-6 border-4 border-primary" />
                    <div className="flex-grow">
                        <h1 className="text-3xl font-bold">{mentor.name}</h1>
                        <div className="flex items-center justify-center md:justify-start space-x-4 mt-2 text-sm text-gray-400">
                             <span>{mentor.experience} Yrs Experience</span>
                             <span className="text-primary">|</span>
                             <span>${mentor.price}/month</span>
                        </div>
                    </div>
                    <button className="mt-4 md:mt-0 md:ml-6 w-full md:w-auto flex-shrink-0 bg-green-600 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center">
                        <Icon name="check" className="w-5 h-5 mr-2" />
                        Subscribed
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <StatsCard label="Profit Ratio" value={`${mentor.profitRatio}%`} color="text-green-400" />
                    <StatsCard label="Avg. ROI / mo" value={`${mentor.roi}%`} color="text-green-400" />
                    <StatsCard label="Traded Pairs" value={mentor.instruments.length} />
                    <StatsCard label="Subscribers" value="42" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                     <h2 className="text-2xl font-bold mb-4">Exclusive Feed</h2>
                     <div>
                        {mentor.posts && mentor.posts.length > 0 ? (
                            [...mentor.posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(post => <PostCard key={post.id} post={post} />)
                        ) : (
                            <div className="text-center py-16 text-gray-500 bg-surface rounded-lg">
                                <p>No posts from {mentor.name} yet.</p>
                                <p>Check back later for new signals and analysis.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-bold mb-3">Trading Strategy</h3>
                        <div className="bg-surface p-4 rounded-lg text-sm text-gray-300">
                            <p>{mentor.strategy}</p>
                        </div>
                    </div>
                     <div>
                        <h3 className="text-xl font-bold mb-3">Most Traded Instruments</h3>
                        <div className="bg-surface p-4 rounded-lg flex flex-wrap gap-2">
                           {mentor.instruments.map(inst => (
                               <span key={inst} className="bg-primary/20 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">{inst}</span>
                           ))}
                        </div>
                    </div>
                    {mentor.certifications && mentor.certifications.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold mb-3">Certifications & Proof</h3>
                            <div className="bg-surface p-4 rounded-lg space-y-3">
                                {mentor.certifications.map(cert => (
                                    <a href={cert.url} key={cert.name} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-400 hover:underline">
                                        <Icon name="apply" className="w-5 h-5 mr-2 flex-shrink-0" />
                                        <span>{cert.name}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MentorProfilePage;
