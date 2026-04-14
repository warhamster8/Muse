import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';
import { useStore } from '../store/useStore';

export type Scene = {
  id: string;
  chapter_id: string;
  title: string;
  content: string;
  order_index: number;
};

export type Chapter = {
  id: string;
  project_id: string;
  title: string;
  order_index: number;
  scenes?: Scene[];
};

export function useNarrative() {
  const { currentProject, isLocalMode } = useStore();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNarrative = async () => {
    if (!currentProject) return;
    setLoading(true);
    
    if (isLocalMode) {
      const allChapters: Chapter[] = storage.getCollection('chapters');
      const allScenes: Scene[] = storage.getCollection('scenes');
      
      const projectChapters = allChapters
        .filter(c => c.project_id === currentProject.id)
        .map(ch => ({
          ...ch,
          scenes: allScenes
            .filter(s => s.chapter_id === ch.id)
            .sort((a, b) => a.order_index - b.order_index)
        }))
        .sort((a, b) => a.order_index - b.order_index);
        
      setChapters(projectChapters);
    } else {
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*, scenes(*)')
        .eq('project_id', currentProject.id)
        .order('order_index', { ascending: true });

      if (!chaptersError) {
        const sortedChapters = chaptersData.map(ch => ({
          ...ch,
          scenes: ch.scenes.sort((a: Scene, b: Scene) => a.order_index - b.order_index)
        }));
        setChapters(sortedChapters);
      }
    }
    setLoading(false);
  };

  const addChapter = async (title: string) => {
    if (!currentProject) return;
    if (isLocalMode) {
      storage.insert('chapters', { project_id: currentProject.id, title, order_index: chapters.length });
      fetchNarrative();
    } else {
      await supabase.from('chapters').insert([{ project_id: currentProject.id, title, order_index: chapters.length }]);
      fetchNarrative();
    }
  };

  const addScene = async (chapterId: string, title: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    const order = chapter?.scenes?.length || 0;
    
    if (isLocalMode) {
      storage.insert('scenes', { chapter_id: chapterId, title, order_index: order, content: '' });
      fetchNarrative();
    } else {
      await supabase.from('scenes').insert([{ chapter_id: chapterId, title, order_index: order }]);
      fetchNarrative();
    }
  };

  const updateSceneContent = async (sceneId: string, content: string) => {
    if (isLocalMode) {
      storage.update('scenes', sceneId, { content });
    } else {
      await supabase.from('scenes').update({ content }).eq('id', sceneId);
    }
  };

  useEffect(() => {
    fetchNarrative();
  }, [currentProject, isLocalMode]);

  return { chapters, loading, addChapter, addScene, updateSceneContent, refresh: fetchNarrative };
}
