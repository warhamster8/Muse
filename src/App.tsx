import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { AISidekick } from './components/AISidekick';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';
import { NarrativeView } from './views/NarrativeView';
import { CharactersView } from './views/CharactersView';
import { MindmapView } from './views/MindmapView';
import { WorldView } from './views/WorldView';
import { AuthView } from './views/AuthView';
import { ProjectSelector } from './views/ProjectSelector';
import { BookOpen, AlertCircle, Settings, Cloud, Zap } from 'lucide-react';

function App() {
  const { user, currentProject, activeTab, isLocalMode, setUser, setLocalMode } = useStore();
  const [showAuth, setShowAuth] = useState(false);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        setShowAuth(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        setShowAuth(false);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  const handleTestLocally = () => {
    setLocalMode(true);
  };

  // 1. Landing Screen (Not logged in, Not local, Not in Auth view)
  if (!user && !isLocalMode && !showAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="glass p-12 rounded-3xl border border-slate-700 max-w-lg w-full text-center space-y-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/10 blur-3xl rounded-full" />
          
          <img src="/logo.png" alt="Project Muse Logo" className="w-48 h-48 mx-auto object-contain" />
          <div>
            <h1 className="text-4xl font-bold font-serif bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">Project Muse</h1>
            <p className="text-slate-400 mt-2 text-lg">Il tuo architetto narrativo potenziato dall'IA</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
             <button 
                onClick={() => setShowAuth(true)}
                className="group relative w-full py-5 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 rounded-2xl text-lg font-bold transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Cloud className="w-6 h-6" />
                Connetti Cloud (Supabase)
              </button>

             <button 
                onClick={handleTestLocally}
                className="w-full py-5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-3"
              >
                <Zap className="w-6 h-6 text-yellow-400" />
                Inizia Test Locale
              </button>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl text-left space-y-2">
             <div className="flex items-center gap-2 text-slate-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Info Sincronizzazione</span>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed">
               La modalità Cloud ti permette di sincronizzare i tuoi romanzi tra più dispositivi. La modalità Locale salva i dati solo in questo browser.
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
  if ((user || isLocalMode) && !currentProject) {
    return <ProjectSelector />;
  }

  // 4. Main App Dashboard
  return (
    <div className="flex bg-slate-950 text-slate-100 h-screen overflow-hidden font-sans">
      <Sidebar />
      
      <main className="flex-1 h-screen p-6 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0">
          {activeTab === 'narrative' && <NarrativeView />}
          {activeTab === 'characters' && <CharactersView />}
          {activeTab === 'world' && <WorldView />}
          {activeTab === 'mindmap' && <MindmapView />}
          {activeTab === 'analysis' && (
             <div className="h-full flex items-center justify-center glass rounded-xl border border-slate-700">
                <p className="text-sm italic text-slate-500">Analysis dashboard implementation coming soon...</p>
             </div>
          )}
          {activeTab === 'config' && (
             <div className="h-full flex flex-col items-center justify-center glass rounded-xl border border-slate-700 space-y-4">
                <Settings className="w-16 h-16 opacity-10" />
                <p className="text-sm italic text-slate-500">Global Configuration settings coming soon...</p>
             </div>
          )}
        </div>
      </main>

      {activeTab === 'narrative' && <AISidekick />}
    </div>
  );
}

export default App;

