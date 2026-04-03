import React from "react";

export const StatCard: React.FC<{
  title: string;
  value: string;
  percentage?: string;
  percentageType?: "gain" | "loss" | "info";
  icon?: React.ReactNode;
  subValue?: React.ReactNode;
}> = ({
  title,
  value,
  percentage,
  percentageType = "gain",
  icon,
  subValue,
}) => {
  const isGain = percentageType === "gain";
  const isInfo = percentageType === "info";
  const textColor = isGain
    ? "text-success"
    : isInfo
      ? "text-info"
      : "text-danger";
  const bgColor = isGain
    ? "bg-success/10"
    : isInfo
      ? "bg-info/10"
      : "bg-danger/10";

  return (
    <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray flex items-center">
      {icon && (
        <div className={`p-3 rounded-full mr-4 ${bgColor} ${textColor}`}>
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-mid-text text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-dark-text">{value}</p>
        {percentage && (
          <p className={`text-xs font-semibold ${textColor}`}>{percentage}</p>
        )}
        {subValue && <div className="mt-1 text-xs">{subValue}</div>}
      </div>
    </div>
  );
};
