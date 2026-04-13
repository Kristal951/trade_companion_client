import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Notification, NotificationType } from "../../types";
import Icon from "./Icon";
import { useNavigate } from "react-router-dom";
import useNotificationStore from "@/store/useNotificationStore";
import Spinner from "./Spinner";

/* ------------------ Helpers ------------------ */

const timeSince = (date: string) => {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );

  const intervals = [
    { label: "y", value: 31536000 },
    { label: "mo", value: 2592000 },
    { label: "d", value: 86400 },
    { label: "h", value: 3600 },
    { label: "m", value: 60 },
  ];

  for (const i of intervals) {
    const count = Math.floor(seconds / i.value);
    if (count >= 1) return `${count}${i.label} ago`;
  }

  return `${Math.max(seconds, 0)}s ago`;
};

const getIconForType = (type: NotificationType): string => {
  const map: Record<NotificationType, string> = {
    signal: "signals",
    mentor_post: "mentors",
    billing: "wallet",
    promo: "star",
    news: "news",
    system: "info",
    app_update: "info",
  };

  return map[type] || "info";
};

/* ------------------ Component ------------------ */

const NotificationDropDown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasFetchedRef = useRef(false);

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllRead,
    deleteNotification,
    deleteAllNotifications,
    loading,
    isMarkingAsRead,
  } = useNotificationStore();

  const navigate = useNavigate();

  /* ------------------ Effects ------------------ */

  useEffect(() => {
    if (isOpen && !hasFetchedRef.current) {
      fetchNotifications();
      hasFetchedRef.current = true;
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  /* ------------------ Handlers ------------------ */

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      try {
        // ✅ Optimistic (no await)
        if (!notification.isRead) {
          markAsRead(notification._id);
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
    },
    [markAsRead, navigate]
  );

  const handleDeleteOne = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        await deleteNotification(id);
      } catch (error) {
        console.error("Failed to delete notification:", error);
      }
    },
    [deleteNotification]
  );

  const handleClearAll = useCallback(async () => {
    try {
      await deleteAllNotifications();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  }, [deleteAllNotifications]);

  const handleViewAll = useCallback(() => {
    setIsOpen(false);
    navigate("/notifications");
  }, [navigate]);

  /* ------------------ Memo ------------------ */

  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    return notifications.reduce(
      (acc, n) => {
        const createdAt = new Date(n.createdAt);
        (createdAt >= startOfToday ? acc.today : acc.earlier).push(n);
        return acc;
      },
      { today: [] as Notification[], earlier: [] as Notification[] }
    );
  }, [notifications]);

  /* ------------------ Render ------------------ */

  const renderNotificationItem = (n: Notification) => (
    <div
      key={n._id}
      onClick={() => handleNotificationClick(n)}
      className={`group p-3 flex items-start gap-3 hover:bg-light-hover cursor-pointer border-b border-light-gray ${
        !n.isRead ? "bg-primary/5" : ""
      }`}
    >
      <div className="flex-shrink-0 w-8 text-center pt-1">
        <Icon
          name={getIconForType(n.type)}
          className="w-5 h-5 text-mid-text"
        />
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
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
        </div>
      </div>

      <button
        onClick={(e) => handleDeleteOne(e, n._id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-mid-text hover:text-danger p-1"
      >
        <Icon name="trash" className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell */}
      <button
        onClick={handleToggle}
        className="relative text-mid-text hover:text-dark-text p-2 rounded-full hover:bg-light-hover"
      >
        <Icon name="bell" className="w-6 h-6" />

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-h-4 min-w-4 px-1 rounded-full bg-danger text-white text-xs flex items-center justify-center translate-x-1/4 -translate-y-1/4 ring-2 ring-light-surface">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-light-surface rounded-xl shadow-2xl border border-light-gray z-50 overflow-hidden animate-fade-in-right">
          {/* Header */}
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-bold text-dark-text">Notifications</h3>

            <div className="flex gap-3 text-xs">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-primary hover:underline"
                >
                  Mark all
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-danger hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[28rem] overflow-y-auto">
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <Spinner w={6} h={6} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-mid-text">
                No notifications yet.
              </div>
            ) : (
              <>
                {groupedNotifications.today.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-mid-text bg-light-hover/50">
                      Today
                    </div>
                    {groupedNotifications.today.map(renderNotificationItem)}
                  </>
                )}

                {groupedNotifications.earlier.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-mid-text bg-light-hover/50">
                      Earlier
                    </div>
                    {groupedNotifications.earlier.map(renderNotificationItem)}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t text-center">
            <button
              onClick={handleViewAll}
              className="text-sm text-primary hover:underline font-medium"
            >
              View all notifications
            </button>
          </div>

          {/* Overlay */}
          {isMarkingAsRead && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
              <Spinner w={5} h={5} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropDown;