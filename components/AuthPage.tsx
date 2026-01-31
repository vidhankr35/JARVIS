import React, { useState, useEffect } from 'react';
import { User, SubscriptionLevel } from '../types';
import { PRIME_USERS, THEMES } from '../constants';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

type AuthMethod = 'biometric' | 'google' | 'phone';

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('biometric');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isScanning) {
      setScanProgress(0);
      interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const handleLogin = (name: string, pass: string, isTony: boolean = false) => {
    setIsScanning(true);
    setError(null);

    const input = name.trim().toUpperCase();
    const profile = PRIME_USERS[input];

    setTimeout(() => {
      if (!isTony) {
        if (!profile) {
          setIsScanning(false);
          setError("BIOMETRIC_SIGNATURE_MISMATCH: UNKNOWN_PERSONNEL");
          return;
        }
        if (profile.accessCode !== pass) {
          setIsScanning(false);
          setError("SECURITY_FAULT: INVALID_ACCESS_CODE");
          return;
        }
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
    }, 2500);
  };

  const simulateSocialLogin = (type: 'Google' | 'Phone') => {
    setIsScanning(true);
    setError(null);
    setTimeout(() => {
      const user: User = {
        username: `GUEST_${Math.floor(Math.random() * 9000) + 1000}`,
        email: `external_${type.toLowerCase()}@uplink.net`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${Math.random()}`,
        subscription: SubscriptionLevel.STANDARD,
        joinedAt: Date.now(),
        preferredTheme: 'MK_5'
      };
      onLogin(user);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#010409] flex items-center justify-center p-4 lg:p-6 font-mono overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(34,211,238,0.1)_0%,_transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/20 animate-[scanline_4s_linear_infinite]" />
      </div>
      
      <div className="glass p-8 lg:p-12 rounded-[2rem] w-full max-w-lg border border-cyan-500/20 relative shadow-[0_0_100px_rgba(34,211,238,0.05)] overflow-hidden">
        <div className="absolute top-0 left-0 h-1 bg-cyan-500 transition-all duration-300" style={{ width: `${scanProgress}%` }} />
        
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 relative group">
            <div className={`absolute inset-0 border-2 border-cyan-500/20 rounded-full ${isScanning ? 'animate-ping' : ''}`} />
            <div className="absolute inset-0 border border-cyan-500/50 rounded-full animate-[spin_8s_linear_infinite]" />
            <div className="absolute inset-4 border border-cyan-400/30 rounded-full animate-[spin_5s_linear_infinite_reverse]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className={`w-10 h-10 transition-all ${isScanning ? 'text-cyan-400 scale-110' : 'text-cyan-500/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-[0.2em] uppercase mb-2">Gate_Keeper</h1>
          <p className="text-[10px] text-cyan-400/60 uppercase tracking-[0.4em]">Stark Industries Authentication Node</p>
        </div>

        {!isScanning ? (
          <div className="space-y-6">
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
              {(['biometric', 'google', 'phone'] as AuthMethod[]).map(m => (
                <button 
                  key={m}
                  onClick={() => { setAuthMethod(m); setError(null); }}
                  className={`flex-1 py-2 text-[9px] uppercase tracking-widest rounded-lg transition-all ${authMethod === m ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            {authMethod === 'biometric' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="IDENTIFIER (e.g. ENGINEER)"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(null); }}
                    className={`w-full bg-black/60 border rounded-xl px-5 py-4 text-cyan-100 placeholder:text-cyan-900 focus:outline-none transition-all uppercase text-sm tracking-widest ${error ? 'border-red-500/50' : 'border-white/10 focus:border-cyan-500/50'}`}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin(username, password)}
                  />
                  <input
                    type="password"
                    placeholder="ACCESS_CODE"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    className={`w-full bg-black/60 border rounded-xl px-5 py-4 text-cyan-100 placeholder:text-cyan-900 focus:outline-none transition-all text-sm tracking-widest ${error ? 'border-red-500/50' : 'border-white/10 focus:border-cyan-500/50'}`}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin(username, password)}
                  />
                  {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[9px] text-red-400 uppercase tracking-widest animate-pulse">{error}</div>}
                </div>

                <button 
                  onClick={() => handleLogin(username, password)}
                  disabled={!username.trim() || !password.trim()}
                  className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 py-4 rounded-xl text-cyan-400 font-black tracking-[0.3em] transition-all disabled:opacity-20 uppercase"
                >
                  Initiate_Uplink
                </button>
              </div>
            )}

            {authMethod === 'google' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <p className="text-[10px] text-slate-500 text-center uppercase">Secure External Neural Link</p>
                <button 
                  onClick={() => simulateSocialLogin('Google')}
                  className="w-full flex items-center justify-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 py-5 rounded-2xl text-slate-200 transition-all font-bold tracking-widest uppercase text-xs"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Connect_Gmail_ID
                </button>
              </div>
            )}

            {authMethod === 'phone' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <p className="text-[10px] text-slate-500 text-center uppercase">Emergency Comms Uplink</p>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50">+1</span>
                   <input
                    type="tel"
                    placeholder="MOBILE_TEL_NODE"
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-cyan-100 placeholder:text-cyan-900 focus:outline-none focus:border-cyan-500/50 transition-all text-sm tracking-[0.5em]"
                  />
                </div>
                <button 
                  onClick={() => simulateSocialLogin('Phone')}
                  className="w-full bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/40 py-5 rounded-2xl text-violet-400 font-black tracking-[0.3em] transition-all uppercase text-xs"
                >
                  Verify_Comms_Link
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-white/5">
               <button 
                onClick={() => handleLogin('TONY STARK', '', true)}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl hover:bg-white/5 text-slate-500 transition-all group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 group-hover:animate-ping" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Admin_Override_Tony_Stark</span>
               </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {Object.values(PRIME_USERS).map(p => (
                <div key={p.id} className="p-2 border border-white/5 bg-black/20 rounded-lg text-center cursor-help group relative" title={`Access Code: ${p.accessCode}`}>
                  <p className="text-[7px] text-slate-500 uppercase truncate">{p.name}</p>
                  <p className="text-[6px] text-cyan-500/30 font-bold group-hover:text-cyan-400 transition-colors uppercase">Profile_Ready</p>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black border border-cyan-500/20 rounded hidden group-hover:block z-50 min-w-[120px]">
                    <p className="text-[8px] text-white font-bold">{p.specialization}</p>
                    <p className="text-[7px] text-cyan-400 mt-1">Code: {p.accessCode}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center space-y-8 animate-in zoom-in-95 duration-700">
            <div className="relative w-32 h-32 mx-auto">
               <div className="absolute inset-0 border-4 border-cyan-500/10 rounded-full" />
               <div className="absolute inset-0 border-t-4 border-cyan-400 rounded-full animate-spin" />
               <div className="absolute inset-4 flex items-center justify-center text-cyan-400 font-black text-xl">
                 {Math.floor(scanProgress)}%
               </div>
            </div>
            <div className="space-y-2">
              <p className="text-cyan-400 text-sm tracking-[0.3em] font-black uppercase">Decrypting Neural Synatures</p>
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>
            <div className="bg-black/40 p-4 rounded-xl border border-cyan-500/10 max-w-xs mx-auto">
               <p className="text-[8px] text-cyan-400/40 text-left mono leading-relaxed">
                 {">"} STARK_CLOUD_SYNC: IN_PROGRESS<br/>
                 {">"} BIOMETRICS: ANALYZING_REINA<br/>
                 {">"} COGNITIVE_SCAN: STABLE<br/>
                 {">"} TERMINAL: {Math.random().toString(16).substring(2, 10).toUpperCase()}
               </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;