import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMindmaps } from '../hooks/useMindmaps';
import { Plus, Save, X, Palette, FileText, Trash2, GitBranch } from 'lucide-react';
import EditableNode from '../components/mindmap/EditableNode';

const nodeTypes = { editable: EditableNode };

function MindmapCanvas() {
  const { mindmap, updateMindmap, loading } = useMindmaps();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition, getViewport } = useReactFlow();

  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: string; notes: string } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mindmap) {
      setNodes(mindmap.nodes || []);
      setEdges(mindmap.edges || []);
    }
  }, [mindmap]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } }, eds)), []);

  const handleSave = async () => {
    await updateMindmap({ nodes, edges });
    alert('Mindmap saved!');
  };

  const spawnChildNode = useCallback((parentId: string) => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const newId = Math.random().toString(36).substring(7);
    const newNode = {
      id: newId,
      type: 'editable',
      position: { x: parentNode.position.x + 200, y: parentNode.position.y },
      data: { label: 'New Subnode', notes: '', color: parentNode.data?.color || 'bg-slate-800', isSubnode: true },
    };

    const newEdge = {
      id: `e-${parentId}-${newId}`,
      source: parentId,
      target: newId,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#94a3b8', strokeWidth: 2 }
    };

    setNodes((nds) => nds.concat(newNode as any));
    setEdges((eds) => eds.concat(newEdge as any));
  }, [nodes, setNodes, setEdges]);

  const spawnSiblingNode = useCallback((siblingId: string) => {
    const siblingNode = nodes.find(n => n.id === siblingId);
    if (!siblingNode) return;

    // Check if it's a child (has incoming edge)
    const incomingEdge = edges.find(e => e.target === siblingId);
    
    const newId = Math.random().toString(36).substring(7);
    const newNode = {
      id: newId,
      type: 'editable',
      position: { x: siblingNode.position.x, y: siblingNode.position.y + 100 },
      data: { 
        label: incomingEdge ? 'New Node' : 'New Root', 
        notes: '', 
        color: siblingNode.data?.color || 'bg-slate-800', 
        isSubnode: siblingNode.data?.isSubnode 
      },
    };

    setNodes((nds) => nds.concat(newNode as any));

    if (incomingEdge) {
      const newEdge = {
        id: `e-${incomingEdge.source}-${newId}`,
        source: incomingEdge.source,
        target: newId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 }
      };
      setEdges((eds) => eds.concat(newEdge as any));
    }
  }, [nodes, setNodes, edges, setEdges]);


  // Handle Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent spawning if they are typing in an input/textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      const selectedNode = nodes.find(n => n.selected);
      if (!selectedNode) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        spawnChildNode(selectedNode.id);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        spawnSiblingNode(selectedNode.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, spawnChildNode, spawnSiblingNode]);

  // Context Menu Handlers
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      // Prevent menu from appearing offscreen
      const pane = wrapperRef.current?.getBoundingClientRect();
      if (!pane) return;
      
      setMenu({
        id: node.id,
        top: event.clientY < pane.bottom - 200 ? event.clientY : event.clientY - 200,
        left: event.clientX < pane.right - 200 ? event.clientX : event.clientX - 200,
      });
    },
    [setMenu]
  );

  const onPaneClick = useCallback(() => {
    setMenu(null);
  }, [setMenu]);

  // Context Menu Actions
  const handleMenuAction = (action: string, color?: string) => {
    if (!menu) return;
    const { id } = menu;

    if (action === 'delete') {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    } else if (action === 'addRecord') {
      spawnChildNode(id);
    } else if (action === 'color' && color) {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) return { ...n, data: { ...n.data, color } };
          return n;
        })
      );
    } else if (action === 'notes') {
      const node = nodes.find(n => n.id === id);
      if (node) {
        setNoteModal({ id: node.id, notes: node.data.notes as string || '' });
      }
    }
    
    // Don't close immediately for color palette so user can pick
    if (action !== 'color') setMenu(null);
  };

  const handleAddRootNode = () => {
    const { x, y } = getViewport();
    // Use the viewport center to spawn new root nodes
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    
    const newNode = {
      id: Math.random().toString(36).substring(7),
      type: 'editable',
      position,
      data: { label: 'Main Focus', notes: '', color: 'bg-slate-800' },
    };
    setNodes((nds) => nds.concat(newNode as any));
  };
  
  const saveNotes = () => {
    if (!noteModal) return;
    setNodes((nds) =>
        nds.map((n) => {
          if (n.id === noteModal.id) return { ...n, data: { ...n.data, notes: noteModal.notes } };
          return n;
        })
      );
    setNoteModal(null);
  };

  if (loading) return <div>Loading Mindmap...</div>;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
         <div>
             <h2 className="text-xl font-bold font-serif">Story Mindmap</h2>
             <p className="text-xs text-slate-500 mt-1">Select a node and press <kbd className="bg-slate-800 px-1 rounded border border-slate-700">ENTER</kbd> for a new node, or <kbd className="bg-slate-800 px-1 rounded border border-slate-700">TAB</kbd> for a subnode. Right-click nodes for options.</p>
         </div>
         <div className="flex gap-2">
            <button 
                onClick={handleAddRootNode}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                >
                <Plus className="w-4 h-4" />
                Add Root Node
            </button>
            <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition-colors"
                >
                <Save className="w-4 h-4" />
                Save Layout
            </button>
         </div>
      </div>

      <div ref={wrapperRef} className="flex-1 glass rounded-2xl border border-slate-700 overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          onNodeDragStart={onPaneClick}
          colorMode="dark"
          fitView
          minZoom={0.1}
        >
          <Background color="#1e293b" gap={24} size={2} />
          <Controls />
        </ReactFlow>

        {/* Custom Context Menu */}
        {menu && (
          <div 
            className="absolute z-50 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-2 w-48 text-sm"
            style={{ top: menu.top, left: menu.left }}
          >
            <button onClick={() => handleMenuAction('addRecord')} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
              <GitBranch className="w-4 h-4 text-blue-400" />
              Add Sub-node (TAB)
            </button>
            <button onClick={() => handleMenuAction('notes')} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
              <FileText className="w-4 h-4 text-emerald-400" />
              Edit Notes
            </button>
            
            <div className="my-2 border-t border-slate-700"></div>
            
            <div className="px-3 py-1 flex items-center gap-2 mb-1">
               <Palette className="w-4 h-4 text-purple-400" />
               <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Color Picker</span>
            </div>
            {/* Standard HTML5 Color Picker wrapped gracefully */}
            <div className="px-3 py-2 flex items-center gap-3">
               <input 
                  type="color" 
                  onChange={(e) => handleMenuAction('color', e.target.value)}
                  className="w-full h-8 bg-transparent cursor-pointer rounded border-0"
               />
            </div>
            
            <div className="my-2 border-t border-slate-700"></div>

            <button onClick={() => handleMenuAction('delete')} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-900/40 rounded-lg text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
              Delete Node
            </button>
          </div>
        )}
      </div>

       {/* Notes Modal */}
       {noteModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h3 className="font-bold font-serif flex items-center gap-2">
                 <FileText className="w-5 h-5 text-blue-400" />
                 Node Notes
              </h3>
              <button onClick={() => setNoteModal(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 h-64">
              <textarea
                autoFocus
                className="w-full h-full bg-transparent text-slate-200 resize-none outline-none leading-relaxed"
                placeholder="Write full background information, lore, or notes about this concept..."
                value={noteModal.notes}
                onChange={(e) => setNoteModal({ ...noteModal, notes: e.target.value })}
              />
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900">
              <button 
                onClick={() => setNoteModal(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveNotes}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold text-white transition-colors shadow-lg shadow-blue-500/20"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const MindmapView: React.FC = () => {
  return (
    <ReactFlowProvider>
      <MindmapCanvas />
    </ReactFlowProvider>
  );
};
