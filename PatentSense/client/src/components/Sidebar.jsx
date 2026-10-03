import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../utils/api';
import {
  LayoutDashboard,
  PlusCircle,
  FolderGit2,
  BookOpen,
  Search,
  FileText,
  Bookmark,
  HelpCircle,
  Settings,
  ShieldCheck,
  LogOut,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const mainNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'New Analysis', path: '/new-analysis', icon: PlusCircle },
    { name: 'My Analyses', path: '/my-analyses', icon: FolderGit2 },
    { name: 'Patent Library', path: '/patent-library', icon: BookOpen },
    { name: 'Similarity Search', path: '/similarity-search', icon: Search },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Saved Patents', path: '/saved-patents', icon: Bookmark }
  ];

  return (
    <aside className="w-64 bg-[#0A0A0A] border-r border-[#262626] flex flex-col h-screen sticky top-0 z-20 no-print text-[#D4D4D4] select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#262626] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black">
          <Sparkles className="w-5 h-5 fill-black text-black" />
        </div>
        <div>
          <span className="font-display font-extrabold text-lg text-white tracking-tight block">PATENTSENSE</span>
          <span className="text-[10px] block text-[#A3A3A3] font-semibold uppercase tracking-widest">Patent Intelligence</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <div className="px-3 text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-2">Main Menu</div>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path) || (item.path === '/dashboard' && location.pathname === '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-150 ${
                active
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'text-[#A3A3A3] hover:bg-[#1A1A1A] hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-black' : 'text-[#666666]'}`} />
              {item.name}
            </Link>
          );
        })}

        {/* Conditional Admin Section */}
        {user?.role === 'admin' && (
          <div className="pt-4 mt-4 border-t border-[#262626] space-y-1">
            <span className="px-3 text-[10px] font-bold text-[#666666] uppercase tracking-widest block mb-2">Administration</span>
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-150 ${
                isActive('/admin')
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'text-[#A3A3A3] hover:bg-[#1A1A1A] hover:text-white'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${isActive('/admin') ? 'text-black' : 'text-[#666666]'}`} />
              Admin Console
            </Link>
          </div>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-[#262626] space-y-1">
        <a
          href="#help"
          onClick={(e) => { e.preventDefault(); alert("PatentSense Support & FAQ: Contact support@patentsense.ai"); }}
          className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#A3A3A3] hover:bg-[#1A1A1A] hover:text-white transition-all"
        >
          <HelpCircle className="w-4 h-4 text-[#666666]" />
          Help & Support
        </a>

        <Link
          to="/settings"
          className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            isActive('/settings') || isActive('/profile') ? 'bg-[#262626] text-white' : 'text-[#A3A3A3] hover:bg-[#1A1A1A] hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 text-[#666666]" />
          Settings
        </Link>

        {/* User Profile Summary */}
        <div className="pt-2 border-t border-[#262626] flex items-center justify-between px-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#262626] border border-[#404040] flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'User'}</p>
              <p className="text-[10px] text-[#666666] truncate">{user?.organization || 'Patent Attorney'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-lg text-[#666666] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
