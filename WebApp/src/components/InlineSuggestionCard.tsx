import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, Trash2, Zap } from 'lucide-react';
import type { AISuggestion } from '../lib/aiParsing';
import { cn } from '../lib/utils';

interface Props {
  suggestion: AISuggestion;
  onApply: () => void;
  onIgnore: () => void;
  onClose: () => void;
  position: { top: number; left: number; width?: number; rect?: DOMRect };
}

export const InlineSuggestionCard: React.FC<Props> = ({ suggestion, onApply, onIgnore, onClose, position }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    if (!position.rect) return;

    const updatePosition = () => {
      const cardWidth = window.innerWidth < 650 ? 280 : 480;
      const cardHeight = 320; // Estimated max height
      
      // Calculate ideal position: to the right of the highlight
      let left = position.rect!.right + 40;
      let top = position.rect!.top + position.rect!.height / 2;

      // Vertical clamping: stay within viewport
      const margin = 20;
      const minTop = margin + cardHeight / 2;
      const maxTop = window.innerHeight - margin - cardHeight / 2;
      top = Math.max(minTop, Math.min(top, maxTop));

      // Horizontal flip: if it doesn't fit on the right, show on the left or center
      if (left + cardWidth > window.innerWidth - margin) {
        left = position.rect!.left - cardWidth - 40;
      }

      // Final clamping for horizontal
      left = Math.max(margin, Math.min(left, window.innerWidth - cardWidth - margin));

      setCoords({ top, left });
      setIsReady(true);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [position.rect]);

  const cardContent = (
    <div 
      ref={cardRef}
      className={cn(
        "fixed z-[9999] glass rounded-[32px] border border-[var(--accent)]/30 shadow-premium animate-in fade-in zoom-in-95 duration-500 ring-1 ring-black/5 flex flex-col overflow-hidden transition-all duration-300",
        window.innerWidth < 650 ? "w-[280px]" : "w-[480px]",
        !isReady ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
      style={{ 
        top: coords.top, 
        left: coords.left,
        transform: 'translateY(-50%)',
      }}
    >
      <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
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

        <div className={cn("grid gap-4", window.innerWidth < 650 ? "grid-cols-1" : "grid-cols-2")}>
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
    </div>
  );

  return createPortal(cardContent, document.body);
};
