import React, { useEffect } from "react";
import NotificationBell from "./NotificationBell";
import useAppStore from "@/store/useStore";
import { RiMenu2Line } from "react-icons/ri";

const Header = ({ toggleTheme, theme, user, setShowMobileMenu, showMobileMenu}) => {
  const NOTIFICATIONS_KEY = `notifications_${user?.email}`;
  const notifications = useAppStore((state) => state.notifications);
  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications, NOTIFICATIONS_KEY]);
  const addNotification = useAppStore((state) => state.addNotification);

  return (
    <header className="bg-light-surface border-b border-light-gray p-4 flex justify-between items-center flex-shrink-0">
      <button className="md:hidden p-1 rounded-md hover:bg-light-hover text-mid-text " onClick={()=> setShowMobileMenu(!showMobileMenu)}>
        <RiMenu2Line size={25}/>
      </button>
      <h1 className="text-2xl font-bold text-dark-text capitalize">
      </h1>
      <div className="flex items-center space-x-4">
        <label htmlFor="theme-toggle" className="theme-toggle-label no-print">
          <input
            id="theme-toggle"
            type="checkbox"
            className="theme-toggle-input"
            onChange={toggleTheme}
            checked={theme === "dark"}
            aria-label="Toggle theme"
          />
          <span className="theme-toggle-slider"></span>
          <span className="theme-toggle-icon sun-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#FFD700"
              stroke="none"
            >
              <circle cx="12" cy="12" r="5"></circle>
              <path
                d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                stroke="#FFD700"
                strokeWidth="2"
                strokeLinecap="round"
              ></path>
            </svg>
          </span>
          <span className="theme-toggle-icon moon-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#4A5568"
              stroke="none"
            >
              <path d="M21.64,13.24a1,1,0,0,0-1.12.33A6.87,6.87,0,0,1,11.33,5.1a1,1,0,0,0-.33-1.12,1,1,0,0,0-1.29.21A10,10,0,1,0,21.93,14.41,1,1,0,0,0,21.64,13.24Z" />
              <path d="M15.5 6 A 0.5 0.5 0 0 1 16 6.5 A 0.5 0.5 0 0 1 15.5 7 A 0.5 0.5 0 0 1 15 6.5 A 0.5 0.5 0 0 1 15 6.5 A 0.5 0.5 0 0 1 15.5 6 Z" />
              <path d="M18.5 9 A 0.5 0.5 0 0 1 19 9.5 A 0.5 0.5 0 0 1 18.5 10 A 0.5 0.5 0 0 1 18 9.5 A 0.5 0.5 0 0 1 18.5 9 Z" />
              <path d="M14.5 12 A 0.5 0.5 0 0 1 15 12.5 A 0.5 0.5 0 0 1 14.5 13 A 0.5 0.5 0 0 1 14 12.5 A 0.5 0.5 0 0 1 14 12.5 A 0.5 0.5 0 0 1 14.5 12 Z" />
            </svg>
          </span>
        </label>
        <NotificationBell
          notifications={notifications}
          addNotification={addNotification}
        />
        <img
          src={
            user?.avatar ||
            user?.image ||
            `https://i.pravatar.cc/150?u=${user?.email}`
          }
          alt="User Avatar"
          className="w-10 h-10 rounded-full hidden md:flex"
        />
      </div>
    </header>
  );
};

export default Header;
