import React, { useRef } from 'react';
import { Plus, User, Users, FileText, Brain, TrendingUp, MessageSquare, Camera, Trash2 } from 'lucide-react';
import { useCharacters } from '../hooks/useCharacters';
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
  const [posX, setPosX] = React.useState(50);
  const [posY, setPosY] = React.useState(50);
  const [isAdjusting, setIsAdjusting] = React.useState(false);

  const [isInterviewing, setIsInterviewing] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when selection changes
  React.useEffect(() => {
    if (selectedChar) {
      setLocalBio(selectedChar.bio || '');
      setLocalPsychology(selectedChar.psychology || '');
      setLocalEvolution(selectedChar.evolution || '');
      setPosX(selectedChar.avatar_pos_x ?? 50);
      setPosY(selectedChar.avatar_pos_y ?? 50);
      setIsAdjusting(false);
    }
  }, [selectedChar?.id]);

  // Debounce updates for position
  React.useEffect(() => {
    if (!selectedChar) return;
    const timer = setTimeout(() => {
      if (posX !== selectedChar.avatar_pos_x || posY !== selectedChar.avatar_pos_y) {
        updateCharacter(selectedChar.id, { avatar_pos_x: posX, avatar_pos_y: posY });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [posX, posY, selectedChar?.id]);

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
      updateCharacter(selectedChar.id, { avatar_url: base64String, avatar_pos_x: 50, avatar_pos_y: 50 });
      setPosX(50);
      setPosY(50);
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
    <div className="flex h-full gap-6 overflow-hidden animate-in fade-in duration-700">
      {/* Character List */}
      <div className="w-80 flex flex-col gap-6">
        <div className="flex items-center justify-between bg-[#0a0a0a] p-4 rounded-2xl border border-white/5">
          <h2 className="text-sm font-bold font-display flex items-center gap-3 tracking-[0.2em] text-slate-400">
            <Users className="w-4 h-4 text-[#5be9b1]" />
            ATTORI
          </h2>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#5be9b1] hover:bg-[#5be9b1] p-2 rounded-xl transition-all shadow-lg shadow-emerald-950/20 active:scale-90">
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
          {characters.map(char => (
            <div 
              key={char.id}
              onClick={() => setSelectedCharId(char.id)}
              className={cn(
                "p-4 rounded-[24px] border transition-all cursor-pointer flex gap-4 items-center group",
                selectedCharId === char.id 
                  ? "bg-[#5be9b1]/10 border-[#5be9b1]/30 shadow-xl shadow-emerald-950/20" 
                  : "bg-[#0a0a0a] border-white/5 hover:border-white/10"
              )}
            >
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/5 flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                {char.avatar_url ? (
                  <img 
                    src={char.avatar_url} 
                    alt={char.name} 
                    className="w-full h-full object-cover" 
                    style={{ objectPosition: `${char.avatar_pos_x ?? 50}% ${char.avatar_pos_y ?? 50}%` }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={cn("font-bold truncate tracking-tight transition-colors", selectedCharId === char.id ? "text-[#5be9b1]" : "text-slate-100")}>
                    {char.name}
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1 opacity-50 truncate">
                    {char.bio ? 'Scheda Completa' : 'Nessuna bio...'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Area */}
      <div className="flex-1 min-w-0 bg-[#0a0a0a] rounded-[40px] border border-white/5 flex flex-col overflow-hidden shadow-sm">
        {selectedChar ? (
          <div className="flex flex-col h-full">
            <div className="p-10 border-b border-white/5 bg-white/[0.01] relative overflow-hidden group/header">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#5be9b1]/5 blur-[150px] -mr-48 -mt-48 transition-all group-hover/header:bg-[#5be9b1]/10" />
              
              <div className="relative flex flex-col md:flex-row items-center md:items-end gap-10">
                {/* Large Portrait */}
                <div className="relative">
                  <div 
                    onClick={() => !isAdjusting && fileInputRef.current?.click()}
                    className={cn(
                      "group relative w-56 h-72 rounded-[40px] bg-black border border-white/5 overflow-hidden transition-all shadow-2xl flex-shrink-0",
                      isAdjusting ? "ring-2 ring-[#5be9b1] cursor-move" : "cursor-pointer hover:border-[#5be9b1]/30"
                    )}
                  >
                    {selectedChar.avatar_url ? (
                      <img 
                        src={selectedChar.avatar_url} 
                        alt={selectedChar.name} 
                        className={cn(
                          "w-full h-full object-cover transition-transform duration-700",
                          !isAdjusting && "group-hover:scale-105"
                        )}
                        style={{ objectPosition: `${posX}% ${posY}%` }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 bg-[#0a0a0a]/50">
                        <Camera className="w-12 h-12 mb-2 opacity-10" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-10">Capture Portrait</span>
                      </div>
                    )}
                    {!isAdjusting && (
                      <div className="absolute inset-0 bg-emerald-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <Camera className="w-10 h-10 text-white" />
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload} 
                    />
                  </div>

                  {/* Positioning Controls overlay */}
                  {selectedChar.avatar_url && (
                    <button
                      onClick={() => setIsAdjusting(!isAdjusting)}
                      className={cn(
                        "absolute -bottom-2 -right-2 p-4 rounded-[20px] shadow-2xl transition-all z-10 border border-white/10",
                        isAdjusting ? "bg-[#5be9b1] text-white" : "bg-[#0a0a0a] text-slate-400 hover:text-[#5be9b1]"
                      )}
                    >
                      <TrendingUp className={cn("w-4 h-4 transition-transform duration-500", isAdjusting && "rotate-90")} />
                    </button>
                  )}
                </div>

                {/* Name & Actions */}
                <div className="flex-1 flex flex-col items-center md:items-start pb-2 min-w-0">
                  {isAdjusting ? (
                    <div className="w-full max-w-sm space-y-5 mb-8 p-6 bg-white/[0.03] rounded-[32px] border border-[#5be9b1]/20 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-bold text-[#5be9b1] uppercase tracking-[0.2em]">
                          <span>Orizzontale</span>
                          <span className="font-mono">{posX}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={posX}
                          onChange={(e) => setPosX(parseInt(e.target.value))}
                          className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-[#5be9b1]"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-bold text-[#5be9b1] uppercase tracking-[0.2em]">
                          <span>Verticale</span>
                          <span className="font-mono">{posY}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={posY}
                          onChange={(e) => setPosY(parseInt(e.target.value))}
                          className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-[#5be9b1]"
                        />
                      </div>
                      <button 
                        onClick={() => setIsAdjusting(false)}
                        className="w-full py-3 bg-[#5be9b1] hover:bg-[#5be9b1] text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg"
                      >
                        Salva Inquadratura
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-4 py-1.5 bg-[#5be9b1]/5 text-[#5be9b1] text-[9px] font-bold uppercase tracking-[0.2em] rounded-full border border-[#5be9b1]/10">
                          Identità Protagonista
                        </span>
                        {selectedChar.avatar_url && (
                          <button 
                            onClick={() => updateCharacter(selectedChar.id, { avatar_url: '' })}
                            className="text-slate-700 hover:text-red-400 p-1.5 transition-colors bg-white/5 rounded-lg"
                            title="Rimuovi foto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <h2 className="text-6xl font-medium font-display text-white tracking-tighter mb-8 truncate w-full">
                        {selectedChar.name}
                      </h2>
                    </>
                  )}
                  
                  {!isAdjusting && (
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={handleInterview}
                        disabled={isInterviewing}
                        className="flex items-center gap-4 px-10 py-4 bg-[#5be9b1] hover:bg-[#5be9b1] text-white rounded-[20px] text-xs font-bold transition-all disabled:opacity-50 shadow-[0_15px_40px_-10px_rgba(16,185,129,0.3)] active:scale-95"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {isInterviewing ? 'In ascolto...' : 'Intervista Creatura'}
                      </button>
                      
                      <button 
                        onClick={() => addToast('Analisi tratti in arrivo...', 'info')}
                        className="flex items-center gap-4 px-10 py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-[24px] text-xs font-bold transition-all active:scale-95 border border-white/5"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Analisi Statistiche
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-[#5be9b1]/50">
                  <FileText className="w-4 h-4" />
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em]">Biografia & Origini</h4>
                </div>
                <textarea 
                  className="w-full h-40 bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 text-sm text-slate-300 focus:outline-none focus:border-[#5be9b1]/30 focus:bg-white/[0.04] transition-all placeholder:text-slate-800 leading-relaxed scrollbar-hide"
                  placeholder="Descrivi le origini, il passato e i segreti del personaggio..."
                  value={localBio}
                  onChange={(e) => setLocalBio(e.target.value)}
                />
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 text-emerald-700">
                  <Brain className="w-4 h-4" />
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em]">Psicologia & Conflitti</h4>
                </div>
                <textarea 
                  className="w-full h-40 bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 text-sm text-slate-300 focus:outline-none focus:border-emerald-700/30 focus:bg-white/[0.04] transition-all placeholder:text-slate-800 leading-relaxed scrollbar-hide"
                  placeholder="Cosa spinge questo personaggio? Quali sono le sue paure più profonde?"
                  value={localPsychology}
                  onChange={(e) => setLocalPsychology(e.target.value)}
                />
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 text-emerald-900">
                  <TrendingUp className="w-4 h-4" />
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em]">Arco Narrativo & Evoluzione</h4>
                </div>
                <textarea 
                  className="w-full h-40 bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 text-sm text-slate-300 focus:outline-none focus:border-emerald-900/30 focus:bg-white/[0.04] transition-all placeholder:text-slate-800 leading-relaxed scrollbar-hide"
                  placeholder="Come cambia il personaggio dall'inizio alla fine del viaggio?"
                  value={localEvolution}
                  onChange={(e) => setLocalEvolution(e.target.value)}
                />
              </section>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-8 animate-in fade-in duration-1000">
            <div className="w-32 h-32 rounded-[40px] border border-white/5 flex items-center justify-center opacity-10 bg-white/5">
              <User className="w-14 h-14" />
            </div>
            <div className="text-center">
                <h3 className="text-lg font-medium text-slate-500">Archivio Personaggi</h3>
                <p className="text-xs opacity-50 max-w-[200px] mx-auto mt-2 tracking-wide font-light">Seleziona un attore per consultare la sua scheda tecnica e psicofisica.</p>
            </div>
          </div>
        )}
      </div>
      
      <CreationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAdd}
        title="Creazione Attore"
        placeholder="Nome del personaggio..."
      />
    </div>
  );
};
