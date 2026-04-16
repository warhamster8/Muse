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
import { AlertCircle, Settings, Cloud, Zap } from 'lucide-react';
import { ToastContainer } from './components/Toast';

17: function App() {
18:   const { user, currentProject, activeTab, setUser, setLocalMode } = useStore();
19:   const [showAuth, setShowAuth] = useState(false);
20:   const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL;
21: 
22:   React.useEffect(() => {
23:     supabase.auth.getSession().then(({ data: { session } }) => {
24:       if (session?.user) {
25:         // Controllo sicurezza email
26:         if (ALLOWED_EMAIL && session.user.email?.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
27:           supabase.auth.signOut();
28:           setUser(null);
29:           return;
30:         }
31:         setUser({ id: session.user.id, email: session.user.email });
32:         setShowAuth(false);
33:       }
34:     });
35: 
36:     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
37:       if (session?.user) {
38:         if (ALLOWED_EMAIL && session.user.email?.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
39:           supabase.auth.signOut();
40:           setUser(null);
41:           return;
42:         }
43:         setUser({ id: session.user.id, email: session.user.email });
44:         setShowAuth(false);
45:       } else {
46:         setUser(null);
47:       }
48:     });
49: 
50:     return () => subscription.unsubscribe();
51:   }, [setUser, ALLOWED_EMAIL]);
52: 
53:   const renderView = () => {
54:     switch (activeTab) {
55:       case 'narrative':
56:         return <NarrativeView />;
57:       case 'characters':
58:         return <CharactersView />;
59:       case 'world':
60:         return <WorldView />;
61:       case 'notes':
62:         return <NotesView />;
63:       case 'config':
64:         return (
65:           <div className="h-full flex flex-col items-center justify-center glass rounded-xl border border-slate-700 space-y-4">
66:             <Settings className="w-16 h-16 opacity-10" />
67:             <p className="text-sm italic text-slate-500">Global Configuration settings coming soon...</p>
68:           </div>
69:         );
70:       case 'analysis':
71:         return <AnalysisView />;
72:       default:
73:         return <NarrativeView />;
74:     }
75:   };
76: 
77:   // 1. Landing Screen (Not logged in, Not in Auth view)
78:   if (!user && !showAuth) {
79:     return (
80:       <div className="h-screen flex items-center justify-center bg-slate-950 p-4">
81:         <div className="glass p-12 rounded-3xl border border-slate-700 max-w-lg w-full text-center space-y-8 relative overflow-hidden">
82:           <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-3xl rounded-full" />
83:           <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/10 blur-3xl rounded-full" />
84:           
85:           <div className="w-48 h-48 mx-auto rounded-full glass flex items-center justify-center p-4 mb-8 logo-glow border-white/5">
86:             <img src="/logo.png" alt="Project Muse Logo" className="w-full h-full object-contain logo-blend" />
87:           </div>
88:           <div>
89:             <h1 className="text-4xl font-bold font-display bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">Project Muse</h1>
90:             <p className="text-slate-400 mt-2 text-lg">Il tuo architetto narrativo privato</p>
91:           </div>
92:           
93:           <div className="grid grid-cols-1 gap-4">
94:              <button 
95:                 onClick={() => setShowAuth(true)}
96:                 className="group relative w-full py-5 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 rounded-2xl text-lg font-bold transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 overflow-hidden"
97:               >
98:                 <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
99:                 <Cloud className="w-6 h-6" />
100:                 Accedi alla tua Libreria
101:               </button>
102:           </div>
103: 
104:           <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl text-left space-y-2">
105:              <div className="flex items-center gap-2 text-slate-400">
106:                 <AlertCircle className="w-4 h-4" />
107:                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Accesso Riservato</span>
108:              </div>
109:              <p className="text-xs text-slate-400 leading-relaxed">
110:                Questa istanza è protetta. Se non sei il proprietario, puoi scaricare il codice sorgente su GitHub per creare la tua versione.
111:              </p>
112:           </div>
113:         </div>
114:       </div>
115:     );
116:   }
117: 
118:   // 2. Auth Screen
119:   if (showAuth && !user) {
120:     return <AuthView onBack={() => setShowAuth(false)} />;
121:   }
122: 
123:   // 3. Project Selection Screen (Logged in but no project selected)
124:   if (user && !currentProject) {
125:     return <ProjectSelector />;
126:   }
127: 
128:   // 4. Main App Dashboard
129:   return (
130:     <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
131:       <ErrorBoundary>
132:         <Sidebar />
133:         <main className="flex-1 h-screen p-6 overflow-hidden flex flex-col">
134:           <div className="flex-1 min-h-0">
135:             {renderView()}
136:           </div>
137:         </main>
138:         
139:         {activeTab === 'narrative' && <AISidekick />}
140:       </ErrorBoundary>
141:       <ToastContainer />
142:     </div>
143:   );
144: }


export default App;
