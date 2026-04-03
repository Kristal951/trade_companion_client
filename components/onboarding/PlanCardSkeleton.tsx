import React from "react";

const PlanCardSkeleton = () => {
  return (
    <div className="relative p-6 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse">
      <div className="h-6 w-24 bg-slate-700 rounded mb-4" />

      <div className="h-10 w-32 bg-slate-700 rounded mb-6" />

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 w-full bg-slate-700 rounded" />
        ))}
      </div>

      <div className="h-10 w-full bg-slate-700 rounded mt-6" />
    </div>
  );
};

export default PlanCardSkeleton;
