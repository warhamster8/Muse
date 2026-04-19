import React from 'react';
import { FileText } from 'lucide-react';
import { Editor } from '../../components/Editor';
import type { Scene } from '../../types/narrative';

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
    <div className="flex-1 min-w-0 h-full relative animate-in fade-in duration-500">
      <div className="h-full bg-[#121519]/20 rounded-[40px] border border-white/5 overflow-hidden shadow-inner flex flex-col">
        {/* Header dell'Area Editor */}
        <div className="p-4 px-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
           <div className="flex items-center gap-4">
              <div className="p-2 bg-[#5be9b1]/10 rounded-xl border border-[#5be9b1]/20">
                 <FileText className="w-4 h-4 text-[#5be9b1]" />
              </div>
              <div>
                 <h2 className="text-sm font-black text-slate-200 tracking-tight">{activeScene.title}</h2>
                 <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mt-0.5">Nucleo di Scrittura</p>
              </div>
           </div>
           <button 
             className="px-6 py-2 bg-[#5be9b1] hover:bg-[#4ade80] text-[#0b0e11] text-[10px] font-black rounded-xl transition-all shadow-xl shadow-[#5be9b1]/10 uppercase tracking-widest active:scale-95"
             title="Salvataggio manuale bozza"
           >
              Salva Bozza
           </button>
        </div>

        {/* Componente Core Editor */}
        <div className="flex-1 min-h-0">
           <Editor 
             key={activeScene.id} 
             initialContent={activeScene.content || ''} 
             onChange={(html) => onUpdateContent(activeScene.id, html)} 
           />
        </div>
      </div>
    </div>
  );
};
