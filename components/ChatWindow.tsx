
import React, { useEffect, useRef } from 'react';
import { Message, MessageRole, JarvisTheme } from '../types';

// Added theme: JarvisTheme to the prop type to match App.tsx usage
const ChatWindow: React.FC<{ messages: Message[], isProcessing: boolean, theme: JarvisTheme }> = ({ messages, isProcessing, theme }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar scroll-smooth">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex flex-col ${msg.role === MessageRole.USER ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
          <div className="flex items-center gap-2 mb-1 px-2">
            <span className={`mono text-[9px] font-bold uppercase tracking-widest ${msg.role === MessageRole.USER ? 'text-cyan-500' : 'text-violet-400'}`}>
              {msg.role === MessageRole.USER ? 'ADMIN_UPLINK' : 'JARVIS_COGNITION'}
            </span>
            <span className="mono text-[8px] text-slate-600">[{new Date(msg.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
          </div>

          <div className={`max-w-[80%] px-6 py-4 rounded-xl border ${
            msg.role === MessageRole.USER 
              ? 'bg-cyan-500/5 border-cyan-500/20 text-cyan-50 rounded-tr-none' 
              : 'glass border-white/5 text-slate-200 rounded-tl-none glow-cyan shadow-xl'
          }`}>
            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            
            {msg.groundingLinks && msg.groundingLinks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                {msg.groundingLinks.map((link, i) => (
                  <a key={i} href={link.uri} target="_blank" className="text-[10px] mono text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded hover:bg-cyan-400/20 transition-all">
                    [TELEMETRY_{i+1}]
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      {isProcessing && (
        <div className="flex items-center gap-4 animate-pulse px-2">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
          <span className="mono text-[10px] text-cyan-400 uppercase">Analyzing Tensors...</span>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
