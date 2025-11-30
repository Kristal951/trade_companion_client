import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/types";
import { API } from "@/utils";

export interface Notification {
  id: string;
  message: string;
  read: boolean;
}

interface AppState {
  user: User | null;
  isLoggedIn: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;

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

  signup: (data: { name: string; email: string; password: string; age: string }) => Promise<User>;
  signIn: (data: { email: string; password: string;}) => Promise<User>;
}

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      setUser: (user) => set({ user, isLoggedIn: true }),
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
          console.log(user)

          setUser(user);
          console.log(user)

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
      signIn: async (data: any) => {
        const { setLoading, setError, addNotification } = get();

        try {
          setLoading(true);
          setError(false);

          const res = await API.post("/api/user/login", data);
          const user = res.data.user
          console.log(user)

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
