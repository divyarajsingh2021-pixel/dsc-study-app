import React from 'react';

export default function StatCard({ title, value, subtitle, color = 'blue', icon: Icon }) {
  const colorClassMap = {
    blue: 'stat-blue',
    green: 'stat-green',
    amber: 'stat-amber',
    red: 'stat-red',
    purple: 'stat-purple',
  };

  const iconBgMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-rose-50 text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className={`stat-card ${colorClassMap[color] || 'stat-blue'} p-4 sm:p-5 flex flex-col justify-between`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-md ${iconBgMap[color] || 'bg-blue-50 text-blue-600'}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="mt-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </span>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
