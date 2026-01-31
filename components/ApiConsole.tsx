
import React from 'react';
import { JarvisTheme } from '../types';
import { THEMES } from '../constants';

interface ApiConsoleProps {
  payload: any;
  logs: string[];
  theme: JarvisTheme;
}

const ApiConsole: React.FC<ApiConsoleProps> = ({ payload, logs, theme }) => {
  const themeColors = THEMES[theme];

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      <div className="glass border border-white/10 rounded-xl p-4 flex flex-col gap-3 overflow-hidden">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <span className="text-cyan-400 font-bold">STARK_NEURAL_V1_EXPLORER</span>
          <span className="text-[10px] opacity-40">ENDPOINT: /api/v1/generate</span>
        </div>
        
        <div className="flex-1 bg-black/50 rounded-lg p-4 font-mono text-[11px] overflow-auto custom-scrollbar">
          <p className="text-slate-500 mb-2">// Latest Request Payload</p>
          <pre className="text-cyan-300">
            {payload ? JSON.stringify(payload, null, 2) : "// No telemetry captured yet..."}
          </pre>
        </div>
      </div>

      <div className="h-1/3 glass border border-white/10 rounded-xl p-4 flex flex-col gap-2 overflow-hidden">
        <div className="flex justify-between items-center opacity-40 uppercase tracking-widest text-[9px] font-bold">
          <span>Live_Network_Traffic</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Operational
          </span>
        </div>
        <div className="flex-1 bg-black/30 rounded p-2 overflow-y-auto font-mono text-[9px] space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-4">
              <span className="opacity-20">{new Date().toLocaleTimeString()}</span>
              <span className={log.includes('ERR') ? 'text-red-400' : 'text-slate-400'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass border border-white/10 rounded-xl p-4">
        <p className="text-[10px] opacity-40 uppercase mb-4 tracking-tighter">Direct_Access_Link</p>
        <div className="bg-black/60 p-3 rounded border border-white/5 relative group">
          <code className="text-[10px] text-slate-300 break-all">
            curl -X POST "http://stark.industries/v1/jarvis" -H "Authorization: Stark {Math.random().toString(36).substring(7)}"
          </code>
          <button className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all text-cyan-400 hover:text-cyan-300">COPY</button>
        </div>
      </div>
    </div>
  );
};

export default ApiConsole;
