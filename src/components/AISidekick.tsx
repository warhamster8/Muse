import React from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  Lightbulb, 
  Zap,
  RefreshCw,
  PenLine,
  Wand2,
  BookOpen
} from 'lucide-react';
import { cn } from '../lib/utils';
import { groqService } from '../lib/groq';
import { useStore } from '../store/useStore';
import { useNarrative } from '../hooks/useNarrative';
import { useToast } from './Toast';

type SidekickTab = 'revision' | 'braindump' | 'transformer';

// Renders structured AI output: lines starting with ❌ get red, ✅ green, ## become headers, etc.
const StructuredOutput: React.FC<{ 
  text: string; 
  onApply?: (original: string, suggestion: string) => void 
}> = ({ text, onApply }) => {
  const lines = text.split('\n');
  
  // Group ❌, ✅, 🏷️, 💡 together into cards
  const elements: React.ReactNode[] = [];
  let currentSuggestion: { original?: string; suggestion?: string; reason?: string; category?: string } | null = null;

  const flushSuggestion = (key: number) => {
    if (currentSuggestion && currentSuggestion.original && currentSuggestion.suggestion) {
      const { original, suggestion, reason, category } = currentSuggestion;
      elements.push(
        <div key={`sug-${key}`} className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden mb-4 shadow-lg group">
          {category && (
            <div className="bg-slate-700/50 px-3 py-1 flex items-center justify-between border-b border-slate-700">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                {category}
              </span>
              <button 
                onClick={() => onApply?.(original, suggestion)}
                className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded transition-colors flex items-center gap-1"
              >
                <Zap className="w-2.5 h-2.5" />
                Applica
              </button>
            </div>
          )}
          <div className="p-3 space-y-2">
            <div 
              className="bg-red-950/20 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-300 line-through opacity-70 cursor-not-allowed"
            >
              {original}
            </div>
            <div 
              onClick={() => onApply?.(original, suggestion)}
              className="bg-green-600/10 border border-green-500/30 hover:border-green-500/60 rounded-lg px-3 py-2 text-xs text-green-300 cursor-pointer transition-all hover:bg-green-600/20 active:scale-[0.98] group-hover:ring-1 ring-green-500/50"
            >
              {suggestion}
            </div>
            {reason && (
              <p className="text-[10px] text-slate-400 italic px-1">
                💡 {reason}
              </p>
            )}
          </div>
        </div>
      );
      currentSuggestion = null;
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith('❌')) {
      flushSuggestion(i);
      currentSuggestion = { original: line.replace(/^❌\s*/, '').trim() };
    } else if (line.startsWith('✅')) {
      if (currentSuggestion) currentSuggestion.suggestion = line.replace(/^✅\s*/, '').trim();
    } else if (line.startsWith('💡')) {
      if (currentSuggestion) currentSuggestion.reason = line.replace(/^💡\s*/, '').trim();
    } else if (line.startsWith('🏷️')) {
      if (currentSuggestion) currentSuggestion.category = line.replace(/^🏷️\s*/, '').trim();
    } else if (line.startsWith('##')) {
      flushSuggestion(i);
      elements.push(
        <h3 key={i} className="text-[10px] uppercase tracking-widest font-bold text-blue-400 pt-4 pb-2 border-b border-blue-500/20 mb-3">
          {line.replace(/^#+\s*/, '')}
        </h3>
      );
    } else if (line.trim()) {
      flushSuggestion(i);
      elements.push(<p key={i} className="text-slate-300 text-xs px-1 leading-relaxed">{line}</p>);
    }
  });
  flushSuggestion(lines.length);

  return <div className="space-y-1">{elements}</div>;
};

export const AISidekick: React.FC = () => {
  const { currentSceneContent: content, activeSceneId, setCurrentSceneContent } = useStore();
  const { updateSceneContent } = useNarrative();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = React.useState<SidekickTab>('revision');
  const [analysis, setAnalysis] = React.useState<string>('');
  const [braindumpInput, setBraindumpInput] = React.useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const applySuggestion = async (original: string, suggestion: string) => {
    if (!activeSceneId || !content) return;

    // Robust search and replace that ignores HTML tags between words
    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const words = escapedOriginal.split(/\s+/).filter(w => w.length > 0);
    
    // Create pattern that matches words separated by any amount of whitespace OR html tags
    const pattern = words.join('\\s*(?:<[^>]+>\\s*)*');
    const regex = new RegExp(pattern, 'i'); // Case insensitive for better match
    
    const newContent = content.replace(regex, suggestion);
    
    if (newContent !== content) {
      setCurrentSceneContent(newContent);
      await updateSceneContent(activeSceneId, newContent);
      addToast('Modifica applicata con successo', 'success');
    } else {
      console.warn("Could not find original text in content for replacement:", original);
      addToast('Impossibile trovare il testo originale nella scena. Prova a modificare manualmente.', 'error');
    }
  };

  // Strip HTML tags to get plain text for AI analysis
  const getPlainText = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const plainText = getPlainText(content || '');

  // ─── TAB: REVISIONE BOZZA ───────────────────────────────────────────────────
  const runDraftRevision = async () => {
    if (!plainText || plainText.length < 30) return;
    setIsAnalyzing(true);
    setAnalysis('');
    try {
      const systemPrompt = `Sei un editor letterario senior specializzato in narrativa italiana contemporanea.
Il tuo compito è revisionare la bozza fornita dall'utente con precisione chirurgica.

OBIETTIVO: Rendere il testo più SCORREVOLE, DINAMICO e COINVOLGENTE.

METODOLOGIA — Per ogni problema trovato, usa questo formato esatto. Le CATEGORIE devono includere specificamente Verbi, Avverbi, Ridondanze se presenti:
❌ [frase originale problematica]
✅ [proposta di revisione migliorata]
🏷️ [Categoria: Es. Verbo, Avverbio, Ridondanza, Ritmo, ecc.]
💡 [brevissima spiegazione del motivo]

CRITERI DI REVISIONE (applica tutti):
1. RITMO — Spezza periodi troppo lunghi. Alterna frasi brevi e incisive a quelle più distese.
2. VERBI ATTIVI — Sostituisci costruzioni passive o deboli ("c'era", "si trovava", "sembrava che") con verbi forti e diretti. Sii spietato con i verbi generici.
3. ELIMINAZIONE AVVERBI — Rimuovi avverbi ridondanti (molto, abbastanza, davvero). Trova il verbo o aggettivo più preciso.
4. RIDONDANZE — Elimina ripetizioni ed espressioni superflue.
5. SHOW DON'T TELL — Ogni emozione deve essere mostrata attraverso un'azione o sensazione fisica, non dichiarata.
6. FLUIDITÀ DIALOGO — I dialoghi devono suonare naturali, non letterari. Usa incisi di movimento, non solo "disse".
7. PAROLE RIPETUTE — Segnala e sostituisci le stesse parole usate in prossimità.
8. APERTURA SCENA — L'incipit deve essere un gancio immediato. Se è debole, proponi un'alternativa.

Inizia con: ## Analisi Revisione
Poi elenca max 5-7 interventi prioritari nel formato sopra.
Concludi con: ## Note Generali (2-3 osservazioni sintetiche sullo stile complessivo).

LINGUA: Rispondi sempre in italiano. Sii preciso, non generico.`;

      await groqService.streamChatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Revisiona questa bozza:\n\n${plainText}` }
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

  // ─── TAB: BRAINDUMP ─────────────────────────────────────────────────────────
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

  // ─── TAB: TRANSFORMER ───────────────────────────────────────────────────────
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

  const tabs: { id: SidekickTab; label: string; icon: React.ReactNode }[] = [
    { id: 'revision', label: 'Revisione', icon: <PenLine className="w-3 h-3" /> },
    { id: 'braindump', label: 'Braindump', icon: <Lightbulb className="w-3 h-3" /> },
    { id: 'transformer', label: 'Stile', icon: <Wand2 className="w-3 h-3" /> },
  ];

  return (
    <div className="w-80 h-screen glass border-l border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-slate-200">AI Sidekick</h2>
        </div>
        {isAnalyzing && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
      </div>

      {/* Tabs */}
      <div className="flex p-2 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setAnalysis(''); }}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── REVISIONE ── */}
        {activeTab === 'revision' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Correzione Bozza</span>
              <button
                onClick={runDraftRevision}
                disabled={isAnalyzing || plainText.length < 30}
                className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3 py-1.5 rounded-lg text-white flex items-center space-x-1 transition-all"
              >
                <Zap className="w-3 h-3" />
                <span>Analizza</span>
              </button>
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
                <StructuredOutput text={analysis} onApply={applySuggestion} />
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

        {/* ── BRAINDUMP ── */}
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

        {/* ── TRANSFORMER ── */}
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
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 space-y-3">
        <div className="flex items-center space-x-2 text-[10px] text-slate-500 uppercase font-bold">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Llama 3 Connected</span>
        </div>
      </div>
    </div>
  );
};
