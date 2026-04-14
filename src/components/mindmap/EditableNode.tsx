import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { cn } from '../../lib/utils';
import { FileText } from 'lucide-react';

export default function EditableNode({ id, data, isConnectable, selected }: any) {
  const { setNodes } = useReactFlow();
  const [label, setLabel] = useState(data.label || '');

  // Keep internal label state in sync with external changes
  useEffect(() => {
    if (data.label !== label) {
      setLabel(data.label || '');
    }
  }, [data.label]);

  const onLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, label: e.target.value } };
        }
        return n;
      })
    );
  };

  // If color is a full hex code like #ff0000, we apply it via inline style.
  // If it's a tailwind class like bg-slate-800, we apply it via class.
  const isHex = data.color?.startsWith('#');
  const bgClass = isHex ? '' : (data.color || 'bg-slate-800');
  const styleStr = isHex ? { backgroundColor: data.color } : {};

  // For hex, we generally want white or dark text. A simple heuristic is to always use white for custom colors,
  // or a dark text on light. Since it's a dark mode app, most user picks will be dark/vibrant.
  const textColorClass = 'text-white';
  const placeholderClass = 'placeholder-white/70';

  const hasNotes = data.notes && data.notes.trim().length > 0;

  const isSubnode = data.isSubnode === true;

  return (
    <div 
      className={cn(
        "transition-all relative border shadow-xl", 
        !isHex && bgClass,
        selected ? "border-blue-400 ring-2 ring-blue-500/50" : "border-slate-600/50",
        isSubnode ? "min-w-[100px] max-w-[180px] rounded-full" : "min-w-[160px] max-w-[250px] rounded-xl"
      )}
      style={styleStr}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-2 h-2 bg-slate-400 border-none" />
      
      <div className={cn("flex items-center gap-2", isSubnode ? "py-1.5 px-4" : "p-3")}>
         <input 
            value={label} 
            onChange={onLabelChange} 
            className={cn(
              "w-full bg-transparent font-bold focus:outline-none border-b border-transparent focus:border-white/30 truncate",
              textColorClass, placeholderClass,
              isSubnode ? "text-xs" : "text-sm"
            )} 
            placeholder={isSubnode ? "Sub-concept" : "Node Title"} 
         />
         {hasNotes && (
           <FileText className="w-3.5 h-3.5 text-white/50 shrink-0" title="Has notes" />
         )}
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-2 h-2 bg-slate-400 border-none" />
    </div>
  );
}

