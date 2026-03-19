import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  LineStyle,
  IPriceLine,
  MouseEventParams,
} from "lightweight-charts";
import Icon from "../ui/Icon";

const WS_URL = "wss://ws.binaryws.com/websockets/v3?app_id=1089";

const DERIV_ASSETS: Record<string, { value: string; label: string }[]> = {
  "Volatility Indices": [
    { value: "R_10", label: "Volatility 10" },
    { value: "R_25", label: "Volatility 25" },
    { value: "R_50", label: "Volatility 50" },
    { value: "R_75", label: "Volatility 75" },
    { value: "R_100", label: "Volatility 100" },
  ],
  "Volatility (1s) Indices": [
    { value: "1HZ10V", label: "Volatility 10 (1s)" },
    { value: "1HZ25V", label: "Volatility 25 (1s)" },
    { value: "1HZ50V", label: "Volatility 50 (1s)" },
    { value: "1HZ75V", label: "Volatility 75 (1s)" },
    { value: "1HZ100V", label: "Volatility 100 (1s)" },
  ],
  "Jump Indices": [
    { value: "JD10", label: "Jump 10" },
    { value: "JD25", label: "Jump 25" },
    { value: "JD50", label: "Jump 50" },
    { value: "JD75", label: "Jump 75" },
    { value: "JD100", label: "Jump 100" },
  ],
  "Crash/Boom": [
    { value: "BOOM500", label: "Boom 500" },
    { value: "BOOM1000", label: "Boom 1000" },
    { value: "CRASH500", label: "Crash 500" },
    { value: "CRASH1000", label: "Crash 1000" },
  ],
  "Bear/Bull": [
    { value: "RDBEAR", label: "Bear Market Index" },
    { value: "RDBULL", label: "Bull Market Index" },
  ],
};

const INTERVALS = [
  { value: "1", label: "1m" },
  { value: "5", label: "5m" },
  { value: "15", label: "15m" },
  { value: "60", label: "1h" },
  { value: "240", label: "4h" },
  { value: "D", label: "1d" },
];

interface DerivChartProps {
  theme: "light" | "dark";
}

interface PositionParams {
  entry: number;
  stopLoss: number;
  takeProfit: number;
}

const DerivChart: React.FC<DerivChartProps> = ({ theme }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastBarRef = useRef<{
    open: number;
    high: number;
    low: number;
    close: number;
    time: number;
  } | null>(null);
  const positionLinesRef = useRef<IPriceLine[]>([]);

  const [symbol, setSymbol] = useState("R_100");
  const [interval, setInterval] = useState("15");
  const [connectionStatus, setConnectionStatus] = useState<
    "Connecting" | "Connected" | "Disconnected"
  >("Disconnected");

  const [activeTool, setActiveTool] = useState<"none" | "long" | "short">(
    "none",
  );
  const [positionParams, setPositionParams] = useState<PositionParams>({
    entry: 0,
    stopLoss: 0,
    takeProfit: 0,
  });
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: {
          type: ColorType.Solid,
          color: theme === "dark" ? "#0b0d10" : "#ffffff",
        },
        textColor: theme === "dark" ? "#e8eef6" : "#1f2937",
      },
      grid: {
        vertLines: { color: theme === "dark" ? "#1f2937" : "#e5e7eb" },
        horzLines: { color: theme === "dark" ? "#1f2937" : "#e5e7eb" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: theme === "dark" ? "#374151" : "#d1d5db",
      },
      rightPriceScale: {
        borderColor: theme === "dark" ? "#374151" : "#d1d5db",
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [theme]);

  const updateLegend = useCallback(
    (
      bar:
        | { open: number; high: number; low: number; close: number }
        | undefined
        | null,
    ) => {
      if (!legendRef.current) return;

      const validBar = bar || lastBarRef.current;

      const allAssets = Object.values(DERIV_ASSETS).reduce(
        (acc, group) => [...acc, ...group],
        [],
      );
      const symbolLabel =
        allAssets.find((a) => a.value === symbol)?.label || symbol;
      const intervalLabel =
        INTERVALS.find((i) => i.value === interval)?.label || interval;

      const textColor = theme === "dark" ? "#e5e7eb" : "#1f2937";
      const labelColor = theme === "dark" ? "#9ca3af" : "#6b7280";

      if (!validBar) {
        legendRef.current.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <div style="display: flex; align-items: baseline; gap: 6px;">
                        <span style="font-size: 1.125rem; font-weight: 700; color: ${textColor};">${symbolLabel}</span>
                        <span style="font-size: 0.75rem; font-weight: 500; color: ${labelColor};">•</span>
                        <span style="font-size: 0.875rem; font-weight: 600; color: ${textColor};">${intervalLabel}</span>
                        <span style="font-size: 0.75rem; font-weight: 500; color: ${labelColor};">•</span>
                        <span style="font-size: 0.75rem; font-weight: 600; color: ${labelColor};">Deriv</span>
                    </div>
                    <div style="font-size: 0.875rem; color: ${labelColor};">Loading data...</div>
                </div>
            `;
        return;
      }

      const { open, high, low, close } = validBar;
      const change = close - open;
      const changePercent = (change / open) * 100;
      const isUp = change >= 0;
      const valueColor = isUp ? "#22c55e" : "#ef4444";

      const decimals = 2;
      const fmt = (n: number) => n.toFixed(decimals);

      legendRef.current.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; align-items: baseline; gap: 6px;">
                    <span style="font-size: 1.125rem; font-weight: 700; color: ${textColor};">${symbolLabel}</span>
                    <span style="font-size: 0.75rem; font-weight: 500; color: ${labelColor};">•</span>
                    <span style="font-size: 0.875rem; font-weight: 600; color: ${textColor};">${intervalLabel}</span>
                    <span style="font-size: 0.75rem; font-weight: 500; color: ${labelColor};">•</span>
                    <span style="font-size: 0.75rem; font-weight: 600; color: ${labelColor};">Deriv</span>
                    <span style="font-size: 0.75rem; font-weight: 400; color: ${isUp ? "#22c55e" : "#ef4444"}; margin-left: 8px;">
                        ${isUp ? "●" : "●"} Market Open
                    </span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.9rem; font-family: 'Roboto Mono', monospace;">
                    <span><span style="color: ${labelColor};">O</span> <span style="color: ${valueColor}; font-weight: 500;">${fmt(open)}</span></span>
                    <span><span style="color: ${labelColor};">H</span> <span style="color: ${valueColor}; font-weight: 500;">${fmt(high)}</span></span>
                    <span><span style="color: ${labelColor};">L</span> <span style="color: ${valueColor}; font-weight: 500;">${fmt(low)}</span></span>
                    <span><span style="color: ${labelColor};">C</span> <span style="color: ${valueColor}; font-weight: 500;">${fmt(close)}</span></span>
                    <span style="color: ${valueColor}; font-weight: 500;">
                        ${change >= 0 ? "+" : ""}${fmt(change)} (${change >= 0 ? "+" : ""}${changePercent.toFixed(2)}%)
                    </span>
                </div>
            </div>
        `;
    },
    [symbol, interval, theme],
  );

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    updateLegend(lastBarRef.current);

    const handleCrosshair = (param: MouseEventParams) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current!.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current!.clientHeight
      ) {
        updateLegend(null);
      } else {
        const data = param.seriesData.get(seriesRef.current!) as any;
        if (data) updateLegend(data);
      }
    };

    chartRef.current.subscribeCrosshairMove(handleCrosshair);
    chartRef.current.applyOptions({
      watermark: { visible: false },
    });

    return () => {
      chartRef.current?.unsubscribeCrosshairMove(handleCrosshair);
    };
  }, [updateLegend]);

  useEffect(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    setConnectionStatus("Connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    const gran = interval === "D" ? 86400 : parseInt(interval, 10) * 60;

    ws.onopen = () => {
      setConnectionStatus("Connected");

      ws.send(
        JSON.stringify({
          ticks_history: symbol,
          style: "candles",
          granularity: gran,
          count: 1000,
          adjust_start_time: 1,
          subscribe: 1,
          end: "latest",
        }),
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.error) {
        console.error("Deriv API Error:", data.error.message);
        return;
      }

      if (data.msg_type === "candles") {
        const bars = data.candles.map((c: any) => ({
          time: c.epoch,
          open: parseFloat(c.open),
          high: parseFloat(c.high),
          low: parseFloat(c.low),
          close: parseFloat(c.close),
        }));

        seriesRef.current?.setData(bars);
        if (bars.length > 0) {
          const last = bars[bars.length - 1];
          lastBarRef.current = last;
          setCurrentPrice(last.close);
          updateLegend(last);
        }
      }

      if (data.msg_type === "ohlc") {
        const c = data.ohlc;
        const bar = {
          time: c.open_time,
          open: parseFloat(c.open),
          high: parseFloat(c.high),
          low: parseFloat(c.low),
          close: parseFloat(c.close),
        };
        seriesRef.current?.update(bar);
        lastBarRef.current = bar;
        setCurrentPrice(bar.close);
        updateLegend(bar);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("Disconnected");
    };

    return () => {
      ws.close();
    };
  }, [symbol, interval, updateLegend]);

  const clearPositionLines = () => {
    if (seriesRef.current && positionLinesRef.current.length > 0) {
      positionLinesRef.current.forEach((line) =>
        seriesRef.current?.removePriceLine(line),
      );
      positionLinesRef.current = [];
    }
  };

  const activateTool = (tool: "long" | "short") => {
    if (activeTool === tool) {
      setActiveTool("none");
      clearPositionLines();
      return;
    }

    clearPositionLines();
    setActiveTool(tool);

    const price = currentPrice;
    const dist = price * 0.005;

    let sl, tp;
    if (tool === "long") {
      sl = price - dist;
      tp = price + dist * 2;
    } else {
      sl = price + dist;
      tp = price - dist * 2;
    }

    const params = { entry: price, stopLoss: sl, takeProfit: tp };
    setPositionParams(params);
    drawPositionLines(params);
  };

  const drawPositionLines = (params: PositionParams) => {
    if (!seriesRef.current) return;
    clearPositionLines();

    const entryLine = seriesRef.current.createPriceLine({
      price: params.entry,
      color: "#3b82f6",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: "ENTRY",
    });

    const slLine = seriesRef.current.createPriceLine({
      price: params.stopLoss,
      color: "#ef4444",
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "SL",
    });

    const tpLine = seriesRef.current.createPriceLine({
      price: params.takeProfit,
      color: "#22c55e",
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "TP",
    });

    positionLinesRef.current = [entryLine, slLine, tpLine];
  };

  const updatePositionParams = (field: keyof PositionParams, value: string) => {
    const val = parseFloat(value);
    if (isNaN(val)) return;

    const newParams = { ...positionParams, [field]: val };
    setPositionParams(newParams);
    drawPositionLines(newParams);
  };

  const handleSnapshot = () => {
    if (chartRef.current) {
      const canvas = chartRef.current.takeScreenshot();
      const url = canvas.toDataURL();
      const link = document.createElement("a");
      link.download = `chart-${symbol}-${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="flex flex-wrap items-center gap-3 p-3 border-b border-light-gray bg-light-surface z-20">
        <div className="flex items-center gap-2 border-r border-light-gray pr-3">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-light-hover border border-light-gray rounded px-2 py-1.5 text-sm text-dark-text focus:outline-none focus:border-primary font-bold custom-select"
            style={{ maxWidth: "180px" }}
          >
            {Object.entries(DERIV_ASSETS).map(([category, symbols]) => (
              <optgroup key={category} label={category}>
                {symbols.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 border-r border-light-gray pr-3">
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => setInterval(iv.value)}
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${interval === iv.value ? "bg-primary text-white" : "text-mid-text hover:bg-light-hover"}`}
            >
              {iv.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => activateTool("long")}
            title="Long Position"
            className={`px-3 py-1.5 rounded transition-colors font-bold text-sm shadow-sm ${activeTool === "long" ? "bg-success text-white ring-2 ring-offset-1 ring-success" : "bg-success text-white hover:bg-green-600"}`}
          >
            BUY
          </button>
          <button
            onClick={() => activateTool("short")}
            title="Short Position"
            className={`px-3 py-1.5 rounded transition-colors font-bold text-sm shadow-sm ${activeTool === "short" ? "bg-danger text-white ring-2 ring-offset-1 ring-danger" : "bg-danger text-white hover:bg-red-600"}`}
          >
            SELL
          </button>
          {activeTool !== "none" && (
            <button
              onClick={() => {
                setActiveTool("none");
                clearPositionLines();
              }}
              title="Clear Lines"
              className="p-1.5 rounded text-mid-text hover:bg-light-hover hover:text-danger transition-colors"
            >
              <Icon name="trash" className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-2 pl-3 border-l border-light-gray">
          <button
            onClick={handleSnapshot}
            title="Take Snapshot"
            className="p-1.5 rounded text-mid-text hover:bg-light-hover hover:text-primary transition-colors"
          >
            <Icon name="camera" className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 relative bg-light-bg overflow-hidden"
        ref={chartContainerRef}
      >
        <div
          ref={legendRef}
          className="absolute top-4 left-4 z-10 font-sans pointer-events-none select-none bg-transparent"
        ></div>

        {activeTool !== "none" && (
          <div className="absolute top-4 right-16 z-10 bg-light-surface/90 backdrop-blur-md p-4 rounded-lg shadow-lg border border-light-gray w-64 animate-fade-in-right">
            <div className="flex justify-between items-center mb-3">
              <h4
                className={`font-bold ${activeTool === "long" ? "text-success" : "text-danger"}`}
              >
                {activeTool === "long" ? "Long Position" : "Short Position"}
              </h4>
              <button
                onClick={() => {
                  setActiveTool("none");
                  clearPositionLines();
                }}
                className="text-mid-text hover:text-dark-text"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-mid-text mb-1">
                  Entry Price
                </label>
                <input
                  type="number"
                  value={positionParams.entry}
                  onChange={(e) =>
                    updatePositionParams("entry", e.target.value)
                  }
                  className="w-full bg-light-hover border border-light-gray rounded px-2 py-1 text-sm text-dark-text focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-mid-text mb-1">
                  Stop Loss
                </label>
                <input
                  type="number"
                  value={positionParams.stopLoss}
                  onChange={(e) =>
                    updatePositionParams("stopLoss", e.target.value)
                  }
                  className="w-full bg-light-hover border border-danger/50 rounded px-2 py-1 text-sm text-danger focus:border-danger focus:outline-none font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs text-mid-text mb-1">
                  Take Profit
                </label>
                <input
                  type="number"
                  value={positionParams.takeProfit}
                  onChange={(e) =>
                    updatePositionParams("takeProfit", e.target.value)
                  }
                  className="w-full bg-light-hover border border-success/50 rounded px-2 py-1 text-sm text-success focus:border-success focus:outline-none font-semibold"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DerivChart;
