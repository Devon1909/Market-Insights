import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import { MOCK_STOCKS } from '../mockData.ts';
import { StockCard } from '../components/StockCard.tsx';
import { motion } from 'motion/react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredStocks = MOCK_STOCKS.filter(s => 
    s.ticker.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

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
        
        <div className="relative max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="text-slate-400" size={20} />
          </div>
          <input
            type="text"
            placeholder="Search Apple, Tesla, Nvidia..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Market Heatmap / Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'S&P 500', value: '5,123.42', change: '+1.2%', icon: Activity, color: 'text-emerald-500' },
          { label: 'Nasdaq', value: '16,274.94', change: '+1.5%', icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Market Volatility', value: '12.42', change: '-4.2%', icon: BarChart3, color: 'text-rose-500' },
          { label: 'Sector Focus', value: 'Tech', change: 'Lead', icon: PieChart, color: 'text-slate-500' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <stat.icon size={16} className={stat.color} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-900">{stat.value}</span>
              <span className={`text-xs font-bold ${stat.color}`}>{stat.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredStocks.map((stock) => (
          <StockCard 
            key={stock.ticker} 
            stock={stock} 
            onClick={(ticker) => navigate(`/company/${ticker}`)} 
          />
        ))}
      </div>
      
      {filteredStocks.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          No stocks found matching "{search}"
        </div>
      )}
    </div>
  );
};
