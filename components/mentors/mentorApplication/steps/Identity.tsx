import React from "react";
import { ALLOWED_FOREX_COUNTRIES } from "../constants";
import FileUpload from "@/components/ui/FileUpload";
import { useMentorApplication } from "@/store/useMentorApplication";

const Identity: React.FC = () => {
  const onCancel =()=>{

  }
  const onForfeit =()=>{

  }
  const { formData, updateField } = useMentorApplication(onCancel, onForfeit);

  const isDisabled =
    !formData.country ||
    !formData.idType ||
    !formData.idFile ||
    !formData.addressFile;

    const types = ["Utility Bill", "Bank Statement"] as const;

  return (
    <div className="animate-fade-in-right space-y-5">
      <div>
        <h2 className="text-lg font-bold text-dark-text">
          Step 1 · Identity Verification
        </h2>
        <p className="text-xs text-mid-text">
          Government-issued documents required.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-dark-text mb-1">
              Country of Residence
            </label>
            <select
              value={formData.country}
              onChange={(e) => updateField("country", e.target.value)}
              className="w-full bg-light-hover border border-light-gray rounded-lg px-3 py-2 text-sm text-dark-text focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="" disabled>
                Select country
              </option>
              {ALLOWED_FOREX_COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-text mb-1">
              Government ID
            </label>
            <select
              value={formData.idType}
              onChange={(e) => updateField("idType", e.target.value)}
              className="w-full bg-light-hover border border-light-gray rounded-lg px-3 py-2 text-sm text-dark-text focus:ring-2 focus:ring-primary focus:outline-none mb-2"
            >
              <option value="" disabled>
                Select document
              </option>
              <option>International Passport</option>
              <option>Driver&apos;s License</option>
              <option>National ID Card</option>
              <option>Voter&apos;s Card</option>
            </select>

            <FileUpload
              label={formData.idFile ? "ID selected" : "Upload ID"}
              onFileSelect={(file) => updateField("idFile", file)}
              // compact
              hint=""
            />
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold text-dark-text mb-1">
            Proof of Address
          </span>

          <div className="flex gap-2 mb-2">
            {types.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateField("addressType", type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                  ${
                    formData.addressType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-light-gray text-dark-text hover:border-primary/40"
                  }`}
              >
                {type}
              </button>
            ))}
          </div>

          <FileUpload
            label={
              formData.addressFile
                ? "Address document selected"
                : "Upload address document"
            }
            onFileSelect={(file) => updateField("addressFile", file)}
            // compact
               hint="Must be dated within the last 3 months and show your full name/address."
          />

          <p className="text-[11px] text-mid-text mt-1">
            Issued within the last 3 months.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Identity;
