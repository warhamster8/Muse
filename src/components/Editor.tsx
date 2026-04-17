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

import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const CustomShortcuts = Extension.create({
  name: 'customShortcuts',
  addKeyboardShortcuts() {
    return {
      'Mod-Alt-1': () => this.editor.commands.insertContent('«'),
      'Mod-Alt-2': () => this.editor.commands.insertContent('»'),
    }
  },
});

const HighlightExtension = Extension.create({
  name: 'activeSuggestionHighlight',

  addOptions() {
    return {
      highlightedText: null as string | null,
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('activeSuggestionHighlight'),
        props: {
          decorations: (state) => {
            const { highlightedText } = this.options;
            if (!highlightedText) return DecorationSet.empty;

            const normalize = (str: string) => str
              .replace(/[\u201C\u201D\u201E\u201F«»]/g, '"')
              .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
              .replace(/[\u2013\u2014]/g, '-')
              .replace(/\s+/g, ' ')
              .trim();

            const target = normalize(highlightedText);
            if (target.length < 2) return DecorationSet.empty;

            const decorations: Decoration[] = [];
            const { doc } = state;

            doc.descendants((node, pos) => {
              if (node.isText) {
                const text = node.text || '';
                const normalizedText = normalize(text);
                const hasMatch = normalizedText.indexOf(target) !== -1;
                
                if (!hasMatch) return;
                
                // If direct normalized match fails, we stick to direct match as fallback
                // but usually normalized is more robust for AI suggestions.
                // However, mapping back normalized index to original text pos is tricky.
                // For now, let's use the simple indexOf on original text but normalize the target.
                
                const searchStr = text; 
                let searchIdx = searchStr.indexOf(highlightedText);
                
                while (searchIdx !== -1) {
                  const start = pos + searchIdx;
                  const end = start + highlightedText.length;
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'suggestion-highlight-pulse',
                    })
                  );
                  searchIdx = searchStr.indexOf(highlightedText, searchIdx + 1);
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ]
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
      HighlightExtension.configure({ highlightedText: null }),
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

  // Handle suggestion highlighting from the store
  const { highlightedText } = useStore();
  React.useEffect(() => {
    if (editor) {
      editor.setOptions({
        extensions: editor.extensionManager.extensions.map(ext => {
           if (ext.name === 'activeSuggestionHighlight') {
             return ext.configure({ highlightedText });
           }
           return ext;
        })
      });
      // Force a re-render/re-decoration
      editor.view.dispatch(editor.state.tr);
    }
  }, [highlightedText, editor]);

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
    <div className="flex flex-col h-full bg-[#13161a] shadow-2xl rounded-xl border border-white/10 overflow-hidden">
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

      <div className="flex-1 overflow-y-auto px-8 py-12 bg-[#13161a]">
        <div className="w-full">
           <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
