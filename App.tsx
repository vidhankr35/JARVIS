
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, GenerateContentResponse, Chat } from '@google/genai';
import { Message, MessageRole, JarvisState, GroundingLink, User, SubscriptionLevel, JarvisTheme } from './types';
import { JARVIS_SYSTEM_INSTRUCTION, INITIAL_GREETING, ERROR_MESSAGES, THEMES, PRIME_USERS } from './constants';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import JarvisCore from './components/JarvisCore';
import Sidebar from './components/Sidebar';
import ControlPanel from './components/ControlPanel';
import HologramStage from './components/HologramStage';
import AuthPage from './components/AuthPage';
import ApiConsole from './components/ApiConsole';

// Helper functions for Live API
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
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
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [liveTranscript, setLiveTranscript] = useState({ user: '', jarvis: '' });
  const [streamingText, setStreamingText] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [state, setState] = useState<JarvisState & { 
    apiLogs: string[], 
    hologram: { subject: string, imageUrl: string | null } | null,
    temperature: number,
    thinkingBudget: number,
    isApiValid: boolean | null,
    streamStatus: string | null
  }>({
    isProcessing: false,
    isListening: false,
    isSpeaking: false,
    isVoiceEnabled: false,
    isThinkingMode: false,
    isSearchEnabled: false,
    currentMode: 'scientific',
    memory: ["Neural link calibrated.", "Stark Gateway Online."],
    apiLogs: ["CORE_READY", "API_V1_INIT"],
    hologram: null,
    temperature: 0.7,
    thinkingBudget: 0,
    isApiValid: null,
    streamStatus: null
  });

  const chatSessionRef = useRef<Chat | null>(null);
  const sessionRef = useRef<any>(null);
  const outAudioCtxRef = useRef<AudioContext | null>(null);
  const inAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionRef = useRef({ user: '', jarvis: '' });

  const addLog = useCallback((log: string) => {
    setState(prev => ({ ...prev, apiLogs: [log, ...prev.apiLogs].slice(0, 20) }));
  }, []);

  const validateApiKey = useCallback(() => {
    const key = process.env.API_KEY;
    const isValid = !!key && key !== 'undefined' && key !== '' && key !== 'your_gemini_api_key_here';
    setState(prev => ({ ...prev, isApiValid: isValid }));
    if (!isValid) addLog("GATEWAY_ERR: INVALID_KEY");
    return isValid;
  }, [addLog]);

  useEffect(() => {
    validateApiKey();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [validateApiKey]);

  // Initialize Chat Session
  const initChatSession = useCallback(() => {
    if (!validateApiKey()) return;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    // Choose model based on mode
    // Thinking Mode: gemini-3-pro-preview
    // Search/Standard: gemini-3-flash-preview
    const modelName = state.isThinkingMode ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    const config: any = {
      systemInstruction: JARVIS_SYSTEM_INSTRUCTION + (isMobile ? "\n\nCRITICAL: User is on mobile. Be extremely concise." : ""),
      tools: [{ functionDeclarations: [HOLOGRAM_TOOL] }],
      temperature: state.temperature
    };

    if (state.isThinkingMode) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    }

    if (state.isSearchEnabled && !state.isThinkingMode) {
      config.tools.push({ googleSearch: {} });
    }

    chatSessionRef.current = ai.chats.create({
      model: modelName,
      config: config
    });
    addLog(`NEURAL_SESSION: CREATED [MODEL: ${modelName.toUpperCase()}]`);
  }, [validateApiKey, state.temperature, state.isThinkingMode, state.isSearchEnabled, addLog, isMobile]);

  // Re-init session if modes change
  useEffect(() => {
    if (currentUser) initChatSession();
  }, [state.isThinkingMode, state.isSearchEnabled]);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    if (user.preferredTheme) setActiveTheme(user.preferredTheme);
    
    const profile = Object.values(PRIME_USERS).find(p => p.name.toUpperCase() === user.username.toUpperCase());
    const greetingText = profile 
      ? INITIAL_GREETING(profile.name, profile.specialization) 
      : INITIAL_GREETING(user.username, "General Systems Management");

    setMessages([{
      id: `init-${Date.now()}`,
      role: MessageRole.JARVIS,
      text: greetingText,
      timestamp: Date.now()
    }]);
    
    initChatSession();
    addLog(`AUTH_SUCCESS: ${user.username}`);
  }, [addLog, initChatSession]);

  const handleLogout = useCallback(() => {
    if (sessionRef.current) sessionRef.current.close();
    chatSessionRef.current = null;
    setCurrentUser(null);
    setMessages([]);
    setState(prev => ({ ...prev, isVoiceEnabled: false, isListening: false, isSpeaking: false, hologram: null }));
    addLog("SESSION_TERMINATED");
  }, [addLog]);

  const toggleVoice = async () => {
    if (state.isVoiceEnabled) {
      sessionRef.current?.close();
      setState(prev => ({ ...prev, isVoiceEnabled: false, isListening: false, isSpeaking: false }));
      return;
    }

    if (!validateApiKey()) {
      setMessages(prev => [...prev, { id: `err-voice-${Date.now()}`, role: MessageRole.JARVIS, text: ERROR_MESSAGES.MISSING_KEY, timestamp: Date.now(), isError: true }]);
      return;
    }

    try {
      addLog("VOICE_LINK: INIT");
      setState(prev => ({ ...prev, isVoiceEnabled: true, isProcessing: true }));
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      outAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            addLog("VOICE_LINK: LIVE");
            setState(prev => ({ ...prev, isProcessing: false, isListening: true }));
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
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              transcriptionRef.current.user += message.serverContent.inputTranscription.text;
              setLiveTranscript(prev => ({ ...prev, user: transcriptionRef.current.user }));
            }
            if (message.serverContent?.outputTranscription) {
              transcriptionRef.current.jarvis += message.serverContent.outputTranscription.text;
              setLiveTranscript(prev => ({ ...prev, jarvis: transcriptionRef.current.jarvis }));
            }
            if (message.serverContent?.turnComplete) {
              const uText = transcriptionRef.current.user;
              const jText = transcriptionRef.current.jarvis;
              if (uText || jText) {
                setMessages(prev => [...prev, 
                  ...(uText ? [{ id: `uv-${Date.now()}`, role: MessageRole.USER, text: uText, timestamp: Date.now() }] : []),
                  ...(jText ? [{ id: `jv-${Date.now()}`, role: MessageRole.JARVIS, text: jText, timestamp: Date.now() }] : [])
                ]);
                transcriptionRef.current = { user: '', jarvis: '' };
                setLiveTranscript({ user: '', jarvis: '' });
              }
            }
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setState(prev => ({ ...prev, isSpeaking: true }));
              const buffer = await decodeAudioData(decode(audioData), outAudioCtxRef.current!, 24000, 1);
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
          },
          onclose: () => setState(prev => ({ ...prev, isVoiceEnabled: false, isListening: false, isSpeaking: false })),
          onerror: (e) => { addLog("VOICE_LINK: ERR"); setState(prev => ({ ...prev, isVoiceEnabled: false })); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      setState(prev => ({ ...prev, isVoiceEnabled: false }));
      addLog("VOICE_LINK: FAIL");
    }
  };

  const generateHologram = async (subject: string) => {
    if (!validateApiKey()) return;
    addLog(`PROJECTION: ${subject}`);
    setState(prev => ({ ...prev, isProcessing: true }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: `Blueprint/schematic of ${subject}, cyan technical drawing, stark industries style.`
      });
      const img = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (img?.inlineData) {
        setState(prev => ({ ...prev, isProcessing: false, hologram: { subject, imageUrl: `data:image/png;base64,${img.inlineData.data}` } }));
        addLog("RESPONSE: 200 OK");
      }
    } catch (e) {
      addLog("RESPONSE: 500 ERR");
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleSendMessage = async (text: string, imageData?: string) => {
    if (!text.trim() && !imageData) return;
    
    if (!chatSessionRef.current) {
      initChatSession();
      if (!chatSessionRef.current) return;
    }

    const userMsg: Message = { id: `u-${Date.now()}`, role: MessageRole.USER, text, timestamp: Date.now(), image: imageData };
    setMessages(prev => [...prev, userMsg]);
    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      streamStatus: state.isThinkingMode ? 'NEURAL_SYNAPSE_FIRING' : 'OPTIMIZING_COGNITION' 
    }));
    setStreamingText('');
    
    const startTime = Date.now();
    addLog(`UPLINK_SENT [${state.isThinkingMode ? 'THINK' : 'STD'}]: ${text.substring(0, 15)}...`);

    try {
      const messageInput = imageData ? {
        parts: [
          { inlineData: { data: imageData.split(',')[1], mimeType: 'image/jpeg' } },
          { text }
        ]
      } : text;

      const stream = await chatSessionRef.current.sendMessageStream({ message: messageInput });

      let fullText = '';
      let fullThinking = '';
      let groundingLinks: GroundingLink[] = [];

      setState(prev => ({ ...prev, streamStatus: 'RECONSTRUCTING_DATA' }));

      for await (const chunk of stream) {
        // Handle thinking part
        const thinkingPart = chunk.candidates?.[0]?.content?.parts?.find(p => p.thought);
        if (thinkingPart) {
          fullThinking += thinkingPart.thought;
        }

        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setStreamingText(fullText);
        }

        // Extract grounding chunks if available
        const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          chunks.forEach((c: any) => {
            if (c.web?.uri && c.web?.title) {
              if (!groundingLinks.find(l => l.uri === c.web.uri)) {
                groundingLinks.push({ title: c.web.title, uri: c.web.uri });
              }
            }
          });
        }

        if (chunk.candidates?.[0]?.content?.parts) {
          for (const part of chunk.candidates[0].content.parts) {
            if (part.functionCall && part.functionCall.name === 'generate_hologram') {
              const args = part.functionCall.args as { subject: string };
              generateHologram(args.subject);
            }
          }
        }
      }

      addLog(`RESPONSE_RECEIVED: ${Date.now() - startTime}ms`);
      setMessages(prev => [...prev, { 
        id: `j-${Date.now()}`, 
        role: MessageRole.JARVIS, 
        text: fullText || "Neural processing complete.", 
        timestamp: Date.now(),
        thinking: fullThinking || undefined,
        groundingLinks: groundingLinks.length > 0 ? groundingLinks : undefined
      }]);
      setStreamingText('');
      setState(prev => ({ ...prev, streamStatus: 'SYNC_COMPLETE' }));
    } catch (e: any) {
      addLog(`CORE_FAULT: ${e.message}`);
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: MessageRole.JARVIS, text: ERROR_MESSAGES.GENERIC, timestamp: Date.now(), isError: true }]);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false, streamStatus: null }));
    }
  };

  if (!currentUser) return <AuthPage onLogin={handleLogin} />;

  return (
    <div className="h-full w-full bg-[#010409] text-slate-100 flex overflow-hidden font-mono text-xs selection:bg-cyan-500/30 relative">
      {/* Sidebar - Conditional Drawer for Mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          memory={state.memory} 
          mode={state.currentMode} 
          apiLogs={state.apiLogs} 
          theme={activeTheme} 
          onThemeChange={(t) => setActiveTheme(t)} 
          isThinkingMode={state.isThinkingMode}
          isSearchEnabled={state.isSearchEnabled}
          onToggleThinking={() => setState(s => ({...s, isThinkingMode: !s.isThinkingMode, isSearchEnabled: s.isThinkingMode ? s.isSearchEnabled : false }))}
          onToggleSearch={() => setState(s => ({...s, isSearchEnabled: !s.isSearchEnabled, isThinkingMode: s.isSearchEnabled ? s.isThinkingMode : false }))}
        />
        {isMobile && isSidebarOpen && <button onClick={() => setIsSidebarOpen(false)} className="fixed top-4 right-[-40px] w-8 h-8 glass flex items-center justify-center rounded-r-lg text-cyan-400">×</button>}
      </div>

      {isMobile && isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setIsSidebarOpen(false)} />}
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Header user={currentUser} theme={activeTheme} speaking={state.isSpeaking} listening={state.isListening} onLogout={handleLogout} apiOk={state.isApiValid} onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)} isMobile={isMobile} />
        
        <div className="flex-1 relative flex flex-col overflow-hidden">
          {!isMobile && (
            <div className="absolute top-4 right-4 z-50 flex gap-2">
               <button onClick={() => setShowApiConsole(!showApiConsole)} className={`px-3 py-1 border rounded transition-all ${showApiConsole ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' : 'border-white/10 text-slate-500 hover:border-white/30'}`}>API_CONSOLE</button>
            </div>
          )}

          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <JarvisCore active={state.isProcessing} theme={activeTheme} speaking={state.isSpeaking} />
          </div>

          <div className="flex-1 z-10 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
            <div className={`flex-1 flex flex-col transition-all duration-500 ${showApiConsole ? 'lg:w-1/2' : 'w-full'}`}>
              <ChatWindow messages={messages} isProcessing={state.isProcessing} theme={activeTheme} liveTranscript={liveTranscript} streamingText={streamingText} streamStatus={state.streamStatus} />
            </div>

            {showApiConsole && !isMobile && (
              <div className="lg:w-1/2 flex flex-col animate-in slide-in-from-right-10"><ApiConsole payload={lastPayload} logs={state.apiLogs} theme={activeTheme} /></div>
            )}
            
            {state.hologram && (
              <div className={`${isMobile ? 'h-64' : 'w-[400px] h-full'} glass border border-white/10 rounded-2xl overflow-hidden relative animate-in zoom-in-95 duration-500 shrink-0`}>
                <HologramStage imageUrl={state.hologram.imageUrl!} subject={state.hologram.subject} color={THEMES[activeTheme].primary} />
                <button onClick={() => setState(s => ({...s, hologram: null}))} className="absolute bottom-4 right-4 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded text-[9px] text-red-500 hover:bg-red-500/30 transition-all">TERMINATE</button>
              </div>
            )}
          </div>
        </div>

        <ControlPanel 
          theme={activeTheme} 
          isProcessing={state.isProcessing} 
          isVoiceEnabled={state.isVoiceEnabled} 
          isListening={state.isListening} 
          isSpeaking={state.isSpeaking} 
          onSend={handleSendMessage} 
          onVoiceToggle={toggleVoice} 
          onModeChange={(m) => setState(prev => ({ ...prev, currentMode: m }))} 
          onManualHologram={generateHologram} 
          isMobile={isMobile}
          isThinkingMode={state.isThinkingMode}
          isSearchEnabled={state.isSearchEnabled}
          onToggleThinking={() => setState(s => ({...s, isThinkingMode: !s.isThinkingMode}))}
          onToggleSearch={() => setState(s => ({...s, isSearchEnabled: !s.isSearchEnabled}))}
        />
      </main>
      <div className="crt-overlay" />
    </div>
  );
};

export default App;
