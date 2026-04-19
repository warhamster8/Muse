import React, { useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { Editor } from '../../components/Editor';
import type { Scene } from '../../types/narrative';
import { cn } from '../../lib/utils';

interface EditorWorkspaceProps {
  activeScene: Scene | undefined;
  onUpdateContent: (id: string, html: string) => void;
}

/**
 * Mattoncino: EditorWorkspace
 * 
 * Perché esiste: Isola il componente Editor e la relativa UI di controllo.
 * Cosa fa: Mostra l'editor se c'è una scena attiva, altrimenti mostra uno stato vuoto (Empty State).
 */
export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  activeScene,
  onUpdateContent
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const onAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 2000);
  };

  // Caso 1: Nessuna scena selezionata (Empty State)
  if (!activeScene) {
    return (
      <div className="flex-1 min-w-0 h-full flex flex-col items-center justify-center text-slate-700 space-y-6 bg-[#121519]/10 rounded-[40px] border border-white/5 animate-in fade-in duration-500">
        <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center opacity-20 bg-white/5 transition-all hover:scale-110">
          <FileText className="w-10 h-10" />
        </div>
        <div className="text-center">
            <h3 className="text-lg font-medium text-slate-400">Pronto per scrivere?</h3>
            <p className="text-xs opacity-50 max-w-[200px] mx-auto mt-2 tracking-wide font-light">
              Seleziona una scena dalla libreria o creane una nuova per iniziare il tuo viaggio narrativo.
            </p>
        </div>
      </div>
    );
  }

  // Caso 2: Scena attiva, mostriamo l'editor
  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#111418] relative">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#5be9b1]/5 blur-[100px] pointer-events-none" />

      {/* Toolbar Premium */}
      <div className="h-20 bg-white/[0.01] border-b border-white/5 flex items-center justify-between px-10 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-[#5be9b1] uppercase tracking-[0.4em] mb-1">Editing Mode</span>
            <h2 className="text-xl font-black text-slate-100 tracking-tighter uppercase truncate max-w-[300px]">
              {activeScene.title}
            </h2>
          </div>
          <div className="h-8 w-[1px] bg-white/5 mx-2" />
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
            <div className="w-1.5 h-1.5 bg-[#5be9b1] rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Sync</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className={cn(
              "flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl group",
              isAnalyzing 
                ? "bg-slate-800 text-slate-500" 
                : "bg-[#5be9b1] text-[#0b0e11] hover:scale-105 shadow-[0_10px_30px_-5px_rgba(91,233,177,0.3)]"
            )}
          >
            <Sparkles className={cn("w-4 h-4", !isAnalyzing && "group-hover:rotate-12 transition-transform")} />
            {isAnalyzing ? 'Analisi in Corso...' : 'AI Sidekick'}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto p-12 lg:p-20 scrollbar-hide bg-[#0b0e11]">
        <div className="max-w-4xl mx-auto glass border border-white/5 rounded-[48px] p-16 lg:p-24 shadow-inner min-h-full">
          <Editor 
            initialContent={activeScene.content || ''} 
            onChange={(newContent) => onUpdateContent(activeScene.id, newContent)} 
          />
        </div>
      </div>
    </div>
  );
};
