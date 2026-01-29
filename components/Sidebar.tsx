
import React, { useState } from 'react';
import SystemDashboard from './SystemDashboard';

interface SidebarProps {
  memory: string[];
  mode: string;
  apiLogs?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ memory, mode, apiLogs = [] }) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'logs' | 'archive'>('monitor');

  const getModeColor = () => {
    switch (mode) {
      case 'scientific': return 'text-violet-400 border-violet-500/30';
      case 'engineering': return 'text-amber-400 border-amber-500/30';
      default: return 'text-cyan-400 border-cyan-500/30';
    }
  };

  const getModeBg = () => {
    switch (mode) {
      case 'scientific': return 'bg-violet-900/10';
      case 'engineering': return 'bg-amber-900/10';
      default: return 'bg-cyan-900/10';
    }
  };

  return (
    <aside className="w-80 glass border-r border-cyan-500/10 flex flex-col p-6 gap-6 z-30 relative overflow-hidden">
      {/* Decorative scanline */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent h-20 w-full animate-[scan_8s_infinite_linear] pointer-events-none" />
      
      <div className="flex gap-2 mb-2 p-1 bg-black/40 rounded border border-white/5">
        {(['monitor', 'logs', 'archive'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-[9px] mono uppercase rounded transition-all ${activeTab === tab ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === 'monitor' && <SystemDashboard mode={mode} />}

        {activeTab === 'logs' && (
          <section className="animate-in fade-in duration-300">
            <h3 className={`text-xs font-bold mono mb-4 border-b pb-2 flex justify-between items-center ${getModeColor().split(' ')[0]}`}>
              LIVE_EVENT_FEED
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
            </h3>
            <div className="bg-black/40 border border-white/5 rounded p-4 h-[500px] overflow-y-auto mono text-[10px] space-y-2">
              {apiLogs.length === 0 ? (
                <p className="opacity-30 italic">LISTENING_FOR_HANDSHAKE...</p>
              ) : (
                apiLogs.map((log, i) => (
                  <div key={i} className="flex gap-3 items-start group">
                    <span className="opacity-30 whitespace-nowrap">[{new Date().toLocaleTimeString([], {hour12: false, minute:'2-digit', second:'2-digit'})}]</span>
                    <span className={`group-hover:opacity-100 transition-opacity ${
                      log.includes('ERROR') ? 'text-red-400' : 
                      log.includes('EXEC') ? 'text-cyan-300' : 
                      log.includes('INIT') ? 'text-green-400' : 
                      'text-slate-400'
                    }`}>
                      {log}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'archive' && (
          <section className="animate-in fade-in duration-300">
            <h3 className={`text-xs font-bold mono mb-4 border-b pb-2 ${getModeColor().split(' ')[0]}`}>COGNITIVE_ARCHIVE</h3>
            <div className="space-y-4">
              {memory.length === 0 ? (
                <div className="p-8 text-center opacity-30">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v4M7 7h10" /></svg>
                  <p className="text-[10px] mono">NO_TELEMETRY_FOUND</p>
                </div>
              ) : (
                memory.map((entry, i) => (
                  <div key={i} className={`p-4 border rounded-lg text-[10px] mono ${getModeBg()} ${getModeColor().split(' ')[1]} group cursor-default transition-all hover:bg-white/[0.02]`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="opacity-40 font-bold">SEGMENT_{i + 1024}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50" />
                    </div>
                    <p className="text-slate-300 leading-relaxed italic">"{entry}"</p>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      <section className="pt-4 border-t border-cyan-500/10 mt-auto">
        <div className={`p-4 rounded-xl border relative overflow-hidden group transition-all duration-500 ${getModeBg()} ${getModeColor().split(' ')[1]}`}>
          <div className="absolute inset-0 bg-white/[0.02] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getModeColor()}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <p className="text-[9px] mono opacity-40 uppercase tracking-tighter">Current_Directive</p>
              <p className={`text-sm font-black uppercase tracking-[0.2em] ${getModeColor().split(' ')[0]}`}>{mode}</p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.3); }
      `}</style>
    </aside>
  );
};

export default Sidebar;
