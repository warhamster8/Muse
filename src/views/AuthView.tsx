1: import React, { useState } from 'react';
2: import { supabase } from '../lib/supabase';
3: import { Mail, Lock, LogIn, ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
4: import { useStore } from '../store/useStore';
5: 
6: interface AuthViewProps {
7:   onBack: () => void;
8: }
9: 
10: export const AuthView: React.FC<AuthViewProps> = ({ onBack }) => {
11:   const [email, setEmail] = useState('');
12:   const [password, setPassword] = useState('');
13:   const [loading, setLoading] = useState(false);
14:   const [error, setError] = useState<string | null>(null);
15:   const { setUser } = useStore();
16: 
17:   const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL;
18: 
19:   const handleAuth = async (e: React.FormEvent) => {
20:     e.preventDefault();
21:     setLoading(true);
22:     setError(null);
23: 
24:     // Controllo preventivo dell'email
25:     if (ALLOWED_EMAIL && email.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
26:       setError('Accesso negato: Solo il proprietario può accedere a questa istanza.');
27:       setLoading(false);
28:       return;
29:     }
30: 
31:     try {
32:       const { data, error: signInError } = await supabase.auth.signInWithPassword({
33:         email,
34:         password,
35:       });
36:       
37:       if (signInError) throw signInError;
38:       
39:       if (data.user) {
40:         // Doppio controllo per sicurezza post-auth
41:         if (ALLOWED_EMAIL && data.user.email?.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
42:           await supabase.auth.signOut();
43:           throw new Error('Accesso negato: Utente non autorizzato.');
44:         }
45:         setUser({ id: data.user.id, email: data.user.email });
46:       }
47:     } catch (err: any) {
48:       setError(err.message || 'Errore durante l\'autenticazione');
49:     } finally {
50:       setLoading(false);
51:     }
52:   };
53: 
54:   return (
55:     <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
56:       <div className="glass p-8 rounded-3xl border border-slate-700 max-w-md w-full relative overflow-hidden">
57:         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600" />
58:         
59:         <button 
60:           onClick={onBack}
61:           className="absolute top-6 left-6 text-slate-500 hover:text-slate-300 transition-colors"
62:         >
63:           <ArrowLeft className="w-5 h-5" />
64:         </button>
65: 
66:         <div className="text-center mb-8 pt-4">
67:           <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
68:             <ShieldAlert className="w-10 h-10 text-blue-500" />
69:           </div>
70:           <h2 className="text-2xl font-bold font-serif">
71:             Accesso Riservato
72:           </h2>
73:           <p className="text-slate-400 text-sm mt-2">
74:             Questa istanza di Muse è privata. Inserisci le tue credenziali per continuare.
75:           </p>
76:         </div>
77: 
78:         <form onSubmit={handleAuth} className="space-y-4">
79:           <div className="space-y-2">
80:             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email Proprietario</label>
81:             <div className="relative">
82:               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
83:               <input 
84:                 type="email" 
85:                 required
86:                 className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
87:                 placeholder="la-tua-email@esempio.it"
88:                 value={email}
89:                 onChange={(e) => setEmail(e.target.value)}
90:               />
91:             </div>
92:           </div>
93: 
94:           <div className="space-y-2">
95:             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Password</label>
96:             <div className="relative">
97:               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
98:               <input 
99:                 type="password" 
100:                 required
101:                 className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
102:                 placeholder="••••••••"
103:                 value={password}
104:                 onChange={(e) => setPassword(e.target.value)}
105:               />
106:             </div>
107:           </div>
108: 
109:           {error && (
110:             <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium animate-in fade-in slide-in-from-top-1">
111:               {error}
112:             </div>
113:           )}
114: 
115:           <button 
116:             type="submit"
117:             disabled={loading}
118:             className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 mt-4"
119:           >
120:             {loading ? (
121:               <Loader2 className="w-5 h-5 animate-spin" />
122:             ) : (
123:               <>
124:                 <LogIn className="w-5 h-5" />
125:                 Accedi come Proprietario
126:               </>
127:             )}
128:           </button>
129:         </form>
130: 
131:         <div className="mt-8 pt-6 border-t border-slate-800 text-center">
132:           <p className="text-xs text-slate-500">
133:             Sei uno sviluppatore? Puoi clonare questo progetto su <a href="https://github.com/warhamster8/Muse" className="text-blue-500 hover:underline">GitHub</a>.
134:           </p>
135:         </div>
136:       </div>
137:     </div>
138:   );
139: };

