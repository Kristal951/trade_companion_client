import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "../onboarding/LandingPage";
import RootLayout from "@/RootLayout";
import DashboardContainer from "@/pages/dashboard/DashboardContainer";
import AISignalsPage from "@/pages/AISignalsPage";
import MentorPage from "@/pages/MentorPage";
import MentorApplicationPage from "../mentors/mentorApplication/MentorApplication";
import MarketChartPage from "../dashboard/MarketChartPage";
import PaymentSuccessPage from "@/pages/SubPaymentSuccess";
import ContactUsPage from "@/pages/ContactUsPage";
import LotSizeCalculatorPage from "../calculator/LotSizeCalculatorPage";
import SettingsPage from "@/pages/SettingsPage";
import MentorProfilePage from "../mentors/MentorProfilePage";
import { EducationPage } from "../dashboard/DashboardPage";
import { AnalyticsPage } from "@/pages/Analytics";
import Subscribe from "@/pages/SubscriptionPage";
import { renderAuthRoutes } from "./AuthRoutes";
import { renderMentorRoutes } from "./MentorRoutes";
import PaymentCancelledPage from "@/pages/SubPaymentCancelled";
import NotificationsPage from "@/pages/NotificationsPage";

type Props = {
  user: any;
  theme: "light" | "dark";
  toggleTheme: () => void;
  loading: boolean;
  updateUser: any;
  setUser: any;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  handleLoginRequest: (data: any) => void;
  handleLogout: () => void;
  activeTrades: any[];
  tradeHistory: any[];
  floatingPnL: number;
  liveEquity: number;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMentorMode: boolean;
  setIsMentorMode: React.Dispatch<React.SetStateAction<boolean>>;
  isAccountMenuOpen: boolean;
  setAccountMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  addNotification: any;
};

export default function AppRoutes({
  user,
  theme,
  toggleTheme,
  loading,
  updateUser,
  setUser,
  showToast,
  handleLoginRequest,
  handleLogout,
  activeTrades,
  tradeHistory,
  floatingPnL,
  liveEquity,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isMentorMode,
  setIsMentorMode,
  isAccountMenuOpen,
  setAccountMenuOpen,
  addNotification,
}: Props) {
  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
      />

      {renderAuthRoutes({
        handleLoginRequest,
        showToast,
      })}

      {user && (
        <>
          <Route
            path="subscribe/:planName"
            element={<Subscribe showToast={showToast} />}
          />

          <Route
            path="payment-success"
            element={<PaymentSuccessPage theme={theme} />}
          />
          <Route path="payment-cancelled" element={<PaymentCancelledPage />} />
        </>
      )}

      <Route
        element={
          user ? (
            <RootLayout
              toggleTheme={toggleTheme}
              theme={theme}
              isSidebarCollapsed={isSidebarCollapsed}
              setIsSidebarCollapsed={setIsSidebarCollapsed}
              activeTrades={activeTrades}
              isMentorMode={isMentorMode}
              setIsMentorMode={setIsMentorMode}
              setAccountMenuOpen={setAccountMenuOpen}
              onLogout={handleLogout}
              isAccountMenuOpen={isAccountMenuOpen}
              showToast={showToast}
            />
          ) : (
            <Navigate to="/auth/signIn" replace />
          )
        }
      >
        <Route
          path="dashboard"
          element={
            <DashboardContainer
              user={user}
              activeTrades={activeTrades}
              tradeHistory={tradeHistory}
              liveEquity={liveEquity}
              floatingPnL={floatingPnL}
            />
          }
        />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route
          path="ai_signals"
          element={
            <AISignalsPage
              user={user}
              activeTrades={activeTrades}
              showToast={showToast}
              tradeHistory={tradeHistory}
            />
          }
        />

        <Route path="mentors" element={<MentorPage user={user} />} />
        <Route
          path="apply-mentor/:userId"
          element={<MentorApplicationPage />}
        />
        <Route
          path="mentor/:mentorId"
          element={<MentorProfilePage showToast={showToast} />}
        />
        <Route path="education" element={<EducationPage />} />
        <Route
          path="analytics"
          element={
            <AnalyticsPage
              user={user}
              floatingPnL={floatingPnL}
              liveEquity={liveEquity}
            />
          }
        />
        <Route
          path="ls_calculator"
          element={<LotSizeCalculatorPage user={user} />}
        />
        <Route
          path="contact_us"
          element={<ContactUsPage showToast={showToast} />}
        />
        <Route
          path="market_chart"
          element={<MarketChartPage theme={theme} />}
        />
        <Route
          path="settings"
          element={
            <SettingsPage
              user={user}
              setUser={setUser}
              showToast={showToast}
              updateUser={updateUser}
              loading={loading}
            />
          }
        />

        {renderMentorRoutes({
          user,
          showToast,
          addNotification,
        })}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
