import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NewProjectCardProps {
  onCreate: (title: string) => void;
}

/**
 * Mattoncino: NewProjectCard
 * 
 * Perché esiste: Separa la logica del form di creazione dalla griglia dei progetti esistenti.
 * Cosa fa: Alterna tra un pulsante di invito all'azione e un form di inserimento titolo.
 */
export const NewProjectCard: React.FC<NewProjectCardProps> = ({ onCreate }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onCreate(newTitle.trim());
      setNewTitle('');
      setIsCreating(false);
    }
  };

  return (
    <div 
      className={cn(
        "group relative min-h-[280px] rounded-[48px] border-2 border-dashed transition-all p-10 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden",
        isCreating 
          ? "border-[#5be9b1]/50 bg-[#5be9b1]/5 shadow-inner" 
          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#5be9b1]/20 shadow-sm"
      )}
      onClick={() => !isCreating && setIsCreating(true)}
    >
      {/* Elemento decorativo di sfondo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#5be9b1]/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-[#5be9b1]/10 transition-all" />
      
      {isCreating ? (
        <form onSubmit={handleSubmit} className="w-full space-y-6 relative z-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-[#5be9b1] uppercase tracking-widest">Inizializza Architettura</label>
            <input 
              autoFocus
              className="w-full bg-[#121519]/60 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-[#5be9b1]/50 transition-all placeholder:text-slate-800"
              placeholder="Titolo dell'opera..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setIsCreating(false)}
            />
          </div>
          <div className="flex gap-4">
            <button 
              type="submit"
              className="flex-1 py-4 bg-[#5be9b1] rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#5be9b1] shadow-xl shadow-emerald-950/40 transition-all active:scale-95"
            >
              Crea
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
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-3">Espandi il tuo universo</p>
        </>
      )}
    </div>
  );
};
