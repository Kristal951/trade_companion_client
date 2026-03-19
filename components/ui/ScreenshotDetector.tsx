import React, { useEffect } from "react";

interface ScreenshotDetectorProps {
  onScreenshotAttempt: () => void;
  children: React.ReactNode;
}

const ScreenshotDetector: React.FC<ScreenshotDetectorProps> = ({
  onScreenshotAttempt,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "PrintScreen") {
        event.preventDefault();
        onScreenshotAttempt();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onScreenshotAttempt]);

  return <>{children}</>;
};

export default ScreenshotDetector;
