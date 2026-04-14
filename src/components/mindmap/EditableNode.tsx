import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { FileText, Star, Zap, Circle, Square, Diamond } from 'lucide-react';

// ─── Node Shape Types ────────────────────────────────────────────────────────
export type NodeShape = 'rounded' | 'pill' | 'diamond' | 'hexagon' | 'circle';

const NODE_ICONS: Record<string, React.FC<any>> = {
  star: Star,
  zap: Zap,
  circle: Circle,
  square: Square,
  diamond: Diamond,
};

// ─── Helper: derive readable text color from hex ─────────────────────────────
function getTextColor(hex: string): string {
  if (!hex || !hex.startsWith('#')) return '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // WCAG luminance
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 140 ? '#1e293b' : '#ffffff';
}

// ─── Handle Component ─────────────────────────────────────────────────────────
const StyledHandle: React.FC<{
  type: 'source' | 'target';
  position: Position;
  id?: string;
  isConnectable?: boolean;
}> = ({ type, position, id, isConnectable }) => (
  <Handle
    type={type}
    position={position}
    id={id}
    isConnectable={isConnectable}
    style={{
      width: 10,
      height: 10,
      background: 'rgba(148, 163, 184, 0.4)',
      border: '2px solid rgba(148, 163, 184, 0.6)',
      borderRadius: '50%',
      transition: 'all 0.2s',
    }}
  />
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EditableNode({ id, data, isConnectable, selected }: any) {
  const { setNodes } = useReactFlow();
  const [label, setLabel] = useState(data.label || '');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data.label !== label) setLabel(data.label || '');
  }, [data.label]);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
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
      (document.activeElement as HTMLElement)?.blur();
    }
  };

  // ── Derive visual properties ──────────────────────────────────────────────
  const isHex = typeof data.color === 'string' && data.color.startsWith('#');
  const nodeColor = isHex ? data.color : null;
  const textColor = nodeColor ? getTextColor(nodeColor) : '#ffffff';
  const isRoot = !data.isSubnode;
  const hasNotes = typeof data.notes === 'string' && data.notes.trim().length > 0;
  const IconComponent = data.icon ? NODE_ICONS[data.icon] : null;

  // ── Dynamic Styles ────────────────────────────────────────────────────────
  const baseGradient = nodeColor
    ? `linear-gradient(135deg, ${nodeColor}cc, ${nodeColor}88)`
    : isRoot
    ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.25))'
    : 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))';

  const borderColor = selected
    ? 'rgba(96, 165, 250, 0.9)'
    : nodeColor
    ? nodeColor + '88'
    : isRoot
    ? 'rgba(59, 130, 246, 0.5)'
    : 'rgba(148, 163, 184, 0.2)';

  const glowColor = selected
    ? '0 0 0 3px rgba(96,165,250,0.3), 0 8px 32px rgba(0,0,0,0.4)'
    : isRoot
    ? '0 4px 24px rgba(59,130,246,0.15), 0 8px 32px rgba(0,0,0,0.3)'
    : '0 2px 12px rgba(0,0,0,0.3)';

  const shapeStyle: React.CSSProperties = isRoot
    ? { borderRadius: '16px', minWidth: 160, maxWidth: 240 }
    : { borderRadius: '50px', minWidth: 100, maxWidth: 180 };

  return (
    <div
      className="relative group nodrag"
      style={{
        ...shapeStyle,
        background: baseGradient,
        backdropFilter: 'blur(12px)',
        border: `1.5px solid ${borderColor}`,
        boxShadow: glowColor,
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: selected ? 'scale(1.04)' : 'scale(1)',
        color: textColor,
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* Handles — all 4 directions */}
      <StyledHandle type="target" position={Position.Top} id="top-target" isConnectable={isConnectable} />
      <StyledHandle type="target" position={Position.Left} id="left-target" isConnectable={isConnectable} />
      <StyledHandle type="source" position={Position.Bottom} id="bottom-source" isConnectable={isConnectable} />
      <StyledHandle type="source" position={Position.Right} id="right-source" isConnectable={isConnectable} />

      {/* Inner content */}
      <div
        className="flex items-center gap-2 px-4"
        style={{ padding: isRoot ? '10px 14px' : '7px 14px' }}
      >
        {/* Optional icon */}
        {IconComponent && (
          <IconComponent
            style={{ width: isRoot ? 14 : 12, height: isRoot ? 14 : 12, opacity: 0.8, flexShrink: 0 }}
          />
        )}

        {/* Editable label */}
        {isEditing ? (
          <input
            ref={inputRef}
            value={label}
            onChange={onLabelChange}
            onBlur={() => setIsEditing(false)}
            onKeyDown={onLabelKeyDown}
            className="bg-transparent w-full focus:outline-none"
            style={{
              font: 'inherit',
              color: textColor,
              fontSize: isRoot ? 13 : 11,
              fontWeight: isRoot ? 700 : 600,
              minWidth: 60,
            }}
          />
        ) : (
          <span
            style={{
              fontSize: isRoot ? 13 : 11,
              fontWeight: isRoot ? 700 : 600,
              letterSpacing: isRoot ? '0.01em' : '0.005em',
              lineHeight: 1.3,
              color: textColor,
              userSelect: 'none',
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={label}
          >
            {label || (isRoot ? 'Main Focus' : 'Sub-concept')}
          </span>
        )}

        {/* Notes badge */}
        {hasNotes && (
          <div
            title="Has notes"
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'rgba(52, 211, 153, 0.9)',
              boxShadow: '0 0 6px rgba(52,211,153,0.6)',
              flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* Root node top accent line */}
      {isRoot && !nodeColor && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '20%',
            right: '20%',
            height: 2,
            borderRadius: '0 0 2px 2px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            opacity: selected ? 1 : 0.6,
          }}
        />
      )}

      {/* Hover "double-click to edit" hint */}
      <div
        className="absolute -bottom-6 left-0 right-0 flex justify-center pointer-events-none"
        style={{ opacity: 0, transition: 'opacity 0.2s' }}
      >
        <span
          className="group-hover:opacity-100"
          style={{
            fontSize: 9,
            color: 'rgba(148,163,184,0.7)',
            background: 'rgba(15,23,42,0.8)',
            padding: '1px 6px',
            borderRadius: 4,
            backdropFilter: 'blur(4px)',
            transition: 'opacity 0.2s',
          }}
        >
          double-click to edit
        </span>
      </div>
    </div>
  );
}
