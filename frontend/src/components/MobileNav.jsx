import React from 'react';
import { LayoutDashboard, FileQuestion, Zap, MessageSquareText, User } from 'lucide-react';

export default function MobileNav({ currentTab, setTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'mock-test', label: 'Mock Test', icon: FileQuestion },
    { id: 'revision', label: 'Revision', icon: Zap },
    { id: 'qa-chat', label: 'Q&A', icon: MessageSquareText },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-full ${isActive ? 'bg-blue-50' : ''}`}>
              <Icon size={20} className={isActive ? 'text-blue-600 stroke-[2.4]' : 'stroke-[1.8]'} />
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
