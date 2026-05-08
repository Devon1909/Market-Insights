/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home.tsx';
import { CompanyDetail } from './pages/CompanyDetail.tsx';
import { Activity, LayoutDashboard, Filter, Bookmark, Settings } from 'lucide-react';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
        {/* Navigation Rail */}
        <nav className="fixed top-0 left-0 bottom-0 w-20 bg-white border-r border-slate-100 flex flex-col items-center py-8 z-50">
          <Link to="/" className="mb-12 group">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
              <Activity size={24} strokeWidth={3} />
            </div>
          </Link>
          
          <div className="flex flex-col gap-8 flex-1">
            <Link to="/" className="text-slate-400 hover:text-emerald-500 transition-colors">
              <LayoutDashboard size={24} />
            </Link>
            <button className="text-slate-400 hover:text-emerald-500 transition-colors">
              <Filter size={24} />
            </button>
            <button className="text-slate-400 hover:text-emerald-500 transition-colors">
              <Bookmark size={24} />
            </button>
          </div>

          <button className="text-slate-400 hover:text-slate-900 transition-colors mt-auto">
            <Settings size={24} />
          </button>
        </nav>

        {/* Main Content */}
        <main className="pl-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/company/:ticker" element={<CompanyDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

