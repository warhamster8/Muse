import type { SceneTimelineEvent } from '../../types/timeline';


import { cn } from '../../lib/utils';
import { Clock } from 'lucide-react';

interface GanttSceneRowProps {
  sceneTitle: string;
  events: SceneTimelineEvent[];
  onEventClick?: (event: SceneTimelineEvent) => void;
}

export const GanttSceneRow: React.FC<GanttSceneRowProps> = ({ sceneTitle, events, onEventClick }) => {
  if (!events || events.length === 0) return null;

  // Calculate some simple proportions for the "Gantt" view
  // Since we don't have absolute pixel widths based on time yet,
  // we'll distribute them based on their relative order and duration.
  const totalDuration = events.reduce((acc, curr) => acc + (curr.duration || 10), 0);

  return (
    <div className="group/row mb-8 last:mb-0">
      <div className="flex items-center gap-3 mb-4">
        <div className="px-3 py-1 bg-[var(--bg-surface)] rounded-full border border-[var(--border-subtle)] group-hover/row:border-[var(--accent)]/30 transition-all">
          <span className="text-[10px] font-black text-[var(--text-muted)] group-hover/row:text-[var(--accent)] uppercase tracking-widest leading-none">
            {sceneTitle}
          </span>
        </div>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--border-subtle)] to-transparent" />
      </div>

      <div className="relative h-24 flex items-center gap-1 overflow-x-auto pb-4 scrollbar-hide">
        {events.map((event, idx) => {
          const widthPercent = Math.max(15, (event.duration / totalDuration) * 100);
          
          return (
            <div 
              key={event.id || idx}
              onClick={() => onEventClick?.(event)}
              style={{ width: `${widthPercent}%`, minWidth: '160px' }}
              className={cn(
                "h-full rounded-2xl p-4 transition-all cursor-pointer relative group flex flex-col justify-between border shadow-sm",
                event.importance === 'high' 
                  ? "bg-[var(--accent)]/20 border-[var(--accent)]/40 hover:bg-[var(--accent)]/30" 
                  : event.importance === 'medium'
                  ? "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]/30"
                  : "bg-[var(--bg-deep)]/50 border-[var(--border-subtle)] opacity-60 hover:opacity-100"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] truncate mr-2">
                  {event.timestamp}
                </span>
                <Clock className="w-2.5 h-2.5 text-[var(--text-muted)]" />
              </div>
              
              <div className="mt-2">
                 <h4 className="text-[11px] font-black text-[var(--text-bright)] leading-tight truncate uppercase tracking-tighter">{event.title}</h4>
                 <p className="text-[9px] text-[var(--text-secondary)] line-clamp-2 mt-1 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    {event.description}
                 </p>
              </div>

              {/* Connecting Line Dots */}
              {idx < events.length - 1 && (
                <div className="absolute top-1/2 -right-1 w-2 h-2 bg-[var(--accent)]/30 rounded-full blur-[2px] z-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
