import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "./components/ui/Header";
import Sidebar from "./components/ui/Sidebar";
import useAppStore from "./store/useStore";
import useMentorStore from "./store/mentorStore";

const RootLayout = ({
  toggleTheme,
  theme,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  activeTrades,
  isMentorMode,
  setAccountMenuOpen,
  onLogout,
  isAccountMenuOpen,
  showToast,
  setIsMentorMode
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  const user = useAppStore((state) => state.user);
  const toggleMenu = () => setShowMobileMenu((prev) => !prev);
  const {setMentorMode} = useMentorStore()

  useEffect(() => {
    if (!user) {
      navigate("/auth/signIn"); 
      showToast?.("Authentication Failed, Please Login", "error");
    }
  }, [user, navigate]);

  useEffect(()=>{
    setMentorMode(false)
  },[])

  return (
    <div className="w-full h-screen flex relative">
      {showMobileMenu && (
        <div
          onClick={() => setShowMobileMenu(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
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
        setIsMentorMode={setIsMentorMode}
      />

      <div className="flex-1 flex flex-col overflow-y-scroll">
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
