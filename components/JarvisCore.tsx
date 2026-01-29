
import React from 'react';

interface JarvisCoreProps {
  active: boolean;
  mode?: 'standard' | 'scientific' | 'engineering';
}

const JarvisCore: React.FC<JarvisCoreProps> = ({ active, mode = 'standard' }) => {
  const getModeColor = () => {
    switch (mode) {
      case 'scientific': return 'border-violet-500 bg-violet-500';
      case 'engineering': return 'border-amber-500 bg-amber-500';
      default: return 'border-cyan-500 bg-cyan-500';
    }
  };

  const getModeGlow = () => {
    switch (mode) {
      case 'scientific': return 'shadow-[0_0_30px_rgba(139,92,246,0.3)]';
      case 'engineering': return 'shadow-[0_0_30px_rgba(245,158,11,0.3)]';
      default: return 'shadow-[0_0_30px_rgba(34,211,238,0.3)]';
    }
  };

  const accentColor = mode === 'scientific' ? 'violet' : (mode === 'engineering' ? 'amber' : 'cyan');

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none transition-colors duration-1000">
      <div className="relative w-[600px] h-[600px]">
        {/* Outer Ring */}
        <div className={`absolute inset-0 border-[1px] ${getModeColor().split(' ')[0]}/20 rounded-full ${active ? 'animate-[spin_10s_linear_infinite]' : 'animate-[spin_40s_linear_infinite]'}`} />
        
        {/* Secondary HUD Ring */}
        <div className={`absolute inset-10 border-[1px] border-${accentColor}-400/20 rounded-full ${active ? 'animate-[spin_15s_linear_infinite_reverse]' : 'animate-[spin_30s_linear_infinite_reverse]'}`}>
           <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-${accentColor}-400/30`} />
           <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-${accentColor}-400/30`} />
           <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-${accentColor}-400/30`} />
           <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-${accentColor}-400/30`} />
        </div>

        {/* Inner Reactor Assembly */}
        <div className="absolute inset-40 flex items-center justify-center">
            <div className={`w-40 h-40 rounded-full border-2 border-${accentColor}-400/40 flex items-center justify-center ${active ? 'scale-110' : 'scale-100'} transition-transform duration-700 relative`}>
              <div className={`w-32 h-32 rounded-full bg-${accentColor}-400/10 blur-2xl ${active ? 'animate-pulse' : ''} ${getModeGlow()}`} />
              <div className={`absolute inset-0 border-2 border-dashed border-${accentColor}-400/10 rounded-full animate-[spin_6s_linear_infinite]`} />
              <div className={`w-16 h-16 rounded-full border border-${accentColor}-400/60 flex items-center justify-center`}>
                <div className={`w-4 h-4 rounded-full bg-${accentColor}-400 ${active ? 'animate-ping' : ''}`} />
              </div>
            </div>
        </div>

        {/* Orbital Components */}
        {[...Array(12)].map((_, i) => (
          <div 
            key={i}
            className="absolute inset-0"
            style={{ transform: `rotate(${i * 30}deg)` }}
          >
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-${accentColor}-400/40 rounded-sm transition-all duration-500 ${active ? 'h-8 opacity-100' : 'opacity-20'}`} />
          </div>
        ))}

        {/* Scientific mode specific overlays */}
        {mode === 'scientific' && (
          <div className="absolute inset-0 animate-pulse opacity-20">
             <div className="absolute top-1/4 left-1/4 w-32 h-32 border-l border-t border-violet-400" />
             <div className="absolute bottom-1/4 right-1/4 w-32 h-32 border-r border-b border-violet-400" />
          </div>
        )}
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
