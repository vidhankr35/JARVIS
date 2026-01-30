
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
  const [activeTab, setActiveTab] = useState<'monitor' | 'logs' | 'archive'>('monitor');
  const themeColors = THEMES[theme];

  return (
    <aside className="w-80 glass border-r border-white/5 flex flex-col p-6 gap-6 z-30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent h-40 w-full animate-[scan_10s_infinite_linear] pointer-events-none" />
      
      <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
        {(['monitor', 'logs', 'archive'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[9px] mono uppercase rounded-lg transition-all ${activeTab === tab ? 'bg-white/5 font-bold border border-white/10 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
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
                    <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: THEMES[t].primary, borderColor: THEMES[t].primary }} />
                    <span className={`mono text-[10px] font-bold ${theme === t ? '' : 'opacity-40'}`} style={{ color: theme === t ? THEMES[t].primary : undefined }}>{t}</span>
                    {theme === t && <span className="ml-auto text-[8px] mono opacity-40">ACTIVE</span>}
                  </button>
                ))}
              </div>
            </section>
            <SystemDashboard mode={mode} theme={theme} />
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 h-[500px] overflow-y-auto mono text-[10px] space-y-2">
              {apiLogs.map((log, i) => (
                <div key={i} className="flex gap-3 group">
                  <span className="opacity-20">[{new Date().toLocaleTimeString([], {hour12: false, second:'2-digit'})}]</span>
                  <span className={`transition-opacity ${log.includes('ERR') ? 'text-red-400' : 'text-slate-400'}`} style={{ color: !log.includes('ERR') ? themeColors.primary : undefined }}>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'archive' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {memory.map((entry, i) => (
              <div key={i} className="p-4 border border-white/5 rounded-xl text-[10px] mono bg-black/20">
                <p className="opacity-30 mb-2">SEG_{1024 + i}</p>
                <p className="text-slate-300 italic leading-relaxed">"{entry}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-white/5 pt-6">
        <div className="p-4 rounded-2xl border border-white/5 bg-black/40 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 bg-white/5" style={{ color: themeColors.primary }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <p className="text-[9px] mono opacity-30 uppercase tracking-tighter">Primary_Directive</p>
              <p className="text-sm font-black uppercase tracking-widest" style={{ color: themeColors.primary }}>{mode}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
