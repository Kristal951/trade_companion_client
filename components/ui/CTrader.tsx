import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TARGET_INSTRUMENTS } from "@/services/geminiService";
import { API } from "@/utils";
import Spinner from "./Spinner";
import useAppStore from "@/store/useStore";

import {
  BiShieldQuarter,
  BiSync,
  BiLinkAlt,
  BiUnlink,
  BiChevronRight,
  BiSliderAlt,
  BiCheckCircle,
} from "react-icons/bi";
import { FaTerminal } from "react-icons/fa";
import { MdOutlineSecurity } from "react-icons/md";
import ToggleSwitch from "./ToggleSwitch";

type CTraderAccount = {
  accID: string;
  accName?: string;
  brokerName?: string;
  brokerTitle?: string;
  currency?: string;
};

type CTraderStatus = {
  connected: boolean;
  accounts: CTraderAccount[];
  activeAccountId?: string | null;
};

const CTraderSettings = ({ user, setUser, showToast }: any) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [statusLoading, setStatusLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [savingInstruments, setSavingInstruments] = useState(false);
  const [savingAutoTrade, setSavingAutoTrade] = useState(false);
  const [ctraderStatus, setCtraderStatus] = useState<CTraderStatus>({
    connected: false,
    accounts: [],
    activeAccountId: null,
  });

  const isConnected = ctraderStatus.connected;

  const availableInstruments = useMemo(() => {
    const unsupported = [
      "Boom 1000",
      "Crash 1000",
      "Volatility 75",
      "Volatility 100",
      "Jump 10",
      "Jump 25",
      "Jump 50",
    ];
    return TARGET_INSTRUMENTS.filter((inst) => !unsupported.includes(inst));
  }, []);

  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(
    () => {
      try {
        const saved = localStorage.getItem(`ctrader_instruments_${user.email}`);
        return saved ? JSON.parse(saved) : ["EUR/USD", "GBP/JPY", "XAU/USD"];
      } catch {
        return ["EUR/USD", "GBP/JPY", "XAU/USD"];
      }
    },
  );

  const toastRef = React.useRef(showToast);
  useEffect(() => {
    toastRef.current = showToast;
  }, [showToast]);

  const handleSetAutoTrade = async (enabled: boolean) => {
    if (!ctraderStatus.connected) {
      showToast("Connect your cTrader account first.", "error");
      return;
    }

    const accountId =
      ctraderStatus.activeAccountId || user?.cTraderConfig?.accountId;

    if (!accountId) {
      showToast("Select an account before enabling auto-trading.", "error");
      return;
    }

    const plan = String(user?.plan || user?.subscribedPlan || "").toUpperCase();
    const isPaid = plan === "PRO" || plan === "PREMIUM";
    if (!isPaid) {
      showToast("Upgrade to Pro or Premium to enable auto-trading.", "info");
      return;
    }

    setSavingAutoTrade(true);
    try {
      const res = await API.patch("/api/ctrader/auto-trade", {
        enabled,
        accountId,
      });

      const cfg = res.data?.cTraderConfig;

      setUser({
        cTraderConfig: {
          accountId: cfg?.accountId ?? accountId,
          isConnected: cfg?.isConnected ?? true,
          autoTradeEnabled:
            typeof cfg?.autoTradeEnabled === "boolean"
              ? cfg.autoTradeEnabled
              : enabled,
        },
      });

      showToast(
        enabled ? "Auto-trading enabled." : "Auto-trading disabled.",
        "success",
      );
    } catch (err: any) {
      console.log(err);
      showToast(
        err?.response?.data?.message || "Failed to update auto-trading.",
        "error",
      );
    } finally {
      setSavingAutoTrade(false);
    }
  };

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await API.get("/api/ctrader/status");

      const status = {
        connected: Boolean(res.data.connected),
        accounts: Array.isArray(res.data.accounts) ? res.data.accounts : [],
        activeAccountId:
          res.data.activeAccountId != null
            ? String(res.data.activeAccountId)
            : null,
      };

      setCtraderStatus(status);
      setUser({
        cTraderConfig: {
          accountId:
            status.activeAccountId || user?.cTraderConfig?.accountId || "",
          isConnected: status.connected,
          autoTradeEnabled:
            typeof res.data.autoTradeEnabled === "boolean"
              ? res.data.autoTradeEnabled
              : (user?.cTraderConfig?.autoTradeEnabled ?? false),
        },
      });
    } catch (err: any) {
      console.log(err);
      toastRef.current?.(
        err?.response?.data?.message || "Failed to sync with cTrader servers.",
        "error",
      );
    } finally {
      setStatusLoading(false);
    }
  }, [setUser]);

  // useEffect(() => {
  //   fetchStatus();
  // }, [fetchStatus]);

  const handledLinkedRef = React.useRef(false);
  const isAutoEnabled = Boolean(user?.cTraderConfig?.autoTradeEnabled);
  const canToggle = Boolean(ctraderStatus.activeAccountId) && !savingAutoTrade;

  useEffect(() => {
    if (handledLinkedRef.current) return;

    const params = new URLSearchParams(location.search);
    const linked = params.get("linked");
    if (!linked) return;

    handledLinkedRef.current = true;

    if (linked === "success") {
      toastRef.current?.("cTrader linked successfully!", "success");
      // fetchStatus();
    } else {
      toastRef.current?.("Connection failed. Please try again.", "error");
    }

    params.delete("linked");
    navigate(
      { pathname: location.pathname, search: params.toString() },
      { replace: true },
    );
  }, [location.search, navigate, fetchStatus]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { data } = await API.get("/api/ctrader/connect-url");
      if (!data?.url) throw new Error("Missing connect URL");
      window.location.assign(data.url);
    } catch (error) {
      showToast("Could not initiate connection.", "error");
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await API.post("/api/ctrader/disconnect");
      setCtraderStatus({
        connected: false,
        accounts: [],
        activeAccountId: null,
      });
      setUser((prev: any) => ({
        ...prev,
        cTraderConfig: {
          ...prev?.cTraderConfig,
          isConnected: false,
          accountId: "",
          autoTradeEnabled: false,
        },
      }));
      showToast("Disconnected safely.", "info");
    } catch (err) {
      showToast("Error during disconnection.", "error");
    }
  };

  const handleSelectAccount = async (accountId: string) => {
    const originalId = ctraderStatus.activeAccountId;
    setCtraderStatus((s) => ({ ...s, activeAccountId: accountId }));

    try {
      await API.post("/api/ctrader/set-active-account", { accountId });
      setUser((prev: any) => ({
        ...prev,
        cTraderConfig: { ...prev?.cTraderConfig, accountId },
      }));
      showToast("Trading account switched.", "success");
    } catch (err: any) {
      setCtraderStatus((s) => ({ ...s, activeAccountId: originalId }));
      showToast("Failed to switch account.", "error");
    }
  };

  const toggleInstrument = (inst: string) => {
    setSelectedInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst],
    );
  };

  const handleSaveInstruments = async () => {
    setSavingInstruments(true);
    setTimeout(() => {
      localStorage.setItem(
        `ctrader_instruments_${user.email}`,
        JSON.stringify(selectedInstruments),
      );
      showToast("Strategy preferences updated.", "success");
      setSavingInstruments(false);
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <FaTerminal className="text-indigo-600 w-6 h-6" />
                <h3 className="font-black text-3xl tracking-tight text-slate-900 dark:text-white">
                  cTrader <span className="text-indigo-600">Terminal</span>
                </h3>
                {statusLoading ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse">
                    <BiSync className="animate-spin text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Syncing
                    </span>
                  </div>
                ) : isConnected ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Offline
                    </span>
                  </div>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Bridge your AI strategies with institutional liquidity
                providers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchStatus}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300"
              >
                <BiSync
                  className={`w-5 h-5 ${statusLoading ? "animate-spin" : ""}`}
                />
              </button>

              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || statusLoading}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                >
                  {isConnecting ? (
                    <Spinner w={4} h={4} />
                  ) : (
                    <>
                      <BiLinkAlt className="w-5 h-5" /> Connect
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all font-bold"
                >
                  <BiUnlink className="w-5 h-5" /> Disconnect
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-8">
          {!isConnected ? (
            <div className="grid md:grid-cols-2 gap-8 py-4">
              <div className="space-y-6">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BiSliderAlt className="w-5 h-5 text-indigo-500" /> Setup
                  Protocol
                </h4>
                <div className="space-y-4">
                  {[
                    "Authorize via cTrader ID",
                    "Select trading accounts",
                    "Grant trading permissions",
                    "Enable AI execution",
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <span className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xs font-black border border-indigo-100 dark:border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-[2rem] bg-indigo-600 text-white space-y-4 relative overflow-hidden shadow-xl">
                <MdOutlineSecurity className="w-16 h-16 opacity-20 absolute -right-2 -top-2" />
                <h4 className="font-bold text-xl relative z-10">
                  Vault-Grade Security
                </h4>
                <p className="text-indigo-100 text-sm leading-relaxed relative z-10">
                  Authentication is handled via cTrader's secure Open API 2.0.
                  We never see your password—only a time-limited trading token.
                </p>
                <div className="pt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/20 rounded">
                    Encrypted Session
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-black text-xl text-slate-900 dark:text-white">
                      Active Accounts
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Routes all trades to the selected account
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {ctraderStatus.accounts.map((acc) => {
                    const active = acc.accID === ctraderStatus.activeAccountId;
                    return (
                      <button
                        key={acc.accID}
                        onClick={() => handleSelectAccount(acc.accID)}
                        className={`group relative text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
                          active
                            ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-500/5 shadow-lg shadow-indigo-100/50 dark:shadow-none"
                            : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p
                              className={`font-black text-lg transition-colors ${active ? "text-indigo-600" : "text-slate-900 dark:text-white"}`}
                            >
                              {acc.accName || "Trading Account"}
                            </p>
                            <code className="text-[10px] text-slate-400 font-bold bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                              ID: {acc.accID}
                            </code>
                          </div>
                          {active && (
                            <BiCheckCircle className="w-6 h-6 text-indigo-600 animate-in zoom-in duration-300" />
                          )}
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              {acc.currency || "USD"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                              {acc.brokerName}
                            </span>
                          </div>
                          {!active && (
                            <BiChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Asset Preferences */}
              <section className="bg-slate-50 dark:bg-slate-950/50 -mx-8 px-8 py-10 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div className="space-y-1">
                    <h4 className="font-black text-xl text-slate-900 dark:text-white">
                      Permitted Assets
                    </h4>
                    <p className="text-sm text-slate-500 font-medium">
                      The AI only monitors pairs checked below.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() =>
                        setSelectedInstruments(availableInstruments)
                      }
                      className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      All
                    </button>
                    <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
                    <button
                      onClick={() => setSelectedInstruments([])}
                      className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableInstruments.map((inst) => {
                    const isSelected = selectedInstruments.includes(inst);
                    return (
                      <label
                        key={inst}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 active:scale-95 ${
                          isSelected
                            ? "bg-white dark:bg-slate-900 border-indigo-600 shadow-md"
                            : "bg-transparent border-transparent hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                        }`}
                      >
                        <span
                          className={`text-xs font-black tracking-tight ${isSelected ? "text-indigo-600" : "text-slate-500"}`}
                        >
                          {inst}
                        </span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleInstrument(inst)}
                          className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="mt-12 flex flex-col items-center gap-4">
                  <button
                    onClick={handleSaveInstruments}
                    disabled={savingInstruments}
                  >
                    {savingInstruments ? (
                      <Spinner w={4} h={4} />
                    ) : (
                      "Update Strategy"
                    )}
                  </button>
                </div>
              </section>

              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-black text-xl text-slate-900 dark:text-white">
                      Auto-Trading
                    </h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      Execute AI signals automatically on your active cTrader
                      account.
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Status:{" "}
                      <span
                        className={`font-bold ${isAutoEnabled ? "text-emerald-600" : "text-slate-500"}`}
                      >
                        {isAutoEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {savingAutoTrade && <Spinner w={4} h={4} />}
                    <ToggleSwitch
                      checked={isAutoEnabled}
                      disabled={!isConnected || !canToggle}
                      onChange={handleSetAutoTrade}
                      label="Auto-Trading Toggle"
                    />
                  </div>
                </div>

                {!ctraderStatus.activeAccountId && (
                  <p className="text-xs text-warning mt-4">
                    Select an account above before enabling auto-trading.
                  </p>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CTraderSettings;
