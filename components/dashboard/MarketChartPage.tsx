import React, { useEffect, useRef, useState } from 'react';

// This tells TypeScript that we're expecting TradingView to be in the global scope
// from the script tag we've added to index.html.
declare const TradingView: any;

interface MarketChartPageProps {
  theme: 'light' | 'dark';
}

// Define the symbols and their display names for the tabs
const chartSymbols = [
    { name: 'Gold (XAU/USD)', symbol: 'OANDA:XAUUSD' },
    { name: 'Silver (XAG/USD)', symbol: 'OANDA:XAGUSD' },
    { name: 'Nasdaq 100', symbol: 'OANDA:NAS100USD' },
    { name: 'Bitcoin (BTC/USDT)', symbol: 'BINANCE:BTCUSDT' },
];


/**
 * A React component that embeds the TradingView Advanced Chart Widget.
 * It includes custom tabs to switch between different financial instruments.
 */
const MarketChartPage: React.FC<MarketChartPageProps> = ({ theme }) => {
  // A ref to hold the DOM element where the chart will be mounted.
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // State to manage the currently active symbol and its display name.
  const [activeSymbol, setActiveSymbol] = useState(chartSymbols[0].symbol);
  const [activeSymbolName, setActiveSymbolName] = useState(chartSymbols[0].name);

  /**
   * This useEffect hook is responsible for creating and re-creating the TradingView widget
   * whenever the active symbol or the application theme changes.
   */
  useEffect(() => {
    // Exit if the TradingView script isn't loaded yet or the container isn't rendered.
    if (typeof TradingView === 'undefined' || !chartContainerRef.current) {
      return;
    }

    // Clear any previous widget instance from the container before creating a new one.
    // This is necessary because the free widget doesn't have an API to update its symbol.
    chartContainerRef.current.innerHTML = '';

    // Configuration object for the TradingView widget.
    // See TradingView documentation for more options.
    const widgetOptions = {
      // Makes the chart fill its container.
      autosize: true,
      // The financial instrument to display.
      symbol: activeSymbol,
      // Default timeframe set to 15 minutes.
      interval: "15",
      // Timezone for the chart.
      timezone: "Etc/UTC",
      // Set the theme based on the app's current theme.
      theme: theme,
      // Visual style of the chart.
      style: "1",
      // Language of the chart UI.
      locale: "en",
      // Disable the "Publish" button.
      enable_publishing: false,
      // Allow users to change the symbol from within the chart's UI.
      allow_symbol_change: true,
      // The ID of the container div where the widget will be rendered.
      container_id: "tv_chart_container"
    };

    // Instantiate the widget.
    new TradingView.widget(widgetOptions);

  // The hook re-runs whenever 'activeSymbol' or 'theme' changes.
  }, [activeSymbol, theme]);

  // Handler for when a user clicks on a tab.
  const handleTabClick = (symbol: string, name: string) => {
    setActiveSymbol(symbol);
    setActiveSymbolName(name);
  };

  return (
    <div className="p-8 bg-light-bg h-full flex flex-col">
      {/* Dynamic heading that updates based on the selected tab */}
      <h1 className="text-3xl font-bold mb-4 text-dark-text">{activeSymbolName} Live Chart</h1>
      
      {/* Custom tabs for switching symbols */}
      <div className="flex space-x-1 mb-4 border-b border-light-gray flex-wrap">
          {chartSymbols.map(item => (
              <button 
                  key={item.symbol} 
                  onClick={() => handleTabClick(item.symbol, item.name)}
                  className={`px-4 py-2 font-semibold text-sm transition-colors rounded-t-md ${
                      activeSymbol === item.symbol 
                          // Active tab styling
                          ? 'bg-light-surface border-light-gray border-t border-l border-r -mb-px text-primary' 
                          // Inactive tab styling
                          : 'text-mid-text hover:bg-light-hover'
                  }`}
              >
                  {item.name}
              </button>
          ))}
      </div>

      {/* Container for the TradingView widget */}
      <div className="flex-grow w-full h-full border border-light-gray rounded-lg shadow-sm" style={{ minHeight: '600px' }}>
        <div id="tv_chart_container" ref={chartContainerRef} className="w-full h-full"></div>
      </div>
    </div>
  );
};

export default MarketChartPage;
