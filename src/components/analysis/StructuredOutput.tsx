import React from 'react';
import { 
  Sparkles, 
  RefreshCw,
  Zap,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';

export type DiffPart = { value: string; added?: boolean; removed?: boolean };

export function computeDiff(oldStr: string, newStr: string) {
  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);
  
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

export const StructuredOutput: React.FC<{ 
  text: string; 
  onApply?: (original: string, suggestion: string) => void;
  onReject?: (original: string) => void;
  appliedSuggestions?: string[];
  rejectedSuggestions?: string[];
  isAnalyzing?: boolean;
  fullView?: boolean;
}> = ({ 
  text, 
  onApply, 
  onReject, 
  appliedSuggestions, 
  rejectedSuggestions, 
  isAnalyzing,
  fullView = false
}) => {
  const setHighlightedText = useStore(s => s.setHighlightedText);
  const lines = text.split('\n');
  const items: { 
    type: 'suggestion' | 'header' | 'chips' | 'memo' | 'other', 
    content: any, 
    key: string 
  }[] = [];
  
  let currentSuggestion: { original?: string; suggestion?: string; reason?: string; category?: string } | null = null;

  const requestScrollToHighlight = useStore(s => s.requestScrollToHighlight);

  const renderSuggestionCard = (sug: any, key: string | number, isPending = false) => {
    if (!sug || !sug.original) return null;
    const { original, suggestion, reason, category } = sug;
    
    // Internal check: if already handled, return null (though the parent should filter)
    if (!isPending && (appliedSuggestions?.includes(original) || rejectedSuggestions?.includes(original))) {
      return null;
    }

    const { oldParts, newParts } = suggestion ? computeDiff(original, suggestion) : { oldParts: [{ value: original, removed: false }], newParts: [] };

    return (
      <div 
        key={key} 
        onClick={() => {
          setHighlightedText(original);
          requestScrollToHighlight();
        }}
        className={cn(
          "bg-[#23282f] border border-white/10 rounded-[24px] overflow-hidden mb-5 shadow-2xl group transition-all duration-500 hover:border-[#5be9b1]/20 cursor-pointer",
          isPending ? "opacity-70 border-[#5be9b1]/30 ring-1 ring-[#5be9b1]/10" : "animate-in fade-in zoom-in-95"
        )}
      >
        <div className="bg-white/[0.02] px-4 py-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-700 truncate max-w-[60px] opacity-70">
              {category || 'Idea'}
            </span>
            {isPending && <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#5be9b1]" />}
          </div>
          {!isPending && (
            <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onReject?.(original)}
                className="text-[9px] font-black uppercase tracking-wider text-slate-600 hover:text-red-400 px-2 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border border-transparent hover:bg-red-500/10 shrink-0"
              >
                <X className="w-2.5 h-2.5" /> <span className="hidden xs:inline">Ignora</span>
              </button>
              {suggestion && (
                <button 
                  onClick={() => onApply?.(original, suggestion)}
                  className="text-[9px] font-black uppercase tracking-wider bg-[#5be9b1] hover:bg-[#4ade80] text-[#0b0e11] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Zap className="w-2.5 h-2.5" /> <span className="hidden xs:inline text-nowrap">Applica</span>
                </button>
              )}
            </div>
          )}
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl px-4 py-3 text-xs text-red-500/80 opacity-90 leading-relaxed font-light italic">
            {oldParts.map((part, i) => (
              <span key={i} className={cn(part.removed && "bg-red-500/20 text-red-400 line-through px-0.5 rounded")}>
                {part.value}
              </span>
            ))}
          </div>
          {suggestion ? (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                if (!isPending && suggestion) onApply?.(original, suggestion);
              }}
              className={cn(
                "bg-[#5be9b1]/5 border border-[#5be9b1]/10 rounded-2xl px-4 py-3 text-xs text-slate-100 leading-relaxed transition-all",
                !isPending && "hover:border-[#5be9b1]/40 hover:bg-[#5be9b1]/10 cursor-pointer"
              )}
            >
              {newParts.map((part, i) => (
                <span key={i} className={cn(part.added && "bg-[#5be9b1]/20 text-[#5be9b1] font-bold px-0.5 rounded")}>
                  {part.value}
                </span>
              ))}
            </div>
          ) : isPending && (
            <div className="h-10 flex items-center px-4 bg-[#13161a]/40 rounded-2xl border border-dashed border-white/5 animate-pulse">
               <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest italic">Elaborazione...</span>
            </div>
          )}
          {reason && (
            <p className="text-[11px] text-slate-600 italic px-2 flex items-start gap-2.5 animate-in slide-in-from-left-1 leading-relaxed font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#5be9b1]/30 shrink-0 mt-0.5" />
              <span>{reason}</span>
            </p>
          )}
        </div>
      </div>
    );
  };

  const flushCurrent = (key: string) => {
    if (currentSuggestion) {
      if (currentSuggestion.original && currentSuggestion.suggestion) {
        items.push({ type: 'suggestion', content: { ...currentSuggestion }, key });
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
      flushCurrent(`sug-${i}`);
      const cleanOriginal = trimmedLine.replace(/^(?:\d+\.\s*)?❌\s*/, '').replace(/^["“”«»]+|["“”«»]+$/g, '').trim();
      if (cleanOriginal) {
        currentSuggestion = { original: cleanOriginal };
      }
    } else if (/^(?:\d+\.\s*)?✅/.test(trimmedLine)) {
      if (currentSuggestion) {
        currentSuggestion.suggestion = trimmedLine.replace(/^(?:\d+\.\s*)?✅\s*/, '').replace(/^["“”«»]+|["“”«»]+$/g, '').trim();
      }
    } else if (/^(?:\d+\.\s*)?💡/.test(trimmedLine)) {
      if (currentSuggestion) {
        currentSuggestion.reason = trimmedLine.replace(/^(?:\d+\.\s*)?💡\s*/, '').trim();
      } else {
        items.push({ type: 'other', key: `info-${i}`, content: (
          <div key={i} className="bg-[#5be9b1]/5 border-l-4 border-[#5be9b1]/30 p-5 rounded-r-3xl mb-6 mt-2">
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              {trimmedLine.replace(/^💡\s*/, '')}
            </p>
          </div>
        )});
      }
    } else if (/^(?:\d+\.\s*)?🏷️/.test(trimmedLine)) {
      if (currentSuggestion) {
        currentSuggestion.category = trimmedLine.replace(/^(?:\d+\.\s*)?🏷️\s*/, '').trim();
      }
    } else if (trimmedLine.startsWith('S:')) {
      flushCurrent(`sug-${i}`);
      items.push({ type: 'chips', key: `chips-s-${i}`, content: renderChips(trimmedLine, "bg-[#5be9b1]/10 text-[#5be9b1] border-[#5be9b1]/20 hover:bg-[#5be9b1]/20") });
    } else if (trimmedLine.startsWith('A:')) {
      flushCurrent(`sug-${i}`);
      items.push({ type: 'chips', key: `chips-a-${i}`, content: renderChips(trimmedLine, "bg-white/[0.05] text-slate-500 border-white/5 hover:bg-white/10") });
    } else if (trimmedLine.startsWith('M:')) {
      flushCurrent(`sug-${i}`);
      items.push({ type: 'memo', key: `memo-${i}`, content: (
        <div key={i} className="bg-[#5be9b1]/5 border border-[#5be9b1]/10 rounded-[24px] p-5 mb-5 shadow-inner">
          <p className="text-sm text-white font-medium leading-relaxed italic">{trimmedLine.replace(/^M:\s*/, '')}</p>
        </div>
      )});
    } else if (trimmedLine.startsWith('##')) {
      flushCurrent(`sug-${i}`);
      items.push({ type: 'header', key: `head-${i}`, content: (
        <div key={i} className="pt-8 pb-3 mb-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#5be9b1]/70">
            {trimmedLine.replace(/^#+\s*/, '')}
          </h3>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#5be9b1]/20 to-transparent ml-6" />
        </div>
      )});
    } else if (trimmedLine) {
      if (!currentSuggestion) {
        items.push({ type: 'other', key: `text-${i}`, content: (
          <div key={i} className="px-3 py-2 bg-slate-800/20 border-l-2 border-slate-700 rounded-r-lg mb-4 ml-1">
            <p className="text-slate-400 text-[11px] leading-relaxed italic">
              {trimmedLine}
            </p>
          </div>
        )});
      }
    }
  });

  const finalSug = currentSuggestion as any;
  if (finalSug && finalSug.original) {
    items.push({ type: 'suggestion', key: 'pending-last', content: { ...finalSug } });
  }

  // Find the first available suggestion to show
  const availableSuggestions = items.filter(item => 
    item.type === 'suggestion' && 
    !appliedSuggestions?.includes(item.content.original) && 
    !rejectedSuggestions?.includes(item.content.original)
  );
  
  const activeSuggestion = availableSuggestions[0];

  // Logic to update the store's highlightedText
  React.useEffect(() => {
    if (activeSuggestion) {
      setHighlightedText(activeSuggestion.content.original);
    } else {
      setHighlightedText(null);
    }
    
    // Clean up on unmount
    return () => setHighlightedText(null);
  }, [activeSuggestion?.content.original, setHighlightedText]);

  const outputElements: React.ReactNode[] = [];
  
  items.forEach(item => {
    if (item.type !== 'suggestion') {
      outputElements.push(item.content);
    } else {
      const isActuallyPending = isAnalyzing && item.key === 'pending-last';
      
      if (fullView) {
        // In full view, we show EVERYTHING that isn't applied or rejected
        if (!appliedSuggestions?.includes(item.content.original) && !rejectedSuggestions?.includes(item.content.original)) {
          outputElements.push(renderSuggestionCard(item.content, item.key, isActuallyPending));
        }
      } else if (item === activeSuggestion) {
        // In sidebar view, we only show the NEXT ONE
        outputElements.push(renderSuggestionCard(item.content, item.key, isActuallyPending));
      }
    }
  });

  // Indicate total count if in sidebar and more exists
  if (!fullView && availableSuggestions.length > 1) {
    outputElements.push(
      <div key="count-summary" className="px-4 py-2 mb-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group cursor-default">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-700">Suggestioni disponibili</span>
        <span className="text-[10px] font-black text-[#5be9b1] bg-[#5be9b1]/10 px-2.5 py-1 rounded-lg">1 di {availableSuggestions.length}</span>
      </div>
    );
  }

  if (activeSuggestion === undefined && (text.endsWith('\n') || text.length === 0)) {
    outputElements.push(
      <div key="typing" className="flex items-center gap-2 px-4 py-3 opacity-30">
        <div className="w-1.5 h-1.5 bg-[#5be9b1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-[#5be9b1] rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
        <div className="w-1.5 h-1.5 bg-[#5be9b1] rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
      </div>
    );
  }

  return <div className="space-y-1">{outputElements}</div>;
};
