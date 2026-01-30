
import React, { useState, useRef } from 'react';
import { JarvisTheme } from '../types';

interface ControlPanelProps {
  onSend: (text: string, imageData?: string) => void;
  isProcessing: boolean;
  isVoiceEnabled: boolean;
  isListening: boolean;
  theme: JarvisTheme;
  onVoiceToggle: () => void;
  onModeChange: (mode: 'standard' | 'scientific' | 'engineering') => void;
  onManualHologram?: (subject: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onSend, 
  isProcessing, 
  isVoiceEnabled,
  isListening,
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
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="glass border-t border-cyan-500/20 p-4 lg:p-6 z-30 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-black/40 border border-cyan-500/20 rounded p-1">
          {(['standard', 'scientific', 'engineering'] as const).map((m) => (
            <button key={m} onClick={() => onModeChange(m)} className="px-3 py-1 text-[9px] mono rounded hover:bg-cyan-500/10 text-cyan-500/50 hover:text-cyan-400 uppercase transition-all">
              {m}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onVoiceToggle} 
            className={`px-4 py-2 text-[10px] mono rounded-full border transition-all flex items-center gap-2 ${isVoiceEnabled ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-lg' : 'border-slate-700 text-slate-500'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isVoiceEnabled ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
            {isVoiceEnabled ? 'VOICE_LIVE' : 'VOICE_LINK'}
          </button>
          
          <button 
            onClick={() => onManualHologram?.(input || 'Structural Geometry')}
            className="px-4 py-2 text-[10px] mono rounded-full border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-all uppercase"
          >
            Project
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 items-center">
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/10 text-cyan-500 transition-all flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </button>

        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-cyan-400/5 blur-md rounded-xl group-focus-within:bg-cyan-400/10 transition-all" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening for command..." : "Awaiting directive, Sir..."}
            className="w-full relative bg-black/40 border border-cyan-500/20 rounded-xl px-6 py-4 text-cyan-100 placeholder:text-cyan-900/40 focus:outline-none focus:border-cyan-400 transition-all mono text-sm"
          />
          {imagePreview && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <img src={imagePreview} className="w-8 h-8 rounded border border-cyan-500/50 object-cover" />
              <button type="button" onClick={() => setImagePreview(null)} className="text-red-400 hover:text-red-300">×</button>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isProcessing} 
          className="bg-cyan-500/20 border border-cyan-400 text-cyan-400 font-black px-8 py-4 rounded-xl text-xs tracking-widest hover:bg-cyan-500/30 transition-all disabled:opacity-20 flex-shrink-0"
        >
          {isProcessing ? 'SCANNING' : 'EXECUTE'}
        </button>
      </form>
    </div>
  );
};

export default ControlPanel;
