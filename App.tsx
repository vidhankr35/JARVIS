import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message, MessageRole, JarvisState, User, JarvisTheme } from './types';
import { JARVIS_SYSTEM_INSTRUCTION, INITIAL_GREETING, PRIME_USERS } from './constants';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import JarvisCore from './components/JarvisCore';
import Sidebar from './components/Sidebar';
import ControlPanel from './components/ControlPanel';
import AuthPage from './components/AuthPage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTheme, setActiveTheme] = useState<JarvisTheme>('MK_85');
  const [streamingText, setStreamingText] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [state, setState] = useState<JarvisState & { 
    apiLogs: string[], 
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
    currentMode: 'standard',
    memory: ["Neural link calibrated.", "Stark Gateway Online."],
    apiLogs: ["CORE_READY"],
    temperature: 0.7,
    isApiValid: null,
    streamStatus: null
  });

  const chatSessionRef = useRef<any>(null);

  const addLog = useCallback((log: string) => {
    setState(prev => ({ ...prev, apiLogs: [log, ...prev.apiLogs].slice(0, 10) }));
  }, []);

  const validateApiKey = useCallback(() => {
    const key = process.env.API_KEY;
    const isValid = !!key && key !== 'undefined' && key !== '';
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const modelName = 'gemini-3-flash-preview';
      
      const config: any = {
        systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
        temperature: state.temperature
      };

      chatSessionRef.current = ai.chats.create({ model: modelName, config });
      addLog(`PROTOCOL_SYNC: ${modelName.toUpperCase()} ACTIVE`);
    } catch (error: any) {
      addLog(`SYNAPSE_FAULT: ${error.message}`);
    }
  }, [validateApiKey, state.temperature, addLog]);

  useEffect(() => {
    if (currentUser) initChatSession();
  }, [currentUser, initChatSession]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.preferredTheme) setActiveTheme(user.preferredTheme);
    const profile = Object.values(PRIME_USERS).find(p => p.name.toUpperCase() === user.username.toUpperCase());
    const greeting = profile ? INITIAL_GREETING(profile.name, profile.specialization) : INITIAL_GREETING(user.username, "General Systems");
    setMessages([{ id: `init-${Date.now()}`, role: MessageRole.JARVIS, text: greeting, timestamp: Date.now() }]);
    addLog(`IDENTITY_VERIFIED: ${user.username}`);
  };

  const handleLogout = () => {
    chatSessionRef.current = null;
    setCurrentUser(null);
    setMessages([]);
    setState(prev => ({ ...prev, isProcessing: false }));
    addLog("UPLINK_TERMINATED");
  };

  const handleSend = async (text: string, imageData?: string) => {
    if (!chatSessionRef.current) initChatSession();
    if (!chatSessionRef.current) return;

    const userMsgId = `u-${Date.now()}`;
    setMessages(prev => [...prev, { id: userMsgId, role: MessageRole.USER, text, timestamp: Date.now(), image: imageData }]);
    setState(prev => ({ ...prev, isProcessing: true, streamStatus: 'Analyzing...' }));
    setStreamingText('');

    try {
      const parts: any[] = imageData ? [{ inlineData: { mimeType: 'image/jpeg', data: imageData.split(',')[1] } }, { text }] : [{ text }];
      const streamResponse = await chatSessionRef.current.sendMessageStream({ message: parts });

      let fullText = '';
      for await (const chunk of streamResponse) {
        // Robust null check for chunk and candidates to satisfy TypeScript
        if (chunk && chunk.candidates && chunk.candidates.length > 0) {
          const textChunk = chunk.text || '';
          fullText += textChunk;
          setStreamingText(fullText);
        }
      }

      setMessages(prev => [...prev, { id: `j-${Date.now()}`, role: MessageRole.JARVIS, text: fullText, timestamp: Date.now() }]);
      setStreamingText('');
      addLog("UPLINK_SUCCESS");
    } catch (error: any) {
      addLog(`CORE_FAULT: ${error.message}`);
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: MessageRole.JARVIS, text: "I'm sorry Sir, I've encountered a neural fault. Please try again.", timestamp: Date.now(), isError: true }]);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false, streamStatus: null }));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#010409] text-slate-200 overflow-hidden">
      {!currentUser ? <AuthPage onLogin={handleLogin} /> : (
        <>
          <Header user={currentUser} theme={activeTheme} onLogout={handleLogout} speaking={state.isProcessing} apiOk={state.isApiValid} onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)} isMobile={isMobile} />
          <div className="flex flex-1 overflow-hidden relative">
            {!isMobile && (
              <Sidebar 
                memory={state.memory} 
                mode={state.currentMode} 
                theme={activeTheme} 
                onThemeChange={setActiveTheme} 
                isThinkingMode={false} 
                onToggleThinking={() => {}}
              />
            )}
            <main className="flex-1 flex flex-col relative overflow-hidden">
              <div className="flex-1 p-4 lg:p-10 flex flex-col overflow-hidden">
                <ChatWindow 
                  messages={messages} 
                  isProcessing={state.isProcessing} 
                  theme={activeTheme} 
                  streamingText={streamingText} 
                  streamStatus={state.streamStatus} 
                />
              </div>
              <ControlPanel 
                onSend={handleSend} 
                isProcessing={state.isProcessing} 
                theme={activeTheme} 
                onModeChange={m => setState(s => ({ ...s, currentMode: m }))} 
                isMobile={isMobile} 
                isThinkingMode={false} 
                onToggleThinking={() => {}}
                isVoiceEnabled={false}
                isListening={false}
                isSpeaking={false}
                onVoiceToggle={() => {}}
              />
            </main>
            {!isMobile && (
              <div className="w-1/3 border-l border-white/5 bg-black/20 relative hidden lg:block">
                <JarvisCore active={state.isProcessing} theme={activeTheme} speaking={state.isProcessing} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default App;