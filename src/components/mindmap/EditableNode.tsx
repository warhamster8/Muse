import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';

// ─── Helper: readable text color from hex ────────────────────────────────────
function getTextColor(hex: string): string {
  if (!hex || !hex.startsWith('#')) return '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? '#1e293b' : '#ffffff';
}

// ─── Handle ───────────────────────────────────────────────────────────────────
const Connector: React.FC<{
  type: 'source' | 'target';
  position: Position;
  id: string;
  isConnectable?: boolean;
}> = ({ type, position, id, isConnectable }) => (
  <Handle
    type={type}
    position={position}
    id={id}
    isConnectable={isConnectable}
    className="mindmap-handle"
    style={{
      width: 10,
      height: 10,
      background: 'rgba(96,165,250,0.35)',
      border: '2px solid rgba(96,165,250,0.55)',
      borderRadius: '50%',
      transition: 'opacity 0.18s, transform 0.18s',
      zIndex: 10,
    }}
  />
);

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
    setNodes(nds =>
      nds.map(n => (n.id === id ? { ...n, data: { ...n.data, ...updates } } : n))
    );
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

  // ── Visuals ──────────────────────────────────────────────────────────────
  const isHex = typeof data.color === 'string' && data.color.startsWith('#');
  const nodeColor = isHex ? data.color : null;
  const textColor = nodeColor ? getTextColor(nodeColor) : '#f1f5f9';
  const isRoot = !data.isSubnode;
  const hasNotes = typeof data.notes === 'string' && data.notes.trim().length > 0;

  const bg = nodeColor
    ? `linear-gradient(135deg, ${nodeColor}dd, ${nodeColor}99)`
    : isRoot
    ? 'linear-gradient(135deg, rgba(59,130,246,0.22), rgba(139,92,246,0.22))'
    : 'linear-gradient(135deg, rgba(30,41,59,0.85), rgba(15,23,42,0.85))';

  const borderColor = selected
    ? 'rgba(96,165,250,0.85)'
    : nodeColor
    ? nodeColor + '66'
    : isRoot
    ? 'rgba(59,130,246,0.4)'
    : 'rgba(148,163,184,0.18)';

  const shadow = selected
    ? '0 0 0 3px rgba(96,165,250,0.25), 0 8px 32px rgba(0,0,0,0.5)'
    : isRoot
    ? '0 4px 20px rgba(59,130,246,0.12), 0 2px 8px rgba(0,0,0,0.3)'
    : '0 2px 10px rgba(0,0,0,0.25)';

  const shapeStyle: React.CSSProperties = isRoot
    ? { borderRadius: 14, minWidth: 150, maxWidth: 240 }
    : { borderRadius: 40, minWidth: 90, maxWidth: 170 };

  return (
    <div
      style={{
        ...shapeStyle,
        position: 'relative',
        background: bg,
        backdropFilter: 'blur(14px)',
        border: `1.5px solid ${borderColor}`,
        boxShadow: shadow,
        transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
        color: textColor,
        cursor: 'grab',
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* ── Handles: Left = incoming (target), Right = outgoing (source) ───── */}
      {/* Tree handles — primary for hierarchy */}
      <Connector type="target" position={Position.Left}  id="left-in"  isConnectable={isConnectable} />
      <Connector type="source" position={Position.Right} id="right-out" isConnectable={isConnectable} />
      {/* Secondary handles — top/bottom for peer connections */}
      <Connector type="target" position={Position.Top}    id="top-in"    isConnectable={isConnectable} />
      <Connector type="source" position={Position.Bottom} id="bottom-out" isConnectable={isConnectable} />

      {/* Root accent bar */}
      {isRoot && !nodeColor && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '15%',
            bottom: '15%',
            width: 3,
            borderRadius: '0 2px 2px 0',
            background: 'linear-gradient(180deg, #3b82f6, #8b5cf6)',
            opacity: selected ? 1 : 0.7,
          }}
        />
      )}

      {/* Content */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: isRoot ? '10px 14px 10px 16px' : '7px 14px',
        }}
      >
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
              fontWeight: isRoot ? 700 : 600,
              fontFamily: 'Inter, sans-serif',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: isRoot ? 13 : 11,
              fontWeight: isRoot ? 700 : 600,
              letterSpacing: '0.01em',
              color: textColor,
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              userSelect: 'none',
            }}
            title={label}
          >
            {label || (isRoot ? 'Main Focus' : 'Sub-concept')}
          </span>
        )}

        {/* Notes dot */}
        {hasNotes && (
          <span
            title="Has notes"
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 6px rgba(52,211,153,0.7)',
              flexShrink: 0,
            }}
          />
        )}
      </div>
    </div>
  );
}
