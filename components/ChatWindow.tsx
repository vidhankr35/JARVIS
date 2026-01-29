
import React from 'react';
import { Message, MessageRole } from '../types';

interface ChatWindowProps {
  messages: Message[];
  isProcessing: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isProcessing }) => {
  return (
    <div className="flex-1 space-y-10 overflow-y-auto pr-6">
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex flex-col ${msg.role === MessageRole.USER ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}
        >
          <div className="flex items-center gap-3 mb-2 px-2">
            <span className={`text-[10px] font-bold mono uppercase tracking-widest ${msg.role === MessageRole.USER ? 'text-cyan-500' : 'text-cyan-400 opacity-80'}`}>
              {msg.role === MessageRole.USER ? 'ADMIN_ACCESS' : 'JARVIS_CORE_85'}
            </span>
            <span className="text-[9px] mono text-slate-600 font-medium">
              [{new Date(msg.timestamp).toLocaleTimeString([], { hour12: false })}]
            </span>
          </div>
          
          <div className={`
            max-w-[85%] px-6 py-5 rounded-2xl text-[15px] leading-relaxed relative
            ${msg.role === MessageRole.USER 
              ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-50 shadow-[0_4px_20px_rgba(34,211,238,0.05)] rounded-tr-none' 
              : 'glass border border-cyan-400/20 text-slate-100 rounded-tl-none glow-cyan shadow-[0_10px_40px_rgba(0,0,0,0.3)]'}
          `}>
            {msg.image && (
              <div className="mb-6 rounded-xl overflow-hidden border border-cyan-500/40 shadow-2xl bg-black/60 group relative">
                <img src={msg.image} alt="Schematic Analysis" className="w-full max-h-[500px] object-contain" />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-cyan-500 text-black text-[8px] mono font-bold rounded">VISUAL_TELEMETRY</div>
              </div>
            )}
            
            <div className="space-y-3">
              {msg.text.split('\n').map((line, i) => (
                <p key={i} className={line.trim() === '' ? 'h-2' : ''}>
                  {line}
                </p>
              ))}
            </div>

            {msg.groundingLinks && msg.groundingLinks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-cyan-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <p className="text-[10px] mono text-cyan-400/60 font-bold uppercase tracking-wider">Verified_Telemetry_Sources:</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {msg.groundingLinks.map((link, idx) => (
                    <a 
                      key={idx} 
                      href={link.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] mono text-cyan-400 hover:text-white bg-cyan-500/5 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-all truncate max-w-[280px] flex items-center gap-2"
                    >
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      {link.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {isProcessing && (
        <div className="flex flex-col items-start animate-in fade-in slide-in-from-left-4 duration-700">
           <div className="flex items-center gap-2 mb-2 px-2">
             <span className="text-[10px] font-bold mono text-cyan-400 animate-pulse uppercase tracking-widest">JARVIS_Analyzing...</span>
           </div>
           <div className="glass px-8 py-4 rounded-full border border-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
             <div className="flex gap-2.5">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
