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
  EdgeLabelRenderer,
  getSmoothStepPath,
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
  Maximize2,
  LayoutGrid,
  Sparkles,
  CheckCircle2,
  Loader2,
  Info,
  Star,
  Zap,
  Circle,
} from 'lucide-react';
import EditableNode from '../components/mindmap/EditableNode';

// ─── Custom Edge ──────────────────────────────────────────────────────────────
function AnimatedEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, markerEnd, data }: any) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  return (
    <>
      {/* Glow layer */}
      <path
        d={edgePath}
        fill="none"
        stroke="rgba(96,165,250,0.12)"
        strokeWidth={selected ? 12 : 6}
        style={{ transition: 'stroke-width 0.2s' }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? '#60a5fa' : 'rgba(148,163,184,0.5)',
          strokeWidth: selected ? 2.5 : 1.5,
          transition: 'stroke 0.2s, stroke-width 0.2s',
          strokeDasharray: data?.dashed ? '6,4' : undefined,
        }}
      />
    </>
  );
}

const edgeTypes: EdgeTypes = { animated: AnimatedEdge as any };

// ─── Node Types ───────────────────────────────────────────────────────────────
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

const ICONS = [
  { key: 'star', Icon: Star },
  { key: 'zap', Icon: Zap },
  { key: 'circle', Icon: Circle },
];

// ─── Auto-layout helper (simple radial) ──────────────────────────────────────
function getAutoLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  // Build adjacency: parent -> [children]
  const children: Record<string, string[]> = {};
  const hasParent: Record<string, boolean> = {};
  edges.forEach(e => {
    if (!children[e.source]) children[e.source] = [];
    children[e.source].push(e.target);
    hasParent[e.target] = true;
  });

  const roots = nodes.filter(n => !hasParent[n.id]);
  const positioned: Record<string, { x: number; y: number }> = {};
  const H_GAP = 220;
  const V_GAP = 110;

  let rootX = 0;

  function place(nodeId: string, x: number, y: number) {
    positioned[nodeId] = { x, y };
    const kids = children[nodeId] || [];
    const startY = y - ((kids.length - 1) * V_GAP) / 2;
    kids.forEach((kid, i) => {
      place(kid, x + H_GAP, startY + i * V_GAP);
    });
  }

  roots.forEach(root => {
    place(root.id, rootX, 0);
    const subtreeHeight = (children[root.id]?.length || 1) * V_GAP;
    rootX += subtreeHeight + V_GAP;
  });

  return nodes.map(n =>
    positioned[n.id] ? { ...n, position: positioned[n.id] } : n
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 pointer-events-none">
      <div
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, transparent 70%)',
          position: 'absolute',
          inset: 0,
        }}
      />
      <div className="relative flex flex-col items-center gap-4 pointer-events-auto">
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
            border: '1.5px solid rgba(59,130,246,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles style={{ width: 32, height: 32, color: '#60a5fa' }} />
        </div>
        <div className="text-center">
          <p className="text-slate-300 font-semibold text-base">Your story map is empty</p>
          <p className="text-slate-500 text-sm mt-1">Add a root node to start building your narrative web</p>
        </div>
        <button
          onClick={onAdd}
          style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
            transition: 'all 0.2s',
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          Add Your First Node
        </button>
      </div>
      <div className="relative flex gap-8 text-center" style={{ color: 'rgba(148,163,184,0.5)' }}>
        {[
          { key: 'TAB', desc: 'Add child node' },
          { key: 'ENTER', desc: 'Add sibling' },
          { key: 'DEL', desc: 'Delete selected' },
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

// ─── Main Canvas ──────────────────────────────────────────────────────────────
function MindmapCanvas() {
  const { mindmap, updateMindmap, loading } = useMindmaps();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition, fitView, setNodes: rfSetNodes } = useReactFlow();

  // UI state
  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: string; notes: string; label: string } | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [detailPanel, setDetailPanel] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<any>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
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

  // ── Connect ──────────────────────────────────────────────────────────────
  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => {
      const newEds = addEdge(
        {
          ...params,
          type: 'animated',
          markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(148,163,184,0.6)' },
          data: {},
        },
        eds
      );
      triggerAutoSave(nodes, newEds);
      return newEds;
    });
  }, [nodes, triggerAutoSave]);

  // ── Nodes change with auto-save ───────────────────────────────────────────
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    // Debounced save on positional drag
    const hasDrag = changes.some((c: any) => c.type === 'position' && c.dragging === false);
    if (hasDrag) {
      setNodes(curr => {
        triggerAutoSave(curr, edges);
        return curr;
      });
    }
  }, [onNodesChange, edges, triggerAutoSave]);

  // ── Spawn helpers ─────────────────────────────────────────────────────────
  const spawnChildNode = useCallback((parentId: string) => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const newId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newId,
      type: 'editable',
      position: { x: parentNode.position.x + 220, y: parentNode.position.y },
      data: { label: 'New Subnode', notes: '', color: parentNode.data?.color, isSubnode: true },
    };
    const newEdge: Edge = {
      id: `e-${parentId}-${newId}`,
      source: parentId,
      target: newId,
      type: 'animated',
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(148,163,184,0.6)' },
      data: {},
    };
    setNodes(nds => {
      const updated = nds.map(n => ({ ...n, selected: n.id === newId })).concat({ ...newNode, selected: true });
      triggerAutoSave(updated, [...edges, newEdge]);
      return updated;
    });
    setEdges(eds => [...eds, newEdge]);
  }, [nodes, edges, triggerAutoSave]);

  const spawnSiblingNode = useCallback((siblingId: string) => {
    const siblingNode = nodes.find(n => n.id === siblingId);
    if (!siblingNode) return;
    const incomingEdge = edges.find(e => e.target === siblingId);
    const newId = `node-${Date.now()}`;

    const newNode: Node = {
      id: newId,
      type: 'editable',
      position: { x: siblingNode.position.x, y: siblingNode.position.y + 110 },
      data: {
        label: incomingEdge ? 'New Node' : 'New Root',
        notes: '',
        color: siblingNode.data?.color,
        isSubnode: siblingNode.data?.isSubnode,
      },
    };

    const newEdges: Edge[] = [...edges];
    if (incomingEdge) {
      newEdges.push({
        id: `e-${incomingEdge.source}-${newId}`,
        source: incomingEdge.source,
        target: newId,
        type: 'animated',
        markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(148,163,184,0.6)' },
        data: {},
      });
    }

    setNodes(nds => {
      const updated = nds.concat({ ...newNode, selected: true });
      triggerAutoSave(updated, newEdges);
      return updated;
    });
    setEdges(newEdges);
  }, [nodes, edges, triggerAutoSave]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
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
          setNodes(nds => nds.filter(n => !ids.includes(n.id)));
          setEdges(eds => eds.filter(e => !ids.includes(e.source) && !ids.includes(e.target)));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, spawnChildNode, spawnSiblingNode]);

  // ── Selection tracking ────────────────────────────────────────────────────
  const onSelectionChange = useCallback(({ nodes: sel }: { nodes: Node[] }) => {
    setSelectedNodeId(sel.length === 1 ? sel[0].id : null);
  }, []);

  // ── Context menu ──────────────────────────────────────────────────────────
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const pane = wrapperRef.current?.getBoundingClientRect();
    if (!pane) return;
    setMenu({
      id: node.id,
      top: event.clientY < pane.bottom - 260 ? event.clientY : event.clientY - 260,
      left: event.clientX < pane.right - 220 ? event.clientX : event.clientX - 220,
    });
  }, []);

  const onPaneClick = useCallback(() => setMenu(null), []);

  // ── Menu actions ──────────────────────────────────────────────────────────
  const handleMenuAction = (action: string, value?: string) => {
    if (!menu) return;
    const { id } = menu;

    if (action === 'delete') {
      setNodes(nds => nds.filter(n => n.id !== id));
      setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
      setMenu(null);
    } else if (action === 'addChild') {
      spawnChildNode(id);
      setMenu(null);
    } else if (action === 'color' && value) {
      setNodes(nds =>
        nds.map(n => (n.id === id ? { ...n, data: { ...n.data, color: value } } : n))
      );
    } else if (action === 'icon' && value !== undefined) {
      setNodes(nds =>
        nds.map(n => (n.id === id ? { ...n, data: { ...n.data, icon: value || undefined } } : n))
      );
    } else if (action === 'notes') {
      const node = nodes.find(n => n.id === id);
      if (node) setNoteModal({ id: node.id, notes: (node.data.notes as string) || '', label: (node.data.label as string) || '' });
      setMenu(null);
    } else if (action === 'toggleRoot') {
      setNodes(nds =>
        nds.map(n => (n.id === id ? { ...n, data: { ...n.data, isSubnode: !n.data.isSubnode } } : n))
      );
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
      data: { label: 'Main Focus', notes: '', isSubnode: false },
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
    setTimeout(() => fitView({ padding: 0.1, duration: 600 }), 50);
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

  // ─────────────────────────────────────────────────────────────────────────
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3" style={{ color: 'rgba(148,163,184,0.6)' }}>
          <Loader2 style={{ width: 28, height: 28, animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 13 }}>Loading your story map…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
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
          <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', marginTop: 2 }}>
            <kbd
              style={{
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 4,
                padding: '0 5px',
                fontFamily: 'monospace',
                fontSize: 10,
              }}
            >
              TAB
            </kbd>{' '}
            child ·{' '}
            <kbd
              style={{
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 4,
                padding: '0 5px',
                fontFamily: 'monospace',
                fontSize: 10,
              }}
            >
              ENTER
            </kbd>{' '}
            sibling ·{' '}
            <kbd
              style={{
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 4,
                padding: '0 5px',
                fontFamily: 'monospace',
                fontSize: 10,
              }}
            >
              DEL
            </kbd>{' '}
            delete · Right-click for options
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-layout */}
          <button
            onClick={handleAutoLayout}
            title="Auto-arrange nodes"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              background: 'rgba(30,41,59,0.8)',
              border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: 10,
              color: '#94a3b8',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <LayoutGrid style={{ width: 14, height: 14 }} />
            Auto-layout
          </button>

          {/* Add root */}
          <button
            onClick={handleAddRootNode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              background: 'rgba(30,41,59,0.8)',
              border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: 10,
              color: '#e2e8f0',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            Add Node
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              background:
                saveState === 'saved'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #3b82f6, #6366f1)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: saveState === 'saving' ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow:
                saveState === 'saved'
                  ? '0 4px 16px rgba(16,185,129,0.3)'
                  : '0 4px 16px rgba(59,130,246,0.3)',
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
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Main Canvas ───────────────────────────────────────────────────── */}
      <div
        ref={wrapperRef}
        className="flex-1 relative overflow-hidden"
        style={{
          borderRadius: 20,
          border: '1.5px solid rgba(100,116,139,0.2)',
          background: 'rgba(15,23,42,0.95)',
          boxShadow: '0 4px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
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
          minZoom={0.08}
          maxZoom={3}
          proOptions={{ hideAttribution: true }}
        >
          {/* Grid background */}
          <Background
            color="rgba(100,116,139,0.15)"
            gap={28}
            size={1.5}
          />

          {/* Minimap */}
          <MiniMap
            nodeColor={(n: Node) => {
              const c = n.data?.color;
              if (typeof c === 'string' && c.startsWith('#')) return c;
              return n.data?.isSubnode ? '#334155' : '#3b82f6';
            }}
            maskColor="rgba(15,23,42,0.7)"
            style={{
              background: 'rgba(15,23,42,0.85)',
              border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: 12,
            }}
          />

          {/* Controls */}
          <Controls
            style={{
              background: 'rgba(15,23,42,0.85)',
              border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: 12,
            }}
          />
        </ReactFlow>

        {/* Empty state */}
        {nodes.length === 0 && <EmptyState onAdd={handleAddRootNode} />}

        {/* ── Context Menu ────────────────────────────────────────────────── */}
        {menu && (
          <div
            style={{
              position: 'absolute',
              top: menu.top,
              left: menu.left,
              zIndex: 100,
              background: 'rgba(15,23,42,0.97)',
              border: '1.5px solid rgba(148,163,184,0.15)',
              borderRadius: 16,
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(20px)',
              padding: 8,
              width: 210,
              fontSize: 12,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '6px 10px 8px',
                color: 'rgba(148,163,184,0.5)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              Node Options
            </div>

            <CtxButton
              icon={<GitBranch style={{ width: 13, height: 13, color: '#60a5fa' }} />}
              label="Add Child (TAB)"
              onClick={() => handleMenuAction('addChild')}
            />
            <CtxButton
              icon={<FileText style={{ width: 13, height: 13, color: '#34d399' }} />}
              label="Edit Notes"
              onClick={() => handleMenuAction('notes')}
            />

            <div style={{ height: 1, background: 'rgba(148,163,184,0.1)', margin: '6px 0' }} />

            {/* Color swatches */}
            <div style={{ padding: '4px 10px 6px' }}>
              <div
                style={{
                  color: 'rgba(148,163,184,0.5)',
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
                Color
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {COLORS.map(({ hex, label }) => (
                  <button
                    key={hex}
                    title={label}
                    onClick={() => handleMenuAction('color', hex)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: hex,
                      border: '2px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.25)')}
                    onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                ))}
                {/* Custom color */}
                <div style={{ position: 'relative', width: 20, height: 20 }}>
                  <input
                    type="color"
                    onChange={e => handleMenuAction('color', e.target.value)}
                    title="Custom color"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer',
                    }}
                  />
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                      border: '2px solid rgba(255,255,255,0.15)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Reset color */}
            <CtxButton
              icon={<X style={{ width: 13, height: 13, color: '#94a3b8' }} />}
              label="Reset Color"
              onClick={() => handleMenuAction('color', '')}
            />

            <div style={{ height: 1, background: 'rgba(148,163,184,0.1)', margin: '6px 0' }} />

            <CtxButton
              icon={<Trash2 style={{ width: 13, height: 13, color: '#f87171' }} />}
              label="Delete Node"
              onClick={() => handleMenuAction('delete')}
              danger
            />
          </div>
        )}
      </div>

      {/* ── Notes Modal ───────────────────────────────────────────────────── */}
      {noteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={e => { if (e.target === e.currentTarget) setNoteModal(null); }}
        >
          <div
            style={{
              background: 'rgba(15,23,42,0.98)',
              border: '1.5px solid rgba(148,163,184,0.15)',
              borderRadius: 20,
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              width: '100%',
              maxWidth: 560,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(148,163,184,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(30,41,59,0.4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText style={{ width: 18, height: 18, color: '#60a5fa' }} />
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      fontFamily: 'Lora, serif',
                      color: '#e2e8f0',
                    }}
                  >
                    {noteModal.label || 'Node Notes'}
                  </p>
                  <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', marginTop: 1 }}>
                    Full notes, lore, and background
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNoteModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(148,163,184,0.5)',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 8,
                }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Textarea */}
            <div style={{ padding: 20, flex: 1 }}>
              <textarea
                autoFocus
                style={{
                  width: '100%',
                  height: 220,
                  background: 'rgba(30,41,59,0.4)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: 12,
                  color: '#e2e8f0',
                  fontSize: 14,
                  lineHeight: 1.7,
                  padding: '12px 14px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                }}
                placeholder="Write full background information, lore, plot points, or any notes about this concept…"
                value={noteModal.notes}
                onChange={e => setNoteModal({ ...noteModal, notes: e.target.value })}
              />
            </div>

            {/* Modal footer */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid rgba(148,163,184,0.1)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                background: 'rgba(15,23,42,0.6)',
              }}
            >
              <button
                onClick={() => setNoteModal(null)}
                style={{
                  padding: '8px 18px',
                  background: 'rgba(30,41,59,0.6)',
                  border: '1px solid rgba(148,163,184,0.15)',
                  borderRadius: 10,
                  color: '#94a3b8',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveNoteModal}
                style={{
                  padding: '8px 20px',
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
                }}
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spin keyframe injected once */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .react-flow__node { cursor: grab; }
        .react-flow__node:active { cursor: grabbing; }
        .react-flow__handle { opacity: 0; transition: opacity 0.2s; }
        .react-flow__node:hover .react-flow__handle { opacity: 1; }
        .react-flow__controls button {
          background: rgba(30,41,59,0.9) !important;
          border-color: rgba(148,163,184,0.15) !important;
          color: #94a3b8 !important;
        }
        .react-flow__controls button:hover {
          background: rgba(59,130,246,0.15) !important;
          color: #60a5fa !important;
        }
      `}</style>
    </div>
  );
}

// ─── Context menu button helper ────────────────────────────────────────────────
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
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '7px 10px',
        background: 'none',
        border: 'none',
        borderRadius: 10,
        color: danger ? '#f87171' : '#cbd5e1',
        fontSize: 12,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s',
      }}
      onMouseOver={e =>
        (e.currentTarget.style.background = danger
          ? 'rgba(239,68,68,0.1)'
          : 'rgba(148,163,184,0.08)')
      }
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
