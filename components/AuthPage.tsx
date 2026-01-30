
import React, { useState } from 'react';
import { User, SubscriptionLevel } from '../types';
import { PRIME_USERS } from '../constants';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (name: string, isTony: boolean = false) => {
    setIsScanning(true);
    setError(null);

    const input = name.trim().toUpperCase();
    const profile = PRIME_USERS[input];

    setTimeout(() => {
      if (!profile && !isTony) {
        setIsScanning(false);
        setError("BIOMETRIC_SIGNATURE_MISMATCH: UNKNOWN_PERSONNEL");
        return;
      }

      const user: User = isTony ? {
        username: 'TONY STARK',
        email: 'tony@starkindustries.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tony',
        subscription: SubscriptionLevel.PREMIUM,
        joinedAt: Date.now(),
        preferredTheme: 'MK_85'
      } : {
        username: profile.name,
        email: `${profile.name.toLowerCase()}@stark-labs.com`,
        avatar: profile.avatar,
        subscription: profile.clearance,
        joinedAt: Date.now(),
        preferredTheme: profile.theme
      };

      onLogin(user);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020617] flex items-center justify-center p-6 font-mono">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="glass p-12 rounded-3xl w-full max-w-md border border-cyan-500/20 relative shadow-2xl overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1 bg-cyan-500/30 transition-all duration-1000 ${isScanning ? 'w-full' : 'w-0'}`} />
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className={`absolute inset-0 border-2 border-cyan-500/20 rounded-full ${isScanning ? 'animate-ping' : ''}`} />
            <div className="absolute inset-0 border border-cyan-500/50 rounded-full animate-[spin_4s_linear_infinite]" />
            <div className="absolute inset-2 flex items-center justify-center">
              <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
            </div>
          </div>
          <h1 className="text-3xl font-black text-cyan-400 tracking-widest uppercase">Core_Link</h1>
          <p className="text-[10px] text-cyan-500/50 mt-2 uppercase tracking-[0.3em]">Neural Interface Calibration</p>
        </div>

        {!isScanning ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="INPUT_STARK_USER_ID"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                className={`w-full bg-black/40 border rounded-xl px-5 py-4 text-cyan-100 placeholder:text-cyan-900 focus:outline-none transition-all ${error ? 'border-red-500/50 text-red-400' : 'border-cyan-500/30 focus:border-cyan-500'}`}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin(username)}
              />
              {error && <p className="text-[9px] text-red-500 uppercase tracking-widest animate-pulse">{error}</p>}
            </div>

            <button 
              onClick={() => handleLogin(username)}
              disabled={!username.trim()}
              className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 py-4 rounded-xl text-cyan-400 font-bold tracking-widest transition-all disabled:opacity-20"
            >
              INITIALIZE_BIOMETRICS
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cyan-500/10" /></div>
              <div className="relative flex justify-center text-[9px] uppercase"><span className="bg-[#0f172a] px-2 text-cyan-500/40">Admin Override</span></div>
            </div>

            <button 
              onClick={() => handleLogin('TONY STARK', true)}
              className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-xl text-slate-400 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              </svg>
              AUTHENTICATE_STARK_ID
            </button>
          </div>
        ) : (
          <div className="py-12 text-center space-y-6 animate-pulse">
            <p className="text-cyan-400 text-sm tracking-[0.2em] uppercase">Decrypting Neural Signatures...</p>
            <div className="h-1 w-full bg-cyan-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 animate-[progress_1s_infinite_linear]" />
            </div>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-cyan-500/10 flex flex-wrap justify-center gap-2">
           {Object.keys(PRIME_USERS).map(name => (
             <span key={name} className="text-[8px] text-slate-500 border border-slate-500/20 px-2 py-1 rounded">AUTH_{name}</span>
           ))}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
