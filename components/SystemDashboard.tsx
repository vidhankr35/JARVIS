
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
    physics: 99,
    math: 99
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.floor(Math.random() * 15) + (mode === 'scientific' ? 40 : 10),
        ram: Math.floor(Math.random() * 5) + 42,
        net: Math.floor(Math.random() * 80),
        physics: 99 + (Math.random() > 0.5 ? 0.1 : -0.1),
        math: 100
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [mode]);

  const subsystems = [
    { name: 'Quantum_Link', status: 'STABLE', color: 'text-cyan-400' },
    { name: 'Phys_Core_V4', status: 'SYNCED', color: 'text-violet-400' },
    { name: 'Math_Logic_Gate', status: 'ACTIVE', color: 'text-blue-400' },
    { name: 'Tensor_Flow', status: 'LOADED', color: 'text-green-500' },
    { name: 'Holographic_Diver', status: 'IDLE', color: 'text-slate-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 border border-cyan-500/10 rounded bg-black/20">
        <h4 className="text-[10px] mono font-bold text-cyan-500/60 mb-4 uppercase tracking-[0.2em]">Resource_Allocation</h4>
        <MetricBar label="Core_Processor" value={metrics.cpu} color="text-cyan-400" />
        <MetricBar label="Neural_Memory" value={metrics.ram} color="text-amber-400" />
        <MetricBar label="Physics_Engine" value={metrics.physics} color="text-violet-400" />
        <MetricBar label="Math_Kernel" value={metrics.math} color="text-blue-400" />
      </div>

      <div className="p-4 border border-cyan-500/10 rounded bg-black/20">
        <h4 className="text-[10px] mono font-bold text-cyan-500/60 mb-3 uppercase tracking-[0.2em]">Data_Uplink_Status</h4>
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
        <h4 className="text-[10px] mono font-bold text-cyan-500/60 mb-2 uppercase tracking-[0.2em]">Neural_Calculus_Feed</h4>
        <div className="flex items-end justify-between h-10 gap-0.5">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="w-full bg-violet-400/40 rounded-t-sm transition-all duration-300"
              style={{ height: `${20 + Math.random() * 80}%` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-violet-500/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default SystemDashboard;
