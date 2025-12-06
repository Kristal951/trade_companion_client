import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/types";
import { API, updateUserAPI } from "@/utils";

export interface Notification {
  id: string;
  message: string;
  read: boolean;
}

interface AppState {
  user: User | null;
  isLoggedIn: boolean;
  setUser: (user: User | Partial<User>, replace?: boolean) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<User>) => Promise<User>;

  loading: boolean;
  setLoading: (loading: boolean) => void;

  error: boolean;
  setError: (error: boolean) => void;

  darkMode: boolean;
  toggleDarkMode: () => void;

  notifications: Notification[];
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  signup: (data: {
    name: string;
    email: string;
    password: string;
    age: string;
  }) => Promise<User>;
  signIn: (data: { email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  handleGoogleSignIn: (data: object) => Promise<User>;
}

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,

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
        set((s) => ({ notifications: [...s.notifications, notification] })),

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      clearNotifications: () => set({ notifications: [] }),

      signup: async (data) => {
        const { setUser, setLoading, setError, addNotification } = get();

        try {
          setLoading(true);
          setError(false);

          const res = await API.post("/api/user/register", data);
          const user = res.data.user ?? res.data;

          setUser(user, true); // ✔ always replace on signup

          addNotification({
            id: Date.now().toString(),
            message: "Signup successful!",
            read: false,
          });

          return user;
        } catch (err) {
          setError(true);

          addNotification({
            id: Date.now().toString(),
            message: "Signup failed. Please try again.",
            read: false,
          });

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

          setUser(user, true); // ✔ replace full object when signing in

          addNotification({
            id: Date.now().toString(),
            message: "SignIn successful!",
            read: false,
          });

          return user;
        } catch (err) {
          setError(true);
          addNotification({
            id: Date.now().toString(),
            message: "SignIn failed. Please try again.",
            read: false,
          });

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

          setUser(res.data, true); // ✔ replace full object

          addNotification({
            id: Date.now().toString(),
            message: "Google SignIn successful!",
            read: false,
          });

          return res.data;
        } catch (err) {
          setError(true);
          addNotification({
            id: Date.now().toString(),
            message: "SignIn failed. Please try again.",
            read: false,
          });

          throw err;
        } finally {
          setLoading(false);
        }
      },

      logout: async () => {
        const { clearUser, setLoading, setError, addNotification } = get();
        try {
          setLoading(true);
          setError(false);
          await API.post("/api/user/logout");
          clearUser();
          addNotification({
            id: Date.now().toString(),
            message: "Logout successful!",
            read: false,
          });
        } catch (err) {
          setError(true);
          addNotification({
            id: Date.now().toString(),
            message: "Logout failed. Please try again.",
            read: false,
          });
          throw err;
        } finally {
          setLoading(false);
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
          setUser(updatedUser, true);

          addNotification({
            id: Date.now().toString(),
            message: "Profile updated successfully!",
            read: false,
          });
        } catch (err) {
          setError(true);
          addNotification({
            id: Date.now().toString(),
            message: "Profile update failed.",
            read: false,
          });
          throw err;
        } finally {
          setLoading(false);
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
      }),
    }
  )
);

export default useAppStore;
