import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Star, Zap, Circle, Square, Diamond } from 'lucide-react';

// ─── Icon map ─────────────────────────────────────────────────────────────────
const NODE_ICONS: Record<string, React.FC<any>> = {
  star: Star,
  zap: Zap,
  circle: Circle,
  square: Square,
  diamond: Diamond,
};

// ─── Readable text from hex ───────────────────────────────────────────────────
function getTextColor(hex: string): string {
  if (!hex || !hex.startsWith('#')) return '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? '#1e293b' : '#ffffff';
}

// ─── Shared handle style ──────────────────────────────────────────────────────
const handleStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  background: 'rgba(148,163,184,0.35)',
  border: '2px solid rgba(148,163,184,0.55)',
  borderRadius: '50%',
  transition: 'all 0.18s',
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function EditableNode({ id, data, isConnectable, selected }: any) {
  const { setNodes } = useReactFlow();
  const [label, setLabel] = useState(data.label || '');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data.label !== label) setLabel(data.label || '');
  }, [data.label]);

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  const updateNodeData = (updates: Record<string, any>) => {
    setNodes(nds => nds.map(n => (n.id === id ? { ...n, data: { ...n.data, ...updates } } : n)));
  };

  const onLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
    updateNodeData({ label: e.target.value });
  };

  const onLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditing(false);
      (e.target as HTMLElement).blur();
    }
  };

  // ── Visual properties ────────────────────────────────────────────────────
  const isHex = typeof data.color === 'string' && data.color.startsWith('#');
  const nodeColor = isHex ? data.color : null;
  const textColor = nodeColor ? getTextColor(nodeColor) : '#f1f5f9';
  const isRoot = !data.isSubnode;
  const hasNotes = typeof data.notes === 'string' && data.notes.trim().length > 0;

  // ── Root node: rounded card with gradient accent ──────────────────────────
  // ── Subnode: compact pill ──────────────────────────────────────────────────

  const background = nodeColor
    ? `linear-gradient(135deg, ${nodeColor}cc, ${nodeColor}77)`
    : isRoot
      ? 'linear-gradient(135deg, rgba(79,70,229,0.28) 0%, rgba(124,58,237,0.18) 100%)'
      : 'linear-gradient(135deg, rgba(30,41,59,0.92) 0%, rgba(15,23,42,0.95) 100%)';

  const borderColor = selected
    ? isRoot ? 'rgba(129,140,248,0.9)' : 'rgba(52,211,153,0.85)'
    : nodeColor
      ? nodeColor + '77'
      : isRoot
        ? 'rgba(99,102,241,0.4)'
        : 'rgba(100,116,139,0.3)';

  const boxShadow = selected
    ? isRoot
      ? '0 0 0 2.5px rgba(129,140,248,0.35), 0 8px 32px rgba(0,0,0,0.45)'
      : '0 0 0 2px rgba(52,211,153,0.35), 0 4px 16px rgba(0,0,0,0.4)'
    : isRoot
      ? '0 4px 24px rgba(79,70,229,0.18), 0 8px 32px rgba(0,0,0,0.35)'
      : '0 2px 10px rgba(0,0,0,0.3)';

  const containerStyle: React.CSSProperties = isRoot
    ? {
      borderRadius: 14,
      minWidth: 160,
      maxWidth: 240,
      background,
      backdropFilter: 'blur(14px)',
      border: `1.5px solid ${borderColor}`,
      boxShadow,
      transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      transform: selected ? 'scale(1.04)' : 'scale(1)',
      color: textColor,
      position: 'relative',
    }
    : {
      borderRadius: 9999,
      minWidth: 100,
      maxWidth: 200,
      background,
      backdropFilter: 'blur(10px)',
      border: `1.5px solid ${borderColor}`,
      boxShadow,
      transition: 'all 0.2s',
      transform: selected ? 'scale(1.03)' : 'scale(1)',
      color: textColor,
      position: 'relative',
    };

  return (
    <div
      className="relative group nodrag"
      style={containerStyle}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* ── Connection handles — all 4 sides ─────────────────────────────── */}
      <Handle type="target" position={Position.Top} id="top-t" isConnectable={isConnectable} style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom-s" isConnectable={isConnectable} style={handleStyle} />
      <Handle type="target" position={Position.Left} id="left-t" isConnectable={isConnectable} style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right-s" isConnectable={isConnectable} style={handleStyle} />

      {/* ── Root accent bar ──────────────────────────────────────────────── */}
      {isRoot && !nodeColor && (
        <div
          style={{
            position: 'absolute', top: 0, left: '18%', right: '18%', height: 2.5,
            borderRadius: '0 0 3px 3px',
            background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
            opacity: selected ? 1 : 0.7,
            transition: 'opacity 0.2s',
          }}
        />
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: isRoot ? '11px 16px' : '6px 14px',
        }}
      >
        {IconComponent && (
          <IconComponent
            style={{ width: isRoot ? 14 : 12, height: isRoot ? 14 : 12, opacity: 0.75, flexShrink: 0 }}
          />
        )}

        {isEditing ? (
          <input
            ref={inputRef}
            value={label}
            onChange={onLabelChange}
            onBlur={() => setIsEditing(false)}
            onKeyDown={onLabelKeyDown}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              width: '100%',
              color: textColor,
              fontSize: isRoot ? 13 : 11,
              fontWeight: isRoot ? 700 : 500,
              minWidth: 60,
            }}
          />
        ) : (
          <span
            style={{
              fontSize: isRoot ? 13 : 11,
              fontWeight: isRoot ? 700 : 500,
              letterSpacing: isRoot ? '0.01em' : 0,
              lineHeight: 1.35,
              color: textColor,
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              userSelect: 'none',
            }}
            title={label}
          >
            {label || (isRoot ? 'Idea Centrale' : 'Subnodo')}
          </span>
        )}

        {/* Notes dot */}
        {hasNotes && (
          <div
            title="Ha note"
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'rgba(52,211,153,0.9)',
              boxShadow: '0 0 6px rgba(52,211,153,0.6)',
              flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* ── "Double-click to edit" hint ─────────────────────────────────── */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: isRoot ? -22 : -19,
          left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.18s',
        }}
      >
        <span
          className="group-hover:opacity-100"
          style={{
            fontSize: 9,
            color: 'rgba(148,163,184,0.65)',
            background: 'rgba(10,15,30,0.85)',
            padding: '1px 7px', borderRadius: 4,
            backdropFilter: 'blur(4px)',
            transition: 'opacity 0.18s',
          }}
        >
          doppio click per modificare
        </span>
      </div>
    </div>
  );
}
