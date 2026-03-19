import React, { useEffect, useMemo, useRef, useState } from "react";
import { Notification, NotificationType } from "../../types";
import Icon from "./Icon";
import { useNavigate } from "react-router-dom";
import useNotificationStore from "@/store/useNotificationStore";

const NotificationDropDown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    hasFetched,
    fetchNotifications,
    markAsRead,
    markAllRead,
    deleteNotification,
    deleteAllNotifications,
    loading,
  } = useNotificationStore();

  const navigate = useNavigate();

  const handleToggle = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    if (isOpen && !hasFetched) {
      fetchNotifications();
    }
  }, [isOpen, hasFetched, fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }

      if (notification.linkTo) {
        const target = notification.linkTo.startsWith("/")
          ? notification.linkTo
          : `/${notification.linkTo}`;

        navigate(target);
      }

      setIsOpen(false);
    } catch (error) {
      console.error("Failed to open notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleClearAll = async () => {
    try {
      await deleteAllNotifications();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  const handleDeleteOne = async (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ) => {
    e.stopPropagation();

    try {
      await deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate("/notifications");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const timeSince = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );

    let interval = seconds / 31536000;
    if (interval >= 1) return `${Math.floor(interval)}y ago`;

    interval = seconds / 2592000;
    if (interval >= 1) return `${Math.floor(interval)}mo ago`;

    interval = seconds / 86400;
    if (interval >= 1) return `${Math.floor(interval)}d ago`;

    interval = seconds / 3600;
    if (interval >= 1) return `${Math.floor(interval)}h ago`;

    interval = seconds / 60;
    if (interval >= 1) return `${Math.floor(interval)}m ago`;

    return `${Math.max(seconds, 0)}s ago`;
  };

  const getIconForType = (type: NotificationType): string => {
    switch (type) {
      case "signal":
        return "signals";
      case "mentor_post":
        return "mentors";
      case "billing":
        return "wallet";
      case "promo":
        return "star";
      case "news":
        return "news";
      case "system":
      case "app_update":
      default:
        return "info";
    }
  };

  const groupedNotifications = useMemo(() => {
    const today: Notification[] = [];
    const earlier: Notification[] = [];

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    notifications.forEach((notification) => {
      const createdAt = new Date(notification.createdAt);

      if (createdAt >= startOfToday) {
        today.push(notification);
      } else {
        earlier.push(notification);
      }
    });

    return { today, earlier };
  }, [notifications]);

  const renderNotificationItem = (n: Notification) => (
    <div
      key={n._id}
      onClick={() => handleNotificationClick(n)}
      className={`group p-3 flex items-start gap-3 hover:bg-light-hover cursor-pointer border-b border-light-gray ${
        !n.isRead ? "bg-primary/5" : ""
      }`}
    >
      <div className="flex-shrink-0 w-8 text-center pt-1">
        <Icon name={getIconForType(n.type)} className="w-5 h-5 text-mid-text" />
      </div>

      <div className="flex-1 min-w-0">
        {n.title && (
          <p className="text-sm font-semibold text-dark-text truncate">
            {n.title}
          </p>
        )}

        <p className="text-sm text-dark-text line-clamp-2">{n.message}</p>

        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-mid-text">{timeSince(n.createdAt)}</p>
          {!n.isRead && (
            <span className="inline-block w-2 h-2 rounded-full bg-primary" />
          )}
        </div>
      </div>

      <button
        onClick={(e) => handleDeleteOne(e, n._id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-mid-text hover:text-danger p-1"
        title="Delete notification"
      >
        <Icon name="trash" className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative text-mid-text hover:text-dark-text p-2 rounded-full hover:bg-light-hover"
      >
        <Icon name="bell" className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block min-h-4 min-w-4 px-1 rounded-full bg-danger text-white text-xs flex items-center justify-center transform translate-x-1/4 -translate-y-1/4 ring-2 ring-light-surface">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-light-surface rounded-xl shadow-2xl border border-light-gray z-50 animate-fade-in-right overflow-hidden">
          <div className="p-3 border-b border-light-gray flex justify-between items-center">
            <h3 className="font-bold text-dark-text">Notifications</h3>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all as read
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-danger hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {loading ? (
              <div className="py-10 px-4 text-center text-sm text-mid-text">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center text-sm text-mid-text">
                No notifications yet.
              </div>
            ) : (
              <>
                {groupedNotifications.today.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-mid-text bg-light-hover/50">
                      Today
                    </div>
                    {groupedNotifications.today.map(renderNotificationItem)}
                  </div>
                )}

                {groupedNotifications.earlier.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-mid-text bg-light-hover/50">
                      Earlier
                    </div>
                    {groupedNotifications.earlier.map(renderNotificationItem)}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-3 border-t border-light-gray text-center">
            <button
              onClick={handleViewAll}
              className="text-sm text-primary hover:underline font-medium"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropDown;
