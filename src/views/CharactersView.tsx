import React, { useRef } from 'react';
import { Plus, User, FileText, Brain, TrendingUp, MessageSquare, Camera, Trash2 } from 'lucide-react';
import { useCharacters } from '../hooks/useCharacters';
import type { Character } from '../hooks/useCharacters';
import { cn } from '../lib/utils';
import { groqService } from '../lib/groq';
import { CreationModal } from '../components/CreationModal';
import { useToast } from '../components/Toast';

export const CharactersView: React.FC = () => {
  const { characters, addCharacter, updateCharacter, addInterview } = useCharacters();
  const { addToast } = useToast();
  const [selectedCharId, setSelectedCharId] = React.useState<string | null>(null);
  const selectedChar = React.useMemo(() => 
    characters.find(c => c.id === selectedCharId) || null,
  [characters, selectedCharId]);

  const [localBio, setLocalBio] = React.useState('');
  const [localPsychology, setLocalPsychology] = React.useState('');
  const [localEvolution, setLocalEvolution] = React.useState('');

  const [isInterviewing, setIsInterviewing] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when selection changes
  React.useEffect(() => {
    if (selectedChar) {
      setLocalBio(selectedChar.bio || '');
      setLocalPsychology(selectedChar.psychology || '');
      setLocalEvolution(selectedChar.evolution || '');
    }
  }, [selectedChar?.id]);

  // Debounce updates to the store/DB
  React.useEffect(() => {
    if (!selectedChar) return;
    const timer = setTimeout(() => {
      if (localBio !== selectedChar.bio) updateCharacter(selectedChar.id, { bio: localBio });
    }, 800);
    return () => clearTimeout(timer);
  }, [localBio, selectedChar?.id]);

  React.useEffect(() => {
    if (!selectedChar) return;
    const timer = setTimeout(() => {
      if (localPsychology !== selectedChar.psychology) updateCharacter(selectedChar.id, { psychology: localPsychology });
    }, 800);
    return () => clearTimeout(timer);
  }, [localPsychology, selectedChar?.id]);

  React.useEffect(() => {
    if (!selectedChar) return;
    const timer = setTimeout(() => {
      if (localEvolution !== selectedChar.evolution) updateCharacter(selectedChar.id, { evolution: localEvolution });
    }, 800);
    return () => clearTimeout(timer);
  }, [localEvolution, selectedChar?.id]);

  const handleConfirmAdd = (name: string) => {
    addCharacter(name);
    addToast(`Personaggio "${name}" creato!`, 'success');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChar) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('L\'immagine è troppo grande (max 2MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateCharacter(selectedChar.id, { avatar_url: base64String });
      addToast('Immagine caricata con successo', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleInterview = async () => {
    if (!selectedChar) return;
    setIsInterviewing(true);
    try {
      const messages = [
        { 
          role: 'system', 
          content: `You are the character ${selectedChar.name}. 
          BIO: ${selectedChar.bio}. 
          PSYCHOLOGY: ${selectedChar.psychology}. 
          An interviewer is talking to you. Reply as the character with their voice and personality.` 
        },
        { role: 'user', content: 'Tell me something about your deepest secret or motivation.' }
      ];
      const res = await groqService.getChatCompletion(messages);
      const answer = res.choices[0]?.message?.content || '';
      await addInterview(selectedChar.id, 'Parlami di te...', answer);
      addToast(`Intervista completata con ${selectedChar.name}`, 'info');
      alert(`${selectedChar.name} dice: ${answer}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInterviewing(false);
    }
  };

  return (
    <div className="flex h-full gap-6 overflow-hidden">
      {/* Character List */}
      <div className="w-80 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Characters
          </h2>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
          {characters.map(char => (
            <div 
              key={char.id}
              onClick={() => setSelectedCharId(char.id)}
              className={cn(
                "p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-center",
                selectedCharId === char.id 
                  ? "glass border-blue-500 bg-blue-600/10 shadow-lg shadow-blue-900/10" 
                  : "bg-slate-800/50 border-slate-700 hover:border-slate-500"
              )}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0">
                {char.avatar_url ? (
                  <img src={char.avatar_url} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-100 truncate">{char.name}</h3>
                <p className="text-[10px] text-slate-500 truncate">{char.bio || 'No bio...'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Area */}
      <div className="flex-1 min-w-0 glass rounded-2xl border border-slate-700 flex flex-col overflow-hidden">
        {selectedChar ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/20">
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden cursor-pointer hover:border-blue-500 transition-all shadow-xl"
                >
                  {selectedChar.avatar_url ? (
                    <img src={selectedChar.avatar_url} alt={selectedChar.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[8px] font-bold uppercase">Add Photo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload} 
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-bold font-serif text-white">{selectedChar.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-blue-400 font-mono uppercase tracking-widest">Profile Identity</span>
                    {selectedChar.avatar_url && (
                      <button 
                        onClick={() => updateCharacter(selectedChar.id, { avatar_url: '' })}
                        className="text-red-500 hover:text-red-400 p-1"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={handleInterview}
                disabled={isInterviewing}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-purple-900/30"
              >
                <MessageSquare className="w-4 h-4" />
                {isInterviewing ? 'Interviewing...' : 'AI Interview'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <FileText className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Biography</h4>
                </div>
                <textarea 
                  className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-2xl p-5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-slate-900/80 transition-all placeholder:opacity-20"
                  placeholder="Describe the character's origin story, personality, and background..."
                  value={localBio}
                  onChange={(e) => setLocalBio(e.target.value)}
                />
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-purple-400">
                  <Brain className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Psychology</h4>
                </div>
                <textarea 
                  className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-2xl p-5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:bg-slate-900/80 transition-all placeholder:opacity-20"
                  placeholder="What drives them? What are their fears and core beliefs?"
                  value={localPsychology}
                  onChange={(e) => setLocalPsychology(e.target.value)}
                />
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-orange-400">
                  <TrendingUp className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Arc & Evolution</h4>
                </div>
                <textarea 
                  className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-2xl p-5 text-sm text-slate-200 focus:outline-none focus:border-orange-500 focus:bg-slate-900/80 transition-all placeholder:opacity-20"
                  placeholder="How does their journey change them from the beginning to the end?"
                  value={localEvolution}
                  onChange={(e) => setLocalEvolution(e.target.value)}
                />
              </section>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-6">
            <div className="w-24 h-24 rounded-full border-2 border-slate-800 flex items-center justify-center opacity-20">
              <User className="w-12 h-12" />
            </div>
            <p className="text-sm italic opacity-50 tracking-wide font-serif">Select a character to reveal their details</p>
          </div>
        )}
      </div>
      
      <CreationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAdd}
        title="Nuovo Personaggio"
        placeholder="Esempio: Arthur Pendragon..."
      />
    </div>
  );
};
