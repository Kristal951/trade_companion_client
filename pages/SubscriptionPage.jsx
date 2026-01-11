import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import useAppStore from "@/store/useStore";
import Icon from "@/components/ui/Icon";
import FlwSubscriptionButton from "@/components/ui/FlwSubscriptionBtn";

const Subscribe = ({ showToast }) => {
  const { planName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "unknown email";
  const name = location.state?.name || "uknown user";

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
  const loading = useAppStore((state) => state.loading);
  const startUserSubscription = useAppStore(
    (state) => state.startUserSubscription
  );

  const [plan, setPlan] = useState(null);
  const [planPrefix, setPlanPrefix] = useState("");
  const [planSuffix, setPlanSuffix] = useState("");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!planName) return;

    const parts = planName.split("_");
    const prefix = parts[0];
    const suffix = parts[1] || "";

    setPlanPrefix(prefix);
    setPlanSuffix(suffix.slice(0, -2));
  }, [planName]);

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
        setAmount(res.amount);
      } catch (error) {
        navigate("/pricing");
      } finally {
        setLoadingPlan(false);
      }
    };

    fetchPlan();
  }, [planName, planId, getPlanById, navigate]);

  if (loadingPlan) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!plan) return null;

  // const handleSubmit = async () => {
  //   const payload = {
  //     name,
  //     email,
  //     planKey: planName,
  //     planID: planId
  //   };
  //   try {
  //     const res = await startUserSubscription(payload);
  //     console.log(res)

  //   if (res.data.success && res.data.payment_link) {
  //     window.location.href = res.data.payment_link;
  //   } else {
  //     showToast("Failed to initiate payment", "error");
  //   }
  //   } catch (error) {
  //     console.log(error);
  //     showToast("Failed to initiate payment", "error");
  //   }
  // };

  return (
    <div className="min-h-screen flex flex-col bg-light-bg p-8">
      <div className="w-full flex gap-4">
        <div className="w-8 h-8 bg-gradient-to-tr from-neon-blue to-neon-green rounded-lg flex items-center justify-center">
          <Icon name="signals" className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
          Trade Companion
        </span>
      </div>

      <div className="w-full h-full flex-col flex mt-10 items-center">
        <div className="w-full h-max flex flex-col items-center gap-2 justify-center">
          <div className="flex gap-2">
            <span className="text-3xl font-bold tracking-tight text-white hidden sm:block">
              {`Subscribe to Trade Companion `}
            </span>
            <span className="text-3xl font-bold tracking-tight text-white hidden sm:block uppercase">{`${
              planPrefix.charAt(0).toUpperCase() + planPrefix.slice(1)
            }`}</span>
          </div>

          <div className="flex">
            <p className="text-gray-50">{`You chose to subscribe to our ${
              planPrefix.charAt(0).toUpperCase() + planPrefix.slice(1)
            } ${planSuffix}ly plan`}</p>
          </div>
        </div>
        <div className="w-full flex h-max mt-10 justify-center">
          <div className="p-4 h-[120px] w-[30%] border-2 border-neon-blue rounded-2xl flex justify-start items-center">
            <div className="w-[10%] h-full flex items-center">
              <input
                type="radio"
                name="plan"
                value={planName}
                checked
                className="w-5 h-5 text-blue-600 accent-neon-blue"
              />
            </div>
            <div className="flex flex-col w-[60%] h-full gap-2 items-start justify-center">
              <div className="flex gap-1">
                <span className="capitalize font-bold text-white text-xl">
                  {planSuffix}ly
                </span>
                <span className="font-bold text-white text-xl"> plan</span>
              </div>
              <span className="text-sm text-gray-300">
                Ideal for short term and trials
              </span>
            </div>

            <div className="text-white h-full w-[30%] flex items-center font-semibold">
              <p className="text-2xl">${plan.amount}</p>
              <p>{`/ ${planSuffix}`}</p>
            </div>
          </div>
        </div>
        <div className="w-full flex h-max mt-10 justify-center items-center">
          <div className="w-[30%] flex items-start gap-4 flex-col">
            <div className="flex items-center justify-center font-semibold gap-2 h-max">
              <h1 className="text-2xl">What you'll unlock </h1>
              <Icon name="arrowRight" className="w-8 h-8 text-white" />
            </div>

            <div className="flex px-6">
              <ul className="">
                {plan.features.map((feat) => (
                  <div className="flex items-center">
                    <Icon
                      name="check"
                      className="w-5 h-5 mr-3 text-neon-blue"
                    />
                    <li className="text-base">{feat}</li>
                  </div>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="w-[30%] mt-[50px] flex flex-col gap-6">
          <FlwSubscriptionButton
            name={name}
            email={email}
            planKey={planName}
            amount={amount}
            planID={planId}
          />
          <button className="border-neon-blue  border hover:bg-blue-600/20 text-white shadow-lg w-full py-3 rounded-xl font-bold transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
