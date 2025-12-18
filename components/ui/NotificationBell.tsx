import React, { useState, useRef, useEffect } from 'react';
import { Notification, DashboardView, NotificationType } from '../../types';
import Icon from './Icon';
import useAppStore from '@/store/useStore';
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
    notifications: Notification[];
    addNotification: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, addNotification }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const markNotificationRead = useAppStore((state) => state.markNotificationRead);
    const clearNotifications = useAppStore((state) => state.clearNotifications);
    const markAllNotificationsRead = useAppStore((state) => state.markAllNotificationsRead);
    const navigate = useNavigate()

    const unreadCount = notifications?.filter(n => !n.isRead).length;

    const handleToggle = () => setIsOpen(!isOpen);

    const handleNotificationClick = (notification: Notification) => {
       markNotificationRead(notification.id);
        navigate(`/${notification.linkTo}`);
        setIsOpen(false);
    };

    const handleMarkAllAsRead = () => {
        markAllNotificationsRead();
    };
    
    const handleClearAll = () => {
        clearNotifications();
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const timeSince = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };
    
    const getIconForType = (type: NotificationType): string => {
        switch (type) {
            case 'signal': return 'signals';
            case 'mentor': return 'mentors';
            case 'promo': return 'star';
            case 'news':
            case 'app_update':
            default: return 'info';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={handleToggle} className="relative text-mid-text hover:text-dark-text p-2 rounded-full hover:bg-light-hover">
                <Icon name="bell" className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-danger text-white text-xs flex items-center justify-center transform translate-x-1/4 -translate-y-1/4 ring-2 ring-light-surface">
                        {unreadCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-light-surface rounded-xl shadow-2xl border border-light-gray z-50 animate-fade-in-right">
                    <div className="p-3 border-b border-light-gray flex justify-between items-center">
                        <h3 className="font-bold text-dark-text">Notifications</h3>
                        {unreadCount > 0 && (
                             <button onClick={handleMarkAllAsRead} className="text-xs text-primary hover:underline">Mark all as read</button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-3 flex items-start hover:bg-light-hover cursor-pointer border-b border-light-gray ${!n.isRead ? 'bg-primary/5' : ''}`}>
                                    <div className="flex-shrink-0 w-8 text-center pt-1">
                                        <Icon name={getIconForType(n.type)} className="w-5 h-5 text-mid-text" />
                                    </div>
                                    <div className="ml-1 flex-grow">
                                        <p className="text-sm text-dark-text">{n.message}</p>
                                        <p className="text-xs text-mid-text mt-1">{timeSince(n.timestamp)}</p>
                                    </div>
                                    {!n.isRead && <div className="mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full bg-primary ml-2 self-center"></div>}
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-mid-text text-sm py-8">No notifications yet.</p>
                        )}
                    </div>
                    {notifications.length > 0 && (
                         <div className="p-2 border-t border-light-gray text-center">
                            <button onClick={handleClearAll} className="text-xs text-danger hover:underline">Clear all</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;