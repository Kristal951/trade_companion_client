import React from 'react';
import { Mentor, MentorPost } from '../../types';
import Icon from '../ui/Icon';
import SecureContent from '../ui/SecureContent';

interface PostCardProps {
    post: MentorPost;
    mentorName: string;
}

const PostCard: React.FC<PostCardProps> = ({ post, mentorName }) => {
    const isSignal = post.type === 'signal';
    const isBuy = post.signalDetails?.direction === 'BUY';

    return (
        <div className="bg-light-surface p-6 rounded-lg mb-6 border-l-4 border-primary/50 shadow-sm border border-light-gray">
            <SecureContent watermarkText={`Trade Companion / ${mentorName}`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-dark-text">{post.title}</h3>
                        <p className="text-xs text-mid-text">Posted on {new Date(post.timestamp).toLocaleString()}</p>
                    </div>
                    {isSignal && (
                        <span className={`px-4 py-1 text-sm font-bold rounded-full ${isBuy ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                            {post.signalDetails?.instrument} {post.signalDetails?.direction}
                        </span>
                    )}
                </div>

                {isSignal && post.signalDetails && (
                    <div className="grid grid-cols-3 gap-4 text-center mb-4 bg-light-hover p-4 rounded-md border border-light-gray">
                        <div>
                            <p className="text-sm text-mid-text">Entry Price</p>
                            <p className="text-lg font-semibold text-dark-text">{post.signalDetails.entry}</p>
                        </div>
                        <div>
                            <p className="text-sm text-mid-text">Stop Loss</p>
                            <p className="text-lg font-semibold text-danger">{post.signalDetails.stopLoss}</p>
                        </div>
                        <div>
                            <p className="text-sm text-mid-text">Take Profit</p>
                            <p className="text-lg font-semibold text-success">{post.signalDetails.takeProfit}</p>
                        </div>
                    </div>
                )}

                <div className="text-dark-text text-sm mb-4" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}></div>
                
                {post.imageUrl && (
                    <div className="mt-4">
                        <img src={post.imageUrl} alt="Chart analysis" className="rounded-lg max-w-full h-auto" />
                    </div>
                )}
            </SecureContent>
        </div>
    );
};


interface MentorProfilePageProps {
  mentor: Mentor;
  onBack: () => void;
}

const MentorProfilePage: React.FC<MentorProfilePageProps> = ({ mentor, onBack }) => {

    const StatsCard: React.FC<{label: string; value: string | number; color?: string}> = ({ label, value, color = 'text-dark-text' }) => (
        <div className="bg-light-hover p-4 rounded-lg text-center border border-light-gray">
            <p className="text-sm text-mid-text">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
    );

    return (
        <div className="p-8 bg-light-bg min-h-screen">
            <button onClick={onBack} className="flex items-center text-primary hover:underline mb-6 font-semibold">
                <Icon name="arrowRight" className="w-5 h-5 mr-2 transform rotate-180" />
                Back to All Mentors
            </button>
            
            <div className="bg-light-surface p-6 rounded-lg mb-8 shadow-sm border border-light-gray">
                <div className="flex flex-col md:flex-row items-center text-center md:text-left">
                    <img src={mentor.avatar} alt={mentor.name} className="w-24 h-24 rounded-full mb-4 md:mb-0 md:mr-6 border-4 border-primary" />
                    <div className="flex-grow">
                        <h1 className="text-3xl font-bold text-dark-text">{mentor.name}</h1>
                        <div className="flex items-center justify-center md:justify-start space-x-4 mt-2 text-sm text-mid-text">
                             <span>{mentor.experience} Yrs Experience</span>
                             <span className="text-primary">|</span>
                             <span>${mentor.price}/month</span>
                        </div>
                    </div>
                    <button className="mt-4 md:mt-0 md:ml-6 w-full md:w-auto flex-shrink-0 bg-success text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center hover:bg-green-700">
                        <Icon name="check" className="w-5 h-5 mr-2" />
                        Subscribed
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <StatsCard label="Profit Ratio" value={`${mentor.profitRatio}%`} color="text-success" />
                    <StatsCard label="Avg. ROI / mo" value={`${mentor.roi}%`} color="text-success" />
                    <StatsCard label="Traded Pairs" value={mentor.instruments.length} />
                    <StatsCard label="Subscribers" value="42" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                     <h2 className="text-2xl font-bold mb-4 text-dark-text">Exclusive Feed</h2>
                     <div>
                        {mentor.posts && mentor.posts.length > 0 ? (
                            [...mentor.posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(post => <PostCard key={post.id} post={post} mentorName={mentor.name} />)
                        ) : (
                            <div className="text-center py-16 text-mid-text bg-light-surface rounded-lg shadow-sm border border-light-gray">
                                <p>No posts from {mentor.name} yet.</p>
                                <p>Check back later for new signals and analysis.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-bold mb-3 text-dark-text">Trading Strategy</h3>
                        <div className="bg-light-surface p-4 rounded-lg text-sm text-dark-text shadow-sm border border-light-gray">
                            <p>{mentor.strategy}</p>
                        </div>
                    </div>
                     <div>
                        <h3 className="text-xl font-bold mb-3 text-dark-text">Most Traded Instruments</h3>
                        <div className="bg-light-surface p-4 rounded-lg flex flex-wrap gap-2 shadow-sm border border-light-gray">
                           {mentor.instruments.map(inst => (
                               <span key={inst} className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">{inst}</span>
                           ))}
                        </div>
                    </div>
                    {mentor.certifications && mentor.certifications.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold mb-3 text-dark-text">Certifications & Proof</h3>
                            <div className="bg-light-surface p-4 rounded-lg space-y-3 shadow-sm border border-light-gray">
                                {mentor.certifications.map(cert => (
                                    <a href={cert.url} key={cert.name} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-info hover:underline">
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