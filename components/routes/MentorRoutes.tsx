import React from "react";
import { Route } from "react-router-dom";
import MentorLayout from "../mentors/MentorLayout";
import MentorDashboard from "../mentors/MentorDashboard";
import MentorPayoutsPage from "../mentors/MentorPayoutsPage";
import FollowersPage from "../mentors/FollowersPage";

type MentorRoutesProps = {
  user: any;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
};

export function renderMentorRoutes({
  user,
  showToast,
}: MentorRoutesProps) {
  return (
    <>
      <Route path="mentor" element={<MentorLayout showToast={showToast} />}>
        <Route
          path="dashboard"
          element={
            <MentorDashboard
              user={user}
              showToast={showToast}
            />
          }
        />
        <Route
          path="payouts"
          element={
            <MentorPayoutsPage
              user={user}
              showToast={showToast}
            />
          }
        />

        <Route path="followers" element={<FollowersPage />} />
      </Route>
    </>
  );
}
