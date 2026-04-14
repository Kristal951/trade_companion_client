import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-150px 0px -70% 0px",
      threshold: 0,
    };

    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    const sections = ["Home", "features", "mentors", "pricing", "faq"];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const navItemClasses = (id) =>
    `transition-colors cursor-pointer ${
      activeSection === id
        ? "text-white font-bold"
        : "text-slate-400 hover:text-white"
    }`;

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <div className="fintech-glass rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl shadow-2xl">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 overflow-hidden rounded-lg flex items-center justify-center">
            <img src="/assets/logo/tradecompanion.jpg" alt="" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
            Trade Companion
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
          {["Home", "features", "mentors", "pricing", "faq"].map((item) => (
            <a key={item} href={`#${item}`} className={navItemClasses(item)}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </a>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/auth/signIn"
            className="text-sm font-medium text-slate-300 hover:text-white"
          >
            Log In
          </Link>
          <Link
            to="/auth/signUp"
            className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Header;
