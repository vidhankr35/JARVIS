
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
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

  const [state, setState] = useState<JarvisState & { 
    apiLogs: string[], 
    hologram: { subject: string, imageUrl: string | null } | null,
    temperature: number,
    thinkingBudget: number,
    isApiValid: boolean | null
  }>({
    isProcessing: false,
    isListening: false,
    isSpeaking: false,
    isVoiceEnabled: false,
    currentMode: 'scientific',
    memory: ["Neural link calibrated.", "Stark Gateway Online."],
    apiLogs: ["CORE_READY", "API_V1_INIT"],
    hologram: null,
    temperature: 0.8,
    thinkingBudget: 12000,
    isApiValid: null
  });

  const sessionRef = useRef<any>(null);
  const outAudioCtxRef = useRef<AudioContext | null>(null);
  const inAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionRef = useRef({ user: '', jarvis: '' });
  const heartbeatRef = useRef<number | null>(null);

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
  }, [validateApiKey]);

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
    
    addLog(`AUTH_SUCCESS: ${user.username}`);
  }, [addLog]);

  const handleLogout = useCallback(() => {
    if (sessionRef.current) sessionRef.current.close();
    if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
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
    if (!validateApiKey()) {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: MessageRole.JARVIS, text: ERROR_MESSAGES.MISSING_KEY, timestamp: Date.now(), isError: true }]);
      return;
    }

    const userMsg: Message = { id: `u-${Date.now()}`, role: MessageRole.USER, text, timestamp: Date.now(), image: imageData };
    setMessages(prev => [...prev, userMsg]);
    setState(prev => ({ ...prev, isProcessing: true }));
    addLog(`POST: /v1/chat`);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Switched to Flash for speed/free-tier reliability
        contents: text,
        config: {
          systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [HOLOGRAM_TOOL] }],
          temperature: state.temperature
        }
      });

      let textOutput = response.text || "";
      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'generate_hologram') {
            generateHologram(fc.args.subject as string);
            if (!textOutput) textOutput = `Certainly, Sir. Initializing holographic projection of the ${fc.args.subject} now.`;
          }
        }
      }

      setMessages(prev => [...prev, {
        id: `j-${Date.now()}`,
        role: MessageRole.JARVIS,
        text: textOutput || "Neural processing complete, Sir.",
        timestamp: Date.now(),
        groundingLinks: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
          title: c.web?.title || 'Telemetry Source',
          uri: c.web?.uri
        }))
      }]);
    } catch (e: any) {
      addLog(`RESPONSE: 500 ERR`);
      const errorMsg = e.message?.includes('quota') ? ERROR_MESSAGES.QUOTA : ERROR_MESSAGES.GENERIC;
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: MessageRole.JARVIS, text: errorMsg, timestamp: Date.now(), isError: true }]);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  if (!currentUser) return <AuthPage onLogin={handleLogin} />;

  return (
    <div className="h-screen w-screen bg-[#010409] text-slate-100 flex overflow-hidden font-mono text-xs selection:bg-cyan-500/30">
      <Sidebar memory={state.memory} mode={state.currentMode} apiLogs={state.apiLogs} theme={activeTheme} onThemeChange={(t) => setActiveTheme(t)} />
      
      <main className="flex-1 flex flex-col relative">
        <Header user={currentUser} theme={activeTheme} speaking={state.isSpeaking} listening={state.isListening} onLogout={handleLogout} apiOk={state.isApiValid} />
        
        <div className="flex-1 relative flex flex-col overflow-hidden">
          <div className="absolute top-4 right-4 z-50 flex gap-2">
             <button onClick={() => setShowApiConsole(!showApiConsole)} className={`px-3 py-1 border rounded transition-all ${showApiConsole ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' : 'border-white/10 text-slate-500 hover:border-white/30'}`}>API_CONSOLE</button>
          </div>

          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <JarvisCore active={state.isProcessing} theme={activeTheme} speaking={state.isSpeaking} />
          </div>

          <div className="flex-1 z-10 p-6 flex gap-6 overflow-hidden">
            <div className={`flex-1 flex flex-col transition-all duration-500 ${showApiConsole ? 'w-1/2' : 'w-full'}`}>
              <ChatWindow messages={messages} isProcessing={state.isProcessing} theme={activeTheme} liveTranscript={liveTranscript} />
            </div>

            {showApiConsole && (
              <div className="w-1/2 flex flex-col animate-in slide-in-from-right-10"><ApiConsole payload={lastPayload} logs={state.apiLogs} theme={activeTheme} /></div>
            )}
            
            {state.hologram && !showApiConsole && (
              <div className="w-[400px] h-full glass border border-white/10 rounded-2xl overflow-hidden relative animate-in zoom-in-95 duration-500">
                <HologramStage imageUrl={state.hologram.imageUrl!} subject={state.hologram.subject} color={THEMES[activeTheme].primary} />
                <button onClick={() => setState(s => ({...s, hologram: null}))} className="absolute bottom-4 right-4 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded text-[9px] text-red-500 hover:bg-red-500/30 transition-all">TERMINATE_PROJECTION</button>
              </div>
            )}
          </div>
        </div>

        <ControlPanel theme={activeTheme} isProcessing={state.isProcessing} isVoiceEnabled={state.isVoiceEnabled} isListening={state.isListening} isSpeaking={state.isSpeaking} onSend={handleSendMessage} onVoiceToggle={toggleVoice} onModeChange={(m) => setState(prev => ({ ...prev, currentMode: m }))} onManualHologram={generateHologram} />
      </main>
      <div className="crt-overlay" />
    </div>
  );
};

export default App;
