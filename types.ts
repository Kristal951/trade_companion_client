export interface User {
  id: string;
  _id?: string;
  picture?: string;
  subscribedPlan?: string;
  name: string;
  email: string;
  avatar?: string;
  plan?: PlanName;
  isMentor: boolean;
  isSubscribed?: boolean;
  subscriptionStatus?: string | null;
  telegram: Telegram;
  subscriptionMethod?:
    | "stripe"
    | "manual"
    | "promo"
    | "apple"
    | "google_play"
    | null;
  subscriptionPriceKey?: string | null;
  subscriptionInterval?: string | null;
  subscriptionCurrentPeriodEnd?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
  cTraderConfig?: {
    accountId: string;
    isConnected: boolean;
    autoTradeEnabled: boolean;
  };
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  telegram: boolean;
}

export interface Telegram {
  chatId: string;
  userName: string;
  linkedAt: string;
}

export interface Plan {
  id: string;
  name: string;
  amount: number;
  features: string[];
  currency: string;
  interval: "monthly" | "yearly";
}

export interface TopSignal {
  instrument: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number;
  profit: number;
  pips: number;
  timestamp: string;
}

export enum PlanName {
  Free = "Free",
  Basic = "Basic",
  Pro = "Pro",
  Premium = "Premium",
}

export interface Payout {
  id: string;
  amount: number;
  dateRequested: string;
  dateCompleted?: string;
  status: "Pending" | "Completed" | "Failed";
  method: string;
}

export interface Mentor {
  id: number;
  name: string;
  avatar: string;
  experience: number;
  profitRatio: number;
  instruments: string[];
  price: number;
  roi: number;
  strategy: string;
  rating?: number;
  reviewsCount?: number;
  posts?: MentorPost[]; // Optional: list of posts by the mentor
  certifications?: { name: string; url: string }[]; // Optional: certifications or proof
  recentSignals?: RecentSignal[]; // NEW: Added recent signals for performance tracking
  subscriberGrowth?: { month: string; subscribers: number }[];
  earnings?: {
    currentBalance: number;
    lifetime: number;
  };
  payoutHistory?: Payout[];
  identity?: {
    idDocument: {
      status: "Not Submitted" | "Pending" | "Verified" | "Rejected";
      type?:
        | "Driver's License"
        | "International Passport"
        | "National ID"
        | "NIN Slip";
      fileName?: string;
    };
    addressDocument: {
      status: "Not Submitted" | "Pending" | "Verified" | "Rejected";
      type?: "Utility Bill" | "Bank Statement";
      fileName?: string;
    };
    livenessCheck: {
      status: "Not Submitted" | "Pending" | "Verified" | "Rejected";
    };
    overallStatus: "Not Submitted" | "Pending" | "Verified" | "Rejected";
    rejectionReason?: string;
  };
  analytics?: {
    earningsData: { month: string; earnings: number }[];
    subscriberData: { month: string; new: number; churned: number }[];
    ratingDistribution: { rating: number; count: number }[];
    topSignals: RecentSignal[];
  };
}

export interface RecentSignal {
  id: string;
  instrument: string;
  direction: "BUY" | "SELL";
  entry: string;
  stopLoss: string;
  takeProfit: string;
  outcome: "win" | "loss";
  timestamp: string;
  pnl?: number;
}

export interface MentorPost {
  mentorID: number;
  type: "signal" | "analysis";
  title: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
  signalDetails?: {
    direction: "BUY" | "SELL";
    entry: string;
    stopLoss: string;
    takeProfit: string;
  };
}

export interface MentorSubscriber {
  id: number;
  name: string;
  avatar: string;
  subscribedDate: string;
  status: "Active" | "Cancelled";
  ratingGiven?: number;
  userId: string
}

export interface Signal {
  instrument: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2?: number;
  takeProfit3?: number;
  timestamp: string;
  confidence: number;
  reasoning: string; // From FinGPT/analyst model
  technicalReasoning: string; // From pattern model
  lotSize?: number; // Calculated per user
  riskAmount?: number; // Calculated per user
}

// FIX: Removed 'confidence' from Omit to make it available in the TradeRecord type for analytics.
// FIX: Removed 'technicalReasoning' from Omit to allow inclusion in TradeRecord (App.tsx uses it).
// FIX: Removed 'takeProfit2' and 'takeProfit3' from Omit to allow their display in UI.
export interface TradeRecord extends Signal {
  id: string; // Unique ID for the trade
  status: "active" | "win" | "loss";
  pnl?: number; // Profit or Loss amount
  currentPrice?: number; // Live price of the instrument
  dateTaken: string;
  dateClosed?: string;
  initialEquity: number; // Equity before this trade
  finalEquity?: number; // Equity after this trade
  takeProfit: number; // Mapping takeProfit1 to takeProfit for consistency with old record
}

export interface Review {
  id: number;
  name: string;
  avatar: string;
  text: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export type DashboardView =
  | "dashboard"
  | "ai_signals"
  | "mentors"
  | "analytics"
  | "settings"
  | "apply_mentor"
  | "education"
  | "education_content" // New view for displaying full educational content
  | "lot_size_calculator"
  | "market_chart"
  | "mentor_dashboard"
  | "mentor_profile"
  | "mentor_payouts"
  | "followers"
  | "contact_us";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface EducationArticle {
  id: number;
  category: string;
  title: string;
  summary: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  type: "article" | "book" | "video";
  content: string;
  videoUrl?: string;
}

export type NotificationType =
  | "signal"
  | "mentor_post"
  | "billing"
  | "promo"
  | "news"
  | "system"
  | "app_update";

export type NotificationPriority = "low" | "normal" | "high";

export interface Notification {
  _id: string;
  recipient: string;
  actor?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  linkTo?: string | null;
  image?: string | null;
  isRead: boolean;
  readAt?: string | null;
  priority: NotificationPriority;
  deliveryChannels?: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
  meta?: {
    mentorId?: string | null;
    signalId?: string | null;
    postId?: string | null;
    subscriptionId?: string | null;
    externalId?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}
