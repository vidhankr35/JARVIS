
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
  description: 'Projects a 3D holographic visual. Use for physics schemas, molecules, or structural blueprints.',
  parameters: {
    type: Type.OBJECT,
    properties: { subject: { type: Type.STRING } },
    required: ['subject']
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTheme, setActiveTheme] = useState<JarvisTheme>('MK_85');
  const [state, setState] = useState<JarvisState & { 
    apiLogs: string[], 
    hologram: { subject: string, imageUrl: string | null } | null,
    fastProtocol: boolean
  }>({
    isProcessing: false,
    isListening: false,
    isSpeaking: false,
    isVoiceEnabled: false,
    currentMode: 'standard',
    memory: ["Neural link calibrated.", "Quantum core synced."],
    apiLogs: ["CORE_READY"],
    hologram: null,
    fastProtocol: false
  });

  const sessionRef = useRef<any>(null);
  const outAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  const addLog = useCallback((log: string) => {
    setState(prev => ({ ...prev, apiLogs: [log, ...prev.apiLogs].slice(0, 20) }));
  }, []);

  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem(`chat_${currentUser.username}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        const primeProfile = PRIME_USERS[currentUser.username.toUpperCase()];
        setMessages([{ 
          id: 'init', 
          role: MessageRole.JARVIS, 
          text: INITIAL_GREETING(currentUser.username, primeProfile?.specialization || 'General'), 
          timestamp: Date.now() 
        }]);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && messages.length > 0) {
      localStorage.setItem(`chat_${currentUser.username}`, JSON.stringify(messages));
    }
  }, [messages, currentUser]);

  const handleLogin = (user: User) => {
    sessionStorage.setItem('jarvis_session', JSON.stringify(user));
    setCurrentUser(user);
    setActiveTheme(user.preferredTheme || 'MK_85');
    addLog(`AUTH_SUCCESS: ${user.username}`);
  };

  const handleLogout = () => {
    sessionRef.current?.close();
    sessionStorage.removeItem('jarvis_session');
    setCurrentUser(null);
    setMessages([]);
    addLog("UPLINK_TERMINATED");
  };

  const changeTheme = (theme: JarvisTheme) => {
    setActiveTheme(theme);
    if (currentUser) {
      const updatedUser = { ...currentUser, preferredTheme: theme };
      setCurrentUser(updatedUser);
      sessionStorage.setItem('jarvis_session', JSON.stringify(updatedUser));
    }
    addLog(`THEME_SHIFT: ${theme}`);
  };

  const generateHologram = async (subject: string) => {
    addLog(`INIT_PROJECTION: ${subject}`);
    setState(prev => ({ ...prev, isProcessing: true, hologram: { subject, imageUrl: null } }));
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { 
          parts: [{ text: `3D holographic wireframe of ${subject}, technical blueprint style, monochromatic ${THEMES[activeTheme].primary} lighting, glowing lines on black background.` }] 
        }
      });
      
      const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (imgPart?.inlineData) {
        setState(prev => ({ 
          ...prev, 
          isProcessing: false,
          hologram: { subject, imageUrl: `data:image/png;base64,${imgPart.inlineData.data}` } 
        }));
        addLog(`PROJECTION_READY: ${subject}`);
      } else {
        throw new Error("EMPTY_DATA_PACKET");
      }
    } catch (e) {
      console.error("Hologram Error:", e);
      setState(prev => ({ ...prev, isProcessing: false, hologram: null }));
      addLog(`PROJECTION_FAIL: ${subject}`);
      
      setMessages(prev => [...prev, { 
        id: `err-holo-${Date.now()}`, 
        role: MessageRole.JARVIS, 
        text: ERROR_MESSAGES.PROJECTION_FAILED, 
        timestamp: Date.now(),
        isError: true 
      }]);
    }
  };

  const handleSendMessage = async (text: string, imageData?: string) => {
    if (!text.trim() && !imageData) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: MessageRole.USER, text, timestamp: Date.now(), image: imageData };
    setMessages(prev => [...prev, userMsg]);
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [...messages.slice(-8), userMsg].map(m => ({
          role: m.role === MessageRole.USER ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [HOLOGRAM_TOOL] }, { googleSearch: {} }]
        }
      });

      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'generate_hologram') {
            await generateHologram((fc.args as any).subject);
          }
        }
      }

      setMessages(prev => [...prev, {
        id: `j-${Date.now()}`,
        role: MessageRole.JARVIS,
        text: response.text || 'Calculations complete, Sir.',
        timestamp: Date.now(),
        groundingLinks: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
          title: c.web?.title || 'Data Source',
          uri: c.web?.uri || '#'
        }))
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: MessageRole.JARVIS, text: ERROR_MESSAGES.GENERIC, timestamp: Date.now(), isError: true }]);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const toggleVoice = async () => {
    if (state.isVoiceEnabled) {
      sessionRef.current?.close();
      setState(prev => ({ ...prev, isVoiceEnabled: false, isListening: false }));
      return;
    }

    try {
      if (!outAudioCtxRef.current) {
        outAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        analyzerRef.current = outAudioCtxRef.current.createAnalyser();
        analyzerRef.current.connect(outAudioCtxRef.current.destination);
      }
      
      if (outAudioCtxRef.current.state === 'suspended') {
        await outAudioCtxRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => setState(prev => ({ ...prev, isVoiceEnabled: true, isListening: true })),
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outAudioCtxRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outAudioCtxRef.current.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outAudioCtxRef.current, 24000, 1);
              const source = outAudioCtxRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(analyzerRef.current!);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              setState(prev => ({ ...prev, isSpeaking: true }));
              source.onended = () => setState(prev => ({ ...prev, isSpeaking: false }));
            }
          },
          onclose: () => setState(prev => ({ ...prev, isVoiceEnabled: false, isListening: false })),
          onerror: (e) => addLog(`VOICE_ERR: ${e.error || 'Connection Lost'}`)
        },
        config: { 
          responseModalities: [Modality.AUDIO],
          systemInstruction: JARVIS_SYSTEM_INSTRUCTION
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      addLog("MIC_ACCESS_DENIED");
    }
  };

  if (!currentUser) return <AuthPage onLogin={handleLogin} />;

  return (
    <div className={`flex h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden select-none`}>
      <Sidebar memory={state.memory} mode={state.currentMode} apiLogs={state.apiLogs} theme={activeTheme} onThemeChange={changeTheme} />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Header speaking={state.isSpeaking} listening={state.isListening} user={currentUser} theme={activeTheme} onLogout={handleLogout} />
        <div className="flex-1 relative flex flex-col">
          {state.hologram && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl animate-in fade-in flex flex-col">
              <div className="p-10 flex justify-between items-center z-10">
                <h2 className="mono text-2xl font-black text-cyan-400">{state.hologram.subject}</h2>
                <button onClick={() => setState(s => ({...s, hologram: null}))} className="mono border-2 border-cyan-500/50 px-6 py-2 rounded-full hover:bg-cyan-500/10">CLOSE_PROJECTION</button>
              </div>
              <div className="flex-1">
                {state.hologram.imageUrl && <HologramStage imageUrl={state.hologram.imageUrl} subject={state.hologram.subject} color={THEMES[activeTheme].primary} />}
                {!state.hologram.imageUrl && (
                  <div className="flex-1 flex items-center justify-center animate-pulse">
                     <span className="mono text-cyan-400 text-lg uppercase tracking-[0.5em]">Initializing_Spatial_Tensors...</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <JarvisCore active={state.isProcessing || state.isSpeaking} theme={activeTheme} speaking={state.isSpeaking} />
          </div>
          <div className="flex-1 px-8 py-4 overflow-hidden z-10">
            <ChatWindow messages={messages} isProcessing={state.isProcessing} theme={activeTheme} />
          </div>
        </div>
        <ControlPanel 
          onSend={handleSendMessage}
          isProcessing={state.isProcessing}
          isVoiceEnabled={state.isVoiceEnabled}
          isListening={state.isListening}
          theme={activeTheme}
          onVoiceToggle={toggleVoice}
          onModeChange={(m) => setState(s => ({...s, currentMode: m}))}
          onManualHologram={generateHologram}
        />
      </main>
      <div className="crt-overlay" />
    </div>
  );
};

export default App;
