
import React, { useState, useEffect } from 'react';

interface MetricBarProps {
  label: string;
  value: number;
  color: string;
}

const MetricBar: React.FC<MetricBarProps> = ({ label, value, color }) => (
  <div className="space-y-1 mb-3">
    <div className="flex justify-between items-center px-1">
      <span className="text-[9px] mono opacity-60 uppercase">{label}</span>
      <span className={`text-[9px] mono font-bold ${color}`}>{value}%</span>
    </div>
    <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
      <div 
        className={`h-full transition-all duration-1000 ease-out ${color.replace('text-', 'bg-')}`} 
        style={{ width: `${value}%` }} 
      />
    </div>
  </div>
);

const SystemDashboard: React.FC<{ mode: string }> = ({ mode }) => {
  const [metrics, setMetrics] = useState({
    cpu: 12,
    ram: 45,
    net: 2,
    disk: 18,
    neural: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.floor(Math.random() * 15) + (mode === 'scientific' ? 40 : 10),
        ram: Math.floor(Math.random() * 5) + 42,
        net: Math.floor(Math.random() * 80),
        disk: 18 + Math.floor(Math.random() * 2),
        neural: Math.floor(Math.random() * 100)
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [mode]);

  const subsystems = [
    { name: 'Optical_Array', status: 'OK', color: 'text-green-500' },
    { name: 'Neural_Synapse', status: 'SYNC', color: 'text-cyan-400' },
    { name: 'Holograph_V2', status: 'LOAD', color: 'text-amber-500' },
    { name: 'Phys_Core', status: mode === 'scientific' ? 'HI_PRIO' : 'IDLE', color: mode === 'scientific' ? 'text-violet-400' : 'text-slate-500' },
    { name: 'Comms_Link', status: 'ESTB', color: 'text-green-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 border border-cyan-500/10 rounded bg-black/20">
        <h4 className="text-[10px] mono font-bold text-cyan-500/60 mb-4 uppercase tracking-[0.2em]">Resource_Allocation</h4>
        <MetricBar label="Core_Processor" value={metrics.cpu} color="text-cyan-400" />
        <MetricBar label="Neural_Memory" value={metrics.ram} color="text-amber-400" />
        <MetricBar label="Uplink_Bandwidth" value={metrics.net} color="text-blue-400" />
        <MetricBar label="Local_Cache" value={metrics.disk} color="text-slate-400" />
      </div>

      <div className="p-4 border border-cyan-500/10 rounded bg-black/20">
        <h4 className="text-[10px] mono font-bold text-cyan-500/60 mb-3 uppercase tracking-[0.2em]">Subsystem_Status</h4>
        <div className="space-y-2">
          {subsystems.map((s, i) => (
            <div key={i} className="flex justify-between items-center text-[9px] mono border-b border-white/5 pb-1">
              <span className="opacity-40">{s.name}</span>
              <span className={`font-bold ${s.color}`}>{s.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border border-cyan-500/10 rounded bg-black/20 relative overflow-hidden h-24">
        <h4 className="text-[10px] mono font-bold text-cyan-500/60 mb-2 uppercase tracking-[0.2em]">Neural_Activity</h4>
        <div className="flex items-end justify-between h-10 gap-0.5">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="w-full bg-cyan-400/40 rounded-t-sm transition-all duration-300"
              style={{ height: `${Math.random() * 100}%` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default SystemDashboard;
