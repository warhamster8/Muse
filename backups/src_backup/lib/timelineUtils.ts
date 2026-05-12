import type { GlobalTimelineEvent } from '../types/timeline';
import { aiService, type AIConfig } from './aiService';

const SYSTEM_PROMPT = `Sei un esperto Cronologista Letterario. Il tuo compito è mappare la cronologia degli eventi nel testo usando una metrica di MINUTI RELATIVI dall'inizio della narrazione.

REGOLE DI IDENTITÀ:
- NON usare "Narratore". Identifica i personaggi per NOME.

MATEMATICA DEL TEMPO:
- L'inizio della storia (o della prima scena) è il MINUTO 0.
- Ogni evento successivo deve avere un "estimatedStart" espresso in minuti trascorsi da quel punto zero.
- SE RICEVI UN "OFFSET DI RIFERIMENTO", usalo come base minima di partenza.
- SPAZIATURA: Distanzia gli eventi logicamente (es. +15 o +30 minuti tra azioni consecutive).

STRUTTURA JSON (OBBLIGATORIA):
Restituisci SOLO un array JSON [ ] con questa struttura:
{
  "id": "string univoca",
  "title": "Titolo specifico (max 5 parole)",
  "summary": "Descrizione azione (max 15 parole)",
  "timeLabel": "Marcatore testuale (es. \"Lunedì mattina\" o \"Due ore dopo\")",
  "estimatedStart": 0, // Minuti RELATIVI dall'inizio (numero intero)
  "estimatedEnd": 60, // Fine evento (numero intero)
  "importance": "high" | "medium" | "low",
  "location": "Luogo specifico",
  "characters": ["Nome"],
  "isFlashback": boolean
}

Restituisci ESCLUSIVAMENTE l'array JSON, senza preamboli.`;

export const timelineUtils = {
  async extractEvents(text: string, aiConfig: AIConfig, contextMinutes?: number): Promise<{ events: GlobalTimelineEvent[], modelUsed: string }> {
    try {
      let fullResponse = '';
      const offsetInfo = contextMinutes !== undefined 
        ? `Questa scena inizia circa al minuto ${contextMinutes} della narrazione globale. Usa questo valore come base per calcolare estimatedStart.` 
        : 'Questa è la prima scena. Inizia al minuto 0.';

      // Smart Routing: Respect user provider if it's high-quality (DeepSeek/Gemini)
      const timelineConfig: AIConfig = { ...aiConfig };
      let modelUsed = aiConfig.model || 'Auto';

      if (aiConfig.provider === 'deepseek') {
        // DeepSeek is excellent for timeline extraction
        modelUsed = aiConfig.model?.includes('reasoner') ? 'DeepSeek R1' : 'DeepSeek V3';
      } else if (aiConfig.geminiKey) {
        timelineConfig.provider = 'gemini';
        timelineConfig.model = 'gemini-2.0-flash'; // Standardized model name
        modelUsed = 'Gemini 2.0 Flash';
      } else if (aiConfig.groqKey) {
        timelineConfig.provider = 'groq';
        timelineConfig.model = 'llama-3.3-70b-versatile';
        modelUsed = 'Llama 3.3 70B';
      } else {
        // Ultimate fallback to whatever is configured in aiConfig
        modelUsed = aiConfig.model || aiConfig.provider;
      }

      await aiService.streamChat(
        timelineConfig,
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `${offsetInfo}\n\nAnalizza questa scena:\n\n${text}` }
        ],
        (chunk) => {
          fullResponse += chunk;
        }
      );

      // Robust JSON Extraction
      let events: any[] = [];
      try {
        const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          events = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: try to find the last [ and everything after it, then try to fix it
          const lastBracket = fullResponse.lastIndexOf('[');
          if (lastBracket !== -1) {
             let partial = fullResponse.substring(lastBracket);
             // If it doesn't end with ], try to close it
             if (!partial.trim().endsWith(']')) {
                partial = partial.trim() + (partial.includes('}') ? ']' : '}]');
             }
             try {
                events = JSON.parse(partial);
             } catch (e) {
                throw new Error('Impossibile recuperare JSON dalla risposta parziale');
             }
          } else {
            throw new Error('Nessun JSON valido trovato nella risposta AI');
          }
        }
      } catch (e) {
        console.warn('[TIMELINE] JSON Parse failed, trying aggressive recovery...');
        // Aggressive recovery: find all { } blocks and parse them
        const objects: any[] = [];
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
                  if (obj.title && obj.estimatedStart !== undefined) {
                    objects.push(obj);
                  }
                } catch (err) {}
                start = -1;
              }
            }
          }
        }
        if (objects.length > 0) events = objects;
        else throw new Error('Nessun evento valido trovato nella risposta AI');
      }
      
      if (!Array.isArray(events)) {
        throw new Error('La risposta AI non è un array di eventi');
      }
      
      const mappedEvents = events.map((e: any, i: number) => ({
        ...e,
        id: `evt-${i}-${Math.random().toString(36).substr(2, 9)}`
      }));

      return { events: mappedEvents, modelUsed };
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
