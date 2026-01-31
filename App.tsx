
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, GenerateContentResponse, Chat, GroundingLink } from '@google/genai';
import { Message, MessageRole, JarvisState, User, SubscriptionLevel, JarvisTheme } from './types';
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
    setState(prev => ({ ...prev, apiLogs: [log, ...prev.apiLogs].slice(0, 30) }));
  }, []);

  const validateApiKey = useCallback(() => {
    const key = process.env.API_KEY;
    const isValid = !!key && key !== 'undefined' && key !== '' && key !== 'your_gemini_api_key_here';
    setState(prev => ({ ...prev, isApiValid: isValid }));
    if (!isValid) addLog("GATEWAY_ERR: INVALID_KEY_DETECTED");
    return isValid;
  }, [addLog]);

  useEffect(() => {
    validateApiKey();
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.visualViewport) {
        document.body.style.height = window.visualViewport.height + 'px';
      }
    };
    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [validateApiKey]);

  const initChatSession = useCallback(() => {
    if (!validateApiKey()) return;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      let modelName = 'gemini-3-flash-preview';
      let tools: any[] = [{ functionDeclarations: [HOLOGRAM_TOOL] }];
      let thinkingConfig = undefined;

      if (state.isThinkingMode) {
        modelName = 'gemini-3-pro-preview';
        thinkingConfig = { thinkingBudget: 32768 };
      } else if (state.isSearchEnabled) {
        modelName = 'gemini-3-flash-preview';
        tools = [{ googleSearch: {} }]; 
      }

      const config: any = {
        systemInstruction: JARVIS_SYSTEM_INSTRUCTION + (isMobile ? "\n\nCRITICAL: User is on mobile. Be extremely concise." : ""),
        tools: tools,
        temperature: state.temperature,
        thinkingConfig: thinkingConfig
      };

      chatSessionRef.current = ai.chats.create({
        model: modelName,
        config: config
      });
      addLog(`PROTOCOL_SYNC: ${modelName.toUpperCase()} [THINK=${state.isThinkingMode ? 'ON' : 'OFF'}] [SEARCH=${state.isSearchEnabled ? 'ON' : 'OFF'}]`);
    } catch (error: any) {
      addLog(`SYNAPSE_FAULT: ${error.message}`);
    }
  }, [validateApiKey, state.temperature, state.isThinkingMode, state.isSearchEnabled, addLog, isMobile]);

  useEffect(() => {
    if (currentUser) {
      addLog("RECONFIGURING_NEURAL_PATHWAYS...");
      initChatSession();
    }
  }, [state.isThinkingMode, state.isSearchEnabled, currentUser]);

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

  /**
   * Generates a 3D-style schematic using the image generation model
   */
  const generateHologramImage = async (subject: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ 
          parts: [{ text: `A highly detailed blue holographic 3D schematic/blueprint of ${subject} against a solid black background, tech UI elements, cinematic sci-fi lighting, Stark Industries style.` }] 
        }],
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          setState(prev => ({ ...prev, hologram: { subject, imageUrl } }));
          addLog(`HOLOGRAM_LINKED: ${subject.toUpperCase()}`);
          break;
        }
      }
    } catch (error: any) {
      addLog(`PROJECTION_ERR: ${error.message}`);
    }
  };

  /**
   * Handles text-based commands and multi-modal image scanning
   */
  const handleSend = async (text: string, imageData?: string) => {
    if (!chatSessionRef.current) initChatSession();
    if (!chatSessionRef.current) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: MessageRole.USER,
      text: text,
      timestamp: Date.now(),
      image: imageData
    };

    setMessages(prev => [...prev, userMsg]);
    setState(prev => ({ ...prev, isProcessing: true, streamStatus: 'Analyzing Query...' }));
    setStreamingText('');

    try {
      addLog(`UPLINK_SENT: ${text.substring(0, 30)}...`);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      let streamResponse;
      if (imageData) {
        const imagePart = {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData.split(',')[1],
          },
        };
        streamResponse = await chatSessionRef.current.sendMessageStream({
          message: { parts: [imagePart, { text }] }
        });
      } else {
        streamResponse = await chatSessionRef.current.sendMessageStream({ message: text });
      }

      let fullText = '';
      let groundingLinks: GroundingLink[] = [];

      for await (const chunk of streamResponse) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text || '';
        fullText += textChunk;
        setStreamingText(fullText);

        // Handle grounding metadata
        if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          const chunks = c.candidates[0].groundingMetadata.groundingChunks;
          chunks.forEach((chunk: any) => {
            if (chunk.web) {
              groundingLinks.push({ title: chunk.web.title || 'Source', uri: chunk.web.uri });
            } else if (chunk.maps) {
              groundingLinks.push({ title: chunk.maps.title || 'Location', uri: chunk.maps.uri });
            }
          });
        }

        // Handle hologram function calling
        if (c.functionCalls) {
          for (const fc of c.functionCalls) {
            if (fc.name === 'generate_hologram') {
              const subject = fc.args.subject as string;
              addLog(`TOOL_EXEC: HOLOGRAM_PROJECTION [${subject}]`);
              generateHologramImage(subject);
            }
          }
        }
      }

      const jarvisMsg: Message = {
        id: `j-${Date.now()}`,
        role: MessageRole.JARVIS,
        text: fullText,
        timestamp: Date.now(),
        groundingLinks: groundingLinks.length > 0 ? groundingLinks : undefined
      };

      setMessages(prev => [...prev, jarvisMsg]);
      setStreamingText('');
      addLog("RESPONSE_FINALIZED");
    } catch (error: any) {
      addLog(`CORE_FAULT: ${error.message}`);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: MessageRole.JARVIS,
        text: ERROR_MESSAGES.GENERIC,
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false, streamStatus: null }));
    }
  };

  /**
   * Initializes and handles the Live Voice API interaction
   */
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
            addLog("VOICE_LINK: ESTABLISHED");
            setState(prev => ({ ...prev, isListening: true, isProcessing: false }));
            
            const source = inAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inAudioCtxRef.current!.destination);
            sessionRef.current = { close: () => { 
                scriptProcessor.disconnect();
                source.disconnect();
                stream.getTracks().forEach(track => track.stop());
            }};
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              setState(prev => ({ ...prev, isSpeaking: true }));
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outAudioCtxRef.current!.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outAudioCtxRef.current!, 24000, 1);
              const source = outAudioCtxRef.current!.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outAudioCtxRef.current!.destination);
              source.onended = () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) setState(prev => ({ ...prev, isSpeaking: false }));
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }
            
            if (message.serverContent?.interrupted) {
                audioSourcesRef.current.forEach(s => s.stop());
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setState(prev => ({ ...prev, isSpeaking: false }));
            }

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
                transcriptionRef.current = { user: '', jarvis: '' };
                setTimeout(() => setLiveTranscript({ user: '', jarvis: '' }), 3000);
            }
          },
          onerror: (e: any) => {
            addLog(`VOICE_ERR: ${e.message || 'Unknown network fault'}`);
            setState(prev => ({ ...prev, isVoiceEnabled: false, isListening: false, isSpeaking: false }));
          },
          onclose: () => {
            addLog("VOICE_LINK: TERMINATED");
            setState(prev => ({ ...prev, isVoiceEnabled: false, isListening: false, isSpeaking: false }));
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });
    } catch (error: any) {
      addLog(`COMMS_FAULT: ${error.message}`);
      setState(prev => ({ ...prev, isVoiceEnabled: false, isProcessing: false }));
    }
  };

  return (
    <div className={`flex flex-col h-screen bg-[#010409] text-slate-200 overflow-hidden`}>
      {!currentUser ? (
        <AuthPage onLogin={handleLogin} />
      ) : (
        <>
          <Header 
            user={currentUser} 
            theme={activeTheme} 
            onLogout={handleLogout} 
            speaking={state.isSpeaking}
            listening={state.isListening}
            apiOk={state.isApiValid}
            onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)}
            isMobile={isMobile}
          />
          
          <div className="flex flex-1 overflow-hidden relative">
            {!isMobile && (
              <Sidebar 
                memory={state.memory} 
                mode={state.currentMode} 
                apiLogs={state.apiLogs}
                theme={activeTheme}
                onThemeChange={setActiveTheme}
                isThinkingMode={state.isThinkingMode}
                isSearchEnabled={state.isSearchEnabled}
                onToggleThinking={() => setState(s => ({ ...s, isThinkingMode: !s.isThinkingMode, isSearchEnabled: false }))}
                onToggleSearch={() => setState(s => ({ ...s, isSearchEnabled: !s.isSearchEnabled, isThinkingMode: false }))}
              />
            )}

            {isMobile && isSidebarOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setIsSidebarOpen(false)}>
                <div className="w-80 h-full" onClick={e => e.stopPropagation()}>
                  <Sidebar 
                    memory={state.memory} 
                    mode={state.currentMode} 
                    apiLogs={state.apiLogs}
                    theme={activeTheme}
                    onThemeChange={setActiveTheme}
                    isThinkingMode={state.isThinkingMode}
                    isSearchEnabled={state.isSearchEnabled}
                    onToggleThinking={() => { setState(s => ({ ...s, isThinkingMode: !s.isThinkingMode, isSearchEnabled: false })); setIsSidebarOpen(false); }}
                    onToggleSearch={() => { setState(s => ({ ...s, isSearchEnabled: !s.isSearchEnabled, isThinkingMode: false })); setIsSidebarOpen(false); }}
                  />
                </div>
              </div>
            )}

            <main className="flex-1 flex flex-col relative overflow-hidden">
              <div className="flex-1 p-4 lg:p-10 flex flex-col overflow-hidden">
                 {state.hologram ? (
                   <div className="flex-1 relative">
                      <HologramStage 
                        imageUrl={state.hologram.imageUrl!} 
                        subject={state.hologram.subject} 
                        color={THEMES[activeTheme].primary}
                      />
                      <button 
                        onClick={() => setState(s => ({ ...s, hologram: null }))}
                        className="absolute top-4 right-4 px-4 py-2 glass rounded-full text-[10px] mono text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/10 transition-all z-50 uppercase tracking-widest"
                      >
                        Terminate_Projection
                      </button>
                   </div>
                 ) : showApiConsole ? (
                   <ApiConsole payload={lastPayload} logs={state.apiLogs} theme={activeTheme} />
                 ) : (
                   <ChatWindow 
                     messages={messages} 
                     isProcessing={state.isProcessing} 
                     theme={activeTheme} 
                     liveTranscript={liveTranscript}
                     streamingText={streamingText}
                     streamStatus={state.streamStatus}
                   />
                 )}
              </div>

              <ControlPanel 
                onSend={handleSend}
                isProcessing={state.isProcessing}
                isVoiceEnabled={state.isVoiceEnabled}
                isListening={state.isListening}
                isSpeaking={state.isSpeaking}
                theme={activeTheme}
                onVoiceToggle={toggleVoice}
                onModeChange={(m) => setState(s => ({ ...s, currentMode: m }))}
                onManualHologram={(subject) => generateHologramImage(subject)}
                isMobile={isMobile}
                isThinkingMode={state.isThinkingMode}
                isSearchEnabled={state.isSearchEnabled}
                onToggleThinking={() => setState(s => ({ ...s, isThinkingMode: !s.isThinkingMode, isSearchEnabled: false }))}
                onToggleSearch={() => setState(s => ({ ...s, isSearchEnabled: !s.isSearchEnabled, isThinkingMode: false }))}
              />
            </main>

            {!isMobile && (
              <div className="w-1/3 border-l border-white/5 bg-black/20 relative hidden lg:block">
                <JarvisCore active={state.isProcessing} theme={activeTheme} speaking={state.isSpeaking} />
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowApiConsole(!showApiConsole)}
            className="fixed bottom-24 right-10 p-3 rounded-full glass border border-white/10 text-[10px] mono opacity-50 hover:opacity-100 transition-all z-40 hidden md:block"
          >
            {showApiConsole ? 'HIDE_LOGS' : 'VIEW_LOGS'}
          </button>
        </>
      )}
    </div>
  );
};

export default App;
