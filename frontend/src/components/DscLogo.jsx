import React from 'react';

export default function DscLogo({ size = 38, showText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Sleek Futuristic DSC Monogram Emblem */}
      <div 
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0b132b] via-[#1c2541] to-[#0b132b] border border-cyan-500/40 shadow-lg shadow-cyan-500/20 shrink-0 group overflow-hidden"
      >
        {/* Ambient subtle glow pulse */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Dynamic DSC Monogram SVG */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-4/5 h-4/5 relative z-10 drop-shadow-[0_2px_8px_rgba(56,189,248,0.5)]"
        >
          <defs>
            <linearGradient id="dscSymbolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
            <linearGradient id="dscEdgeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Hexagonal Tech Outline */}
          <polygon 
            points="50,6 88,28 88,72 50,94 12,72 12,28" 
            fill="none" 
            stroke="url(#dscEdgeGrad)" 
            strokeWidth="3.5" 
            strokeDasharray="6 3"
            opacity="0.6"
          />

          {/* Central Bold "DSC" Lettermark */}
          <text 
            x="50" 
            y="61" 
            textAnchor="middle" 
            fontSize="32" 
            fontWeight="900" 
            letterSpacing="1"
            fill="url(#dscSymbolGrad)"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            DSC
          </text>
        </svg>

        {/* Small corner tech accent */}
        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-cyan-400 rounded-bl-sm opacity-80"></div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black tracking-tight text-white flex items-center">
              DSC
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-400/30 text-cyan-300 uppercase tracking-wider">
              STUDY AI
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
            Intelligent Exam Suite
          </span>
        </div>
      )}
    </div>
  );
}
