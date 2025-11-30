import { useState, useCallback, useEffect } from 'react';
import { User, PlanName } from '../types';
import { PLAN_LIMITS, FeatureName } from '../config/plans';

interface UsageData {
  count: number;
  date: string;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const initialUsageState: Record<FeatureName, UsageData> = {
  entryAnalysis: { count: 0, date: getTodayDateString() },
  chartAnalysis: { count: 0, date: getTodayDateString() },
  inDepthAnalysis: { count: 0, date: getTodayDateString() },
  aiSignal: { count: 0, date: getTodayDateString() },
};

export const useUsageTracker = (user: User) => {
  const [usage, setUsage] = useState<Record<FeatureName, UsageData>>(initialUsageState);

  const storageKey = `usage_${user.email}`;

  useEffect(() => {
    try {
      const storedUsage = localStorage.getItem(storageKey);
      const today = getTodayDateString();
      if (storedUsage) {
        const parsed = JSON.parse(storedUsage);
        if (parsed.entryAnalysis?.date !== today) {
          // Date is old, reset
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

  const getFeatureLimit = useCallback((feature: FeatureName): number | 'unlimited' => {
      const plan = user.subscribedPlan || PlanName.Free;
      return PLAN_LIMITS[plan][feature];
  }, [user.subscribedPlan]);

  const canUseFeature = useCallback((feature: FeatureName): boolean => {
    const limit = getFeatureLimit(feature);
    if (limit === 'unlimited') return true;
    
    const today = getTodayDateString();
    const currentUsage = usage[feature];
    
    if (currentUsage.date !== today) return true; // Usage is from a past day

    return currentUsage.count < limit;
  }, [usage, getFeatureLimit]);

  const incrementUsage = useCallback((feature: FeatureName) => {
    const today = getTodayDateString();
    setUsage(prev => {
      const currentUsageForDate = prev[feature]?.date === today ? prev : initialUsageState;
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
  }, [storageKey]);
  
  const getUsageInfo = useCallback((feature: FeatureName) => {
    const today = getTodayDateString();
    const currentCount = usage[feature]?.date === today ? usage[feature].count : 0;
    return {
        count: currentCount,
        limit: getFeatureLimit(feature)
    };
  }, [usage, getFeatureLimit]);

  return { canUseFeature, incrementUsage, getUsageInfo };
};