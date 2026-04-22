import type { GlobalTimelineEvent } from '../types/timeline';
import { aiService, type AIConfig } from './aiService';



const SYSTEM_PROMPT = `Sei un esperto Cronologista Letterario e Analista Narrativo. Il tuo compito è mappare la cronologia OGGETTIVA degli eventi nel testo.

REGOLE DI IDENTITÀ:
- NON usare mai la parola "Narratore" o "Autore". Identifica sempre il personaggio per NOME PROPRIO (es. "Marco", "Elena"). Se il nome non è presente, usa una descrizione specifica (es. "Il Chirurgo", "La Madre").

REGOLE TEMPORALI (MOLTO IMPORTANTI):
- Ogni evento deve avere un valore "estimatedStart" coerente con la cronologia del libro.
- SCALA: Usa i minuti. 1 Giorno = 1440 unità.
- Se il testo dice "Un anno dopo", il valore deve aumentare di circa 525.600 unità rispetto all'evento precedente.
- Se il testo dice "Pochi mesi dopo", aumenta di circa 100.000 unità.
- Se il testo riporta una data specifica (es. "10 Novembre"), cerca di ancorarla logicamente agli altri eventi.
- COERENZA: Un evento etichettato "1 anno dopo" NON può avere un estimatedStart inferiore a un evento precedente.

STRUTTURA JSON (Uno per ogni evento):
1. "title": Titolo specifico (evita generalità).
2. "summary": Cosa accade realmente (max 15 parole).
3. "timeLabel": Testo esatto del marcatore temporale (es. "10 Novembre 2026, Mattina").
4. "estimatedStart": Numero intero (minuti progressivi).
5. "estimatedEnd": estimatedStart + durata stimata (es. +30 per una conversazione).
6. "importance": "high" (svolta), "medium" (azione), "low" (riflessione/dettaglio).
7. "location": Luogo fisico specifico.
8. "characters": Array di nomi (es. ["Marco", "Clara"]).
9. "isFlashback": true solo se è un salto nel passato rispetto alla scena corrente.

PROCESSO DI PENSIERO (Internal):
Prima di generare il JSON, identifica mentalmente:
- Chi è il protagonista della scena? 
- Quali sono i marcatori temporali espliciti?
- Qual è l'ordine logico corretto?

Restituisci ESCLUSIVAMENTE l'array JSON [ { ... }, { ... } ].`;


export const timelineUtils = {
  async extractEvents(text: string, aiConfig: AIConfig): Promise<GlobalTimelineEvent[]> {
    try {
      let fullResponse = '';
      await aiService.streamChat(
        aiConfig,
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analizza questo testo ed estrai la timeline in formato JSON:\n\n${text}` }
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
    const TOLERANCE = 5; // 5 minuti di tolleranza per piccole discrepanze IA

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        
        // 1. Flashback vs Presente: Generalmente non sono conflitti cronologici lineari
        if (a.isFlashback !== b.isFlashback) continue;

        // 2. Controllo sovrapposizione temporale con buffer di tolleranza
        const overlaps = (a.estimatedStart < b.estimatedEnd - TOLERANCE) && 
                         (a.estimatedEnd > b.estimatedStart + TOLERANCE);
        
        if (overlaps) {
          // 3. Logica dei Personaggi (Bilancia)
          const sharedCharacters = (a.characters || []).filter(char => 
            (b.characters || []).includes(char)
          );
          
          const differentLocations = a.location !== b.location;

          // CONDIZIONI DI CONFLITTO REALE:
          // A. Bilocazione: Lo stesso personaggio è in due posti diversi nello stesso momento
          const isBilocation = sharedCharacters.length > 0 && differentLocations;
          
          // B. Sovrapposizione Fisica: Due eventi nello stesso posto allo stesso momento (possibile errore di duplicazione)
          const isPhysicalOverlap = !differentLocations;

          // C. Azione Parallela Sospetta: Scene diverse nello stesso momento ma zero personaggi in comune
          // Questo potrebbe non essere un errore, ma lo segnaliamo se la sovrapposizione è quasi totale
          const isSuspiciousParallel = differentLocations && sharedCharacters.length === 0;

          if (isBilocation || isPhysicalOverlap || isSuspiciousParallel) {
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
