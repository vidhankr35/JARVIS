
import React from 'react';

interface JarvisCoreProps {
  active: boolean;
  mode?: 'standard' | 'scientific' | 'engineering';
}

const JarvisCore: React.FC<JarvisCoreProps> = ({ active, mode = 'standard' }) => {
  const accentColor = mode === 'scientific' ? 'violet' : (mode === 'engineering' ? 'amber' : 'cyan');
  
  const getModeColorClass = () => {
    switch (accentColor) {
      case 'violet': return 'border-violet-500/30';
      case 'amber': return 'border-amber-500/30';
      default: return 'border-cyan-500/30';
    }
  };

  const getActiveColorClass = () => {
    switch (accentColor) {
      case 'violet': return 'border-violet-400 bg-violet-400';
      case 'amber': return 'border-amber-400 bg-amber-400';
      default: return 'border-cyan-400 bg-cyan-400';
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none transition-all duration-1000">
      <div className="relative w-[700px] h-[700px]">
        {/* Outer Most HUD Ring */}
        <div className={`absolute inset-0 border-[1px] border-dashed ${getModeColorClass()} rounded-full ${active ? 'animate-[spin_60s_linear_infinite]' : 'animate-[spin_120s_linear_infinite]'}`} />
        
        {/* Ring with Data Labels */}
        <div className={`absolute inset-[10%] border-[1px] border-${accentColor}-400/10 rounded-full ${active ? 'animate-[spin_40s_linear_infinite_reverse]' : 'animate-[spin_80s_linear_infinite_reverse]'}`}>
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="absolute top-0 left-1/2 -translate-x-1/2 h-full"
              style={{ transform: `rotate(${i * 45}deg)` }}
            >
              <span className={`text-[8px] mono text-${accentColor}-400/40 uppercase tracking-tighter absolute -top-4 -translate-x-1/2`}>
                DATA_STR_{i*128}
              </span>
            </div>
          ))}
        </div>

        {/* Secondary HUD Ring */}
        <div className={`absolute inset-[20%] border-[2px] border-${accentColor}-400/20 rounded-full ${active ? 'animate-[spin_15s_linear_infinite]' : 'animate-[spin_45s_linear_infinite]'}`}>
           <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-2 bg-${accentColor}-400/40`} />
           <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-2 bg-${accentColor}-400/40`} />
           <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-12 bg-${accentColor}-400/40`} />
           <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-2 h-12 bg-${accentColor}-400/40`} />
        </div>

        {/* Inner Reactor Assembly */}
        <div className="absolute inset-[35%] flex items-center justify-center">
            <div className={`w-64 h-64 rounded-full border-2 border-${accentColor}-400/40 flex items-center justify-center ${active ? 'scale-110 shadow-[0_0_50px_rgba(var(--theme-accent),0.2)]' : 'scale-100'} transition-all duration-700 relative`}>
              <div className={`w-48 h-48 rounded-full bg-${accentColor}-400/5 blur-3xl ${active ? 'animate-pulse' : ''}`} />
              <div className={`absolute inset-0 border-[1px] border-dashed border-${accentColor}-400/30 rounded-full animate-[spin_8s_linear_infinite]`} />
              
              <div className={`w-24 h-24 rounded-full border border-${accentColor}-400/60 flex items-center justify-center relative`}>
                <div className={`w-6 h-6 rounded-full bg-${accentColor}-400 ${active ? 'animate-ping' : 'opacity-40'} transition-all`} />
                {/* Micro Details */}
                <div className={`absolute inset-[-10px] border border-${accentColor}-400/20 rounded-full animate-[spin_4s_linear_infinite_reverse]`} />
              </div>
            </div>
        </div>

        {/* Orbital Navigation Components */}
        {[...Array(24)].map((_, i) => (
          <div 
            key={i}
            className="absolute inset-0"
            style={{ transform: `rotate(${i * 15}deg)` }}
          >
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-${accentColor}-400/30 rounded-full transition-all duration-500 ${active ? 'h-10 opacity-100 translate-y-[-5px]' : 'opacity-10'}`} />
          </div>
        ))}

        {/* Corner HUD Decals */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <div className={`absolute top-20 left-20 w-40 h-40 border-l border-t border-${accentColor}-400`} />
           <div className={`absolute bottom-20 right-20 w-40 h-40 border-r border-b border-${accentColor}-400`} />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default JarvisCore;
