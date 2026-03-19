import React from "react";
import FileUpload from "@/components/ui/FileUpload";
import { useMentorApplication } from "@/store/useMentorApplication";

const TradingExperience: React.FC<{
  setStep: (step: number) => void;
  handleBackAttempt: () => void;
}> = ({ setStep, handleBackAttempt }) => {
  const { formData, updateField } = useMentorApplication();

  const isDisabled =
    !formData.tradeHistoryFile ||
    !formData.strategyDescription ||
    !formData.avgMonthlyReturn;

  return (
    <div className="animate-fade-in-right space-y-6">
      <h2 className="text-xl font-bold text-dark-text border-b border-light-gray pb-2">
        Step 2: Trading Experience & Expertise
      </h2>

      <div className="space-y-4">
        <h3 className="font-semibold text-primary text-xs uppercase tracking-wide">
          Track Record Verification
        </h3>

        <div>
          <label className="block text-xs font-medium text-dark-text mb-1">
            Verified Links (Optional)
          </label>
          <input
            type="text"
            value={formData.trackRecordLinks}
            onChange={(e) => updateField("trackRecordLinks", e.target.value)}
            className="w-full bg-light-hover border border-light-gray rounded-lg px-3 py-2 text-sm text-dark-text focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Myfxbook / FXBlue / MQL5 link..."
          />
          <p className="text-[11px] text-mid-text mt-1">
            Providing this significantly increases your approval chance.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-dark-text mb-1">
              Avg. Monthly Return (%)
            </label>
            <input
              type="text"
              value={formData.avgMonthlyReturn}
              onChange={(e) => updateField("avgMonthlyReturn", e.target.value)}
              className="w-full bg-light-hover border border-light-gray rounded-lg px-3 py-2 text-sm text-dark-text"
              placeholder="e.g. 5-10%"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-text mb-1">
              Max Drawdown (%)
            </label>
            <input
              type="text"
              value={formData.maxDrawdown}
              onChange={(e) => updateField("maxDrawdown", e.target.value)}
              className="w-full bg-light-hover border border-light-gray rounded-lg px-3 py-2 text-sm text-dark-text"
              placeholder="e.g. 8%"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-dark-text mb-1">
            Broker Trade History (Mandatory)
          </label>
          <FileUpload
            label={
              formData.tradeHistoryFile
                ? "File Selected"
                : "Upload trade history"
            }
            hint="CSV, HTML, or PDF. Last 2 months minimum"
            onFileSelect={(file) => updateField("tradeHistoryFile", file)}
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-light-gray">
        <h3 className="font-semibold text-primary text-xs uppercase tracking-wide">
          Strategy & Methodology
        </h3>

        <div>
          <label className="block text-xs font-medium text-dark-text mb-1">
            Describe your Primary Strategy
          </label>
          <textarea
            rows={4}
            value={formData.strategyDescription}
            onChange={(e) => updateField("strategyDescription", e.target.value)}
            className="w-full bg-light-hover border border-light-gray rounded-lg px-3 py-2 text-sm text-dark-text focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="E.g., Trend following on H4 using supply/demand zones. I incorporate volatility-based position sizing..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-dark-text mb-1">
            Signal Generation Method
          </label>
          <textarea
            rows={2}
            value={formData.signalGenMethod}
            onChange={(e) => updateField("signalGenMethod", e.target.value)}
            className="w-full bg-light-hover border border-light-gray rounded-lg px-3 py-2 text-sm text-dark-text"
            placeholder="Discretionary, algorithmic, or AI-assisted? Describe the technology."
          />
        </div>
      </div>
    </div>
  );
};

export default TradingExperience;
