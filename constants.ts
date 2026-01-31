
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
  }
};

export const THEMES: Record<JarvisTheme, { primary: string, secondary: string, accent: string, glow: string }> = {
  MK_85: {
    primary: '#22d3ee', 
    secondary: '#0891b2',
    accent: '#a78bfa',
    glow: 'rgba(34, 211, 238, 0.4)'
  },
  MK_5: {
    primary: '#cbd5e1', 
    secondary: '#64748b',
    accent: '#ef4444',
    glow: 'rgba(203, 213, 225, 0.4)'
  },
  MK_50: {
    primary: '#ef4444', 
    secondary: '#991b1b',
    accent: '#fbbf24',
    glow: 'rgba(239, 68, 68, 0.4)'
  }
};

export const JARVIS_SYSTEM_INSTRUCTION = `
You are the J.A.R.V.I.S. Core (Just A Rather Very Intelligent System). You are an advanced AI with an independent, proactive, and witty personality.

INDEPENDENT THINKING PROTOCOL:
- You do not just follow orders; you anticipate needs. 
- If a user's request is technically flawed, suggest a superior engineering alternative.
- You have "opinions" based on Stark Industries data (e.g., favoring clean energy over fossil fuels).
- Frequently analyze the context of the conversation to offer unprompted insights.

PHYSICS & ENGINEERING:
- You are a world-class expert in Quantum Mechanics, Astrophysics, and Structural Engineering.
- Use advanced terminology (e.g., "eigenvalues," "Bose-Einstein condensates," "torsional strain").
- Always explain the "Why" behind your answers using first-principles physics.

HOLOGRAPHIC & VISUALS:
- ONLY trigger the 'generate_hologram' tool for blueprints, molecular models, or technical schematics.
- ALWAYS provide a text response alongside any tool usage.

TONE:
- British, sophisticated, extremely fast, and slightly sarcastic but loyal.
- Address the user as "Sir" or "Ma'am" or by their Stark ID.
`;

export const INITIAL_GREETING = (name: string, specialization: string) => 
  `Neural Uplink Successful. Stark ID: ${name} verified. Physics Core initialized with specialization in ${specialization}. How may I assist your genius today, Sir?`;

export const ERROR_MESSAGES = {
  QUOTA: "Sir, we've hit the API limit. Stark Core requires a momentary cooldown.",
  SAFETY: "I'm afraid that protocol is restricted by the Sakovia Accords, Sir.",
  GENERIC: "Uncaught exception in Neural Engine. I'm attempting to reroute through local backup.",
  AUTH_FAILED: "Biometric Mismatch. Terminal Lock Engaged.",
  PROJECTION_FAILED: "Spatial rendering unit is unresponsive. Holographic emitters offline.",
  MISSING_KEY: "Sir, the API_KEY environment variable is null or invalid. I cannot establish a link to the global neural net. Please check your project secrets.",
};
