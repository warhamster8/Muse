import React, { useState } from 'react';
import { Plus, Search, Trash2, ExternalLink, Image as ImageIcon, Maximize2 } from 'lucide-react';
import type { Note } from '../hooks/useNotes';
import { useNotes } from '../hooks/useNotes';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/Toast';

export const NotesView: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote, loading } = useNotes();
  const { addToast } = useToast();
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredNotes = notes.filter(n => 
    (n.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
    (n.content?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleCreateNote = async () => {
    try {
      const newNote = await addNote('Nuova Nota', '');
      if (newNote) {
        setEditingNote(newNote);
        addToast('Nota creata con successo', 'success');
      } else {
        addToast('Errore nella creazione della nota. Verifica la connessione o il database.', 'error');
      }
    } catch (err) {
      addToast('Errore imprevisto durante la creazione.', 'error');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden">
      {/* Header & Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search notes..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={handleCreateNote}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-900/40 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nuova Nota
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading && notes.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
            <Plus className="w-16 h-16 opacity-10" />
            <p className="text-sm italic">Nessuna nota trovata. Crea la prima!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onClick={() => setEditingNote(note)}
                  onDelete={() => deleteNote(note.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {editingNote && (
          <NoteModal 
            note={editingNote} 
            onClose={() => setEditingNote(null)} 
            onSave={(updates) => {
              updateNote(editingNote.id, updates);
              setEditingNote(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const NoteCard: React.FC<{ note: Note; onClick: () => void; onDelete: () => void }> = ({ note, onClick, onDelete }) => {
  // Strip HTML for preview
  const preview = note.content.replace(/<[^>]*>/g, '').slice(0, 150) + (note.content.length > 150 ? '...' : '');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-5 hover:border-blue-500/30 transition-all cursor-pointer group relative flex flex-col h-48 overflow-hidden glass hover:bg-slate-800/40"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-200 truncate pr-8">{note.title || 'Senza Titolo'}</h3>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-4 right-4 p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-950/20"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-slate-400 line-clamp-5 leading-relaxed flex-1">
        {preview || <span className="italic opacity-30">Nessun contenuto...</span>}
      </p>
      <div className="mt-4 flex items-center justify-between text-[10px] text-slate-600 font-mono">
        <span>{new Date(note.created_at).toLocaleDateString()}</span>
        <Maximize2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
};

const NoteModal: React.FC<{ note: Note; onClose: () => void; onSave: (updates: Partial<Note>) => void }> = ({ note, onClose, onSave }) => {
  const [title, setTitle] = useState(note.title);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: note.content,
  });

  if (!editor) return null;

  const handleSave = () => {
    onSave({ title, content: editor.getHTML() });
  };

  const addImage = () => {
    const url = prompt('Inserisci URL immagine:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = prompt('Inserisci URL link:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center gap-4 bg-slate-800/30">
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent text-xl font-bold text-slate-200 focus:outline-none placeholder:opacity-20"
            placeholder="Titolo della nota..."
          />
          <div className="flex items-center gap-2">
            <button onClick={addLink} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-all border border-transparent hover:border-blue-500/20">
              <ExternalLink className="w-5 h-5" />
            </button>
            <button onClick={addImage} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-all border border-transparent hover:border-blue-500/20">
              <ImageIcon className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-700 mx-2" />
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Annulla
            </button>
            <button 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/40"
            >
              Salva
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-900/50">
          <div className="prose prose-invert prose-blue max-w-none min-h-full">
            <EditorContent editor={editor} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
