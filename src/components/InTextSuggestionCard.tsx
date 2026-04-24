import React from 'react';
import { Zap, X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import type { AISuggestion } from '../lib/aiParsing';
import { computeDiff } from './analysis/StructuredOutput';

interface InTextSuggestionCardProps {
  suggestion: AISuggestion;
  onApply: () => void;
  onIgnore: () => void;
}

export const InTextSuggestionCard: React.FC<InTextSuggestionCardProps> = ({
  suggestion,
  onApply,
  onIgnore,
}) => {
  const { original, suggestion: suggested, reason, category } = suggestion;
  const { oldParts, newParts } = suggested 
    ? computeDiff(original, suggested) 
    : { oldParts: [{ value: original, removed: false }], newParts: [] };

  return (
    <div className="w-[500px] glass-dark border border-white/20 rounded-[32px] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="bg-white/[0.03] px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent)]/80">
            {category || 'Suggestione Editoriale'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onIgnore(); }}
            className="p-2.5 text-slate-400 hover:text-red-400 transition-all rounded-2xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
            title="Ignora"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onApply(); }}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-deep)] px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--accent)]/20 active:scale-95"
          >
            <Zap className="w-4 h-4 fill-current" /> Applica
          </button>
        </div>
      </div>

      {/* Content - Horizontal Layout */}
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {/* Original */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-red-500/50 uppercase tracking-widest px-1">Originale</span>
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 text-[11px] text-red-400/90 leading-relaxed font-serif italic min-h-[100px] flex flex-col justify-center">
              <div>
                {oldParts.map((part, i) => (
                  <span key={i} className={cn(part.removed && "bg-red-500/20 text-red-300 line-through px-0.5 rounded")}>
                    {part.value}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Suggestion */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-[var(--accent)]/50 uppercase tracking-widest px-1">Proposta</span>
            <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-2xl p-4 text-[11px] text-slate-100 leading-relaxed font-serif min-h-[100px] flex flex-col justify-center">
              <div>
                {newParts.map((part, i) => (
                  <span key={i} className={cn(part.added && "bg-[var(--accent)]/20 text-[var(--accent)] font-bold px-0.5 rounded shadow-[0_0_15px_rgba(99,102,241,0.2)]")}>
                    {part.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reason - Full Width */}
        {reason && (
          <div className="pt-2 flex items-start gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
             <Sparkles className="w-5 h-5 text-[var(--accent)]/40 shrink-0 mt-0.5" />
             <p className="text-[11px] text-slate-400 italic leading-relaxed">
               {reason}
             </p>
          </div>
        )}
      </div>

      {/* Footer decorative */}
      <div className="h-1.5 bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent opacity-50" />
    </div>
  );
};
