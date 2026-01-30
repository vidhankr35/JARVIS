
import React, { useState, useEffect } from 'react';
import { User, JarvisTheme } from '../types';
import { THEMES } from '../constants';

interface HeaderProps {
  speaking?: boolean;
  listening?: boolean;
  user: User;
  theme: JarvisTheme;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ speaking, listening, user, theme, onLogout }) => {
  const [cpuLoad, setCpuLoad] = useState('12%');
  const themeColors = THEMES[theme];
  
  useEffect(() => {
    const interval = setInterval(() => {
      const load = Math.floor(Math.random() * (speaking ? 20 : 5)) + (speaking ? 50 : 8);
      setCpuLoad(`${load}%`);
    }, 2000);
    return () => clearInterval(interval);
  }, [speaking]);

  return (
    <header className="h-24 border-b border-white/5 glass flex items-center justify-between px-10 z-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] opacity-40" style={{ background: `linear-gradient(90deg, transparent, ${themeColors.primary}, transparent)` }} />
      
      <div className="flex items-center gap-8">
        <div className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${speaking ? 'scale-110' : ''}`} style={{ borderColor: themeColors.primary, boxShadow: speaking ? `0 0 25px ${themeColors.glow}` : 'none' }}>
          <div className={`w-6 h-6 rounded-full blur-[3px] transition-all duration-300 ${speaking ? 'animate-ping' : ''}`} style={{ backgroundColor: themeColors.primary }} />
          <div className={`absolute inset-0 border border-white/10 rounded-full ${speaking ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-[0.3em] mono uppercase" style={{ color: themeColors.primary }}>J.A.R.V.I.S.</h1>
          <div className="flex items-center gap-2">
            <span className="text-[8px] mono opacity-40 uppercase tracking-widest">Protocol</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full mono font-bold border" style={{ color: themeColors.accent, borderColor: `${themeColors.accent}33`, backgroundColor: `${themeColors.accent}11` }}>
              {theme}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-16 text-[11px] mono items-center">
        <div className="hidden xl:flex gap-10 border-r border-white/5 pr-10">
          <div className="flex flex-col items-end">
            <span className="text-[8px] opacity-30 uppercase">CPU_COGNITION</span>
            <span className="font-bold tabular-nums" style={{ color: themeColors.primary }}>{cpuLoad}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] opacity-30 uppercase">Uptime</span>
            <span className="font-bold" style={{ color: themeColors.primary }}>04:22:12:08</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold" style={{ color: themeColors.primary }}>{user.username.toUpperCase()}</span>
            <span className="text-[8px] opacity-40 uppercase tracking-tighter">{user.subscription}</span>
          </div>
          <div className="relative group">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-black/40 group-hover:border-cyan-400/50 transition-all cursor-pointer">
              {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover opacity-80" />
              ) : (
                <div className="w-full h-full flex items-center justify-center mono text-lg" style={{ color: themeColors.primary }}>{user.username[0]}</div>
              )}
            </div>
            {/* User Dropdown */}
            <div className="absolute top-full right-0 mt-2 w-48 glass border border-white/10 rounded-xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all z-50 p-2">
              <button 
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-[10px] mono text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                TERMINATE_SESSION
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
