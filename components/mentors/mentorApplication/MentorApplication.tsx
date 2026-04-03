import React from "react";
import { MentorApplicationPageProps } from "./types";
import Start from "./steps/Start";
// import StepIdentity from "./steps/StepIdentity";
import ProgressBar from "@/components/ui/MentorApplicationProgressBar";
// import ForfeitModal from "./components/ForfeitModal";
import { useMentorApplication } from "@/store/useMentorApplication";
import Identity from "./steps/Identity";
import Icon from "@/components/ui/Icon";
import TradingExperience from "./steps/TradingExperience";

const MentorApplicationPage: React.FC<MentorApplicationPageProps> = ({
  user,
  onApply,
  onCancel,
  onForfeit,
}) => {
  // Todo: Pending state can be re-enabled later
  // if (user.mentorApplicationStatus === "Pending") {
  //   return <UnderReviewScreen onCancel={onCancel} />;
  // }

  const {
    step,
    setStep,
    formData,
    updateField,
    showForfeitModal,
    setShowForfeitModal,
    handleBackAttempt,
    confirmForfeit,
    removeStep,
    addStep,
  } = useMentorApplication(onCancel, onForfeit);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(formData);
  };

  const steps = [
    <Start key="start" onNext={() => setStep(1)} />,

    <Identity
      key="identity"
      data={formData}
      onChange={updateField}
      onNext={() => setStep(2)}
      onBack={handleBackAttempt}
    />,

    <TradingExperience/>
  ];

  return (
    <div className="w-full min-h-screen items-center bg-light-bg flex flex-col justify-center pt-8">
      <div className="w-full max-w-[80%] h-max flex flex-col justify-between bg-light-surface p-6 md:p-8 rounded-xl shadow-lg border border-light-gray">
        <ProgressBar step={step} />

        <form onSubmit={handleSubmit}>{steps[step]}</form>

        <div className="flex justify-between items-center mt-4">
          <button
            type="button"
             onClick={removeStep}
            className="text-mid-text hover:text-dark-text font-semibold"
          >
            {step > 0 ? (
              <div className="flex ">
                <Icon name="arrowLeft" />
                <p>Back</p>
              </div>
            ) : (
              "Cancel"
            )}
          </button>
          {step === 0 ? (
            <button
              type="button"
              onClick={addStep}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-primary-hover transition"
            >
              I Accept & Start
            </button>
          ) : (
            <button
             onClick={addStep}
              type="submit"
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-primary-hover transition"
            >
              Continue
            </button>
          )}
        </div>
      </div>

      {/* Forfeit Modal OUTSIDE form */}
      {/* {showForfeitModal && (
        // <ForfeitModal
        //   onCancel={() => setShowForfeitModal(false)}
        //   onConfirm={confirmForfeit}
        // />
      )} */}
    </div>
  );
};

export default MentorApplicationPage;
