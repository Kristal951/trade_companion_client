import React, { useState, useEffect } from "react";
import { Mentor, MentorPost, RecentSignal } from "../../types";
import Icon from "../ui/Icon";
import SecureContent from "../ui/SecureContent";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useMentorStore from "@/store/mentorStore";
import { useParams } from "react-router-dom";
import { API } from "@/utils";
import MentorPostCard from "../ui/MentorPostCard";
import Spinner from "../ui/Spinner";
import useAppStore from "@/store/useStore";
import { useSearchParams } from "react-router-dom";

interface PostCardProps {
  post: MentorPost;
  mentor: Mentor;
}

const PostCard: React.FC<PostCardProps> = ({ post, mentor }) => {
  const isSignal = post.type === "signal";
  const isBuy = post.signalDetails?.direction === "BUY";

  return (
    <div className="bg-light-surface p-6 rounded-lg mb-6 border-l-4 border-primary/50 shadow-sm border border-light-gray">
      <SecureContent watermarkText={`Trade Companion / ${mentor.name}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-dark-text">{post.title}</h3>
            <p className="text-xs text-mid-text">
              Posted on {new Date(post.timestamp).toLocaleString()}
            </p>
          </div>
          {isSignal && (
            <span
              className={`px-4 py-1 text-sm font-bold rounded-full ${
                isBuy
                  ? "bg-success/20 text-success"
                  : "bg-danger/20 text-danger"
              }`}
            >
              {post.signalDetails?.instrument} {post.signalDetails?.direction}
            </span>
          )}
        </div>

        {isSignal && post.signalDetails && (
          <div className="grid grid-cols-3 gap-4 text-center mb-4 bg-light-hover p-4 rounded-md border border-light-gray">
            <div>
              <p className="text-sm text-mid-text">Entry Price</p>
              <p className="text-lg font-semibold text-dark-text">
                {post.signalDetails.entry}
              </p>
            </div>
            <div>
              <p className="text-sm text-mid-text">Stop Loss</p>
              <p className="text-lg font-semibold text-danger">
                {post.signalDetails.stopLoss}
              </p>
            </div>
            <div>
              <p className="text-sm text-mid-text">Take Profit</p>
              <p className="text-lg font-semibold text-success">
                {post.signalDetails.takeProfit}
              </p>
            </div>
          </div>
        )}

        <div
          className="text-dark-text text-sm mb-4"
          dangerouslySetInnerHTML={{ __html: post.content }}
        ></div>

        {post.imageUrl && (
          <div className="mt-4">
            <img
              src={post.imageUrl}
              alt="Chart analysis"
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        )}
      </SecureContent>
    </div>
  );
};

const SignalOutcomeCard: React.FC<{ signal: RecentSignal }> = ({ signal }) => {
  const isWin = signal.outcome === "win";
  const isBuy = signal.direction === "BUY";

  return (
    <div className="bg-light-hover p-4 rounded-lg border border-light-gray space-y-3">
      <div className="flex justify-between items-center">
        <span
          className={`px-2 py-1 text-xs font-bold rounded-full ${
            isBuy ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
          }`}
        >
          {signal.instrument} {signal.direction}
        </span>
        <span
          className={`flex items-center text-xs font-semibold ${
            isWin ? "text-success" : "text-danger"
          }`}
        >
          <Icon name={isWin ? "check" : "close"} className="w-4 h-4 mr-1" />
          {isWin ? "Win" : "Loss"}
        </span>
      </div>
      <div className="grid grid-cols-3 text-center text-xs">
        <div>
          <p className="text-mid-text">Entry</p>
          <p className="font-semibold text-dark-text">{signal.entry}</p>
        </div>
        <div>
          <p className="text-mid-text">Stop Loss</p>
          <p className="font-semibold text-danger">{signal.stopLoss}</p>
        </div>
        <div>
          <p className="text-mid-text">Take Profit</p>
          <p className="font-semibold text-success">{signal.takeProfit}</p>
        </div>
      </div>
    </div>
  );
};

interface MentorProfilePageProps {
  showToast: (message: string, type?: "success" | "info" | "error") => void;
}

const RatingInput: React.FC = ({ setRating, setHover, hover, rating }) => {
  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            type="button"
            key={starValue}
            className="transition-transform transform hover:scale-125"
            onClick={() => setRating(starValue)}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
          >
            <Icon
              name="star"
              className={`w-8 h-8 cursor-pointer ${
                starValue <= (hover || rating)
                  ? "text-warning fill-current"
                  : "text-light-gray"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

const MentorProfilePage: React.FC<MentorProfilePageProps> = ({ showToast }) => {
  const {
    getMentorByID,
    isLoading,
    submitUserReview,
    startMentorSubscription,
    isSubscribingToMentor,
  } = useMentorStore();
  const params = useParams();
  const mentorID = params.mentorID || params.id;
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [mentorPosts, setMentorPosts] = useState<MentorPost[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const user = useAppStore((state) => state.user);
  const userId = user?._id || user?.id;

  const [searchParams] = useSearchParams();
  const subStatus = searchParams.get("sub");
  console.log(mentor);

  const isSubscribed = !!mentor?.subscribers?.some(
    (sub) => sub.userId === userId && sub.status === "Active",
  );

  const isOwnProfile = mentor?._id === userId;

  const handleSubmitReview = async () => {
    if (rating === 0) {
      showToast("Please select a rating before submitting.", "error");
      return;
    }

    try {
      await submitUserReview(mentorID, rating, user.id, review);
      setRating(0);
      setHover(0);
      setReview("");

      showToast("Review submitted successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to submit review.", "error");
    }
  };

  useEffect(() => {
    if (!mentorID) return;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const m = await getMentorByID(mentorID);
        setMentor(m);

        if (m?._id) {
          const postsRes = await API.get(
            `/api/mentor/getAllMentorPost/${m._id}`,
          );
          setMentorPosts(postsRes.data.posts || []);
        }

        if (subStatus === "success") {
          showToast("Subscription successful 🎉", "success");

          const refreshed = await getMentorByID(mentorID);
          setMentor(refreshed);

          window.history.replaceState({}, "", `/mentor/${mentorID}`);
        }

        if (subStatus === "cancel") {
          showToast("Subscription cancelled.", "info");
          window.history.replaceState({}, "", `/mentor/${mentorID}`);
        }
      } catch (e) {
        console.error(e);
        setError("could not fetch mentor, try again");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [mentorID, subStatus, getMentorByID, showToast]);

  useEffect(() => {
    const getMentor = async () => {
      setLoading(true);
      try {
        const mentor = await getMentorByID(mentorID);
        setMentor(mentor);
        if (mentor) {
          try {
            setLoading(true);
            const posts = await API.get(
              `/api/mentor/getAllMentorPost/${mentor._id}`,
            );
            setMentorPosts(posts.data.posts);
          } catch (error) {
            console.log(error);
            showToast("Could not get mentor posts", "error");
          } finally {
            setLoading(false);
          }
        }
      } catch (error) {
        console.log(error);
        setError("could not fetch mentor, try again");
      } finally {
        setLoading(false);
      }
    };
    getMentor();
  }, [mentorID, getMentorByID, showToast]);

  const handleSubscribeToMentor = async () => {
    if (!mentorID) {
      showToast("Invalid mentor link.", "error");
      return;
    }

    if (isSubscribed) {
      showToast("You’re already subscribed to this mentor.", "info");
      return;
    }

    try {
      const res = await startMentorSubscription(mentorID);

      const url = res?.url;
      if (!url || typeof url !== "string") {
        throw new Error("No checkout URL returned");
      }

      window.location.assign(url);
    } catch (err: any) {
      console.error(err);
      showToast(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to start subscription, try again later",
        "error",
      );
    }
  };

  const performanceMetrics = React.useMemo(() => {
    const signals = mentor?.recentSignals;
    if (!signals || signals.length === 0) {
      return {
        winRate: "N/A",
        avgPnl: "N/A",
        totalTrades: 0,
      };
    }

    const totalTrades = signals.length;
    const wins = signals.filter((s) => s.outcome === "win").length;
    const winRate =
      totalTrades > 0 ? `${Math.round((wins / totalTrades) * 100)}%` : "N/A";

    const totalPnl = signals.reduce((acc, s) => acc + (s.pnl || 0), 0);
    const avgPnl =
      totalTrades > 0 ? `$${(totalPnl / totalTrades).toFixed(2)}` : "N/A";

    return { winRate, avgPnl, totalTrades };
  }, [mentor?.recentSignals]);

  const handleShareProfile = () => {
    const url = `${window.location.origin}${window.location.pathname}?mentorId=${mentor?._id}`;
    navigator.clipboard.writeText(url).then(
      () => {
        showToast("Mentor profile link copied to clipboard!", "success");
      },
      (err) => {
        console.error("Could not copy text: ", err);
        showToast("Failed to copy link.", "error");
      },
    );
  };

  const StatsCard: React.FC<{
    label: string;
    value: string | number;
    color?: string;
  }> = ({ label, value, color = "text-dark-text" }) => (
    <div className="bg-light-hover p-4 rounded-lg text-center border border-light-gray">
      <p className="text-sm text-mid-text">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );

  return (
    <div className="p-8 bg-light-bg min-h-screen">
      {loading ? (
        <div className="w-full h-screen flex items-center justify-center">
          <Spinner w={12} h={12} />
        </div>
      ) : error ? (
        <div className="w-full h-screen flex flex-col items-center justify-center text-center p-4">
          <Icon name="danger" className="w-10 h-10 text-danger mb-2" />
          <p className="text-danger font-semibold text-xl">{error}</p>
        </div>
      ) : (
        <>
          <div className="bg-light-surface p-6 rounded-lg mb-8 shadow-sm border border-light-gray relative">
            {/* <button
              onClick={handleShareProfile}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-light-hover text-mid-text hover:text-primary transition-colors"
              title="Share Profile"
            >
              <Icon name="link" className="w-6 h-6" />
            </button> */}

            <div className="flex flex-col md:flex-row items-center text-center md:text-left">
              <img
                src={mentor?.avatar}
                alt={mentor?.name}
                className="w-24 h-24 rounded-full mb-4 md:mb-0 md:mr-6 border-4 border-primary"
              />
              <div className="flex-grow">
                <h1 className="text-3xl font-bold text-dark-text">
                  {mentor?.name}
                </h1>
                <div className="flex items-center justify-center md:justify-start space-x-4 mt-2 text-sm text-mid-text">
                  <span>{mentor?.experience} Yrs Experience</span>
                  <span className="text-primary">|</span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Icon
                      name="star"
                      className="w-4 h-4 text-warning fill-current"
                    />
                    {mentor?.rating?.toFixed(1)} ({mentor?.reviewsCount}{" "}
                    reviews)
                  </span>
                  <span className="text-primary">|</span>
                  <span>${mentor?.price}/month</span>
                </div>
              </div>

              {!isOwnProfile && (
                <button
                  onClick={!isSubscribed ? handleSubscribeToMentor : undefined}
                  disabled={isSubscribingToMentor || isSubscribed}
                  className={`px-6 py-2 rounded-lg font-bold transition
    ${
      isSubscribed
        ? "bg-success text-white cursor-default"
        : "bg-primary text-white hover:bg-primary-hover"
    }
  `}
                >
                  {isSubscribingToMentor ? (
                    <Spinner w={5} h={5} />
                  ) : isSubscribed ? (
                    "Subscribed"
                  ) : (
                    "Subscribe"
                  )}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <StatsCard
                label="Recent Win Rate"
                value={performanceMetrics.winRate}
                color="text-success"
              />
              <StatsCard
                label="Avg. P/L / Trade"
                value={performanceMetrics.avgPnl}
                color={
                  performanceMetrics.avgPnl.startsWith("$-")
                    ? "text-danger"
                    : "text-success"
                }
              />
              <StatsCard
                label="Recent Trades"
                value={performanceMetrics.totalTrades}
              />
              <StatsCard
                label="Avg. ROI / mo"
                value={`${mentor?.roi}%`}
                color="text-success"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-4 text-dark-text">
                Exclusive Feed
              </h2>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-6">
                  {loading ? (
                    <div className="text-center py-16">
                      <Spinner w={8} h={8} />
                    </div>
                  ) : mentorPosts && mentorPosts.length > 0 ? (
                    [...mentorPosts]
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )
                      .map((post) => (
                        <MentorPostCard
                          key={post.id}
                          post={post}
                          mentorName={mentor?.name || ""}
                          showToast={showToast}
                        />
                      ))
                  ) : (
                    <div className="text-center py-16 text-mid-text bg-light-surface rounded-lg shadow-sm border border-light-gray">
                      <p>No posts from {mentor?.name} yet.</p>
                      <p>Check back later for new signals and analysis.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {mentor?.subscriberGrowth &&
                mentor?.subscriberGrowth.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-dark-text">
                      Subscriber Growth
                    </h3>
                    <div className="bg-light-surface p-4 rounded-lg shadow-sm border border-light-gray h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={mentor?.subscriberGrowth}
                          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient
                              id="colorSubscribers"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#818CF8"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#818CF8"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border-light)"
                          />
                          <XAxis
                            dataKey="month"
                            stroke="var(--color-text-mid)"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            stroke="var(--color-text-mid)"
                            tick={{ fontSize: 12 }}
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--color-surface)",
                              border: "1px solid var(--color-border-dark)",
                              borderRadius: "8px",
                            }}
                            itemStyle={{ color: "var(--color-text)" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="subscribers"
                            stroke="var(--color-primary)"
                            fillOpacity={1}
                            fill="url(#colorSubscribers)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              <div>
                <h3 className="text-xl font-bold mb-3 text-dark-text">
                  Trading Strategy
                </h3>
                <div className="bg-light-surface p-4 rounded-lg text-sm text-dark-text shadow-sm border border-light-gray">
                  <p>{mentor?.strategy}</p>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 text-dark-text">
                  Most Traded Instruments
                </h3>
                <div className="bg-light-surface p-4 rounded-lg flex flex-wrap gap-2 shadow-sm border border-light-gray">
                  {mentor?.instruments.map((inst) => (
                    <span
                      key={inst}
                      className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full"
                    >
                      {inst}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 text-dark-text">
                  Recent Signals
                </h3>
                <div className="bg-light-surface p-4 rounded-lg space-y-3 shadow-sm border border-light-gray max-h-96 overflow-y-auto">
                  {mentor?.recentSignals && mentor?.recentSignals.length > 0 ? (
                    [...mentor?.recentSignals]
                      .sort(
                        (a, b) =>
                          new Date(b.timestamp).getTime() -
                          new Date(a.timestamp).getTime(),
                      )
                      .map((signal) => (
                        <SignalOutcomeCard key={signal.id} signal={signal} />
                      ))
                  ) : (
                    <p className="text-center text-sm text-mid-text py-4">
                      No recent signals to display.
                    </p>
                  )}
                </div>
              </div>
              {mentor?.certifications && mentor?.certifications.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-3 text-dark-text">
                    Certifications & Proof
                  </h3>
                  <div className="bg-light-surface p-4 rounded-lg space-y-3 shadow-sm border border-light-gray">
                    {mentor?.certifications.map((cert) => (
                      <a
                        href={cert.url}
                        key={cert.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-info hover:underline"
                      >
                        <Icon
                          name="apply"
                          className="w-5 h-5 mr-2 flex-shrink-0"
                        />
                        <span>{cert.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!isOwnProfile && (
                <div>
                  <h3 className="text-xl font-bold mb-3 text-dark-text">
                    Rate this Mentor
                  </h3>
                  <div className="bg-light-surface p-4 rounded-lg shadow-sm border border-light-gray">
                    <p className="text-sm text-mid-text mb-3">
                      Share your experience to help others in the community.
                    </p>
                    <div className="flex justify-center mb-4">
                      <RatingInput
                        setRating={setRating}
                        setHover={setHover}
                        rating={rating}
                        hover={hover}
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Write a brief review (optional)..."
                      className="w-full bg-light-hover border-light-gray rounded-md p-2 text-sm focus:ring-primary focus:border-primary text-dark-text"
                    />
                    <button
                      onClick={handleSubmitReview}
                      className="w-full mt-3 flex items-center justify-center bg-primary hover:bg-primary-hover text-white font-semibold py-2 rounded-lg"
                    >
                      {isLoading ? (
                        <Spinner h={5} w={5} />
                      ) : (
                        <p> Submit Review </p>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MentorProfilePage;
