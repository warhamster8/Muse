import React from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import type { AISuggestion } from '../lib/aiParsing';
import { computeDiff } from './analysis/StructuredOutput';

interface InTextSuggestionCardProps {
  suggestion: AISuggestion;
  onApply: () => void;
  onIgnore: () => void;
  onClose: () => void;
}

export const InTextSuggestionCard: React.FC<InTextSuggestionCardProps> = ({
  suggestion,
  onApply,
  onIgnore,
  onClose,
}) => {
  const { original, suggestion: suggested, reason, category } = suggestion;
  const { oldParts, newParts } = suggested 
    ? computeDiff(original, suggested) 
    : { oldParts: [{ value: original, removed: false }], newParts: [] };

  return (
    <div className="w-[420px] bg-white/95 dark:bg-[#1a1a2e]/95 backdrop-blur-3xl border border-white/50 dark:border-white/10 rounded-[28px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-2 duration-400 flex flex-col border-b-4 border-b-[var(--accent)]/30">
      {/* Header - Ultra Compact */}
      <div className="px-5 py-2.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white/80">
            {category || 'Revisione'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onIgnore(); }}
            className="px-2 py-1 text-slate-400 hover:text-red-500 transition-all text-[8px] font-black uppercase tracking-widest rounded-lg"
          >
            Ignora
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onApply(); }}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-[var(--accent)]/10 active:scale-95"
          >
            <Zap className="w-3 h-3 fill-current" /> Applica
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all ml-1"
          >
             <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Comparison - Stacked for Compactness */}
      <div className="flex flex-col bg-white/20 dark:bg-black/5 divide-y divide-black/5 dark:divide-white/5">
        {/* Original - Hidden by default or very small? Let's make it small */}
        <div className="p-4 relative group bg-red-500/[0.02]">
          <div className="text-[13px] text-slate-400 dark:text-slate-500 leading-relaxed font-serif italic line-clamp-2">
            {oldParts.map((part, i) => (
              <span key={i} className={cn(part.removed && "bg-red-500/10 text-red-500/60 line-through decoration-red-500/20 px-0.5 rounded")}>
                {part.value}
              </span>
            ))}
          </div>
          <span className="absolute top-1.5 right-3 text-[6px] font-bold uppercase tracking-tighter opacity-30">Attuale</span>
        </div>

        {/* Proposal */}
        <div className="p-4 relative group">
          <div className="text-[14px] text-slate-900 dark:text-white/90 leading-relaxed font-serif whitespace-pre-line">
            {newParts.map((part, i) => (
              <span key={i} className={cn(part.added && "bg-[var(--accent)]/10 text-[var(--accent)] font-bold px-0.5 rounded")}>
                {part.value}
              </span>
            ))}
          </div>
          <span className="absolute top-1.5 right-3 text-[6px] font-bold uppercase tracking-tighter text-[var(--accent)] opacity-40">Suggerito</span>
        </div>
      </div>

      {/* Reasoning - Single Line */}
      {reason && (
        <div className="px-5 py-2 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex items-center gap-3">
          <Sparkles className="w-3 h-3 text-[var(--accent)]/40" />
          <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium italic line-clamp-1">
            {reason}
          </p>
        </div>
      )}
    </div>
  );
};
