import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
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
  isAccountMenuOpen,
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate()
  const toggleMenu = () => {
    setShowMobileMenu((prev) => !prev);
  };

  if(!user){
      navigate('/auth')
  }

  return (
    <div className="w-full h-screen flex relative">
      {showMobileMenu && (
        <div
          onClick={() => setShowMobileMenu(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden"
        />
      )}
      <Sidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        activeTrades={activeTrades}
        user={user}
        isMentorMode={isMentorMode}
        setAccountMenuOpen={setAccountMenuOpen}
        onLogout={onLogout}
        isAccountMenuOpen={isAccountMenuOpen}
        setShowMobileMenu={setShowMobileMenu}
        showMobileMenu={showMobileMenu}
        toggleMenu={toggleMenu}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 overflow-y-scroll`}
      >
        <Header
          toggleTheme={toggleTheme}
          theme={theme}
          user={user}
          setShowMobileMenu={setShowMobileMenu}
          showMobileMenu={showMobileMenu}
          toggleMenu={toggleMenu}
        />
        <Outlet />
      </div>
    </div>
  );
};

export default RootLayout;
