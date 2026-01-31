
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
  description: 'Projects a 3D technical holographic visual. Use ONLY for blueprints, schematics, molecular structures, or complex 3D mechanical models. DO NOT use for plain text or simple concepts.',
  parameters: {
    type: Type.OBJECT,
    properties: { subject: { type: Type.STRING, description: 'The specific technical object to project (e.g., "Arc Reactor Blueprint", "Carbon Nanotube Lattice")' } },
    required: ['subject']
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTheme, setActiveTheme] = useState<JarvisTheme>('MK_85');
  const [showApiConsole, setShowApiConsole] = useState(false);
  const [lastPayload, setLastPayload] = useState<any>(null);

  // Added liveTranscript to track real-time speech
  const [liveTranscript, setLiveTranscript] = useState({ user: '', jarvis: '' });

  const [state, setState] = useState<JarvisState & { 
    apiLogs: string[], 
    hologram: { subject: string, imageUrl: string | null } | null,
    temperature: number,
    thinkingBudget: number
  }>({
    isProcessing: false,
    isListening: false,
    isSpeaking: false,
    isVoiceEnabled: false,
    currentMode: 'scientific',
    memory: ["Neural link calibrated.", "Stark Gateway Online."],
    apiLogs: ["CORE_READY", "API_V1_INIT"],
    hologram: null,
    temperature: 0.7,
    thinkingBudget: 16000
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
    if (!key || key === 'undefined' || key === 'API_KEY') {
      addLog("GATEWAY_ERR: KEY_NOT_FOUND");
      return false;
    }
    return true;
  }, [addLog]);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    if (user.preferredTheme) {
      setActiveTheme(user.preferredTheme);
    }
    
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
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
    if (inAudioCtxRef.current) inAudioCtxRef.current.close().catch(() => {});
    if (outAudioCtxRef.current) outAudioCtxRef.current.close().catch(() => {});
    
    setCurrentUser(null);
    setMessages([]);
    setState(prev => ({
      ...prev,
      isVoiceEnabled: false,
      isListening: false,
      isSpeaking: false,
      isProcessing: false,
      hologram: null
    }));
    addLog("SESSION_TERMINATED");
  }, [addLog]);

  const toggleVoice = async () => {
    if (state.isVoiceEnabled) {
      sessionRef.current?.close();
      if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
      if (inAudioCtxRef.current) inAudioCtxRef.current.close().catch(() => {});
      if (outAudioCtxRef.current) outAudioCtxRef.current.close().catch(() => {});
      setState(prev => ({ ...prev, isVoiceEnabled: false, isListening: false, isSpeaking: false }));
      setLiveTranscript({ user: '', jarvis: '' });
      addLog("VOICE_LINK: SEVERED");
      return;
    }

    if (!validateApiKey()) {
      setMessages(prev => [...prev, {
        id: `err-voice-${Date.now()}`,
        role: MessageRole.JARVIS,
        text: "Sir, I cannot establish a voice link without a valid API_KEY uplink.",
        timestamp: Date.now(),
        isError: true
      }]);
      return;
    }

    try {
      addLog("VOICE_LINK: INITIALIZING");
      setState(prev => ({ ...prev, isVoiceEnabled: true, isProcessing: true }));

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      outAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      await outAudioCtxRef.current.resume();
      await inAudioCtxRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            addLog("VOICE_LINK: ESTABLISHED");
            setState(prev => ({ ...prev, isProcessing: false, isListening: true }));

            const source = inAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inAudioCtxRef.current!.createScriptProcessor(8192, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => {
                 if (s && state.isVoiceEnabled) s.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inAudioCtxRef.current!.destination);

            // Keep-alive heartbeat to prevent 500 errors on idle
            heartbeatRef.current = window.setInterval(() => {
              const silentPcm = new Int16Array(100).fill(0);
              sessionPromise.then(s => {
                if (s) s.sendRealtimeInput({ media: { data: encode(new Uint8Array(silentPcm.buffer)), mimeType: 'audio/pcm;rate=16000' } });
              });
            }, 30000);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Streaming transcriptions for immediate visual feedback
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              transcriptionRef.current.user += text;
              setLiveTranscript(prev => ({ ...prev, user: transcriptionRef.current.user }));
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              transcriptionRef.current.jarvis += text;
              setLiveTranscript(prev => ({ ...prev, jarvis: transcriptionRef.current.jarvis }));
            }

            if (message.serverContent?.turnComplete) {
              const userText = transcriptionRef.current.user;
              const jarvisText = transcriptionRef.current.jarvis;
              
              if (userText || jarvisText) {
                setMessages(prev => [
                  ...prev,
                  ...(userText ? [{ id: `uv-${Date.now()}`, role: MessageRole.USER, text: userText, timestamp: Date.now() }] : []),
                  ...(jarvisText ? [{ id: `jv-${Date.now()}`, role: MessageRole.JARVIS, text: jarvisText, timestamp: Date.now() }] : [])
                ]);
                transcriptionRef.current = { user: '', jarvis: '' };
                setLiveTranscript({ user: '', jarvis: '' });
              }
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              if (outAudioCtxRef.current?.state === 'suspended') {
                await outAudioCtxRef.current.resume();
              }
              setState(prev => ({ ...prev, isSpeaking: true }));
              const ctx = outAudioCtxRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.onended = () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) {
                  setState(prev => ({ ...prev, isSpeaking: false }));
                }
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e){} });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setState(prev => ({ ...prev, isSpeaking: false }));
              setLiveTranscript({ user: '', jarvis: '' });
              transcriptionRef.current = { user: '', jarvis: '' };
              addLog("VOICE_LINK: INTERRUPTED");
            }
          },
          onclose: () => {
            addLog("VOICE_LINK: CLOSED");
            setState(prev => ({ ...prev, isVoiceEnabled: false, isListening: false, isSpeaking: false }));
            if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
          },
          onerror: (e) => {
            console.error("Voice Error:", e);
            addLog("VOICE_LINK: ERR_INTERNAL");
            setState(prev => ({ ...prev, isVoiceEnabled: false, isListening: false }));
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: JARVIS_SYSTEM_INSTRUCTION + `\nVOICE_PROTOCOL: Active. Be extremely witty, fast-paced, and sophisticated. Use the user's name often. Keep audio responses concise. No robotic fillers.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } // Switched to Fenrir for a more 'Jarvis' tone
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      sessionRef.current = await sessionPromise;

    } catch (e) {
      console.error(e);
      setState(prev => ({ ...prev, isVoiceEnabled: false }));
      addLog("VOICE_LINK: HANDSHAKE_FAILED");
    }
  };

  const generateHologram = async (subject: string) => {
    if (!validateApiKey()) return;
    addLog(`API_CALL: /v1/hologram/${subject}`);
    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `High-detail blueprint of ${subject}, physics schematic style, cyan blueprints.` }] }
      });
      
      const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (imgPart?.inlineData) {
        setState(prev => ({ 
          ...prev, 
          isProcessing: false,
          hologram: { subject, imageUrl: `data:image/png;base64,${imgPart.inlineData.data}` } 
        }));
        addLog(`RESPONSE: 200 OK (BINARY_DATA)`);
      }
    } catch (e) {
      addLog(`RESPONSE: 500 ERR`);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleSendMessage = async (text: string, imageData?: string) => {
    if (!text.trim() && !imageData) return;
    if (!validateApiKey()) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: MessageRole.USER, text, timestamp: Date.now(), image: imageData };
    setMessages(prev => [...prev, userMsg]);
    setState(prev => ({ ...prev, isProcessing: true }));
    
    const payload = {
      model: "stark-neural-1.0",
      prompt: text,
      config: { temperature: state.temperature, thinking_budget: state.thinkingBudget }
    };
    setLastPayload(payload);
    addLog(`POST: /api/v1/jarvis/think`);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text }] },
        config: {
          systemInstruction: JARVIS_SYSTEM_INSTRUCTION + "\n\nCRITICAL: If you trigger a function, you MUST still provide a text response explaining what you are doing. Never return an empty text field. ONLY use the hologram tool for technical visualizations.",
          tools: [{ functionDeclarations: [HOLOGRAM_TOOL] }],
          thinkingConfig: { thinkingBudget: state.thinkingBudget },
          temperature: state.temperature
        }
      });

      addLog(`RESPONSE: 200 OK (JSON_STARK)`);
      
      let textOutput = response.text;
      
      if (!textOutput && response.functionCalls) {
        const fc = response.functionCalls[0];
        if (fc.name === 'generate_hologram') {
          textOutput = `Sir, I am initializing a holographic projection of the ${fc.args.subject}. Calibrating spatial emitters now.`;
        }
      }
      
      if (!textOutput) textOutput = "Neural processing complete. Standing by for further directives.";
      
      setMessages(prev => [...prev, {
        id: `j-${Date.now()}`,
        role: MessageRole.JARVIS,
        text: textOutput!,
        timestamp: Date.now(),
        groundingLinks: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
          title: c.web?.title || 'Data Stream',
          uri: c.web?.uri
        }))
      }]);

      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'generate_hologram') {
            generateHologram(fc.args.subject as string);
          }
        }
      }
    } catch (e) {
      addLog(`RESPONSE: 500 ERR`);
      setState(prev => ({ ...prev, isProcessing: false }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  if (!currentUser) return <AuthPage onLogin={handleLogin} />;

  return (
    <div className="h-screen w-screen bg-[#010409] text-slate-100 flex overflow-hidden font-mono text-xs">
      <Sidebar 
        memory={state.memory} 
        mode={state.currentMode} 
        apiLogs={state.apiLogs} 
        theme={activeTheme}
        onThemeChange={(t) => setActiveTheme(t)}
      />
      
      <main className="flex-1 flex flex-col relative">
        <Header 
          user={currentUser} 
          theme={activeTheme} 
          speaking={state.isSpeaking}
          listening={state.isListening}
          onLogout={handleLogout}
        />
        
        <div className="flex-1 relative flex flex-col overflow-hidden">
          <div className="absolute top-4 right-4 z-50 flex gap-2">
             <button 
              onClick={() => setShowApiConsole(!showApiConsole)}
              className={`px-3 py-1 border rounded transition-all ${showApiConsole ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' : 'border-white/10 text-slate-500 hover:border-white/30'}`}
             >
               API_CONSOLE
             </button>
          </div>

          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <JarvisCore active={state.isProcessing} theme={activeTheme} speaking={state.isSpeaking} />
          </div>

          <div className="flex-1 z-10 p-6 flex gap-6 overflow-hidden">
            <div className={`flex-1 flex flex-col transition-all duration-500 ${showApiConsole ? 'w-1/2' : 'w-full'}`}>
              <ChatWindow 
                messages={messages} 
                isProcessing={state.isProcessing} 
                theme={activeTheme} 
                liveTranscript={liveTranscript}
              />
            </div>

            {showApiConsole && (
              <div className="w-1/2 flex flex-col animate-in slide-in-from-right-10">
                 <ApiConsole payload={lastPayload} logs={state.apiLogs} theme={activeTheme} />
              </div>
            )}
            
            {state.hologram && !showApiConsole && (
              <div className="w-[400px] h-full glass border border-white/10 rounded-2xl overflow-hidden relative animate-in zoom-in-95 duration-500">
                <HologramStage imageUrl={state.hologram.imageUrl!} subject={state.hologram.subject} color={THEMES[activeTheme].primary} />
                <button onClick={() => setState(s => ({...s, hologram: null}))} className="absolute bottom-4 right-4 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded text-[9px] text-red-500 uppercase hover:bg-red-500/30 transition-all">Clear_Projection</button>
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
        />
      </main>
      <div className="crt-overlay" />
    </div>
  );
};

export default App;
