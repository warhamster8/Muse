import React, { useLayoutEffect, useRef, useState } from 'react';
import { Check, X, Trash2, Zap } from 'lucide-react';
import type { AISuggestion } from '../lib/aiParsing';
import { cn } from '../lib/utils';

interface Props {
  suggestion: AISuggestion;
  onApply: () => void;
  onIgnore: () => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export const InlineSuggestionCard: React.FC<Props> = ({ suggestion, onApply, onIgnore, onClose, position }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  useLayoutEffect(() => {
    if (cardRef.current) {
      const parentRect = cardRef.current.parentElement?.getBoundingClientRect();
      
      if (parentRect) {
        // If the point where we are anchored (position.top) is too close to the viewport top
        // or specifically too close to the editor header
        const viewportTop = parentRect.top + position.top;
        if (viewportTop < 300) { // Increased threshold to account for card height
          setIsFlipped(true);
        } else {
          setIsFlipped(false);
        }
      }
    }
  }, [position]);

  return (
    <div 
      ref={cardRef}
      className="absolute z-[100] w-80 glass rounded-[24px] border border-[var(--accent)]/30 shadow-premium animate-in fade-in zoom-in-95 duration-300 ring-1 ring-black/5"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        transform: isFlipped ? 'translate(-50%, 20px)' : 'translate(-50%, -110%)',
        transition: 'transform 0.3s ease, opacity 0.2s ease'
      }}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full shadow-sm",
              suggestion.type === 'grammatica' ? 'bg-emerald-500 shadow-emerald-500/50' :
              suggestion.type === 'taglio' ? 'bg-rose-500 shadow-rose-500/50' :
              suggestion.type === 'coerenza' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-indigo-500 shadow-indigo-500/50'
            )} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)] opacity-80">
              {suggestion.category || 'Suggerimento AI'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[var(--accent-soft)] rounded-lg transition-colors">
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="text-[11px] text-[var(--text-secondary)] line-through decoration-rose-500/40 italic px-1 opacity-60">
            "{suggestion.original}"
          </div>
          <div className="text-[13px] text-[var(--text-bright)] leading-relaxed font-serif bg-[var(--bg-deep)]/20 p-4 rounded-xl border border-[var(--border-subtle)] shadow-inner">
            {suggestion.suggestion}
          </div>
        </div>

        {suggestion.reason && (
          <div className="flex gap-2.5 p-3.5 bg-[var(--accent-soft)] rounded-xl border border-[var(--accent)]/10">
            <Zap className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5 opacity-40" />
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic font-medium">
              {suggestion.reason}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button 
            onClick={onApply}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[var(--accent)] text-[var(--bg-deep)] rounded-[18px] text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-glow-mint active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            Applica
          </button>
          <button 
            onClick={onIgnore}
            className="p-3.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-[18px] transition-all border border-transparent hover:border-rose-500/20 active:scale-[0.98]"
            title="Ignora"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Little arrow pointing down/up */}
      <div className={cn(
        "absolute left-1/2 -translate-x-1/2 w-4 h-4 glass border-[var(--accent)]/30 rotate-45 transition-all duration-300",
        isFlipped 
          ? "-top-2 border-l border-t" 
          : "-bottom-2 border-r border-b"
      )} />
    </div>
  );
};
