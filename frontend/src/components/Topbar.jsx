import React from 'react';
import { Settings, RefreshCw, Sparkles } from 'lucide-react';
import DscLogo from './DscLogo';

export default function Topbar({ title, onOpenSettings, onOpenAccount, onRefresh, healthInfo, isRefreshing, currentUser, onLogout }) {
  // Format formatted date matching ERP style (e.g. Tuesday, Sep 15, 2026)
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const providerName = healthInfo?.active_provider === 'ollama'
    ? 'Ollama (Local)'
    : healthInfo?.active_provider === 'groq'
    ? 'Groq (Cloud)'
    : 'Local Engine';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-7 py-3 flex items-center justify-between shadow-sm">
      {/* Left: Mobile Brand & Desktop Page Title */}
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <DscLogo size={32} showText={true} />
        </div>
        <div className="hidden md:flex items-center gap-2.5">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Date Chip & Utility Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200/80">
          <span>{todayStr}</span>
        </div>

        {/* Active Provider Chip */}
        <div 
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-full text-xs font-semibold border border-blue-200 cursor-pointer transition-colors"
          title="Click to configure AI providers"
        >
          <Sparkles size={13} className="text-blue-600" />
          <span className="hidden xs:inline">{providerName}</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          title="Refresh Data"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          title="AI & LLM Settings"
        >
          <Settings size={17} />
        </button>

        {/* User Profile Chip */}
        {currentUser && (
          <div 
            onClick={onOpenAccount}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer group"
            title="My Account & Change Password"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
              {currentUser.name?.charAt(0) || 'U'}
            </div>
            <span className="hidden lg:inline text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
              {currentUser.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
