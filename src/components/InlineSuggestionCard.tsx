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
  const [verticalSide, setVerticalSide] = useState<'bottom' | 'top'>('bottom');

  useLayoutEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const parentRect = cardRef.current.parentElement?.getBoundingClientRect();
      
      if (parentRect) {
        setIsCompact(parentRect.width < 650);

        // Check vertical space
        const spaceBelow = window.innerHeight - (parentRect.top + position.top + 60); // 60 is a safety margin for the line itself
        if (spaceBelow < rect.height + 40) {
          setVerticalSide('top');
        } else {
          setVerticalSide('bottom');
        }
      }
    }
  }, [position]);

  return (
    <div 
      ref={cardRef}
      className={cn(
        "absolute z-[100] glass rounded-[32px] border border-[var(--accent)]/30 shadow-premium animate-in fade-in zoom-in-95 duration-500 ring-1 ring-black/5 flex flex-col overflow-hidden",
        isCompact ? "w-72" : "w-[500px]"
      )}
      style={{ 
        top: position.top, 
        left: position.left + (position.width || 0) / 2,
        // Dynamic transform based on vertical flip
        transform: verticalSide === 'bottom' 
          ? 'translate(-50%, 24px)' 
          : 'translate(-50%, calc(-100% - 24px))',
        transition: 'transform 0.4s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease, width 0.3s ease'
      }}
    >
      <div className={cn("overflow-y-auto custom-scrollbar flex-1", isCompact ? "p-5 space-y-4" : "p-6 space-y-5")}>
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

        <div className={cn("grid gap-4", isCompact ? "grid-cols-1" : "grid-cols-2")}>
          <div className="space-y-1.5">
            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">Originale</span>
            <div className="text-[11px] text-[var(--text-secondary)] line-through decoration-rose-500/40 italic leading-relaxed bg-black/5 p-3 rounded-2xl border border-[var(--border-subtle)]">
              {suggestion.original}
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--accent)]">Revisione</span>
            <div className="text-[13px] text-[var(--text-bright)] leading-relaxed font-serif bg-[var(--accent-soft)]/30 p-3 rounded-2xl border border-[var(--accent)]/20 shadow-inner h-full">
              {suggestion.suggestion}
            </div>
          </div>
        </div>

        {suggestion.reason && (
          <div className="flex gap-3 p-3 bg-[var(--bg-deep)]/40 rounded-2xl border border-[var(--border-subtle)]">
            <Zap className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5 opacity-60" />
            <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed italic font-medium">
              {suggestion.reason}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button 
            onClick={onApply}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[var(--accent)] text-[var(--bg-deep)] rounded-[18px] text-[10px] font-black uppercase tracking-[0.15em] hover:brightness-110 transition-all shadow-glow-mint active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            Applica
          </button>
          <button 
            onClick={onIgnore}
            className="p-3.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-[18px] transition-all border border-[var(--border-subtle)] hover:border-rose-500/20 active:scale-[0.98]"
            title="Ignora"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic arrow position based on flip */}
      <div className={cn(
        "absolute left-1/2 -translate-x-1/2 w-4 h-4 glass border-[var(--accent)]/30 rotate-45 transition-all duration-300",
        verticalSide === 'bottom' 
          ? "-top-2 border-l border-t" 
          : "-bottom-2 border-r border-b"
      )} />
    </div>
  );
};
