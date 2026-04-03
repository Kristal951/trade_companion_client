import { MentorApplicationForm } from "@/components/mentors/mentorApplication/types";
import { useState } from "react";

export const useMentorApplication = (
  onCancel: () => void,
  onForfeit: () => void,
) => {
  const [step, setStep] = useState(0);
  const [showForfeitModal, setShowForfeitModal] = useState(false);

  const [formData, setFormData] = useState<MentorApplicationForm>({
    country: "",
    idType: "",
    idFile: null,
    addressFile: null,
    addressType: "Utility Bill",

    tradeHistoryFile: null,
    trackRecordLinks: "",
    avgMonthlyReturn: "",
    maxDrawdown: "",
    strategyDescription: "",
    signalGenMethod: "",

    riskManagementAdvice: "",

    signalFrequency: "",
    timeZones: "",
    pricingStructure: "",
    antiForgerySteps: "",
    ethicalDisclosures: "",
    riskCommunication: "",

    personalStatement: "",
    agreeToTerms: false,
  });

  const updateField = <K extends keyof MentorApplicationForm>(
    field: K,
    value: MentorApplicationForm[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

const addStep = () => {
  setStep((prev) => prev + 1);
};

const removeStep = () => {
  setStep((prev) => Math.max(prev - 1, 0));
};


  const handleBackAttempt = () => {
    if (step === 0) {
      onCancel();
      return;
    }
    setShowForfeitModal(true);
  };

  const confirmForfeit = () => {
    setShowForfeitModal(false);
    onForfeit();
  };

  return {
    step,
    setStep,
    formData,
    updateField,
    showForfeitModal,
    setShowForfeitModal,
    handleBackAttempt,
    confirmForfeit,
    addStep,
    removeStep
  };
};
