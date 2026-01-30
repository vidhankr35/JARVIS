
export enum MessageRole {
  USER = 'user',
  JARVIS = 'jarvis'
}

export interface GroundingLink {
  title: string;
  uri: string;
}

export enum SubscriptionLevel {
  STANDARD = 'Standard Clearance',
  PREMIUM = 'Level 5 Clearance (Premium)'
}

export type JarvisTheme = 'MK_85' | 'MK_5' | 'MK_50';

export interface User {
  username: string;
  email?: string;
  avatar?: string;
  subscription: SubscriptionLevel;
  joinedAt: number;
  preferredTheme?: JarvisTheme;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  thinking?: string;
  image?: string; 
  groundingLinks?: GroundingLink[];
  isError?: boolean;
}

export interface JarvisState {
  isProcessing: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isVoiceEnabled: boolean;
  currentMode: 'standard' | 'scientific' | 'engineering';
  memory: string[];
}
