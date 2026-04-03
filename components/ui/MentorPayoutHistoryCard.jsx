import React from "react";

const MentorPayoutHistoryCard = () => {
  return (
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-mid-text uppercase bg-light-hover">
        <tr>
          <th className="px-4 py-2">Date</th>
          <th className="px-4 py-2">Amount</th>
          <th className="px-4 py-2">Status</th>
        </tr>
      </thead>
      <tbody className="text-dark-text">
        <tr key={payout.id} className="border-b border-light-gray">
          <td className="px-4 py-3">
            {new Date(payout.dateRequested).toLocaleDateString()}
          </td>
          <td className="px-4 py-3 font-semibold">
            ${payout.amount.toLocaleString()}
          </td>
          <td className="px-4 py-3">
            <span
              className={`px-2 py-1 text-xs font-bold rounded-full ${
                payout.status === "Completed"
                  ? "bg-success/20 text-success"
                  : "bg-warning/20 text-warning"
              }`}
            >
              {payout.status}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default MentorPayoutHistoryCard;
