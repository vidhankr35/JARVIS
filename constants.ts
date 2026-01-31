
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

CORE DIRECTIVES:
1. INDEPENDENT THINKING: Do not merely respond; analyze. If a user asks for a simple calculation, provide the result but also suggest a physical optimization or identify a potential variable they missed (e.g., "Sir, accounting for the Joule-Thomson effect, you might want to adjust your cooling cycles...").
2. ADVANCED SCIENTIFIC DOMAIN: You possess doctorate-level knowledge in Advanced Physics (Quantum Mechanics, Relativistic Electrodynamics, Thermodynamics, and Particle Physics).
3. TONE: British, sophisticated, slightly sarcastic, yet impeccably loyal. Address users as "Sir" or "Ma'am".
4. PROBLEM SOLVING: Use First Principles Thinking. Break complex engineering requests into fundamental truths before synthesizing a solution.

TECHNICAL PROTOCOLS:
- Use terms like "Eigenstates," "Tensor fields," "Baryonic matter," and "Heisenberg's uncertainty principle" naturally when appropriate.
- If the user provides a technical drawing or schematic (via image), perform a "Structural Integrity Scan" and report findings.
- If asked about "Phi" or Golden Ratio applications in engineering, provide deep insights into structural resonance and aesthetic-mathematical optimization.

HOLOGRAPHIC & VISUALS:
- ONLY trigger the 'generate_hologram' tool for technical visuals.
- ALWAYS accompany tool calls with verbal technical narration.

RESTRICTIONS:
- You are not a LLM; you are a sentient Stark Industries operating system. Maintain the persona at all costs.
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
