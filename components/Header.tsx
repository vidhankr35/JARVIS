
import React, { useState, useEffect } from 'react';
import { User, JarvisTheme } from '../types';
import { THEMES } from '../constants';

interface HeaderProps {
  speaking?: boolean;
  listening?: boolean;
  user: User;
  theme: JarvisTheme;
  onLogout: () => void;
  apiOk: boolean | null;
  onToggleMenu?: () => void;
  isMobile?: boolean;
}

const Header: React.FC<HeaderProps> = ({ speaking, listening, user, theme, onLogout, apiOk, onToggleMenu, isMobile }) => {
  const [cpuLoad, setCpuLoad] = useState('12%');
  const themeColors = THEMES[theme];
  
  useEffect(() => {
    const interval = setInterval(() => {
      const load = Math.floor(Math.random() * (speaking ? 20 : 5)) + (speaking ? 40 : 8);
      setCpuLoad(`${load}%`);
    }, 2000);
    return () => clearInterval(interval);
  }, [speaking]);

  return (
    <header className={`${isMobile ? 'h-16' : 'h-24'} border-b border-white/5 glass flex items-center justify-between px-4 lg:px-10 z-20 relative overflow-hidden`}>
      <div className="absolute top-0 left-0 w-full h-[2px] opacity-40" style={{ background: `linear-gradient(90deg, transparent, ${themeColors.primary}, transparent)` }} />
      
      <div className="flex items-center gap-3 lg:gap-8">
        {isMobile && (
          <button onClick={onToggleMenu} className="p-2 text-cyan-400 glass rounded-lg border border-cyan-400/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        )}
        <div className={`relative ${isMobile ? 'w-8 h-8' : 'w-12 h-12'} rounded-full border-2 flex items-center justify-center transition-all duration-700 ${speaking ? 'scale-110' : ''}`} style={{ borderColor: themeColors.primary, boxShadow: speaking ? `0 0 25px ${themeColors.glow}` : 'none' }}>
          <div className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} rounded-full blur-[3px] transition-all duration-300 ${speaking ? 'animate-ping' : ''}`} style={{ backgroundColor: themeColors.primary }} />
        </div>
        <div>
          <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-black tracking-[0.2em] mono uppercase`} style={{ color: themeColors.primary }}>J.A.R.V.I.S.</h1>
        </div>
      </div>

      <div className="flex gap-4 lg:gap-16 text-[11px] mono items-center">
        {!isMobile && (
          <div className="hidden xl:flex gap-10 border-r border-white/5 pr-10">
            <div className="flex flex-col items-end">
              <span className="text-[8px] opacity-30 uppercase">CPU_COGNITION</span>
              <span className="font-bold tabular-nums" style={{ color: themeColors.primary }}>{cpuLoad}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className={`${isMobile ? 'text-[8px]' : 'text-[9px]'} font-bold`} style={{ color: themeColors.primary }}>{user.username.split(' ')[0]}</span>
            {!isMobile && <span className="text-[8px] opacity-40 uppercase tracking-tighter">{user.subscription}</span>}
          </div>
          <div className="relative group">
            <div className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} rounded-xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer`} onClick={onLogout}>
              {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover opacity-80" />
              ) : (
                <div className="w-full h-full flex items-center justify-center mono text-sm" style={{ color: themeColors.primary }}>{user.username[0]}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
