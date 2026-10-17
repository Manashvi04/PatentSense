import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Bell, CheckCircle2 } from 'lucide-react';
import Button from './Button';

export default function Topbar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleGlobalSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/patent-library?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="h-16 border-b border-[#262626] bg-[#0A0A0A] px-8 flex items-center justify-between z-10 sticky top-0 no-print text-[#D4D4D4]">
      {/* Title & Greeting */}
      <div>
        <h2 className="font-display font-bold text-sm text-white">
          {getGreeting()}, <span className="text-[#A3A3A3] font-normal">{user?.fullName || 'Researcher'}</span>
        </h2>
        <p className="text-[11px] text-[#666666]">Analyze patent novelty and discover relevant prior art.</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Quick Search */}
        <div className="hidden lg:flex items-center relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#666666]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleGlobalSearch}
            placeholder="Search patents or IPC codes..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#262626] bg-[#111111] text-white text-xs placeholder-[#525252] outline-none focus:border-white focus:ring-1 focus:ring-white/20"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-xl border border-[#262626] bg-[#111111] text-[#A3A3A3] hover:text-white hover:border-[#404040] transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white" />
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#262626] bg-[#111111] shadow-2xl p-4 space-y-3 z-50 text-xs">
              <div className="flex justify-between items-center border-b border-[#262626] pb-2 font-bold text-white">
                <span>Notifications</span>
                <span className="text-[10px] text-[#666666]">System</span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl border border-[#262626] bg-[#1A1A1A] space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Analysis Complete</span>
                  </div>
                  <p className="text-[11px] text-[#A3A3A3]">AI Medical Imaging System report is ready for download.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA */}
        {location.pathname !== '/new-analysis' && location.pathname !== '/search' && (
          <Link to="/new-analysis">
            <Button variant="primary" size="sm" icon={Plus}>
              New Patent Analysis
            </Button>
          </Link>
        )}

        {/* Profile Avatar */}
        <Link to="/settings" className="flex items-center gap-2 border-l border-[#262626] pl-4">
          <div className="w-8 h-8 rounded-full bg-white text-black font-black flex items-center justify-center text-xs">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <span className="block text-xs font-semibold text-white">{user?.fullName || 'User'}</span>
            <span className="block text-[10px] text-[#666666]">{user?.email}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
