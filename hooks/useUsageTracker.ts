import { useState, useCallback, useEffect } from "react";
import { User, PlanName } from "../types";
import { PLAN_LIMITS, FeatureName } from "../config/plans";

interface UsageData {
  count: number;
  date: string;
}

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const initialUsageState: Record<FeatureName, UsageData> = {
  entryAnalysis: { count: 0, date: getTodayDateString() },
  chartAnalysis: { count: 0, date: getTodayDateString() },
  inDepthAnalysis: { count: 0, date: getTodayDateString() },
  aiSignal: { count: 0, date: getTodayDateString() },
};

export const useUsageTracker = (user: User) => {
  const [usage, setUsage] =
    useState<Record<FeatureName, UsageData>>(initialUsageState);

  const userKey = user?.id || user?._id || user?.email || "guest";
  const storageKey = `usage_${userKey}`;

  const normalizePlan = (raw: any): PlanName => {
    const v = String(raw ?? "")
      .trim()
      .toLowerCase();

    switch (v) {
      case "pro":
        return PlanName.Pro;

      case "premium":
        return PlanName.Premium;

      case "basic":
        return PlanName.Basic;

      case "free":
      default:
        return PlanName.Free;
    }
  };

  useEffect(() => {
    try {
      const storedUsage = localStorage.getItem(storageKey);
      const today = getTodayDateString();
      if (storedUsage) {
        const parsed = JSON.parse(storedUsage);
        if (parsed.entryAnalysis?.date !== today) {
          localStorage.setItem(storageKey, JSON.stringify(initialUsageState));
          setUsage(initialUsageState);
        } else {
          setUsage(parsed);
        }
      } else {
        localStorage.setItem(storageKey, JSON.stringify(initialUsageState));
        setUsage(initialUsageState);
      }
    } catch (error) {
      console.error("Failed to process usage data from localStorage", error);
      localStorage.setItem(storageKey, JSON.stringify(initialUsageState));
      setUsage(initialUsageState);
    }
  }, [storageKey]);

  const getFeatureLimit = useCallback(
    (feature: FeatureName): number | "unlimited" => {
      const plan = normalizePlan(user?.plan || user?.subscribedPlan || PlanName.Free);
    
      return PLAN_LIMITS[plan][feature];
    },
    [user?.plan, user?.subscribedPlan],
  );

  const canUseFeature = useCallback(
    (feature: FeatureName): boolean => {
      const limit = getFeatureLimit(feature);
      if (limit === "unlimited") return true;

      const today = getTodayDateString();
      const currentUsage = usage[feature];

      if (currentUsage.date !== today) return true;

      return currentUsage.count < limit;
    },
    [usage, getFeatureLimit],
  );

  const incrementUsage = useCallback(
    (feature: FeatureName) => {
      const today = getTodayDateString();
      setUsage((prev) => {
        const currentUsageForDate =
          prev[feature]?.date === today ? prev : initialUsageState;
        const newUsage = {
          ...currentUsageForDate,
          [feature]: {
            count: (currentUsageForDate[feature]?.count || 0) + 1,
            date: today,
          },
        };
        localStorage.setItem(storageKey, JSON.stringify(newUsage));
        return newUsage;
      });
    },
    [storageKey],
  );

  const getUsageInfo = useCallback(
    (feature: FeatureName) => {
      const today = getTodayDateString();
      const currentCount =
        usage[feature]?.date === today ? usage[feature].count : 0;
      return {
        count: currentCount,
        limit: getFeatureLimit(feature),
      };
    },
    [usage, getFeatureLimit],
  );

  return { canUseFeature, incrementUsage, getUsageInfo };
};
