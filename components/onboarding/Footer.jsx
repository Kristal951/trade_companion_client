import React from "react";
import Icon from "../ui/Icon";

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-neon-blue rounded-lg flex items-center justify-center">
                <Icon name="signals" className="w-5 h-5 text-white" />
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
                <a href="#" className="hover:text-neon-blue">
                  AI Signals
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-blue">
                  Mentorship
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-blue">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <a href="#" className="hover:text-neon-blue">
                  Education Hub
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-blue">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-blue">
                  Help Center
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <a href="#" className="hover:text-neon-blue">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-blue">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-blue">
                  Risk Disclosure
                </a>
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
