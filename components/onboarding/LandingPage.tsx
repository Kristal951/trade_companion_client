import React, { useState, useEffect } from "react";
import { Plan, Mentor, Review } from "../../types";
import Icon from "../ui/Icon";
import { Link } from "react-router-dom";
import Header from "./Header";
import { fetchTopPerformer, getLivePrices } from "@/services/marketDataService";
import { INITIAL_TICKER, ROBOT_SOLILOQUY, TICKER_SYMBOLS } from "./utils";
import Footer from "./Footer";
import useAppStore from "@/store/useStore";
import Education from "./sections/Education";
import TopMentors from "./sections/TopMentors";
import Faq from "./sections/Faq";
import Pricing from "./sections/Pricing";
import Features from "./sections/Features";

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

    fetchTicker();
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
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const filteredMentors = MOCK_MENTORS.filter(
    (mentor) =>
      mentor.name.toLowerCase().includes(mentorSearchQuery.toLowerCase()) ||
      mentor.instruments.some((instrument) =>
        instrument.toLowerCase().includes(mentorSearchQuery.toLowerCase()),
      ),
  );

  return (
    <div className="bg-[#111827] min-h-screen text-white overflow-y-scroll">
      <Header />

      <main>
        <div className="absolute top-0 left-0 w-full h-[100vh] overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-blue/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-neon-green/5 rounded-full blur-[100px]"></div>
        </div>
        <section className="relative z-10 pt-40 pb-20 container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
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
                            { month: "short", day: "numeric" },
                          )}{" "}
                          •{" "}
                          {new Date(topSignal.timestamp).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" },
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
              ),
            )}
          </div>
        </section>

        <Features />

        <Education />

        <TopMentors
          setMentorSearchQuery={setMentorSearchQuery}
          filteredMentors={filteredMentors}
          mentorSearchQuery={mentorSearchQuery}
        />

        <Pricing
          normalizedPlans={normalizedPlans}
          isYearly={isYearly}
          setIsYearly={setIsYearly}
        />

        <Faq toggleFaq={toggleFaq} openFaq={openFaq} />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
