import React, { useState, useEffect } from "react";
import { PlanName, RecentSignal, User } from "@/types";
import { MOCK_MENTORS_LIST } from "@/utils";
import Icon from "@/components/ui/Icon";
import useMentorStore from "@/store/mentorStore";
import { useNavigate } from "react-router-dom";

const MentorPage: React.FC<{
  user: User;
}> = ({ onViewMentor, onViewChange, user }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mentors, setMentors] = useState(null);
  const { getAllMentor, isLoading } = useMentorStore();
  const navigate = useNavigate()

  useEffect(()=>{
    setSearchQuery('')
  },[])

  useEffect(() => {
    const getMentors = async () => {
      try {
        const res = await getAllMentor();
        setMentors(res.data.mentors);
      } catch (error) {
        console.error("Failed to fetch mentors", error);
        setMentors([]); 
      }
    };

    getMentors();
  }, []);

  const goToMentorProfile = (mentorID: string)=>{
    navigate(`/mentor/${mentorID}`)
  }

  const calculateWinRate = (signals: RecentSignal[] | undefined) => {
    if (!signals || signals.length === 0) return 0;
    const wins = signals.filter((s) => s.outcome === "win").length;
    return Math.round((wins / signals.length) * 100);
  };

  const filteredMentors = mentors?.filter(
    (mentor) =>
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.instruments.some((inst) =>
        inst.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      mentor.strategy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-light-bg min-h-screen">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-text">Mentors</h1>
          <p className="text-mid-text">
            Find expert traders to follow and learn from.
          </p>
        </div>
        {!user.isMentor && (
          <button
            onClick={() => onViewChange("apply_mentor")}
            className="bg-accent hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform hover:scale-105"
          >
            Become a Mentor
          </button>
        )}
      </div>

      {user.subscribedPlan === PlanName.Premium && (
        <div className="bg-accent/10 text-accent p-4 rounded-lg mb-6 border border-accent/20">
          <p className="font-bold">Premium Perk Unlocked!</p>
          <p className="text-sm">
            As a Premium member, you get one free month of mentorship. Choose a
            mentor to start your free trial!
          </p>
        </div>
      )}

      <div className="mb-8 max-w-2xl relative">
        <input
          type="text"
          placeholder="Search mentors by name, strategy, or instrument (e.g., 'Scalping', 'XAUUSD')..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-4 pl-12 rounded-xl bg-light-surface border border-light-gray shadow-sm focus:ring-2 focus:ring-primary focus:outline-none text-dark-text"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-mid-text">
          <Icon name="search" className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors?.length > 0 ? (
          filteredMentors?.map((mentor) => {
            const winRate = calculateWinRate(mentor.recentSignals);
            return (
              <div
                key={mentor.id}
                className="bg-light-surface rounded-lg overflow-hidden p-6 flex flex-col shadow-sm border border-light-gray transition-shadow hover:shadow-md hover:shadow-primary/10"
              >
                <div className="flex-grow">
                  <div className="flex items-center mb-4">
                    <img
                      src={mentor.avatar}
                      alt={mentor.name}
                      className="w-20 h-20 rounded-full mr-4 border-2 border-primary"
                    />
                    <div>
                      <h4 className="text-xl font-bold text-dark-text">
                        {mentor.name}
                      </h4>
                      <p className="text-mid-text">
                        {mentor.experience} Yrs Exp.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm my-4 bg-light-hover p-3 rounded-md">
                    <div className="text-center">
                      <p className="text-mid-text">Win Rate</p>
                      <p className="font-bold text-success">
                        {winRate > 0 ? `${winRate}%` : "N/A"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-mid-text">Rating</p>
                      <p className="font-bold text-dark-text flex items-center gap-1">
                        {mentor.rating?.toFixed(1)}
                        <Icon
                          name="star"
                          className="w-4 h-4 text-warning fill-current"
                        />
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-mid-text">Price</p>
                      <p className="font-bold text-dark-text">
                        ${mentor.price}/mo
                      </p>
                    </div>
                  </div>
                  <p className="text-mid-text text-sm mb-4">
                    Instruments: {mentor.instruments.join(", ")}
                  </p>
                  <p className="text-xs text-mid-text italic line-clamp-2 mb-4">
                    "{mentor.strategy}"
                  </p>
                </div>
                <button
                  onClick={() => goToMentorProfile(mentor._id)}
                  className="w-full mt-auto bg-primary hover:bg-primary-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  View Profile & Posts
                </button>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-mid-text">
            <p className="text-lg">No mentors found matching "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 text-primary hover:underline"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorPage;
