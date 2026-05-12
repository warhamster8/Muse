import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';
import { useStore } from '../store/useStore';
import type { Chapter, Scene } from '../types/narrative';
import type { SceneTimelineEvent, GlobalTimelineEvent } from '../types/timeline';

export function useNarrative() {
  const { currentProject, isLocalMode, chapters, setChapters } = useStore();
  const [loading, setLoading] = useState(false);

  const fetchNarrative = useCallback(async () => {
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
      try {
        // 1. Carica i metadati del progetto (timeline globale)
        const { data: projectData } = await supabase
          .from('projects')
          .select('timeline_events')
          .eq('id', currentProject.id)
          .single();
        
        if (projectData?.timeline_events) {
          useStore.getState().setTimelineEvents(projectData.timeline_events);
        }

        // 2. Carica capitoli e scene
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*, scenes(*)')
          .eq('project_id', currentProject.id)
          .order('order_index', { ascending: true });

        if (chaptersError) {
          throw chaptersError;
        } else {
          const sortedChapters = (chaptersData as any[]).map((ch: any) => ({
            ...ch,
            scenes: ch.scenes.sort((a: Scene, b: Scene) => a.order_index - b.order_index)
          }));
          
          // Sincronizza cache locale con i dati freschi dal cloud
          sortedChapters.forEach(ch => {
            const { scenes, ...chData } = ch;
            storage.update('chapters', ch.id, chData);
            if (!storage.getCollection('chapters').find((c: any) => c.id === ch.id)) {
              storage.insert('chapters', { ...chData, id: ch.id });
            }
            scenes.forEach((s: any) => {
              storage.update('scenes', s.id, s);
              if (!storage.getCollection('scenes').find((sc: any) => sc.id === s.id)) {
                storage.insert('scenes', { ...s, id: s.id });
              }
            });
          });
          
          setChapters(sortedChapters);
        }
      } catch (err) {
        console.warn('[CORE] Cloud fetch failed, falling back to local cache:', err);
        // Fallback locale anche in modalità cloud se offline
        const allChapters: Chapter[] = storage.getCollection('chapters');
        const allScenes: Scene[] = storage.getCollection('scenes');
        const projectChapters = allChapters
          .filter(c => c.project_id === currentProject.id)
          .map(ch => ({
            ...ch,
            scenes: allScenes.filter(s => s.chapter_id === ch.id).sort((a, b) => a.order_index - b.order_index)
          }))
          .sort((a, b) => a.order_index - b.order_index);
        setChapters(projectChapters);
      }
    }

    setLoading(false);
  }, [currentProject, isLocalMode, setChapters]);

  // Background Sync Logic
  useEffect(() => {
    if (isLocalMode || !currentProject) return;

    const syncOfflineChanges = async () => {
      const allScenes = storage.getCollection<Scene & { needs_sync?: boolean }>('scenes');
      const pendingScenes = allScenes.filter(s => s.needs_sync);

      if (pendingScenes.length > 0 && navigator.onLine) {
        console.log(`[SYNC] Found ${pendingScenes.length} scenes pending sync...`);
        for (const scene of pendingScenes) {
          try {
            const { error } = await supabase
              .from('scenes')
              .update({ content: scene.content, title: scene.title, order_index: scene.order_index, chapter_id: scene.chapter_id })
              .eq('id', scene.id);
            
            if (!error) {
              storage.update('scenes', scene.id, { needs_sync: false });
            }
          } catch (err) {
            break; // Stop if sync fails again
          }
        }
      }
    };

    const interval = setInterval(syncOfflineChanges, 10000); // Check every 10 seconds
    window.addEventListener('online', syncOfflineChanges);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', syncOfflineChanges);
    };
  }, [isLocalMode, currentProject]);

  const addChapter = async (title: string) => {
    if (!currentProject) return;
    if (isLocalMode) {
      storage.insert('chapters', { project_id: currentProject.id, title, order_index: chapters.length });
      fetchNarrative();
    } else {
      const { data, error } = await supabase
        .from('chapters')
        .insert([{ project_id: currentProject.id, title, order_index: chapters.length }])
        .select()
        .single();
        
      if (error) {
        console.error('Error adding chapter:', error);
        // Inserimento locale di emergenza? Per ora gestiamo solo update offline
        alert('Errore nella creazione del capitolo: ' + error.message);
      } else if (data) {
        storage.insert('chapters', { ...data, id: data.id });
        fetchNarrative();
      }
    }
  };

  const addScene = async (chapterId: string, title: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    const order = chapter?.scenes?.length || 0;
    
    if (isLocalMode) {
      storage.insert('scenes', { chapter_id: chapterId, title, order_index: order, content: '' });
      fetchNarrative();
    } else {
      const { data, error } = await supabase
        .from('scenes')
        .insert([{ chapter_id: chapterId, title, order_index: order }])
        .select()
        .single();
        
      if (error) {
        console.error('Error adding scene:', error);
        alert('Errore nella creazione della scena: ' + error.message);
      } else if (data) {
        storage.insert('scenes', { ...data, id: data.id });
        fetchNarrative();
      }
    }
  };

  const updateSceneContent = async (sceneId: string, content: string) => {
    const updatedChapters = chapters.map(chapter => ({
      ...chapter,
      scenes: chapter.scenes?.map(scene => 
        scene.id === sceneId ? { ...scene, content } : scene
      )
    }));
    setChapters(updatedChapters);

    // Update Local Cache
    storage.update('scenes', sceneId, { content, needs_sync: !isLocalMode });

    if (!isLocalMode) {
      try {
        const { error } = await supabase.from('scenes').update({ content }).eq('id', sceneId);
        if (!error) {
          storage.update('scenes', sceneId, { needs_sync: false });
        }
      } catch (err) {
        console.warn('[SYNC] Offline saving...');
      }
    }
  };

  const reorderScenes = async (updatedChapters: Chapter[]) => {
    setChapters(updatedChapters);

    // Update Local Cache
    const allScenes = storage.getCollection<Scene>('scenes');
    const updatedScenesMap = new Map();
    updatedChapters.forEach(c => {
      c.scenes?.forEach((s, idx) => {
        updatedScenesMap.set(s.id, { ...s, chapter_id: c.id, order_index: idx });
      });
    });

    const newAllScenes = allScenes.map(s => {
      if (updatedScenesMap.has(s.id)) {
        return { ...updatedScenesMap.get(s.id), needs_sync: !isLocalMode };
      }
      return s;
    });
    storage.setCollection('scenes', newAllScenes);

    if (!isLocalMode) {
      const scenesToUpdate = updatedChapters.flatMap(c => 
        c.scenes?.map((s, idx) => ({
          id: s.id,
          chapter_id: c.id,
          order_index: idx
        })) || []
      );
      
      if (scenesToUpdate.length > 0) {
        const updatePromises = scenesToUpdate.map(scene => 
          supabase.from('scenes').update({ 
            chapter_id: scene.chapter_id, 
            order_index: scene.order_index 
          }).eq('id', scene.id)
        );
        
        try {
          const results = await Promise.all(updatePromises);
          const error = results.find(r => r.error)?.error;
          if (!error) {
            scenesToUpdate.forEach(s => storage.update('scenes', s.id, { needs_sync: false }));
          }
        } catch (err) {
          console.error('Exception reordering scenes:', err);
        }
      }
    }
  };

  const reorderChapters = async (updatedChapters: Chapter[]) => {
    const chaptersWithNewOrder = updatedChapters.map((c, idx) => ({
      ...c,
      order_index: idx
    }));
    setChapters(chaptersWithNewOrder);

    // Update Local Cache
    const allChapters = storage.getCollection<Chapter>('chapters');
    const updatedChaptersMap = new Map();
    chaptersWithNewOrder.forEach(c => {
      updatedChaptersMap.set(c.id, c);
    });

    const newAllChapters = allChapters.map(c => {
      if (updatedChaptersMap.has(c.id)) {
        const updated = updatedChaptersMap.get(c.id);
        return { ...c, order_index: updated.order_index, needs_sync: !isLocalMode };
      }
      return c;
    });
    storage.setCollection('chapters', newAllChapters);

    if (!isLocalMode) {
      const chaptersToUpdate = chaptersWithNewOrder.map(c => ({
        id: c.id,
        order_index: c.order_index
      }));
      
      const updatePromises = chaptersToUpdate.map(chapter => 
        supabase.from('chapters').update({ order_index: chapter.order_index }).eq('id', chapter.id)
      );

      try {
        const results = await Promise.all(updatePromises);
        const error = results.find(r => r.error)?.error;
        if (!error) {
          chaptersToUpdate.forEach(c => storage.update('chapters', c.id, { needs_sync: false }));
        }
      } catch (err) {
        console.error('Exception reordering chapters:', err);
      }
    }
  };

  const renameChapter = async (chapterId: string, title: string) => {
    const updatedChapters = chapters.map(c => c.id === chapterId ? { ...c, title } : c);
    setChapters(updatedChapters);
    storage.update('chapters', chapterId, { title, needs_sync: !isLocalMode });

    if (!isLocalMode) {
      try {
        const { error } = await supabase.from('chapters').update({ title }).eq('id', chapterId);
        if (!error) storage.update('chapters', chapterId, { needs_sync: false });
      } catch (err) {}
    }
  };

  const renameScene = async (sceneId: string, title: string) => {
    const updatedChapters = chapters.map(chapter => ({
      ...chapter,
      scenes: chapter.scenes?.map(scene => scene.id === sceneId ? { ...scene, title } : scene)
    }));
    setChapters(updatedChapters);
    storage.update('scenes', sceneId, { title, needs_sync: !isLocalMode });

    if (!isLocalMode) {
      try {
        const { error } = await supabase.from('scenes').update({ title }).eq('id', sceneId);
        if (!error) storage.update('scenes', sceneId, { needs_sync: false });
      } catch (err) {}
    }
  };

  const updateTimelineEvents = async (sceneId: string, events: SceneTimelineEvent[]) => {
    const updatedChapters = chapters.map(chapter => ({
      ...chapter,
      scenes: chapter.scenes?.map(scene => scene.id === sceneId ? { ...scene, timeline_events: events } : scene)
    }));
    setChapters(updatedChapters);
    storage.update('scenes', sceneId, { timeline_events: events, needs_sync: !isLocalMode });

    if (!isLocalMode) {
      try {
        const { error } = await supabase.from('scenes').update({ timeline_events: events }).eq('id', sceneId);
        if (!error) storage.update('scenes', sceneId, { needs_sync: false });
      } catch (err) {}
    }
  };

  const updateSceneMetadata = async (sceneId: string, metadata: Partial<Scene>) => {
    const updatedChapters = chapters.map(chapter => ({
      ...chapter,
      scenes: chapter.scenes?.map(scene => scene.id === sceneId ? { ...scene, ...metadata } : scene)
    }));
    setChapters(updatedChapters);
    storage.update('scenes', sceneId, { ...metadata, needs_sync: !isLocalMode });

    if (!isLocalMode) {
      try {
        const { error } = await supabase.from('scenes').update(metadata).eq('id', sceneId);
        if (!error) storage.update('scenes', sceneId, { needs_sync: false });
      } catch (err) {}
    }
  };

  const updateProjectTimeline = async (events: GlobalTimelineEvent[]) => {
    if (!currentProject) return;
    useStore.getState().setTimelineEvents(events);
    if (!isLocalMode) {
      await supabase.from('projects').update({ timeline_events: events }).eq('id', currentProject.id);
    }
  };

  const deleteChapter = async (chapterId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo capitolo e tutte le sue scene?')) return;
    if (isLocalMode) {
      storage.delete('chapters', chapterId);
      const allScenes = storage.getCollection<Scene>('scenes');
      storage.setCollection('scenes', allScenes.filter(s => s.chapter_id !== chapterId));
      fetchNarrative();
    } else {
      const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
      if (!error) {
        storage.delete('chapters', chapterId);
        fetchNarrative();
      }
    }
  };

  const deleteScene = async (sceneId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa scena?')) return;
    if (isLocalMode) {
      storage.delete('scenes', sceneId);
      fetchNarrative();
    } else {
      const { error } = await supabase.from('scenes').delete().eq('id', sceneId);
      if (!error) {
        storage.delete('scenes', sceneId);
        fetchNarrative();
      }
    }
  };

  useEffect(() => {
    fetchNarrative();
  }, [fetchNarrative]);

  return { 
    chapters, 
    loading, 
    addChapter, 
    addScene, 
    deleteChapter,
    deleteScene,
    updateSceneContent, 
    updateTimelineEvents,
    updateSceneMetadata,
    updateProjectTimeline,
    reorderScenes, 
    reorderChapters, 
    renameChapter,
    renameScene,
    refresh: fetchNarrative 
  };
}
