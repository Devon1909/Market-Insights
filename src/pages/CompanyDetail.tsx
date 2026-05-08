import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Plus, Info, Zap, ShieldAlert, Rocket, Loader2, Newspaper, TrendingUp, DollarSign, Globe, Building2, Bookmark } from 'lucide-react';
import { SankeyChart } from '../components/SankeyChart.tsx';
import { SnowflakeChart } from '../components/SnowflakeChart.tsx';
import { TradingViewChart } from '../components/TradingViewChart.tsx';
import { getCompanyAnalysis, CompanyNarrative } from '../services/geminiService.ts';
import { getMockCompanyDetails } from '../mockData.ts';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

export const CompanyDetail: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<CompanyNarrative | null>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('marketpulse_watchlist');
    const watchlist = saved ? JSON.parse(saved) : [];
    setIsWatchlisted(watchlist.some((item: any) => item.symbol === ticker));
  }, [ticker]);

  const toggleWatchlist = () => {
    const saved = localStorage.getItem('marketpulse_watchlist');
    let watchlist = saved ? JSON.parse(saved) : [];
    
    if (isWatchlisted) {
      watchlist = watchlist.filter((item: any) => item.symbol !== ticker);
    } else {
      watchlist.push({ symbol: ticker, name: financials?.overview?.Name || ticker });
    }
    
    localStorage.setItem('marketpulse_watchlist', JSON.stringify(watchlist));
    setIsWatchlisted(!isWatchlisted);
  };

  useEffect(() => {
    async function fetchData() {
      if (!ticker) return;
      setIsLoading(true);
      setError(null);
      
      try {
        // 1. Fetch real financial data from our proxy
        const [finRes, newsRes] = await Promise.all([
          axios.get(`/api/stocks/financials/${ticker}`).catch(err => {
            if (err.response?.status === 429) {
              return { data: { isDemo: true, ticker } };
            }
            throw err;
          }),
          axios.get(`/api/stocks/news/${ticker}`).catch(() => ({ data: { feed: [] } }))
        ]);
        
        let data = finRes.data;
        
        // Handle Fallback to Mock Data if Rate Limited
        if (data.isDemo) {
          setIsDemoMode(true);
          const mock = getMockCompanyDetails(ticker) || {
            ticker,
            name: `${ticker} (Demo)`,
            description: `We've reached the real-time data limit. This is a structural preview for ${ticker}. Please wait 60s to refresh real data.`,
            price: 150.00,
            change: 1.5,
            changePercent: 1.0,
            marketCap: '1.0T',
            industry: 'Technology',
            incomeStatement: { revenue: 100000, costOfRevenue: 60000, grossProfit: 40000, operatingExpenses: 20000, taxes: 5000, netIncome: 15000 },
            revenueFlow: [
              { source: "Total Revenue", target: "Cost of Revenue", value: 60000 },
              { source: "Total Revenue", target: "Gross Profit", value: 40000 },
              { source: "Gross Profit", target: "Operating Expenses", value: 20000 },
              { source: "Gross Profit", target: "Operating Income", value: 20000 },
              { source: "Operating Income", target: "Net Income", value: 15000 },
            ]
          };
          
          // Re-map to match the structure expected by the page
          data = {
            overview: {
              Symbol: ticker,
              Name: mock.name,
              Description: mock.description,
              Exchange: 'NASDAQ',
              MarketCapitalization: '1000000000000',
              PERatio: '25.4',
              EPS: '4.2',
              Sector: mock.industry
            },
            incomeStatement: {
              annualReports: [{
                totalRevenue: mock.incomeStatement?.revenue.toString(),
                costOfRevenue: mock.incomeStatement?.costOfRevenue.toString(),
                grossProfit: mock.incomeStatement?.grossProfit.toString(),
                operatingExpenses: mock.incomeStatement?.operatingExpenses.toString(),
                operatingIncome: (mock.incomeStatement?.grossProfit - mock.incomeStatement?.operatingExpenses).toString(),
                netIncome: mock.incomeStatement?.netIncome.toString()
              }]
            }
          };
        }

        if (!data.overview || !data.overview.Symbol) {
          throw new Error("Could not find financial records for this ticker.");
        }

        setFinancials(data);
        setNews(newsRes.data.feed || []);

        // 2. Use Gemini to analyze the raw data and generate the Snowflake scores
        const analysisRes = await getCompanyAnalysis(ticker, data);
        setAnalysis(analysisRes);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.response?.data?.error || err.message || "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [ticker]);

  // Generate Sankey flows from real income statement if available
  const revenueFlow = React.useMemo(() => {
    if (!financials?.incomeStatement?.annualReports?.[0]) return [];
    const report = financials.incomeStatement.annualReports[0];
    const rev = parseFloat(report.totalRevenue);
    const cost = parseFloat(report.costOfRevenue);
    const gross = parseFloat(report.grossProfit);
    const opEx = parseFloat(report.operatingExpenses);
    const opInc = parseFloat(report.operatingIncome);
    const net = parseFloat(report.netIncome);

    return [
      { source: "Total Revenue", target: "Cost of Revenue", value: cost },
      { source: "Total Revenue", target: "Gross Profit", value: gross },
      { source: "Gross Profit", target: "Operating Expenses", value: opEx },
      { source: "Gross Profit", target: "Operating Income", value: opInc },
      { source: "Operating Income", target: "Net Income", value: net },
    ];
  }, [financials]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p className="font-medium animate-pulse">Running Deep Financial Analysis for {ticker}...</p>
      </div>
    );
  }

  if (error || !financials) {
    const isRateLimit = error?.toLowerCase().includes("limit") || error?.toLowerCase().includes("reached");
    
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-100 p-12 rounded-3xl shadow-xl max-w-md text-center"
        >
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">
            {isRateLimit ? "Market Data Overload" : "Financial Data Not Found"}
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            {isRateLimit 
              ? "We've reached the free tier limit for market data (5 calls/minute). Please wait about 60 seconds and refresh."
              : error || "We couldn't retrieve valid financial statements for this ticker from our data provider."}
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all"
            >
              Refresh Analysis
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
          <p className="mt-8 text-[10px] text-slate-300 uppercase tracking-widest font-bold">
            Data Provider: Alpha Vantage
          </p>
        </motion.div>
      </div>
    );
  }

  const overview = financials.overview;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AnimatePresence>
        {isDemoMode && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Info size={20} />
              </div>
              <div>
                <p className="font-bold text-amber-900 text-sm">Demo Mode Active</p>
                <p className="text-amber-700 text-xs">Provider limit reached. Showing structural data for {ticker}. Check back in 1 minute for live financials.</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white border border-amber-200 text-amber-900 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors"
            >
              Retry Live
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft size={20} /> Back to Market
        </button>
        <div className="flex gap-3">
          <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <Share2 size={18} />
          </button>
          <button 
            onClick={toggleWatchlist}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              isWatchlisted 
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100' 
              : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {isWatchlisted ? <Bookmark size={18} fill="currentColor" /> : <Plus size={18} />}
            {isWatchlisted ? 'Watchlisted' : 'Watchlist'}
          </button>
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-4xl font-black text-slate-900">{overview.Symbol}</h1>
            <span className="text-xl text-slate-500 font-medium">{overview.Name}</span>
          </div>
          <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mb-8 line-clamp-3">
            {overview.Description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <Globe size={14} />
                <p className="text-[10px] uppercase tracking-widest font-bold">Exchange</p>
              </div>
              <p className="text-lg font-black text-slate-900">{overview.Exchange}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <DollarSign size={14} />
                <p className="text-[10px] uppercase tracking-widest font-bold">Market Cap</p>
              </div>
              <p className="text-lg font-black text-slate-900">${(parseInt(overview.MarketCapitalization) / 1e9).toFixed(1)}B</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <TrendingUp size={14} />
                <p className="text-[10px] uppercase tracking-widest font-bold">P/E Ratio</p>
              </div>
              <p className="text-lg font-black text-slate-900">{overview.PERatio || 'N/A'}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <Building2 size={14} />
                <p className="text-[10px] uppercase tracking-widest font-bold">EPS</p>
              </div>
              <p className="text-lg font-black text-slate-900">{overview.EPS || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-2 mb-6 z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">AI Snowflake Score</h3>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Calculated</span>
          </div>
          {analysis && <SnowflakeChart data={analysis.snowflake} size={240} showLabels />}
        </div>
      </div>

      {/* Chart Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between gap-2 mb-6">
          <h2 className="text-2xl font-black text-slate-900">Market Price</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">TradingView Live</span>
          </div>
        </div>
        <div className="bg-white p-4 border border-slate-100 rounded-3xl shadow-sm">
          <TradingViewChart ticker={overview.Symbol} />
        </div>
      </section>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Sankey Column */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-black text-slate-900">Revenue Flow</h2>
            <Info size={16} className="text-slate-300" />
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm h-[500px] flex items-center justify-center">
            {revenueFlow.length > 0 ? (
              <SankeyChart data={revenueFlow} />
            ) : (
              <div className="text-slate-400 text-center">
                Financial statements unavailable for visualization.
              </div>
            )}
          </div>
        </section>

        {/* AI Narrative Column */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-black text-slate-900">AI Deep Analysis</h2>
            <div className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">Gemini-3-Flash</div>
          </div>
          
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Zap size={64} />
                  </div>
                  <div className="flex items-center gap-3 mb-3 text-emerald-600">
                    <Zap size={20} />
                    <h4 className="font-bold uppercase text-xs tracking-wider">Valuation Hub</h4>
                  </div>
                  <p className="text-slate-600 leading-relaxed italic border-l-4 border-emerald-500 pl-4">
                    {analysis?.valuation}
                  </p>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-rose-600">
                    <ShieldAlert size={64} />
                  </div>
                  <div className="flex items-center gap-3 mb-3 text-rose-600">
                    <ShieldAlert size={20} />
                    <h4 className="font-bold uppercase text-xs tracking-wider">Potential Risks</h4>
                  </div>
                  <p className="text-slate-600 leading-relaxed border-l-4 border-rose-500 pl-4">
                    {analysis?.riskFactors}
                  </p>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-600">
                    <Rocket size={64} />
                  </div>
                  <div className="flex items-center gap-3 mb-3 text-indigo-600">
                    <Rocket size={20} />
                    <h4 className="font-bold uppercase text-xs tracking-wider">Future Trajectory</h4>
                  </div>
                  <p className="text-slate-600 leading-relaxed border-l-4 border-indigo-500 pl-4">
                    {analysis?.growthPotential}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* News Feed */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Newspaper size={24} className="text-indigo-500" />
          <h2 className="text-2xl font-black text-slate-900">Recent Coverage & Sentiment</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.length > 0 ? (
            news.slice(0, 6).map((item, i) => (
              <motion.a
                key={i}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                whileHover={{ y: -4 }}
                className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                    {item.source}
                  </span>
                  <span className="ml-auto text-[10px] text-slate-400 font-medium">
                    {new Date(item.time_published.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 mb-3 line-clamp-2 hover:text-emerald-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 mb-4">
                  {item.summary}
                </p>
                <div className="mt-auto flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    item.overall_sentiment_label.toLowerCase().includes('bullish') ? 'bg-emerald-500' : 
                    item.overall_sentiment_label.toLowerCase().includes('bearish') ? 'bg-rose-500' : 'bg-slate-300'
                  }`} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {item.overall_sentiment_label}
                  </span>
                </div>
              </motion.a>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
              <p className="text-slate-400 font-medium italic">No recent news available for this ticker.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
