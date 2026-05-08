import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Plus, Info, Zap, ShieldAlert, Rocket } from 'lucide-react';
import { getMockCompanyDetails } from '../mockData.ts';
import { SankeyChart } from '../components/SankeyChart.tsx';
import { SnowflakeChart } from '../components/SnowflakeChart.tsx';
import { TradingViewChart } from '../components/TradingViewChart.tsx';
import { getCompanyNarrative, CompanyNarrative } from '../services/geminiService.ts';
import { motion, AnimatePresence } from 'motion/react';

export const CompanyDetail: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [narrative, setNarrative] = useState<CompanyNarrative | null>(null);
  const [isLoadingNarrative, setIsLoadingNarrative] = useState(false);

  const company = useMemo(() => ticker ? getMockCompanyDetails(ticker) : undefined, [ticker]);

  useEffect(() => {
    if (company) {
      setIsLoadingNarrative(true);
      getCompanyNarrative(company.ticker, company.description)
        .then(res => {
          setNarrative(res);
          setIsLoadingNarrative(false);
        });
    }
  }, [company]);

  if (!company) return <div className="p-20 text-center">Company not found.</div>;

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
            <h1 className="text-4xl font-black text-slate-900">{company.ticker}</h1>
            <span className="text-xl text-slate-500 font-medium">{company.name}</span>
          </div>
          <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mb-8">
            {company.description}
          </p>

          <div className="grid grid-cols-3 gap-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Current Price</p>
              <p className="text-2xl font-black text-slate-900">${company.price}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Market Cap</p>
              <p className="text-2xl font-black text-slate-900">{company.marketCap}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Industry</p>
              <p className="text-lg font-bold text-slate-900 truncate">{company.industry}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Stock Snowflake</h3>
          <SnowflakeChart data={company.snowflake} size={240} showLabels />
        </div>
      </div>

      {/* Chart Section */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-black text-slate-900">Market Performance</h2>
          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Live Feed</span>
        </div>
        <TradingViewChart ticker={company.ticker} />
      </section>

      {/* Deep Analysis Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Sankey Column */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-black text-slate-900">Revenue Flow</h2>
            <Info size={16} className="text-slate-300" />
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm h-[500px] flex items-center justify-center">
            <SankeyChart data={company.revenueFlow} />
          </div>
        </section>

        {/* AI Narrative Column */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-black text-slate-900">AI Financial Narrative</h2>
            <div className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Gemini 3.1 Pro</div>
          </div>
          
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {isLoadingNarrative ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3 text-emerald-600">
                      <Zap size={20} />
                      <h4 className="font-bold uppercase text-xs tracking-wider">Valuation Analysis</h4>
                    </div>
                    <p className="text-slate-600 leading-relaxed italic border-l-4 border-emerald-500 pl-4">
                      {narrative?.valuation}
                    </p>
                  </div>

                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3 text-rose-600">
                      <ShieldAlert size={20} />
                      <h4 className="font-bold uppercase text-xs tracking-wider">Risk Factors</h4>
                    </div>
                    <p className="text-slate-600 leading-relaxed border-l-4 border-rose-500 pl-4">
                      {narrative?.riskFactors}
                    </p>
                  </div>

                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3 text-indigo-600">
                      <Rocket size={20} />
                      <h4 className="font-bold uppercase text-xs tracking-wider">Growth Potential</h4>
                    </div>
                    <p className="text-slate-600 leading-relaxed border-l-4 border-indigo-500 pl-4">
                      {narrative?.growthPotential}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
};
