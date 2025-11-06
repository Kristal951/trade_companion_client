import React, { useState, useEffect } from 'react';
import LandingPage from './components/onboarding/LandingPage';
import DashboardPage from './components/dashboard/DashboardPage';
import AIChatbot from './components/widgets/AIChatWidget';
import Toast from './components/ui/Toast';
import { User, PlanName, DashboardView } from './types';
import ScreenshotDetector from './components/ui/ScreenshotDetector';

// This would typically come from an auth service
const MOCK_USER: User = { 
  name: 'Olaniyi Peter', 
  email: 'olaniyi.peter@example.com', 
  // Use the provided image as base64 for the dummy user's DP
  avatar: '', // FIX: Replaced truncated/invalid base64 string with an empty one to resolve syntax error.
  isMentor: false, // FIX: Added missing property to satisfy the User type.
  subscribedPlan: PlanName.Premium, // User has no plan, will default to "Free" tier limits
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

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // In a real app, this would be an API call
  const handleLogin = () => {
    setUser(MOCK_USER);
    setActiveView('dashboard'); 
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
    // 1. Send warning to the user
    showToast("Screenshot attempt detected. Repeated attempts may lead to account suspension.", 'error');
    
    // 2. Trigger a warning to our system (simulated with a console log)
    // In a real app, this would be an API call:
    // await api.logInfraction(user.id, 'screenshot_attempt');
    console.warn(`[SYSTEM LOG] Screenshot attempt by user: ${user?.email}`);
  };


  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
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
        />
      </ScreenshotDetector>
      <AIChatbot user={user} activeView={activeView} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </>
  );
};