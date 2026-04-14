import {
  Outlet,
  Navigate,
  useNavigate,
  useLocation,
  useMatch,
  Link,
} from "react-router-dom";
import useAppStore from "@/store/useStore";
import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowLeft, Home, X } from "lucide-react";

const AuthLayout = ({ onAuthSuccess, showToast }) => {
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const isLogin = useMatch("/auth/signIn") !== null;
  const isSignup = useMatch("/auth/signUp") !== null;
  const isAuthForm = isLogin || isSignup;

  type RobotState =
    | "idle"
    | "greeting"
    | "excited"
    | "hiding"
    | "running"
    | "skipping"
    | "jumping"
    | "searching"
    | "thinking"
    | "sad";
  const [robotState, setRobotState] = useState<RobotState>("idle");

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPlan = location.state?.selectedPlan || "Free";

  useEffect(() => {
    if (selectedPlan) localStorage.setItem("selectedPlan", selectedPlan);
    console.log(selectedPlan);
  }, [selectedPlan]);

  useEffect(() => {
    if (location.pathname === "/auth") {
      if (selectedPlan && selectedPlan !== "Free") {
        navigate("/auth/signup", { state: { selectedPlan } });
      } else {
        navigate("/auth/signIn", { state: { selectedPlan } });
      }
    }
  }, [location.pathname, navigate, selectedPlan]);

  useEffect(() => {
    if (isLogin) {
      setRobotState("greeting");
    } else {
      setRobotState("jumping");
    }
  }, []);

  useEffect(() => {
    if (!loading && robotState !== "sad") {
      if (isForgotPassword) {
        setRobotState("thinking");
      } else {
        setRobotState(isLogin ? "greeting" : "jumping");
      }
    }
  }, [isLogin, loading, isForgotPassword]);

  const handleFocus = (field) => {
    if (isForgotPassword) {
      setRobotState("thinking");
      return;
    }
    if (robotState === "sad") {
      setRobotState("idle");
    }

    switch (field) {
      case "password":
        setRobotState("hiding");
        break;
      case "name":
        setRobotState("skipping");
        break;
      case "dob":
        setRobotState("jumping");
        break;
      case "email":
        setRobotState("idle");
        break;
      default:
        setRobotState(isLogin ? "idle" : "excited");
    }
  };

  const handleBlur = () => {
    if (!loading && !error) {
      if (isForgotPassword) {
        setRobotState("thinking");
      } else {
        setRobotState(isLogin ? "greeting" : "idle");
      }
    }
  };

  const toggleUrl = () => {
    const nextIsLogin = !isLogin;

    if (nextIsLogin) {
      navigate("/auth/signIn");
      setRobotState("greeting");
    } else {
      navigate("/auth/signUp");
      setRobotState("jumping");
    }
  };

  const getRobotText = () => {
    if (loading) {
      if (isForgotPassword)
        return {
          title: "Locating Account...",
          sub: "Searching the digital archives.",
        };
      return {
        title: "Checking database...",
        sub: "Verifying credentials in the archives!",
      };
    }
    if (isForgotPassword)
      return {
        title: "Forgot It?",
        sub: "Don't worry, I can help you recover it!",
      };
    if (robotState === "hiding")
      return { title: "No Peeking!", sub: "Your secret is safe with me." };
    if (robotState === "skipping")
      return { title: "Nice to meet you!", sub: "I love making new friends." };
    if (robotState === "jumping")
      return { title: "Woohoo!", sub: "Let's get this party started!" };
    if (isLogin)
      return { title: "Welcome Back!", sub: "Ready to conquer the markets?" };
    return {
      title: "Join the Squad!",
      sub: "Start your trading journey today.",
    };
  };

  const robotText = getRobotText();

  const handleGoogleSignIn = useAppStore((state) => state.handleGoogleSignIn);

  const handleGoogleSuccess = async (response) => {
    setRobotState("searching");
    try {
      const res = await handleGoogleSignIn({ token: response });
      const user = res;

      if (selectedPlan && selectedPlan !== "Free") {
        navigate(`/subscribe/${selectedPlan}`, {
          state: { email: user.email, name: user.name },
        });
      }
      onAuthSuccess({
        name: user.name,
        email: user.email,
        plan: user.subscribedPlan || "FREE",
        image: user.picture || user.avatar,
        isMentor: user.isMentor,
        id: user._id,
        subscribedPlan: user.subscribedPlan,
        isSubscribed: user.isSubscribed,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionMethod: user.subscriptionMethod,
        subscriptionInterval: user.subscriptionInterval,
        subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
        stripeCustomerId: user.stripeCustomerId,
        tradeSettings: {
          balance: user.tradeSettings?.balance || 10000,
          riskPerTrade: user.tradeSettings?.riskPerTrade || 1,
          currency: user.tradeSettings?.currency || "USD",
        },
        cTraderConfig: {
          accountId: user.cTraderConfig.accountId,
          isConnected: user.cTraderConfig.isConnected,
          autoTradeEnabled: user.cTraderConfig.autoTradeEnabled,
        },
      });
    } catch (error) {
      console.log(error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Authentication failed. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setRobotState("idle");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex-col overflow-hidden flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-right">
      <div className="w-full md:max-w-5xl bg-transparent boder-0 md:bg-[#0f1115] rounded-[2.5rem] overflow-hidden shadow-xl md:border md:border-slate-800 flex flex-col md:flex-row relative h-full md:min-h-[650px]">
        <div className="w-full hidden md:flex md:w-1/2 relative bg-gradient-to-b from-[#1a1d26] to-[#0f1115] overflow-hidden flex flex-col items-center justify-center p-8 md:p-0 min-h-[300px] md:min-h-full transition-colors duration-700">
          <div
            className={`absolute top-[-20%] left-[-20%] w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-700 ${
              robotState === "hiding"
                ? "bg-purple-900/20"
                : robotState === "running"
                  ? "bg-red-900/20"
                  : robotState === "searching"
                    ? "bg-indigo-600/30"
                    : robotState === "thinking"
                      ? "bg-orange-600/20"
                      : robotState === "skipping"
                        ? "bg-yellow-600/20"
                        : "bg-blue-600/20"
            }`}
          ></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]"></div>

          <div
            className={`absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50 transition-transform duration-[10s] ${
              robotState === "running" || robotState === "searching"
                ? "animate-scroll"
                : ""
            }`}
          ></div>

          {robotState === "searching" && (
            <>
              <div
                className="absolute bottom-0 left-1/4 w-12 h-16 bg-white/10 border border-white/30 rounded flex items-center justify-center animate-file-up"
                style={{ animationDelay: "0s" }}
              >
                <div className="w-8 h-1 bg-white/30 mb-1"></div>
                <div className="w-6 h-1 bg-white/30"></div>
              </div>
              <div
                className="absolute bottom-0 right-1/4 w-10 h-14 bg-blue-500/20 border border-blue-400/30 rounded flex items-center justify-center animate-file-up"
                style={{ animationDelay: "0.5s", left: "60%" }}
              >
                <div className="w-6 h-1 bg-blue-400/30 mb-1"></div>
                <div className="w-4 h-1 bg-blue-400/30"></div>
              </div>
              <div
                className="absolute bottom-0 left-1/3 w-14 h-20 bg-white/5 border border-white/20 rounded flex items-center justify-center animate-file-up"
                style={{ animationDelay: "1s" }}
              >
                <div className="w-10 h-1 bg-white/20 mb-1"></div>
                <div className="w-8 h-1 bg-white/20"></div>
              </div>
            </>
          )}

          <div
            className={`relative z-10 transition-transform duration-500 ease-out 
                        ${
                          robotState === "excited" || robotState === "jumping"
                            ? "scale-110 translate-y-[-10px]"
                            : ""
                        } 
                        ${robotState === "running" ? "scale-90" : ""}
                        ${robotState === "searching" ? "scale-100" : ""}
                        ${robotState === "thinking" ? "scale-100" : ""}
                    `}
          >
            {/* 3D Head */}
            <div
              className={`w-40 h-40 rounded-[2.5rem] bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 shadow-[inset_5px_5px_15px_rgba(255,255,255,0.8),inset_-5px_-5px_15px_rgba(0,0,0,0.3),0_20px_40px_rgba(0,0,0,0.4)] relative mx-auto z-20 flex items-center justify-center 
                            ${
                              robotState === "idle" || robotState === "greeting"
                                ? "animate-float"
                                : ""
                            }
                            ${
                              robotState === "excited" ||
                              robotState === "jumping"
                                ? "animate-bounce"
                                : ""
                            }
                            ${robotState === "running" ? "animate-run" : ""}
                            ${robotState === "skipping" ? "animate-skip" : ""}
                            ${robotState === "searching" ? "animate-pulse" : ""}
                            ${robotState === "thinking" ? "animate-float" : ""}
                        `}
            >
              {/* Gloss Highlight */}
              <div className="absolute top-4 left-6 w-10 h-6 bg-white/60 rounded-full blur-[2px] transform -rotate-45"></div>

              {/* Antenna */}
              <div
                className={`absolute -top-8 left-1/2 -translate-x-1/2 w-3 h-10 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full -z-10 shadow-lg ${
                  robotState === "running" ? "-rotate-12" : ""
                }`}
              ></div>
              <div
                className={`absolute -top-10 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full shadow-[0_0_20px] transition-colors duration-500 
                                ${
                                  isLogin &&
                                  !["hiding", "searching", "thinking"].includes(
                                    robotState,
                                  )
                                    ? "bg-blue-500 shadow-blue-500"
                                    : "bg-green-400 shadow-green-400"
                                }
                                ${
                                  robotState === "running"
                                    ? "animate-ping bg-red-500 shadow-red-500"
                                    : ""
                                }
                                ${
                                  robotState === "skipping"
                                    ? "bg-yellow-400 shadow-yellow-400"
                                    : ""
                                }
                                ${
                                  robotState === "searching"
                                    ? "bg-indigo-500 shadow-indigo-500 animate-pulse"
                                    : ""
                                }
                                ${
                                  robotState === "thinking"
                                    ? "bg-orange-500 shadow-orange-500"
                                    : ""
                                }
                            `}
              ></div>
              <div
                className={`absolute -top-10 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full transition-colors duration-500 ${
                  isLogin ? "bg-blue-500" : "bg-green-400"
                }`}
              ></div>

              {/* Face Screen (Inset) */}
              <div className="w-32 h-24 bg-[#0a0a0a] rounded-[1.2rem] shadow-[inset_0_0_15px_rgba(0,0,0,1),0_1px_2px_rgba(255,255,255,0.1)] flex items-center justify-center gap-4 relative overflow-hidden border border-slate-800">
                {/* Screen Glare */}
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-white/5 to-transparent transform rotate-45 pointer-events-none"></div>

                {/* Eyes Logic */}
                {robotState === "hiding" ? (
                  // Hiding/Peeking Eyes
                  <>
                    <div className="w-8 h-2 bg-slate-700 rounded-full mt-4"></div>
                    <div className="w-8 h-2 bg-slate-700 rounded-full mt-4"></div>
                  </>
                ) : robotState === "running" ? (
                  // Concentrated/Running Eyes
                  <>
                    <div className="text-white text-2xl font-bold">&gt;</div>
                    <div className="text-white text-2xl font-bold">&lt;</div>
                  </>
                ) : robotState === "searching" ? (
                  // Searching Eyes (Scanning)
                  <div className="flex gap-4 animate-search-eyes">
                    <div className="w-8 h-8 bg-indigo-400 rounded-full border-2 border-white relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="w-8 h-8 bg-indigo-400 rounded-full border-2 border-white relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                ) : robotState === "thinking" ? (
                  // Thinking Eyes (Question Mark)
                  <div className="text-orange-400 text-6xl font-bold animate-pulse">
                    ?
                  </div>
                ) : robotState === "skipping" ? (
                  // Happy Eyes
                  <>
                    <div className="w-3 h-6 bg-yellow-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-3 h-6 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                  </>
                ) : robotState === "jumping" || robotState === "excited" ? (
                  // Excited Eyes
                  <>
                    <div className="text-green-400 text-3xl font-bold animate-bounce drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]">
                      ^
                    </div>
                    <div
                      className="text-green-400 text-3xl font-bold animate-bounce drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]"
                      style={{ animationDelay: "0.1s" }}
                    >
                      ^
                    </div>
                  </>
                ) : isLogin ? (
                  // Normal Login Eyes
                  <>
                    <div className="w-7 h-9 bg-blue-400 rounded-full shadow-[0_0_15px_#60a5fa] animate-pulse relative">
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="w-7 h-9 bg-blue-400 rounded-full shadow-[0_0_15px_#60a5fa] animate-pulse relative">
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </>
                ) : (
                  // Normal Signup Eyes
                  <>
                    <div className="w-7 h-9 bg-green-400 rounded-full shadow-[0_0_15px_#4ade80] animate-pulse relative">
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="w-7 h-9 bg-green-400 rounded-full shadow-[0_0_15px_#4ade80] animate-pulse relative">
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3D Body */}
            <div
              className={`w-32 h-28 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 rounded-[2rem] mx-auto -mt-6 pt-8 relative z-10 shadow-[inset_5px_5px_15px_rgba(255,255,255,0.8),inset_-5px_-5px_15px_rgba(0,0,0,0.3),0_20px_40px_rgba(0,0,0,0.4)]
                             ${robotState === "running" ? "animate-run" : ""}
                             ${robotState === "skipping" ? "animate-skip" : ""}
                        `}
            >
              {/* Chest Light */}
              <div className="w-12 h-12 bg-[#0a0a0a] rounded-full mx-auto flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,1)] border border-slate-700">
                <div
                  className={`w-6 h-6 rounded-full shadow-[0_0_15px] transition-colors duration-500 
                                    ${
                                      isLogin &&
                                      ![
                                        "hiding",
                                        "searching",
                                        "thinking",
                                      ].includes(robotState)
                                        ? "bg-blue-400 shadow-blue-400"
                                        : "bg-green-400 shadow-green-400"
                                    }
                                    ${
                                      robotState === "searching"
                                        ? "bg-indigo-400 shadow-indigo-400 animate-ping"
                                        : ""
                                    }
                                    ${
                                      robotState === "thinking"
                                        ? "bg-orange-400 shadow-orange-400 animate-pulse"
                                        : ""
                                    }
                                `}
                ></div>
              </div>
            </div>

            {/* 3D Arms (Floaters) - DYNAMIC POSITIONING */}
            {/* Left Arm */}
            <div
              className={`absolute w-12 h-24 bg-gradient-to-br from-slate-200 to-slate-400 rounded-full shadow-xl transition-all duration-500 ease-in-out z-30
                            ${
                              robotState === "hiding"
                                ? "top-6 left-10 rotate-[160deg] !h-24 origin-center"
                                : "top-28 -left-8"
                            }
                            ${robotState === "greeting" ? "rotate-12" : ""}
                            ${
                              robotState === "excited" ||
                              robotState === "jumping"
                                ? "rotate-[140deg] -translate-y-12"
                                : ""
                            }
                            ${
                              robotState === "running"
                                ? "animate-arm-run-l top-24"
                                : ""
                            }
                            ${robotState === "skipping" ? "animate-wave" : ""}
                            ${
                              robotState === "searching"
                                ? "animate-hands-sort top-24 left-[-10px]"
                                : ""
                            }
                            ${
                              robotState === "thinking"
                                ? "top-28 -left-8 rotate-12"
                                : ""
                            }
                            ${robotState === "idle" ? "rotate-12" : ""}
                        `}
            ></div>

            {/* Right Arm */}
            <div
              className={`absolute w-12 h-24 bg-gradient-to-br from-slate-200 to-slate-400 rounded-full shadow-xl transition-all duration-500 ease-in-out z-30
                            ${
                              robotState === "hiding"
                                ? "top-6 right-10 rotate-[-160deg] !h-24 origin-center"
                                : "top-28 -right-8 origin-top-left"
                            }
                            ${
                              robotState === "greeting"
                                ? "animate-wave -rotate-[20deg]"
                                : ""
                            }
                            ${
                              robotState === "excited" ||
                              robotState === "jumping"
                                ? "rotate-[-140deg] -translate-y-12"
                                : ""
                            }
                            ${
                              robotState === "running"
                                ? "animate-arm-run-r top-24"
                                : ""
                            }
                            ${
                              robotState === "skipping"
                                ? "animate-wave -rotate-[20deg]"
                                : ""
                            }
                            ${
                              robotState === "searching"
                                ? "animate-hands-sort top-24 right-[-10px]"
                                : ""
                            }
                            ${
                              robotState === "thinking"
                                ? "top-6 right-6 rotate-[-160deg] !h-24 origin-center animate-scratch"
                                : ""
                            }
                            ${robotState === "idle" ? "rotate-[-12deg]" : ""}
                        `}
            ></div>

            {/* Shadow Disc */}
            <div
              className={`w-32 h-4 bg-black/40 rounded-[100%] blur-md mx-auto mt-8 
                            ${
                              robotState === "running"
                                ? "animate-pulse scale-75"
                                : "animate-pulse"
                            }
                        `}
            ></div>

            <div className="mt-8 text-center relative z-10 transition-opacity duration-300">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight drop-shadow-md">
                {robotText.title}
              </h2>
              <p className="text-slate-400 font-medium">{robotText.sub}</p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-2 md:p-12  md:bg-[#0f1115] relative flex flex-col justify-center">
        <div className="w-full">
<div className="w-full flex items-center justify-end ">
        <Link
          to="/"
          className="flex text-sm gap-1 p-2 items-center text-mid-text hover:text-white hover:bg-light-hover bg-light-hover rounded-full hover:font-semibold"
        >
         <X/>
        </Link>
      </div>
        </div>
          {isAuthForm && (
            <div className="text-center mb-8 w-full">
              <h3 className="text-2xl font-bold text-white mb-2">
                {isLogin ? "Sign In" : "Create Account"}
              </h3>
              <p className="text-slate-500 text-sm">
                use your google account or email
              </p>
            </div>
          )}

          {isAuthForm && (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
              className={`mt-0 rounded-lg ${
                loading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <GoogleLogin
                onSuccess={(credentialResponse) =>
                  handleGoogleSuccess(credentialResponse.credential)
                }
                onError={() => console.log("Login Failed")}
                text="continue_with"
                size="large"
                width="100%"
              />
            </div>
          )}

          {isAuthForm && (
            <div className="my-8 flex items-center justify-between">
              <span className="h-px bg-light-gray flex-1"></span>
              <span className="text-xs text-mid-text px-2 uppercase">{`Or ${
                isLogin ? "login" : "register"
              }  with email`}</span>
              <span className="h-px bg-light-gray flex-1"></span>
            </div>
          )}

          <Outlet
            context={{
              showToast,
              onAuthSuccess,
              handleFocus,
              handleBlur,
              setRobotState,
              selectedPlan,
            }}
          />

          {isAuthForm && (
            <div className="flex w-full justify-center items-center mt-2 h-[100px]">
              {isLogin ? (
                <>
                  <span className="text-slate-500">Don't have an account?</span>
                  <button
                    onClick={toggleUrl}
                    className="ml-2 font-bold text-blue-400"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  <span className="text-slate-500">
                    Already have an account?
                  </span>
                  <button
                    onClick={toggleUrl}
                    className="ml-2 font-bold text-blue-400"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
