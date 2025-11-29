


import React, { useState, useEffect } from 'react';
import LandingPage from './components/onboarding/LandingPage';
import DashboardPage from './components/dashboard/DashboardPage';
import AIChatbot from './components/widgets/AIChatWidget';
import Toast from './components/ui/Toast';
import { User, PlanName, DashboardView, TradeRecord } from './types';
import ScreenshotDetector from './components/ui/ScreenshotDetector';
import { instrumentDefinitions } from './config/instruments';

// This would typically come from an auth service
const MOCK_USER_BASE: Omit<User, 'isMentor'> = { 
  name: 'Olaniyi Peter', 
  email: 'olaniyi.peter@example.com', 
  avatar: '', 
  subscribedPlan: PlanName.Premium, 
  cTraderConfig: {
    accountId: '',
    accessToken: '',
    isConnected: false,
    autoTradeEnabled: false,
  }
};


export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<DashboardView>('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme') as 'light' | 'dark';
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  
  // Lifted activeTrades state from DashboardPage to App with Safe Parsing
  const [activeTrades, setActiveTrades] = useState<TradeRecord[]>(() => {
     if (!user) return [];
     try {
         const saved = localStorage.getItem(`active_trades_${user.email}`);
         return saved ? JSON.parse(saved) : [];
     } catch (e) {
         console.error("Failed to parse active trades", e);
         return [];
     }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Persist activeTrades whenever they change
  useEffect(() => {
      if (user) {
        localStorage.setItem(`active_trades_${user.email}`, JSON.stringify(activeTrades));
      }
  }, [activeTrades, user]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleLoginRequest = (userDetails: { name: string; email: string }) => {
    // Create user based on input
    const newUser = {
      ...MOCK_USER_BASE,
      name: userDetails.name,
      email: userDetails.email,
      isMentor: true, // Keeping mentor capability for demo purposes
    };
    setUser(newUser);
    
    // Initialize trades for this user safely
    try {
        const savedTrades = localStorage.getItem(`active_trades_${newUser.email}`);
        if (savedTrades) {
            setActiveTrades(JSON.parse(savedTrades));
        } else {
            setActiveTrades([]);
        }
    } catch (e) {
        setActiveTrades([]);
    }
    
    setActiveView('dashboard');
    showToast(`Welcome back, ${userDetails.name.split(' ')[0]}!`, 'success');
  };
  
  const handleLogout = () => {
    setUser(null);
  };
  
  const handleViewChange = (view: DashboardView) => {
    setActiveView(view);
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
  };
  
  const closeToast = () => {
    setToast(null);
  };
  
  const handleScreenshotAttempt = () => {
    showToast("Screenshot attempt detected. Repeated attempts may lead to account suspension.", 'error');
    console.warn(`[SYSTEM LOG] Screenshot attempt by user: ${user?.email}`);
  };

  const handleExecuteTrade = (tradeDetails: {
      instrument: string;
      type: 'BUY' | 'SELL';
      entryType: 'MARKET' | 'LIMIT' | 'STOP';
      entryPrice: number;
      stopLoss: number;
      takeProfit: number;
      confidence: number;
      reasoning: string;
  }) => {
      if (!user) return;

      // Check for duplicate trade
      const alreadyExists = activeTrades.some(t => t.instrument === tradeDetails.instrument);
      if (alreadyExists) {
          showToast(`You already have an active trade for ${tradeDetails.instrument}`, 'error');
          return;
      }

      // Retrieve user settings for lot size calc
      let currentEquity = 10000;
      let riskPct = 1.0;
      try {
          const settings = JSON.parse(localStorage.getItem(`tradeSettings_${user.email}`) || '{"balance": "10000", "risk": "1.0", "currency": "USD"}');
          currentEquity = parseFloat(localStorage.getItem(`currentEquity_${user.email}`) || settings.balance);
          riskPct = parseFloat(settings.risk);
      } catch (e) {
          console.warn("Failed to parse user settings, using defaults");
      }
      
      // Calculate Lot Size
      let lotSize = 0.01; // Default
      let riskAmount = 0;

      try {
          const instrumentProps = instrumentDefinitions[tradeDetails.instrument];
          if (instrumentProps) {
              riskAmount = currentEquity * (riskPct / 100);
              const stopDistPrice = Math.abs(tradeDetails.entryPrice - tradeDetails.stopLoss);
              const stopLossPips = stopDistPrice / instrumentProps.pipStep;
              const contractSize = instrumentProps.contractSize;
              
              let pipValueInUSDForOneLot = 10; // Default approx
              if (instrumentProps.quoteCurrency === 'USD') {
                   pipValueInUSDForOneLot = instrumentProps.pipStep * contractSize;
              } else if (instrumentProps.quoteCurrency === 'JPY') {
                   pipValueInUSDForOneLot = (instrumentProps.pipStep * contractSize) / 150; 
              }

              const totalRiskPerLot = stopLossPips * pipValueInUSDForOneLot;
              if (totalRiskPerLot > 0) {
                  lotSize = riskAmount / totalRiskPerLot;
                  // Safe Guard for NaN
                  if (isNaN(lotSize)) lotSize = 0.01;
                  lotSize = Math.max(0.01, parseFloat(lotSize.toFixed(2)));
              }
          }
      } catch (err) {
          console.error("Lot calculation failed, using default 0.01", err);
      }

      const newTrade: TradeRecord = {
          id: new Date().toISOString(),
          status: 'active',
          dateTaken: new Date().toISOString(),
          initialEquity: currentEquity,
          instrument: tradeDetails.instrument,
          type: tradeDetails.type,
          entryType: tradeDetails.entryType, // NEW
          entryPrice: tradeDetails.entryPrice,
          stopLoss: tradeDetails.stopLoss,
          takeProfit: tradeDetails.takeProfit,
          confidence: tradeDetails.confidence,
          reasoning: tradeDetails.reasoning,
          lotSize: lotSize,
          riskAmount: isNaN(riskAmount) ? 0 : parseFloat(riskAmount.toFixed(2)),
          technicalReasoning: "Manual AI Execution from Chat",
          takeProfit1: tradeDetails.takeProfit, // Mapped from takeProfit for TradeRecord compatibility
          timestamp: new Date().toISOString(), // Required by Signal/TradeRecord interface
      };

      setActiveTrades(prev => [newTrade, ...prev]);
      showToast(`${tradeDetails.instrument} ${tradeDetails.type} (${tradeDetails.entryType}) executed successfully!`, 'success');
  };

  if (!user) {
    return (
      <>
        <LandingPage onLoginRequest={handleLoginRequest} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      </>
    );
  }

  return (
    <>
      <ScreenshotDetector onScreenshotAttempt={handleScreenshotAttempt}>
        <DashboardPage 
          user={user} 
          setUser={setUser}
          onLogout={handleLogout} 
          activeView={activeView} 
          onViewChange={handleViewChange}
          showToast={showToast}
          theme={theme}
          toggleTheme={toggleTheme}
          activeTrades={activeTrades}
          setActiveTrades={setActiveTrades}
        />
      </ScreenshotDetector>
      <AIChatbot user={user} activeView={activeView} onExecuteTrade={handleExecuteTrade} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </>
  );
};