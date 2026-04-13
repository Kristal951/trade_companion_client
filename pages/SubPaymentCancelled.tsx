import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { IoCloseCircleOutline, IoArrowForward } from "react-icons/io5";
import React from "react";

export default function PaymentCancelledPage() {
  const IoCloseCircleOutlineIcon = IoCloseCircleOutline as React.ElementType;
  const IoArrowForwardIcon = IoCloseCircleOutline as React.ElementType;
  return (
    <main className="relative min-h-screen overflow-hidden bg-black/60 px-4 py-10 font-sans">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-[480px] items-center justify-center">
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 120 }}
          className="w-full rounded-[28px] bg-light-surface p-8 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur"
        >
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 ring-8 ring-amber-50/60">
              <IoCloseCircleOutlineIcon className="h-12 w-12 text-amber-500" />
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-mid-text">
              Checkout stopped
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-dark-text">
              Payment Cancelled
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-mid-text">
              Your checkout was cancelled before completion. No payment was
              completed, and your subscription remains unchanged.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              to="/pricing"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            >
              Return to Plans
              <IoArrowForwardIcon className="text-lg transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/dashboard"
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Go to Dashboard
            </Link>

            <Link
              to="/contact_us"
              className="mt-1 text-center text-sm text-slate-500 transition hover:text-slate-700"
            >
              Need help? Contact support
            </Link>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
