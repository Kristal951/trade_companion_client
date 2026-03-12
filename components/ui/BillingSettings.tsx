import React, { useState, useEffect } from "react";
import Icon from "./Icon";
import { Plan, PlanName, User } from "@/types";
import useAppStore from "@/store/useStore";
import { API } from "@/utils";
import { PlanCardSkeleton } from "../onboarding/LandingPage";

type BillingCycle = "monthly" | "yearly";

const BillingSettings: React.FC<{
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  showToast: (msg: string, type?: "success" | "error") => void;
}> = ({ user, showToast }) => {
  const [isManaging, setIsManaging] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [plans, setPlans] = useState<Plan[]>([]);

  const loading = useAppStore((state) => state.loading);
  const getPlans = useAppStore((state) => state.getPlans);
  const changePlanWithStripe = useAppStore(
    (state) => state.changePlanWithStripe,
  );
  const openBillingPortal = useAppStore((state) => state.openBillingPortal);
  const processingPlan = useAppStore((state) => state.processingPlan);
  const openingPortal = useAppStore((state) => state.isOpeningBillingPortal);

  const normalisePlans = (planData) => {
    if (!planData) return [];

    const grouped = {};

    planData.forEach((plan) => {
      const isFree = plan.name.toLowerCase() === "free";

      const baseName = isFree
        ? "Free"
        : plan.name.replace(" Monthly", "").replace(" Yearly", "");

      if (!grouped[baseName]) {
        grouped[baseName] = {
          name: baseName,
          type: isFree ? "free" : "paid",
          monthly: null,
          yearly: null,
          free: null,
          features: plan.features,
        };
      }

      if (isFree) {
        grouped[baseName].free = plan;
      } else {
        if (plan.interval === "monthly") grouped[baseName].monthly = plan;
        if (plan.interval === "yearly") grouped[baseName].yearly = plan;
      }
    });

    return Object.values(grouped);
  };

  const currentPlanName = user?.subscribedPlan || "Free";
  const currentInterval = (user as any)?.subscriptionInterval || "monthly";
  const hasStripeCustomer = Boolean((user as any)?.stripeCustomerId);
  const isSubscribed = Boolean((user as any)?.isSubscribed);

  const handleOpenBillingPortal = async () => {
    try {
      const result = await openBillingPortal();

      if (result?.message) {
        showToast(result.message, "success");
      }
    } catch (error: any) {
      console.error(error);
      showToast(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to open billing portal",
        "error",
      );
    }
  };

  const handlePlanChange = async (plan: {
    name: string;
    type?: "free" | "paid";
  }) => {
    try {
      const result = await changePlanWithStripe({
        plan,
        billingCycle,
      });

      if (result?.message && !result.redirected) {
        showToast(result.message, "success");
      }

      if (result?.changed) {
        setIsManaging(false);
      }
    } catch (error: any) {
      console.error(error);
      showToast(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to continue subscription flow",
        "error",
      );
    }
  };
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const rawPlans = await getPlans();
        const processed = normalisePlans(rawPlans);
        setPlans(processed);
      } catch (err) {
        showToast("Failed to load plans", "error");
        console.log(err);
      }
    };

    if (isManaging && plans.length === 0) {
      fetchPlans();
    }
  }, [isManaging, getPlans]);

  return (
    <div className="bg-light-surface border border-light-gray rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-dark-text">Subscription</h3>
          <p className="text-sm text-mid-text">
            Manage your billing and plan preferences.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsManaging(!isManaging)}
            className="px-5 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all"
          >
            {isManaging ? "View Current Plan" : "Change Plan"}
          </button>

          {hasStripeCustomer && (
            <button
              onClick={handleOpenBillingPortal}
              disabled={openingPortal}
              className="px-5 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all disabled:opacity-60"
            >
              {openingPortal ? "Opening..." : "Manage Billing"}
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {isManaging ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
            <div className="flex justify-center">
              <div className="bg-fintech-card p-1 rounded-xl flex items-center">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    billingCycle === "monthly"
                      ? "bg-primary shadow-sm text-dark-text"
                      : "text-mid-text hover:text-dark-text"
                  }`}
                >
                  Monthly
                </button>

                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                    billingCycle === "yearly"
                      ? "bg-primary shadow-sm text-dark-text"
                      : "text-mid-text hover:text-dark-text"
                  }`}
                >
                  Yearly
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded uppercase">
                    Save
                  </span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <PlanCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {plans.map((plan) => {
                  const isCurrent =
                    currentPlanName.toLowerCase() === plan.name.toLowerCase() &&
                    currentInterval + "ly" === billingCycle;

                  const buttonKey = `${plan.name}-${billingCycle}`;
                  const isBusy = processingPlan === buttonKey || openingPortal;
                  let activePlan;

                  if (plan.type === "free") {
                    activePlan = plan.free;
                  } else {
                    activePlan =
                      billingCycle === "monthly" ? plan.monthly : plan.yearly;
                  }

                  return (
                    <div
                      key={plan.name}
                      className={`relative flex flex-col p-6 rounded-2xl border transition-all ${
                        isCurrent
                          ? "border-primary bg-fintech-card"
                          : "border-light-gray bg-fintech-card hover:border-neon-blue hover:border-2"
                      }`}
                    >
                      {isCurrent && (
                        <span className="absolute -top-3 left-6 px-3 py-1 bg-primary text-white text-[10px] font-black rounded-full uppercase">
                          Current Plan
                        </span>
                      )}

                      <div className="mb-6">
                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                          {plan.name}
                        </p>

                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-4xl font-black text-zinc-900 dark:text-white">
                            ${activePlan.amount}
                          </span>
                          <span className="text-zinc-400 text-sm">
                            {billingCycle === "monthly" ? "/month" : "/year"}
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-3 mb-8 flex-grow">
                        {plan.features.map((feat, i) => (
                          <li
                            key={i}
                            className="flex items-start text-xs text-zinc-600 dark:text-zinc-400"
                          >
                            <Icon
                              name="check"
                              className="w-4 h-4 mr-2 text-emerald-500 shrink-0"
                            />
                            {feat}
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => handlePlanChange(plan)}
                        disabled={isCurrent || isBusy}
                        className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                          isCurrent
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                            : "bg-slate-800 hover:bg-slate-700 text-white"
                        } disabled:opacity-60`}
                      >
                        {isCurrent
                          ? "Current Plan"
                          : processingPlan === buttonKey
                            ? "Processing..."
                            : hasStripeCustomer && isSubscribed
                              ? `Switch to ${plan.name}`
                              : `Choose ${plan.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-light-bg rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 rounded">
                Your Current plan
              </span>

              <h2 className="text-5xl font-black mt-2 text-dark-text tracking-tighter">
                {currentPlanName || "Free Tier"}
              </h2>

              <p className="mt-2 text-sm text-mid-text">
                Billing cycle:{" "}
                <span className="font-semibold capitalize">
                  {currentInterval}ly
                </span>
              </p>
            </div>

            <div className="h-px w-full md:w-px md:h-16 bg-zinc-200 dark:bg-zinc-800" />

            <div className="flex flex-col items-center md:items-end">
              <p className="text-zinc-500 text-sm mb-2 font-medium">
                Next billing date
              </p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">
                {(user as any)?.nextBillingDate || "Not available"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-light-surface border-t border-light-bg ">
        <button
          type="button"
          onClick={handleOpenBillingPortal}
          disabled={!hasStripeCustomer || openingPortal}
          className="text-xs text-mid-text underline underline-offset-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Download latest invoice (PDF)
        </button>
      </div>
    </div>
  );
};

export default BillingSettings;
