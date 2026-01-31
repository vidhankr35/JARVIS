
import React, { useState } from 'react';
import { JarvisTheme } from '../types';
import { THEMES } from '../constants';
import SystemDashboard from './SystemDashboard';

interface SidebarProps {
  memory: string[];
  mode: string;
  apiLogs?: string[];
  theme: JarvisTheme;
  onThemeChange: (theme: JarvisTheme) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ memory, mode, apiLogs = [], theme, onThemeChange }) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'neural' | 'archive'>('monitor');
  const themeColors = THEMES[theme];

  return (
    <aside className="w-80 glass border-r border-white/5 flex flex-col p-6 gap-6 z-30 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      
      <div className="flex flex-col gap-1 mb-2">
        <span className="text-[9px] mono opacity-30 tracking-[0.4em] uppercase">Neural_Engine_Status</span>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
          <span className="text-[11px] mono font-bold uppercase" style={{ color: themeColors.primary }}>STARK-1_ACTIVE</span>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
        {(['monitor', 'neural', 'archive'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[9px] mono uppercase rounded-lg transition-all ${activeTab === tab ? 'bg-white/5 font-bold border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
            style={{ color: activeTab === tab ? themeColors.primary : undefined }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === 'monitor' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-300">
             <section>
              <h3 className="text-[10px] font-bold mono mb-4 opacity-40 uppercase tracking-widest">Protocol_Shift</h3>
              <div className="grid grid-cols-1 gap-3">
                {(['MK_85', 'MK_5', 'MK_50'] as JarvisTheme[]).map(t => (
                  <button 
                    key={t}
                    onClick={() => onThemeChange(t)}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${theme === t ? 'bg-white/5' : 'border-white/5 hover:border-white/10'}`}
                    style={{ borderColor: theme === t ? THEMES[t].primary : undefined }}
                  >
                    <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: THEMES[t].primary, borderColor: THEMES[t].primary }} />
                    <span className={`mono text-[10px] font-bold ${theme === t ? '' : 'opacity-40'}`} style={{ color: theme === t ? THEMES[t].primary : undefined }}>{t}</span>
                  </button>
                ))}
              </div>
            </section>
            <SystemDashboard mode={mode} theme={theme} />
          </div>
        )}

        {activeTab === 'neural' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="p-4 rounded-xl border border-white/10 bg-black/20 space-y-4">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="opacity-40">API_VERSION</span>
                  <span className="text-cyan-400">1.0.4-BETA</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="opacity-40">NEURAL_TEMP</span>
                  <span className="text-cyan-400">0.72</span>
                </div>
                <div className="h-[1px] bg-white/5" />
                <div className="space-y-2">
                   <p className="text-[9px] opacity-40 uppercase">Throttling</p>
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 w-[65%]" />
                   </div>
                </div>
             </div>
             <div className="text-[10px] mono text-slate-500 leading-relaxed italic">
                "Your Stark-1 API is optimized for high-energy physics and material science calculations. Direct terminal access enabled."
             </div>
          </div>
        )}

        {activeTab === 'archive' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {memory.map((entry, i) => (
              <div key={i} className="p-4 border border-white/5 rounded-xl text-[10px] mono bg-black/20">
                <p className="opacity-30 mb-2">SEG_{1024 + i}</p>
                <p className="text-slate-300 leading-relaxed">"{entry}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-white/5">
         <div className="flex items-center gap-3 p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
            <div className="w-8 h-8 rounded bg-cyan-400/10 flex items-center justify-center">
               <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </div>
            <div className="flex flex-col">
               <span className="text-[8px] mono opacity-40 uppercase">System_Mode</span>
               <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{mode}</span>
            </div>
         </div>
      </div>
    </aside>
  );
};

export default Sidebar;
