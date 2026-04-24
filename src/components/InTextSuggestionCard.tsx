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
    <div className="w-[800px] glass-dark border border-white/30 rounded-[40px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-3xl">
      <div className="flex flex-col">
        {/* Top bar: Category and Actions */}
        <div className="bg-white/[0.08] px-8 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_15px_var(--accent)]" />
            <span className="text-[12px] font-black uppercase tracking-[0.35em] text-white">
              {category || 'Analisi Editoriale'}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={(e) => { e.stopPropagation(); onIgnore(); }}
              className="text-slate-300 hover:text-red-400 transition-all text-[11px] font-black uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-red-500/10"
            >
              <X className="w-4 h-4" /> Ignora
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onApply(); }}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-deep)] px-10 py-3 rounded-2xl transition-all flex items-center gap-2 text-[12px] font-black uppercase tracking-widest shadow-2xl shadow-[var(--accent)]/40 active:scale-95 border border-white/20"
            >
              <Zap className="w-5 h-5 fill-current" /> Applica Modifica
            </button>
          </div>
        </div>

        {/* Content Area: Horizontal Comparison */}
        <div className="flex divide-x divide-white/10 bg-black/20">
          {/* Original Side */}
          <div className="flex-1 p-8 space-y-4">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.25em] block px-1">Testo Originale</span>
            <div className="text-[16px] text-slate-200 leading-relaxed font-serif italic bg-red-500/10 p-6 rounded-[32px] border border-red-500/20 min-h-[90px] flex items-center shadow-inner">
              <div>
                {oldParts.map((part, i) => (
                  <span key={i} className={cn(part.removed && "bg-red-500/30 text-white font-medium line-through decoration-white/50 px-1.5 rounded mx-0.5")}>
                    {part.value}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Suggested Side */}
          <div className="flex-1 p-8 space-y-4">
            <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.25em] block px-1">Versione Proposta</span>
            <div className="text-[16px] text-white leading-relaxed font-serif bg-[var(--accent)]/10 p-6 rounded-[32px] border border-[var(--accent)]/20 min-h-[90px] flex items-center shadow-inner">
              <div>
                {newParts.map((part, i) => (
                  <span key={i} className={cn(part.added && "text-[var(--accent)] font-bold decoration-[var(--accent)] px-1.5 rounded bg-[var(--accent)]/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]")}>
                    {part.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Explanation */}
        {reason && (
          <div className="bg-white/[0.04] px-10 py-5 flex items-start gap-5 border-t border-white/10">
            <Sparkles className="w-6 h-6 text-[var(--accent)] shrink-0 mt-0.5 opacity-70" />
            <p className="text-[14px] text-slate-100 font-medium leading-relaxed italic">
              {reason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
