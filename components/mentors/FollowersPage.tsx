import React from 'react';
import { MentorSubscriber } from '../../types';
import Icon from '../ui/Icon';

// Mock data for followers, including their ratings
const MOCK_FOLLOWERS: MentorSubscriber[] = [
    { id: 1, name: 'Alice Johnson', avatar: 'https://picsum.photos/seed/sub1/100', subscribedDate: '2023-10-15', status: 'Active', ratingGiven: 5 },
    { id: 2, name: 'Bob Williams', avatar: 'https://picsum.photos/seed/sub2/100', subscribedDate: '2023-10-12', status: 'Active', ratingGiven: 4 },
    { id: 3, name: 'Charlie Brown', avatar: 'https://picsum.photos/seed/sub3/100', subscribedDate: '2023-10-01', status: 'Cancelled' }, // No rating given
    { id: 4, name: 'Diana Miller', avatar: 'https://picsum.photos/seed/sub4/100', subscribedDate: '2023-09-28', status: 'Active', ratingGiven: 5 },
    { id: 5, name: 'Ethan Hunt', avatar: 'https://picsum.photos/seed/sub5/100', subscribedDate: '2023-09-25', status: 'Active', ratingGiven: 3 },
];

const StarRating: React.FC<{ rating?: number }> = ({ rating }) => {
    if (rating === undefined) {
        return <span className="text-xs text-mid-text">Not Rated</span>;
    }
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
                <Icon key={i} name="star" className={`w-4 h-4 ${i < rating ? 'text-warning fill-current' : 'text-light-gray'}`} />
            ))}
        </div>
    );
};


const FollowersPage: React.FC = () => {
    const activeFollowers = MOCK_FOLLOWERS.filter(f => f.status === 'Active').length;
    const totalFollowers = MOCK_FOLLOWERS.length;
    const ratedFollowers = MOCK_FOLLOWERS.filter(f => f.ratingGiven);
    const avgRating = ratedFollowers.reduce((acc, follower) => acc + (follower.ratingGiven || 0), 0) / (ratedFollowers.length || 1);

    return (
        <div className="p-8 bg-light-bg min-h-screen">
            <h1 className="text-3xl font-bold mb-2 text-dark-text">Your Followers</h1>
            <p className="text-mid-text mb-8">Manage and view the community you're building.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                    <p className="text-sm text-mid-text">Active Followers</p>
                    <p className="text-3xl font-bold text-dark-text">{activeFollowers}</p>
                </div>
                <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                    <p className="text-sm text-mid-text">Total Followers</p>
                    <p className="text-3xl font-bold text-dark-text">{totalFollowers}</p>
                </div>
                <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
                    <p className="text-sm text-mid-text">Average Rating</p>
                    <p className="text-3xl font-bold text-dark-text flex items-center gap-2">
                        {avgRating.toFixed(1)} <Icon name="star" className="w-6 h-6 text-warning fill-current" />
                    </p>
                </div>
            </div>
            
            <div className="bg-light-surface rounded-lg shadow-sm border border-light-gray overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-mid-text uppercase bg-light-hover">
                        <tr>
                            <th className="px-6 py-3">Follower</th>
                            <th className="px-6 py-3">Subscribed Date</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Rating Given</th>
                        </tr>
                    </thead>
                    <tbody className="text-dark-text divide-y divide-light-gray">
                        {MOCK_FOLLOWERS.map(follower => (
                            <tr key={follower.id}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <img src={follower.avatar} alt={follower.name} className="w-10 h-10 rounded-full mr-4"/>
                                        <span className="font-semibold">{follower.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{follower.subscribedDate}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${follower.status === 'Active' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                        {follower.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <StarRating rating={follower.ratingGiven} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FollowersPage;