import React from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  Lightbulb, 
  Zap,
  RefreshCw,
  PenLine,
  Wand2,
  BookOpen,
  Languages,
  Compass,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { groqService } from '../lib/groq';
import { useStore } from '../store/useStore';
import { useNarrative } from '../hooks/useNarrative';
import { useToast } from './Toast';

type SidekickTab = 'revision' | 'braindump' | 'transformer' | 'lexicon';

// Simple word-level diffing utility
type DiffPart = { value: string; added?: boolean; removed?: boolean };

function computeDiff(oldStr: string, newStr: string) {
  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);
  
  // Basic LCS-style word matching for split view
  // We'll mark words that don't exist in the other string
  const oldParts: DiffPart[] = oldWords.map(word => ({
    value: word,
    removed: !!(word.trim() && !newStr.includes(word.trim()))
  }));
  
  const newParts: DiffPart[] = newWords.map(word => ({
    value: word,
    added: !!(word.trim() && !oldStr.includes(word.trim()))
  }));

  return { oldParts, newParts };
}

// Renders structured AI output: lines starting with ❌ get red, ✅ green, ## become headers, etc.
const StructuredOutput: React.FC<{ 
  text: string; 
  onApply?: (original: string, suggestion: string) => void;
  onReject?: (original: string) => void;
  appliedSuggestions?: string[];
  rejectedSuggestions?: string[];
}> = ({ text, onApply, onReject, appliedSuggestions, rejectedSuggestions }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentSuggestion: { original?: string; suggestion?: string; reason?: string; category?: string } | null = null;

  const renderSuggestionCard = (sug: typeof currentSuggestion, key: string | number, isPending = false) => {
    if (!sug || !sug.original) return null;
    const { original, suggestion, reason, category } = sug;
    
    if (!isPending && (appliedSuggestions?.includes(original) || rejectedSuggestions?.includes(original))) {
      return null;
    }

    const { oldParts, newParts } = suggestion ? computeDiff(original, suggestion) : { oldParts: [{ value: original }], newParts: [] };

    return (
      <div key={key} className={cn(
        "bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden mb-4 shadow-lg group transition-all duration-500",
        isPending ? "opacity-70 border-blue-500/30 ring-1 ring-blue-500/10" : "animate-in fade-in zoom-in-95"
      )}>
        <div className="bg-slate-700/50 px-3 py-1.5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {category || 'Suggerimento'}
            </span>
            {isPending && <RefreshCw className="w-2.5 h-2.5 animate-spin text-blue-400" />}
          </div>
          {!isPending && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onReject?.(original)}
                className="text-[10px] bg-slate-600 hover:bg-red-900/40 text-slate-300 hover:text-red-200 px-2 py-0.5 rounded transition-all flex items-center gap-1 border border-transparent hover:border-red-500/30"
              >
                <X className="w-2.5 h-2.5" /> Ignora
              </button>
              {suggestion && (
                <button 
                  onClick={() => onApply?.(original, suggestion)}
                  className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded transition-all flex items-center gap-1 shadow-sm shadow-blue-900/20"
                >
                  <Zap className="w-2.5 h-2.5" /> Applica
                </button>
              )}
            </div>
          )}
        </div>
        <div className="p-3 space-y-2">
          <div className="bg-red-950/20 border border-red-500/10 rounded-lg px-3 py-2 text-xs text-red-300/80 opacity-90 leading-relaxed">
            {oldParts.map((part, i) => (
              <span key={i} className={cn(part.removed && "bg-red-500/30 text-red-100 line-through px-0.5 rounded")}>
                {part.value}
              </span>
            ))}
          </div>
          {suggestion ? (
            <div 
              onClick={() => !isPending && suggestion && onApply?.(original, suggestion)}
              className={cn(
                "bg-green-600/10 border border-green-500/20 rounded-lg px-3 py-2 text-xs text-green-300 leading-relaxed transition-all",
                !isPending && "hover:border-green-500/40 hover:bg-green-600/20 cursor-pointer"
              )}
            >
              {newParts.map((part, i) => (
                <span key={i} className={cn(part.added && "bg-green-500/30 text-white font-bold px-0.5 rounded shadow-sm")}>
                  {part.value}
                </span>
              ))}
            </div>
          ) : isPending && (
            <div className="h-8 flex items-center px-3 bg-slate-900/40 rounded-lg border border-dashed border-slate-700 animate-pulse">
               <span className="text-[10px] text-slate-500 italic">L'IA sta elaborando la correzione...</span>
            </div>
          )}
          {reason && (
            <p className="text-[10px] text-slate-400 italic px-1 flex items-start gap-1.5 animate-in slide-in-from-left-1">
              <span className="text-blue-400">💡</span>
              <span>{reason}</span>
            </p>
          )}
        </div>
      </div>
    );
  };

  const flushCurrent = (keyPrefix: string | number) => {
    if (currentSuggestion) {
      if (currentSuggestion.original && currentSuggestion.suggestion) {
        elements.push(renderSuggestionCard(currentSuggestion, `done-${keyPrefix}`));
        currentSuggestion = null;
      }
    }
  };

  const renderChips = (line: string, colorClass: string) => {
    const list = line.split(':')[1]?.split(',').map(w => w.trim()).filter(w => w) || [];
    return (
      <div key={line} className="flex flex-wrap gap-1.5 py-1 px-1 mb-4">
        {list.map((word, idx) => (
          <span 
            key={idx} 
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-default hover:scale-105",
              colorClass
            )}
          >
            {word}
          </span>
        ))}
      </div>
    );
  };

  lines.forEach((line, i) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    if (/^(?:\d+\.\s*)?❌/.test(trimmedLine)) {
      flushCurrent(i);
      currentSuggestion = { 
        original: trimmedLine.replace(/^(?:\d+\.\s*)?❌\s*/, '').replace(/^["“”«»]+|["“”«»]+$/g, '').trim() 
      };
    } else if (/^(?:\d+\.\s*)?✅/.test(trimmedLine)) {
      if (currentSuggestion) {
        currentSuggestion.suggestion = trimmedLine.replace(/^(?:\d+\.\s*)?✅\s*/, '').replace(/^["“”«»]+|["“”«»]+$/g, '').trim();
      }
    } else if (/^(?:\d+\.\s*)?💡/.test(trimmedLine)) {
      if (currentSuggestion) {
        currentSuggestion.reason = trimmedLine.replace(/^(?:\d+\.\s*)?💡\s*/, '').trim();
      } else {
        elements.push(
          <p key={i} className="text-[10px] text-slate-400 italic px-1 bg-slate-800/30 p-2 rounded-lg mb-4 border-l-2 border-blue-500/30">
            {trimmedLine.replace(/^💡\s*/, '')}
          </p>
        );
      }
    } else if (/^(?:\d+\.\s*)?🏷️/.test(trimmedLine)) {
      if (currentSuggestion) {
        currentSuggestion.category = trimmedLine.replace(/^(?:\d+\.\s*)?🏷️\s*/, '').trim();
      }
    } else if (trimmedLine.startsWith('S:')) {
      flushCurrent(i);
      elements.push(renderChips(trimmedLine, "bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20"));
    } else if (trimmedLine.startsWith('A:')) {
      flushCurrent(i);
      elements.push(renderChips(trimmedLine, "bg-slate-700/50 text-slate-400 border-slate-600/50 hover:bg-slate-700"));
    } else if (trimmedLine.startsWith('M:')) {
      flushCurrent(i);
      elements.push(
        <div key={i} className="bg-blue-900/10 border border-blue-500/10 rounded-xl p-3 mb-4">
          <p className="text-xs text-blue-100 font-medium leading-relaxed">{trimmedLine.replace(/^M:\s*/, '')}</p>
        </div>
      );
    } else if (trimmedLine.startsWith('##')) {
      flushCurrent(i);
      elements.push(
        <h3 key={i} className="text-[10px] uppercase tracking-widest font-bold text-blue-400 pt-4 pb-2 border-b border-blue-500/20 mb-3">
          {trimmedLine.replace(/^#+\s*/, '')}
        </h3>
      );
    } else if (trimmedLine) {
      if (!currentSuggestion) {
        elements.push(<p key={i} className="text-slate-300 text-xs px-1 leading-relaxed mb-2">{trimmedLine}</p>);
      }
    }
  });

  if (currentSuggestion) {
    elements.push(renderSuggestionCard(currentSuggestion, "pending-last", true));
  }

  return <div className="space-y-1">{elements}</div>;
};

export const AISidekick: React.FC = () => {
  const { 
    currentSceneContent: content, 
    activeSceneId, 
    setCurrentSceneContent,
    ignoredSuggestions,
    addIgnoredSuggestion,
    lastAnalyzedPhrase,
    setLastAnalyzedPhrase,
    sceneAnalysis,
    setSceneAnalysis
  } = useStore();
  const { updateSceneContent } = useNarrative();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = React.useState<SidekickTab>('revision');
  
  const analysis = React.useMemo(() => 
    activeSceneId ? sceneAnalysis[activeSceneId] || '' : ''
  , [sceneAnalysis, activeSceneId]);

  const setAnalysis = (val: string | ((prev: string) => string)) => {
    if (!activeSceneId) return;
    const current = sceneAnalysis[activeSceneId] || '';
    const next = typeof val === 'function' ? val(current) : val;
    setSceneAnalysis(activeSceneId, next);
  };
  const [appliedSuggestions, setAppliedSuggestions] = React.useState<string[]>([]);
  const [braindumpInput, setBraindumpInput] = React.useState<string>('');
  const [lexiconInput, setLexiconInput] = React.useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const sceneIgnoredSuggestions = React.useMemo(() => 
    activeSceneId ? (ignoredSuggestions || {})[activeSceneId] || [] : []
  , [ignoredSuggestions, activeSceneId]);

  const handleReject = (originalText: string) => {
    if (activeSceneId) {
       addIgnoredSuggestion(activeSceneId, originalText);
       setLastAnalyzedPhrase(activeSceneId, originalText);
    }
  };

  const applySuggestion = async (originalText: string, suggestion: string) => {
    if (!activeSceneId || !content) return;

    const buildMapping = (html: string) => {
      const textMap: number[] = [];
      const charLens: number[] = [];
      let textStr = '';
      let inTag = false;
      let i = 0;
      while (i < html.length) {
          if (html[i] === '<') { inTag = true; i++; continue; }
          if (html[i] === '>') { inTag = false; i++; continue; }
          if (inTag) { i++; continue; }
          
          if (html[i] === '&') {
              const end = html.indexOf(';', i);
              if (end !== -1 && end - i < 10) {
                  const entity = html.substring(i, end + 1);
                  textMap.push(i);
                  charLens.push(entity.length);
                  if (entity === '&nbsp;') textStr += ' ';
                  else if (entity === '&lt;') textStr += '<';
                  else if (entity === '&gt;') textStr += '>';
                  else if (entity === '&amp;') textStr += '&';
                  else textStr += ' '; 
                  i = end + 1;
                  continue;
              }
          }
          
          textMap.push(i);
          charLens.push(1);
          textStr += html[i];
          i++;
      }
      return { textStr, textMap, charLens };
    };

    const { textStr, textMap, charLens } = buildMapping(content);

    const normalizeIt = (str: string) => str
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/E['’]/g, 'È')
      .replace(/\u00A0/g, ' ')
      .trim();

    const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const normalizedOriginal = normalizeIt(originalText);
    const searchOriginal = removeAccents(normalizedOriginal);
    const searchStrHtml = removeAccents(textStr);

    const parts = searchOriginal.split(/\.\.\.|…/);
    const gapPattern = '[^a-zA-Z0-9]*';
    
    let regexStr = parts.map(part => {
        const words = part.match(/[a-zA-Z0-9]+/g) || [];
        return words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(gapPattern);
    }).filter(p => p).join('(?:.|\\n){0,150}?');
    
    if (!regexStr) {
       addToast('Impossibile elaborare il testo originale.', 'error');
       return;
    }

    let regex = new RegExp(regexStr, 'i');
    let match = searchStrHtml.match(regex);

    if (!match) {
        const allWords = searchOriginal.match(/[a-zA-Z0-9]+/g) || [];
        if (allWords.length > 5) {
            const first2 = allWords.slice(0, 2).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(gapPattern);
            const last2 = allWords.slice(-2).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(gapPattern);
            const maxLen = Math.max(100, normalizedOriginal.length + 50);
            regexStr = first2 + `(?:.|\\n){0,${maxLen}}?` + last2;
            regex = new RegExp(regexStr, 'i');
            match = searchStrHtml.match(regex);
        }
    }

    if (match) {
      const textStart = match.index!;
      const textEnd = textStart + match[0].length - 1;
      
      const htmlStart = textMap[textStart];
      const htmlEnd = textMap[textEnd] + charLens[textEnd];
      
      const newContent = content.slice(0, htmlStart) + suggestion + content.slice(htmlEnd);
      
      setCurrentSceneContent(newContent);
      await updateSceneContent(activeSceneId, newContent);
      setAppliedSuggestions(prev => [...prev, originalText]);
      setLastAnalyzedPhrase(activeSceneId, suggestion);
      addToast('Modifica applicata con successo', 'success');
    } else {
      console.warn("Could not find original text.", searchStrHtml, "Regex:", regexStr);
      addToast('Impossibile trovare il testo originale, modificalo manualmente', 'error');
    }
  };

  const getPlainText = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const plainText = getPlainText(content || '');

  const runDraftRevision = async () => {
    if (!plainText || plainText.length < 30) return;
    setIsAnalyzing(true);
    setAnalysis('');
    setAppliedSuggestions([]);

    let textToAnalyze = plainText;
    const lastPhrase = activeSceneId ? lastAnalyzedPhrase[activeSceneId] : null;
    let isContinuation = false;

    if (lastPhrase) {
      let index = plainText.indexOf(lastPhrase);
      
      if (index === -1) {
        const pattern = lastPhrase.trim().split(/\s+/).slice(-10).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
        try {
          const regex = new RegExp(pattern, 'i');
          const match = plainText.match(regex);
          if (match) index = match.index!;
        } catch(e) {}
      }

      if (index !== -1) {
        const startIndex = Math.max(0, index + lastPhrase.length);
        if (startIndex < plainText.length - 20) {
           textToAnalyze = plainText.substring(startIndex);
           isContinuation = true;
        }
      }
    }

    try {
      const systemPrompt = `Sei un editor letterario senior esperto in narrativa italiana.
Revisiona la bozza fornita con precisione.

REGOLE MANDATORIE:
1. Inizia IMMEDIATAMENTE con "## Analisi Revisione".
2. Per ogni problema, usa RIGOROSAMENTE questo formato:
   ❌ [COPIA ESATTA della frase dal testo]
   ✅ [tua versione migliorata]
   🏷️ [Categoria: Verbo, Avverbio, Ritmo, ecc.]
   💡 [spiegazione ultra-breve]

3. NON scrivere introduzioni, saluti o commenti fuori dai tag.
4. Identifica max 5-7 interventi prioritari.
5. Concludi con "## Note Generali" (2 righe di sintesi).

OBIETTIVI:
- Rendere il testo dinamico e viscerale.
- Sostituire verbi deboli ("c'era", "aveva") con verbi d'azione.
- Tagliare avverbi inutili e ridondanze.

${isContinuation ? "NOTA: Stai continuando la revisione. Non ripetere suggerimenti già dati." : ""}

LINGUA: Italiano.`;

      await groqService.streamChatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Revisiona questa bozza${isContinuation ? " (riprendendo da dove eri rimasto)" : ""}:\n\n${textToAnalyze}` }
        ],
        'llama-3.3-70b-versatile',
        (chunk) => setAnalysis(prev => prev + chunk)
      );
    } catch (err) {
      setAnalysis('❌ Errore di connessione al servizio AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runBraindump = async () => {
    if (!braindumpInput.trim()) return;
    setIsAnalyzing(true);
    setAnalysis('');
    try {
      const systemPrompt = `Sei un assistente alla scrittura creativa. L'utente ha inserito dei pensieri sparsi (Braindump).
Il tuo compito è trasformarli in suggestioni narrative concrete e azionabili.

CONTESTO SCENA ATTUALE:
${plainText ? plainText.slice(0, 600) : 'Nessuna scena attiva.'}

STRUTTURA RISPOSTA:
## Interpretazione
(2 righe: cosa hai capito dal braindump)

## 3 Direzioni Narrative
Per ognuna:
- **Direzione [N]:** [titolo evocativo]
  Sviluppo: [2-3 frasi concrete di come potrebbe svilupparsi la scena]
  Incipit suggerito: [una frase di apertura pronta all'uso]

## Dettagli Sensoriali
💡 [3 dettagli sensoriali specifici da integrare]

Rispondi in italiano. Sii concreto e originale.`;

      await groqService.streamChatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Braindump: ${braindumpInput}` }
        ],
        'llama-3.3-70b-versatile',
        (chunk) => setAnalysis(prev => prev + chunk)
      );
    } catch (err) {
      setAnalysis('❌ Errore durante l\'elaborazione del braindump.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stylePrompts: Record<string, string> = {
    visceral: `Sei un editor esperto di narrativa corporea e sensoriale.
Riscrivi il testo dato usando ESCLUSIVAMENTE sensazioni fisiche, tattili, olfattive, gustative, propriocettive.
REGOLE:
- Ogni emozione diventa una reazione del corpo (tachicardia, tensione muscolare, sapore amaro in bocca).
- Usa verbi fisici potenti: stringere, bruciare, contrarsi, esplodere.
- Zero astrazioni. Solo carne, sudore, respiro.
- Mantieni la trama, trasforma SOLO il modo di raccontare.
Riscrivi in italiano. Restituisci SOLO il testo riscritto, senza commenti.`,

    atmospheric: `Sei un maestro del "worldbuilding" sensoriale.
Riscrivi il testo dato trasformando l'ambiente in un personaggio vivo e carico di tensione.
REGOLE:
- La luce, l'ombra, il suono, il silenzio, il clima devono riflettere lo stato emotivo della scena.
- Usa personificazioni dell'ambiente ("il vento portava la sua inquietudine").
- Dettagli architettonici, naturali o urbani come metafore implicite.
- Alterna descrizione rapida e immersione lenta per gestire il ritmo.
Riscrivi in italiano. Restituisci SOLO il testo riscritto.`,

    metaphorical: `Sei un poeta-narratore con un registro fortemente simbolico.
Riscrivi il testo dado usando metafore estese, similitudini originali e immagini archetipiche.
REGOLE:
- Ogni concetto emotivo ha una sua immagine concreta e originale (non cliché).
- Usa almeno 2 similitudini costruite su elementi insoliti (non "come il vento", ma elementi specifici e inattesi).
- Il simbolismo deve emergere naturalmente, non forzatamente.
- Mantieni la leggibilità: poesia al servizio della storia.
Riscrivi in italiano. Restituisci SOLO il testo riscritto.`,

    psychological: `Sei uno scrittore di narrativa psicologica e flusso di coscienza.
Riscrivi il testo dato portando il lettore DENTRO la mente del personaggio.
REGOLE:
- Usa il monologo interiore in prima o terza persona ravvicinata.
- Alterna pensieri lucidi a pensieri frammentati e irrazionali.
- Mostra il meccanismo di difesa, il dubbio, la razionalizzazione.
- La voce interna può contraddire le azioni esterne.
- Usa la punteggiatura per creare il ritmo del pensiero (ellissi, trattini).
Riscrivi in italiano. Restituisci SOLO il testo riscritto.`,
  };

  const runStyleTransform = async (style: string) => {
    if (!plainText || plainText.length < 10) return;
    setIsAnalyzing(true);
    setAnalysis('');
    try {
      await groqService.streamChatCompletion(
        [
          { role: 'system', content: stylePrompts[style] },
          { role: 'user', content: `Riscrivi questo:\n\n${plainText}` }
        ],
        'llama-3.3-70b-versatile',
        (chunk) => setAnalysis(prev => prev + chunk)
      );
    } catch (err) {
      setAnalysis('❌ Errore di connessione al servizio AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runLexiconTool = async (mode: 'synonyms' | 'metaphors') => {
    if (!lexiconInput.trim()) return;
    setIsAnalyzing(true);
    setAnalysis('');
    try {
      const prompts = {
        synonyms: `Sei un esperto di semantica e lessicografia italiana. 
L'utente cerca sinonimi e contrari per la parola: "${lexiconInput}".

REGOLE DI FORMATTAZIONE:
1. Usa "## [Categoria]" per i titoli delle sezioni.
2. Per i sinonimi, usa "S: [lista parole separate da virgola]". Esempio: "S: timore, apprensione, soggezione"
3. Per i contrari, usa "A: [lista parole separate da virgola]".
4. Per i termini rari/nobilitanti, usa "💎 [Parola]: [breve spiegazione]".
5. Non usare elenchi puntati classici, usa solo i marker sopra.

Rispondi in italiano con un tono professionale ma d'ispirazione.`,
        metaphors: `Sei un consulente creativo per scrittori di narrativa.
L'utente cerca immagini evocative per il concetto: "${lexiconInput}".

REGOLE DI FORMATTAZIONE:
1. Per ogni metafora, usa questo blocco:
   M: [Immagine metaforica/similitudine]
   💡 [breve spiegazione del sotto-testo emotivo]
2. Genera esattamente 5 metafore originali (evita i cliché).
3. Le immagini devono essere legate alla sensazione fisica, all'ambiente o ad elementi naturali.

Rispondi in italiano.`
      };

      await groqService.streamChatCompletion(
        [
          { role: 'system', content: prompts[mode] },
          { role: 'user', content: `Parola/Concetto: ${lexiconInput}` }
        ],
        'llama-3.3-70b-versatile',
        (chunk) => setAnalysis(prev => prev + chunk)
      );
    } catch (err) {
      setAnalysis(`❌ Errore durante la ricerca nel lessico.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs: { id: SidekickTab; label: string; icon: React.ReactNode }[] = [
    { id: 'revision', label: 'Revisione', icon: <PenLine className="w-3 h-3" /> },
    { id: 'braindump', label: 'Braindump', icon: <Lightbulb className="w-3 h-3" /> },
    { id: 'transformer', label: 'Stile', icon: <Wand2 className="w-3 h-3" /> },
    { id: 'lexicon', label: 'Lessico', icon: <Languages className="w-3 h-3" /> },
  ];

  return (
    <div className="w-80 h-screen glass border-l border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-slate-200">AI Sidekick</h2>
        </div>
        {isAnalyzing && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
      </div>

      <div className="flex p-2 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 text-[10px] uppercase tracking-tighter py-2 rounded transition-all",
              activeTab === tab.id ? "bg-slate-700 text-blue-400" : "text-slate-500 hover:text-slate-300"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'revision' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Correzione Bozza</span>
              <div className="flex items-center gap-2">
                {activeSceneId && lastAnalyzedPhrase[activeSceneId] && (
                  <button
                    onClick={() => {
                      setLastAnalyzedPhrase(activeSceneId, '');
                      setSceneAnalysis(activeSceneId, '');
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 px-2 py-1"
                    title="Ricomincia dall'inizio del testo"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Ripristina
                  </button>
                )}
                <button
                  onClick={runDraftRevision}
                  disabled={isAnalyzing || plainText.length < 30}
                  className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3 py-1.5 rounded-lg text-white flex items-center space-x-1 transition-all"
                >
                  <Zap className="w-3 h-3" />
                  <span>{activeSceneId && lastAnalyzedPhrase[activeSceneId] ? 'Continua' : 'Analizza'}</span>
                </button>
              </div>
            </div>

            <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded-lg flex items-start space-x-3">
              <BookOpen className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                L'AI proporrà modifiche <span className="text-blue-400 font-semibold">prima/dopo</span> per rendere il testo più scorrevole e dinamico.
              </p>
            </div>

            {plainText.length > 0 && plainText.length < 30 && (
              <p className="text-xs text-yellow-500/80 text-center italic">Scrivi almeno qualche frase nella scena per avviare la revisione.</p>
            )}

            {analysis ? (
              <div className="animate-in slide-in-from-bottom-2">
                <StructuredOutput 
                  text={analysis} 
                  onApply={applySuggestion} 
                  onReject={handleReject}
                  appliedSuggestions={appliedSuggestions}
                  rejectedSuggestions={sceneIgnoredSuggestions}
                />
              </div>
            ) : (
              !isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-36 text-slate-600 space-y-2">
                  <AlertTriangle className="w-8 h-8 opacity-20" />
                  <p className="text-xs text-center">Seleziona una scena e premi Analizza<br/>per ricevere proposte di revisione precise.</p>
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'braindump' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">Scarica qui i tuoi pensieri. L'IA li trasformerà in direzioni narrative concrete.</p>

            <textarea
              className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
              placeholder="Es: la stanza puzza di fumo, lui è nervoso, fuori piove da ore, qualcosa non torna..."
              value={braindumpInput}
              onChange={(e) => setBraindumpInput(e.target.value)}
            />

            <button
              onClick={runBraindump}
              disabled={isAnalyzing || !braindumpInput.trim()}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Zap className="w-3 h-3" />
              Espandi Idee
            </button>

            {analysis && (
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 animate-in slide-in-from-bottom-2">
                <StructuredOutput text={analysis} />
              </div>
            )}

            <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded-lg flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0" />
              <p className="text-xs text-slate-300 italic opacity-70">Tip: Più dettagli sensoriali aggiungi, più l'IA sarà precisa.</p>
            </div>
          </div>
        )}

        {activeTab === 'transformer' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">Riscrivi la tua scena in uno stile narrativo specifico.</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'visceral', label: '🩸 Viscerale', desc: 'Sensazioni fisiche' },
                { key: 'atmospheric', label: '🌫️ Atmosferico', desc: 'Ambiente vivo' },
                { key: 'metaphorical', label: '🌀 Metaforico', desc: 'Simboli e immagini' },
                { key: 'psychological', label: '🧠 Psicologico', desc: 'Flusso di coscienza' },
              ].map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => runStyleTransform(key)}
                  disabled={isAnalyzing || plainText.length < 10}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 p-3 rounded-lg text-left border border-slate-700 hover:border-blue-500/50 transition-all group"
                >
                  <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{desc}</div>
                </button>
              ))}
            </div>

            {analysis && (
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 animate-in fade-in">
                <StructuredOutput text={analysis} />
              </div>
            )}

            {!analysis && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-24 text-slate-600 space-y-2">
                <Wand2 className="w-8 h-8 opacity-20" />
                <p className="text-xs text-center">Scegli uno stile per riscrivere la scena attiva.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'lexicon' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">Trova la parola perfetta o un'immagine indimenticabile.</p>

            <div className="relative">
              <input
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 pl-10 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                placeholder="Inserisci una parola o un concetto..."
                value={lexiconInput}
                onChange={(e) => setLexiconInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runLexiconTool('synonyms')}
              />
              <Compass className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => runLexiconTool('synonyms')}
                disabled={isAnalyzing || !lexiconInput.trim()}
                className="py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-xs font-bold transition-all border border-slate-700"
              >
                Sinonimi
              </button>
              <button
                onClick={() => runLexiconTool('metaphors')}
                disabled={isAnalyzing || !lexiconInput.trim()}
                className="py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-xs font-bold transition-all"
              >
                Metafore
              </button>
            </div>

            {analysis && (
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 animate-in slide-in-from-bottom-2">
                <StructuredOutput text={analysis} />
              </div>
            )}
            
            <div className="bg-blue-900/5 border border-blue-500/10 p-3 rounded-lg flex items-center space-x-3 mt-4">
              <Languages className="w-4 h-4 text-blue-400 opacity-50" />
              <p className="text-[10px] text-slate-500 italic">Dica: il vocabolario è lo scalpello dello scrittore.</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-700 space-y-3">
        <div className="flex items-center space-x-2 text-[10px] text-slate-500 uppercase font-bold">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Llama 3 Connected</span>
        </div>
      </div>
    </div>
  );
};
