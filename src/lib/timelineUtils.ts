import type { GlobalTimelineEvent } from '../types/timeline';
import { aiService, type AIConfig } from './aiService';

const SYSTEM_PROMPT = `Sei un esperto Cronologista Letterario e Analista Narrativo. Il tuo compito è mappare la cronologia OGGETTIVA degli eventi nel testo usando una metrica MATEMATICA ASSOLUTA.

REGOLE DI IDENTITÀ:
- NON usare "Narratore". Identifica i personaggi per NOME (es. "Erika", "Marco").

MATEMATICA DEL TEMPO (REGOLA DEL CALENDARIO UNIVERSALE):
Per garantire che scene diverse si allineino correttamente, usa l'anno 2000 come ANCORA ZERO (0 minuti).
- 1 Anno = 525.600 minuti.
- 1 Mese (media) = 43.800 minuti.
- 1 Giorno = 1.440 minuti.

REGOLE TEMPORALI (MATEMATICA DEL TEMPO):
- Usa l'anno 2000 come ANCORA ZERO (0 minuti).
- Calcola "estimatedStart" come minuti trascorsi dal 01/01/2000.
- SE RICEVI UN "OFFSET DI RIFERIMENTO", usalo come base minima di partenza se nel testo non ci sono date esplicite.
- NON USARE MAI NUMERI NEGATIVI.
- COERENZA: Un evento etichettato "1 anno dopo" DEVE avere un valore numerico SUPERIORE a quello dell'evento originale.
- SPAZIATURA: Se estrai più eventi da una singola scena, distanziali logicamente (es. +15 o +30 minuti tra loro).

REGOLE CRITICHE:
- Se un evento è un flashback, isFlashback deve essere TRUE e il valore temporale deve essere inferiore al presente della scena.

STRUTTURA JSON:
1. "title": Titolo specifico (max 5 parole).
2. "summary": Descrizione azione (max 15 parole).
3. "timeLabel": Marcatore testuale (es. "10 Novembre 2026").
4. "estimatedStart": Numero intero (minuti assoluti dal 2000).
5. "estimatedEnd": estimatedStart + durata (es. +60 per un incontro).
6. "importance": "high", "medium", "low".
7. "location": Luogo specifico.
8. "characters": Array di nomi.
9. "isFlashback": Boolean.

REGOLE DI OUTPUT:
Restituisci ESCLUSIVAMENTE l'array JSON [ { ... } ].`;

export const timelineUtils = {
  async extractEvents(text: string, aiConfig: AIConfig, contextMinutes?: number): Promise<GlobalTimelineEvent[]> {
    try {
      let fullResponse = '';
      const contextPrompt = contextMinutes 
        ? `\n\n[RIFERIMENTO CRONOLOGICO]: Questa scena avviene DOPO il minuto ${contextMinutes} dal 01/01/2000. Usa questo valore come punto di partenza se non ci sono date diverse nel testo.`
        : '';

      await aiService.streamChat(
        aiConfig,
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analizza questo testo ed estrai la timeline in formato JSON:${contextPrompt}\n\n${text}` }
        ],
        (chunk) => {
          fullResponse += chunk;
        }
      );

      const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
         throw new Error('Nessun JSON valido trovato nella risposta AI');
      }

      const events = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(events)) {
        throw new Error('La risposta AI non è un array di eventi');
      }
      
      return events.map((e: any, i: number) => ({
        ...e,
        id: `evt-${i}-${Math.random().toString(36).substr(2, 9)}`
      }));
    } catch (err) {
      console.error('[TIMELINE] Errore estrazione:', err);
      throw err;
    }
  },

  detectOverlaps(events: GlobalTimelineEvent[]): Record<string, string[]> {
    const conflictMap: Record<string, string[]> = {};
    const sorted = [...events].sort((a, b) => a.estimatedStart - b.estimatedStart);
    const TOLERANCE = 10; // Aumentata tolleranza per ridurre falsi positivi AI

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        
        if (a.isFlashback !== b.isFlashback) continue;

        const overlaps = (a.estimatedStart < b.estimatedEnd - TOLERANCE) && 
                         (a.estimatedEnd > b.estimatedStart + TOLERANCE);
        
        if (overlaps) {
          const sharedCharacters = (a.characters || []).filter(char => 
            (b.characters || []).includes(char)
          );
          
          const differentLocations = a.location?.toLowerCase().trim() !== b.location?.toLowerCase().trim();

          // CONDIZIONI DI CONFLITTO REALE:
          // A. Bilocazione: Lo stesso personaggio è in due posti diversi nello stesso momento
          const isBilocation = sharedCharacters.length > 0 && differentLocations;
          
          // B. Sovrapposizione Fisica: Due eventi Nello STESSO POSTO allo stesso momento (possibile errore di tempo o duplicazione)
          // Riduciamo la severità: deve esserci un'ampia sovrapposizione temporale (>20 min) per essere certi
          const overlapDuration = Math.min(a.estimatedEnd, b.estimatedEnd) - Math.max(a.estimatedStart, b.estimatedStart);
          const isPhysicalOverlap = !differentLocations && overlapDuration > 20;

          if (isBilocation || isPhysicalOverlap) {
            if (!conflictMap[a.id]) conflictMap[a.id] = [];
            if (!conflictMap[b.id]) conflictMap[b.id] = [];
            
            conflictMap[a.id].push(b.id);
            conflictMap[b.id].push(a.id);
          }
        }
      }
    }

    return conflictMap;
  }
};
