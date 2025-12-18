import React from "react";
import Icon from "./Icon";
import SidebarNavLink from "./Navlink";

const Sidebar = ({user, isSidebarCollapsed, setIsSidebarCollapsed, setAccountMenuOpen, isMentorMode, isAccountMenuOpen, activeTrades, onLogout}) => {
  return (
    <aside
      className={`bg-light-surface p-4 flex flex-col border-r border-light-gray shadow-sm transition-all duration-300 ${
        isSidebarCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between px-2 mb-8">
        {!isSidebarCollapsed && (
          <h1 className="text-2xl font-bold text-primary">Trade Companion</h1>
        )}
        <button
          onClick={() => {
           
            setIsSidebarCollapsed(!isSidebarCollapsed)}}
          className={`p-1 rounded-md hover:bg-light-hover text-mid-text ${
            isSidebarCollapsed && "mx-auto"
          }`}
        >
          <Icon
            name={isSidebarCollapsed ? "arrowRight" : "arrowLeft"}
            className="w-6 h-6"
          />
        </button>
      </div>

      <nav className="flex-1 space-y-4">
        {isMentorMode ? (
          <>
            <div>
              <p
                className={`text-xs text-mid-text uppercase font-semibold mb-2 ${
                  isSidebarCollapsed ? "hidden" : "px-4"
                }`}
              >
                Mentor Area
              </p>
              <SidebarNavLink
                to="mentor_dashboard"
                icon="dashboard"
                label="Dashboard"
                isCollapsed={isSidebarCollapsed}
              />
              <SidebarNavLink
                to="followers"
                icon="followers"
                label="Followers"
                isCollapsed={isSidebarCollapsed}
              />
              <SidebarNavLink
                to="analytics"
                icon="analytics"
                label="Analytics"
                isCollapsed={isSidebarCollapsed}
              />
              <SidebarNavLink
                to="mentor_payouts"
                icon="payouts"
                label="Payouts"
                isCollapsed={isSidebarCollapsed}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <p
                className={`text-xs text-mid-text uppercase font-semibold mb-2 ${
                  isSidebarCollapsed ? "hidden" : "px-4"
                }`}
              >
                Navigation
              </p>
              <SidebarNavLink
                to="dashboard"
                icon="dashboard"
                label="Dashboard"
                isCollapsed={isSidebarCollapsed}
              />
              <SidebarNavLink
                to="ai_signals"
                icon="signals"
                label="AI Signals"
                isCollapsed={isSidebarCollapsed}
                badgeCount={activeTrades.length}
              />
              <SidebarNavLink
                to="mentors"
                icon="mentors"
                label="Mentors"
                isCollapsed={isSidebarCollapsed}
              />
              <SidebarNavLink
                to="education"
                icon="education"
                label="Education"
                isCollapsed={isSidebarCollapsed}
              />
              <SidebarNavLink
                to="analytics"
                icon="analytics"
                label="Analytics"
                isCollapsed={isSidebarCollapsed}
              />
            </div>
            <div className="pt-4 border-t border-light-gray">
              <p
                className={`text-xs text-mid-text uppercase font-semibold mb-2 ${
                  isSidebarCollapsed ? "hidden" : "px-4"
                }`}
              >
                Tools
              </p>
              <SidebarNavLink
                to="ls_calculator"
                icon="calculator"
                label="Lot Size Calculator"
                isCollapsed={isSidebarCollapsed}
              />
              <SidebarNavLink
                to="market_chart"
                icon="chart-bar"
                label="Market Chart"
                isCollapsed={isSidebarCollapsed}
              />
            </div>
          </>
        )}
      </nav>
      <div className="relative mt-auto pt-4 border-t border-light-gray">
        <button
          onClick={() => { console.log(isAccountMenuOpen); setAccountMenuOpen(!isAccountMenuOpen)}}
          className={`w-full h-full flex items-center ${
            isSidebarCollapsed ? "p-0" : "p-3"
          } rounded-lg hover:bg-light-hover ${
            isSidebarCollapsed ? "justify-center" : ""
          }`}
        >
          <img
            src={
              user.avatar ||
              user.image ||
              `https://i.pravatar.cc/150?u=${user.email}`
            }
            alt="User Avatar"
            className="w-8 h-8 rounded-full object-cover border border-light-gray flex-shrink-0"
          />

          {!isSidebarCollapsed && (
            <>
              <div className="text-left ml-3 flex-1 overflow-hidden">
                <p className="font-semibold text-sm text-dark-text truncate">
                  {user.name}
                </p>
                <p className="text-xs text-mid-text truncate">{user.email}</p>
              </div>
              <Icon
                name="chevronDown"
                className={`w-5 h-5 text-mid-text transition-transform ${
                  isAccountMenuOpen ? "rotate-180" : ""
                }`}
              />
            </>
          )}
        </button>
        {isAccountMenuOpen && (
          <div
            className={`absolute z-10 w-56 bg-light-surface rounded-lg shadow-xl border border-light-gray py-2 animate-fade-in-right ${
              isSidebarCollapsed
                ? "left-full bottom-0 ml-2"
                : "bottom-full left-0 right-0 mb-2"
            }`}
          >
            <a
              onClick={() => {
                onViewChange("settings");
                setAccountMenuOpen(false);
              }}
              href="#"
              className="flex items-center px-4 py-2 text-sm text-dark-text hover:bg-light-hover"
            >
              <Icon name="settings" className="w-5 h-5 mr-2 text-mid-text" />
              Settings
            </a>
            <a
              onClick={() => {
                onViewChange("contact_us");
                setAccountMenuOpen(false);
              }}
              href="#"
              className="flex items-center px-4 py-2 text-sm text-dark-text hover:bg-light-hover"
            >
              <Icon name="mail" className="w-5 h-5 mr-2 text-mid-text" />
              Contact Us
            </a>
            <hr className="border-light-gray my-1" />
            {user.isMentor ? (
              <button
                onClick={toggleMentorMode}
                className="w-full flex items-center px-4 py-2 text-sm text-primary font-semibold hover:bg-light-hover"
              >
                <Icon
                  name={isMentorMode ? "user" : "mentors"}
                  className="w-5 h-5 mr-2 text-primary"
                />
                {isMentorMode ? "Switch to User" : "Switch to Mentor"}
              </button>
            ) : (
              <a
                onClick={() => {
                  onViewChange("apply_mentor");
                  setAccountMenuOpen(false);
                }}
                href="#"
                className="flex items-center px-4 py-2 text-sm text-dark-text hover:bg-light-hover"
              >
                <Icon name="apply" className="w-5 h-5 mr-2 text-mid-text" />
                Become a Mentor
              </a>
            )}
            <a
              onClick={onLogout}
              href="#"
              className="flex items-center px-4 py-2 text-sm hover:bg-light-hover text-danger"
            >
              <Icon name="logout" className="w-5 h-5 mr-2 text-danger" />
              Logout
            </a>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
