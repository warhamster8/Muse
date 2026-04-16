import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Chapter } from '../types/narrative';

export type ViewTab = 'narrative' | 'characters' | 'world' | 'notes' | 'analysis' | 'config';

interface User {
  id: string;
  email?: string;
}

interface Project {
  id: string;
  title: string;
}

interface AppState {
  user: User | null;
  currentProject: Project | null;
  activeTab: ViewTab;
  activeSceneId: string | null;
  currentSceneContent: string;
  chapters: Chapter[];
  isLocalMode: boolean;
  isLoading: boolean;
  activeSuggestions: string[];
  ignoredSuggestions: Record<string, string[]>;
  lastAnalyzedPhrase: Record<string, string>;
  
  setUser: (user: User | null) => void;
  setCurrentProject: (project: Project | null) => void;
  setActiveTab: (tab: ViewTab) => void;
  setActiveSceneId: (id: string | null) => void;
  setCurrentSceneContent: (content: string) => void;
  setChapters: (chapters: Chapter[]) => void;
  setLocalMode: (enabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  setActiveSuggestions: (suggestions: string[]) => void;
  addIgnoredSuggestion: (sceneId: string, suggestion: string) => void;
  setLastAnalyzedPhrase: (sceneId: string, phrase: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      currentProject: null,
      activeTab: 'narrative',
      activeSceneId: null,
      currentSceneContent: '',
      chapters: [],
      isLocalMode: false,
      isLoading: false,
      activeSuggestions: [],
      ignoredSuggestions: {},
      lastAnalyzedPhrase: {},
      
      setUser: (user) => set({ user }),
      setCurrentProject: (project) => set({ currentProject: project }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveSceneId: (id) => set({ activeSceneId: id }),
      setCurrentSceneContent: (content) => set({ currentSceneContent: content }),
      setChapters: (chapters) => set({ chapters }),
      setLocalMode: (enabled) => set({ isLocalMode: enabled, user: null, currentProject: null }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () => set({ user: null, currentProject: null, isLocalMode: false }),
      setActiveSuggestions: (suggestions) => set({ activeSuggestions: suggestions }),
      addIgnoredSuggestion: (sceneId, suggestion) => set((state) => ({
        ignoredSuggestions: {
          ...(state.ignoredSuggestions || {}),
          [sceneId]: [...((state.ignoredSuggestions || {})[sceneId] || []), suggestion]
        }
      })),
      setLastAnalyzedPhrase: (sceneId, phrase) => set((state) => ({
        lastAnalyzedPhrase: {
          ...(state.lastAnalyzedPhrase || {}),
          [sceneId]: phrase
        }
      })),
    }),
    {
      name: 'muse-storage',
      partialize: (state) => ({ 
        user: state.user, 
        currentProject: state.currentProject, 
        isLocalMode: state.isLocalMode,
        activeTab: state.activeTab,
        ignoredSuggestions: state.ignoredSuggestions || {},
        lastAnalyzedPhrase: state.lastAnalyzedPhrase || {}
      }),
    }
  )
);
