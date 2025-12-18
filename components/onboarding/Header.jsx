import React from "react";
import Icon from "../ui/Icon";
import { Link, NavLink } from "react-router-dom";

const Header = () => {
  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <div className="fintech-glass rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl shadow-2xl shadow-black/50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-neon-blue to-neon-green rounded-lg flex items-center justify-center">
            <Icon name="signals" className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
            Trade Companion
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <NavLink
            to="#features"
            className="hover:text-white transition-colors"
          >
            Features
          </NavLink>
          <NavLink to="#mentors" className="hover:text-white transition-colors">
            Mentors
          </NavLink>
          <NavLink to="#pricing" className="hover:text-white transition-colors">
            Pricing
          </NavLink>
          <NavLink to="#faq" className="hover:text-white transition-colors">
            FAQ
          </NavLink>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/auth/signIn"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/auth/signUp"
            className="bg-white text-black hover:bg-slate-200 px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Header;
