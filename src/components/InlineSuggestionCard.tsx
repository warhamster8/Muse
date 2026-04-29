import React, { useLayoutEffect, useRef, useState } from 'react';
import { Check, X, Trash2, Zap } from 'lucide-react';
import type { AISuggestion } from '../lib/aiParsing';
import { cn } from '../lib/utils';

interface Props {
  suggestion: AISuggestion;
  onApply: () => void;
  onIgnore: () => void;
  onClose: () => void;
  position: { top: number; left: number; width?: number };
}

export const InlineSuggestionCard: React.FC<Props> = ({ suggestion, onApply, onIgnore, onClose, position }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  useLayoutEffect(() => {
    if (cardRef.current) {
      const parentRect = cardRef.current.parentElement?.getBoundingClientRect();
      if (parentRect) {
        // If container is narrower than 650px, use compact vertical layout
        setIsCompact(parentRect.width < 650);
      }
    }
  }, [position]);

  return (
    <div 
      ref={cardRef}
      className={cn(
        "absolute z-[100] glass rounded-[32px] border border-[var(--accent)]/30 shadow-premium animate-in fade-in zoom-in-95 duration-500 ring-1 ring-black/5 flex flex-col overflow-hidden",
        isCompact ? "w-80" : "w-[520px]"
      )}
      style={{ 
        top: position.top, 
        left: position.left + (position.width || 0) / 2,
        transform: 'translate(-50%, 24px)', 
        transition: 'transform 0.4s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease, width 0.3s ease'
      }}
    >
      <div className={cn("overflow-y-auto custom-scrollbar flex-1", isCompact ? "p-6 space-y-5" : "p-7 space-y-6")}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full shadow-sm",
              suggestion.type === 'grammatica' ? 'bg-emerald-500 shadow-emerald-500/50' :
              suggestion.type === 'taglio' ? 'bg-rose-500 shadow-rose-500/50' :
              suggestion.type === 'coerenza' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-[var(--accent)] shadow-[var(--accent)]/50'
            )} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">
              {suggestion.category || 'Suggerimento AI'}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--accent-soft)] rounded-xl transition-colors">
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className={cn("grid gap-5", isCompact ? "grid-cols-1" : "grid-cols-2")}>
          <div className="space-y-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">Testo Originale</span>
            <div className="text-[12px] text-[var(--text-secondary)] line-through decoration-rose-500/40 italic leading-relaxed bg-black/5 p-4 rounded-2xl border border-[var(--border-subtle)]">
              {suggestion.original}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--accent)]">Versione Muse</span>
            <div className="text-[14px] text-[var(--text-bright)] leading-relaxed font-serif bg-[var(--accent-soft)]/30 p-4 rounded-2xl border border-[var(--accent)]/20 shadow-inner h-full">
              {suggestion.suggestion}
            </div>
          </div>
        </div>

        {suggestion.reason && (
          <div className="flex gap-3 p-4 bg-[var(--bg-deep)]/40 rounded-2xl border border-[var(--border-subtle)]">
            <Zap className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5 opacity-60" />
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic font-medium">
              {suggestion.reason}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button 
            onClick={onApply}
            className="flex-1 flex items-center justify-center gap-3 py-4 bg-[var(--accent)] text-[var(--bg-deep)] rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-glow-mint active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            {isCompact ? 'Applica' : 'Applica Revisione'}
          </button>
          <button 
            onClick={onIgnore}
            className="p-4 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-[20px] transition-all border border-[var(--border-subtle)] hover:border-rose-500/20 active:scale-[0.98]"
            title="Ignora"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 glass border-l border-t border-[var(--accent)]/30 -top-2 rotate-45 transition-all duration-300" />
    </div>
  );
};
