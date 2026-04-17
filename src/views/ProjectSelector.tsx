import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';
import { useStore } from '../store/useStore';
import { Plus, Clock, ChevronRight, LogOut, Loader2, Sparkles, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export const ProjectSelector: React.FC = () => {
  const { user, isLocalMode, setCurrentProject, logout } = useStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    if (isLocalMode) {
      const localProjs = storage.getCollection('projects');
      setProjects(localProjs);
    } else if (user) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setProjects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [user, isLocalMode]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    setLoading(true);
    if (isLocalMode) {
      const newProj = storage.insert('projects', { title: newTitle });
      setCurrentProject({ id: newProj.id, title: newProj.title });
    } else if (user) {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ user_id: user.id, title: newTitle }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating project:', error);
        alert('Errore nella creazione del progetto: ' + error.message);
      } else if (data) {
        setCurrentProject({ id: data.id, title: data.title });
      }
    }
    setLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Sei sicuro di voler eliminare questo progetto? Tutti i dati associati verranno persi.')) return;

    if (isLocalMode) {
      storage.delete('projects', id);
      fetchProjects();
    } else {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) alert('Errore nell\'eliminazione: ' + error.message);
      else fetchProjects();
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 selection:bg-[#5be9b1]/30 overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl w-full space-y-12 py-12 animate-in fade-in zoom-in duration-1000">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white/[0.02] p-10 rounded-[48px] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-8">
            <div className="relative group">
                <div className="absolute -inset-4 bg-[#5be9b1]/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <img src="/logo.png" alt="Muse Logo" className="relative w-24 h-24 object-contain transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div>
              <h1 className="text-5xl font-medium font-display tracking-tighter text-white">Archivio Opere</h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">
                {isLocalMode ? 'Core Locale Attivo / Salvataggio Browser' : `Bentornato Architetto / ${user?.email}`}
              </p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center gap-4 px-8 py-4 bg-white/[0.05] hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-[24px] transition-all border border-white/5 active:scale-95 group"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Disconnetti Core</span>
          </button>
        </div>

        {loading && !isCreating ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-6">
            <div className="p-6 bg-[#5be9b1]/10 rounded-3xl border border-[#5be9b1]/20 animate-pulse">
                <Loader2 className="w-10 h-10 text-[#5be9b1] animate-spin" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#5be9b1]/50 animate-pulse">Sincronizzazione Indice...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Create Card */}
            <div 
              className={cn(
                "group relative min-h-[280px] rounded-[48px] border-2 border-dashed transition-all p-10 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden",
                isCreating 
                  ? "border-[#5be9b1]/50 bg-[#5be9b1]/5 shadow-inner" 
                  : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#5be9b1]/20 shadow-sm"
              )}
              onClick={() => !isCreating && setIsCreating(true)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#5be9b1]/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-[#5be9b1]/10 transition-all" />
              
              {isCreating ? (
                <form onSubmit={handleCreate} className="w-full space-y-6 relative z-10 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-[#5be9b1] uppercase tracking-widest">Titolo Manoscritto</label>
                    <input 
                      autoFocus
                      className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-[#5be9b1]/50 transition-all placeholder:text-slate-800"
                      placeholder="L'Ombra del Tempo..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-[#5be9b1] rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#5be9b1] shadow-xl shadow-emerald-950/40 transition-all active:scale-95"
                    >
                      Inizializza
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setIsCreating(false); }}
                      className="px-6 py-4 bg-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 text-slate-400 transition-all"
                    >
                      Annulla
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="p-5 bg-white/5 rounded-[24px] mb-6 group-hover:scale-110 group-hover:bg-[#5be9b1]/10 group-hover:border-[#5be9b1]/20 border border-white/5 transition-all shadow-inner">
                    <Plus className="w-8 h-8 text-[#5be9b1]" />
                  </div>
                  <span className="text-xl font-medium text-slate-100 tracking-tight">Nuova Opera</span>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-3">Inizia a scrivere oggi</p>
                </>
              )}
            </div>

            {/* Project Cards */}
            {projects.map((proj) => (
              <div 
                key={proj.id}
                onClick={() => setCurrentProject({ id: proj.id, title: proj.title })}
                className="group relative min-h-[280px] rounded-[48px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-10 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-2 shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.1)] hover:border-[#5be9b1]/20"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-[#5be9b1]/10 rounded-xl border border-[#5be9b1]/20 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-lg">
                        <Sparkles className="w-3.5 h-3.5 text-[#5be9b1]" />
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => handleDelete(e, proj.id)}
                          className="p-3 text-slate-800 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-500/20"
                          title="Elimina Progetto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:border-[#5be9b1]/20 transition-colors">
                            <Clock className="w-4 h-4 text-slate-700 group-hover:text-[#5be9b1]/50" />
                        </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-medium font-display leading-tight text-white tracking-tighter group-hover:text-[#5be9b1] transition-colors">{proj.title}</h3>
                </div>
                
                <div className="flex items-center justify-between mt-8">
                  <span className="text-[9px] text-slate-700 group-hover:text-slate-500 uppercase tracking-[0.2em] font-bold transition-colors">Analisi Recente / Sincronizzato</span>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-[24px] group-hover:bg-[#5be9b1] group-hover:text-white transition-all shadow-inner group-hover:shadow-[0_10px_30px_-5px_rgba(16,185,129,0.4)] group-hover:scale-110 active:scale-90">
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {projects.length === 0 && !loading && !isCreating && (
          <div className="text-center py-24 bg-white/[0.01] rounded-[48px] border border-dashed border-white/5">
            <PlusCircle className="w-16 h-16 text-slate-800 mx-auto mb-6 opacity-20" />
            <div className="space-y-2">
                <p className="text-xl font-medium text-slate-500 tracking-tight">Nessuna opera nel core</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700">Clicca sul box superiore per inizializzare il primo manoscritto</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

