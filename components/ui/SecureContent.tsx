import React from 'react';

interface SecureContentProps {
  children: React.ReactNode;
  watermarkText?: string;
}

const SecureContent: React.FC<SecureContentProps> = ({ children, watermarkText = "Trade Companion" }) => {

  const handleCopy = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="relative secure-content no-print" 
      onCopy={handleCopy}
      style={{ userSelect: 'none' }}
    >
      {/* Watermark Overlay */}
      <div 
        className="absolute inset-0 z-10 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute -inset-1/4 flex flex-wrap items-center justify-center opacity-[0.03]">
          {Array(80).fill(0).map((_, i) => (
            <span 
              key={i} 
              className="text-dark-text font-bold text-lg whitespace-nowrap p-8 select-none"
              style={{ transform: 'rotate(-30deg)' }}
            >
              {watermarkText}
            </span>
          ))}
        </div>
      </div>
      
      {/* Actual Content */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
};

export default SecureContent;