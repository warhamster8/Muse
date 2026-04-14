import React from 'react';
import { Plus, User, FileText, Brain, TrendingUp, MessageSquare } from 'lucide-react';
import { useCharacters } from '../hooks/useCharacters';
import type { Character } from '../hooks/useCharacters';
import { cn } from '../lib/utils';
import { groqService } from '../lib/groq';

export const CharactersView: React.FC = () => {
  const { characters, addCharacter, updateCharacter, addInterview } = useCharacters();
  const [selectedChar, setSelectedChar] = React.useState<Character | null>(null);
  const [isInterviewing, setIsInterviewing] = React.useState(false);

  const handleAdd = async () => {
    const name = prompt('Character Name:');
    if (name) await addCharacter(name);
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
      await addInterview(selectedChar.id, 'Tell me something about your deepest secret or motivation.', answer);
      alert(`${selectedChar.name} says: ${answer}`);
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
          <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {characters.map(char => (
            <div 
              key={char.id}
              onClick={() => setSelectedChar(char)}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer",
                selectedChar?.id === char.id 
                  ? "glass border-blue-500 bg-blue-600/10" 
                  : "bg-slate-800/50 border-slate-700 hover:border-slate-500"
              )}
            >
              <h3 className="font-bold text-slate-100">{char.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{char.bio || 'No biography yet...'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Area */}
      <div className="flex-1 min-w-0 glass rounded-2xl border border-slate-700 flex flex-col overflow-hidden">
        {selectedChar ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold font-serif">{selectedChar.name}</h2>
                <span className="text-xs text-slate-500 uppercase tracking-widest">Character Profile</span>
              </div>
              <button 
                onClick={handleInterview}
                disabled={isInterviewing}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4" />
                {isInterviewing ? 'Interviewing...' : 'AI Interview'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <FileText className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Biography</h4>
                </div>
                <textarea 
                  className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                  placeholder="Describe the character's background..."
                  value={selectedChar.bio}
                  onChange={(e) => updateCharacter(selectedChar.id, { bio: e.target.value })}
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-purple-400">
                  <Brain className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Psychology</h4>
                </div>
                <textarea 
                  className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-purple-500"
                  placeholder="Personality traits, fears, desires..."
                  value={selectedChar.psychology}
                  onChange={(e) => updateCharacter(selectedChar.id, { psychology: e.target.value })}
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-orange-400">
                  <TrendingUp className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Evolution</h4>
                </div>
                <textarea 
                  className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-orange-500"
                  placeholder="How does the character change throughout the story?"
                  value={selectedChar.evolution}
                  onChange={(e) => updateCharacter(selectedChar.id, { evolution: e.target.value })}
                />
              </section>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
            <User className="w-16 h-16 opacity-10" />
            <p className="text-sm">Select a character to view their profile.</p>
          </div>
        )}
      </div>
    </div>
  );
};
