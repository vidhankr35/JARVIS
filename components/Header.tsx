
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  speaking?: boolean;
  listening?: boolean;
  model?: string;
}

const Header: React.FC<HeaderProps> = ({ speaking, listening, model }) => {
  const [cpuLoad, setCpuLoad] = useState('12%');
  
  useEffect(() => {
    const interval = setInterval(() => {
      const load = Math.floor(Math.random() * (speaking ? 15 : 5)) + (speaking ? 45 : 10);
      setCpuLoad(`${load}%`);
    }, 2000);
    return () => clearInterval(interval);
  }, [speaking]);

  return (
    <header className="h-20 border-b border-cyan-500/20 glass flex items-center justify-between px-10 z-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      
      <div className="flex items-center gap-6">
        <div className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${speaking ? 'border-cyan-400 scale-110 shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'border-cyan-400/30'}`}>
          <div className={`w-5 h-5 rounded-full blur-[2px] transition-all duration-300 ${speaking ? 'bg-cyan-400 animate-ping' : 'bg-cyan-400/10'}`} />
          <div className={`absolute inset-0 border border-cyan-400/20 rounded-full ${speaking ? 'animate-[spin_2s_linear_infinite]' : ''}`} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-[0.2em] text-cyan-400 mono">J.A.R.V.I.S.</h1>
          <p className="text-[9px] text-cyan-500/40 mono font-bold uppercase tracking-widest flex items-center gap-2">
            Neural_Core_v.8.5.2
            <span className="w-1 h-1 bg-cyan-500/40 rounded-full" />
            Stable_Build
          </p>
        </div>
      </div>

      <div className="flex gap-12 text-[11px] mono text-cyan-400/60 items-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] opacity-40 uppercase tracking-tighter">Architecture</span>
          <div className="px-4 py-1.5 border border-cyan-500/30 rounded bg-cyan-400/5 text-cyan-400 font-bold shadow-inner">
            {model || 'SYNCING...'}
          </div>
        </div>

        <div className="flex gap-8 border-l border-cyan-500/20 pl-8">
          <div className="flex flex-col items-end">
            <span className="text-[8px] opacity-40 uppercase">Comms_Sync</span>
            <span className={`font-bold ${listening ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
              {listening ? 'ACTIVE_UP' : 'STANDBY'}
            </span>
          </div>
          <div className="flex flex-col items-end min-w-[60px]">
            <span className="text-[8px] opacity-40 uppercase">Neural_Load</span>
            <span className="font-bold text-cyan-400 transition-all tabular-nums">{cpuLoad}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] opacity-40 uppercase">Uptime</span>
            <span className="font-bold text-cyan-400">04:12:44:02</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
