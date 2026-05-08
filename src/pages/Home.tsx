import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, BarChart3, PieChart, Activity, Loader2, Bookmark } from 'lucide-react';
import { MOCK_STOCKS } from '../mockData.ts';
import { StockCard } from '../components/StockCard.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { getMarketPulse } from '../services/geminiService.ts';
import axios from 'axios';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [apiStatus, setApiStatus] = useState({ alphaVantage: false, gemini: false });
  const [marketPulse, setMarketPulse] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/status').then(res => setApiStatus(res.data)).catch(() => {});
    
    // Fetch Market Pulse on load
    getMarketPulse().then(setMarketPulse).catch(() => {});

    // Load watchlist from localStorage
    const saved = localStorage.getItem('marketpulse_watchlist');
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse watchlist");
      }
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (search.length >= 2) {
        setIsSearching(true);
        try {
          const response = await axios.get(`/api/stocks/search?keywords=${search}`);
          console.log("Search results:", response.data);
          if (response.data.bestMatches) {
            setSearchResults(response.data.bestMatches);
          } else if (response.data.Note || response.data.Information) {
            console.warn("API Note:", response.data.Note || response.data.Information);
          }
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Search */}
      <div className="mb-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight"
        >
          Visual Financial Intelligence.
        </motion.h1>
        
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
            <div className={`w-2 h-2 rounded-full ${apiStatus.alphaVantage ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {apiStatus.alphaVantage ? 'Alpha Vantage Connected' : 'Demo Mode (Limited)'}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
            <div className={`w-2 h-2 rounded-full ${apiStatus.gemini ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Gemini AI: {apiStatus.gemini ? 'Active' : 'Offline'}
            </span>
          </div>
        </div>

        <p className="text-slate-500 mb-8 text-lg max-w-2xl mx-auto">
          Turn complex financial data into intuitive visual stories. Search for any US-listed stock to begin your analysis.
        </p>

        {marketPulse && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto mb-12 p-1 bg-gradient-to-r from-emerald-100 to-indigo-100 rounded-3xl"
          >
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[calc(1.5rem-4px)] border border-white/50 text-left">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <Activity size={16} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Daily Market Pulse</h3>
                <span className="ml-auto text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">May 2026</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed font-medium italic">
                "{marketPulse}"
              </p>
            </div>
          </motion.div>
        )}
        
        <div className="relative max-w-xl mx-auto z-50">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            {isSearching ? <Loader2 className="text-emerald-500 animate-spin" size={20} /> : <Search className="text-slate-400" size={20} />}
          </div>
          <input
            type="text"
            placeholder="Search Apple, Tesla, Nvidia..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden text-left"
              >
                {searchResults.map((match: any) => (
                  <button
                    key={match['1. symbol']}
                    onClick={() => navigate(`/company/${match['1. symbol']}`)}
                    className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{match['1. symbol']}</span>
                      <p className="text-xs text-slate-400 font-medium">{match['2. name']}</p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-1 rounded uppercase tracking-wider">
                      {match['4. region']}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Featured Stocks */}
      <div className="flex flex-col md:flex-row gap-12">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={20} />
            Featured Market Insights
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
            {MOCK_STOCKS.map((stock) => (
              <StockCard 
                key={stock.ticker} 
                stock={stock} 
                onClick={(ticker) => navigate(`/company/${ticker}`)} 
              />
            ))}
          </div>
        </div>

        {watchlist.length > 0 && (
          <div className="w-full md:w-80">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Bookmark className="text-indigo-500" size={20} />
              Your Watchlist
            </h2>
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className="space-y-4">
                {watchlist.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => navigate(`/company/${item.symbol}`)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-colors text-left border border-transparent hover:border-slate-100"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{item.symbol}</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.name}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                      <BarChart3 size={16} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
