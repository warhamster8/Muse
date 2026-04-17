import React from 'react';
import { 
  Users, 
  Globe, 
  BookOpen, 
  BarChart2, 
  Settings, 
  LogOut,
  ChevronRight,
  StickyNote,
  Library
} from 'lucide-react';
import { useStore, type ViewTab } from '../store/useStore';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

type NavItem = {
  id: ViewTab;
  label: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { id: 'narrative', label: 'Narrative', icon: BookOpen },
  { id: 'characters', label: 'Characters', icon: Users },
  { id: 'world', label: 'World Settings', icon: Globe },
  { id: 'notes', label: 'Note', icon: StickyNote },
  { id: 'analysis', label: 'Analysis', icon: BarChart2 },
  { id: 'config', label: 'AI Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { currentProject, activeTab, setActiveTab, setCurrentProject, logout } = useStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
  };

  return (
    <div className="w-60 h-screen bg-slate-950 border-r border-white/5 flex flex-col p-4">
      <div className="p-4 flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-3xl glass flex items-center justify-center p-2 mb-3 border-white/5 shadow-2x logo-glow">
          <img src="/logo.png" alt="Muse Logo" className="w-full h-full object-contain logo-blend scale-110" />
        </div>
        <h1 className="text-sm font-bold tracking-[0.2em] font-display text-emerald-500">PROJECT MUSE</h1>
      </div>

      <div className="px-2 mb-8">
        <button 
          onClick={() => setCurrentProject(null)}
          className="w-full text-left group"
        >
          <div className="bg-slate-900/40 rounded-2xl p-4 border border-white/5 group-hover:border-emerald-500/30 transition-all hover:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold mb-1.5 tracking-widest">
              <Library className="w-3 h-3 text-emerald-600" />
              <span>Libreria</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate text-slate-100">{currentProject?.title || 'Seleziona...'}</span>
              <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </div>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-1 space-y-1.5">
        <div className="px-4 mb-2">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Architecture</span>
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-300 group",
              activeTab === item.id 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "text-slate-500 hover:bg-slate-900/50 hover:text-slate-200"
            )}
          >
            <item.icon className={cn("w-4 h-4 transition-colors", activeTab === item.id ? "text-emerald-400" : "group-hover:text-emerald-500/50")} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-white/5 space-y-1">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-red-950/20 hover:text-red-400 rounded-xl text-slate-600 transition-all text-sm group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Chiudi Sessione</span>
        </button>
      </div>
    </div>
  );
};

