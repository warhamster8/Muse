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

    const memoryKey = `${sceneId}-${tab}`;
    const lastPhrase = useStore.getState().lastAnalyzedPhrase[memoryKey] || '';

    abortControllerRef.current = new AbortController();
    
    try {
      let systemPrompt = '';
      switch (tab) {
        case 'revision':
          systemPrompt = `Sei un Senior Editor e Copywriter. Il tuo obiettivo è elevare la qualità letteraria del testo. 
                         Non limitarti alla correzione: agisci sul ritmo, elimina le ridondanze (mostra, non dire), e suggerisci varianti più incisive, evocative e professionali. 
                         Trasforma passaggi piatti in prosa vibrante. Restituisci suggerimenti in formato JSON:
                         { "original": "testo esatto", "suggestion": "testo elevato e riscritto", "reason": "spiegazione editoriale del perché questa versione migliora il ritmo o l'impatto", "type": "stile" }`;
          break;
        case 'grammar':
          systemPrompt = `Sei un correttore bozze. Trova errori grammaticali, refusi o punteggiatura errata e restituisci in formato JSON:
                         { "original": "testo esatto", "suggestion": "testo corretto", "reason": "spiegazione", "type": "grammatica" }`;
          break;
        case 'synonyms':
          systemPrompt = `Sei un esperto linguista e filologo. Trova parole ripetitive, banali o pigre. 
                         Suggerisci sinonimi ricercati, termini tecnici precisi o contrari per creare contrasto dinamico. 
                         L'obiettivo è la precisione terminologica e la varietà lessicale. Restituisci in formato JSON:
                         { "original": "parola esatta", "suggestion": "termine ricercato/preciso", "reason": "spiegazione del valore semantico aggiunto", "type": "stile" }`;
          break;
        case 'metaphors':
          systemPrompt = `Sei un autore di narrativa pluripremiato. Identifica descrizioni piatte, letterali o didascaliche. 
                         Suggerisci metafore potenti, similitudini insolite o immagini sensoriali che colpiscano il lettore. 
                         Passa dal 'dire' al 'far sentire'. Restituisci in formato JSON:
                         { "original": "descrizione piatta", "suggestion": "immagine metaforica/sensoriale", "reason": "spiegazione dell'emozione o dell'immagine evocata", "type": "stile" }`;
          break;
      }

      const userPrompt = `Testo da analizzare:
      ${plainText}
      
      Contesto precedente:
      ${lastPhrase}`;

      await aiService.streamChat(
        aiConfig,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        (chunk: string) => {
          // Map all stylistic tasks to 'revision' display tab
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
