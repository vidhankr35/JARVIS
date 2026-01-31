
import React, { useEffect, useRef } from 'react';
import { Message, MessageRole, JarvisTheme } from '../types';

interface ChatWindowProps {
  messages: Message[];
  isProcessing: boolean;
  theme: JarvisTheme;
  liveTranscript?: { user: string, jarvis: string };
  streamingText?: string;
  streamStatus?: string | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isProcessing, theme, liveTranscript, streamingText, streamStatus }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing, liveTranscript, streamingText]);

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
            msg.isError 
              ? 'bg-red-500/5 border-red-500/20 text-red-200'
              : msg.role === MessageRole.USER 
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

      {/* Real-time Streaming Response */}
      {streamingText && (
        <div className="flex flex-col items-start animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-1 px-2">
            <span className="mono text-[9px] font-bold uppercase tracking-widest text-violet-400">JARVIS_STREAMING</span>
            <span className="mono text-[8px] text-cyan-400 animate-pulse">{streamStatus}</span>
          </div>
          <div className="max-w-[80%] px-6 py-4 rounded-xl border glass border-cyan-400/20 text-slate-200 rounded-tl-none glow-cyan shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-[scanline_3s_linear_infinite] pointer-events-none opacity-20" />
            <p className="whitespace-pre-wrap leading-relaxed">
              {streamingText}
              <span className="animate-pulse ml-1 inline-block w-2 h-4 bg-cyan-400 align-middle" />
            </p>
          </div>
        </div>
      )}

      {/* Real-time Voice Transcription Module */}
      {(liveTranscript?.user || liveTranscript?.jarvis) && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {liveTranscript.user && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 mb-1 px-2">
                <span className="mono text-[9px] font-bold uppercase tracking-widest text-cyan-500">VOICE_INPUT</span>
              </div>
              <div className="max-w-[80%] px-6 py-4 rounded-xl border bg-cyan-500/10 border-cyan-500/40 text-cyan-100 rounded-tr-none italic opacity-70">
                {liveTranscript.user}
              </div>
            </div>
          )}
          {liveTranscript.jarvis && (
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1 px-2">
                <span className="mono text-[9px] font-bold uppercase tracking-widest text-violet-400">NEURAL_STREAM</span>
              </div>
              <div className="max-w-[80%] px-6 py-4 rounded-xl border glass border-cyan-400/30 text-cyan-50 rounded-tl-none glow-cyan italic">
                {liveTranscript.jarvis}
                <span className="animate-pulse ml-1 inline-block w-1.5 h-4 bg-cyan-400 align-middle" />
              </div>
            </div>
          )}
        </div>
      )}

      {isProcessing && !streamingText && (
        <div className="flex items-center gap-4 animate-pulse px-2">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
          <span className="mono text-[10px] text-cyan-400 uppercase tracking-widest">{streamStatus || 'Initializing Tensors...'}</span>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
