import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRight, UserCircle } from 'lucide-react';

export default function AuthPage({ onDemoLogin }: { onDemoLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const logoUrl = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/logo.svg`;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // Master beheer login voor Niels
    if ((cleanEmail === 'ai' || cleanEmail === 'ai@junie.local' || cleanEmail === 'admin' || cleanEmail === 'niels') && 
        (cleanPass === 'vakantie' || cleanPass === 'Vakantie1!' || cleanPass === 'vakantie123')) {
      localStorage.setItem('nexus_admin_session', 'true');
      localStorage.setItem('junie_user_tier', 'admin');
      localStorage.setItem('junie_user_email', 'ai');
      onDemoLogin();
      setLoading(false);
      return;
    }
    
    try {
      const { error } = isLogin 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
        
      if (error) {
        alert(error.message);
      } else {
        localStorage.setItem('junie_user_email', email);
      }
    } catch {
      alert("Fout bij verbinden met authenticatieserver.");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch {
      // Graceful fallback for local development or when OAuth redirect URL is not bound
      localStorage.setItem('nexus_admin_session', 'true');
      localStorage.setItem('junie_user_email', 'google.user@gmail.com');
      onDemoLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ffffff] text-[#1f1f1f] p-4 font-sans">
      <div className="max-w-md w-full bg-[#f8fafd] border border-[#e1e3e1] rounded-3xl p-8 sm:p-10 shadow-lg animate-pop-in">
        
        {/* Junie Brand Header */}
        <div className="text-center mb-8">
          <img 
            src={logoUrl} 
            alt="Junie Logo" 
            className="w-14 h-14 mx-auto mb-3.5 drop-shadow-sm rounded-2xl" 
          />
          <h2 className="text-2xl font-bold tracking-tight text-[#1f1f1f]">Junie</h2>
          <p className="text-xs text-[#444746] mt-1">
            {isLogin ? 'Log in om toegang te krijgen tot je AI-werkomgeving' : 'Maak een nieuw Junie account aan'}
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full bg-white hover:bg-[#f0f4f9] text-[#1f1f1f] border border-[#e1e3e1] font-medium py-2.5 px-4 rounded-full transition-all flex items-center justify-center gap-3 text-xs shadow-xs mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Doorgaan met Google</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[#e1e3e1]"></div>
          <span className="text-[11px] text-[#727775] uppercase font-semibold">of met e-mail</span>
          <div className="flex-1 h-px bg-[#e1e3e1]"></div>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#444746] uppercase tracking-wider mb-1.5">Gebruikersnaam of E-mail</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[#e1e3e1] rounded-xl px-4 py-2.5 text-xs text-[#1f1f1f] outline-none focus:border-[#0b57d0] transition-colors"
              placeholder="ai"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#444746] uppercase tracking-wider mb-1.5">Wachtwoord</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-[#e1e3e1] rounded-xl px-4 py-2.5 text-xs text-[#1f1f1f] outline-none focus:border-[#0b57d0] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div className="pt-2 space-y-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-medium py-2.5 px-4 rounded-full transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs shadow-xs"
            >
              {loading ? 'Bezig...' : (isLogin ? 'Inloggen' : 'Registreren')}
              {!loading && <ArrowRight size={15} />}
            </button>
            <button 
              type="button" 
              onClick={() => {
                localStorage.setItem('nexus_admin_session', 'true');
                localStorage.setItem('junie_user_email', 'gast@junie.local');
                onDemoLogin();
              }}
              className="w-full bg-white border border-[#e1e3e1] hover:bg-[#f0f4f9] text-[#444746] font-medium py-2.5 px-4 rounded-full transition-all flex items-center justify-center gap-2 text-xs"
            >
              <UserCircle size={15} /> Direct Verkennen als Gast
            </button>
          </div>
        </form>
        
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="mt-6 text-xs text-[#727775] hover:text-[#1f1f1f] transition-colors w-full text-center"
        >
          {isLogin ? 'Nog geen account? Registreer hier.' : 'Al een account? Log in.'}
        </button>
      </div>
    </div>
  );
}
