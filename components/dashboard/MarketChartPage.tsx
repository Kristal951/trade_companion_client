
import React, { useEffect, useRef, useState } from 'react';
import DerivChart from './DerivChart';
import Icon from '../ui/Icon';

// This tells TypeScript that we're expecting TradingView to be in the global scope
declare const TradingView: any;

interface MarketChartPageProps {
  theme: 'light' | 'dark';
}

const MarketChartPage: React.FC<MarketChartPageProps> = ({ theme }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<'standard' | 'deriv'>('standard');

  useEffect(() => {
    // Only initialize TradingView widget if we are in 'standard' mode
    if (chartType === 'standard') {
        if (typeof TradingView === 'undefined' || !chartContainerRef.current) return;

        chartContainerRef.current.innerHTML = '';

        new TradingView.widget({
        autosize: true,
        symbol: "OANDA:XAUUSD",
        interval: "15",
        timezone: "Etc/UTC",
        theme: theme,
        style: "1",
        locale: "en",
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: "tv_chart_container",
        toolbar_bg: theme === 'dark' ? '#1f2937' : '#f3f4f6',
        hide_side_toolbar: false,
        });
    }
  }, [theme, chartType]);

  return (
    <div className="w-full h-full bg-light-bg flex flex-col overflow-hidden">
      {/* Header / Switcher */}
      <div className="p-4 border-b border-light-gray flex items-center justify-between bg-light-surface shadow-sm z-10 flex-shrink-0">
          <div className="flex space-x-2">
              <button 
                onClick={() => setChartType('standard')}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${chartType === 'standard' ? 'bg-primary text-white shadow-md' : 'text-mid-text hover:bg-light-hover'}`}
              >
                  <Icon name="chart-bar" className="w-4 h-4 mr-2" />
                  Forex & Crypto (TV)
              </button>
              <button 
                onClick={() => setChartType('deriv')}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${chartType === 'deriv' ? 'bg-accent text-white shadow-md' : 'text-mid-text hover:bg-light-hover'}`}
              >
                  <Icon name="signals" className="w-4 h-4 mr-2" />
                  Synthetics (Deriv)
              </button>
          </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        {chartType === 'standard' ? (
            <div className="w-full h-full p-4">
                <div className="relative w-full h-full border border-light-gray rounded-lg shadow-sm overflow-hidden bg-light-surface">
                     <div id="tv_chart_container" ref={chartContainerRef} className="w-full h-full"></div>
                </div>
            </div>
        ) : (
            <div className="w-full h-full p-0">
                <DerivChart theme={theme} />
            </div>
        )}
      </div>
    </div>
  );
};

export default MarketChartPage;