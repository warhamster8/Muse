import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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

export const Editor: React.FC<{ initialContent: string; onChange: (content: string) => void }> = ({ initialContent, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-slate-900 shadow-2xl rounded-xl border border-slate-700 overflow-hidden">
      <div className="glass p-2 border-b border-slate-700 flex items-center space-x-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('bold') ? 'text-blue-400 bg-slate-700' : 'text-slate-400'}`}
        >
          <Bold className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('italic') ? 'text-blue-400 bg-slate-700' : 'text-slate-400'}`}
        >
          <Italic className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-slate-700 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'text-blue-400 bg-slate-700' : 'text-slate-400'}`}
        >
          <Heading1 className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'text-blue-400 bg-slate-700' : 'text-slate-400'}`}
        >
          <Heading2 className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-slate-700 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('bulletList') ? 'text-blue-400 bg-slate-700' : 'text-slate-400'}`}
        >
          <List className="w-5 h-5" />
        </button>
        
        <div className="ml-auto flex items-center space-x-4 px-4 text-xs font-mono text-slate-500">
           <div className="flex items-center space-x-1">
              <Type className="w-3 h-3" />
              <span>{editor.storage.characterCount.words()} words</span>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16 bg-slate-900/50">
        <div className="max-w-3xl mx-auto">
           <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
