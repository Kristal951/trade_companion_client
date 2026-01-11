import React, { useState, useEffect } from "react";
import Icon from "./Icon";
import { User } from "@/types";
import useAppStore from "@/store/useStore";

type Plan = {
  name: string;
  price: number;
  features: string[];
  isPopular?: boolean;
};

const BillingSettings: React.FC<{
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  showToast: (msg: string) => void;
}> = ({ user, setUser, showToast }) => {
  const [isManaging, setIsManaging] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
 const loading = useAppStore(state=> state.loading)

  const getPlans = useAppStore((state) => state.getPlans);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await getPlans();
        setPlans(res || []);
      } catch (err) {
        console.error(err);
        showToast("Failed to load plans", 'error');
      }
    };

    fetchPlans();
  }, []);

  const handlePlanChange = (planName: string) => {
    if (planName === user.subscribedPlan) return;

    setUser((prev) =>
      prev ? { ...prev, subscribedPlan: planName } : null
    );

    showToast(`Subscription updated to ${planName} plan.`);
    setIsManaging(false);
  };

  return (
    <div className="bg-light-surface border border-light-gray rounded-2xl p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold">Subscription & Billing</h3>
          <p className="text-sm text-mid-text">
            Choose the plan that fits your trading needs
          </p>
        </div>

        <button
          onClick={() => setIsManaging((v) => !v)}
          className="px-5 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition"
        >
          {isManaging ? "Close" : "Manage"}
        </button>
      </div>

      {/* CURRENT PLAN */}
      <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-mid-text">
            Current Plan
          </p>
          <h2 className="text-3xl font-extrabold text-primary mt-1">
            {user.subscribedPlan || "Free"}
          </h2>
          <p className="flex items-center text-sm text-mid-text mt-2">
            <Icon name="check" className="w-4 h-4 mr-1 text-success" />
            Active subscription
          </p>
        </div>

        <span className="text-xs bg-primary/20 text-primary px-4 py-1 rounded-full font-semibold">
          Active
        </span>
      </div>

      {/* PLANS */}
      {isManaging && (
        <>
          {loading ? (
            <div className="text-center text-mid-text py-10">
              Loading plans...
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-right">
              {plans.map((plan) => {
                const isCurrent = user.subscribedPlan === plan.name;

                return (
                  <div
                    key={plan.name}
                    className={`relative rounded-2xl p-6 flex flex-col border transition-all
                      ${
                        isCurrent
                          ? "border-primary bg-primary/10 scale-[1.03]"
                          : "border-light-gray bg-light-hover hover:border-primary/40 hover:shadow-lg"
                      }`}
                  >
                    {plan.isPopular && !isCurrent && (
                      <span className="absolute -top-3 left-4 bg-accent text-white text-xs px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}

                    {isCurrent && (
                      <span className="absolute -top-3 right-4 bg-primary text-white text-xs px-3 py-1 rounded-full">
                        Current
                      </span>
                    )}

                    {/* PLAN INFO */}
                    <h4 className="text-lg font-bold">{plan.name}</h4>

                    <p className="text-3xl font-extrabold my-3">
                      ${plan.price}
                      <span className="text-sm font-medium text-mid-text">
                        /mo
                      </span>
                    </p>

                    <ul className="space-y-2 text-sm text-mid-text flex-grow">
                      {plan.features.slice(0, 4).map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Icon
                            name="check"
                            className="w-4 h-4 mr-2 text-success mt-0.5"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      onClick={() => handlePlanChange(plan.name)}
                      disabled={isCurrent}
                      className={`mt-6 py-2.5 rounded-xl font-bold transition
                        ${
                          isCurrent
                            ? "bg-success/20 text-success cursor-default"
                            : "bg-primary text-white hover:bg-primary-hover"
                        }`}
                    >
                      {isCurrent ? "Selected" : "Upgrade"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BillingSettings;
