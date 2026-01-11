import React, { useState, useEffect } from "react";
import { User } from "@/types";
import { TARGET_INSTRUMENTS } from "@/services/geminiService";

interface SettingsProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  updateUser: (updatedData: Partial<User>) => void;
  loading: boolean;
}

const CTraderSettings: React.FC<SettingsProps> = ({
  user,
  setUser,
  showToast,
}) => {
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(
    () => {
      const saved = localStorage.getItem(`ctrader_instruments_${user.email}`);
      return saved ? JSON.parse(saved) : ["EUR/USD", "GBP/JPY", "XAU/USD"];
    }
  );

  // Form state for connection
  const [accountIdInput, setAccountIdInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");

  // Filter out synthetic indices as they are not supported for auto-trading on cTrader
  // AND ensure we only show instruments that the AI actually scans for.
  const availableInstruments = TARGET_INSTRUMENTS.filter((inst) => {
    const unsupportedInstruments = [
      "Boom 1000",
      "Crash 1000",
      "Volatility 75",
      "Volatility 100",
      "Jump 10",
      "Jump 25",
      "Jump 50",
    ];
    return !unsupportedInstruments.includes(inst);
  });

  const toggleInstrument = (instrument: string) => {
    setSelectedInstruments((prev) => {
      if (prev.includes(instrument)) {
        return prev.filter((i) => i !== instrument);
      } else {
        return [...prev, instrument];
      }
    });
  };

  const handleSaveInstruments = () => {
    localStorage.setItem(
      `ctrader_instruments_${user.email}`,
      JSON.stringify(selectedInstruments)
    );
    showToast("Auto-trading instrument preferences saved!", "success");
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountIdInput.length < 3 || tokenInput.length < 5) {
      showToast("Please enter valid Account ID and Token", "error");
      return;
    }

    // Simulate Connection API Call
    setTimeout(() => {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              cTraderConfig: {
                ...prev.cTraderConfig!,
                isConnected: true,
                accountId: accountIdInput,
                accessToken: tokenInput,
                autoTradeEnabled: true,
              },
            }
          : null
      );
      if (!localStorage.getItem(`ctrader_instruments_${user.email}`)) {
        localStorage.setItem(
          `ctrader_instruments_${user.email}`,
          JSON.stringify(selectedInstruments)
        );
      }
      showToast("cTrader account connected successfully!", "success");
      setAccountIdInput("");
      setTokenInput("");
    }, 800);
  };

  const handleDisconnect = () => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            cTraderConfig: {
              ...prev.cTraderConfig!,
              isConnected: false,
              accountId: "",
              accessToken: "",
              autoTradeEnabled: false,
            },
          }
        : null
    );
    showToast("cTrader account disconnected.", "info");
  };

  const isConnected = user.cTraderConfig?.isConnected;

  return (
    <div className="p-6 bg-light-surface rounded-lg border border-light-gray text-dark-text space-y-6 animate-fade-in-right">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">cTrader Connection</h3>
          {isConnected && (
            <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-bold">
              Active
            </span>
          )}
        </div>

        {!isConnected ? (
          <div className="bg-light-bg p-5 rounded-lg border border-light-gray">
            <p className="text-sm mb-4">
              Link your cTrader account to enable automated execution of AI
              signals.
            </p>

            <div className="mb-6 bg-light-hover p-3 rounded text-xs text-mid-text space-y-1">
              <p className="font-bold text-dark-text">How to connect:</p>
              <p>
                1. Log in to the{" "}
                <a href="#" className="text-primary underline">
                  cTrader ID Site
                </a>
                .
              </p>
              <p>2. Navigate to "Open API" settings.</p>
              <p>3. Generate a new Access Token for your trading account.</p>
              <p>4. Copy the Account ID and Token below.</p>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-mid-text mb-1">
                  Account ID
                </label>
                <input
                  type="text"
                  value={accountIdInput}
                  onChange={(e) => setAccountIdInput(e.target.value)}
                  placeholder="e.g., 1234567"
                  className="w-full p-2 rounded border border-light-gray bg-light-surface text-dark-text"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-mid-text mb-1">
                  Access Token
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste your token here..."
                  className="w-full p-2 rounded border border-light-gray bg-light-surface text-dark-text"
                />
              </div>
              <button
                type="submit"
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover font-bold w-full"
              >
                Connect Account
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-light-hover p-4 rounded-lg border border-light-gray">
              <div>
                <p className="font-bold text-dark-text">Connected Account</p>
                <p className="text-sm text-mid-text font-mono">
                  ID: {user.cTraderConfig?.accountId}
                </p>
              </div>
              <button
                onClick={handleDisconnect}
                className="text-danger text-sm font-semibold hover:underline"
              >
                Disconnect
              </button>
            </div>

            <div className="animate-fade-in-right border-t border-light-gray pt-6">
              <h3 className="font-bold text-lg mb-2">
                Auto-Trading Instruments
              </h3>
              <p className="text-sm text-mid-text mb-4">
                Select which instruments you want the AI to automatically trade
                on your account.
              </p>

              <div className="mb-4 flex justify-between items-center">
                <span className="text-xs font-bold text-primary">
                  {selectedInstruments.length} Selected
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => setSelectedInstruments(availableInstruments)}
                    className="text-xs text-info hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedInstruments([])}
                    className="text-xs text-danger hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6 max-h-60 overflow-y-auto p-2 border border-light-gray rounded-lg custom-scrollbar">
                {availableInstruments.map((inst) => (
                  <label
                    key={inst}
                    className={`flex items-center space-x-2 cursor-pointer p-2 rounded transition-colors ${
                      selectedInstruments.includes(inst)
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-light-hover border border-transparent"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedInstruments.includes(inst)}
                      onChange={() => toggleInstrument(inst)}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <span
                      className={`text-sm font-medium ${
                        selectedInstruments.includes(inst)
                          ? "text-primary"
                          : "text-mid-text"
                      }`}
                    >
                      {inst}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveInstruments}
                  className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-transform transform hover:scale-105"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CTraderSettings;
