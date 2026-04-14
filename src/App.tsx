import React from 'react';
import { Sidebar } from './components/Sidebar';
import { AISidekick } from './components/AISidekick';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';
import { NarrativeView } from './views/NarrativeView';
import { CharactersView } from './views/CharactersView';
import { MindmapView } from './views/MindmapView';
import { WorldView } from './views/WorldView';
import { BookOpen, AlertCircle, Settings } from 'lucide-react';

function App() {
  const { user, currentProject, activeTab, isLocalMode, setUser, setCurrentProject, setLocalMode } = useStore();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser({ id: session.user.id, email: session.user.email });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser({ id: session.user.id, email: session.user.email });
      else setUser(null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  // Auto-fetch or create a project if logged in
  React.useEffect(() => {
    if (user && !currentProject) {
      const initProject = async () => {
        const { data: projects } = await supabase.from('projects').select('*').limit(1);
        if (projects && projects.length > 0) {
          setCurrentProject({ id: projects[0].id, title: projects[0].title });
        } else {
          // Create default project
          const { data: newProj } = await supabase
            .from('projects')
            .insert([{ user_id: user.id, title: 'My First Novel' }])
            .select()
            .single();
          if (newProj) setCurrentProject({ id: newProj.id, title: newProj.title });
        }
      };
      initProject();
    }
  }, [user, currentProject, setCurrentProject]);

  const handleTestLocally = () => {
    setLocalMode(true);
    setUser({ id: 'local-tester', email: 'test@local.muse' });
    setCurrentProject({ id: 'local-project', title: 'Local Test Novel' });
  };

  if (!user && !isLocalMode) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="glass p-12 rounded-3xl border border-slate-700 max-w-md w-full text-center space-y-8">
          <BookOpen className="w-16 h-16 text-blue-400 mx-auto" />
          <div>
            <h1 className="text-3xl font-bold font-serif">Project Muse</h1>
            <p className="text-slate-400 mt-2">AI-powered novel architect</p>
          </div>
          
          <div className="space-y-3">
             <button 
                onClick={handleTestLocally}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-lg font-bold transition-all shadow-lg shadow-blue-900/20"
              >
                Start Local Test
              </button>
              <p className="text-xs text-slate-500">Saves your work in the browser's storage.</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl text-left space-y-4">
             <div className="flex items-center gap-2 text-slate-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Connect Supabase</span>
             </div>
             <p className="text-[10px] text-slate-500 leading-relaxed">
               For cloud sync and version history, ensure your .env variables are set and your database is initialized with the provided SQL script.
             </p>
          </div>
        </div>
      </div>
    );
  }

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
