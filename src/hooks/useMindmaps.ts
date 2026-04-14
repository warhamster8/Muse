import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';
import { useStore } from '../store/useStore';

export type Mindmap = {
  id: string;
  project_id: string;
  name: string;
  nodes: any[];
  edges: any[];
};

export function useMindmaps() {
  const { currentProject, isLocalMode } = useStore();
  const [mindmap, setMindmap] = useState<Mindmap | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMindmap = async () => {
    if (!currentProject) return;
    setLoading(true);
    
    if (isLocalMode) {
      const all: Mindmap[] = storage.getCollection('mindmaps');
      const found = all.find(m => m.project_id === currentProject.id);
      if (found) {
        setMindmap(found);
      } else {
        const newMap = storage.insert('mindmaps', { project_id: currentProject.id, name: 'Main Mindmap', nodes: [], edges: [] });
        setMindmap(newMap as Mindmap);
      }
    } else {
      const { data, error } = await supabase
        .from('mindmaps')
        .select('*')
        .eq('project_id', currentProject.id)
        .limit(1)
        .single();
      
      if (error && error.code === 'PGRST116') {
        const { data: newMap } = await supabase
          .from('mindmaps')
          .insert([{ project_id: currentProject.id, name: 'Main Mindmap' }])
          .select()
          .single();
        setMindmap(newMap);
      } else {
        setMindmap(data);
      }
    }
    setLoading(false);
  };

  const updateMindmap = async (updates: Partial<Mindmap>) => {
    if (!mindmap) return;
    if (isLocalMode) {
      storage.update('mindmaps', mindmap.id, updates);
    } else {
      await supabase.from('mindmaps').update(updates).eq('id', mindmap.id);
    }
  };

  useEffect(() => {
    fetchMindmap();
  }, [currentProject, isLocalMode]);

  return { mindmap, loading, updateMindmap, refresh: fetchMindmap };
}
