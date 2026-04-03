import React, { useState, useEffect, useRef } from "react";
import { getTradeAnalysis } from "../../services/geminiService";
import { User } from "../../types";
import Icon from "../ui/Icon";
import SecureContent from "../ui/SecureContent";
import { useUsageTracker } from "../../hooks/useUsageTracker";
import { instrumentDefinitions } from "../../config/instruments";
import { getLivePrice } from "../../services/marketDataService";

interface LotSizeCalculatorPageProps {
  user: User;
}

const getGreeting = (name: string) => {
  const hour = new Date().getHours();
  const username = name.split(" ")[0];
  let greeting;
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }
  return `${greeting}, ${username}! 👋`;
};

export const LotSizeCalculatorPage: React.FC<LotSizeCalculatorPageProps> = ({
  user,
}) => {
  const { canUseFeature, incrementUsage, getUsageInfo } = useUsageTracker(user);
  const [accountCurrency, setAccountCurrency] = useState("USD");
  const [accountBalance, setAccountBalance] = useState("10000");
  const [riskPercentage, setRiskPercentage] = useState("1.0");
  const [instrument, setInstrument] = useState("EUR/USD");
  const [timeFrame, setTimeFrame] = useState("Daily");
  const [entryPrice, setEntryPrice] = useState("1.08500");
  const [stopLossPrice, setStopLossPrice] = useState("1.08000");
  const [crossRate, setCrossRate] = useState("1.2500");
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPips, setSelectedPips] = useState<number | null>(null);
  const [livePriceInfo, setLivePriceInfo] = useState<{
    price: string;
    change: string;
    changeClass: string;
    isMock: boolean;
  } | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  const usageInfo = getUsageInfo("entryAnalysis");
  const canUseAiAnalysis = canUseFeature("entryAnalysis");

  const currentLivePrice = useRef<number | null>(null);
  const lastPrice = useRef<number | null>(null);
  const lastCalculatedResults = useRef<any>(null);

  const toDecimal = (num: number, places: number) =>
    parseFloat(num.toFixed(places));

  const isCrossRateVisible =
    instrumentDefinitions[instrument]?.quoteCurrency !== accountCurrency &&
    !instrument.startsWith(accountCurrency);

  const calculateLotSize = () => {
    setError(null);
    setResults(null);
    try {
      const balance = parseFloat(accountBalance);
      const riskPct = parseFloat(riskPercentage);
      const entry = parseFloat(entryPrice);
      const stopLoss = parseFloat(stopLossPrice);
      const cross = parseFloat(crossRate);

      if (
        isNaN(balance) ||
        isNaN(riskPct) ||
        isNaN(entry) ||
        isNaN(stopLoss) ||
        (isCrossRateVisible && isNaN(cross))
      ) {
        throw new Error("Please ensure all fields have valid numbers.");
      }

      if (entry === stopLoss) {
        throw new Error("Entry and Stop Loss prices cannot be the same.");
      }

      const instrumentProps = instrumentDefinitions[instrument];
      const riskAmount = balance * (riskPct / 100);
      const stopLossPips = Math.abs(entry - stopLoss) / instrumentProps.pipStep;

      let pipValue;
      let tickValue = instrumentProps.pipStep;
      const contractSize = instrumentProps.contractSize || 100000;

      if (instrumentProps.quoteCurrency === accountCurrency) {
        pipValue = tickValue * contractSize;
      } else {
        if (instrument.startsWith(accountCurrency)) {
          pipValue = (tickValue * contractSize) / entry;
        } else {
          pipValue = tickValue * contractSize * cross;
        }
      }

      if (pipValue === 0 || isNaN(pipValue) || stopLossPips === 0) {
        throw new Error(
          "Calculation error: Pip value is zero or invalid, or Stop-Loss is too close to Entry.",
        );
      }

      const positionSizeUnits = riskAmount / (stopLossPips * pipValue);
      const standardLots = positionSizeUnits / contractSize;

      const finalResults = {
        riskAmount: toDecimal(riskAmount, 2),
        stopLossPips: toDecimal(stopLossPips, 1),
        positionSizeUnits: toDecimal(positionSizeUnits, 2),
        standardLots: toDecimal(standardLots, 2),
        pipValue: toDecimal(pipValue, 5),
        isError: false,
        instrument,
        entryPrice: entry,
        stopLossPrice: stopLoss,
      };
      setResults(finalResults);
      lastCalculatedResults.current = finalResults;
    } catch (e: any) {
      setError(e.message);
      setResults(null);
      lastCalculatedResults.current = { isError: true };
    }
  };

  const updateLiveValues = async () => {
    setIsUpdatingPrice(true);
    try {
      const { price, isMock } = await getLivePrice(instrument);
      if (price !== null) {
        const instrumentProps = instrumentDefinitions[instrument];
        const decimalPlaces = Math.ceil(-Math.log10(instrumentProps.pipStep));
        const formattedPrice = price.toFixed(decimalPlaces);

        setEntryPrice(formattedPrice);
        const slPrice = price - 30 * instrumentProps.pipStep;
        setStopLossPrice(slPrice.toFixed(decimalPlaces));

        setLivePriceInfo({
          price: formattedPrice,
          change: "0.0",
          changeClass: "text-mid-text",
          isMock,
        });
        currentLivePrice.current = price;
      }
      if (isCrossRateVisible) {
        const instProps = instrumentDefinitions[instrument];
        const quote = instProps.quoteCurrency;
        const acc = accountCurrency;

        let pairToFetch = `${quote}/${acc}`;
        let invert = false;

        if (!instrumentDefinitions[pairToFetch]) {
          pairToFetch = `${acc}/${quote}`;
          invert = true;
        }

        if (instrumentDefinitions[pairToFetch]) {
          const { price: crossPrice } = await getLivePrice(pairToFetch);
          if (crossPrice) {
            const rate = invert ? 1 / crossPrice : crossPrice;
            setCrossRate(rate.toFixed(5));
          }
        }
      }
    } catch (err) {
      console.error("Failed to update live values", err);
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const fetchTickerUpdate = async () => {
    const { price, isMock } = await getLivePrice(instrument);
    const instrumentProps = instrumentDefinitions[instrument];
    if (!instrumentProps) return;

    const decimalPlaces = Math.ceil(-Math.log10(instrumentProps.pipStep));

    if (price !== null) {
      currentLivePrice.current = price;
      let change = "0.0";
      let changeClass = "text-mid-text";
      if (lastPrice.current) {
        const diff = price - lastPrice.current;
        change = diff.toFixed(decimalPlaces);
        changeClass = diff > 0 ? "text-success" : "text-danger";
      }
      setLivePriceInfo({
        price: price.toFixed(decimalPlaces),
        change,
        changeClass,
        isMock,
      });
      lastPrice.current = price;
    }
  };

  useEffect(() => {
    updateLiveValues();
    setLivePriceInfo(null);
    lastPrice.current = null;
  }, [instrument, accountCurrency]);

  useEffect(() => {
    const intervalId = setInterval(fetchTickerUpdate, 15000);
    return () => clearInterval(intervalId);
  }, [instrument]);

  const calculateAutoSL = (pipDistance: number) => {
    const entry = parseFloat(entryPrice);
    if (isNaN(entry)) return;

    const instrumentProps = instrumentDefinitions[instrument];
    const decimalPlaces = Math.ceil(-Math.log10(instrumentProps.pipStep));
    const slPrice = entry - pipDistance * instrumentProps.pipStep;
    setStopLossPrice(slPrice.toFixed(decimalPlaces));
  };

  const handleAiAnalysis = async () => {
    if (!canUseAiAnalysis) {
      setAiInsight({
        text: "You have reached your daily limit for entry analysis. Please upgrade for more.",
        sources: [],
      });
      return;
    }
    if (
      !lastCalculatedResults.current ||
      lastCalculatedResults.current.isError
    ) {
      return;
    }
    setIsAILoading(true);
    setAiInsight(null);
    try {
      incrementUsage("entryAnalysis");
      const results = lastCalculatedResults.current;
      const tradeDirection =
        results.entryPrice > results.stopLossPrice
          ? "BUY (LONG)"
          : "SELL (SHORT)";
      const instrumentProps = instrumentDefinitions[results.instrument];
      const decimalPlaces = Math.max(
        2,
        Math.ceil(-Math.log10(instrumentProps.pipStep)),
      );
      const pipDistance = Math.abs(results.entryPrice - results.stopLossPrice);
      const tpPrice = tradeDirection.includes("BUY")
        ? parseFloat(
            (results.entryPrice + pipDistance * 2).toFixed(decimalPlaces),
          )
        : parseFloat(
            (results.entryPrice - pipDistance * 2).toFixed(decimalPlaces),
          );
      const analysis = await getTradeAnalysis({
        ...results,
        tradeDirection,
        tpPrice,
        timeFrame,
      });
      setAiInsight(analysis);
    } catch (e) {
      setAiInsight({
        text: "Sorry, the AI analysis failed. Please try again later.",
        sources: [],
      });
    } finally {
      setIsAILoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => calculateLotSize(), 200);
    return () => clearTimeout(handler);
  }, [
    accountBalance,
    riskPercentage,
    entryPrice,
    stopLossPrice,
    instrument,
    accountCurrency,
    crossRate,
  ]);

  const renderAiInsight = () => {
    if (!aiInsight) {
      return (
        <p className="text-mid-text">
          Click the button above to get comprehensive market analysis including
          technical levels, risk assessment, and calculated Take-Profit targets.
        </p>
      );
    }
    const formattedText = aiInsight.text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-dark-text">$1</strong>')
      .replace(/\n/g, "<br />");
    return (
      <SecureContent>
        <div
          dangerouslySetInnerHTML={{ __html: formattedText }}
          className="text-dark-text text-sm"
        />
        {aiInsight.sources && aiInsight.sources.length > 0 && (
          <div className="mt-4 pt-2 border-t border-light-gray">
            <strong className="text-xs text-primary">Sources:</strong>
            <ul className="list-disc ml-4 text-xs text-mid-text">
              {aiInsight.sources.map((source: any, index: number) => (
                <li key={index}>
                  <a
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SecureContent>
    );
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-light-bg px-8 py-6 flex flex-col items-center">
      <div className="w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-end mb-8 gap-4">
          <div className="bg-light-surface p-2 rounded-xl flex items-center justify-center">
            {livePriceInfo && (
              <div className="text-xs text-mid-text mt-1 flex items-center">
                {livePriceInfo.isMock ? (
                  "Mock: "
                ) : (
                  <span className="text-success font-bold mr-1">● Live: </span>
                )}
                <span className="font-semibold text-dark-text">
                  {livePriceInfo.price}
                </span>
                <span className={`ml-2 ${livePriceInfo.changeClass}`}>
                  {livePriceInfo.change !== "N/A" &&
                    (parseFloat(livePriceInfo.change) >= 0 ? "↗" : "↘")}{" "}
                  {livePriceInfo.change}
                </span>
                {isUpdatingPrice && (
                  <span className="ml-2 animate-pulse text-primary">
                    Updating...
                  </span>
                )}
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-8 ">
            <section className="bg-light-surface px-4 py-6 rounded-xl flex flex-col gap-8">
              <div className="flex gap-2 w-full h-max items-center text-slate-400">
                <Icon name="settings" />
                <h2 className="text-sm tracking-widest uppercase font-bold ">
                  Account Configuration
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
                <div>
                  <label className="block text-xs font-medium mb-2 text-dark-text">
                    Account Currency
                  </label>
                  <select
                    value={accountCurrency}
                    onChange={(e) => setAccountCurrency(e.target.value)}
                    className="w-full p-3 rounded-xl bg-light-hover border-light-gray transition-all text-dark-text focus:ring-primary focus:border-primary text-sm"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2 text-dark-text">
                    Account Balance
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      value={accountBalance}
                      onChange={(e) => setAccountBalance(e.target.value)}
                      className="w-full p-3 rounded-xl bg-light-hover border-light-gray text-dark-text focus:ring-primary focus:border-primary text-sm pl-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2 text-dark-text">
                    Risk Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={riskPercentage}
                    step="0.1"
                    min="0.1"
                    onChange={(e) => setRiskPercentage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-light-hover border-light-gray text-dark-text focus:ring-primary focus:border-primary text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2 text-dark-text">
                    Trading Instrument
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={instrument}
                      onChange={(e) => setInstrument(e.target.value)}
                      className="flex-1 p-3 rounded-xl bg-light-hover border-light-gray text-dark-text focus:ring-primary focus:border-primary text-sm"
                    >
                      <optgroup label="Major Forex Pairs">
                        {Object.keys(instrumentDefinitions)
                          .filter((k) => instrumentDefinitions[k].isForex)
                          .slice(0, 7)
                          .map((key) => (
                            <option key={key} value={key}>
                              {key}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Minor/Cross Forex Pairs">
                        {Object.keys(instrumentDefinitions)
                          .filter((k) => instrumentDefinitions[k].isForex)
                          .slice(7)
                          .map((key) => (
                            <option key={key} value={key}>
                              {key}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Metals & Crypto">
                        {Object.keys(instrumentDefinitions)
                          .filter((k) => !instrumentDefinitions[k].isForex)
                          .filter(
                            (k) =>
                              !["Boom", "Crash", "Jump", "Volatility"].some(
                                (prefix) => k.startsWith(prefix),
                              ),
                          )
                          .map((key) => (
                            <option key={key} value={key}>
                              {key}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-light-surface px-4 py-6 rounded-xl flex flex-col gap-8">
              <div className="flex gap-2 w-full h-max items-center text-slate-400">
                <Icon name="settings" />
                <h2 className="text-sm tracking-widest uppercase font-bold ">
                  Trade Parameters
                </h2>
              </div>
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-2 text-dark-text">
                      Entry Price
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={entryPrice}
                        step={instrumentDefinitions[instrument]?.pipStep}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        className="w-full p-3 rounded-xl bg-light-hover border-light-gray text-dark-text focus:ring-primary focus:border-primary text-sm"
                        required
                      />
                      {isUpdatingPrice && (
                        <div className="absolute right-2 top-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2 text-dark-text">
                      Stop-Loss Price
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={stopLossPrice}
                        step={instrumentDefinitions[instrument]?.pipStep}
                        onChange={(e) => setStopLossPrice(e.target.value)}
                        className="w-full p-3 rounded-xl bg-light-hover border-light-gray text-dark-text focus:ring-primary focus:border-primary text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-light-gray w-full" />

                <div className="sm:col-span-2 p-3 ">
                  <label className="block text-xs font-semibold mb-4 text-dark-text">
                    Auto Stop-Loss (pips from entry)
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {[10, 20, 30, 50, 100].map((pips) => (
                      <button
                        key={pips}
                        onClick={() => {
                          setSelectedPips(pips);
                          calculateAutoSL(pips);
                        }}
                        className={`
        p-2 rounded-2xl text-xs text-white transition-all
        ${
          selectedPips === pips
            ? "bg-slate-400 "
            : "border border-slate-400 text-white hover:bg-slate-500"
        }
      `}
                      >
                        {pips} pips
                      </button>
                    ))}
                  </div>
                </div>
                {isCrossRateVisible && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-dark-text">
                      Conversion Rate (
                      {`${instrumentDefinitions[instrument]?.quoteCurrency}/${accountCurrency}`}
                      )
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={crossRate}
                        onChange={(e) => setCrossRate(e.target.value)}
                        className="mt-1 block w-full bg-light-hover border-accent text-accent rounded-md shadow-sm p-2 focus:ring-accent focus:border-accent text-sm"
                      />
                      {isUpdatingPrice && (
                        <span className="absolute right-2 top-3 text-xs text-mid-text">
                          Fetching live rate...
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
          <div className="flex flex-col gap-8 w-[80%]">
            <section className="space-y-4 bg-primary p-6 w-full rounded-3xl">
              <h3 className="text-xl uppercase font-bold text-white font-bold">
                Position Summary
              </h3>
              {error && (
                <div className="bg-danger/10 flex items-center gap-2 justify-center text-white p-3 rounded-lg text-sm border border-danger/20 text-center">
                  <Icon name="danger" />
                  {error}
                </div>
              )}
              {results && !error && (
                <div className="w-full flex flex-col gap-4">
                  <div className="flex items-end">
                    <p className="text-5xl font-black tracking-tighter">
                      {results.standardLots}
                    </p>
                    <span className="ml-2 text-xl font-bold opacity-80">
                      Lots
                    </span>
                    <span className="ml-1">
                      - ({results.positionSizeUnits} units)
                    </span>
                  </div>
                  <hr className="border-white/20 w-full" />
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                    <div>
                      <p className="text-[10px] uppercase font-bold opacity-60">
                        Risk Amount
                      </p>
                      <p className="text-xl font-bold">${results.riskAmount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold opacity-60">
                        SL Distance
                      </p>
                      <p className="text-xl font-bold">
                        {results.stopLossPips} Pips
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-3 bg-light-hover p-4 rounded-xl border border-light-gray">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-md font-bold text-accent">Ask Olapete</h3>
                <div className="text-xs bg-light-surface px-3 py-1 rounded-full border border-light-gray">
                  Analysis:{" "}
                  <span className="font-bold text-primary">
                    {typeof usageInfo.limit === "number"
                      ? `${Math.max(0, usageInfo.limit - usageInfo.count)} / ${
                          usageInfo.limit
                        }`
                      : "Unlimited"}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-dark-text">
                  Target Analysis Time Frame
                </label>
                <select
                  value={timeFrame}
                  onChange={(e) => setTimeFrame(e.target.value)}
                  className="w-full p-2 rounded-lg bg-light-surface border-light-gray text-dark-text focus:ring-primary focus:border-primary text-sm"
                >
                  <option>Daily</option>
                  <option>4 Hours</option>
                  <option>1 Hour</option>
                  <option>15 Minutes</option>
                  <option>5 Minutes</option>
                  <option>1 Minute</option>
                </select>
              </div>
              <button
                onClick={handleAiAnalysis}
                disabled={
                  isAILoading || !canUseAiAnalysis || !results || error !== null
                }
                className="w-full py-2 px-4 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition duration-150 flex items-center justify-center disabled:bg-light-gray disabled:text-mid-text disabled:cursor-not-allowed text-sm"
              >
                {isAILoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {`Analyzing...`}
                  </>
                ) : (
                  "Get In-depth Analysis"
                )}
              </button>
              <div className="text-mid-text text-sm mt-2 mb-4 min-h-[8rem] bg-light-surface p-3 rounded-lg border border-light-gray">
                {renderAiInsight()}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotSizeCalculatorPage;
