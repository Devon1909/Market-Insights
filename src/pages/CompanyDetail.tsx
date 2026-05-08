import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Plus, Info, Zap, ShieldAlert, Rocket, Loader2 } from 'lucide-react';
import { SankeyChart } from '../components/SankeyChart.tsx';
import { SnowflakeChart } from '../components/SnowflakeChart.tsx';
import { TradingViewChart } from '../components/TradingViewChart.tsx';
import { getCompanyAnalysis, CompanyNarrative } from '../services/geminiService.ts';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

export const CompanyDetail: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<CompanyNarrative | null>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!ticker) return;
      setIsLoading(true);
      setError(null);
      
      try {
        // 1. Fetch real financial data from our proxy
        const finRes = await axios.get(`/api/stocks/financials/${ticker}`);
        const data = finRes.data;

        if (!data.overview || !data.overview.Symbol) {
          throw new Error("Could not find financial records for this ticker.");
        }

        setFinancials(data);

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
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Oops! Analysis Failed</h2>
          <p className="text-slate-500">{error || "The Alpha Vantage API limit might have been reached (5 calls/min for free keys)."}</p>
        </div>
        <button onClick={() => navigate('/')} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold shadow-lg">
          Try Another Stock
        </button>
      </div>
    );
  }

  const overview = financials.overview;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-slate-800 transition-colors">
            <Plus size={18} /> Watchlist
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Exchange</p>
              <p className="text-lg font-black text-slate-900">{overview.Exchange}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Market Cap</p>
              <p className="text-lg font-black text-slate-900">${(parseInt(overview.MarketCapitalization) / 1e9).toFixed(1)}B</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Sector / Industry</p>
              <p className="text-lg font-bold text-slate-900 truncate">{overview.Sector}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">AI Snowflake Score</h3>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Calculated</span>
          </div>
          {analysis && <SnowflakeChart data={analysis.snowflake} size={240} showLabels />}
        </div>
      </div>

      {/* Chart Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between gap-2 mb-6">
          <h2 className="text-2xl font-black text-slate-900">Price Dynamics</h2>
          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">TradingView Live</span>
        </div>
        <TradingViewChart ticker={overview.Symbol} />
      </section>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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
            <div className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Gemini Insights</div>
          </div>
          
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3 text-emerald-600">
                    <Zap size={20} />
                    <h4 className="font-bold uppercase text-xs tracking-wider">Valuation Hub</h4>
                  </div>
                  <p className="text-slate-600 leading-relaxed italic border-l-4 border-emerald-500 pl-4">
                    {analysis?.valuation}
                  </p>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3 text-rose-600">
                    <ShieldAlert size={20} />
                    <h4 className="font-bold uppercase text-xs tracking-wider">Potential Risks</h4>
                  </div>
                  <p className="text-slate-600 leading-relaxed border-l-4 border-rose-500 pl-4">
                    {analysis?.riskFactors}
                  </p>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
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
    </div>
  );
};
