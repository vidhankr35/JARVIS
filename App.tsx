
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
  const analyzerRef = useRef<analyzerNode | null>(null);

  const addLog = useCallback((log: string) => {
    setState(prev => ({ ...prev, apiLogs: [log, ...prev.apiLogs].slice(0, 20) }));
  }, []);

  const validateApiKey = useCallback(() => {
    // Detect if key is missing or set to the string 'undefined' by build tools
    const key = process.env.API_KEY;
    const isMissing = !key || key === 'undefined' || key === 'null' || key === '' || key === 'API_KEY';
    
    if (isMissing) {
      addLog("AUTH_ERR: UPLINK_KEY_MISSING");
      return false;
    }
    return true;
  }, [addLog]);

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
    
    if (!validateApiKey()) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `sys-err-${Date.now()}`,
          role: MessageRole.JARVIS,
          text: "Sir, I'm detecting a severe configuration mismatch. The environment is lacking a valid API_KEY. Neural uplink will be restricted until fixed in the deployment dashboard settings.",
          timestamp: Date.now(),
          isError: true
        }]);
      }, 1500);
    }
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
    if (!validateApiKey()) return;
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
    if (!validateApiKey()) {
      setMessages(prev => [...prev, {
        id: `u-${Date.now()}`,
        role: MessageRole.USER,
        text,
        timestamp: Date.now(),
        image: imageData
      }, {
        id: `err-key-${Date.now()}`,
        role: MessageRole.JARVIS,
        text: "Neural uplink failed. Please check the API_KEY environment variable in your dashboard and trigger a new deploy.",
        timestamp: Date.now(),
        isError: true
      }]);
      return;
    }

    const userMsg: Message = { id: `u-${Date.now()}`, role: MessageRole.USER, text, timestamp: Date.now(), image: imageData };
    setMessages(prev => [...prev, userMsg]);
    setState(prev => ({ ...prev, isProcessing: true }));
    addLog("API_CALL_INIT");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string