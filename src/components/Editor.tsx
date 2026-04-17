import React from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List,
  Type
} from 'lucide-react';

import { useStore } from '../store/useStore';

const CustomShortcuts = Extension.create({
  name: 'customShortcuts',
  addKeyboardShortcuts() {
    return {
      'Mod-Alt-1': () => this.editor.commands.insertContent('«'),
      'Mod-Alt-2': () => this.editor.commands.insertContent('»'),
    }
  },
});

export const Editor: React.FC<{ initialContent: string; onChange: (content: string) => void }> = ({ initialContent, onChange }) => {
  const isExternallyUpdating = React.useRef(false);
  const { setActiveSelection } = useStore();

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
      CustomShortcuts,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      // Don't emit changes back to the parent if we're currently syncing from the parent
      if (isExternallyUpdating.current) return;
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to, empty } = editor.state.selection;
      if (empty) {
        setActiveSelection(null);
      } else {
        const selectedText = editor.state.doc.textBetween(from, to, ' ');
        setActiveSelection(selectedText);
      }
    },
  });

  // Sync content if it changes externally (e.g. via AI Sidekick "Applica")
  React.useEffect(() => {
    if (editor && initialContent.trim() !== editor.getHTML().trim()) {
      isExternallyUpdating.current = true;
      // The emitUpdate option prevents emitting an update event, breaking the infinite loop
      editor.commands.setContent(initialContent, { emitUpdate: false });
      
      // Release the lock in the next frame to allow user changes again
      setTimeout(() => {
        isExternallyUpdating.current = false;
      }, 0);
    }
  }, [initialContent, editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-[#0b0e11] shadow-2xl rounded-xl border border-white/10 overflow-hidden">
      <div className="bg-[#171b1f] p-3 border-b border-white/10 flex items-center space-x-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-xl transition-all ${editor.isActive('bold') ? 'bg-[#5be9b1] text-[#0b0e11] shadow-lg shadow-[#5be9b1]/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
          <Bold className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-xl transition-all ${editor.isActive('italic') ? 'bg-[#5be9b1] text-[#0b0e11] shadow-lg shadow-[#5be9b1]/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
          <Italic className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-slate-700 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded-xl transition-all ${editor.isActive('heading', { level: 1 }) ? 'bg-[#5be9b1] text-[#0b0e11] shadow-lg shadow-[#5be9b1]/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
          <Heading1 className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-xl transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-[#5be9b1] text-[#0b0e11] shadow-lg shadow-[#5be9b1]/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
          <Heading2 className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-slate-700 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-xl transition-all ${editor.isActive('bulletList') ? 'bg-[#5be9b1] text-[#0b0e11] shadow-lg shadow-[#5be9b1]/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
          <List className="w-5 h-5" />
        </button>
        
        <div className="ml-auto flex items-center space-x-6 px-4">
           <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
              <Type className="w-4 h-4 text-[#5be9b1]/40" />
              <span>{editor.storage.characterCount.words()} PAROLA</span>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-12 md:px-12 lg:px-24 bg-[#0b0e11]">
        <div className="max-w-4xl mx-auto">
           <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
