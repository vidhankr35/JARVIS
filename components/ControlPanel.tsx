
import React, { useState, useRef } from 'react';

interface ControlPanelProps {
  onSend: (text: string, imageData?: string) => void;
  isProcessing: boolean;
  isVoiceEnabled: boolean;
  isListening: boolean;
  fastProtocol: boolean;
  onFastToggle: () => void;
  onVoiceToggle: () => void;
  onModeChange: (mode: 'standard' | 'scientific' | 'engineering') => void;
  onManualHologram?: (subject: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onSend, 
  isProcessing, 
  isVoiceEnabled,
  isListening,
  fastProtocol,
  onFastToggle,
  onVoiceToggle,
  onModeChange,
  onManualHologram
}) => {
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || imagePreview) && !isProcessing) {
      onSend(input, imagePreview || undefined);
      setInput('');
      setImagePreview(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerHologram = () => {
    const subject = input.trim() || "Complex Particle Simulation";
    onManualHologram?.(subject);
    setInput('');
  };

  return (
    <div className="h-44 glass border-t border-cyan-500/20 px-8 py-3 flex flex-col gap-3 z-30">
      <div className="flex gap-4 items-center">
        <div className="flex gap-2 border border-cyan-500/20 rounded p-1 bg-black/40">
           {(['standard', 'scientific', 'engineering'] as const).map((m) => (
             <button key={m} onClick={() => onModeChange(m)} className="px-2 py-1 text-[9px] mono rounded hover:bg-cyan-500/10 text-cyan-500/60 hover:text-cyan-400 uppercase transition-all">
               {m}
             </button>
           ))}
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={onFastToggle} className={`px-3 py-1 text-[9px] mono rounded border transition-all ${fastProtocol ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'border-slate-700 text-slate-500'}`}>
            FAST_LINK_{fastProtocol ? 'ON' : 'OFF'}
          </button>
          <button onClick={onVoiceToggle} className={`px-3 py-1 text-[9px] mono rounded border transition-all ${isVoiceEnabled ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-slate-700 text-slate-500'}`}>
            LIVE_LINK_{isVoiceEnabled ? 'ACTIVE' : 'OFF'}
          </button>
          <button 
            type="button"
            onClick={triggerHologram}
            className="px-3 py-1 text-[9px] mono rounded border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 transition-all uppercase"
          >
            Project_Hologram
          </button>
        </div>
        <div className="h-1 flex-1 bg-cyan-500/10 rounded overflow-hidden">
          <div className="h-full bg-cyan-400/30 w-1/3 animate-[progress_3s_infinite_linear]" />
        </div>
      </div>

      {imagePreview && (
        <div className="flex gap-2 items-center mb-1">
          <div className="relative w-12 h-12 border border-cyan-400 rounded overflow-hidden group">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button 
              onClick={() => setImagePreview(null)}
              className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            >
              ×
            </button>
          </div>
          <span className="mono text-[10px] text-cyan-400 animate-pulse">SCHEMA_LOADED</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-4 items-center">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-all text-cyan-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Voice Protocol Engaged..." : "Input command, Sir..."}
            className={`w-full bg-transparent border rounded-lg px-6 py-3 text-cyan-100 placeholder:text-cyan-900/50 focus:outline-none transition-all mono text-sm ${isListening ? 'border-cyan-400 bg-cyan-500/5' : 'border-cyan-500/30 focus:border-cyan-400'}`}
          />
        </div>
        <button type="submit" disabled={isProcessing && !isVoiceEnabled} className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 px-8 py-3 rounded-lg text-cyan-400 font-bold uppercase text-xs tracking-widest transition-all disabled:opacity-30">
          {isProcessing ? 'SCANNING...' : 'EXECUTE'}
        </button>
      </form>
    </div>
  );
};

export default ControlPanel;
