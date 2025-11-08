import React, { useState, useEffect } from 'react';
import LandingPage from './components/onboarding/LandingPage';
// FIX: Changed to a named import to match the export in DashboardPage.tsx.
import { DashboardPage } from './components/dashboard/DashboardPage';
import AIChatbot from './components/widgets/AIChatWidget';
import Toast from './components/ui/Toast';
import { User, PlanName, DashboardView } from './types';
import ScreenshotDetector from './components/ui/ScreenshotDetector';

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
  const [activeRole, setActiveRole] = useState<'user' | 'mentor'>('user');
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

  const handleLogin = (isMentorUser = true) => {
    setUser({
      ...MOCK_USER_BASE,
      isMentor: isMentorUser,
    });
    setActiveRole('user'); // Always start in user view
    setActiveView('dashboard');
  };

  const handleLoginRequest = () => {
    // For demonstration, logging in as a mentor user by default to show the switch functionality.
    // To see a regular user flow, you could call handleLogin(false)
    handleLogin(true);
  };

  const handleLogout = () => {
    setUser(null);
  };
  
  const handleViewChange = (view: DashboardView) => {
    setActiveView(view);
  };
  
  const handleRoleSwitch = () => {
    if (user?.isMentor) {
      setActiveRole(prev => {
        const newRole = prev === 'user' ? 'mentor' : 'user';
        // When switching, always go back to the dashboard for that role
        setActiveView('dashboard');
        showToast(`Switched to ${newRole} view.`, 'info');
        return newRole;
      });
    }
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

  if (!user) {
    return (
      <>
        <LandingPage onLoginRequest={handleLoginRequest} />
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
          activeRole={activeRole}
          handleRoleSwitch={handleRoleSwitch}
        />
      </ScreenshotDetector>
      <AIChatbot user={user} activeView={activeView} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </>
  );
};
