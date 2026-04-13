import React, { useState, useRef } from "react";
import {
  User,
  MentorSubscriber,
  MentorPost,
  Mentor,
  Notification,
  RecentSignal,
} from "../../types";
import MentorProfileSettings from "./MentorProfileSettings";
import MentorPublisher from "./MentorPublisher";
import useMentorStore from "@/store/mentorStore";
import MentorSubscriberCard from "../ui/MentorSubscriberCard";

// const MOCK_RECENT_SIGNALS_FOR_PAYOUT: RecentSignal[] = [
//   {
//     id: "p1",
//     instrument: "EUR/USD",
//     direction: "BUY",
//     entry: "1.07",
//     stopLoss: "1.068",
//     takeProfit: "1.074",
//     outcome: "win",
//     timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
//     pnl: 400,
//   },
//   {
//     id: "p2",
//     instrument: "GBP/JPY",
//     direction: "SELL",
//     entry: "185",
//     stopLoss: "185.5",
//     takeProfit: "184",
//     outcome: "win",
//     timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
//     pnl: 1000,
//   },
//   {
//     id: "p3",
//     instrument: "XAU/USD",
//     direction: "BUY",
//     entry: "2300",
//     stopLoss: "2290",
//     takeProfit: "2320",
//     outcome: "win",
//     timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
//     pnl: 2000,
//   },
//   {
//     id: "p4",
//     instrument: "USD/CAD",
//     direction: "SELL",
//     entry: "1.36",
//     stopLoss: "1.363",
//     takeProfit: "1.355",
//     outcome: "loss",
//     timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
//     pnl: -300,
//   },
//   {
//     id: "p5",
//     instrument: "BTC/USD",
//     direction: "BUY",
//     entry: "65000",
//     stopLoss: "64000",
//     takeProfit: "67000",
//     outcome: "win",
//     timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
//     pnl: 2000,
//   },
//   {
//     id: "p6",
//     instrument: "ETH/USD",
//     direction: "SELL",
//     entry: "3500",
//     stopLoss: "3600",
//     takeProfit: "3300",
//     outcome: "win",
//     timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
//     pnl: 200,
//   },
// ];

// const MOCK_MENTOR_PROFILE: Mentor = {
//   id: 1,
//   name: "John Doe",
//   avatar: "https://picsum.photos/seed/userJD/200",
//   experience: 10,
//   profitRatio: 85,
//   roi: 25.5,
//   instruments: ["EUR/USD", "GBP/JPY", "USD/CAD"],
//   price: 99,
//   strategy:
//     "Specializing in high-frequency scalping strategies and market psychology based on order flow.",
//   certifications: [
//     { name: "Pro Trader Certification", url: "#" },
//     { name: "MyFxBook Verified History", url: "#" },
//   ],
//   recentSignals: MOCK_RECENT_SIGNALS_FOR_PAYOUT,
//   earnings: {
//     currentBalance: 4158,
//     lifetime: 12500,
//   },
//   payoutHistory: [
//     {
//       id: "po_1",
//       amount: 2500,
//       dateRequested: "2023-09-01T10:00:00Z",
//       dateCompleted: "2023-09-03T10:00:00Z",
//       status: "Completed",
//       method: "Bank Transfer",
//     },
//     {
//       id: "po_2",
//       amount: 3000,
//       dateRequested: "2023-08-01T10:00:00Z",
//       dateCompleted: "2023-08-03T10:00:00Z",
//       status: "Completed",
//       method: "Bank Transfer",
//     },
//   ],
//   identity: {
//     idDocument: { status: "Not Submitted" },
//     addressDocument: { status: "Not Submitted" },
//     livenessCheck: { status: "Not Submitted" },
//     overallStatus: "Not Submitted",
//   },
// };

interface MentorDashboardProps {
  user: User;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
}

const MentorDashboard: React.FC<MentorDashboardProps> = ({
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<"publisher" | "profile">(
    "publisher"
  );
  const { mentor } = useMentorStore();
  const mentor_subscribers = mentor?.subscribers ?? [];

  if (!mentor) {
    return (
      <div className="p-8 text-center text-mid-text">
        Loading mentor dashboard…
      </div>
    );
  }

  return (
    <div className="p-8 bg-light-bg min-h-screen relative">
      <h1 className="text-3xl font-bold mb-6 text-dark-text">
        Mentor Dashboard
      </h1>

      <div className="flex border-b border-light-gray mb-8">
        <button
          onClick={() => setActiveTab("publisher")}
          className={`py-2 px-6 font-semibold transition-colors ${
            activeTab === "publisher"
              ? "border-b-2 border-primary text-primary"
              : "text-mid-text hover:text-dark-text"
          }`}
        >
          Content Publisher
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`py-2 px-6 font-semibold transition-colors ${
            activeTab === "profile"
              ? "border-b-2 border-primary text-primary"
              : "text-mid-text hover:text-dark-text"
          }`}
        >
          Profile & Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeTab === "publisher" && (
            <MentorPublisher
              mentor={mentor}
              showToast={showToast}
            />
          )}
          {activeTab === "profile" && (
            <MentorProfileSettings
              mentor={mentor}
              showToast={showToast}
            />
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray">
            <h3 className="text-xl font-bold mb-4 text-dark-text">
              Key Metrics
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center text-dark-text">
                <span className="text-mid-text">Active Subscribers</span>{" "}
                <strong className="text-lg">{mentor?.subscribers?.length}</strong>
              </div>
              <div className="flex justify-between items-center text-dark-text">
                <span className="text-mid-text">Monthly Earnings</span>{" "}
                <strong className="text-lg text-success">0</strong>
              </div>
              <div className="flex justify-between items-center text-dark-text">
                <span className="text-mid-text">30-Day Churn</span>{" "}
                <strong className="text-lg text-danger">0</strong>
              </div>
            </div>
          </div>

          <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray">
            <h3 className="text-xl font-bold mb-4 text-dark-text">
              Recent Subscribers
            </h3>

            <div className="space-y-4">
              {mentor_subscribers.length > 0 ? (
                mentor_subscribers
                  .slice(0, 5)
                  .map((sub) => (
                    <MentorSubscriberCard sub={sub} />
                  ))
              ) : (
                <p className="text-center text-mid-text py-6">
                  No subscribers yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
