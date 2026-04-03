import CheckListItem from "@/components/ui/CheckListItem";
import Icon from "@/components/ui/Icon";
import { useMentorApplication } from "@/store/useMentorApplication";
import React from "react";

const Start = () => {
  const { step } = useMentorApplication();
  return (
    <div className="flex w-full flex-col h-full">
      <h2 className="text-2xl font-bold text-primary mb-4">
        Mentor Application Protocol
      </h2>
      <div className="bg-light-hover p-5 rounded-lg border border-light-gray mb-6 text-sm text-dark-text space-y-3">
        <p className="font-semibold text-xl mb-6">
          Our platform maintains a zero-tolerance policy for manipulated proofs.
          Sentinel AI will audit your application against the following
          criteria:
        </p>
        <div className="pl-5 space-y-2 text-base mb-6">
          <CheckListItem
            icon="profile"
            title="Identity Verification"
            description="Government-issued ID + Proof of Address (Utility Bill or Bank Statement)."
          />
          <CheckListItem
            icon="chart"
            title="Trading Experience"
            description="Minimum of 2 months broker history (mandatory). Verified links are optional but recommended."
          />
          <CheckListItem
            icon="suit-case"
            title="Mentor Responsibility"
            description=" As a mentor, you are expected to provide
            high-quality signals and market insights."
          />
           <CheckListItem
            icon="shield"
            title="Integrity & Compliance"
            description="Strict anti-forgery checks and ethical disclosure enforcement."
          />
        </div>
        {/* <div className="p-3 bg-danger/10 border border-danger/20 rounded text-danger font-bold flex items-start mt-4">
          <Icon name="danger" className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          Warning: Aborting the application process after this step will result
          in an immediate 30-day cooldown block.
        </div> */}
      </div>
    </div>
  );
};

export default Start;
