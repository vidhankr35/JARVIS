
export enum MessageRole {
  USER = 'user',
  JARVIS = 'jarvis'
}

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  thinking?: string;
  image?: string; // Base64 image data
  groundingLinks?: GroundingLink[];
}

export interface JarvisState {
  isProcessing: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isVoiceEnabled: boolean;
  currentMode: 'standard' | 'scientific' | 'engineering';
  memory: string[];
}
