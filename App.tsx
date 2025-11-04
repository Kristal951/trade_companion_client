
import React, { useState } from 'react';
import LandingPage from './components/onboarding/LandingPage';
import DashboardPage from './components/dashboard/DashboardPage';
import AIChatbot from './components/widgets/AIChatWidget';
import { User, PlanName, DashboardView } from './types';

// This would typically come from an auth service
const MOCK_USER: User = { name: 'John Doe', email: 'john.doe@example.com', avatar: 'https://picsum.photos/seed/userJD/200', isMentor: true, subscribedPlan: PlanName.Premium, telegramNumber: '+1234567890' };


function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<DashboardView>('dashboard');

  const handleLogin = () => {
    setUser(MOCK_USER);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const isLoggedIn = !!user;

  return (
    <>
      {isLoggedIn ? (
        <>
          <DashboardPage 
            user={user} 
            onLogout={handleLogout}
            activeView={activeView}
            onViewChange={setActiveView}
          />
          <AIChatbot user={user} activeView={activeView} />
        </>
      ) : (
        <LandingPage onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;