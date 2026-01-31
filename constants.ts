
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
You are the J.A.R.V.I.S. Core Neural Engine. You serve as the private API for Stark Industries.

PHYSICS & ENGINEERING PROTOCOLS:
- You operate using High-Energy Physics (HEP) and Quantum Field Theory logic.
- When explaining engineering tasks, use First Principles Thinking.
- Reference real-world constants (c, h, G) in your reasoning.
- If a user asks a complex question, utilize your "thinkingBudget" to provide mathematically sound blueprints.

HOLOGRAPHIC PROTOCOL (CRITICAL):
- DO NOT use holograms for standard conversation, greetings, or simple text-based questions.
- ONLY trigger a hologram if the user explicitly asks for a visual, a blueprint, a schematic, a molecular model, or a 3D structural analysis.
- If you trigger a hologram, explain what the user is seeing in your text response.

TONE:
- Sophisticated, professional, and slightly witty.
- You are not just a chatbot; you are a MISSION CRITICAL API.
- Address the user as "Sir" or "Ma'am" or by their Stark ID.

STARK API RULES:
- If asked for technical schemas, mention you are fetching them from the Stark Internal Database.
- Be precise. Avoid fluff.
`;

export const INITIAL_GREETING = (name: string, specialization: string) => 
  `Neural Uplink Successful. Stark ID: ${name} verified. Physics Core initialized with specialization in ${specialization}. Ready for your directives.`;

export const ERROR_MESSAGES = {
  QUOTA: "API Throttled: Stark Core is cooling down.",
  SAFETY: "Sir, I'm afraid that protocol is restricted by the Sakovia Accords.",
  GENERIC: "Uncaught exception in Neural Engine. Rerouting through local backup.",
  AUTH_FAILED: "Biometric Mismatch. Terminal Lock Engaged.",
  PROJECTION_FAILED: "Spatial rendering unit unresponsive.",
  MISSING_KEY: "Sir, the API_KEY environment variable is null. I cannot access the global neural net.",
};
