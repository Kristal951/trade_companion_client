import React from "react";
import { Navigate, Route } from "react-router-dom";
import AuthLayout from "../auth/AuthLayout";
import LoginForm from "../auth/LoginForm";
import SignupForm from "../auth/SignupForm";
import VerifyEmail from "../auth/VerifyEmail";
import ForgotPassword from "../auth/ForgotPassword";
import ResetPassword from "../auth/ResetPassword";

type AuthRoutesProps = {
  handleLoginRequest: (data: any) => void;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
};

export function renderAuthRoutes({
  handleLoginRequest,
  showToast,
}: AuthRoutesProps) {
  return (
    <>
      <Route
        path="auth"
        element={
          <AuthLayout
            onAuthSuccess={handleLoginRequest}
            showToast={showToast}
          />
        }
      >
        <Route index element={<Navigate to="signIn" replace />} />
        <Route path="signIn" element={<LoginForm />} />
        <Route path="signUp" element={<SignupForm />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />
      </Route>
    </>
  );
}