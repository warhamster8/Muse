import React from 'react';
import { Clock, ChevronRight, Sparkles, Trash2 } from 'lucide-react';

interface ProjectCardProps {
  project: { id: string; title: string };
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

/**
 * Mattoncino: ProjectCard
 * 
 * Perché esiste: Isola lo stile e le interazioni di una singola opera nell'archivio.
 * Cosa fa: Visualizza il titolo del progetto, lo stato di sincronizzazione e permette l'accesso o l'eliminazione.
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelect,
  onDelete
}) => {
  return (
    <div 
      onClick={onSelect}
      className="group relative min-h-[280px] rounded-[48px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-10 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-2 shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.1)] hover:border-[#5be9b1]/20"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {/* Badge Decorativo */}
          <div className="p-2.5 bg-[#5be9b1]/10 rounded-xl border border-[#5be9b1]/20 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-[#5be9b1]" />
          </div>
          
          <div className="flex items-center gap-3">
              {/* Pulsante Eliminazione (Area Sensibile) */}
              <button 
                onClick={onDelete}
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
        <h3 className="text-3xl font-medium font-display leading-tight text-white tracking-tighter group-hover:text-[#5be9b1] transition-colors">
          {project.title}
        </h3>
      </div>
      
      <div className="flex items-center justify-between mt-8">
        <span className="text-[9px] text-slate-700 group-hover:text-slate-500 uppercase tracking-[0.2em] font-bold transition-colors">
          Sincronizzato / Pronto
        </span>
        <div className="p-4 bg-white/5 border border-white/5 rounded-[24px] group-hover:bg-[#5be9b1] group-hover:text-white transition-all shadow-inner group-hover:shadow-[0_10px_30px_-5px_rgba(16,185,129,0.4)] group-hover:scale-110 active:scale-90">
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </div>
      </div>
    </div>
  );
};
