import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, BarChart3, PieChart, Activity, Loader2 } from 'lucide-react';
import { MOCK_STOCKS } from '../mockData.ts';
import { StockCard } from '../components/StockCard.tsx';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (search.length >= 2) {
        setIsSearching(true);
        try {
          const response = await axios.get(`/api/stocks/search?keywords=${search}`);
          if (response.data.bestMatches) {
            setSearchResults(response.data.bestMatches);
          }
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

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
        <p className="text-slate-500 mb-8 text-lg max-w-2xl mx-auto">
          Turn complex financial data into intuitive visual stories. Search for any US-listed stock to begin your analysis.
        </p>
        
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
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <TrendingUp className="text-emerald-500" size={20} />
        Featured Market Insights
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {MOCK_STOCKS.map((stock) => (
          <StockCard 
            key={stock.ticker} 
            stock={stock} 
            onClick={(ticker) => navigate(`/company/${ticker}`)} 
          />
        ))}
      </div>
    </div>
  );
};
