import { PlanName } from '../types';

export type FeatureName = 'entryAnalysis' | 'chartAnalysis' | 'inDepthAnalysis' | 'aiSignal';

export const PLAN_LIMITS: Record<PlanName, Record<FeatureName, number | 'unlimited'>> = {
  [PlanName.Free]: {
    entryAnalysis: 1,
    chartAnalysis: 1,
    inDepthAnalysis: 0,
    aiSignal: 0,
  },
  [PlanName.Basic]: {
    entryAnalysis: 3,
    chartAnalysis: 2,
    inDepthAnalysis: 1,
    aiSignal: 2,
  },
  [PlanName.Pro]: {
    entryAnalysis: 10,
    chartAnalysis: 7,
    inDepthAnalysis: 5,
    aiSignal: 5,
  },
  [PlanName.Premium]: {
    entryAnalysis: 'unlimited',
    chartAnalysis: 'unlimited',
    inDepthAnalysis: 'unlimited',
    aiSignal: 10,
  },
};

export const PLAN_FEATURES: Record<PlanName, string[]> = {
    [PlanName.Free]: [
        'AI Signal Monitoring (Upgrade to receive)',
        '1 AI Entry Analysis per day',
        '1 AI Chart Analysis per day',
        'Unlimited Lot Size Calculations',
        'Access to Education Hub',
    ],
    [PlanName.Basic]: [
        '2 AI Signals / day (FX Majors & Minors)',
        '3 Entry analyses per day',
        '2 AI chart analyses per day',
        '1 In-depth AI analysis per day',
        'Community Access',
    ],
    [PlanName.Pro]: [
        '5 AI Signals / day (All Pairs, XAU Priority)',
        '10 Entry analyses per day',
        '7 AI chart analyses per day',
        '5 In-depth AI analyses per day',
        'Telegram Notifications',
        'cTrader Automated Trading',
        'Advanced Analytics',
    ],
    [PlanName.Premium]: [
        '10 AI Signals / day (All Pairs, XAU Priority)',
        'Unlimited entry analyses',
        'Unlimited AI chart analyses',
        'Unlimited in-depth AI analyses',
        'Telegram Notifications',
        'cTrader Automated Trading',
        '1 Free Mentor for a month',
    ],
};