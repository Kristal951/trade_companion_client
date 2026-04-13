import React from "react";

const SignalsTable = ({
  loading,
  signals,
  currentPage,
  totalPages,
  setCurrentPage,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl  bg-transparent shadow-sm">
      <table className="min-w-full text-sm table-fixed border-collapse">
        <thead className="sticky top-0 bg-transparent z-10 border-b border-light-gray">
          <tr className="text-mid-text text-xs uppercase tracking-wide">
            <th className="py-3 px-3 text-left">Instrument</th>
            <th className="py-3 px-3 text-center">Type</th>
            <th className="py-3 px-3 text-right">Entry</th>
            <th className="py-3 px-3 text-right">SL</th>
            <th className="py-3 px-3 text-right">TP</th>
            <th className="py-3 px-3 text-center">Confidence</th>
            <th className="py-3 px-3 text-center">AI</th>
            <th className="py-3 px-3 text-center">Status</th>
            <th className="py-3 px-3 text-right">Created</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={9} className="text-center py-10 text-mid-text">
                Loading signals...
              </td>
            </tr>
          ) : signals.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-12 text-center">
                <p className="font-semibold text-dark-text">
                  No active signals
                </p>
                <p className="text-sm text-mid-text mt-1">
                  The AI is currently scanning the market. Check back soon.
                </p>
              </td>
            </tr>
          ) : (
            signals.map((signal, index) => (
              <tr
                key={signal._id}
                className={`
                  border-b border-light-gray transition
                  hover:bg-light-hover
                  ${index % 2 === 0 ? "bg-transparent" : "bg-transparent"}
                `}
              >
                <td className="py-3 px-3 font-medium text-dark-text">
                  {signal.instrument}
                </td>

                <td className="py-3 px-3 text-center">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      signal.type === "BUY"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {signal.type}
                  </span>
                </td>

                <td className="py-3 px-3 text-right font-mono">
                  {signal.entryPrice?.toFixed(2)}
                </td>

                <td className="py-3 px-3 text-right font-mono text-red-500">
                  {signal.stopLoss?.toFixed(2)}
                </td>

                <td className="py-3 px-3 text-right font-mono text-green-500">
                  {signal.takeProfits?.[0]?.toFixed(2) || "-"}
                </td>

                <td className="py-3 px-3 text-center font-medium">
                  {signal.confidence}%
                </td>

                <td className="py-3 px-3 text-center">
                  {signal.isAI ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                      AI
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      Manual
                    </span>
                  )}
                </td>

                <td className="py-3 px-3 text-center">
                  <span className="text-xs px-2 py-1 rounded-md bg-transparent border border-gray-200">
                    {signal.status}
                  </span>
                </td>

                <td className="py-3 px-3 text-right text-mid-text font-mono">
                  {new Date(signal.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {!loading && signals.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-light-gray bg-transparent">
          <p className="text-sm text-mid-text">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 rounded-md border border-light-gray text-sm hover:bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 rounded-md border border-light-gray text-sm hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalsTable;
