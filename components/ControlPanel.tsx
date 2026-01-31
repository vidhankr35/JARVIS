
import React, { useState, useRef } from 'react';
import { JarvisTheme } from '../types';

interface ControlPanelProps {
  onSend: (text: string, imageData?: string) => void;
  isProcessing: boolean;
  isVoiceEnabled: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  theme: JarvisTheme;
  onVoiceToggle: () => void;
  onModeChange: (mode: 'standard' | 'scientific' | 'engineering') => void;
  onManualHologram?: (subject: string) => void;
  isMobile?: boolean;
  isThinkingMode?: boolean;
  isSearchEnabled?: boolean;
  onToggleThinking?: () => void;
  onToggleSearch?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onSend, 
  isProcessing, 
  isVoiceEnabled,
  isListening,
  isSpeaking,
  onVoiceToggle,
  onModeChange,
  onManualHologram,
  isMobile,
  isThinkingMode,
  isSearchEnabled,
  onToggleThinking,
  onToggleSearch
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
    <div className={`glass border-t border-cyan-500/20 z-30 flex flex-col gap-4 ${isMobile ? 'p-4 pb-8' : 'p-6'}`}>
      {/* Visualizer */}
      {isVoiceEnabled && (
        <div className="h-6 flex items-center justify-center gap-1">
          {[...Array(isMobile ? 10 : 16)].map((_, i) => (
            <div 
              key={i} 
              className={`w-1 bg-cyan-400 transition-all duration-150 ${isListening || isSpeaking ? 'animate-[pulse_1s_infinite]' : 'h-1'}`}
              style={{ 
                height: isListening || isSpeaking ? `${30 + Math.random() * 70}%` : '4px',
                opacity: 0.3 + (i / 16),
                animationDelay: `${i * 0.05}s`
              }} 
            />
          ))}
        </div>
      )}

      <div className={`flex items-center justify-between gap-4 ${isMobile ? 'flex-col sm:flex-row' : ''}`}>
        <div className="flex bg-black/40 border border-cyan-500/20 rounded p-1 w-full sm:w-auto overflow-x-auto">
          {(['standard', 'scientific', 'engineering'] as const).map((m) => (
            <button key={m} onClick={() => onModeChange(m)} className="flex-1 sm:flex-none px-3 py-1.5 text-[8px] mono rounded hover:bg-cyan-500/10 text-cyan-500/50 hover:text-cyan-400 uppercase transition-all whitespace-nowrap">
              {m}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button 
            onClick={onToggleSearch}
            className={`flex-1 sm:flex-none px-3 py-1.5 text-[8px] mono rounded border transition-all flex items-center justify-center gap-2 whitespace-nowrap ${isSearchEnabled ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' : 'border-slate-700 text-slate-500'}`}
            title="Enable Google Search Grounding"
          >
            SEARCH
          </button>
          <button 
            onClick={onToggleThinking}
            className={`flex-1 sm:flex-none px-3 py-1.5 text-[8px] mono rounded border transition-all flex items-center justify-center gap-2 whitespace-nowrap ${isThinkingMode ? 'bg-violet-500/20 border-violet-400 text-violet-400' : 'border-slate-700 text-slate-500'}`}
            title="Enable High-Level Reasoning (Thinking Mode)"
          >
            REASONING
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <button 
            onClick={onVoiceToggle} 
            className={`flex-1 sm:flex-none px-4 py-2 text-[9px] mono rounded-full border transition-all flex items-center justify-center gap-2 ${isVoiceEnabled ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' : 'border-slate-700 text-slate-500'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isVoiceEnabled ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'}`} />
            LINK
          </button>
          
          <button 
            onClick={() => onManualHologram?.(input || 'Structural Geometry')}
            className="flex-1 sm:flex-none px-4 py-2 text-[9px] mono rounded-full border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-all uppercase whitespace-nowrap"
          >
            Project
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={`flex gap-2 items-center ${isMobile ? 'flex-col' : ''}`}>
        <div className="flex gap-2 w-full">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-4 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/10 text-cyan-500 transition-all flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>

          <div className="flex-1 relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Command..."}
              className={`w-full bg-black/40 border rounded-xl px-4 py-4 focus:outline-none mono text-sm transition-all ${isThinkingMode ? 'border-violet-500/30 text-violet-100 focus:border-violet-400' : 'border-cyan-500/20 text-cyan-100 focus:border-cyan-400'}`}
            />
            {imagePreview && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <img src={imagePreview} className="w-6 h-6 rounded border border-cyan-500/50 object-cover" />
                <button type="button" onClick={() => setImagePreview(null)} className="text-red-400 text-lg">×</button>
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isProcessing} 
          className={`font-black px-6 py-4 rounded-xl text-xs tracking-widest transition-all disabled:opacity-20 flex-shrink-0 ${isMobile ? 'w-full' : ''} ${isThinkingMode ? 'bg-violet-500/20 border border-violet-400 text-violet-400 hover:bg-violet-500/30' : 'bg-cyan-500/20 border border-cyan-400 text-cyan-400 hover:bg-cyan-500/30'}`}
        >
          {isProcessing ? 'SCANNING...' : 'EXECUTE'}
        </button>
      </form>
    </div>
  );
};

export default ControlPanel;
