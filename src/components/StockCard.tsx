import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';
import { StockData } from '../types.ts';
import { SnowflakeChart } from './SnowflakeChart.tsx';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StockCardProps {
  stock: StockData;
  onClick: (ticker: string) => void;
}

export const StockCard: React.FC<StockCardProps> = ({ stock, onClick }) => {
  const isPositive = stock.change >= 0;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
      onClick={() => onClick(stock.ticker)}
      className="bg-white border border-slate-100 rounded-2xl p-5 cursor-pointer transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-slate-900">{stock.ticker}</h3>
          <p className="text-xs text-slate-500 truncate max-w-[120px]">{stock.name}</p>
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
          isPositive ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
        )}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isPositive ? '+' : ''}{stock.changePercent}%
        </div>
      </div>

      <div className="flex flex-col items-center">
        <SnowflakeChart data={stock.snowflake} size={120} />
        <div className="mt-4 text-center">
          <span className="text-lg font-bold text-slate-800">${stock.price}</span>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-medium">
            Market Cap: {stock.marketCap}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
