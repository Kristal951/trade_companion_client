import React from "react";
import { FaCopy } from "react-icons/fa";

const SignalDetails: React.FC = ({ signal, showToast }) => {
  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    showToast(`Copied ${value}`, "success");
  };

  const FaCopyIcon = FaCopy as React.ElementType;

  return (
    <div className="border border-gray-200 dark:border-gray-700 mt-6 rounded-xl p-4 bg-gray-50 dark:bg-gray-800 space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-sm text-gray-600 dark:text-gray-300">
          Instrument:
        </span>
        <span className="text-sm font-medium">{signal.instrument}</span>
      </div>

      <div className="flex justify-between items-center">
        <span className="font-semibold text-sm text-gray-600 dark:text-gray-300">
          Direction:
        </span>
        <span
          className={`text-sm font-bold px-2 py-1 rounded-full ${
            signal.direction === "BUY"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {signal.direction}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="font-semibold text-sm text-gray-600 dark:text-gray-300">
          Entry:
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{signal.entry}</span>
          <button
            onClick={() => copyToClipboard(signal.entry)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            title="Copy Entry"
          >
            <FaCopyIcon className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="font-semibold text-sm text-gray-600 dark:text-gray-300">
          Stop Loss:
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{signal.stopLoss}</span>
          <button
            onClick={() => copyToClipboard(signal.stopLoss)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            title="Copy SL"
          >
            <FaCopyIcon className="w-3 h-3" />
          </button>
        </div>
      </div>

      {signal.takeProfit.length > 0 && (
        <div className="space-y-1">
          <span className="font-semibold text-sm text-gray-600 dark:text-gray-300">
            Take Profit:
          </span>
          {signal.takeProfit.map((tp, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center px-2 py-1 bg-white dark:bg-gray-700 rounded-md shadow-sm"
            >
              <span className="text-sm font-medium">
                TP {idx + 1}: {tp}
              </span>
              <button
                onClick={() => copyToClipboard(tp)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                title={`Copy TP ${idx + 1}`}
              >
                <FaCopyIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SignalDetails;
