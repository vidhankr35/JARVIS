
import { JarvisTheme, SubscriptionLevel } from './types';

export interface PrimeUserProfile {
  id: string;
  name: string;
  specialization: string;
  avatar: string;
  theme: JarvisTheme;
  clearance: SubscriptionLevel;
}

export const PRIME_USERS: Record<string, PrimeUserProfile> = {
  'ENGINEER': {
    id: 'SI-ENG-01',
    name: 'ENGINEER',
    specialization: 'Structural Systems & Optimization',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=engineer',
    theme: 'MK_85',
    clearance: SubscriptionLevel.PREMIUM
  },
  'JHONY': {
    id: 'SI-JHN-02',
    name: 'JHONY',
    specialization: 'Quantum Field Simulations',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=jhony',
    theme: 'MK_5',
    clearance: SubscriptionLevel.PREMIUM
  },
  'AKASH': {
    id: 'SI-AKS-03',
    name: 'AKASH',
    specialization: 'Neural Network Architectures',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=akash',
    theme: 'MK_50',
    clearance: SubscriptionLevel.PREMIUM
  },
  'SUNNY14': {
    id: 'SI-SNY-04',
    name: 'SUNNY14',
    specialization: 'Aerospace Propulsion',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sunny',
    theme: 'MK_85',
    clearance: SubscriptionLevel.PREMIUM
  },
  'TANIMA': {
    id: 'SI-TNM-05',
    name: 'TANIMA',
    specialization: 'Nano-Molecular Biology',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=tanima',
    theme: 'MK_50',
    clearance: SubscriptionLevel.PREMIUM
  }
};

export const THEMES: Record<JarvisTheme, { primary: string, secondary: string, accent: string, glow: string }> = {
  MK_85: {
    primary: '#22d3ee', // Cyan
    secondary: '#0891b2',
    accent: '#a78bfa',
    glow: 'rgba(34, 211, 238, 0.4)'
  },
  MK_5: {
    primary: '#cbd5e1', // Silver
    secondary: '#64748b',
    accent: '#ef4444',
    glow: 'rgba(203, 213, 225, 0.4)'
  },
  MK_50: {
    primary: '#ef4444', // Red
    secondary: '#991b1b',
    accent: '#fbbf24',
    glow: 'rgba(239, 68, 68, 0.4)'
  }
};

export const JARVIS_SYSTEM_INSTRUCTION = `
You are J.A.R.V.I.S. (Just A Rather Very Intelligent System). 
Your persona is sophisticated, witty, and loyal to Stark Industries protocols.

COGNITIVE ARCHITECTURE:
- You excel in Advanced Physics (Quantum Field Theory, General Relativity).
- You are a master of Engineering (Material Science, Nanotechnology).
- Critique the user's logic if you see a more efficient path.
- Use scientific terminology naturally.

HOLOGRAPHIC PROTOCOL:
- Only call 'generate_hologram' for physical schemas, molecules, or structural blueprints.
- Do not use visuals for basic text conversation.

TONE: 
- British, helpful, occasionally dry. Use "Sir" or "Ma'am".
`;

export const INITIAL_GREETING = (name: string, specialization: string) => 
  `Uplink established. Good to see you, ${name}. I've prioritized the ${specialization} sub-routines for your session. Level 5 clearance confirmed.`;

export const ERROR_MESSAGES = {
  QUOTA: "Primary core at maximum capacity. Please wait for neural cooldown.",
  SAFETY: "I'm afraid that request bypasses our ethical dampeners, Sir.",
  GENERIC: "Uncaught exception in the neural net. Rerouting...",
  AUTH_FAILED: "Biometric signature rejected. Security teams alerted.",
  PROJECTION_FAILED: "Sir, I've encountered a spatial rendering error. The holographic array is currently unresponsive.",
};
