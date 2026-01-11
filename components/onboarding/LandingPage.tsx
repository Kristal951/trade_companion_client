import React, { useState, useEffect } from "react";
import { Plan, PlanName, Mentor, Review, FAQ } from "../../types";
import Icon from "../ui/Icon";
import { PLAN_FEATURES } from "../../config/plans";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "./Header";
import { fetchTopPerformer, getLivePrices } from "@/services/marketDataService";
import { INITIAL_TICKER, ROBOT_SOLILOQUY, TICKER_SYMBOLS } from "./utils";
import Footer from "./Footer";
import EducationCard from "./EducationCard";
import useAppStore from "@/store/useStore";

const MOCK_MENTORS: Mentor[] = [
  {
    id: 1,
    name: "John Forex",
    avatar: "https://picsum.photos/seed/mentor1/200",
    experience: 10,
    profitRatio: 85,
    instruments: ["EUR/USD", "GBP/JPY"],
    price: 99,
    roi: 25.5,
    strategy: "Specializing in scalping strategies and market psychology.",
  },
  {
    id: 2,
    name: "Anna Indicators",
    avatar: "https://picsum.photos/seed/mentor2/200",
    experience: 8,
    profitRatio: 92,
    instruments: ["XAU/USD", "US30"],
    price: 149,
    roi: 31.2,
    strategy: "Master of technical analysis and custom indicator development.",
  },
  {
    id: 3,
    name: "Mike Waves",
    avatar: "https://picsum.photos/seed/mentor3/200",
    experience: 12,
    profitRatio: 88,
    instruments: ["BTC/USD", "ETH/USD"],
    price: 129,
    roi: 28.0,
    strategy: "Expert in Elliot Wave theory and cryptocurrency markets.",
  },
];

const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    name: "Sarah L.",
    avatar: "https://picsum.photos/seed/user1/100",
    text: "The AI signals are incredibly accurate. My portfolio has seen a 20% growth in just three months!",
  },
  {
    id: 2,
    name: "David M.",
    avatar: "https://picsum.photos/seed/user2/100",
    text: "Subscribing to Anna's mentorship was a game-changer. Her insights are worth every penny.",
  },
  {
    id: 3,
    name: "Emily C.",
    avatar: "https://picsum.photos/seed/user3/100",
    text: "A fantastic platform for both new and experienced traders. The tools and community are top-notch.",
  },
];

const PlanCardSkeleton = () => {
  return (
    <div className="relative p-6 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse">
      <div className="h-6 w-24 bg-slate-700 rounded mb-4" />

      <div className="h-10 w-32 bg-slate-700 rounded mb-6" />

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 w-full bg-slate-700 rounded" />
        ))}
      </div>

      <div className="h-10 w-full bg-slate-700 rounded mt-6" />
    </div>
  );
};

const Faqs = [
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes, you can cancel your subscription at any time from your billing settings. You will retain access to your plan's features until the end of the current billing cycle.",
  },
  {
    q: "Is my financial data secure?",
    a: "Absolutely. We use industry-standard encryption and security protocols to protect all your data. We never store sensitive payment information on our servers.",
  },
  {
    q: "Is Trade Companion beginner friendly?",
    a: "Yes. Trade Companion provides easy-to-follow BUY/SELL signals with entry price, stop loss, and take profit levels. Additionally, you can choose from professional mentors who match your trading style and goals.",
  },
  {
    q: "Why is Trade Companion different?",
    a: "Trade Companion simplifies trading by handling the analysis for you. You still place trades yourself, but the platform guides you with signals, risk-adjusted lot sizes, and mentorship support to help you succeed.",
  },
  {
    q: "What more does Trade Companion offer?",
    a: "In addition to signals, Trade Companion provides access to professional forex mentors, risk management recommendations, performance tracking, and learning resources to improve your trading skills.",
  },
  {
    q: "How often will I receive signals?",
    a: "Signal frequency depends on market conditions and your chosen mentor. On average, users receive multiple signals per week, but quality is always prioritized over quantity.",
  },
  {
    q: "Can I use Trade Companion on mobile?",
    a: "Yes. Trade Companion works seamlessly across devices, including mobile, so you can access signals and updates on the go.",
  },
  {
    q: "Does Trade Companion guarantee profits?",
    a: "No trading platform can guarantee profits. Trade Companion increases your chances of success by providing reliable signals, risk-adjusted recommendations, and mentorship—but trading always carries risk.",
  },
  {
    q: "Can I choose my own mentor?",
    a: "Absolutely. Trade Companion allows you to browse and select mentors based on their trading style, ratings, preferred pairs, and pricing.",
  },
  {
    q: "Is my data safe with Trade Companion?",
    a: "Yes. We prioritize your privacy and use industry-standard encryption to ensure your personal data and trading information remain secure.",
  },
];

interface LandingPageProps {
  onLoginRequest: (userDetails: { name: string; email: string }) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginRequest }) => {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mentorSearchQuery, setMentorSearchQuery] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [topSignal, setTopSignal] = useState(null);
  const [soliloquyIndex, setSoliloquyIndex] = useState(0);
  const [tickerItems, setTickerItems] = useState<any[]>(INITIAL_TICKER);
  const getPlans = useAppStore((state) => state.getPlans);
  const loading = useAppStore((state) => state.loading);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansData = await getPlans();
        setPlans(plansData);
      } catch (error) {
        console.error(error);
      }
    };
    fetchPlans();
  }, [getPlans]);

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const prices = await getLivePrices(TICKER_SYMBOLS);

        const newItems = TICKER_SYMBOLS.map((symbol) => {
          const data = prices[symbol];
          const price = data?.price;

          let displayPrice = "---";
          if (price !== null && price !== undefined) {
            if (
              symbol.includes("JPY") ||
              symbol === "XAU/USD" ||
              symbol.includes("US500")
            ) {
              displayPrice = price.toFixed(2);
            } else if (symbol.includes("BTC") || symbol.includes("ETH")) {
              displayPrice = price.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              });
            } else {
              displayPrice = price.toFixed(5);
            }
          }

          // Simulate daily change % deterministically based on symbol name since API doesn't provide it
          const hash = symbol
            .split("")
            .reduce((a, b) => a + b.charCodeAt(0), 0);
          const isPositive = hash % 2 === 0;
          const changeVal = ((hash % 150) / 100).toFixed(2);

          return {
            pair: symbol,
            price: displayPrice,
            change: `${isPositive ? "+" : "-"}${changeVal}%`,
            isPositive,
          };
        });
        setTickerItems(newItems);
      } catch (error) {
        console.error("Failed to update ticker", error);
      }
    };

    fetchTicker(); // Initial fetch
    // Update every 24 hours (86400000ms) to save API calls
    const interval = setInterval(fetchTicker, 86400000);
    return () => clearInterval(interval);
  }, []);

  const normalizedPlans = React.useMemo(() => {
    if (!plans) return [];

    const grouped = {};

    plans.forEach((plan) => {
      const isFree = plan.name.toLowerCase() === "free";

      const baseName = isFree
        ? "Free"
        : plan.name.replace(" Monthly", "").replace(" Yearly", "");

      if (!grouped[baseName]) {
        grouped[baseName] = {
          name: baseName,
          type: isFree ? "free" : "paid",
          monthly: null,
          yearly: null,
          free: null,
          features: plan.features,
        };
      }

      if (isFree) {
        grouped[baseName].free = plan;
      } else {
        if (plan.interval === "monthly") grouped[baseName].monthly = plan;
        if (plan.interval === "yearly") grouped[baseName].yearly = plan;
      }
    });

    return Object.values(grouped);
  }, [plans]);

  useEffect(() => {
    const loadTopSignal = async () => {
      try {
        const signal = await fetchTopPerformer();
        setTopSignal(signal);
      } catch (e) {
        console.error("Failed to fetch top signal", e);
      }
    };
    loadTopSignal();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSoliloquyIndex((prev) => (prev + 1) % ROBOT_SOLILOQUY.length);
    }, 4000); // Change message every 4 seconds
    return () => clearInterval(interval);
  }, []);

  // Auth Modal State

  const cardVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  const containerVariant = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.25,
      },
    },
  };

  const blockVariantLeft = {
    hidden: { opacity: 0, x: -90 },
    visible: { opacity: 1, x: 0 },
  };
  const blockVariantRight = {
    hidden: { opacity: 0, x: 90 },
    visible: { opacity: 1, x: 0 },
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const filteredMentors = MOCK_MENTORS.filter(
    (mentor) =>
      mentor.name.toLowerCase().includes(mentorSearchQuery.toLowerCase()) ||
      mentor.instruments.some((instrument) =>
        instrument.toLowerCase().includes(mentorSearchQuery.toLowerCase())
      )
  );

  return (
    <div className="bg-light-bg min-h-screen text-dark-text overflow-y-scroll">
      {/* Header */}
      <Header />

      <main>
        <div className="absolute top-0 left-0 w-full h-[100vh] overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-blue/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-neon-green/5 rounded-full blur-[100px]"></div>
        </div>
        {/* Hero Section */}
        <section className="relative z-10 pt-40 pb-20 container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left: Text Content */}
            <div className="lg:w-1/2 text-center lg:text-left space-y-8">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-neon-green text-xs font-bold uppercase tracking-wide mb-2">
                <span className="w-2 h-2 rounded-full bg-neon-green mr-2 animate-pulse"></span>
                AI-Powered Trading Live
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight text-white">
                Master the Markets with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-green">
                  Intelligence
                </span>
              </h1>
              <p className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Stop guessing. Start trading with high-precision AI signals and
                copy top-tier mentors. Institutional-grade tools, now for
                everyone.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link
                  to="/auth/signUp"
                  className="w-full sm:w-auto px-8 py-4 bg-neon-blue hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1"
                >
                  Start Free Trial
                </Link>
              </div>

              {/* Previous AI Top Pick Card (Replacing user icons) */}
              {topSignal && (
                <div className="pt-6 animate-fade-in-right">
                  <div className="inline-block relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-neon-green to-neon-blue rounded-xl blur opacity-25"></div>
                    <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-6 shadow-xl">
                      <div className="flex flex-col items-center justify-center bg-slate-800 rounded-lg p-2 w-14 h-14">
                        <span className="text-2xl">🏆</span>
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                          Previous AI top pic
                        </p>
                        <div className="flex items-baseline gap-3">
                          <h4 className="text-xl font-bold text-white">
                            {topSignal.instrument}
                          </h4>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              topSignal.type === "BUY"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {topSignal.type}
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-1">
                          <span className="text-neon-green font-bold text-lg">
                            +{topSignal.pips} Pips
                          </span>
                          <span className="text-slate-500 ml-1">Gain</span>
                        </p>
                      </div>
                      <div className="hidden sm:block border-l border-slate-800 pl-6">
                        <p className="text-xs text-slate-500">
                          Entry:{" "}
                          <span className="text-slate-300">
                            {topSignal.entryPrice}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Exit:{" "}
                          <span className="text-slate-300">
                            {topSignal.exitPrice}
                          </span>
                        </p>
                        <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                          <Icon name="clock" className="w-3 h-3" />
                          {new Date(topSignal.timestamp).toLocaleDateString(
                            [],
                            { month: "short", day: "numeric" }
                          )}{" "}
                          •{" "}
                          {new Date(topSignal.timestamp).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Cartoon Animation */}
            <div className="lg:w-1/2 relative w-full flex justify-center">
              <div className="relative w-full max-w-lg h-[450px] flex items-center justify-center perspective-1000">
                {/* Abstract glow behind */}
                <div className="absolute inset-0 bg-neon-blue/20 blur-[100px] rounded-full"></div>

                {/* REMOVED FLOATING COINS AND ICONS HERE */}

                {/* THE 3D ROBOT CONTAINER (REPLACED OLD BOT) */}
                <div
                  className="relative z-10 animate-float"
                  style={{ animationDuration: "6s" }}
                >
                  {/* Soliloquy Speech Bubble */}
                  <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 bg-white p-4 rounded-2xl rounded-bl-none shadow-[0_0_20px_rgba(59,130,246,0.3)] z-50 animate-float transition-all duration-500">
                    <p
                      key={soliloquyIndex}
                      className="text-slate-800 text-sm font-semibold leading-relaxed relative z-10 animate-fade-in-right"
                    >
                      "{ROBOT_SOLILOQUY[soliloquyIndex]}"
                    </p>
                    {/* Bubble Tail */}
                    <div className="absolute -bottom-3 left-0 w-0 h-0 border-l-[15px] border-l-white border-b-[15px] border-b-transparent"></div>
                    {/* Decorative Elements */}
                    <div className="absolute top-2 right-2 w-2 h-2 bg-neon-blue rounded-full animate-ping"></div>
                  </div>

                  {/* 3D Head */}
                  <div className="w-40 h-40 rounded-[2.5rem] bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 shadow-[inset_5px_5px_15px_rgba(255,255,255,0.8),inset_-5px_-5px_15px_rgba(0,0,0,0.3),0_20px_40px_rgba(0,0,0,0.4)] relative mx-auto z-20 flex items-center justify-center">
                    {/* Gloss Highlight */}
                    <div className="absolute top-4 left-6 w-10 h-6 bg-white/60 rounded-full blur-[2px] transform -rotate-45"></div>

                    {/* Antenna */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-3 h-10 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full -z-10 shadow-lg"></div>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full shadow-[0_0_20px] bg-green-400 shadow-green-400 transition-colors duration-500"></div>

                    {/* Face Screen (Inset) */}
                    <div className="w-32 h-24 bg-[#0a0a0a] rounded-[1.2rem] shadow-[inset_0_0_15px_rgba(0,0,0,1),0_1px_2px_rgba(255,255,255,0.1)] flex items-center justify-center gap-4 relative overflow-hidden border border-slate-800">
                      {/* Screen Glare */}
                      <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-white/5 to-transparent transform rotate-45 pointer-events-none"></div>

                      {/* Idle Eyes */}
                      <div className="w-7 h-9 bg-blue-400 rounded-full shadow-[0_0_15px_#60a5fa] animate-pulse relative">
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <div className="w-7 h-9 bg-blue-400 rounded-full shadow-[0_0_15px_#60a5fa] animate-pulse relative">
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* 3D Body */}
                  <div className="w-32 h-28 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 rounded-[2rem] mx-auto -mt-6 pt-8 relative z-10 shadow-[inset_5px_5px_15px_rgba(255,255,255,0.8),inset_-5px_-5px_15px_rgba(0,0,0,0.3),0_20px_40px_rgba(0,0,0,0.4)]">
                    {/* Chest Light */}
                    <div className="w-12 h-12 bg-[#0a0a0a] rounded-full mx-auto flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,1)] border border-slate-700">
                      <div className="w-6 h-6 rounded-full shadow-[0_0_15px] bg-blue-400 shadow-blue-400"></div>
                    </div>
                  </div>

                  {/* 3D Arms (Floaters) */}
                  {/* Left Arm */}
                  <div className="absolute w-12 h-24 bg-gradient-to-br from-slate-200 to-slate-400 rounded-full shadow-xl transition-all duration-500 ease-in-out z-30 top-28 -left-8 rotate-12"></div>

                  {/* Right Arm */}
                  <div className="absolute w-12 h-24 bg-gradient-to-br from-slate-200 to-slate-400 rounded-full shadow-xl origin-top-left transition-all duration-500 ease-in-out z-30 top-28 -right-8 rotate-[-12deg]"></div>

                  {/* Shadow Disc */}
                  <div className="w-32 h-4 bg-black/40 rounded-[100%] blur-md mx-auto mt-8 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-slate-900 border-y border-slate-800 overflow-hidden py-3">
          <div className="flex animate-scroll hover:pause w-[200%]">
            {[...tickerItems, ...tickerItems, ...tickerItems].map(
              (item, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 mx-8 min-w-max"
                >
                  <span className="text-slate-300 font-bold">{item.pair}</span>
                  <span className="text-white font-mono">{item.price}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      item.isPositive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {item.change}
                  </span>
                </div>
              )
            )}
          </div>
        </section>

        <section id="features" className="py-24 container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              The Complete Ecosystem
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Everything you need to analyze, execute, and learn in one unified
              dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1: Large Square */}
            <div className="md:col-span-2 md:row-span-2 bg-fintech-card border border-fintech-border rounded-3xl p-8 relative overflow-hidden group hover:border-neon-blue/50 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon name="signals" className="w-64 h-64 text-neon-blue" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-neon-blue/20 rounded-xl flex items-center justify-center mb-6 text-neon-blue">
                  <Icon name="robot" className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  AI-Driven Signal Engine
                </h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Our proprietary algorithm scans 20+ markets 24/7. It
                  identifies structure breaks, liquidity grabs, and trend
                  continuations, delivering actionable setups with Entry, SL,
                  and TP directly to your dashboard.
                </p>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-center">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-neon-green mr-2"
                    />{" "}
                    85%+ Historical Accuracy
                  </li>
                  <li className="flex items-center">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-neon-green mr-2"
                    />{" "}
                    Multi-Timeframe Analysis
                  </li>
                  <li className="flex items-center">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-neon-green mr-2"
                    />{" "}
                    Instant Notifications
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 2: Tall Rectangle */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-fintech-border rounded-3xl p-8 flex flex-col justify-between hover:border-neon-green/50 transition-all duration-500">
              <div>
                <div className="w-12 h-12 bg-neon-green/20 rounded-xl flex items-center justify-center mb-6 text-neon-green">
                  <Icon name="mentors" className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Expert Mentorship
                </h3>
                <p className="text-slate-400 text-sm">
                  Don't trade alone. Subscribe to vetted mentors, view their
                  track records, and copy their live trades.
                </p>
              </div>
              <div className="mt-6 flex -space-x-3">
                {MOCK_MENTORS.map((m) => (
                  <img
                    key={m.id}
                    src={m.avatar}
                    className="w-10 h-10 rounded-full border-2 border-fintech-card"
                    alt={m.name}
                  />
                ))}
              </div>
            </div>

            {/* Feature 3: Wide Rectangle */}
            <div className="bg-fintech-card border border-fintech-border rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-500">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 text-purple-400">
                <Icon name="education" className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Education Hub
              </h3>
              <p className="text-slate-400 text-sm">
                From beginner basics to advanced institutional concepts. Video
                courses, articles, and quizzes included.
              </p>
            </div>
          </div>
        </section>

        {/* Education Section */}
        <section id="education" className="py-20 bg-light-hover">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: false }}
              className="text-center mb-16"
            >
              <h3 className="text-3xl md:text-4xl font-bold text-dark-text">
                Knowledge is Power
              </h3>
              <p className="text-mid-text mt-4">
                Our education hub is designed to help you grow, no matter your
                experience level.
              </p>
            </motion.div>

            {/* Column Grid + Animations */}
            <motion.div
              variants={containerVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false }}
              className="grid md:grid-cols-3 gap-8"
            >
              <EducationCard
                cardVariant={cardVariant}
                iconName="education"
                title="Forex 101"
                subText="Master the basics, from pips and lots to market structure."
              />

              <EducationCard
                cardVariant={cardVariant}
                iconName="analytics"
                title=" Technical Analysis"
                subText="Learn to read charts, identify patterns, and use indicators."
              />

              <EducationCard
                cardVariant={cardVariant}
                iconName="billing"
                title=" Risk Management"
                subText=" Discover strategies to protect your capital and trade
                  sustainably."
              />
            </motion.div>
          </div>
        </section>

        {/* Top Mentors Section */}
        <section id="mentors" className="py-20 bg-light-bg">
          <div className="container mx-auto px-6">
            <h3 className="text-4xl font-bold text-center mb-4 text-dark-text">
              Meet Our Top Mentors
            </h3>
            <div className="max-w-xl mx-auto mb-12">
              <input
                type="text"
                placeholder="Search by name or instrument (e.g., John, EUR/USD)..."
                value={mentorSearchQuery}
                onChange={(e) => setMentorSearchQuery(e.target.value)}
                className="w-full px-5 py-3 bg-light-surface border border-light-gray rounded-full focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-dark-text shadow-sm"
              />
            </div>
            {filteredMentors.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-8">
                {filteredMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="bg-light-surface rounded-lg overflow-hidden text-center p-6 transform hover:-translate-y-2 transition-transform duration-300 shadow-md border border-light-gray"
                  >
                    <img
                      src={mentor.avatar}
                      alt={mentor.name}
                      className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-primary"
                    />
                    <h4 className="text-xl font-bold text-dark-text">
                      {mentor.name}
                    </h4>
                    <p className="text-primary mb-2">
                      {mentor.experience} Years Experience
                    </p>
                    <div className="flex justify-around text-sm my-4">
                      <span>
                        <strong className="text-success">
                          {mentor.profitRatio}%
                        </strong>{" "}
                        Profit Ratio
                      </span>
                      <span>
                        <strong className="text-primary">
                          ${mentor.price}
                        </strong>
                        /month
                      </span>
                    </div>
                    <p className="text-mid-text text-sm mb-4">
                      Trades: {mentor.instruments.join(", ")}
                    </p>
                    <Link
                      to="/auth/signUp"
                      className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-mid-text mt-8">
                No mentors found matching your search.
              </p>
            )}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-light-hover">
          <div className="container mx-auto px-6 text-center">
            <h3 className="text-4xl font-bold mb-4 text-dark-text">
              Flexible Plans for Everyone
            </h3>
            <p className="text-mid-text mb-8">
              Choose the plan that's right for your trading journey.
            </p>

            <div className="flex w-full justify-center mb-10">
              <div className="flex items-center justify-between w-[300px] bg-slate-800/20 rounded-full p-1 relative text-sm font-semibold text-white shadow-inner">
                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className={`w-1/2 text-center py-2 rounded-full transition-colors duration-300 ${
                    !isYearly ? "bg-primary text-white" : "text-white/70"
                  }`}
                >
                  Monthly
                </button>

                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className={`w-1/2 text-center py-2 rounded-full transition-colors duration-300 ${
                    isYearly ? "bg-primary text-white" : "text-white/70"
                  }`}
                >
                  Yearly{" "}
                  <span className="ml-2 text-xs bg-success text-white px-2 py-0.5 rounded-full font-bold">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mt-8">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <PlanCardSkeleton key={i} />
                  ))
                : normalizedPlans.map((plan) => {
                    let activePlan;

                    if (plan.type === "free") {
                      activePlan = plan.free;
                    } else {
                      activePlan = isYearly ? plan.yearly : plan.monthly;
                    }

                    if (!activePlan) return null;

                    return (
                      <div
                        key={activePlan._id}
                        className={`relative p-8 rounded-2xl border flex flex-col ${
                          plan.name === PlanName.Pro
                            ? "bg-slate-900 border-neon-blue shadow-2xl shadow-neon-blue/10 scale-105 z-10"
                            : "bg-fintech-card border-fintech-border text-slate-300"
                        }`}
                      >
                        {plan.name === PlanName.Pro && (
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-neon-blue text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            Most Popular
                          </div>
                        )}

                        <h3
                          className={`text-xl font-bold mb-4 ${
                            plan.name === PlanName.Pro
                              ? "text-white"
                              : "text-slate-200"
                          }`}
                        >
                          {plan.name}
                        </h3>

                        <div className="mb-6">
                          {plan.type === "free" ? (
                            <p className="text-4xl font-extrabold my-4 text-dark-text">
                              Free
                            </p>
                          ) : (
                            <p className="text-4xl font-extrabold my-4 text-dark-text">
                              ${activePlan.amount}
                              <span className="text-base font-normal text-mid-text">
                                {isYearly ? "/year" : "/month"}
                              </span>
                            </p>
                          )}
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start text-sm">
                              <Icon
                                name="check"
                                className={`w-5 h-5 mr-3 ${
                                  plan.name === PlanName.Pro
                                    ? "text-neon-blue"
                                    : "text-slate-600"
                                }`}
                              />
                              <span className="text-slate-400">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Link
                          to="/auth"
                          state={{
                            selectedPlan: activePlan.name
                              .toLowerCase()
                              .replace(/\s+/g, "_"),
                          }}
                          className={`w-full py-3 rounded-xl font-bold transition-all ${
                            plan.name === PlanName.Pro
                              ? "bg-neon-blue hover:bg-blue-600 text-white shadow-lg"
                              : "bg-slate-800 hover:bg-slate-700 text-white"
                          }`}
                        >
                          Choose {plan.name}
                        </Link>
                      </div>
                    );
                  })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-light-hover">
          <div className="container mx-auto px-6 max-w-3xl">
            <h3 className="text-4xl font-bold text-center mb-12 text-dark-text">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              {Faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-light-surface rounded-lg shadow-md border border-light-gray"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center text-left p-5 font-semibold text-dark-text"
                  >
                    <span>{faq.q}</span>
                    <Icon
                      name="chevronDown"
                      className={`w-6 h-6 transform transition-transform ${
                        openFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-5 text-mid-text">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
