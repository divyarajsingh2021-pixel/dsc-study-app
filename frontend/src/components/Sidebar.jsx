import React from 'react';
import { 
  LayoutDashboard, 
  FileQuestion, 
  Zap, 
  MessageSquareText, 
  Settings,
  GraduationCap,
  Sparkles,
  User,
  LogOut
} from 'lucide-react';

import DscLogo from './DscLogo';

export default function Sidebar({ currentTab, setTab, healthInfo, currentUser, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'mock-test', label: 'Generate Mock Test', icon: FileQuestion },
    { id: 'revision', label: 'One-Shot Revision', icon: Zap },
    { id: 'qa-chat', label: 'Q&A Chat (RAG)', icon: MessageSquareText },
    { id: 'account', label: 'Account & Users', icon: User },
    { id: 'settings', label: 'LLM & Settings', icon: Settings },
  ];

  const providerLabel = healthInfo?.active_provider 
    ? (healthInfo.active_provider === 'ollama' ? 'Ollama Local' : healthInfo.active_provider === 'groq' ? 'Groq Cloud' : 'Local Heuristic')
    : 'Local Engine';

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#090d16] text-slate-400 min-h-screen border-r border-slate-800/80 flex-shrink-0 select-none">
      {/* Brand Header with DSC Monogram */}
      <div className="p-5 border-b border-slate-800/80">
        <DscLogo size={42} showText={true} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Study Tools
          </span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white font-semibold shadow-lg shadow-blue-500/25 border-l-4 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-cyan-300' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User info & Logout */}
      {currentUser && (
        <div className="p-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
            <div 
              onClick={() => setTab('account')}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
              title="View Account"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {currentUser.name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">@{currentUser.username}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors"
              title="Log Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Footer / System Status */}
      <div className="p-4 border-t border-slate-800/80 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-[11px] font-medium">Provider Status</span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
        <div className="bg-slate-800/60 rounded-md p-2 flex items-center gap-2 text-slate-300">
          <Sparkles size={14} className="text-blue-400 shrink-0" />
          <span className="truncate text-[11px] font-medium">{providerLabel}</span>
        </div>
      </div>
    </aside>
  );
}
