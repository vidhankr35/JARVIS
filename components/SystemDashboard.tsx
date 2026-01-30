
import React, { useState, useEffect } from 'react';
import { JarvisTheme } from '../types';
import { THEMES } from '../constants';

const SystemDashboard: React.FC<{ mode: string, theme: JarvisTheme }> = ({ mode, theme }) => {
  const [metrics, setMetrics] = useState({
    gravity: 9.806,
    temp: 2.73,
    entropy: 14.2,
    sync: 100
  });
  
  const themeColors = THEMES[theme];

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        gravity: 9.806 + (Math.random() - 0.5) * 0.001,
        temp: 2.73 + (Math.random() - 0.5) * 0.05,
        entropy: 14.2 + Math.random(),
        sync: 99.9 + Math.random() * 0.1
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-5 border border-white/5 rounded-2xl bg-black/40 shadow-inner">
        <h4 className="text-[10px] mono font-bold mb-5 uppercase tracking-widest opacity-40">Environmental_Telemetry</h4>
        <div className="space-y-4">
          {[
            { label: 'Local_G', value: metrics.gravity.toFixed(4), unit: 'm/s²' },
            { label: 'Ambient_K', value: metrics.temp.toFixed(2), unit: 'K' },
            { label: 'Entropy', value: metrics.entropy.toFixed(1), unit: 'J/K' },
            { label: 'Sync_Rate', value: metrics.sync.toFixed(2), unit: '%' }
          ].map((m, i) => (
            <div key={i} className="flex justify-between items-center mono text-[11px]">
              <span className="opacity-40">{m.label}</span>
              <span className="font-bold" style={{ color: themeColors.primary }}>
                {m.value} <span className="text-[8px] opacity-40">{m.unit}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 border border-white/5 rounded-2xl bg-black/40">
        <h4 className="text-[10px] mono font-bold mb-4 uppercase tracking-widest opacity-40">Neural_Load_Graph</h4>
        <div className="h-20 flex items-end gap-1.5 px-1">
          {[...Array(18)].map((_, i) => (
            <div 
              key={i} 
              className="flex-1 rounded-t-full transition-all duration-500 ease-out" 
              style={{ 
                height: `${20 + Math.random() * 80}%`, 
                backgroundColor: themeColors.primary,
                opacity: 0.1 + (i / 20)
              }} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemDashboard;
