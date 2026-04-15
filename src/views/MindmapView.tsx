import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  type Connection,
  type Node,
  type Edge,
  type EdgeTypes,
  getBezierPath,
  BaseEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMindmaps } from '../hooks/useMindmaps';
import {
  Plus,
  Save,
  X,
  Palette,
  FileText,
  Trash2,
  GitBranch,
  LayoutGrid,
  Sparkles,
  CheckCircle2,
  Loader2,
  Circle,
} from 'lucide-react';
import EditableNode from '../components/mindmap/EditableNode';

// ─── Edge: Node ↔ Node — smooth Bezier with animated glow ────────────────────
function NodeLinkEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, markerEnd }: any) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      {/* Glow halo */}
      <path
        d={edgePath}
        fill="none"
        stroke={selected ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.12)'}
        strokeWidth={selected ? 14 : 8}
        style={{ transition: 'stroke-width 0.2s, stroke 0.2s' }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? '#818cf8' : 'rgba(148,163,184,0.45)',
          strokeWidth: selected ? 2.5 : 1.5,
          strokeDasharray: '0',
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
    </>
  );
}

// ─── Edge: Node ↔ Subnode — rigid orthogonal elbow (tree bracket) ─────────────
function SubnodeTreeEdge({ id, sourceX, sourceY, targetX, targetY, selected, markerEnd }: any) {
  // Elbow: horizontal segment from source, then vertical to target Y, then horizontal to target
  const midX = sourceX + (targetX - sourceX) * 0.5;
  const edgePath = `M ${sourceX} ${sourceY} H ${midX} V ${targetY} H ${targetX}`;

  return (
    <>
      {/* Subtle glow */}
      <path
        d={edgePath}
        fill="none"
        stroke={selected ? 'rgba(52,211,153,0.25)' : 'rgba(52,211,153,0.06)'}
        strokeWidth={selected ? 10 : 5}
        style={{ transition: 'stroke-width 0.2s, stroke 0.2s' }}
      />
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={selected ? '#34d399' : 'rgba(100,116,139,0.5)'}
        strokeWidth={selected ? 2 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={markerEnd}
        style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
      />
    </>
  );
}

const edgeTypes: EdgeTypes = {
  'node-link': NodeLinkEdge as any,
  'subnode-tree': SubnodeTreeEdge as any,
};

const nodeTypes = { editable: EditableNode };

// ─── Color Presets ────────────────────────────────────────────────────────────
const COLORS = [
  { hex: '#3b82f6', label: 'Blue' },
  { hex: '#8b5cf6', label: 'Violet' },
  { hex: '#ec4899', label: 'Pink' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#ef4444', label: 'Red' },
  { hex: '#06b6d4', label: 'Cyan' },
  { hex: '#f97316', label: 'Orange' },
];

// Icon presets (reserved for future icon picker in context menu)
// const ICONS = [ { key: 'star', Icon: Star }, { key: 'zap' }, { key: 'circle' } ];

// ─── Auto-layout: true tree (horizontal, left-to-right) ──────────────────────
function getAutoLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  const children: Record<string, string[]> = {};
  const hasParent: Record<string, boolean> = {};
  edges.forEach(e => {
    if (!children[e.source]) children[e.source] = [];
    children[e.source].push(e.target);
    hasParent[e.target] = true;
  });

  const roots = nodes.filter(n => !hasParent[n.id]);
  const positioned: Record<string, { x: number; y: number }> = {};

  // Compute subtree height (number of leaf nodes × spacing)
  const NODE_W = 240;
  const H_GAP = 80;
  const V_GAP_ROOT = 60;
  const V_GAP_SUB = 44;

  function subtreeLeafCount(nodeId: string): number {
    const kids = children[nodeId] || [];
    if (kids.length === 0) return 1;
    return kids.reduce((sum, k) => sum + subtreeLeafCount(k), 0);
  }

  function placeSubtree(nodeId: string, x: number, centerY: number, depth: number) {
    positioned[nodeId] = { x, y: centerY };
    const kids = children[nodeId] || [];
    if (kids.length === 0) return;

    const isRoot = depth === 0;
    const vGap = isRoot ? V_GAP_ROOT : V_GAP_SUB;
    const childX = x + NODE_W + H_GAP;

    // Distribute children vertically around centerY
    const totalLeaves = kids.reduce((sum, k) => sum + subtreeLeafCount(k), 0);
    const totalHeight = (totalLeaves - 1) * vGap;
    let runY = centerY - totalHeight / 2;

    kids.forEach(kid => {
      const leaves = subtreeLeafCount(kid);
      const kidHeight = (leaves - 1) * vGap;
      placeSubtree(kid, childX, runY + kidHeight / 2, depth + 1);
      runY += kidHeight + vGap;
    });
  }

  // Place roots vertically spaced
  let rootY = 0;
  roots.forEach(root => {
    const leaves = subtreeLeafCount(root.id);
    const subtreeH = (leaves - 1) * V_GAP_ROOT;
    placeSubtree(root.id, 0, rootY + subtreeH / 2, 0);
    rootY += subtreeH + V_GAP_ROOT * 2;
  });

  return nodes.map(n => (positioned[n.id] ? { ...n, position: positioned[n.id] } : n));
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 pointer-events-none">
      <div
        style={{
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.1) 0%, transparent 68%)',
          position: 'absolute',
          inset: 0,
        }}
      />
      <div className="relative flex flex-col items-center gap-4 pointer-events-auto">
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18))',
            border: '1.5px solid rgba(99,102,241,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 40px rgba(99,102,241,0.15)',
          }}
        >
          <Sparkles style={{ width: 34, height: 34, color: '#818cf8' }} />
        </div>
        <div className="text-center">
          <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, fontFamily: 'Lora, serif' }}>
            La tua storia è ancora da mappare
          </p>
          <p style={{ color: 'rgba(148,163,184,0.6)', fontSize: 12, marginTop: 4 }}>
            Aggiungi un nodo radice per iniziare la tua mappa narrativa
          </p>
        </div>
        <button
          onClick={onAdd}
          style={{
            padding: '10px 26px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 24px rgba(99,102,241,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Plus style={{ width: 16, height: 16 }} />
          Aggiungi il Primo Nodo
        </button>
      </div>

      {/* Shortcut legend */}
      <div className="relative flex gap-8 text-center" style={{ color: 'rgba(148,163,184,0.45)' }}>
        {[
          { key: 'TAB', desc: 'Aggiungi figlio' },
          { key: 'ENTER', desc: 'Aggiungi fratello' },
          { key: 'DEL', desc: 'Elimina' },
        ].map(({ key, desc }) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <kbd
              style={{
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 6,
                padding: '2px 10px',
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#94a3b8',
              }}
            >
              {key}
            </kbd>
            <span style={{ fontSize: 10 }}>{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Legend Bar ───────────────────────────────────────────────────────────────
function EdgeLegend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        background: 'rgba(15,23,42,0.88)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 10,
        padding: '6px 16px',
        backdropFilter: 'blur(12px)',
        fontSize: 11,
        color: 'rgba(148,163,184,0.7)',
        pointerEvents: 'none',
      }}
    >
      {/* Node-to-node legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <svg width="32" height="16" viewBox="0 0 32 16">
          <path d="M0 8 C 8 0, 24 16, 32 8" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" fill="none" />
        </svg>
        <span>Nodo ↔ Nodo</span>
      </div>
      <div style={{ width: 1, height: 14, background: 'rgba(148,163,184,0.15)' }} />
      {/* Subnode legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <svg width="32" height="16" viewBox="0 0 32 16">
          <path d="M0 8 H16 V2 H32" stroke="rgba(100,116,139,0.65)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Nodo ↔ Subnodo</span>
      </div>
    </div>
  );
}

// ─── Main Canvas ──────────────────────────────────────────────────────────────
function MindmapCanvas() {
  const { mindmap, updateMindmap, loading } = useMindmaps();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: string; notes: string; label: string } | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  // selectedNodeId tracked via nodes[n].selected directly


  const wrapperRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<any>(null);

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mindmap) {
      setNodes(mindmap.nodes || []);
      setEdges(mindmap.edges || []);
    }
  }, [mindmap]);

  // ── Auto-save ──────────────────────────────────────────────────────────────
  const triggerAutoSave = useCallback((n: Node[], e: Edge[]) => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setSaveState('saving');
      await updateMindmap({ nodes: n, edges: e });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2200);
    }, 1500);
  }, [updateMindmap]);

  // ── Connect — default to node-link when connecting manually ───────────────
  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => {
      const targetNode = nodes.find(n => n.id === params.target);
      // If target is a subnode, use tree edge
      const edgeType = targetNode?.data?.isSubnode ? 'subnode-tree' : 'node-link';
      const newEds = addEdge(
        {
          ...params,
          type: edgeType,
          markerEnd: edgeType === 'subnode-tree'
            ? { type: MarkerType.Arrow, color: 'rgba(100,116,139,0.6)', width: 12, height: 12 }
            : { type: MarkerType.ArrowClosed, color: 'rgba(148,163,184,0.5)', width: 10, height: 10 },
          data: { edgeType },
        },
        eds
      );
      triggerAutoSave(nodes, newEds);
      return newEds;
    });
  }, [nodes, triggerAutoSave]);

  // ── Nodes change ──────────────────────────────────────────────────────────
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    const hasDrag = changes.some((c: any) => c.type === 'position' && c.dragging === false);
    if (hasDrag) {
      setNodes(curr => {
        triggerAutoSave(curr, edges);
        return curr;
      });
    }
  }, [onNodesChange, edges, triggerAutoSave]);

  // ── Spawn child subnode (always tree edge) ────────────────────────────────
  const spawnChildNode = useCallback((parentId: string) => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const newId = `node-${Date.now()}`;
    // Place child to the right and aligned vertically
    const siblings = edges.filter(e => e.source === parentId);
    const childY = parentNode.position.y + siblings.length * 54;

    const newNode: Node = {
      id: newId,
      type: 'editable',
      position: { x: parentNode.position.x + 260, y: childY },
      data: { label: 'Nuovo Subnodo', notes: '', color: parentNode.data?.color, isSubnode: true },
    };
    const newEdge: Edge = {
      id: `e-${parentId}-${newId}`,
      source: parentId,
      target: newId,
      type: 'subnode-tree',
      markerEnd: { type: MarkerType.Arrow, color: 'rgba(100,116,139,0.6)', width: 12, height: 12 },
      data: { edgeType: 'subnode-tree' },
    };

    setNodes(nds => {
      const updated = nds.map(n => ({ ...n, selected: false })).concat({ ...newNode, selected: true });
      triggerAutoSave(updated, [...edges, newEdge]);
      return updated;
    });
    setEdges(eds => [...eds, newEdge]);
  }, [nodes, edges, triggerAutoSave]);

  // ── Spawn sibling ─────────────────────────────────────────────────────────
  const spawnSiblingNode = useCallback((siblingId: string) => {
    const siblingNode = nodes.find(n => n.id === siblingId);
    if (!siblingNode) return;
    const incomingEdge = edges.find(e => e.target === siblingId);
    const newId = `node-${Date.now()}`;
    const isSubnode = !!incomingEdge;

    const newNode: Node = {
      id: newId,
      type: 'editable',
      position: { x: siblingNode.position.x, y: siblingNode.position.y + (isSubnode ? 54 : 100) },
      data: {
        label: isSubnode ? 'Nuovo Subnodo' : 'Nuovo Nodo',
        notes: '',
        color: siblingNode.data?.color,
        isSubnode,
      },
    };

    const newEdges: Edge[] = [...edges];
    if (incomingEdge) {
      newEdges.push({
        id: `e-${incomingEdge.source}-${newId}`,
        source: incomingEdge.source,
        target: newId,
        type: 'subnode-tree',
        markerEnd: { type: MarkerType.Arrow, color: 'rgba(100,116,139,0.6)', width: 12, height: 12 },
        data: { edgeType: 'subnode-tree' },
      });
    }

    setNodes(nds => {
      const updated = nds.concat({ ...newNode, selected: true });
      triggerAutoSave(updated, newEdges);
      return updated;
    });
    setEdges(newEdges);
  }, [nodes, edges, triggerAutoSave]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const selectedNode = nodes.find(n => n.selected);
      if (!selectedNode) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        spawnChildNode(selectedNode.id);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        spawnSiblingNode(selectedNode.id);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const selNodes = nodes.filter(n => n.selected);
        if (selNodes.length > 0) {
          const ids = selNodes.map(n => n.id);
          setNodes(nds => {
            const updated = nds.filter(n => !ids.includes(n.id));
            const updatedEdges = edges.filter(e => !ids.includes(e.source) && !ids.includes(e.target));
            setEdges(updatedEdges);
            triggerAutoSave(updated, updatedEdges);
            return updated;
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, spawnChildNode, spawnSiblingNode, triggerAutoSave]);

  // onSelectionChange: selection is read directly from nodes[].selected
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSelectionChange = useCallback((_: { nodes: Node[] }) => {}, []);


  // ── Context menu ──────────────────────────────────────────────────────────
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const pane = wrapperRef.current?.getBoundingClientRect();
    if (!pane) return;
    setMenu({
      id: node.id,
      top: event.clientY < pane.bottom - 280 ? event.clientY : event.clientY - 280,
      left: event.clientX < pane.right - 230 ? event.clientX : event.clientX - 230,
    });
  }, []);

  const onPaneClick = useCallback(() => setMenu(null), []);

  // ── Menu actions ──────────────────────────────────────────────────────────
  const handleMenuAction = (action: string, value?: string) => {
    if (!menu) return;
    const { id } = menu;

    if (action === 'delete') {
      setNodes(nds => {
        const updated = nds.filter(n => n.id !== id);
        const updatedEdges = edges.filter(e => e.source !== id && e.target !== id);
        setEdges(updatedEdges);
        triggerAutoSave(updated, updatedEdges);
        return updated;
      });
      setMenu(null);
    } else if (action === 'addChild') {
      spawnChildNode(id);
      setMenu(null);
    } else if (action === 'color' && value !== undefined) {
      setNodes(nds => nds.map(n => (n.id === id ? { ...n, data: { ...n.data, color: value } } : n)));
    } else if (action === 'icon' && value !== undefined) {
      setNodes(nds => nds.map(n => (n.id === id ? { ...n, data: { ...n.data, icon: value || undefined } } : n)));
    } else if (action === 'notes') {
      const node = nodes.find(n => n.id === id);
      if (node) setNoteModal({ id: node.id, notes: (node.data.notes as string) || '', label: (node.data.label as string) || '' });
      setMenu(null);
    } else if (action === 'toggleSubnode') {
      setNodes(nds =>
        nds.map(n => (n.id === id ? { ...n, data: { ...n.data, isSubnode: !n.data.isSubnode } } : n))
      );
      // Also update connected edges type accordingly
      const node = nodes.find(n => n.id === id);
      if (node) {
        const nextIsSubnode = !node.data.isSubnode;
        setEdges(eds => eds.map(e => {
          if (e.target === id) {
            const newType = nextIsSubnode ? 'subnode-tree' : 'node-link';
            return {
              ...e,
              type: newType,
              markerEnd: nextIsSubnode
                ? { type: MarkerType.Arrow, color: 'rgba(100,116,139,0.6)', width: 12, height: 12 }
                : { type: MarkerType.ArrowClosed, color: 'rgba(148,163,184,0.5)', width: 10, height: 10 },
            };
          }
          return e;
        }));
      }
      setMenu(null);
    }
  };

  // ── Add root node ─────────────────────────────────────────────────────────
  const handleAddRootNode = () => {
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'editable',
      position,
      data: { label: 'Idea Centrale', notes: '', isSubnode: false },
    };
    setNodes(nds => {
      const updated = nds.concat(newNode);
      triggerAutoSave(updated, edges);
      return updated;
    });
  };

  // ── Auto layout ───────────────────────────────────────────────────────────
  const handleAutoLayout = () => {
    const newNodes = getAutoLayout(nodes, edges);
    setNodes(newNodes);
    setTimeout(() => fitView({ padding: 0.12, duration: 700 }), 50);
    triggerAutoSave(newNodes, edges);
  };

  // ── Save notes ────────────────────────────────────────────────────────────
  const saveNoteModal = () => {
    if (!noteModal) return;
    setNodes(nds => {
      const updated = nds.map(n =>
        n.id === noteModal.id ? { ...n, data: { ...n.data, notes: noteModal.notes } } : n
      );
      triggerAutoSave(updated, edges);
      return updated;
    });
    setNoteModal(null);
  };

  // ── Manual save ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveState('saving');
    await updateMindmap({ nodes, edges });
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2200);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3" style={{ color: 'rgba(148,163,184,0.6)' }}>
          <Loader2 style={{ width: 28, height: 28, animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 13 }}>Caricamento mappa narrativa…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: 'Lora, serif',
              background: 'linear-gradient(90deg, #e2e8f0, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Story Mindmap
          </h2>
          <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.55)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 4, padding: '0 5px', fontFamily: 'monospace', fontSize: 10 }}>TAB</kbd>
            figlio ·{' '}
            <kbd style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 4, padding: '0 5px', fontFamily: 'monospace', fontSize: 10 }}>ENTER</kbd>
            fratello ·{' '}
            <kbd style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 4, padding: '0 5px', fontFamily: 'monospace', fontSize: 10 }}>DEL</kbd>
            elimina · Tasto destro per le opzioni
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoLayout}
            title="Organizza automaticamente"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              background: 'rgba(30,41,59,0.8)',
              border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: 10, color: '#94a3b8', fontSize: 12, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.color = '#818cf8'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <LayoutGrid style={{ width: 14, height: 14 }} />
            Auto-layout
          </button>

          <button
            onClick={handleAddRootNode}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              background: 'rgba(30,41,59,0.8)',
              border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: 10, color: '#e2e8f0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.8)'; e.currentTarget.style.borderColor = 'rgba(148,163,184,0.15)'; }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            Aggiungi Nodo
          </button>

          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px',
              background: saveState === 'saved'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: saveState === 'saving' ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: saveState === 'saved'
                ? '0 4px 16px rgba(16,185,129,0.3)'
                : '0 4px 16px rgba(99,102,241,0.35)',
              opacity: saveState === 'saving' ? 0.7 : 1,
            }}
          >
            {saveState === 'saving' ? (
              <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
            ) : saveState === 'saved' ? (
              <CheckCircle2 style={{ width: 14, height: 14 }} />
            ) : (
              <Save style={{ width: 14, height: 14 }} />
            )}
            {saveState === 'saving' ? 'Salvataggio…' : saveState === 'saved' ? 'Salvato!' : 'Salva'}
          </button>
        </div>
      </div>

      {/* ── Main Canvas ───────────────────────────────────────────────────────── */}
      <div
        ref={wrapperRef}
        className="flex-1 relative overflow-hidden"
        style={{
          borderRadius: 20,
          border: '1.5px solid rgba(100,116,139,0.2)',
          background: 'rgba(10,15,30,0.97)',
          boxShadow: '0 4px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          onNodeDragStart={onPaneClick}
          onSelectionChange={onSelectionChange}
          colorMode="dark"
          fitView
          minZoom={0.06}
          maxZoom={3}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'node-link' }}
        >
          <Background
            color="rgba(100,116,139,0.1)"
            gap={32}
            size={1}
          />
          <MiniMap
            nodeColor={(n: Node) => {
              const c = n.data?.color;
              if (typeof c === 'string' && c.startsWith('#')) return c;
              return n.data?.isSubnode ? '#1e293b' : '#6366f1';
            }}
            maskColor="rgba(10,15,30,0.72)"
            style={{
              background: 'rgba(10,15,30,0.9)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 12,
            }}
          />
          <Controls
            style={{
              background: 'rgba(15,23,42,0.88)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 12,
            }}
          />
        </ReactFlow>

        {nodes.length === 0 && <EmptyState onAdd={handleAddRootNode} />}

        {/* Legend */}
        {nodes.length > 0 && <EdgeLegend />}

        {/* ── Context Menu ─────────────────────────────────────────────────── */}
        {menu && (
          <div
            style={{
              position: 'absolute',
              top: menu.top,
              left: menu.left,
              zIndex: 100,
              background: 'rgba(10,15,30,0.98)',
              border: '1.5px solid rgba(148,163,184,0.12)',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              backdropFilter: 'blur(20px)',
              padding: 8,
              width: 220,
              fontSize: 12,
            }}
          >
            <div
              style={{
                padding: '6px 10px 8px',
                color: 'rgba(148,163,184,0.45)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              Opzioni Nodo
            </div>

            <CtxButton
              icon={<GitBranch style={{ width: 13, height: 13, color: '#818cf8' }} />}
              label="Aggiungi Figlio (TAB)"
              onClick={() => handleMenuAction('addChild')}
            />
            <CtxButton
              icon={<FileText style={{ width: 13, height: 13, color: '#34d399' }} />}
              label="Modifica Note"
              onClick={() => handleMenuAction('notes')}
            />

            {/* Toggle subnode */}
            {(() => {
              const targetNode = nodes.find(n => n.id === menu.id);
              const isSubnode = targetNode?.data?.isSubnode;
              return (
                <CtxButton
                  icon={<Circle style={{ width: 13, height: 13, color: '#f59e0b' }} />}
                  label={isSubnode ? 'Converti a Nodo' : 'Converti a Subnodo'}
                  onClick={() => handleMenuAction('toggleSubnode')}
                />
              );
            })()}

            <div style={{ height: 1, background: 'rgba(148,163,184,0.08)', margin: '6px 0' }} />

            {/* Color swatches */}
            <div style={{ padding: '4px 10px 6px' }}>
              <div
                style={{
                  color: 'rgba(148,163,184,0.45)',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Palette style={{ width: 11, height: 11, color: '#c084fc' }} />
                Colore
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {COLORS.map(({ hex, label }) => (
                  <button
                    key={hex}
                    title={label}
                    onClick={() => handleMenuAction('color', hex)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: hex,
                      border: '2px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.transform = 'scale(1.3)';
                      e.currentTarget.style.boxShadow = `0 0 8px ${hex}88`;
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                ))}
                {/* Custom color */}
                <div style={{ position: 'relative', width: 22, height: 22 }}>
                  <input
                    type="color"
                    onChange={e => handleMenuAction('color', e.target.value)}
                    title="Colore personalizzato"
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                  />
                  <div
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                      border: '2px solid rgba(255,255,255,0.15)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            <CtxButton
              icon={<X style={{ width: 13, height: 13, color: '#94a3b8' }} />}
              label="Reimposta Colore"
              onClick={() => handleMenuAction('color', '')}
            />

            <div style={{ height: 1, background: 'rgba(148,163,184,0.08)', margin: '6px 0' }} />

            <CtxButton
              icon={<Trash2 style={{ width: 13, height: 13, color: '#f87171' }} />}
              label="Elimina Nodo"
              onClick={() => handleMenuAction('delete')}
              danger
            />
          </div>
        )}
      </div>

      {/* ── Notes Modal ─────────────────────────────────────────────────────────── */}
      {noteModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(14px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={e => { if (e.target === e.currentTarget) setNoteModal(null); }}
        >
          <div
            style={{
              background: 'rgba(10,15,30,0.99)',
              border: '1.5px solid rgba(148,163,184,0.14)',
              borderRadius: 20,
              boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              width: '100%', maxWidth: 560,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(148,163,184,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(30,41,59,0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText style={{ width: 18, height: 18, color: '#818cf8' }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, fontFamily: 'Lora, serif', color: '#e2e8f0' }}>
                    {noteModal.label || 'Note del Nodo'}
                  </p>
                  <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', marginTop: 1 }}>
                    Note, lore e background
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNoteModal(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(148,163,184,0.5)', cursor: 'pointer', padding: 4, borderRadius: 8 }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <textarea
                autoFocus
                style={{
                  width: '100%', height: 220,
                  background: 'rgba(30,41,59,0.4)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: 12,
                  color: '#e2e8f0', fontSize: 14, lineHeight: 1.7,
                  padding: '12px 14px', resize: 'none', outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(148,163,184,0.12)')}
                placeholder="Scrivi informazioni di background, lore, punti narrativi o qualsiasi nota su questo concetto…"
                value={noteModal.notes}
                onChange={e => setNoteModal({ ...noteModal, notes: e.target.value })}
              />
            </div>

            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid rgba(148,163,184,0.1)',
                display: 'flex', justifyContent: 'flex-end', gap: 10,
                background: 'rgba(10,15,30,0.6)',
              }}
            >
              <button
                onClick={() => setNoteModal(null)}
                style={{
                  padding: '8px 18px',
                  background: 'rgba(30,41,59,0.6)',
                  border: '1px solid rgba(148,163,184,0.15)',
                  borderRadius: 10, color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Annulla
              </button>
              <button
                onClick={saveNoteModal}
                style={{
                  padding: '8px 22px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', borderRadius: 10,
                  color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                }}
              >
                Salva Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .react-flow__node { cursor: grab; }
        .react-flow__node:active { cursor: grabbing; }
        .react-flow__handle { opacity: 0; transition: opacity 0.18s; width: 10px !important; height: 10px !important; }
        .react-flow__node:hover .react-flow__handle { opacity: 1; }
        .react-flow__controls button {
          background: rgba(15,23,42,0.9) !important;
          border-color: rgba(148,163,184,0.12) !important;
          color: #94a3b8 !important;
        }
        .react-flow__controls button:hover {
          background: rgba(99,102,241,0.15) !important;
          color: #818cf8 !important;
        }
        .react-flow__attribution { display: none !important; }
      `}</style>
    </div>
  );
}

// ─── Context menu button ──────────────────────────────────────────────────────
function CtxButton({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '7px 10px', background: 'none', border: 'none', borderRadius: 10,
        color: danger ? '#f87171' : '#cbd5e1', fontSize: 12, cursor: 'pointer',
        textAlign: 'left', transition: 'background 0.15s',
      }}
      onMouseOver={e => (e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.07)')}
      onMouseOut={e => (e.currentTarget.style.background = 'none')}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export const MindmapView: React.FC = () => (
  <ReactFlowProvider>
    <MindmapCanvas />
  </ReactFlowProvider>
);
