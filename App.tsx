
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, GenerateContentResponse } from '@google/genai';
import { Message, MessageRole, JarvisState, GroundingLink } from './types';
import { JARVIS_SYSTEM_INSTRUCTION, INITIAL_GREETING } from './constants';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import JarvisCore from './components/JarvisCore';
import Sidebar from './components/Sidebar';
import ControlPanel from './components/ControlPanel';

// --- Core SDK Utilities (PCM Encoding/Decoding) ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array) {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: MessageRole.JARVIS, text: INITIAL_GREETING, timestamp: Date.now() }
  ]);
  const [state, setState] = useState<JarvisState & { fastProtocol: boolean, apiLogs: string[], hologram: { subject: string, imageUrl: string | null } | null }>({
    isProcessing: false,
    isListening: false,
    isSpeaking: false,
    isVoiceEnabled: false,
    fastProtocol: true,
    currentMode: 'standard',
    memory: ["Core initialized.", "Neural link calibrated.", "Biometric data verified."],
    apiLogs: [],
    hologram: null
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const outAudioCtxRef = useRef<AudioContext | null>(null);
  const inAudioCtxRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentOutputTranscriptionRef = useRef<string>('');
  const currentInputTranscriptionRef = useRef<string>('');
  const stopInProgress = useRef(false);

  const addApiLog = useCallback((log: string) => {
    setState(prev => ({ ...prev, apiLogs: [log, ...prev.apiLogs].slice(0, 15) }));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateHologram = async (subject: string) => {
    try {
      addApiLog(`INIT_HOLOGRAPHIC_RENDER: ${subject}`);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A vibrant blue glowing futuristic 3D holographic wireframe of ${subject}, technical schematic style, isolated on pure black background, cybernetic HUD details, high fidelity.` }] }
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        setState(prev => ({ ...prev, hologram: { subject, imageUrl: `data:image/png;base64,${part.inlineData.data}` } }));
        addApiLog("HOLOGRAPH_PROJECTED_STABLE");
      }
    } catch (e) {
      addApiLog("RENDER_PROTO_ERROR");
      console.error(e);
    }
  };

  const stopLiveSession = useCallback(async () => {
    if (stopInProgress.current) return;
    stopInProgress.current = true;
    
    addApiLog("TERMINATING_NEURAL_UPLINK...");
    
    if (sessionPromiseRef.current) {
      try {
        const session = await sessionPromiseRef.current;
        session.close();
      } catch (e) {}
      sessionPromiseRef.current = null;
    }
    
    if (inAudioCtxRef.current) {
      await inAudioCtxRef.current.close();
      inAudioCtxRef.current = null;
    }
    
    activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    activeSourcesRef.current.clear();
    
    setState(prev => ({ ...prev, isListening: false, isSpeaking: false, isVoiceEnabled: false }));
    stopInProgress.current = false;
    addApiLog("SYSTEM_STANDBY");
  }, [addApiLog]);

  const startLiveSession = async () => {
    try {
      addApiLog("SYNCHRONIZING_NEURAL_UPLINK...");
      if (!outAudioCtxRef.current) outAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (!inAudioCtxRef.current) inAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      await outAudioCtxRef.current.resume();
      await inAudioCtxRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      const hologramTool: FunctionDeclaration = {
        name: 'generate_hologram',
        description: 'Projects a 3D holographic visual of a subject.',
        parameters: {
          type: Type.OBJECT,
          properties: { subject: { type: Type.STRING, description: 'The object to render' } },
          required: ['subject']
        }
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            if (!inAudioCtxRef.current) return;
            addApiLog("NEURAL_SYNC_ESTABLISHED");
            const source = inAudioCtxRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session) => {
                  const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inAudioCtxRef.current.destination);
            setState(prev => ({ ...prev, isListening: true }));
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                addApiLog(`REMOTE_EXEC: ${fc.name}`);
                if (fc.name === 'generate_hologram') {
                  generateHologram((fc.args as any).subject);
                }
                sessionPromise.then(s => s.sendToolResponse({
                  functionResponses: [{ id: fc.id, name: fc.name, response: { result: "Rendering complete, Sir." } }]
                }));
              }
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outAudioCtxRef.current) {
              const ctx = outAudioCtxRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.onended = () => activeSourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              activeSourcesRef.current.add(source);
              setState(prev => ({ ...prev, isSpeaking: true }));
            }

            if (message.serverContent?.inputTranscription) currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
            if (message.serverContent?.outputTranscription) currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;

            if (message.serverContent?.turnComplete) {
              const ts = Date.now();
              const input = currentInputTranscriptionRef.current;
              const output = currentOutputTranscriptionRef.current;
              
              setMessages(prev => [
                ...prev,
                ...(input ? [{ id: `in-${ts}`, role: MessageRole.USER, text: input, timestamp: ts }] : []),
                ...(output ? [{ id: `out-${ts}`, role: MessageRole.JARVIS, text: output, timestamp: ts }] : [])
              ]);
              
              if (output) {
                setState(prev => ({ ...prev, memory: [output.slice(0, 50) + "...", ...prev.memory].slice(0, 10) }));
              }
              
              currentInputTranscriptionRef.current = ''; 
              currentOutputTranscriptionRef.current = '';
              setState(prev => ({ ...prev, isSpeaking: false }));
            }

            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              addApiLog("SEQUENCE_OVERRIDE");
            }
          },
          onerror: () => {
            addApiLog("SIGNAL_DEGRADATION");
            stopLiveSession();
          },
          onclose: () => {
            addApiLog("UPLINK_CLOSED");
            stopLiveSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          tools: [{ functionDeclarations: [hologramTool] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }
      });
      sessionPromiseRef.current = sessionPromise;
      await sessionPromise;
    } catch (e) {
      addApiLog("UPLINK_INIT_FAILED");
    }
  };

  const handleSendMessage = async (text: string, imageData?: string) => {
    if (!text.trim() && !imageData) return;
    
    const userMsg: Message = { id: `u-${Date.now()}`, role: MessageRole.USER, text, timestamp: Date.now(), image: imageData };
    setMessages(prev => [...prev, userMsg]);
    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const isScientific = state.currentMode === 'scientific';
      
      let response: GenerateContentResponse;

      if (imageData) {
        addApiLog("ANALYZING_VISUAL_FEED...");
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { data: imageData.split(',')[1], mimeType: 'image/png' } },
              { text: text || "Perform diagnostic analysis, Sir." }
            ]
          }
        });
      } else {
        const model = isScientific ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
        addApiLog(`ENGAGING_${isScientific ? 'RESEARCH_PRO' : 'FLASH_CORE'}...`);
        
        const config: any = { 
          systemInstruction: JARVIS_SYSTEM_INSTRUCTION + `\nCURRENT_DIRECTIVE: ${state.currentMode.toUpperCase()}`,
          temperature: isScientific ? 0.3 : 0.7,
          tools: state.currentMode === 'standard' ? [{ googleSearch: {} }] : undefined
        };

        if (isScientific) {
          config.thinkingConfig = { thinkingBudget: 32768 };
          config.maxOutputTokens = 40000;
        }

        response = await ai.models.generateContent({
          model: model,
          contents: [...messages.slice(-6), userMsg].map(m => ({ 
            role: m.role === MessageRole.USER ? 'user' : 'model', 
            parts: [{ text: m.text }] 
          })),
          config: config
        });
      }

      const groundingLinks: GroundingLink[] = [];
      const metadata = response.candidates?.[0]?.groundingMetadata;
      if (metadata?.groundingChunks) {
        metadata.groundingChunks.forEach((chunk: any) => {
          if (chunk.web) groundingLinks.push({ title: chunk.web.title, uri: chunk.web.uri });
        });
      }

      let resText = response.text || "Diagnostic data corrupted.";
      let resImage: string | undefined;

      const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (imgPart?.inlineData) {
        resImage = `data:image/png;base64,${imgPart.inlineData.data}`;
      }

      setMessages(prev => [...prev, { 
        id: `j-${Date.now()}`, 
        role: MessageRole.JARVIS, 
        text: resText, 
        timestamp: Date.now(),
        image: resImage,
        groundingLinks: groundingLinks.length > 0 ? groundingLinks : undefined
      }]);
      
      setState(prev => ({ 
        ...prev, 
        memory: [resText.slice(0, 50) + "...", ...prev.memory].slice(0, 10) 
      }));
      
      addApiLog("DATA_RECEPTION_COMPLETE");
    } catch (e) { 
      addApiLog("CORE_SYNCHRONIZATION_ERROR"); 
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: MessageRole.JARVIS, text: "Satellite link conflict. Switching to local cache.", timestamp: Date.now() }]);
    } finally { 
      setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 transition-colors duration-700 ${state.currentMode === 'scientific' ? 'theme-scientific' : (state.currentMode === 'engineering' ? 'theme-engineering' : '')}`}>
      <Sidebar memory={state.memory} mode={state.currentMode} apiLogs={state.apiLogs} />
      <main className="flex-1 flex flex-col relative">
        <Header 
          speaking={state.isSpeaking} 
          listening={state.isListening} 
          model={state.isVoiceEnabled ? 'MARK_85_LIVE' : (state.currentMode === 'scientific' ? 'PRO_THINKING' : 'FLASH_V3')} 
        />
        
        <div className="flex-1 flex relative overflow-hidden">
          {state.hologram && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-2xl animate-in fade-in zoom-in duration-500">
              <div className="relative w-full max-w-5xl flex flex-col items-center">
                <button 
                  onClick={() => setState(s => ({...s, hologram: null}))}
                  className="absolute -top-16 right-0 text-cyan-400 border border-cyan-400/30 px-6 py-2 rounded-full hover:bg-cyan-400/10 transition-all mono text-xs uppercase tracking-widest"
                >
                  Terminate_Projection [ESC]
                </button>
                <div className="relative w-full aspect-video glass border border-cyan-400/50 rounded-3xl overflow-hidden shadow-[0_0_120px_rgba(34,211,238,0.15)] flex items-center justify-center p-6">
                  {state.hologram.imageUrl ? (
                    <div className="relative group w-full h-full flex items-center justify-center">
                      <img 
                        src={state.hologram.imageUrl} 
                        alt={state.hologram.subject} 
                        className="max-h-full max-w-full mix-blend-screen opacity-90 drop-shadow-[0_0_40px_rgba(34,211,238,0.6)] animate-pulse" 
                      />
                      <div className="absolute inset-0 bg-cyan-400/5 mix-blend-overlay" />
                      <div className="absolute inset-0 w-full h-3 bg-cyan-400/30 blur-xl animate-[scan_5s_infinite_linear] pointer-events-none" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-8">
                      <div className="w-20 h-20 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                      <div className="mono text-cyan-400 text-sm animate-pulse tracking-[0.4em]">SYNTHESIZING_GEOMETRY...</div>
                    </div>
                  )}
                </div>
                <div className="mt-12 mono text-4xl font-black text-cyan-400 tracking-[1em] uppercase drop-shadow-[0_0_25px_rgba(34,211,238,0.8)]">
                  {state.hologram.subject}
                </div>
              </div>
            </div>
          )}

          <div className="absolute inset-0 pointer-events-none opacity-25">
            <JarvisCore active={state.isProcessing || state.isSpeaking || state.isListening} mode={state.currentMode} />
          </div>
          <div className="flex-1 flex flex-col z-10 px-12 py-8 overflow-hidden">
            <ChatWindow messages={messages} isProcessing={state.isProcessing} />
            <div ref={chatEndRef} />
          </div>
        </div>

        <ControlPanel 
          onSend={handleSendMessage} 
          isProcessing={state.isProcessing} 
          isVoiceEnabled={state.isVoiceEnabled}
          isListening={state.isListening}
          fastProtocol={state.fastProtocol}
          onFastToggle={() => setState(s => ({ ...s, fastProtocol: !s.fastProtocol }))}
          onVoiceToggle={() => {
            if (state.isVoiceEnabled) {
              stopLiveSession();
            } else {
              setState(s => ({ ...s, isVoiceEnabled: true }));
              startLiveSession();
            }
          }}
          onModeChange={(m) => setState(s => ({...s, currentMode: m}))}
        />
      </main>
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(800%); opacity: 0; }
        }
        .theme-scientific { --theme-accent: 139, 92, 246; }
        .theme-engineering { --theme-accent: 245, 158, 11; }
      `}</style>
    </div>
  );
};

export default App;
