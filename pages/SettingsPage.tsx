import React, {useState} from 'react'

const SettingsPage: React.FC<SettingsProps> = ({
  user,
  setUser,
  showToast,
  updateUser,
  loading,
}) => {
  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "billing", label: "Billing" },
    { id: "notifications", label: "Notifications" },
    { id: "ctrader", label: "cTrader" },
  ];

  if (user.isMentor) {
    tabs.push({ id: "verification", label: "Verification" });
  }

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="p-8 bg-light-bg min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-dark-text">Settings</h2>
      <div className="flex space-x-4 mb-6 border-b border-light-gray overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
        {activeTab === "verification" && (
          <VerificationSettings showToast={showToast} />
        )}
      </div>
    </div>
  );
};

export default SettingsPage