import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  DashboardView,
  User,
  EducationArticle,
  PlanName,
  Mentor,
  TradeRecord,
  Notification,
  Signal,
  NotificationType,
  RecentSignal,
} from "../../types";
import Icon from "../ui/Icon";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Sector,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceLine,
} from "recharts";
import {
  scanForSignals,
  TARGET_INSTRUMENTS,
} from "../../services/geminiService";
import NotificationBell from "../ui/NotificationBell";
import { useUsageTracker } from "../../hooks/useUsageTracker";
import { getLivePrices } from "../../services/marketDataService";
import { instrumentDefinitions } from "../../config/instruments";
import { PLAN_FEATURES } from "../../config/plans";
import useAppStore from "@/store/useStore";
import { MOCK_EDUCATION_ARTICLES, MOCK_MENTOR_ANALYTICS } from "@/utils";
import { useNavigate } from "react-router-dom";

// --- MOCK DATA ---
const signalPerformanceData = [
  { name: "Jan", profit: 400, loss: 240 },
  { name: "Feb", profit: 300, loss: 139 },
  { name: "Mar", profit: 200, loss: 980 },
  { name: "Apr", profit: 278, loss: 390 },
  { name: "May", profit: 189, loss: 480 },
  { name: "Jun", profit: 239, loss: 380 },
];

const winLossData = [
  { name: "Wins", value: 78, fill: "#22C55E" },
  { name: "Losses", value: 22, fill: "#EF4444" },
];

interface DashboardPageProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  onLogout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
  loading: boolean;
  activeView: DashboardView;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  activeTrades: TradeRecord[];
  setActiveTrades: React.Dispatch<React.SetStateAction<TradeRecord[]>>;
  setIsSidebarCollapsed: any
}

// --- SETTINGS PAGE & SUB-COMPONENTS ---

interface SettingsProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  updateUser: (updatedData: Partial<User>) => void;
  loading: boolean;
}

const VerificationSettings: React.FC<{
  showToast: (msg: string, type: "success" | "info" | "error") => void;
}> = ({ showToast }) => {
  // Local state to simulate verification status for the session
  const [idDoc, setIdDoc] = useState<{ file?: File; type?: string } | null>(
    null
  );
  const [addressDoc, setAddressDoc] = useState<{
    file?: File;
    type?: string;
  } | null>(null);
  const [livenessState, setLivenessState] = useState<
    "idle" | "checking" | "success"
  >("idle");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "Not Submitted" | "Pending" | "Verified" | "Rejected"
  >("Not Submitted");

  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdDoc((prev) => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleAddressFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAddressDoc((prev) => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const startLivenessCheck = async () => {
    setLivenessState("checking");
    showToast("Please look into the camera.", "info");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setTimeout(() => {
        stream.getTracks().forEach((track) => track.stop());
        setLivenessState("success");
        showToast("Liveness check successful!", "success");
      }, 3000);
    } catch (err) {
      console.error("Camera access denied:", err);
      showToast("Camera access is required for liveness check.", "error");
      setLivenessState("idle");
    }
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !idDoc ||
      !idDoc.file ||
      !idDoc.type ||
      !addressDoc ||
      !addressDoc.file ||
      !addressDoc.type ||
      livenessState !== "success"
    ) {
      showToast(
        "Please complete all verification steps, including selecting a type and uploading a file for both documents.",
        "error"
      );
      return;
    }

    setIsVerifying(true);
    showToast("Submitting documents for automated verification...", "info");
    setVerificationStatus("Pending");

    setTimeout(() => {
      showToast("Your identity has been successfully verified!", "success");
      setVerificationStatus("Verified");
      setIsVerifying(false);
    }, 5000);
  };

  const VerificationStep: React.FC<{
    title: string;
    children: React.ReactNode;
  }> = ({ title, children }) => (
    <div className="bg-light-hover p-4 rounded-lg border border-light-gray mb-4">
      <h5 className="font-semibold text-dark-text mb-3">{title}</h5>
      {children}
    </div>
  );

  return (
    <div className="p-6 bg-light-surface rounded-lg border border-light-gray text-dark-text animate-fade-in-right">
      <h3 className="font-bold text-lg mb-2">Identity Verification</h3>
      <p className="text-sm text-mid-text mb-6">
        Required for Mentors to receive payouts.
      </p>

      {verificationStatus === "Verified" ? (
        <div className="p-4 bg-success/10 text-success rounded-lg border border-success/20 flex items-center">
          <Icon name="check" className="w-5 h-5 mr-2" /> Your identity is fully
          verified. You are eligible for payouts.
        </div>
      ) : (
        <form onSubmit={handleVerificationSubmit}>
          <VerificationStep title="1. Identity Document">
            <select
              onChange={(e) =>
                setIdDoc((prev) => ({ ...prev, type: e.target.value }))
              }
              value={idDoc?.type || ""}
              className="w-full bg-light-surface border-light-gray rounded-md p-2 mb-2 focus:ring-primary focus:border-primary text-dark-text"
            >
              <option value="" disabled>
                Select Document Type
              </option>
              <option>Driver's License</option>
              <option>International Passport</option>
              <option>National ID</option>
              <option>NIN Slip</option>
            </select>
            <label
              htmlFor="id-upload"
              className="cursor-pointer border-2 border-dashed border-light-gray rounded-lg p-3 text-center block w-full hover:bg-light-surface text-sm text-mid-text"
            >
              <Icon name="image" className="w-6 h-6 mx-auto mb-1" />
              {idDoc?.file ? idDoc.file.name : "Click to upload"}
            </label>
            <input
              id="id-upload"
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleIdFileChange}
            />
          </VerificationStep>

          <VerificationStep title="2. Liveness Check">
            {livenessState === "idle" ? (
              <button
                type="button"
                onClick={startLivenessCheck}
                className="w-full bg-secondary hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                Start Liveness Check
              </button>
            ) : livenessState === "checking" ? (
              <div className="w-full text-center py-2 text-info animate-pulse">
                Checking... Please wait.
              </div>
            ) : (
              <div className="w-full text-center py-2 text-success font-semibold">
                Liveness Check Complete
              </div>
            )}
          </VerificationStep>

          <VerificationStep title="3. Proof of Address">
            <select
              onChange={(e) =>
                setAddressDoc((prev) => ({ ...prev, type: e.target.value }))
              }
              value={addressDoc?.type || ""}
              className="w-full bg-light-surface border-light-gray rounded-md p-2 mb-2 focus:ring-primary focus:border-primary text-dark-text"
            >
              <option value="" disabled>
                Select Document Type
              </option>
              <option>Utility Bill</option>
              <option>Bank Statement</option>
            </select>
            <label
              htmlFor="address-upload"
              className="cursor-pointer border-2 border-dashed border-light-gray rounded-lg p-3 text-center block w-full hover:bg-light-surface text-sm text-mid-text"
            >
              <Icon name="image" className="w-6 h-6 mx-auto mb-1" />
              {addressDoc?.file ? addressDoc.file.name : "Click to upload"}
            </label>
            <input
              id="address-upload"
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleAddressFileChange}
            />
          </VerificationStep>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg disabled:bg-light-gray"
          >
            {isVerifying ? "Verifying..." : "Submit All for Verification"}
          </button>
        </form>
      )}
    </div>
  );
};
// --- SUB-COMPONENTS for different views ---

export const StatCard: React.FC<{
  title: string;
  value: string;
  percentage?: string;
  percentageType?: "gain" | "loss" | "info";
  icon?: React.ReactNode;
  subValue?: React.ReactNode;
}> = ({
  title,
  value,
  percentage,
  percentageType = "gain",
  icon,
  subValue,
}) => {
  const isGain = percentageType === "gain";
  const isInfo = percentageType === "info";
  const textColor = isGain
    ? "text-success"
    : isInfo
    ? "text-info"
    : "text-danger";
  const bgColor = isGain
    ? "bg-success/10"
    : isInfo
    ? "bg-info/10"
    : "bg-danger/10";

  return (
    <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray flex items-center">
      {icon && (
        <div className={`p-3 rounded-full mr-4 ${bgColor} ${textColor}`}>
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-mid-text text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-dark-text">{value}</p>
        {percentage && (
          <p className={`text-xs font-semibold ${textColor}`}>{percentage}</p>
        )}
        {subValue && <div className="mt-1 text-xs">{subValue}</div>}
      </div>
    </div>
  );
};

const MentorAnalyticsPage: React.FC<{ user: User }> = ({ user }) => {
  // Use mock data for the mentor view (assuming user ID 1 corresponds to the mock mentor data)
  const mentorData = MOCK_MENTOR_ANALYTICS;

  // Signal Accuracy Calculation
  const signalAccuracy = useMemo(() => {
    const total = mentorData.topSignals.length + 2; // Adding some mock loss data implicitly for chart
    const wins = mentorData.topSignals.filter(
      (s) => s.outcome === "win"
    ).length;
    const losses = total - wins;
    return [
      { name: "Wins", value: wins + 5, fill: "#22C55E" }, // Boosting for visual
      { name: "Losses", value: losses + 2, fill: "#EF4444" },
    ];
  }, [mentorData]);

  return (
    <div className="p-8 bg-light-bg min-h-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-dark-text">Mentor Analytics</h2>
        <p className="text-mid-text">
          Track your performance, subscriber growth, and earnings.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-mid-text">Total Earnings (YTD)</p>
              <h3 className="text-3xl font-bold text-dark-text">$15,762</h3>
            </div>
            <div className="p-2 bg-success/10 rounded-lg text-success">
              <Icon name="billing" className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-success mt-2 flex items-center">
            <Icon name="check" className="w-3 h-3 mr-1" /> +12% from last month
          </p>
        </div>

        <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-mid-text">Active Subscribers</p>
              <h3 className="text-3xl font-bold text-dark-text">142</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Icon name="mentors" className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-success mt-2 flex items-center">
            <Icon name="check" className="w-3 h-3 mr-1" /> +5 new this week
          </p>
        </div>

        <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-mid-text">Signal Accuracy</p>
              <h3 className="text-3xl font-bold text-dark-text">78%</h3>
            </div>
            <div className="p-2 bg-warning/10 rounded-lg text-warning">
              <Icon name="signals" className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-mid-text mt-2">Based on last 50 signals</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Earnings Growth Chart */}
        <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
          <h3 className="text-lg font-bold text-dark-text mb-4">
            Earnings Growth
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={mentorData.earningsData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="var(--color-text-mid)" />
              <YAxis
                stroke="var(--color-text-mid)"
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border-light)",
                }}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="var(--color-primary)"
                fillOpacity={1}
                fill="url(#colorEarnings)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subscriber Retention Chart */}
        <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
          <h3 className="text-lg font-bold text-dark-text mb-4">
            Subscriber Retention (New vs Churned)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mentorData.subscriberData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-light)"
                vertical={false}
              />
              <XAxis dataKey="month" stroke="var(--color-text-mid)" />
              <YAxis stroke="var(--color-text-mid)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border-light)",
                }}
                cursor={{ fill: "transparent" }}
              />
              <Legend />
              <Bar
                dataKey="new"
                name="New Subs"
                fill="var(--color-success)"
                barSize={20}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="churned"
                name="Churned"
                fill="var(--color-danger)"
                barSize={20}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Signal Accuracy Pie */}
        <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
          <h3 className="text-lg font-bold text-dark-text mb-4">
            Signal Accuracy Distribution
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={signalAccuracy}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {signalAccuracy.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-border-light)",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-light-surface p-6 rounded-xl shadow-sm border border-light-gray">
          <h3 className="text-lg font-bold text-dark-text mb-4">
            Rating Distribution
          </h3>
          <div className="space-y-4">
            {mentorData.ratingDistribution.map((item) => (
              <div key={item.rating} className="flex items-center">
                <span className="w-8 text-sm font-bold text-dark-text">
                  {item.rating}{" "}
                  <Icon name="star" className="w-3 h-3 inline text-warning" />
                </span>
                <div className="flex-1 h-3 mx-3 bg-light-hover rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning"
                    style={{ width: `${(item.count / 124) * 100}%` }} // 124 total reviews mock
                  ></div>
                </div>
                <span className="text-xs text-mid-text">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Updated EducationPage with Modern UI
export const EducationPage: React.FC<{
  onViewContent: (article: EducationArticle) => void;
}> = ({ onViewContent }) => {
  const sections = [
    {
      title: "Beginner's Guide to Forex",
      category: "Forex Basics",
      description:
        "Start your journey here. Learn the terminology and fundamentals of the market.",
    },
    {
      title: "Technical Analysis Masterclass",
      category: "Technical Analysis",
      description:
        "Learn to read charts, identify patterns, and predict future market movements.",
    },
    {
      title: "Risk Management Essentials",
      category: "Risk Management",
      description: "Strategies to protect your capital and trade sustainably.",
    },
    {
      title: "Using Our Signals",
      category: "Using Our Signals",
      description:
        "A guide to interpreting and executing our AI-generated trade setups effectively.",
    },
  ];

  return (
    <div className="p-8 bg-light-bg min-h-full font-sans">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-10 mb-12 text-white shadow-lg">
        <h1 className="text-4xl font-extrabold mb-4">Trading Academy</h1>
        <p className="text-lg opacity-90 max-w-2xl">
          Elevate your trading skills with our curated library of articles,
          books, and video tutorials. Structured for every level of trader.
        </p>
      </div>

      <div className="space-y-16">
        {sections.map((section) => {
          const articles = MOCK_EDUCATION_ARTICLES.filter(
            (a) => a.category === section.category
          );
          if (articles.length === 0) return null;

          return (
            <section key={section.category} className="animate-fade-in-right">
              <div className="flex items-end justify-between mb-6 border-b border-light-gray pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-dark-text flex items-center">
                    <span className="w-2 h-8 bg-primary rounded-full mr-3"></span>
                    {section.title}
                  </h2>
                  <p className="text-mid-text mt-1 ml-5">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => onViewContent(article)}
                    className="bg-light-surface rounded-xl shadow-sm border border-light-gray overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full transform hover:-translate-y-1"
                  >
                    <div
                      className={`h-1.5 w-full ${
                        article.difficulty === "Beginner"
                          ? "bg-success"
                          : article.difficulty === "Intermediate"
                          ? "bg-warning"
                          : "bg-danger"
                      }`}
                    ></div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-3">
                        <span className="flex items-center text-xs font-bold text-primary uppercase tracking-wide">
                          <Icon
                            name={
                              article.type === "video"
                                ? "play"
                                : article.type === "book"
                                ? "book"
                                : "education"
                            }
                            className="w-3 h-3 mr-1"
                          />
                          {article.type}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            article.difficulty === "Beginner"
                              ? "bg-success/5 text-success border-success/20"
                              : article.difficulty === "Intermediate"
                              ? "bg-warning/5 text-warning border-warning/20"
                              : "bg-danger/5 text-danger border-danger/20"
                          }`}
                        >
                          {article.difficulty}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-dark-text mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-mid-text line-clamp-3 flex-1 mb-4">
                        {article.summary}
                      </p>
                      <div className="pt-4 border-t border-light-gray flex items-center text-xs font-bold text-primary uppercase tracking-wider">
                        Read Now{" "}
                        <Icon
                          name="arrowRight"
                          className="w-3 h-3 ml-2 transition-transform group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

const EducationContentPage: React.FC<{
  article: EducationArticle;
  onBack: () => void;
}> = ({ article, onBack }) => (
  <div className="p-8 bg-light-bg min-h-full">
    <button
      onClick={onBack}
      className="mb-6 flex items-center text-primary hover:underline font-semibold"
    >
      <Icon name="arrowLeft" className="w-5 h-5 mr-2" /> Back to Academy
    </button>
    <div className="bg-light-surface p-8 rounded-2xl shadow-md border border-light-gray max-w-4xl mx-auto animate-fade-in-right">
      <div className="flex gap-3 mb-4">
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-semibold uppercase">
          {article.type}
        </span>
        <span className="text-xs bg-light-hover text-mid-text px-2 py-1 rounded font-semibold">
          {article.category}
        </span>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-dark-text">
        {article.title}
      </h1>
      {article.videoUrl && (
        <div className="aspect-w-16 aspect-h-9 mb-8 rounded-xl overflow-hidden bg-black shadow-lg">
          <iframe
            src={article.videoUrl}
            title={article.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      )}
      <div className="prose prose-lg text-dark-text max-w-none">
        {/* Use DangerouslySetInnerHTML for content to allow formatting tags from mock data */}
        <div dangerouslySetInnerHTML={{ __html: article.content }} />

        <div className="bg-light-hover p-4 rounded-lg border border-light-gray mt-8">
          <p className="text-sm text-mid-text italic">
            <Icon name="info" className="w-4 h-4 inline mr-2" />
            This content is for educational purposes only and does not
            constitute financial advice.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const ApplyMentorPage: React.FC = () => (
  <div className="p-8 bg-light-bg min-h-full flex items-center justify-center">
    <div className="bg-light-surface p-8 rounded-lg shadow-lg border border-light-gray max-w-2xl w-full text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon name="mentors" className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-3xl font-bold mb-4 text-dark-text">
        Become a Mentor
      </h2>
      <p className="text-mid-text mb-8 text-lg">
        Share your expertise, signal your trades, and earn monthly income from
        subscribers.
      </p>
      <div className="grid md:grid-cols-3 gap-4 mb-8 text-left">
        <div className="p-4 bg-light-hover rounded-lg">
          <h4 className="font-bold text-dark-text mb-2">1. Apply</h4>
          <p className="text-sm text-mid-text">
            Submit your trading history and proof of identity.
          </p>
        </div>
        <div className="p-4 bg-light-hover rounded-lg">
          <h4 className="font-bold text-dark-text mb-2">2. Verify</h4>
          <p className="text-sm text-mid-text">
            We vet your performance to ensure quality.
          </p>
        </div>
        <div className="p-4 bg-light-hover rounded-lg">
          <h4 className="font-bold text-dark-text mb-2">3. Earn</h4>
          <p className="text-sm text-mid-text">
            Publish content and get paid for every subscriber.
          </p>
        </div>
      </div>
      <button className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
        Start Application
      </button>
    </div>
  </div>
);

const ContactUsPage: React.FC<{
  showToast: (msg: string, type: "success" | "info" | "error") => void;
}> = ({ showToast }) => (
  <div className="p-8 bg-light-bg min-h-full flex items-center justify-center">
    <div className="bg-light-surface p-8 rounded-lg shadow-md border border-light-gray max-w-lg w-full">
      <h2 className="text-2xl font-bold mb-6 text-dark-text">
        Contact Support
      </h2>
      <p className="text-mid-text mb-6">
        Have a question or need assistance? We're here to help.
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-text mb-1">
            Subject
          </label>
          <select className="w-full bg-light-hover border-light-gray rounded-md p-2 text-dark-text">
            <option>General Inquiry</option>
            <option>Technical Support</option>
            <option>Billing Issue</option>
            <option>Report a Bug</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-text mb-1">
            Message
          </label>
          <textarea
            rows={5}
            className="w-full bg-light-hover border-light-gray rounded-md p-2 text-dark-text"
            placeholder="Describe your issue..."
          ></textarea>
        </div>
        <button
          onClick={() =>
            showToast(
              "Message sent! We will get back to you shortly.",
              "success"
            )
          }
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg"
        >
          Send Message
        </button>
        <div className="text-center mt-4">
          <p className="text-sm text-mid-text">
            Or email us directly at{" "}
            <a
              href="mailto:support@tradecompanion.app"
              className="text-primary hover:underline"
            >
              support@tradecompanion.app
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
);

// --- MAIN DASHBOARD COMPONENT ---

const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  setUser,
  onLogout,
  updateUser,
  showToast,
  theme,
  toggleTheme,
  activeTrades,
  setActiveTrades,
  loading,
}) => {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedEducationArticle, setSelectedEducationArticle] =
    useState<EducationArticle | null>(null);

  // Tracks if the user is currently viewing the app in Mentor mode (if eligible)
  // const [isMentorMode, setIsMentorMode] = useState(false);

  const TRADE_HISTORY_KEY = `trade_history_${user.email}`;

  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>(() =>
    JSON.parse(localStorage.getItem(TRADE_HISTORY_KEY) || "[]")
  );


  // NEW: State for Floating P/L

  const { canUseFeature, incrementUsage } = useUsageTracker(user);

  // useEffect(() => {
  //   if (!user.isMentor) {
  //     setIsMentorMode(false);
  //   }
  // }, [user.isMentor]);

  // --- REFS FOR INTERVAL ACCESS ---
  // Create refs to hold the latest state values
  const activeTradesRef = useRef(activeTrades);
  const tradeHistoryRef = useRef(tradeHistory);

  // Sync refs with state
  useEffect(() => {
    activeTradesRef.current = activeTrades;
  }, [activeTrades]);

  useEffect(() => {
    tradeHistoryRef.current = tradeHistory;
  }, [tradeHistory]);

  // --- Automatic Signal Scanner ---
  useEffect(() => {
    const scannerInterval = setInterval(async () => {
      // Access the latest state via refs inside the interval callback
      // This prevents the interval from being reset when activeTrades changes
      const currentActiveTrades = activeTradesRef.current;
      const currentTradeHistory = tradeHistoryRef.current;

      // Allow scanner to run continuously in background regardless of active view
      // if (activeView !== 'dashboard' && activeView !== 'ai_signals') return; // Removed to enable background scanning

      // SYSTEM LIMIT: Max 12 trades generated per day globally (simulated per client)
      const todayStr = new Date().toDateString();
      const tradesToday = [
        ...currentActiveTrades,
        ...currentTradeHistory,
      ].filter((t) => new Date(t.dateTaken).toDateString() === todayStr).length;

      if (tradesToday >= 12) {
        console.log("Daily system signal limit (12) reached. Skipping scan.");
        return;
      }

      if (
        !user.subscribedPlan ||
        user.subscribedPlan === PlanName.Free ||
        !canUseFeature("aiSignal")
      ) {
        return;
      }

      try {
        const settings = JSON.parse(
          localStorage.getItem(`tradeSettings_${user.email}`) ||
            '{"balance": "10000", "risk": "1.0", "currency": "USD"}'
        );
        // Scan for signals using the updated service which now handles live market context internally
        // for Majors, Minors, Metals, Crypto
        const signalData = await scanForSignals(user.subscribedPlan, settings);

        if (signalData && signalData.signalFound) {
          const currentEquity = parseFloat(
            localStorage.getItem(EQUITY_KEY) || settings.balance
          );

          const newTrade: TradeRecord = {
            id: new Date().toISOString(),
            status: "active",
            dateTaken: new Date().toISOString(),
            initialEquity: currentEquity,
            takeProfit: signalData.takeProfit1,
            takeProfit1: signalData.takeProfit1, // Explicitly add this to satisfy Signal interface
            timestamp: new Date().toISOString(), // Explicitly add this
            ...signalData,
          };

          // UPDATED LOGIC: Prevent any new signal if an active trade exists for that instrument
          // Check against the ref's current value
          const alreadyExists = currentActiveTrades.some(
            (t) => t.instrument === newTrade.instrument
          );

          if (!alreadyExists) {
            incrementUsage("aiSignal");
            setActiveTrades((prev) => [newTrade, ...prev]);

            const newNotification: Notification = {
              id: new Date().toISOString(),
              message: `New Signal Found: ${newTrade.instrument} ${newTrade.type}`,
              timestamp: new Date().toISOString(),
              isRead: false,
              linkTo: "ai_signals",
              type: "signal",
            };
            addNotification(newNotification);

            if (
              user.cTraderConfig?.isConnected &&
              user.cTraderConfig?.autoTradeEnabled
            ) {
              // CHECK IF INSTRUMENT IS SELECTED FOR AUTO-TRADING
              const allowedInstruments = JSON.parse(
                localStorage.getItem(`ctrader_instruments_${user.email}`) ||
                  "[]"
              );

              // Only execute if the list is populated and includes the instrument.
              // If list is empty, default behavior: execute nothing (safety first)
              if (
                allowedInstruments.length > 0 &&
                allowedInstruments.includes(newTrade.instrument)
              ) {
                showToast(
                  `Signal for ${newTrade.instrument} sent to cTrader for execution.`,
                  "success"
                );
              } else {
                console.log(
                  `Auto-trade skipped for ${newTrade.instrument}: Not in allowed list.`
                );
              }
            }

            // --- TELEGRAM NOTIFICATION ---
            const isPremiumTier =
              user.subscribedPlan === PlanName.Pro ||
              user.subscribedPlan === PlanName.Premium;
            if (isPremiumTier && user.telegramNumber) {
              showToast(
                `Signal for ${newTrade.instrument} also sent to Telegram: ${user.telegramNumber}.`,
                "info"
              );
            }
          }
        }
      } catch (error) {
        console.error("Error during signal scan:", error);
      }
    }, 900000); // Scan every 15 minutes (900,000ms)

    return () => clearInterval(scannerInterval);
    // Removed activeTrades and tradeHistory from dependency array to prevent timer reset
  }, [
    user,
    canUseFeature,
    incrementUsage,
    showToast,
    EQUITY_KEY,
    setActiveTrades,
  ]);

  useEffect(() => {
    localStorage.setItem(TRADE_HISTORY_KEY, JSON.stringify(tradeHistory));
  }, [tradeHistory, TRADE_HISTORY_KEY]);

  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);
  

  return (
    <div className="flex h-screen bg-light-bg text-dark-text">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        
      </div>
    </div>
  );
};

export default DashboardPage;
