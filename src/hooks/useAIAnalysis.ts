import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useToast } from '../components/Toast';
import { aiService } from '../lib/aiService';
import { getPlainTextForAI } from '../lib/textUtils';

export const useAIAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { addToast } = useToast();
  
  const setSceneAnalysis = useStore(s => s.setSceneAnalysis);
  const setLastAnalyzedPhrase = useStore(s => s.setLastAnalyzedPhrase);
  const aiConfig = useStore(s => s.aiConfig);

  const stopAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
  };

  const runAnalysis = async (sceneId: string, content: string, tab: 'revision' | 'grammar' | 'synonyms' | 'metaphors') => {
    if (!sceneId || !content) return;
    
    setIsAnalyzing(true);
    // Clear previous for the relevant conceptual tab
    setSceneAnalysis(sceneId, '', tab === 'grammar' ? 'grammar' : 'revision');
    
    const plainText = getPlainTextForAI(content);
    if (plainText.length < 5) {
      addToast("Scena troppo breve per l'analisi", "error");
      setIsAnalyzing(false);
      return;
    }

    const state = useStore.getState();
    const currentProject = state.currentProject;
    const authorName = state.authorName;
    const chapters = state.chapters;

    // FIND CONTEXT (Previous and Next scene snippets)
    const allScenes = chapters.flatMap(c => c.scenes || []);
    const currentIndex = allScenes.findIndex(s => s.id === sceneId);
    const prevScene = currentIndex > 0 ? allScenes[currentIndex - 1] : null;
    const nextScene = currentIndex < allScenes.length - 1 ? allScenes[currentIndex + 1] : null;

    const prevSnippet = prevScene ? getPlainTextForAI(prevScene.content || '').slice(-400) : 'Inizio del manoscritto.';
    const nextSnippet = nextScene ? getPlainTextForAI(nextScene.content || '').slice(0, 400) : 'Fine del manoscritto.';

    abortControllerRef.current = new AbortController();
    
    try {
      let systemPrompt = '';
      switch (tab) {
        case 'revision':
          systemPrompt = `Sei un Senior Editor e Ghostwriter di altissimo livello. 
                         OBIETTIVO: Elevare la qualità letteraria SENZA stravolgere il testo.
                         REGOLE MANDATORIE:
                         1. NON cancellare testo utile, dialoghi o descrizioni importanti. 
                         2. Sii CONSERVATIVO: mantieni il ritmo originale ma rendilo più incisivo. 
                         3. Intervieni sulla forma, non sulla sostanza. Non riassumere.
                         4. 'Mostra, non dire' senza tagliare la scena.
                         FORMATO: Restituisci ESCLUSIVAMENTE oggetti JSON validi:
                         { "original": "testo esatto", "suggestion": "testo elevato", "reason": "spiegazione editoriale", "type": "stile" }`;
          break;
        case 'grammar':
          systemPrompt = `Sei un correttore bozze pignolo. Trova errori grammaticali, refusi, punteggiatura o errori di battitura.
                         FORMATO: Restituisci ESCLUSIVAMENTE oggetti JSON:
                         { "original": "testo esatto", "suggestion": "testo corretto", "reason": "spiegazione", "type": "grammatica" }`;
          break;
        case 'synonyms':
          systemPrompt = `Sei un esperto linguista. Trova parole ripetitive o generiche. Suggerisci termini più precisi, evocativi o ricercati.
                         FORMATO: Restituisci ESCLUSIVAMENTE oggetti JSON:
                         { "original": "parola", "suggestion": "sinonimo ricercato", "reason": "valore semantico", "type": "stile" }`;
          break;
        case 'metaphors':
          systemPrompt = `Sei un autore di narrativa vincitore del premio Strega. Trasforma descrizioni piatte in immagini sensoriali e metafore potenti.
                         FORMATO: Restituisci ESCLUSIVAMENTE oggetti JSON:
                         { "original": "descrizione", "suggestion": "immagine poetica", "reason": "impatto evocativo", "type": "stile" }`;
          break;
      }

      const userPrompt = `
      PROGETTO: ${currentProject?.title || 'Senza Titolo'}
      AUTORE: ${authorName || 'Anonimo'}

      CONTESTO PRECEDENTE (per continuità):
      "...${prevSnippet}"

      TESTO DA ANALIZZARE (FOCUS QUI):
      ${plainText}

      CONTESTO SUCCESSIVO:
      "${nextSnippet}..."

      ISTRUZIONE: Fornisci suggerimenti mirati per il TESTO DA ANALIZZARE, mantenendo la coerenza con il contesto fornito.
      `;

      await aiService.streamChat(
        aiConfig,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        (chunk: string) => {
          const storeTab = tab === 'grammar' ? 'grammar' : 'revision';
          setSceneAnalysis(sceneId, (prev) => prev + chunk, storeTab);
        },
        { signal: abortControllerRef.current.signal }
      );
      
      setLastAnalyzedPhrase(sceneId, plainText.slice(-200), tab);
      addToast("Analisi completata", "success");
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Analysis error:', err);
        addToast("Errore durante l'analisi", "error");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { runAnalysis, stopAnalysis, isAnalyzing };
};
