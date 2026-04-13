import Icon from "@/components/ui/Icon";
import { MOCK_MENTORS } from "../utils";

import React from "react";

const Features = () => {
  return (
    <section
      id="features"
      className="py-24 container mx-auto px-6"
    >
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
          The Complete Ecosystem
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Everything you need to analyze, execute, and learn in one unified
          dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div className="md:col-span-2 md:row-span-2 bg-fintech-card border border-fintech-border rounded-3xl p-8 relative overflow-hidden group hover:border-neon-blue/50 transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon name="signals" className="w-64 h-64 text-neon-blue" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-neon-blue/20 rounded-xl flex items-center justify-center mb-6 text-neon-blue">
              <Icon name="robot" className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              AI-Driven Signal Engine
            </h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              Our proprietary algorithm scans 20+ markets 24/7. It identifies
              structure breaks, liquidity grabs, and trend continuations,
              delivering actionable setups with Entry, SL, and TP directly to
              your dashboard.
            </p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center">
                <Icon name="check" className="w-4 h-4 text-neon-green mr-2" />{" "}
                85%+ Historical Accuracy
              </li>
              <li className="flex items-center">
                <Icon name="check" className="w-4 h-4 text-neon-green mr-2" />{" "}
                Multi-Timeframe Analysis
              </li>
              <li className="flex items-center">
                <Icon name="check" className="w-4 h-4 text-neon-green mr-2" />{" "}
                Instant Notifications
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-fintech-border rounded-3xl p-8 flex flex-col justify-between hover:border-neon-green/50 transition-all duration-500">
          <div>
            <div className="w-12 h-12 bg-neon-green/20 rounded-xl flex items-center justify-center mb-6 text-neon-green">
              <Icon name="mentors" className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Expert Mentorship
            </h3>
            <p className="text-slate-400 text-sm">
              Don't trade alone. Subscribe to vetted mentors, view their track
              records, and copy their live trades.
            </p>
          </div>
          <div className="mt-6 flex -space-x-3">
            {MOCK_MENTORS.map((m) => (
              <img
                key={m.id}
                src={m.avatar}
                className="w-10 h-10 rounded-full border-2 border-fintech-card"
                alt={m.name}
              />
            ))}
          </div>
        </div>

        <div className="bg-fintech-card border border-fintech-border rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-500">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 text-purple-400">
            <Icon name="education" className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Education Hub</h3>
          <p className="text-slate-400 text-sm">
            From beginner basics to advanced institutional concepts. Video
            courses, articles, and quizzes included.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
