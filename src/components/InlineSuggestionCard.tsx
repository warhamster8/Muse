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
  const [side, setSide] = useState<'right' | 'left'>('right');
  const [isAtTop, setIsAtTop] = useState(false);

  useLayoutEffect(() => {
    if (cardRef.current) {
      const parentRect = cardRef.current.parentElement?.getBoundingClientRect();
      if (parentRect) {
        // Horizontal check: if we are too close to the right edge of the container
        // We anchor to the RIGHT of the highlight (left + width)
        const highlightRight = position.left + (position.width || 0);
        const spaceOnRight = parentRect.width - highlightRight;
        
        if (spaceOnRight < 360) { // Card width (320) + margin
          setSide('left');
        } else {
          setSide('right');
        }

        // Vertical safety
        const viewportTop = parentRect.top + position.top;
        setIsAtTop(viewportTop < 150);
      }
    }
  }, [position]);

  return (
    <div 
      ref={cardRef}
      className="absolute z-[100] w-80 glass rounded-[32px] border border-[var(--accent)]/30 shadow-premium animate-in fade-in zoom-in-95 duration-500 ring-1 ring-black/5 flex flex-col max-h-[70vh] overflow-hidden"
      style={{ 
        top: position.top, 
        left: position.left,
        // side-popup transform: 
        // if right: move by highlight width + gap
        // if left: move by -cardWidth - gap
        transform: `
          ${side === 'right' ? `translateX(${ (position.width || 0) + 40 }px)` : 'translateX(calc(-100% - 40px))'} 
          ${isAtTop ? 'translateY(0px)' : 'translateY(-50%)'}
        `,
        transition: 'transform 0.4s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease'
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

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-[11px] text-[var(--text-secondary)] line-through decoration-rose-500/40 italic px-1 opacity-60">
              "{suggestion.original}"
            </div>
            <div className="text-[13px] text-[var(--text-bright)] leading-relaxed font-serif bg-[var(--bg-deep)]/20 p-5 rounded-2xl border border-[var(--border-subtle)] shadow-inner">
              {suggestion.suggestion}
            </div>
          </div>
        </div>

        {suggestion.reason && (
          <div className="flex gap-3 p-4 bg-[var(--accent-soft)]/20 rounded-2xl border border-[var(--accent)]/10">
            <Zap className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5 opacity-60" />
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic font-medium">
              {suggestion.reason}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button 
            onClick={onApply}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-[var(--accent)] text-[var(--bg-deep)] rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-glow-mint active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            Applica
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

      {/* Side-indicator arrow */}
      <div className={cn(
        "absolute top-1/2 -translate-y-1/2 w-3 h-3 glass border-[var(--accent)]/30 rotate-45 transition-all duration-300",
        side === 'right' 
          ? "-left-1.5 border-l border-b" 
          : "-right-1.5 border-r border-t"
      )} />
    </div>
  );
};
