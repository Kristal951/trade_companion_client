export interface User {
  name: string;
  email: string;
  avatar?: string;
  telegramNumber?: string;
  subscribedPlan?: PlanName;
  isMentor: boolean;
}

export enum PlanName {
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

export interface Mentor {
  id: number;
  name: string;
  avatar: string;
  experience: number; // in years
  profitRatio: number; // as percentage
  roi: number; // return on investment
  instruments: string[];
  price: number; // monthly subscription price
  strategy: string;
  posts?: MentorPost[];
  certifications?: { name:string; url: string }[];
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
  takeProfit: number;
  reasoning: string;
  timestamp: string;
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
  | "billing"
  | "apply_mentor"
  | "edit_profile"
  | "education"
  | "lot_size_calculator"
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
}