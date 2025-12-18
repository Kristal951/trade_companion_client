import React from "react";
import { NavLink as RouterNavLink } from "react-router-dom";
import Icon from "./Icon";

const SidebarNavLink = ({ icon, label, to, isCollapsed, badgeCount }) => {
  return (
    <RouterNavLink
      to={`/${to}`}
      className={({ isActive }) =>
        `w-full flex items-center p-3 transition-colors relative ${
          isActive
            ? "bg-primary/10 text-primary border-r-4 border-primary"
            : "text-mid-text hover:bg-light-hover hover:text-dark-text"
        }`
      }
      title={isCollapsed ? label : ""}
    >
      <Icon
        name={icon}
        className={`w-6 h-6 ${isCollapsed ? "mx-auto" : "mr-3"}`}
      />
      {!isCollapsed && <span className="font-medium">{label}</span>}
      {badgeCount !== undefined && badgeCount > 0 && (
        <span
          className={`absolute ${
            isCollapsed
              ? "top-2 right-2 h-2 w-2 rounded-full bg-danger"
              : "right-3 bg-primary text-white text-xs py-0.5 px-2 rounded-full"
          }`}
        >
          {!isCollapsed && badgeCount}
        </span>
      )}
    </RouterNavLink>
  );
};

export default SidebarNavLink;
