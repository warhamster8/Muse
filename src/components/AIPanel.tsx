import React, { useState } from 'react';
import { Sparkles, MessageSquare, Lightbulb, Users, ListVideo, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCharacters } from '../hooks/useCharacters';
import { useStore } from '../store/useStore';
import { aiService } from '../lib/aiService';
import { useToast } from '../components/Toast';
import { AnimatePresence, motion } from 'framer-motion';
import type { Scene } from '../types/narrative';

interface AIPanelProps {
  activeScene?: Scene;
  onUpdateContent?: (id: string, html: string) => void;
}

export const AIPanel: React.FC<AIPanelProps> = ({ activeScene, onUpdateContent }) => {
  const { characters } = useCharacters();
  const { addToast } = useToast();
  const aiConfig = useStore(s => s.aiConfig);
  const activeSelection = useStore(s => s.activeSelection);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [responseType, setResponseType] = useState<'creative' | 'analytical'>('creative');

  const handleGenerate = async (type: 'creative' | 'analytical' = 'creative') => {
    console.log('[DEBUG] handleGenerate triggered with type:', type);
    setResponseType(type);
    if (!activeScene) {
      addToast("Nessuna scena selezionata", "error");
      return;
    }
    if (!customPrompt.trim()) {
      addToast("Inserisci un prompt prima di generare", "info");
      return;
    }
    
    setIsGenerating(true);
    setAiResponse(null);
    let fullResponse = '';
    
    try {
      addToast(activeSelection ? "Analisi selezione in corso..." : "Analisi scena in corso...", "info");
      
      const contextText = activeSelection || (activeScene.content || '').replace(/<[^>]*>/g, '').slice(0, 1000);
      
      const messages = [
        { 
          role: 'system', 
          content: 'Sei Muse, assistente alla scrittura. Fornisci SOLO il testo richiesto. NON racchiudere la risposta tra virgolette a meno che non siano parte del dialogo. NON aggiungere commenti come "Ecco il testo" o simili.' 
        },
        { role: 'user', content: `Contesto (${activeSelection ? 'SELEZIONE' : 'SCENA'}): "${contextText}"\n\nRichiesta utente: ${customPrompt}` }
      ];

      console.log('[DEBUG] Calling streamChat with config:', aiConfig);
      await aiService.streamChat(
        aiConfig,
        messages,
        (chunk) => {
          fullResponse += chunk;
          setAiResponse(prev => (prev || '') + chunk);
        }
      );

      if (!fullResponse) {
        throw new Error("L'IA non ha restituito alcun contenuto.");
      }

      // Pulizia finale delle virgolette di "wrapping" che alcuni LLM aggiungono
      let cleaned = fullResponse.trim();
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith('«') && cleaned.endsWith('»'))) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
      }
      setAiResponse(cleaned);

      addToast("Suggerimento pronto!", "success");
      setCustomPrompt('');
    } catch (err: any) {
      console.error('[DEBUG] AI Generation Error:', err);
      addToast('Errore AI: ' + (err.message || 'Errore sconosciuto'), "error");
      setAiResponse(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!aiResponse || !activeScene) return;

    if (activeSelection) {
      // Usiamo il sistema di applicazione suggerimenti dell'editor per sostituire la selezione
      window.dispatchEvent(new CustomEvent('muse-apply-suggestion', { 
        detail: { 
          original: activeSelection, 
          suggestion: aiResponse, 
          sceneId: activeScene.id 
        } 
      }));
      addToast("Suggerimento applicato alla selezione!", "success");
    } else {
      // Appendiamo alla fine se non c'è selezione
      const newContent = (activeScene.content || '') + `<p><br>${aiResponse.replace(/\n/g, '<br>')}</p>`;
      if (onUpdateContent) {
        onUpdateContent(activeScene.id, newContent);
        addToast("Suggerimento inserito alla fine!", "success");
      }
    }
    setAiResponse(null);
  };

  const handleReject = () => {
    setAiResponse(null);
    addToast("Suggerimento scartato", "info");
  };

  return (
    <div className="w-full md:w-64 xl:w-80 h-full flex-shrink-0 glass rounded-none md:rounded-[32px] overflow-hidden flex flex-col shadow-soft border border-[var(--border-subtle)] transition-all duration-500">
      
      {/* Header */}
      <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)]/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--accent-soft)] rounded-lg">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">AI Companion</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        {/* AI Assistant Section */}
        <section>
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> Assistant
            </span>
          </div>
          <div className="bg-[var(--bg-surface)]/40 border border-[var(--border-subtle)] rounded-2xl p-4 space-y-3">
            {activeSelection && (
              <div className="px-3 py-1.5 bg-[var(--accent-soft)] border border-[var(--accent)]/20 rounded-lg flex items-center justify-between animate-in slide-in-from-top-1 duration-300">
                <span className="text-[9px] font-black text-[var(--accent)] uppercase tracking-widest">Selezione Attiva</span>
                <span className="text-[9px] text-[var(--text-muted)]">{activeSelection.split(/\s+/).length} parole</span>
              </div>
            )}
            <textarea 
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-transparent text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none h-24 scrollbar-hide"
              placeholder={activeSelection ? "Cosa vuoi fare con il testo selezionato?" : "Esempio: 'Continua la scena in modo drammatico'..."}
            />
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => handleGenerate('creative')}
                disabled={isGenerating || !customPrompt.trim() || !activeScene}
                className={cn(
                  "w-full py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold rounded-xl transition-all shadow-glow-mint flex items-center justify-center gap-2",
                  (isGenerating || !customPrompt.trim() || !activeScene) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Genera Suggerimento
              </button>
            </div>
          </div>

          {/* AI Response Card */}
          <AnimatePresence>
            {aiResponse && (
              <motion.div 
                initial={{ height: 0, opacity: 0, y: 10 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: 10 }}
                className={cn(
                  "mt-4 border rounded-2xl p-4 space-y-4 shadow-xl overflow-hidden",
                  responseType === 'analytical' ? "bg-[var(--bg-surface)] border-[var(--border-subtle)]" : "bg-[var(--bg-card)] border-[var(--accent)]/30"
                )}
              >
                <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
                   <span className={responseType === 'analytical' ? "text-[var(--text-muted)]" : "text-[var(--accent)]"}>
                    {responseType === 'analytical' ? 'AI Analysis / Insight' : 'AI Creative Suggestion'}
                   </span>
                   {isGenerating && <Loader2 className="w-2.5 h-2.5 animate-spin text-[var(--accent)]" />}
                </div>
                <div className={cn(
                  "text-[12px] leading-relaxed max-h-64 overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap",
                  responseType === 'analytical' ? "text-[var(--text-secondary)] font-normal" : "text-[var(--text-primary)] italic"
                )}>
                  {aiResponse}
                </div>
                {!isGenerating && (
                  <div className="flex gap-2 pt-2">
                    {responseType === 'creative' ? (
                      <>
                        <button 
                          onClick={handleApply}
                          className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-emerald-500/30"
                        >
                          Applica
                        </button>
                        <button 
                          onClick={handleReject}
                          className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-rose-500/20"
                        >
                          Scarta
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setAiResponse(null)}
                        className="w-full py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)] text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-[var(--border-subtle)]"
                      >
                        Chiudi Analisi
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Suggestions Section */}
        <section>
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest flex items-center gap-2">
              <Lightbulb className="w-3 h-3" /> Suggestions
            </span>
          </div>
          <div className="bg-[var(--bg-surface)]/40 border border-[var(--border-subtle)] rounded-2xl p-3 space-y-2">
            <div 
              onClick={() => {
                setCustomPrompt("Analizza la tensione di questa scena");
                handleGenerate('analytical');
              }}
              className="p-3 bg-[var(--bg-deep)]/40 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--accent)]/30 transition-colors cursor-pointer group"
            >
              <p className="text-[11px] text-[var(--text-secondary)] group-hover:text-[var(--text-bright)] leading-snug">
                "Analizza la tensione e suggerisci come aumentarla."
              </p>
            </div>
          </div>
        </section>

        {/* Character Insights */}
        <section>
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest flex items-center gap-2">
              <Users className="w-3 h-3" /> Character Insights
            </span>
          </div>
          <div className="bg-[var(--bg-surface)]/40 border border-[var(--border-subtle)] rounded-2xl p-4 space-y-4">
             {characters.length > 0 ? (
               <div className="space-y-2">
                 {characters.slice(0, 3).map(char => (
                   <div key={char.id} className="flex items-center justify-between p-2 bg-[var(--bg-deep)]/30 rounded-lg">
                      <span className="text-[11px] font-bold text-[var(--text-bright)]">{char.name}</span>
                      <button 
                        onClick={() => {
                          setCustomPrompt(`Analizza il comportamento di ${char.name} in questa scena`);
                          handleGenerate('analytical');
                        }}
                        className="text-[9px] uppercase font-black text-[var(--accent)] hover:underline"
                      >
                        Insights
                      </button>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-[11px] text-[var(--text-muted)] italic">Nessun personaggio trovato.</p>
             )}
          </div>
        </section>

        {/* Scene Notes */}
        <section>
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest flex items-center gap-2">
              <ListVideo className="w-3 h-3" /> Scene Notes
            </span>
          </div>
          <div className="bg-[var(--bg-surface)]/40 border border-[var(--border-subtle)] rounded-2xl p-4">
             <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
               <span className="text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest block mb-1">Status</span>
               {activeScene?.status || 'Draft'}
             </p>
             <div className="h-px bg-[var(--border-subtle)] my-3" />
             <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
               <span className="text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest block mb-1">Tags</span>
               {activeScene?.tags?.join(', ') || 'Nessun tag'}
             </p>
          </div>
        </section>

      </div>
    </div>
  );
};
