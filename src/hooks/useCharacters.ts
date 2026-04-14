import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';
import { useStore } from '../store/useStore';

export type Character = {
  id: string;
  project_id: string;
  name: string;
  bio: string;
  psychology: string;
  evolution: string;
  relations: string;
};

export function useCharacters() {
  const { currentProject, isLocalMode } = useStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCharacters = async () => {
    if (!currentProject) return;
    setLoading(true);
    
    if (isLocalMode) {
      const all: Character[] = storage.getCollection('characters');
      setCharacters(all.filter(c => c.project_id === currentProject.id));
    } else {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', currentProject.id);
      if (!error) setCharacters(data);
    }
    setLoading(false);
  };

  const addCharacter = async (name: string) => {
    if (!currentProject) return;
    if (isLocalMode) {
      storage.insert('characters', { project_id: currentProject.id, name, bio: '', psychology: '', evolution: '', relations: '' });
      fetchCharacters();
    } else {
      await supabase.from('characters').insert([{ project_id: currentProject.id, name, bio: '', psychology: '', evolution: '', relations: '' }]);
      fetchCharacters();
    }
  };

  const updateCharacter = async (id: string, updates: Partial<Character>) => {
    if (isLocalMode) {
      storage.update('characters', id, updates);
      fetchCharacters();
    } else {
      await supabase.from('characters').update(updates).eq('id', id);
      fetchCharacters();
    }
  };

  const addInterview = async (characterId: string, question: string, answer: string) => {
    if (isLocalMode) {
      const interviews = storage.getCollection('interviews');
      storage.setCollection('interviews', [...interviews, { character_id: characterId, question, answer, id: Math.random() }]);
    } else {
      await supabase.from('character_interviews').insert([{ character_id: characterId, question, answer }]);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [currentProject, isLocalMode]);

  return { characters, loading, addCharacter, updateCharacter, addInterview, refresh: fetchCharacters };
}
