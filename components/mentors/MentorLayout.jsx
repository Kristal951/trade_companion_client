import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import useMentorStore from "@/store/mentorStore";
import useAppStore from "@/store/useStore";

const MentorLayout = ({ showToast }) => {
  const { getMentorByUserID, setMentorMode, isMentorMode, isLoading } =
    useMentorStore();

  const user = useAppStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user?.id) return;

    if (!user.isMentor) {
      setMentorMode(false);
      navigate("/dashboard", { replace: true });
      return;
    }

    const initMentorMode = async () => {
      try {
        const mentorProfile = await getMentorByUserID(user.id);

        if (!mentorProfile) {
          setMentorMode(false);
          navigate("/dashboard", { replace: true });
          showToast(
            "Could not switch to mentor, please try again later",
            "error",
          );
          return;
        }

        setMentorMode(true);

        if (!location.pathname.startsWith("/mentor")) {
          navigate("/mentor/dashboard", { replace: true });
        }
      } catch (err) {
        setMentorMode(false);
        navigate("/dashboard", { replace: true });
        showToast(
          "Could not switch to mentor, please try again later",
          "error",
        );
      }
    };

    initMentorMode();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  return <Outlet context={{ showToast }} />;
};

export default MentorLayout;
