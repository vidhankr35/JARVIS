
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, GenerateContentResponse } from '@google/genai';
import { Message, MessageRole, JarvisState, User, JarvisTheme, GroundingLink } from './types';
import { JARVIS_SYSTEM_INSTRUCTION, INITIAL_GREETING, ERROR_MESSAGES, THEMES, PRIME_USERS } from './constants';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import JarvisCore from './components/JarvisCore';
import Sidebar from './components/Sidebar';
import ControlPanel from './components/ControlPanel';
import HologramStage from './components/HologramStage';
import AuthPage from './components/AuthPage';
import ApiConsole from './components/ApiConsole';

// Precise build-time environment declarations
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
    }
  }
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
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

const HOLOGRAM_TOOL: FunctionDeclaration = {
  name: 'generate_hologram',
  description: 'Projects a 3D technical holographic visual. Use ONLY for blueprints, schematics, molecular structures, or complex 3D mechanical models.',
  parameters: {
    type: Type.OBJECT,
    properties: { subject: { type: Type.STRING, description: 'The specific technical object to project' } },
    required: ['subject']
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTheme, setActiveTheme] = useState<JarvisTheme>('MK_85');
  const [showApiConsole, setShowApiConsole] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState({ user: '', jarvis: '' });
  const [streamingText, setStreamingText] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [state, setState] = useState<JarvisState & { 
    apiLogs: string[], 
    hologram: { subject: string, imageUrl: string | null } | null,
    temperature: number,
    isApiValid: boolean | null,
    streamStatus: string | null
  }>({
    isProcessing: false,
    isListening: false,
    isSpeaking: false,
    isVoiceEnabled: false,
    isThinkingMode: false,
    isSearchEnabled: false,
    isSimulationActive: false,
    currentMode: 'scientific',
    memory: ["Neural link calibrated.", "Stark Gateway Online."],
    apiLogs: ["CORE_READY", "API_V1_INIT"],
    hologram: null,
    temperature: 0.7,
    isApiValid: null,
    streamStatus: null
  });

  const chatSessionRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const outAudioCtxRef = useRef<AudioContext | null>(null);
  const inAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionRef = useRef({ user: '', jarvis: '' });

  const addLog = useCallback((log: string) => {
    setState(prev => ({ ...prev, apiLogs: [log, ...prev.apiLogs].slice(0, 30) }));
  }, []);

  const validateApiKey = useCallback(() => {
    const key = process.env.API_KEY;
    const isValid = !!key && key !== 'undefined' && key !== '' && key !== 'your_gemini_api_key_here';
    setState(prev => ({ ...prev, isApiValid: isValid }));
    return isValid;
  }, []);

  useEffect(() => {
    validateApiKey();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [validateApiKey]);

  const initChatSession = useCallback(() => {
    if (!validateApiKey()) return;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const modelName = state.isThinkingMode ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
      
      const config: any = {
        systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
        tools: state.isSearchEnabled ? [{ googleSearch: {} }] : [{ functionDeclarations: [HOLOGRAM_TOOL] }],
        temperature: state.temperature,
        thinkingConfig: state.isThinkingMode ? { thinkingBudget: 32768 } : undefined
      };

      chatSessionRef.current = ai.chats.create({ model: modelName, config });
      addLog(`PROTOCOL_SYNC: ${modelName.toUpperCase()} ACTIVE`);
    } catch (error: any) {
      addLog(`SYNAPSE_FAULT: ${error.message}`);
    }
  }, [validateApiKey, state.temperature, state.isThinkingMode, state.isSearchEnabled, addLog]);

  useEffect(() => {
    if (currentUser) initChatSession();
  }, [state.isThinkingMode, state.isSearchEnabled, currentUser, initChatSession]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.preferredTheme) setActiveTheme(user.preferredTheme);
    const profile = Object.values(PRIME_USERS).find(p => p.name.toUpperCase() === user.username.toUpperCase());
    const greeting = profile ? INITIAL_GREETING(profile.name, profile.specialization) : INITIAL_GREETING(user.username, "General Systems");
    setMessages([{ id: `init-${Date.now()}`, role: MessageRole.JARVIS, text: greeting, timestamp: Date.now() }]);
    addLog(`IDENTITY_VERIFIED: ${user.username}`);
  };

  const handleLogout = () => {
    if (sessionRef.current) sessionRef.current.close();
    chatSessionRef.current = null;
    setCurrentUser(null);
    setMessages([]);
    setState(prev => ({ ...prev, isVoiceEnabled: false, isListening: false, isSpeaking: false, hologram: null }));
    addLog("UPLINK_TERMINATED");
  };

  const generateHologramImage = async (subject: string) => {
    if (!validateApiKey()) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: `Highly detailed cyan 3D holographic blueprint of ${subject}, technical schematic style, dark background.` }] }],
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          setState(prev => ({ ...prev, hologram: { subject, imageUrl } }));
          addLog(`VISUAL_RENDERED: ${subject.toUpperCase()}`);
          break;
        }
      }
    } catch (e: any) { addLog(`OPTIC_ERR: ${e.message}`); }
  };

  const handleSend = async (text: string, imageData?: string) => {
    if (!chatSessionRef.current) initChatSession();
    if (!chatSessionRef.current) return;

    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: MessageRole.USER, text, timestamp: Date.now(), image: imageData }]);
    setState(prev => ({ ...prev, isProcessing: true, streamStatus: 'Analyzing...' }));
    setStreamingText('');

    try {
      const parts: any[] = imageData ? [{ inlineData: { mimeType: 'image/jpeg', data: imageData.split(',')[1] } }, { text }] : [{ text }];
      const streamResponse = await chatSessionRef.current.sendMessageStream({ message: parts });

      let fullText = '';
      let links: GroundingLink[] = [];

      for await (const chunk of streamResponse) {
        const textChunk = chunk.text || '';
        fullText += textChunk;
        setStreamingText(fullText);

        const ground = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (ground) {
          ground.forEach((c: any) => {
            if (c.web) links.push({ title: c.web.title || 'Source', uri: c.web.uri });
          });
        }

        if (chunk.functionCalls) {
          for (const fc of chunk.functionCalls) {
            if (fc.name === 'generate_hologram') {
              generateHologramImage(fc.args.subject as string);
            }
          }
        }
      }

      setMessages(prev => [...prev, { id: `j-${Date.now()}`, role: MessageRole.JARVIS, text: fullText, timestamp: Date.now(), groundingLinks: links }]);
      setStreamingText('');
      addLog("UPLINK_SUCCESS");
    } catch (error: any) {
      addLog(`CORE_FAULT: ${error.message}`);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false, streamStatus: null }));
    }
  };

  const toggleVoice = async () => {
    if (state.isVoiceEnabled) {
      sessionRef.current?.close();
      setState(prev => ({ ...prev, isVoiceEnabled: false, isListening: false, isSpeaking: false }));
      return;
    }

    if (!validateApiKey()) return;

    try {
      setState(prev => ({ ...prev, isVoiceEnabled: true, isProcessing: true }));
      outAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      nextStartTimeRef.current = 0;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setState(prev => ({ ...prev, isListening: true, isProcessing: false }));
            const source = inAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inAudioCtxRef.current!.destination);
            sessionRef.current = { close: () => { scriptProcessor.disconnect(); source.disconnect(); stream.getTracks().forEach(t => t.stop()); } };
            addLog("VOICE_UPLINK: ONLINE");
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              if (outAudioCtxRef.current?.state === 'suspended') await outAudioCtxRef.current.resume();
              setState(prev => ({ ...prev, isSpeaking: true }));
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outAudioCtxRef.current!.currentTime);
              const buffer = await decodeAudioData(decode(msg.serverContent.modelTurn.parts[0].inlineData.data), outAudioCtxRef.current!, 24000, 1);
              const source = outAudioCtxRef.current!.createBufferSource();
              source.buffer = buffer;
              source.connect(outAudioCtxRef.current!.destination);
              source.onended = () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) setState(prev => ({ ...prev, isSpeaking: false }));
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
            }
            if (msg.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => { try { s.stop(); } catch {} });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = outAudioCtxRef.current?.currentTime || 0;
              setState(prev => ({ ...prev, isSpeaking: false }));
            }
            if (msg.serverContent?.inputTranscription) {
              transcriptionRef.current.user += msg.serverContent.inputTranscription.text;
              setLiveTranscript(prev => ({ ...prev, user: transcriptionRef.current.user }));
            }
            if (msg.serverContent?.outputTranscription) {
              transcriptionRef.current.jarvis += msg.serverContent.outputTranscription.text;
              setLiveTranscript(prev => ({ ...prev, jarvis: transcriptionRef.current.jarvis }));
            }
            if (msg.serverContent?.turnComplete) {
              transcriptionRef.current = { user: '', jarvis: '' };
              setTimeout(() => setLiveTranscript({ user: '', jarvis: '' }), 4000);
            }
          },
          onerror: (e) => {
            addLog(`UPLINK_ERR: ${e.toString()}`);
            setState(prev => ({ ...prev, isVoiceEnabled: false, isListening: false, isSpeaking: false }));
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
          inputAudioTranscription: {}, outputAudioTranscription: {}
        }
      });
    } catch (e: any) { 
      addLog(`COMMS_FAULT: ${e.message}`);
      setState(prev => ({ ...prev, isVoiceEnabled: false, isProcessing: false })); 
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#010409] text-slate-200 overflow-hidden">
      {!currentUser ? <AuthPage onLogin={handleLogin} /> : (
        <>
          <Header user={currentUser} theme={activeTheme} onLogout={handleLogout} speaking={state.isSpeaking} listening={state.isListening} apiOk={state.isApiValid} onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)} isMobile={isMobile} />
          <div className="flex flex-1 overflow-hidden relative">
            {!isMobile && <Sidebar memory={state.memory} mode={state.currentMode} apiLogs={state.apiLogs} theme={activeTheme} onThemeChange={setActiveTheme} isThinkingMode={state.isThinkingMode} isSearchEnabled={state.isSearchEnabled} onToggleThinking={() => setState(s => ({ ...s, isThinkingMode: !s.isThinkingMode, isSearchEnabled: false }))} onToggleSearch={() => setState(s => ({ ...s, isSearchEnabled: !s.isSearchEnabled, isThinkingMode: false }))} isSimulationActive={state.isSimulationActive} onToggleSimulation={() => setState(s => ({ ...s, isSimulationActive: !s.isSimulationActive }))} />}
            <main className="flex-1 flex flex-col relative overflow-hidden">
              <div className="flex-1 p-4 lg:p-10 flex flex-col overflow-hidden">
                 {state.hologram ? (
                   <div className="flex-1 relative">
                      <HologramStage imageUrl={state.hologram.imageUrl!} subject={state.hologram.subject} color={THEMES[activeTheme].primary} simulationActive={state.isSimulationActive} />
                      <div className="absolute top-4 right-4 flex gap-2 z-50">
                        <button onClick={() => setState(s => ({ ...s, isSimulationActive: !s.isSimulationActive }))} className={`px-4 py-2 glass rounded-full text-[10px] mono border transition-all uppercase tracking-widest ${state.isSimulationActive ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400' : 'border-white/20 text-slate-400'}`}>SIM: {state.isSimulationActive ? 'ON' : 'OFF'}</button>
                        <button onClick={() => setState(s => ({ ...s, hologram: null }))} className="px-4 py-2 glass rounded-full text-[10px] mono text-red-400 border border-red-400/20 uppercase tracking-widest">CLOSE</button>
                      </div>
                   </div>
                 ) : showApiConsole ? <ApiConsole payload={null} logs={state.apiLogs} theme={activeTheme} /> : (
                   <ChatWindow messages={messages} isProcessing={state.isProcessing} theme={activeTheme} liveTranscript={liveTranscript} streamingText={streamingText} streamStatus={state.streamStatus} />
                 )}
              </div>
              <ControlPanel onSend={handleSend} isProcessing={state.isProcessing} isVoiceEnabled={state.isVoiceEnabled} isListening={state.isListening} isSpeaking={state.isSpeaking} theme={activeTheme} onVoiceToggle={toggleVoice} onModeChange={m => setState(s => ({ ...s, currentMode: m }))} onManualHologram={s => generateHologramImage(s)} isMobile={isMobile} isThinkingMode={state.isThinkingMode} isSearchEnabled={state.isSearchEnabled} onToggleThinking={() => setState(s => ({ ...s, isThinkingMode: !s.isThinkingMode, isSearchEnabled: false }))} onToggleSearch={() => setState(s => ({ ...s, isSearchEnabled: !s.isSearchEnabled, isThinkingMode: false }))} isSimulationActive={state.isSimulationActive} onToggleSimulation={() => setState(s => ({ ...s, isSimulationActive: !s.isSimulationActive }))} />
            </main>
            {!isMobile && <div className="w-1/3 border-l border-white/5 bg-black/20 relative hidden lg:block"><JarvisCore active={state.isProcessing} theme={activeTheme} speaking={state.isSpeaking} /></div>}
          </div>
        </>
      )}
    </div>
  );
};

export default App;
