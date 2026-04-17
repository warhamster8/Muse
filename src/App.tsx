import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { AISidekick } from './components/AISidekick';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';
import { NarrativeView } from './views/NarrativeView';
import { CharactersView } from './views/CharactersView';
import { NotesView } from './views/NotesView';
import { WorldView } from './views/WorldView';
import { AuthView } from './views/AuthView';
import { ProjectSelector } from './views/ProjectSelector';
import { AnalysisView } from './views/AnalysisView';
import { ConfigView } from './views/ConfigView';
import { AlertCircle, Cloud } from 'lucide-react';
import { ToastContainer } from './components/Toast';

function App() {
  const { user, currentProject, activeTab, setUser, setAIConfig } = useStore();
  const [showAuth, setShowAuth] = useState(false);
  const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL;

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Controllo sicurezza email
        if (ALLOWED_EMAIL && session.user.email?.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
          supabase.auth.signOut();
          setUser(null);
          return;
        }
        setUser({ id: session.user.id, email: session.user.email });
        setShowAuth(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (ALLOWED_EMAIL && session.user.email?.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
          supabase.auth.signOut();
          setUser(null);
          return;
        }
        setUser({ id: session.user.id, email: session.user.email });
        setShowAuth(false);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, ALLOWED_EMAIL]);

  // Caricamento profilo (chiave Gemini e Impostazioni AI)
  React.useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('deepseek_api_key, ai_settings')
          .eq('user_id', user.id)
          .single();
        
        if (data && !error) {
          setAIConfig({ 
            ...(data.ai_settings || {}),
            deepseekKey: data.deepseek_api_key
          });
        }
      };
      fetchProfile();
    }
  }, [user, setAIConfig]);

  const renderView = () => {
    switch (activeTab) {
      case 'narrative':
        return <NarrativeView />;
      case 'characters':
        return <CharactersView />;
      case 'world':
        return <WorldView />;
      case 'notes':
        return <NotesView />;
      case 'config':
        return <ConfigView />;
      case 'analysis':
        return <AnalysisView />;
      default:
        return <NarrativeView />;
    }
  };

  // 1. Landing Screen (Not logged in, Not in Auth view)
  if (!user && !showAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0b0e11] p-4 selection:bg-[#5be9b1]/30">
        <div className="bg-[#1a1e23]/90 backdrop-blur-3xl p-12 rounded-[40px] border border-white/10 max-w-xl w-full text-center space-y-10 relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#5be9b1]/10 blur-[140px] rounded-full" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#5be9b1]/10 blur-[140px] rounded-full" />
          
          <div className="w-80 h-80 mx-auto rounded-[40px] bg-[#13161a] flex items-center justify-center p-8 mb-10 logo-glow border border-white/5 shadow-inner">
            <img src="/logo.png" alt="Project Muse Logo" className="w-full h-full object-contain logo-blend" />
          </div>
          <div>
            <h1 className="text-6xl font-black font-display text-slate-50 tracking-tighter leading-tight uppercase">Project Muse</h1>
            <p className="text-slate-500 mt-4 text-sm font-black uppercase tracking-[0.4em] mb-4">L'architetto della tua visione narrativa</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 px-10">
             <button 
                onClick={() => setShowAuth(true)}
                className="group relative w-full py-5 bg-[#5be9b1] hover:bg-[#4ade80] text-[#0b0e11] rounded-[24px] text-lg font-black transition-all shadow-2xl shadow-[#5be9b1]/10 flex items-center justify-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Cloud className="w-6 h-6 transition-transform group-hover:scale-110" />
                Accedi alla Libreria
              </button>
          </div>

          <div className="bg-black/40 border border-white/10 p-8 rounded-[32px] text-left space-y-3 mx-10">
             <div className="flex items-center gap-2 text-emerald-500/50">
                <AlertCircle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Restricted Core</span>
             </div>
             <p className="text-xs text-slate-500 leading-relaxed font-black uppercase tracking-widest">
               QUESTO PORTALE È CONFIGURATO PER L'ACCESSO ESCLUSIVO. <br/>
               CONFIGURAZIONE DI SICUREZZA: <span className="text-emerald-500/50">LEVEL 4 ENCRYPTION</span>.
             </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Auth Screen
  if (showAuth && !user) {
    return <AuthView onBack={() => setShowAuth(false)} />;
  }

  // 3. Project Selection Screen (Logged in but no project selected)
  if (user && !currentProject) {
    return <ProjectSelector />;
  }

  // 4. Main App Dashboard
  return (
    <div className="flex h-screen bg-[#1a1e23] text-slate-100 font-sans overflow-hidden relative">
      {/* Background Atmosphere Gradients */}
      <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-[#5be9b1]/5 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-[#5be9b1]/3 blur-[180px] rounded-full pointer-events-none" />
      
      <ErrorBoundary>
        <Sidebar />
        <main className="flex-1 h-screen p-6 overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0">
            {renderView()}
          </div>
        </main>
        
        {activeTab === 'narrative' && <AISidekick />}
      </ErrorBoundary>
      <ToastContainer />
    </div>
  );
}

export default App;
