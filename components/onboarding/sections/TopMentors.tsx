
import Icon from "@/components/ui/Icon";
import React from "react";import { Link, useNavigate } from "react-router-dom";

const TopMentors = ({
  filteredMentors,
  mentorSearchQuery,
  setMentorSearchQuery,
}) => {
  const navigate = useNavigate();

  return (
    <section id="mentors" className="py-20 bg-[#111827]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Top Performing Mentors
            </h2>
            <p className="text-slate-400">
              Vetted traders with verified track records.
            </p>
          </div>
          <div className="mt-4 md:mt-0 relative">
            <input
              type="text"
              placeholder='Find a mentor'
              value={mentorSearchQuery}
              onChange={(e) => setMentorSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-full py-2 pl-4 pr-10 focus:ring-2 focus:ring-neon-blue focus:outline-none w-64"
            />
            <Icon
              name="search"
              className="absolute right-3 top-2.5 w-5 h-5 text-slate-500"
            />
          </div>
        </div>

        {filteredMentors.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            {filteredMentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-fintech-card border border-fintech-border rounded-xl p-6 hover:shadow-2xl hover:shadow-neon-blue/5 transition-all group"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <img
                      src={mentor.avatar}
                      alt={mentor.name}
                      className="w-16 h-16 rounded-full border-2 border-primary"
                    />

                    <div className="flex flex-col items-start">
                      <h4 className="text-xl font-bold">{mentor.name}</h4>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">
                        {mentor.experience} Years EXP
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col text-right">
                    <strong className="text-2xl font-bold text-neon-green">
                      {mentor.profitRatio}%
                    </strong>
                    <span className="text-xs text-slate-500">ROI (Mo)</span>
                  </div>
                </div>

                <div className="flex w-full flex-col text-sm mt-4 gap-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-slate-400">Win Rate</h2>
                    <span className="text-white font-mono">
                      {mentor.winRate}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <h2 className="text-slate-400">Instruments</h2>
                    <span className="text-white text-right">
                      {mentor.instruments?.join(", ") || "N/A"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/mentor/${mentor.id}`)}
                  className="mt-4 w-full py-3 rounded-lg border border-slate-700 text-white hover:bg-white hover:text-fintech-bg font-bold transition-colors"
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-mid-text mt-8">
            No mentors found matching your search.
          </p>
        )}
      </div>
    </section>
  );
};

export default TopMentors;
