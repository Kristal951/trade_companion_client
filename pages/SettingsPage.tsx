import BillingSettings from "@/components/ui/BillingSettings";
import CTraderSettings from "@/components/ui/CTrader";
import NotificationSettings from "@/components/ui/NotificationSettings";
import ProfileSettings from "@/components/ui/ProfileSettings";
import { User } from "@/types";
import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

interface SettingsProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  updateUser: (updatedData: Partial<User>) => void;
  loading: boolean;
}

const SettingsPage: React.FC<SettingsProps> = ({
  user,
  setUser,
  showToast,
  updateUser,
  loading,
}) => {
  const baseTabs = useMemo(
    () => [
      { id: "profile", label: "Profile" },
      { id: "billing", label: "Billing" },
      { id: "notifications", label: "Notifications" },
      { id: "ctrader", label: "cTrader" },
    ],
    [],
  );
  const tabs = useMemo(() => {
    const t = [...baseTabs];
    if (user.isMentor) t.push({ id: "verification", label: "Verification" });
    return t;
  }, [baseTabs, user.isMentor]);

  const [searchParams, setSearchParams] = useSearchParams();
  const isValidTab = (id: string | null) =>
    !!id && tabs.some((t) => t.id === id);
  const [activeTab, setActiveTab] = useState(() => {
    const urlTab = searchParams.get("tab");
    return isValidTab(urlTab) ? (urlTab as string) : tabs[0].id;
  });

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (isValidTab(urlTab)) {
      setActiveTab(urlTab as string);
    } else {
      setSearchParams({ tab: tabs[0].id }, { replace: true });
      setActiveTab(tabs[0].id);
    }
  }, [searchParams, tabs]);

  useEffect(() => {
    if (!tabs.some((t) => t.id === activeTab)) {
      const fallback = tabs[0].id;
      setActiveTab(fallback);
      setSearchParams({ tab: fallback }, { replace: true });
    }
  }, [tabs]);

  const goToTab = (id: string) => {
    setActiveTab(id);
    setSearchParams({ tab: id }, { replace: false });
  };

  return (
    <div className="p-8 bg-light-bg min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-dark-text">Settings</h2>
      <div className="flex space-x-4 mb-6 border-b border-light-gray overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => goToTab(tab.id)}
            className={`py-2 px-4 font-medium capitalize whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-mid-text hover:text-dark-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="animate-fade-in-right">
        {activeTab === "profile" && (
          <ProfileSettings
            user={user}
            setUser={setUser}
            showToast={showToast}
            updateUser={updateUser}
            loading={loading}
          />
        )}
        {activeTab === "billing" && (
          <BillingSettings
            user={user}
            setUser={setUser}
            showToast={showToast}
          />
        )}
        {activeTab === "notifications" && (
          <NotificationSettings
            user={user}
            setUser={setUser}
            showToast={showToast}
          />
        )}
        {activeTab === "ctrader" && (
          <CTraderSettings
            user={user}
            setUser={setUser}
            showToast={showToast}
          />
        )}
        {/* {activeTab === "verification" && (
          <VerificationSettings showToast={showToast} />
        )} */}
      </div>
    </div>
  );
};

export default SettingsPage;
