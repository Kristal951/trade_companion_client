import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import useAppStore from "@/store/useStore";
import Icon from "@/components/ui/Icon";
import FlwSubscriptionButton from "@/components/ui/FlwSubscriptionBtn";
import Spinner from "@/components/ui/Spinner";

const Subscribe = ({ showToast }) => {
  const { planName } = useParams()
  console.log(planName)
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "unknown email";
  const name = location.state?.name || "unknown user";
  const { startUserSubscriptionwithStripe, loading } = useAppStore();

  const planIdMap = {
    basic_monthly: import.meta.env.VITE_BASIC_MONTHLY_MONGODB_PLAN_ID,
    pro_monthly: import.meta.env.VITE_PRO_MONTHLY_MONGODB_PLAN_ID,
    premium_monthly: import.meta.env.VITE_PREMIUM_MONTHLY_MONGODB_PLAN_ID,
    basic_yearly: import.meta.env.VITE_BASIC_YEARLY_MONGODB_PLAN_ID,
    pro_yearly: import.meta.env.VITE_PRO_YEARLY_MONGODB_PLAN_ID,
    premium_yearly: import.meta.env.VITE_PREMIUM_YEARLY_MONGODB_PLAN_ID,
  };

  const planId = planIdMap[planName];
  const getPlanById = useAppStore((state) => state.getPlanById);
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  console.log(planId)

  useEffect(() => {
    if (!planName || !planId) {
      navigate("/pricing");
      return;
    }

    const fetchPlan = async () => {
      setLoadingPlan(true);
      try {
        const res = await getPlanById(planId);
        setPlan(res);
        console.log(res);
      } catch (error) {
        navigate("/pricing");
        showToast("could not load plan", "error");
      } finally {
        setLoadingPlan(false);
      }
    };

    fetchPlan();
  }, [planName, planId, getPlanById, navigate]);

  const startSubscription = async () => {
    const stripePlanKey = planName.replaceAll("_", "-");
    try {
      const res = await startUserSubscriptionwithStripe(stripePlanKey);
      window.location.href = res;
    } catch (err) {
      showToast("could not initialise payment, try again", "error");
      console.log(err);
    }
  };

  if (loadingPlan) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner w={10} h={10} color="neon-blue" />
          <p className="text-slate-400 font-medium animate-pulse">
            Loading your plan...
          </p>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const isYearly = planName.includes("yearly");
  const planDisplayName = planName.split("_")[0];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans selection:bg-neon-blue/30 overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-blue/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-16">
          <div className="w-12 h-12 bg-gradient-to-br from-neon-blue to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-neon-blue/20">
            <Icon name="signals" className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter text-white uppercase italic block leading-none">
              Trade Companion
            </span>
            <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
              Intelligence Suite
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Context */}
          <div className="space-y-10">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">
                Unlock{" "}
                <span className="text-transparent bg-clip-text capitalize bg-gradient-to-r from-neon-blue to-indigo-400">
                  {`${planDisplayName} features`}
                </span>
              </h1>
              <p className="text-slate-400 text-xl leading-relaxed max-w-lg">
                Hey {name.split(" ")[0]}, you're one step away from joining our
                elite trading community with the{" "}
                <span className="text-white font-bold capitalize">
                  {planDisplayName}
                </span>{" "}
                access.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate flex items-center gap-2">
                <span className="w-8 h-[1px] bg-slate-800"></span>
                Membership Privileges
              </h3>
              <div className="flex flex-col gap-4">
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-3 group">
                    <div className="bg-neon-blue/10 p-1.5 rounded-lg group-hover:bg-neon-blue/20 transition-colors">
                      <Icon
                        name="check"
                        className="w-3.5 h-3.5 text-slate-600"
                      />
                    </div>
                    <span className="text-sm text-slate-300 font-medium">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-neon-blue/5 blur-2xl rounded-3xl" />

            <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 md:p-8 shadow-3xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-white">Review Summary</h2>
              </div>

              <div className="bg-gradient-to-b from-white/[0.07] to-transparent border border-white/10 p-4 rounded-2xl mb-8 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icon name="signals" className="w-12 h-12" />
                </div>

                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
                      <h4 className="font-black text-white uppercase tracking-tight text-lg">
                        {planDisplayName} Plan
                      </h4>
                    </div>
                    <p className="text-sm text-slate-400 font-medium italic">
                      Billed {isYearly ? "Annually" : "Monthly"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-white leading-none">
                      ${plan.amount}
                    </span>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                      Total USD
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4 mb-10 px-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">
                    Access Period
                  </span>
                  <span className="text-white font-bold">
                    {isYearly ? "12 Months" : "30 Days"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Setup Fee</span>
                  <span className="text-emerald-400 font-bold tracking-wide uppercase text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">
                    Waived
                  </span>
                </div>
                <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest">
                      Amount Due
                    </p>
                    <p className="text-4xl font-black text-white mt-1">
                      ${plan.amount}
                    </p>
                  </div>
                  <div className="pb-1">
                    <Icon name="lock" className="w-5 h-5 text-neon-blue" />
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="space-y-4">
                {/* Stripe Button Revamped */}
                <button
                  onClick={startSubscription}
                  className="group relative w-full overflow-hidden bg-white text-black font-black py-4 rounded-2xl transition-all active:scale-[0.98] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                >
                  {loading ? (
                    <div className="w-full flex items-center justify-center">
                      <Spinner w={5} h={5} color="neon-blue" />
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative z-10 flex items-center justify-center gap-2 group-hover:text-white transition-colors">
                        Pay with Stripe
                        <Icon
                          name="arrowRight"
                          className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                        />
                      </span>
                    </>
                  )}
                </button>

                <div className="my-8 flex items-center justify-between">
                  <span className="h-px bg-light-gray flex-1"></span>
                  <span className="text-xs text-mid-text px-2 uppercase">
                    or
                  </span>
                  <span className="h-px bg-light-gray flex-1"></span>
                </div>

                <FlwSubscriptionButton
                  name={name}
                  email={email}
                  planKey={planName}
                  amount={plan.amount}
                  planID={planId}
                />

                <button
                  onClick={() => navigate(-1)}
                  className="w-full py-2 text-slate-500 hover:text-white font-bold transition-colors text-[11px] uppercase tracking-[0.2em]"
                >
                  ← Go back to plans
                </button>
              </div>

              {/* Security Footer */}
              <div className="mt-8 flex flex-col items-center gap-4">
                <p className="text-[9px] text-slate-500 text-center leading-relaxed px-10 font-medium">
                  Your payment information is encrypted and processed securely.
                  We never store your credit card details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
