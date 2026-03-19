import React from "react";
import { Link } from "react-router-dom";

const TopMentors = ({
  filteredMentors,
  mentorSearchQuery,
  setMentorSearchQuery,
}) => {
  return (
    <section id="mentors" className="py-20 bg-[#111827]">
      <div className="container mx-auto px-6">
        <h3 className="text-4xl font-bold text-center mb-4">
          Meet Our Top Mentors
        </h3>
        <div className="max-w-xl mx-auto mb-12">
          <input
            type="text"
            placeholder="Search by name or instrument (e.g., John, EUR/USD)..."
            value={mentorSearchQuery}
            onChange={(e) => setMentorSearchQuery(e.target.value)}
            className="w-full px-5 py-3 bg-light-surface border border-light-gray rounded-full focus:ring-2 focus:ring-primary focus:outline-none transition-shadow shadow-sm"
          />
        </div>
        {filteredMentors.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            {filteredMentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-[#111827] rounded-lg overflow-hidden text-center p-6 transform hover:-translate-y-2 transition-transform duration-300 shadow-md border border-light-gray"
              >
                <img
                  src={mentor.avatar}
                  alt={mentor.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-primary"
                />
                <h4 className="text-xl font-bold">{mentor.name}</h4>
                <p className="text-primary mb-2">
                  {mentor.experience} Years Experience
                </p>
                <div className="flex justify-around text-sm my-4">
                  <span>
                    <strong className="text-success">
                      {mentor.profitRatio}%
                    </strong>{" "}
                    Profit Ratio
                  </span>
                  <span>
                    <strong className="text-primary">${mentor.price}</strong>
                    /month
                  </span>
                </div>
                <p className="text-mid-text text-sm mb-4">
                  Trades: {mentor.instruments.join(", ")}
                </p>
                <Link
                  to="/auth/signUp"
                  className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  View Profile
                </Link>
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
