import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, Notification, Plan, Mentor, PlanName } from "@/types";
import { API, setAccessToken } from "@/utils";

export type PaymentState = "loading" | "success" | "processing" | "error";

export type SubscriptionData = {
  plan?: string;
  status?: string;
  interval?: string;
  currentPeriodEnd?: string;
  method?: "stripe" | "manual" | "promo" | "apple" | "google_play" | null;
  priceKey?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
  isSubscribed?: boolean;
};

type BillingCycle = "monthly" | "yearly";

type BillingPlan = {
  name: string;
  type?: "free" | "paid";
};

interface AppState {
  user: User | null;
  mentor: Mentor | null;
  isLoggedIn: boolean;
  isHydrating: boolean;
  accessToken: string;
  plans: Plan[];
  stripeCustomerId: string;
  processingPlan: string | null;
  isOpeningBillingPortal: boolean;

  IsLoggingOut: boolean;
  loading: boolean;
  error: boolean;
  darkMode: boolean;
  notifications: Notification[];

  paymentState: PaymentState;
  paymentMessage: string;
  paymentSubscription: SubscriptionData | null;
  isVerifyingPayment: boolean;

  setIsHydrating: (isHydrating: boolean) => void;
  setIsLoggingOut: (IsLoggingOut: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: boolean) => void;
  toggleDarkMode: () => void;

  setProcessingPlan: (value: string | null) => void;

  changePlanWithStripe: (data: {
    plan: BillingPlan;
    billingCycle: BillingCycle;
  }) => Promise<{
    redirected?: boolean;
    changed?: boolean;
    message?: string;
  }>;

  openBillingPortal: () => Promise<{ url?: string; message?: string }>;

  setUser: (user: User | Partial<User> | null, replace?: boolean) => void;
  setMentor: (mentor: Mentor | Partial<Mentor>, replace?: boolean) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;

  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  syncUserSubscription: (
    subscription: SubscriptionData,
    apiUser?: Partial<User>,
  ) => void;

  signup: (data: {
    name: string;
    email: string;
    password: string;
    age: string;
  }) => Promise<void>;

  signIn: (data: { email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  handleGoogleSignIn: (data: object) => Promise<User>;

  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: {
    token: string;
    newPassword: string;
  }) => Promise<void>;
  verifyEmailCode: (code: string) => Promise<User>;
  resendVerificationCode: () => Promise<void>;

  getPlans: () => Promise<Plan[]>;
  getPlanById: (planID: string) => Promise<Plan>;

  startUserSubscription: (data: {
    name: string;
    email: string;
    planKey: string;
    planID: string;
  }) => Promise<any>;

  startUserSubscriptionwithStripe: (plan: string) => Promise<string>;

  hydrateUser: () => Promise<{ user: User; accessToken: string } | null>;

  verifyStripeSession: (sessionId: string | null) => Promise<void>;
  resetPaymentState: () => void;
}

const initialPaymentState = {
  paymentState: "loading" as PaymentState,
  paymentMessage: "Finalizing your subscription...",
  paymentSubscription: null as SubscriptionData | null,
  isVerifyingPayment: false,
};

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      mentor: null,
      isLoggedIn: false,
      isHydrating: false,
      accessToken: "",
      plans: [],
      stripeCustomerId: "",
      processingPlan: null,
      isOpeningBillingPortal: false,

      IsLoggingOut: false,
      loading: false,
      error: false,
      darkMode: false,
      notifications: [],

      ...initialPaymentState,

      setIsLoggingOut: (IsLoggingOut) => set({ IsLoggingOut }),
      setIsHydrating: (isHydrating) => set({ isHydrating }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setProcessingPlan: (value) => set({ processingPlan: value }),

      syncUserSubscription: (subscription, apiUser) => {
        const currentUser = get().user;
        if (!currentUser && !apiUser) return;

        const nextUser: User = {
          ...(currentUser as User),
          ...(apiUser as Partial<User>),

          subscribedPlan:
            apiUser?.subscribedPlan ||
            subscription?.plan ||
            currentUser?.subscribedPlan ||
            PlanName.Free,

          isSubscribed:
            apiUser?.isSubscribed ?? subscription?.isSubscribed ?? true,

          subscriptionStatus:
            apiUser?.subscriptionStatus ||
            subscription?.status ||
            currentUser?.subscriptionStatus ||
            null,

          subscriptionMethod:
            apiUser?.subscriptionMethod ||
            subscription?.method ||
            currentUser?.subscriptionMethod ||
            "stripe",

          subscriptionPriceKey:
            apiUser?.subscriptionPriceKey ||
            subscription?.priceKey ||
            currentUser?.subscriptionPriceKey ||
            null,

          subscriptionInterval:
            apiUser?.subscriptionInterval ||
            subscription?.interval ||
            currentUser?.subscriptionInterval ||
            null,

          subscriptionCurrentPeriodEnd:
            apiUser?.subscriptionCurrentPeriodEnd ||
            subscription?.currentPeriodEnd ||
            currentUser?.subscriptionCurrentPeriodEnd ||
            null,

          stripeCustomerId:
            apiUser?.stripeCustomerId ||
            subscription?.stripeCustomerId ||
            currentUser?.stripeCustomerId ||
            null,

          stripeSubscriptionId:
            apiUser?.stripeSubscriptionId ||
            subscription?.stripeSubscriptionId ||
            currentUser?.stripeSubscriptionId ||
            null,

          stripeCheckoutSessionId:
            apiUser?.stripeCheckoutSessionId ||
            subscription?.stripeCheckoutSessionId ||
            currentUser?.stripeCheckoutSessionId ||
            null,
        };

        set({
          user: nextUser,
          isLoggedIn: true,
        });
      },

      setUser: (userData, replace = false) =>
        set((state) => {
          if (!userData) {
            return {
              user: null,
              isLoggedIn: false,
            };
          }

          if (replace || !state.user) {
            return {
              user: userData as User,
              isLoggedIn: true,
            };
          }

          const incoming = userData as Partial<User>;

          return {
            user: {
              ...state.user,
              ...incoming,
              telegram: {
                ...state.user.telegram,
                ...incoming.telegram,
              },
              notificationSettings: {
                ...state.user.notificationSettings,
                ...incoming.notificationSettings,
              },
              cTraderConfig: {
                ...state.user.cTraderConfig,
                ...incoming.cTraderConfig,
              },
              // lastLoginLocation: {
              //   ...state.user.lastLoginLocation,
              //   ...incoming.lastLoginLocation,
              // },
            },
            isLoggedIn: true,
          };
        }),

      setMentor: (mentorData, replace = false) =>
        set((state) => {
          if (replace || !state.mentor) {
            return { mentor: mentorData as Mentor };
          }

          return {
            mentor: { ...state.mentor, ...mentorData },
          };
        }),

      clearUser: () =>
        set({
          user: null,
          mentor: null,
          isLoggedIn: false,
          accessToken: "",
        }),

      addNotification: (notification) =>
        set((s) => {
          const exists = s.notifications.some((n) => n.id === notification.id);
          return {
            notifications: exists
              ? s.notifications
              : [...s.notifications, notification],
          };
        }),

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
        })),

      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({
            ...n,
            isRead: true,
          })),
        })),

      clearNotifications: () => set({ notifications: [] }),

      signup: async (data) => {
        const { setLoading, setError, addNotification } = get();

        try {
          setLoading(true);
          setError(false);

          await API.post("/api/user/register", data);

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
          const { user, accessToken } = res.data;
          console.log(user);

          localStorage.setItem("accessToken", accessToken);
          setAccessToken(accessToken);

          set({
            accessToken,
          });
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
        } catch (err: any) {
          setError(true);

          addNotification({
            id: Date.now().toString(),
            message: "SignIn unsuccessful!",
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

      handleGoogleSignIn: async (data) => {
        const { setUser, setLoading, setError, addNotification } = get();

        try {
          setLoading(true);
          setError(false);

          const res = await API.post("/api/user/google_login", data);
          const { user, accessToken } = res.data;

          if (accessToken) {
            localStorage.setItem("accessToken", accessToken);
            setAccessToken(accessToken);
            set({ accessToken });
          }

          setUser(user ?? res.data, true);

          addNotification({
            id: Date.now().toString(),
            message: "Google SignIn successful!",
            isRead: false,
            timestamp: new Date().toISOString(),
            linkTo: "dashboard",
            type: "app_update",
          });

          return user ?? res.data;
        } catch (err) {
          setError(true);
          throw err;
        } finally {
          setLoading(false);
        }
      },

      logout: async () => {
        const { clearUser, setLoading, setIsLoggingOut } = get();

        try {
          setLoading(true);
          setIsLoggingOut(true);

          await API.post("/api/user/logout");
        } catch (error) {
          console.error("Logout request failed:", error);
        } finally {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setAccessToken(null);
          clearUser();

          setLoading(false);
          setIsLoggingOut(false);
        }
      },
      updateUser: async (updates) => {
        const { setUser, setLoading, setError, addNotification } = get();

        try {
          setLoading(true);
          setError(false);

          const formData = new FormData();

          if (updates.avatar instanceof File) {
            formData.append("avatar", updates.avatar);
          }

          Object.entries(updates).forEach(([key, value]) => {
            if (key === "avatar" || value === undefined || value === null)
              return;

            if (
              typeof value === "object" &&
              !(value instanceof File) &&
              !(value instanceof Date)
            ) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
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
            isRead: false,
            timestamp: new Date().toISOString(),
            linkTo: "dashboard",
            type: "app_update",
          });
        } catch (err) {
          setError(true);

          addNotification({
            id: Date.now().toString(),
            message: "Profile update failed. Please try again.",
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
          const { user, accessToken } = res.data;

          localStorage.setItem("accessToken", accessToken);
          setAccessToken(accessToken);

          set({
            accessToken,
          });
          setUser(user, true);

          return user;
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

      forgotPassword: async (email) => {
        const { setLoading, setError } = get();

        try {
          setLoading(true);
          setError(false);
          await API.post("/api/user/forgot_password", { email });
        } catch (error) {
          setError(true);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      resetPassword: async (data) => {
        const { setLoading, setError } = get();

        try {
          setLoading(true);
          setError(false);

          await API.post(`/api/user/reset_password/${data.token}`, data);
        } catch (error) {
          setError(true);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      getPlans: async () => {
        const { setLoading, setError } = get();

        try {
          setLoading(true);
          setError(false);

          const res = await API.get("/api/plans/getPlans");
          const plans = res.data;

          set({ plans });
          return plans;
        } catch (error) {
          setError(true);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      getPlanById: async (planID) => {
        const { setLoading, setError } = get();

        try {
          setLoading(true);
          setError(false);

          const res = await API.get(`/api/plans/getPlan/${planID}`);
          return res.data;
        } catch (error) {
          setError(true);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      startUserSubscription: async (data) => {
        const { setLoading, setError } = get();

        try {
          setLoading(true);
          setError(false);

          const res = await API.post(
            "/api/plans/startSubscriptionPayment",
            data,
          );
          return res;
        } catch (error) {
          setError(true);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      startUserSubscriptionwithStripe: async (plan) => {
        const { setLoading, setError } = get();

        try {
          setLoading(true);
          setError(false);

          const res = await API.post("/api/stripe/checkout", {
            selectedPlan: plan,
          });

          return res.data.url;
        } catch (error) {
          setError(true);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      hydrateUser: async () => {
        const { setIsHydrating, setUser } = get();
        setIsHydrating(true);

        try {
          const res = await API.post("/api/user/refresh_token");
          const newAccessToken = res?.data?.accessToken;

          if (!newAccessToken) {
            setUser(null, true);
            set({ accessToken: "" });
            return null;
          }

          setAccessToken(newAccessToken);

          const meRes = await API.get("/api/user/me", {
            headers: { Authorization: `Bearer ${newAccessToken}` },
            withCredentials: true,
          });

          const userData = meRes.data.user;

          set({
            user: userData,
            isLoggedIn: true,
            accessToken: newAccessToken,
          });

          return { user: userData, accessToken: newAccessToken };
        } catch (err) {
          setUser(null, true);
          set({ accessToken: "" });
          return null;
        } finally {
          setIsHydrating(false);
        }
      },

      verifyStripeSession: async (sessionId) => {
        if (!sessionId) {
          set({
            paymentState: "error",
            paymentMessage:
              "No payment session was found. Please contact support.",
            paymentSubscription: null,
            isVerifyingPayment: false,
          });
          return;
        }

        set({
          paymentState: "loading",
          paymentMessage: "Finalizing your subscription...",
          paymentSubscription: null,
          isVerifyingPayment: true,
        });

        try {
          const { data } = await API.post(
            "/api/stripe/confirm-session",
            { sessionId },
            { withCredentials: true },
          );

          if (data.status === "active") {
            const subscription = data.subscription ?? null;

            set({
              paymentState: "success",
              paymentMessage: "Your subscription has been activated.",
              paymentSubscription: subscription,
              isVerifyingPayment: false,
            });

            if (subscription) {
              console.log(subscription);
              get().setUser({
                subscribedPlan: subscription.appPlan,
                isSubscribed: true,
                subscriptionStatus: subscription.status,
                subscriptionInterval: subscription.interval,
                subscriptionCurrentPeriodEnd: subscription.currentPeriodEnd,
                subscriptionMethod: subscription.method,
                stripeCustomerId: subscription.stripeCustomerId,
              });
            }

            return;
          }

          if (data.status === "processing") {
            set({
              paymentState: "processing",
              paymentMessage:
                data.message ||
                "Your payment is still being processed. This usually resolves shortly.",
              paymentSubscription: data.subscription ?? null,
              isVerifyingPayment: false,
            });
            return;
          }

          set({
            paymentState: "error",
            paymentMessage: data.message || "We could not verify your payment.",
            paymentSubscription: null,
            isVerifyingPayment: false,
          });
        } catch (err: any) {
          set({
            paymentState: "error",
            paymentMessage:
              err?.response?.data?.message ||
              "A connection error occurred while verifying your payment.",
            paymentSubscription: null,
            isVerifyingPayment: false,
          });
        }
      },
      changePlanWithStripe: async ({ plan, billingCycle }) => {
        const { setLoading, setError, setUser, user } = get();

        try {
          setLoading(true);
          setError(false);

          const currentPlanName = user?.subscribedPlan || "Free";
          const currentInterval = user?.subscriptionInterval || "monthly";
          const hasStripeCustomer = Boolean(user?.stripeCustomerId);
          const isSubscribed = Boolean(user?.isSubscribed);

          const isSamePlan =
            currentPlanName.toLowerCase() === plan.name.toLowerCase() &&
            currentInterval + "ly" === billingCycle;

          if (isSamePlan) {
            return {
              changed: false,
              message: "You are already on this plan",
            };
          }

          if (plan.type === "free") {
            throw new Error(
              "Use cancel subscription to move back to the free plan",
            );
          }

          const selectedPlan = `${plan.name.toLowerCase()}-${billingCycle}`;

          set({ processingPlan: selectedPlan });

          if (hasStripeCustomer && isSubscribed) {
            const res = await API.post("/api/stripe/change-subscription", {
              selectedPlan,
            });

            const data = res?.data;

            if (data?.user) {
              setUser(data.user, true);
            } else if (data?.subscription) {
              get().syncUserSubscription(data.subscription);
            }

            return {
              changed: true,
              message:
                data?.message ||
                `Plan updated to ${plan.name} (${billingCycle})`,
            };
          }

          const res = await API.post("/api/stripe/checkout", {
            selectedPlan,
          });

          const data = res?.data;

          if (!data?.url) {
            throw new Error("No checkout URL returned");
          }

          window.location.href = data.url;

          return {
            redirected: true,
            message: "Redirecting to checkout...",
          };
        } catch (error: any) {
          setError(true);
          throw error;
        } finally {
          setLoading(false);
          set({ processingPlan: null });
        }
      },

      openBillingPortal: async () => {
        const { setError } = get();

        try {
          setError(false);
          set({ isOpeningBillingPortal: true });

          const res = await API.post("/api/stripe/billing-portal");
          const data = res?.data;

          if (!data?.url) {
            throw new Error("No billing portal URL returned");
          }

          window.location.href = data.url;

          return {
            url: data.url,
            message: "Opening billing portal...",
          };
        } catch (error: any) {
          setError(true);
          throw error;
        } finally {
          set({ isOpeningBillingPortal: false });
        }
      },

      resetPaymentState: () => set({ ...initialPaymentState }),
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        darkMode: state.darkMode,
        notifications: state.notifications,
        accessToken: state.accessToken,
      }),
    },
  ),
);

export default useAppStore;
