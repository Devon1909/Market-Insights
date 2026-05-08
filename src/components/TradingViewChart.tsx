import React, { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  ticker: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({ ticker }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let tvWidget: any = null;
    const containerId = `tradingview_${ticker}`;
    
    const initWidget = () => {
      if (window.TradingView && containerRef.current) {
        tvWidget = new window.TradingView.widget({
          autosize: true,
          symbol: ticker.includes(':') ? ticker : `NASDAQ:${ticker}`,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerId,
        });
      }
    };

    if (!document.getElementById('tradingview-widget-script')) {
      const script = document.createElement('script');
      script.id = 'tradingview-widget-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = initWidget;
      document.head.append(script);
    } else {
      if (window.TradingView) {
        initWidget();
      } else {
        const script = document.getElementById('tradingview-widget-script');
        if (script) {
          script.addEventListener('load', initWidget);
        }
      }
    }

    return () => {
      const script = document.getElementById('tradingview-widget-script');
      if (script) {
        script.removeEventListener('load', initWidget);
      }
    };
  }, [ticker]);

  return (
    <div className="h-[400px] w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
      <div id={`tradingview_${ticker}`} ref={containerRef} className="h-full w-full" />
    </div>
  );
};
