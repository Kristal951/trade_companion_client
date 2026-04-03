import { PlanName } from "@/types";
import React from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";

const PlanCard = ({ plan, activePlan, isYearly }) => {
  return (
    <div
      key={activePlan._id}
      className={`relative p-8 rounded-2xl border flex flex-col ${
        plan.name === PlanName.Pro
          ? "bg-slate-900 border-neon-blue shadow-2xl shadow-neon-blue/10 scale-105 z-10"
          : "bg-fintech-card border-fintech-border text-slate-300"
      }`}
    >
      {plan.name === PlanName.Pro && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-neon-blue text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
          Most Popular
        </div>
      )}

      <h3
        className={`text-xl font-bold mb-4 ${
          plan.name === PlanName.Pro ? "text-white" : "text-slate-200"
        }`}
      >
        {plan.name}
      </h3>

      <div className="mb-6">
        {plan.type === "free" ? (
          <p className="text-4xl font-extrabold my-4">Free</p>
        ) : (
          <p className="text-4xl font-extrabold my-4">
            ${activePlan.amount}
            <span className="text-base font-normal text-mid-text">
              {isYearly ? "/year" : "/month"}
            </span>
          </p>
        )}
      </div>

      <ul className="space-y-4 mb-8 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start text-sm">
            <Icon
              name="check"
              className={`w-5 h-5 mr-3 ${
                plan.name === PlanName.Pro ? "text-neon-blue" : "text-slate-600"
              }`}
            />
            <span className="text-slate-400">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        to="/auth"
        state={{
          selectedPlan: activePlan.name.toLowerCase().replace(/\s+/g, "_"),
        }}
        className={`w-full py-3 rounded-xl font-bold transition-all ${
          plan.name === PlanName.Pro
            ? "bg-neon-blue hover:bg-blue-600 text-white shadow-lg"
            : "bg-slate-800 hover:bg-slate-700 text-white"
        }`}
      >
        Choose {plan.name}
      </Link>
    </div>
  );
};

export default PlanCard;
