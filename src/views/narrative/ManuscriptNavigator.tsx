import React from 'react';
import { Plus, ChevronDown, ChevronRight, FileText, Folder, GripVertical, Library } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { cn } from '../../lib/utils';
import type { Chapter } from '../../types/narrative';

interface ManuscriptNavigatorProps {
  chapters: Chapter[];
  activeSceneId: string | null;
  expandedChapters: Set<string>;
  onToggleChapter: (id: string) => void;
  onSelectScene: (id: string) => void;
  onCreateChapter: () => void;
  onCreateScene: (chapterId: string) => void;
  onReorder: (result: DropResult) => void;
}

/**
 * Mattoncino: ManuscriptNavigator
 * 
 * Perché esiste: Separa la logica di navigazione e Drag & Drop dal core dell'editor.
 * Cosa fa: Renderizza l'albero gerarchico dei capitoli e permette il riordinamento delle scene.
 */
export const ManuscriptNavigator: React.FC<ManuscriptNavigatorProps> = ({
  chapters,
  activeSceneId,
  expandedChapters,
  onToggleChapter,
  onSelectScene,
  onCreateChapter,
  onCreateScene,
  onReorder
}) => {
  return (
    <div className="w-80 bg-[#121519] border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-sm">
      {/* Header del Navigatore */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2">
          <Library className="w-4 h-4 text-[#5be9b1]/50" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Manoscritto</span>
        </div>
        <button 
          onClick={onCreateChapter} 
          className="p-2 hover:bg-[#5be9b1]/10 rounded-xl text-[#5be9b1] transition-colors border border-transparent hover:border-[#5be9b1]/30"
          title="Aggiungi Capitolo"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {/* Lista Capitoli e Scene con Drag & Drop */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
        <DragDropContext onDragEnd={onReorder}>
          {chapters.map(chapter => (
            <div key={chapter.id} className="space-y-1">
              {/* Riga Capitolo */}
              <div 
                onClick={() => onToggleChapter(chapter.id)}
                className="flex items-center space-x-3 px-4 py-2.5 hover:bg-white/[0.03] rounded-2xl cursor-pointer group transition-all border border-transparent hover:border-white/5"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {expandedChapters.has(chapter.id) ? 
                    <ChevronDown className="w-3 h-3 text-slate-600" /> : 
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                  }
                </div>
                <Folder className={cn("w-4 h-4 transition-colors", expandedChapters.has(chapter.id) ? "text-[#5be9b1]" : "text-slate-700")} />
                <span className="text-sm font-black text-slate-300 flex-1 truncate uppercase tracking-tighter">{chapter.title}</span>
                <Plus 
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateScene(chapter.id);
                  }} 
                  className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-[#5be9b1] transition-all" 
                />
              </div>

              {/* Lista Scene (Droppable) */}
              {expandedChapters.has(chapter.id) && (
                <Droppable droppableId={chapter.id} type="SCENE">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="pl-8 space-y-1 min-h-[8px] py-1"
                    >
                      {chapter.scenes?.map((scene, index) => (
                        <Draggable key={scene.id} draggableId={scene.id} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              onClick={() => onSelectScene(scene.id)}
                              className={cn(
                                "flex items-center space-x-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all group/scene border",
                                activeSceneId === scene.id 
                                  ? "bg-[#5be9b1]/10 text-[#5be9b1] border-[#5be9b1]/30" 
                                  : "text-slate-500 hover:bg-white/5 hover:text-slate-200 border-transparent",
                                snapshot.isDragging && "bg-[#1a1f24] shadow-2xl border-[#5be9b1]/50 z-50 scale-105"
                              )}
                            >
                              <div {...provided.dragHandleProps} className="p-1 hover:bg-white/10 rounded-lg opacity-0 group-hover/scene:opacity-100 transition-opacity">
                                <GripVertical className="w-3.5 h-3.5 text-slate-700" />
                              </div>
                              <FileText className={cn("w-3.5 h-3.5", activeSceneId === scene.id ? "text-[#5be9b1]" : "text-slate-600")} />
                              <span className={cn("text-xs truncate font-bold", activeSceneId === scene.id ? "text-slate-100" : "text-slate-500 group-hover/scene:text-slate-300")}>
                                {scene.title}
                              </span>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          ))}
        </DragDropContext>
      </div>
    </div>
  );
};
