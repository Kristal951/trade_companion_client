import React, { useEffect } from "react";
import Icon from "./Icon";

interface ToastProps {
  message: string;
  type: "success" | "info" | "error";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      icon: "check",
      borderColor: "border-success",
      textColor: "text-success",
    },
    info: { icon: "info", borderColor: "border-info", textColor: "text-info" },
    error: {
      icon: "danger",
      borderColor: "border-danger",
      textColor: "text-danger",
    },
  };

  const selectedConfig = config[type];

  return (
    <div
      className={`fixed top-5 right-5 z-[100] flex items-center p-4 max-w-sm w-full text-dark-text glassmorphism rounded-lg shadow-lg animate-fade-in-right border ${selectedConfig.borderColor}`}
      role="alert"
    >
      <div
        className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-white/50 ${selectedConfig.textColor}`}
      >
        <Icon name={selectedConfig.icon} className="w-5 h-5" />
      </div>
      <div className="ml-3 text-sm font-medium">{message}</div>
      <button
        type="button"
        onClick={onClose}
        className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg hover:bg-white/30 inline-flex h-8 w-8"
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <Icon name="close" className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;
