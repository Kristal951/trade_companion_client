import useAppStore from "@/store/useStore";
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {

  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 overflow-hidden rounded-lg flex items-center justify-center">
                <img src="/tradecompanion.jpg" alt="" />
              </div>
              <span className="text-xl font-bold text-white">
                Trade Companion
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              Empowering traders with AI-driven insights and institutional-grade
              mentorship.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <a href="/ai_signals" className="hover:text-neon-blue">
                  AI Signals
                </a>
              </li>
              <li>
                <a href="/mentors" className="hover:text-neon-blue">
                  Mentorship
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-neon-blue">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <a href="/education" className="hover:text-neon-blue">
                  Education Hub
                </a>
              </li>
              <li>
                <a href="contact_us" className="hover:text-neon-blue">
                  Help Center
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <Link to="/legal/privacy" className="hover:text-neon-blue">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/terms" className="hover:text-neon-blue">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/legal/risk" className="hover:text-neon-blue">
                  Risk Disclosure
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-900 pt-8 text-center text-slate-600 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Trade Companion. All rights
            reserved.
          </p>
          <p className="mt-2">
            Trading Forex and CFDs involves significant risk and can result in
            the loss of your invested capital.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
