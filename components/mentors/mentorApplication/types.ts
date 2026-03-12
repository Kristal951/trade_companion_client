import { User } from "@/types";

export interface MentorApplicationPageProps {
  user: User;
  onApply: (applicationData: MentorApplicationForm) => void;
  onCancel: () => void;
  onForfeit: () => void;
}

export interface MentorApplicationForm {
  country: string;
  idType: string;
  idFile: File | null;
  addressFile: File | null;
  addressType: "Utility Bill" | "Bank Statement";

  tradeHistoryFile: File | null;
  trackRecordLinks: string;
  avgMonthlyReturn: string;
  maxDrawdown: string;
  strategyDescription: string;
  signalGenMethod: string;

  riskManagementAdvice: string;

  signalFrequency: string;
  timeZones: string;
  pricingStructure: string;
  antiForgerySteps: string;
  ethicalDisclosures: string;
  riskCommunication: string;

  personalStatement: string;
  agreeToTerms: boolean;
}
