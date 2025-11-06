export interface User {
  name: string;
  email: string;
  avatar?: string;
  telegramNumber?: string;
  subscribedPlan?: PlanName;
  isMentor: boolean;
}

export enum PlanName {
  Free = "Free",
  Basic = "Basic",
  Pro = "Pro",
  Premium = "Premium",
}

export interface Plan {
  name: PlanName;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

// FIX: Export the Mentor interface
export interface Mentor {
  id: number;
  name: string;
  avatar: string;
  experience: number;
  profitRatio: number;
  instruments: string[];
  price: number;
  roi: number; // Return on Investment
  strategy: string; // Formerly 'bio'
  posts?: MentorPost[]; // Optional: list of posts by the mentor
  certifications?: { name: string; url: string; }[]; // Optional: certifications or proof
}

export interface MentorPost {
  id: number;
  type: 'signal' | 'analysis';
  title: string;
  content: string; // reasoning for signal or body for analysis
  imageUrl?: string; // for attached chart
  timestamp: string;
  signalDetails?: {
    instrument: string;
    direction: 'BUY' | 'SELL';
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
  status: 'Active' | 'Cancelled';
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


export interface TradeRecord extends Omit<Signal, 'takeProfit2' | 'takeProfit3' | 'confidence' | 'technicalReasoning'> {
  id: string; // Unique ID for the trade
  status: 'active' | 'win' | 'loss';
  pnl?: number; // Profit or Loss amount
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
  | "mentor_profile";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface EducationArticle {
  id: number;
  category: string;
  title: string;
  summary: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  type: 'article' | 'book' | 'video'; 
  content: string; // Full content of the article or book
  videoUrl?: string; // URL for video content
}

export type NotificationType = 'signal' | 'mentor' | 'promo' | 'news' | 'app_update';

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  linkTo: DashboardView;
  type: NotificationType;
}