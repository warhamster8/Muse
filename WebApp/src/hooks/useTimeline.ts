import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNarrative } from './useNarrative';
import { aiService } from '../lib/aiService';
import { getPlainTextForAI } from '../lib/narrativeUtils';
import { useToast } from '../components/Toast';
import type { SceneTimelineEvent } from '../types/timeline';



export function useTimeline() {
  const { aiConfig } = useStore();
  const { updateTimelineEvents } = useNarrative();
  const { addToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTimeline = async (sceneId: string, content: string) => {
    if (!content || content.trim().length < 10) {
      addToast("Testo troppo breve per estrarre beats narrativi.", "error");
      return;
    }
    
    setIsGenerating(true);
    addToast("Analisi beats narrativi in corso...", "info");
    const plainText = getPlainTextForAI(content);

    try {
      const systemPrompt = `Sei un esperto Analista Narrativo specializzato in "Scene Beats" (unità d'azione).
Il tuo compito è scomporre una scena nei suoi battiti narrativi fondamentali.

REGOLE DI ANALISI:
1. Identifica ogni spostamento di valore (da positivo a negativo o viceversa).
2. Distingui tra Azione (ciò che un personaggio fa), Reazione (l'impatto psicologico) e Nuova Situazione.
3. Estrai i "Beat" che cambiano lo stato della scena.

Ogni oggetto nel JSON deve avere:
- Titolo: Un nome evocativo del beat (es. "L'esitazione di Erika").
- Descrizione: Cosa accade e perché è importante per la tensione.
- Timestamp: Momento relativo (es. "Inizio scena", "+5 min", "Dopo il diverbio").
- Durata: Stima minuti (intero).
- Importanza: low (transizione), medium (sviluppo), high (svolta/climax di scena).

FORMATO: Restituisci ESCLUSIVAMENTE un array JSON [].`;

      let fullResponse = '';
      await aiService.streamChat(
        aiConfig,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Estrai la timeline da questa scena:\n\n${plainText}` }
        ],
        (chunk) => {
          fullResponse += chunk;
        }
      );

      // Extract JSON from response (in case AI adds markdown blocks)
      // Robust extraction for JSON arrays
      let events: SceneTimelineEvent[] = [];
      const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        try {
          events = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Attempt recovery for partial JSON
          const lastBracket = fullResponse.lastIndexOf('[');
          if (lastBracket !== -1) {
            let partial = fullResponse.substring(lastBracket);
            if (!partial.trim().endsWith(']')) partial += (partial.includes('}') ? ']' : '}]');
            try { events = JSON.parse(partial); } catch (e2) { throw new Error('JSON corrotto'); }
          }
        }
      } else {
        // Aggressive recovery for individual objects
        let depth = 0;
        let start = -1;
        for (let i = 0; i < fullResponse.length; i++) {
          if (fullResponse[i] === '{') {
            if (depth === 0) start = i;
            depth++;
          } else if (fullResponse[i] === '}') {
            if (depth > 0) {
              depth--;
              if (depth === 0 && start !== -1) {
                try {
                  const obj = JSON.parse(fullResponse.substring(start, i + 1));
                  if (obj.title && obj.timestamp) events.push(obj);
                } catch (err) {}
                start = -1;
              }
            }
          }
        }
      }

      if (events.length > 0) {
         await updateTimelineEvents(sceneId, events);
         addToast("Beats narrativi generati!", "success");
         return events;
      } else {
        throw new Error('Nessun evento cronologico rilevato nella scena');
      }
    } catch (err: any) {
      console.error('Timeline generation error:', err);
      addToast(err.message || "Errore durante la generazione", "error");
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateTimeline,
    isGenerating
  };
}
