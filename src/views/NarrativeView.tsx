import { Plus, ChevronDown, ChevronRight, FileText, Folder, GripVertical, Library } from 'lucide-react';
import { useNarrative } from '../hooks/useNarrative';
import { useStore } from '../store/useStore';
import { Editor } from '../components/Editor';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { CreationModal } from '../components/CreationModal';
import { useToast, ToastContainer } from '../components/Toast';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

export const NarrativeView: React.FC = () => {
  const { chapters, addChapter, addScene, updateSceneContent, reorderScenes } = useNarrative();
  const { activeSceneId, setActiveSceneId, setCurrentSceneContent } = useStore();
  const { addToast } = useToast();
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  
  const [modalType, setModalType] = useState<'chapter' | 'scene' | null>(null);
  const [targetChapterId, setTargetChapterId] = useState<string | null>(null);

  const activeScene = chapters.flatMap(c => c.scenes || []).find(s => s.id === activeSceneId);

  useEffect(() => {
    if (activeScene) {
      setCurrentSceneContent(activeScene.content || '');
    } else {
      setCurrentSceneContent('');
    }
  }, [activeSceneId, chapters, setCurrentSceneContent]);

  const toggleChapter = (id: string) => {
    const next = new Set(expandedChapters);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedChapters(next);
  };

  const handleCreateChapter = (title: string) => {
    addChapter(title);
    addToast(`Capitolo "${title}" creato correttamente`, 'success');
  };

  const handleCreateScene = (title: string) => {
    if (targetChapterId) {
      addScene(targetChapterId, title);
      addToast(`Scena "${title}" creata correttamente`, 'success');
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const nextChapters = chapters.map(c => ({
      ...c,
      scenes: c.scenes ? [...c.scenes] : []
    }));

    const sourceChapter = nextChapters.find(c => c.id === source.droppableId);
    const destChapter = nextChapters.find(c => c.id === destination.droppableId);

    if (!sourceChapter || !destChapter) return;

    const [movedScene] = sourceChapter.scenes!.splice(source.index, 1);
    const updatedScene = { ...movedScene, chapter_id: destChapter.id };
    destChapter.scenes!.splice(destination.index, 0, updatedScene);

    reorderScenes(nextChapters);
  };

  return (
    <div className="flex h-full gap-4 overflow-hidden animate-in fade-in duration-700">
      {/* Chapter/Scene Navigator */}
      <div className="w-72 bg-[#121519] border border-white/5 rounded-[32px] overflow-hidden flex flex-col shadow-sm">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <Library className="w-4 h-4 text-[#5be9b1]/50" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Manoscritto</span>
          </div>
          <button onClick={() => setModalType('chapter')} className="p-2 hover:bg-[#5be9b1]/10 rounded-xl text-[#5be9b1] transition-colors border border-transparent hover:border-[#5be9b1]/20">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          <DragDropContext onDragEnd={onDragEnd}>
            {chapters.map(chapter => (
              <div key={chapter.id} className="space-y-1">
                <div 
                  onClick={() => toggleChapter(chapter.id)}
                  className="flex items-center space-x-3 px-4 py-2.5 hover:bg-white/[0.03] rounded-2xl cursor-pointer group transition-all border border-transparent hover:border-white/5"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {expandedChapters.has(chapter.id) ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}
                  </div>
                  <Folder className={cn("w-4 h-4 transition-colors", expandedChapters.has(chapter.id) ? "text-[#5be9b1]" : "text-slate-700")} />
                  <span className="text-sm font-semibold text-slate-300 flex-1 truncate">{chapter.title}</span>
                  <Plus onClick={(e) => {
                    e.stopPropagation();
                    setTargetChapterId(chapter.id);
                    setModalType('scene');
                  }} className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-[#5be9b1] transition-all" />
                </div>

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
                                onClick={() => setActiveSceneId(scene.id)}
                                className={cn(
                                  "flex items-center space-x-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all group/scene border",
                                  activeSceneId === scene.id 
                                    ? "bg-[#5be9b1]/10 text-[#5be9b1] border-[#5be9b1]/20 shadow-lg shadow-[#5be9b1]/5" 
                                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300 border-transparent",
                                  snapshot.isDragging && "bg-[#171b1f] shadow-2xl border-[#5be9b1]/30 z-50 scale-105"
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

      {/* Editor Main Area */}
      <div className="flex-1 min-w-0 h-full relative">
        {activeScene ? (
          <div className="h-full bg-[#121519]/20 rounded-[40px] border border-white/5 overflow-hidden shadow-inner flex flex-col">
            <div className="p-4 px-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
               <div className="flex items-center gap-4">
                  <div className="p-2 bg-[#5be9b1]/10 rounded-xl border border-[#5be9b1]/20">
                     <FileText className="w-4 h-4 text-[#5be9b1]" />
                  </div>
                  <div>
                     <h2 className="text-sm font-black text-slate-200 tracking-tight">{activeScene.title}</h2>
                     <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mt-0.5">Edit Mode</p>
                  </div>
               </div>
               <button className="px-6 py-2 bg-[#5be9b1] hover:bg-[#4ade80] text-[#0b0e11] text-[10px] font-black rounded-xl transition-all shadow-xl shadow-[#5be9b1]/10 uppercase tracking-widest">
                  Save Draft
               </button>
            </div>
            <div className="flex-1 min-h-0">
               <Editor 
                 key={activeScene.id} 
                 initialContent={activeScene.content || ''} 
                 onChange={(html) => {
                   updateSceneContent(activeScene.id, html);
                   useStore.getState().setCurrentSceneContent(html);
                 }} 
               />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-6 bg-slate-900/10 rounded-[40px] border border-white/5">
            <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center opacity-20 bg-white/5">
              <FileText className="w-10 h-10" />
            </div>
            <div className="text-center">
                <h3 className="text-lg font-medium text-slate-400">Pronto per scrivere?</h3>
                <p className="text-xs opacity-50 max-w-[200px] mx-auto mt-2 tracking-wide">Seleziona una scena dalla libreria o creane una nuova per iniziare.</p>
            </div>
          </div>
        )}
      </div>
      
      <CreationModal 
        isOpen={modalType === 'chapter'}
        onClose={() => setModalType(null)}
        onConfirm={handleCreateChapter}
        title="Nuova Architettura"
        placeholder="Titolo del capitolo..."
      />

      <CreationModal 
        isOpen={modalType === 'scene'}
        onClose={() => setModalType(null)}
        onConfirm={handleCreateScene}
        title="Nuova Scena"
        placeholder="Titolo della scena..."
      />
      <ToastContainer />
    </div>
  );
};
