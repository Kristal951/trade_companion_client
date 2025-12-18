import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./components/ui/Header";
import Sidebar from "./components/ui/Sidebar";

const RootLayout = ({
  user,
  toggleTheme,
  theme,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  activeTrades,
  isMentorMode,
  setAccountMenuOpen,
  onLogout,
  isAccountMenuOpen
}) => {
  return (
    <div className="w-full h-screen flex">
      <Sidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        activeTrades={activeTrades}
        user={user}
        isMentorMode={isMentorMode}
        setAccountMenuOpen={setAccountMenuOpen}
        onLogout={onLogout}
        isAccountMenuOpen={isAccountMenuOpen}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 overflow-y-scroll`}
      >
        <Header toggleTheme={toggleTheme} theme={theme} user={user} />
        <Outlet />
      </div>
    </div>
  );
};

export default RootLayout;
