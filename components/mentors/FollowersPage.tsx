import React from 'react';
import Icon from '../ui/Icon';
import useMentorStore from '@/store/mentorStore';
import { MentorSubscriber } from '@/types';

const StarRating: React.FC<{ rating?: number }> = ({ rating }) => {
    if (rating === undefined) return <span className="text-xs text-mid-text">Not Rated</span>;

    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
                <Icon
                    key={i}
                    name="star"
                    className={`w-4 h-4 ${i < rating ? 'text-warning fill-current' : 'text-light-gray'}`}
                />
            ))}
        </div>
    );
};

const FollowersPage: React.FC = () => {
    const { mentor } = useMentorStore();

    const followers: MentorSubscriber[] = mentor?.subscribers || [];

    const activeFollowers = followers.filter(f => f.status === 'Active').length;
    const totalFollowers = followers.length;
    const ratedFollowers = followers.filter(f => f.ratingGiven !== undefined);
    const avgRating =
        ratedFollowers.reduce((acc, f) => acc + (f.ratingGiven || 0), 0) /
        (ratedFollowers.length || 1);

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
                        {avgRating.toFixed(1)}{' '}
                        <Icon name="star" className="w-6 h-6 text-warning fill-current" />
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
                        {followers.map(follower => (
                            <tr key={follower.id}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <img
                                            src={follower.avatar}
                                            alt={follower.name}
                                            className="w-10 h-10 rounded-full mr-4"
                                        />
                                        <span className="font-semibold">{follower.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{follower.subscribedDate}</td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2 py-1 text-xs font-bold rounded-full ${
                                            follower.status === 'Active'
                                                ? 'bg-success/20 text-success'
                                                : 'bg-danger/20 text-danger'
                                        }`}
                                    >
                                        {follower.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <StarRating rating={follower.ratingGiven} />
                                </td>
                            </tr>
                        ))}
                        {followers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-mid-text">
                                    No followers yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FollowersPage;
