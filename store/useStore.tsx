import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, Notification } from "@/types";
import { API, updateUserAPI } from "@/utils";

interface AppState {
  user: User | null;
  isLoggedIn: boolean;
  setUser: (user: User | Partial<User>, replace?: boolean) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<User>) => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: {
    token: string;
    newPassword: string;
  }) => Promise<void>;
  verifyEmailCode: (code: string) => Promise<User>;
  resendVerificationCode: () => Promise<void>;
  IsLoggingOut: boolean;
  setIsLoggingOut: (IsLoggingOut: boolean) => void;

  loading: boolean;
  setLoading: (loading: boolean) => void;

  error: boolean;
  setError: (error: boolean) => void;

  darkMode: boolean;
  toggleDarkMode: () => void;

  notifications: Notification[];
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  signup: (data: {
    name: string;
    email: string;
    password: string;
    age: string;
  }) => Promise<void>;
  signIn: (data: { email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  handleGoogleSignIn: (data: object) => Promise<User>;
}

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      IsLoggingOut: false,
      setIsLoggingOut: (IsLoggingOut) => set({ IsLoggingOut }),

      setUser: (userData, replace = false) =>
        set((state) => {
          if (replace || !state.user) {
            return {
              user: userData as User,
              isLoggedIn: true,
            };
          }

          return {
            user: { ...state.user, ...userData },
            isLoggedIn: true,
          };
        }),

      clearUser: () => set({ user: null, isLoggedIn: false }),

      loading: false,
      setLoading: (loading) => set({ loading }),

      error: false,
      setError: (error) => set({ error }),

      darkMode: false,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      notifications: [],
      addNotification: (notification) =>
        set((s) => {
          const exists = s.notifications.some((n) => n.id === notification.id);
          const updated = exists
            ? s.notifications
            : [...s.notifications, notification];
          return { notifications: updated };
        }),

      markNotificationRead: (id) =>
        set((s) => {
          const updated = s.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          );
          return { notifications: updated };
        }),
      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        })),

      clearNotifications: () => set({ notifications: [] }),

      signup: async (data) => {
        const { setLoading, setError, addNotification } = get();

        try {
          setLoading(true);
          setError(false);
          await API.post("/api/user/register", data);
          console.log(data);

          addNotification({
            id: Date.now().toString(),
            message: "Signup successful!",
            isRead: false,
            timestamp: new Date().toISOString(),
            linkTo: "dashboard",
            type: "app_update",
          });
        } catch (err) {
          setError(true);
          throw err;
        } finally {
          setLoading(false);
        }
      },

      signIn: async (data) => {
        const { setUser, setLoading, setError, addNotification } = get();

        try {
          setLoading(true);
          setError(false);

          const res = await API.post("/api/user/login", data);
          const user = res.data.user;

          setUser(user, true);

          addNotification({
            id: Date.now().toString(),
            message: "SignIn successful!",
            isRead: false,
            timestamp: new Date().toISOString(),
            linkTo: "dashboard",
            type: "app_update",
          });

          return user;
        } catch (err) {
          setError(true);
          throw err;
        } finally {
          setLoading(false);
        }
      },

      handleGoogleSignIn: async (data) => {
        const { setUser, setLoading, setError, addNotification } = get();

        try {
          setLoading(true);
          setError(false);

          const res = await API.post("/api/user/google_login", data);

          setUser(res.data, true);

          addNotification({
            id: Date.now().toString(),
            message: "Google SignIn successful!",
            isRead: false,
            timestamp: new Date().toISOString(),
            linkTo: "dashboard",
            type: "app_update",
          });

          return res.data;
        } catch (err) {
          setError(true);
          throw err;
        } finally {
          setLoading(false);
        }
      },

      logout: async () => {
        const {
          clearUser,
          setLoading,
          setError,
          addNotification,
          setIsLoggingOut,
        } = get();
        try {
          setLoading(true);
          setIsLoggingOut(true);
          setError(false);
          await API.post("/api/user/logout");
          clearUser();
        } catch (err) {
          setError(true);
          throw err;
        } finally {
          setLoading(false);
          setIsLoggingOut(false);
        }
      },

      updateUser: async (updates: Partial<User>) => {
        const { setUser, setLoading, setError, addNotification } = get();

        try {
          setLoading(true);
          setError(false);

          const formData = new FormData();

          if (updates.avatar instanceof File) {
            formData.append("avatar", updates.avatar);
          }

          Object.entries(updates).forEach(([key, value]) => {
            if (key !== "avatar" && value !== undefined) {
              formData.append(key, value as string);
            }
          });

          const res = await API.put("/api/user/update_user", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          const updatedUser = res.data.user;
          setUser(
            {
              name: updatedUser.name,
              email: updatedUser.email,
              subscribedPlan: updatedUser.subscribedPlan || "FREE",
              avatar: updatedUser.picture || updatedUser.avatar,
            },
            true
          );

          addNotification({
            id: Date.now().toString(),
            message: "Profile Updated successfully!",
            isRead: false,
            timestamp: new Date().toISOString(),
            linkTo: "dashboard",
            type: "app_update",
          });
        } catch (err) {
          setError(true);
          addNotification({
            id: Date.now().toString(),
            message: "Profile Updated unsuccessfully, Please try again.",
            isRead: false,
            timestamp: new Date().toISOString(),
            linkTo: "dashboard",
            type: "app_update",
          });
          throw err;
        } finally {
          setLoading(false);
        }
      },
      verifyEmailCode: async (code) => {
        const { setLoading, setError, setUser } = get();
        try {
          setLoading(true);
          setError(false);

          const res = await API.post("/api/user/verify_email", { code });
          setUser(res.data.user, true);
          return res.data.user;
        } catch (err) {
          setError(true);
          throw err;
        } finally {
          setLoading(false);
        }
      },
      resendVerificationCode: async () => {
        const { setLoading, setError } = get();
        try {
          setLoading(true);
          setError(false);
          await API.get("/api/user/resend_verification_code");
        } catch (err) {
          setError(true);
          throw err;
        } finally {
          setLoading(false);
        }
      },

      forgotPassword: async (email: string) => {
        const { setLoading, setError } = get();
        try {
          setLoading(true);
          setError(false);
          const res = await API.post("/api/user/forgot_password", { email });
          return res;
        } catch (error) {
          console.log(error);
          setError(true);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      resetPassword: async (data: any) => {
        const { setLoading, setError } = get();
        const { token } = data;
        try {
          setLoading(true);
          setError(false);
          const res = await API.post(`/api/user/reset_password/${token}`, data);
          return res;
        } catch (error) {
          console.log(error);
          setError(true);
          throw error;
        }
      },
    }),

    {
      name: "app-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        darkMode: state.darkMode,
        notifications: state.notifications,
      }),
    }
  )
);

export default useAppStore;
