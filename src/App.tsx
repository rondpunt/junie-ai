import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/Auth';
import ChatLayout from './pages/ChatLayout';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

export const DemoContext = {
  isDemo: false,
  setDemo: (_val: boolean) => {}
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(() => {
    return localStorage.getItem('nexus_admin_session') === 'true';
  });

  DemoContext.isDemo = demoMode;
  DemoContext.setDemo = setDemoMode;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(() => {
      // Catch error if supabase url is invalid
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Laden...</div>;

  const isAuthenticated = session || demoMode;

  const base = import.meta.env.BASE_URL;
  const basename = base === './' ? '/' : base;

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/auth" element={!isAuthenticated ? <AuthPage onDemoLogin={() => setDemoMode(true)} /> : <Navigate to="/" />} />
        <Route path="/*" element={isAuthenticated ? <ChatLayout /> : <Navigate to="/auth" />} />
      </Routes>
    </Router>
  );
}

export default App;
