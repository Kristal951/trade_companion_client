import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoCheckmarkCircle,
  IoAlertCircle,
  IoTimeOutline,
  IoArrowForward,
} from "react-icons/io5";
import { CgSpinner } from "react-icons/cg";
import useAppStore from "@/store/useStore";
import React from "react";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const paymentState = useAppStore((s) => s.paymentState);
  const paymentMessage = useAppStore((s) => s.paymentMessage);
  const paymentSubscription = useAppStore((s) => s.paymentSubscription);
  const verifyStripeSession = useAppStore((s) => s.verifyStripeSession);
  const resetPaymentState = useAppStore((s) => s.resetPaymentState);

  useEffect(() => {
    verifyStripeSession(sessionId);

    return () => {
      resetPaymentState();
    };
  }, [sessionId, verifyStripeSession, resetPaymentState]);

  const IoCheckmarkCircleIcon = IoCheckmarkCircle as React.ElementType;
  const IoAlertCircleIcon = IoAlertCircle as React.ElementType;
  const IoTimeOutlineIcon = IoTimeOutline as React.ElementType;
  const IoArrowForwardIcon = IoArrowForward as React.ElementType;
  const CgSpinnerIcon = CgSpinner as React.ElementType;

  return (
    <main className="relative min-h-screen overflow-hidden bg-black/60 px-4 py-10 font-sans">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-[480px] items-center justify-center">
        <AnimatePresence mode="wait">
          {paymentState === "loading" && (
            <motion.section
              key="loading"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full rounded-[28px] bg-light-surface p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-light-bg">
                <CgSpinnerIcon className="h-10 w-10 animate-spin text-indigo-600" />
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-mid-text">
                Please wait
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-dark-text">
                Verifying Payment
              </h1>
              <p className="mt-3 text-sm leading-6 text-mid-text">
                {paymentMessage}
              </p>
            </motion.section>
          )}

          {paymentState === "success" && (
            <motion.section
              key="success"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: "spring", damping: 18, stiffness: 120 }}
              className="w-full rounded-[28px] bg-light-surface p-8 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur"
            >
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/60">
                  <IoCheckmarkCircleIcon className="h-12 w-12 text-green-500" />
                </div>

                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-green-600">
                  Payment confirmed
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-dark-text">
                  Subscription Activated
                </h1>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-mid-text">
                  Your account has been upgraded successfully and your premium
                  access is now available.
                </p>
              </div>

              {paymentSubscription && (
                <div className="mt-8 rounded-2xl bg-light-bg p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-mid-text">
                      Plan
                    </span>
                    <span className="text-sm font-semibold text-dark-text">
                      {paymentSubscription.plan || "Premium"}
                    </span>
                  </div>

                  {paymentSubscription.interval && (
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-mid-text">
                        Billing
                      </span>
                      <span className="text-sm font-medium text-dark-text">
                        {paymentSubscription.interval}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-mid-text">
                      Status
                    </span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                      Active
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <Link
                  to="/dashboard"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                >
                  Go to Dashboard
                  <IoArrowForwardIcon className="text-lg transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/settings"
                  className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Manage Subscription
                </Link>
              </div>
            </motion.section>
          )}

          {paymentState === "processing" && (
            <motion.section
              key="processing"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full rounded-[28px] bg-light-surface p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 ring-8 ring-amber-50/60">
                <IoTimeOutlineIcon className="h-11 w-11 text-amber-500" />
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">
                Processing
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-dark-text">
                Payment Received
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {paymentMessage}
              </p>

              <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-left">
                <p className="text-sm leading-6 text-mid-text">
                  Your payment is being confirmed. You can return to your
                  dashboard and check again shortly.
                </p>
              </div>
            </motion.section>
          )}

          {paymentState === "error" && (
            <motion.section
              key="error"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full rounded-[28px] bg-light-surface p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/60">
                <IoAlertCircleIcon className="h-12 w-12 text-red-500" />
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-red-500">
                Something went wrong
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-dark-text">
                Confirmation Failed
              </h1>
              <p className="mt-3 text-sm leading-6 text-mid-text">
                {paymentMessage}
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
