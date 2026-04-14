import { create } from 'zustand';

export type ViewTab = 'narrative' | 'characters' | 'world' | 'mindmap' | 'analysis' | 'config';

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
  isLocalMode: boolean;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setCurrentProject: (project: Project | null) => void;
  setActiveTab: (tab: ViewTab) => void;
  setActiveSceneId: (id: string | null) => void;
  setCurrentSceneContent: (content: string) => void;
  setLocalMode: (enabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  currentProject: null,
  activeTab: 'narrative',
  activeSceneId: null,
  currentSceneContent: '',
  isLocalMode: false,
  isLoading: false,
  
  setUser: (user) => set({ user }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveSceneId: (id) => set({ activeSceneId: id }),
  setCurrentSceneContent: (content) => set({ currentSceneContent: content }),
  setLocalMode: (enabled) => set({ isLocalMode: enabled, user: null, currentProject: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ user: null, currentProject: null, isLocalMode: false }),
}));
