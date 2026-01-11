import { User } from "@/types";
import React, {useState} from 'react'
import Icon from "./Icon";

interface SettingsProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  updateUser: (updatedData: Partial<User>) => void;
  loading: boolean;
}

const NotificationSettings: React.FC<SettingsProps> = ({
  user,
  setUser,
  showToast,
}) => {
  const [telegramStep, setTelegramStep] = useState<
    "initial" | "input" | "verify"
  >("initial");
  const [telegramId, setTelegramId] = useState("");

  const handleConnectTelegram = () => {
    if (telegramId.length < 5) {
      showToast("Please enter a valid Telegram Chat ID.", "error");
      return;
    }
   
    setTimeout(() => {
      setUser((prev) =>
        prev ? { ...prev, telegramNumber: telegramId } : null
      );
      showToast("Telegram connected successfully!", "success");
      setTelegramStep("initial");
    }, 1000);
  };

  const handleDisconnect = () => {
    setUser((prev) => (prev ? { ...prev, telegramNumber: undefined } : null));
    showToast("Telegram disconnected.", "info");
  };

  return (
    <div className="p-6 bg-light-surface rounded-lg border border-light-gray text-dark-text space-y-6">
      <h3 className="font-bold text-lg">Notification Preferences</h3>

      <div className="flex items-center justify-between p-3 bg-light-hover rounded-lg">
        <span>Email Notifications</span>
        <input
          type="checkbox"
          defaultChecked
          className="w-5 h-5 rounded border-light-gray text-primary focus:ring-primary"
        />
      </div>
      <div className="flex items-center justify-between p-3 bg-light-hover rounded-lg">
        <span>Push Notifications</span>
        <input
          type="checkbox"
          defaultChecked
          className="w-5 h-5 rounded border-light-gray text-primary focus:ring-primary"
        />
      </div>

      <div className="border-t border-light-gray pt-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="font-bold flex items-center">
              <Icon name="send" className="w-4 h-4 mr-2" /> Telegram Alerts
            </h4>
            <p className="text-sm text-mid-text">
              Receive instant signal alerts directly to your Telegram.
            </p>
          </div>
          {user.telegramNumber && (
            <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-bold border border-success/20">
              Connected
            </span>
          )}
        </div>

        {!user.telegramNumber ? (
          <div className="bg-light-bg p-4 rounded-lg border border-light-gray">
            {telegramStep === "initial" && (
              <div className="text-center">
                <p className="mb-4 text-sm">
                  Connect your account to our bot to start receiving signals.
                </p>
                <button
                  onClick={() => setTelegramStep("input")}
                  className="bg-info text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold"
                >
                  Connect Telegram
                </button>
              </div>
            )}

            {telegramStep === "input" && (
              <div className="space-y-4 animate-fade-in-right">
                <div className="space-y-2">
                  <p className="text-sm font-bold">Step 1: Start the Bot</p>
                  <p className="text-xs text-mid-text">
                    Open Telegram and search for{" "}
                    <span className="text-primary font-mono">
                      @TradeCompanionBot
                    </span>{" "}
                    or click the link below. Click "Start".
                  </p>
                  <a
                    href="https://t.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline flex items-center"
                  >
                    <Icon name="link" className="w-3 h-3 mr-1" /> Open Bot
                  </a>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold">Step 2: Get your ID</p>
                  <p className="text-xs text-mid-text">
                    The bot will send you a "Chat ID". Copy it and paste it
                    below.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold">Step 3: Verify</p>
                  <input
                    type="text"
                    placeholder="Enter Telegram Chat ID"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    className="w-full p-2 rounded border border-light-gray bg-light-surface text-dark-text"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleConnectTelegram}
                      className="bg-success text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm font-bold"
                    >
                      Verify & Connect
                    </button>
                    <button
                      onClick={() => setTelegramStep("initial")}
                      className="text-mid-text px-4 py-2 rounded-lg hover:bg-light-hover text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-between items-center bg-light-hover p-3 rounded-lg">
            <span className="text-sm font-mono">{user.telegramNumber}</span>
            <button
              onClick={handleDisconnect}
              className="text-danger text-sm hover:underline"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings