import React, { useState } from "react";
import ScreenshotDetector from "./components/ui/ScreenshotDetector";
import Toast from "./components/ui/Toast";
import AIChatbot from "./components/widgets/AIChatWidget";
import useAppStore from "./store/useStore";
import { DashboardView } from "./types";
import { useToast } from "./hooks/useToast";
import { useAppTheme } from "./hooks/useAppTheme";
import { useAuthSession } from "./hooks/useAuthSession";
import { useTradeMonitor } from "./hooks/useTradeMonitor";
import { useTradeExecution } from "./hooks/useTradeExecution";
import AppRoutes from "./components/routes/AppRoutes";
export const App: React.FC = () => {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const logout = useAppStore((state) => state.logout);
  const updateUser = useAppStore((state) => state.updateUser);
  const loading = useAppStore((state) => state.loading);
  const IsLoggingOut = useAppStore((state) => state.IsLoggingOut);
  const addNotification = useAppStore((state) => state.addNotification);

  const [activeView] = useState<DashboardView>("dashboard");
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMentorMode, setIsMentorMode] = useState(false);

  const { toast, showToast, closeToast } = useToast();

  const { theme, toggleTheme } = useAppTheme();

  const {
    activeTrades,
    setActiveTrades,
    tradeHistory,
    setTradeHistory,
    floatingPnL,
    liveEquity,
    handleLoginRequest,
    handleLogout,
    handleScreenshotAttempt,
  } = useAuthSession({
    user,
    setUser,
    logout,
    showToast,
  });

  useTradeMonitor({
    user,
    activeTrades,
    setActiveTrades,
    setTradeHistory,
    showToast,
  });

  const { handleExecuteTrade } = useTradeExecution({
    user,
    activeTrades,
    setActiveTrades,
    showToast,
  });

  return (
    <div className="w-full h-screen flex flex-col">
      <section className="flex-1 relative flex flex-col h-screen overflow-hidden transition-all duration-300">
        <ScreenshotDetector onScreenshotAttempt={handleScreenshotAttempt}>
          <AppRoutes
            user={user}
            theme={theme}
            toggleTheme={toggleTheme}
            loading={loading}
            updateUser={updateUser}
            setUser={setUser}
            showToast={showToast}
            handleLoginRequest={handleLoginRequest}
            handleLogout={handleLogout}
            activeTrades={activeTrades}
            tradeHistory={tradeHistory}
            floatingPnL={floatingPnL}
            liveEquity={liveEquity}
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            isMentorMode={isMentorMode}
            setIsMentorMode={setIsMentorMode}
            isAccountMenuOpen={isAccountMenuOpen}
            setAccountMenuOpen={setAccountMenuOpen}
            addNotification={addNotification}
          />
        </ScreenshotDetector>

        {user && (
          <AIChatbot
            user={user}
            activeView={activeView}
            onExecuteTrade={handleExecuteTrade}
          />
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        )}

        {IsLoggingOut && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
          </div>
        )}
      </section>
    </div>
  );
};
