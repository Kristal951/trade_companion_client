import { create } from "zustand";
import { API } from "@/utils";
import { Notification } from "@/types";

type NotificationResponse = {
  items: Notification[];
  unreadCount: number;
  page: number;
  total: number;
  hasMore: boolean;
};

type NotificationStore = {
  notifications: Notification[];
  unreadCount: number;
  hasFetched: boolean;
  loading: boolean;
  hasMore: boolean;

  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  pushRealtimeNotification: (notification: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  resetNotifications: () => void;
  deleteAllNotifications: () => void;
};

const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  hasFetched: false,
  loading: false,
  hasMore: true,

  fetchNotifications: async (page = 1, limit = 20) => {
    try {
      set({ loading: true });

      const res = await API.get<NotificationResponse>(
        `/api/notifications?page=${page}&limit=${limit}`,
      );

      const data = res.data;

      set((state) => ({
        notifications:
          page === 1 ? data.items : [...state.notifications, ...data.items],
        unreadCount: data.unreadCount ?? 0,
        hasFetched: true,
        hasMore: data.hasMore ?? false,
        loading: false,
      }));
    } catch (error) {
      console.error("fetchNotifications error:", error);
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await API.get<{ unreadCount: number }>(
        "/api/notifications/unread-count",
      );

      set({
        unreadCount: res.data.unreadCount ?? 0,
      });
    } catch (error) {
      console.error("fetchUnreadCount error:", error);
    }
  },

  pushRealtimeNotification: (notification) => {
    console.log(notification);
    set((state) => {
      const exists = state.notifications.some(
        (item) => item._id === notification._id,
      );

      if (exists) return state;

      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
      };
    });
  },
  markAsRead: async (id) => {
    try {
      const res = await API.patch(`/api/notifications/${id}/read`);
      const unreadCount = res.data?.unreadCount ?? 0;

      set((state) => ({
        notifications: state.notifications.map((item) =>
          item._id === id
            ? {
                ...item,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : item,
        ),
        unreadCount,
      }));
    } catch (error) {
      console.error("markAsRead error:", error);
    }
  },

  markAllRead: async () => {
    try {
      await API.patch("/api/notifications/read-all");

      set((state) => ({
        notifications: state.notifications.map((item) => ({
          ...item,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("markAllRead error:", error);
    }
  },

  deleteNotification: async (id) => {
    try {
      const res = await API.delete(`/api/notifications/${id}`);
      const unreadCount = res.data?.unreadCount ?? 0;

      set((state) => ({
        notifications: state.notifications.filter((item) => item._id !== id),
        unreadCount,
      }));
    } catch (error) {
      console.error("deleteNotification error:", error);
    }
  },

  deleteAllNotifications: async () => {
    try {
      const res = await API.delete("/api/notifications/delete-all");

      set({
        notifications: [],
        unreadCount: 0,
      });

      return res.data;
    } catch (error) {
      console.error(error);
    }
  },

  resetNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      hasFetched: false,
      loading: false,
      hasMore: true,
    });
  },
}));

export default useNotificationStore;
