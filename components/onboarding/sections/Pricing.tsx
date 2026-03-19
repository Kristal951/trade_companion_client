import PlanCard from "@/components/ui/PlanCard";
import React from "react";
import PlanCardSkeleton from "../PlanCardSkeleton";
import useAppStore from "@/store/useStore";

const Pricing = ({ isYearly, setIsYearly, normalizedPlans }) => {
  const loading = useAppStore((state) => state.loading);
  return (
    <section id="pricing" className="py-20 bg-[#111827]">
      <div className="container mx-auto px-6 text-center">
        <h3 className="text-4xl font-bold mb-4">Flexible Plans for Everyone</h3>
        <p className="text-mid-text mb-8">
          Choose the plan that's right for your trading journey.
        </p>

        <div className="flex w-full justify-center mb-10">
          <div className="flex items-center justify-between w-[300px] bg-slate-800/20 rounded-full p-1 relative text-sm font-semibold text-white shadow-inner">
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`w-1/2 text-center py-2 rounded-full transition-colors duration-300 ${
                !isYearly ? "bg-primary text-white" : "text-white/70"
              }`}
            >
              Monthly
            </button>

            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`w-1/2 text-center py-2 rounded-full transition-colors duration-300 ${
                isYearly ? "bg-primary text-white" : "text-white/70"
              }`}
            >
              Yearly{" "}
              <span className="ml-2 text-xs bg-success text-white px-2 py-0.5 rounded-full font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mt-8">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <PlanCardSkeleton key={i} />
              ))
            : normalizedPlans.map((plan) => {
                let activePlan;

                if (plan.type === "free") {
                  activePlan = plan.free;
                } else {
                  activePlan = isYearly ? plan.yearly : plan.monthly;
                }

                if (!activePlan) return null;

                return (
                  <PlanCard
                    activePlan={activePlan}
                    plan={plan}
                    isYearly={isYearly}
                  />
                );
              })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
