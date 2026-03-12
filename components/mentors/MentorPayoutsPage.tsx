import React, { useState, useMemo } from "react";
import { Mentor, RecentSignal, Payout } from "../../types";
import Icon from "../ui/Icon";
import useMentorStore from "@/store/mentorStore";
import MentorPayoutHistoryCard from "../ui/MentorPayoutHistoryCard";

const MOCK_RECENT_SIGNALS_FOR_PAYOUT: RecentSignal[] = [
  {
    id: "p1",
    instrument: "EUR/USD",
    direction: "BUY",
    entry: "1.07",
    stopLoss: "1.068",
    takeProfit: "1.074",
    outcome: "win",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    pnl: 400,
  },
  {
    id: "p2",
    instrument: "GBP/JPY",
    direction: "SELL",
    entry: "185",
    stopLoss: "185.5",
    takeProfit: "184",
    outcome: "win",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    pnl: 1000,
  },
  {
    id: "p3",
    instrument: "XAU/USD",
    direction: "BUY",
    entry: "2300",
    stopLoss: "2290",
    takeProfit: "2320",
    outcome: "win",
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    pnl: 2000,
  },
  {
    id: "p4",
    instrument: "USD/CAD",
    direction: "SELL",
    entry: "1.36",
    stopLoss: "1.363",
    takeProfit: "1.355",
    outcome: "loss",
    timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    pnl: -300,
  },
  {
    id: "p5",
    instrument: "BTC/USD",
    direction: "BUY",
    entry: "65000",
    stopLoss: "64000",
    takeProfit: "67000",
    outcome: "win",
    timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    pnl: 2000,
  },
  {
    id: "p6",
    instrument: "ETH/USD",
    direction: "SELL",
    entry: "3500",
    stopLoss: "3600",
    takeProfit: "3300",
    outcome: "win",
    timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    pnl: 200,
  },
];

interface MentorPayoutsPageProps {
  showToast: (message: string, type?: "success" | "info" | "error") => void;
}

const MentorPayoutsPage: React.FC<MentorPayoutsPageProps> = ({ showToast }) => {
  const [payoutAmount, setPayoutAmount] = useState("");
  const { mentor } = useMentorStore();

  const winRateCheck = useMemo(() => {
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const recentSignals =
      mentor.recentSignals?.filter(
        (s) => new Date(s.createdAt) > fourWeeksAgo
      ) || [];

    if (recentSignals.length === 0) {
      return { rate: 0, passed: false, trades: 0 };
    }
    const wins = recentSignals.filter((s) => s.outcome === "win").length;
    const rate = Math.round((wins / recentSignals.length) * 100);
    return { rate, passed: rate >= 70, trades: recentSignals.length };
  }, [mentor.recentSignals]);

  const idVerified = mentor.identity?.overallStatus === "Verified";
  const isEligible = winRateCheck.passed && idVerified;

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);
    if (
      isNaN(amount) ||
      amount <= 0 ||
      amount > mentor.earnings!.currentBalance
    ) {
      showToast("Please enter a valid amount.", "error");
      return;
    }
    showToast(`Payout request for $${amount.toFixed(2)} submitted!`, "success");
  };

  const EligibilityCheckItem: React.FC<{
    label: string;
    isMet: boolean;
    details: string;
  }> = ({ label, isMet, details }) => (
    <div
      className={`flex items-start p-3 rounded-lg ${
        isMet ? "bg-success/10" : "bg-danger/10"
      }`}
    >
      <Icon
        name={isMet ? "check" : "close"}
        className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
          isMet ? "text-success" : "text-danger"
        }`}
      />
      <div>
        <p
          className={`font-semibold ${isMet ? "text-success" : "text-danger"}`}
        >
          {label}
        </p>
        <p className="text-xs text-mid-text">{details}</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-light-bg min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-dark-text">
        Payouts & Earnings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray text-center">
              <p className="text-sm text-mid-text">Available for Payout</p>
              <p className="text-4xl font-bold text-primary">
                ${mentor.earnings?.currentBalance.toLocaleString()}
              </p>
            </div>
            <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray text-center">
              <p className="text-sm text-mid-text">Lifetime Earnings</p>
              <p className="text-4xl font-bold text-dark-text">
                ${mentor.earnings?.lifetime.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray space-y-4">
            <h3 className="text-xl font-bold text-dark-text">Payout Request</h3>
            <div className="space-y-3 p-4 bg-light-hover rounded-lg border border-light-gray">
              <h4 className="font-semibold text-dark-text">
                Eligibility Checklist
              </h4>
              <EligibilityCheckItem
                label="Signal Performance"
                isMet={winRateCheck.passed}
                details={`Your 4-week win rate is ${winRateCheck.rate}% (${winRateCheck.trades} trades). Minimum 70% required.`}
              />
              <EligibilityCheckItem
                label="Identity Verification"
                isMet={idVerified}
                details={`Your ID verification status is: ${mentor.identity?.overallStatus}. 'Verified' status required (Check Settings).`}
              />
            </div>
            <form
              onSubmit={handleRequestPayout}
              className="space-y-3 pt-4 border-t border-light-gray"
            >
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">
                  Payout Amount ($)
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={!isEligible}
                    className="w-full bg-light-hover border-light-gray rounded-l-md p-3 focus:ring-primary focus:border-primary text-dark-text disabled:bg-light-gray/50"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPayoutAmount(
                        String(mentor.earnings?.currentBalance)
                      )
                    }
                    disabled={!isEligible}
                    className="bg-secondary text-white px-4 font-semibold rounded-r-md hover:bg-gray-600 disabled:bg-light-gray disabled:cursor-not-allowed"
                  >
                    Max
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={!isEligible}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg disabled:bg-light-gray disabled:cursor-not-allowed"
              >
                {isEligible ? "Request Payout" : "Ineligible for Payout"}
              </button>
              <p className="text-xs text-mid-text text-center">
                Payouts are processed via Bank Transfer within 3-5 business
                days.
              </p>
            </form>
          </div>
        </div>

        <div className="bg-light-surface p-6 rounded-lg shadow-sm border border-light-gray h-fit">
          <h3 className="text-xl font-bold text-dark-text mb-4">
            Payout History
          </h3>
          <div className="overflow-x-auto">
            {mentor.payoutHistory.length > 0 ? (
              mentor.payoutHistory.map((payout) => (
                <MentorPayoutHistoryCard payout={payout} />
              ))
            ) : (
              <p className="text-center text-center text-mid-text py-6">No Payout Record Yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorPayoutsPage;
