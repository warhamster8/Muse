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
    <div className="w-60 h-screen bg-[#050505] border-r border-white/5 flex flex-col p-4 shadow-2xl z-30">
      <div className="p-4 flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-[24px] bg-[#0f0f0f] border border-white/10 flex items-center justify-center p-2 mb-4 logo-glow">
          <img src="/logo.png" alt="Muse Logo" className="w-full h-full object-contain logo-blend scale-110" />
        </div>
        <h1 className="text-[11px] font-black tracking-[0.5em] font-display text-[#5be9b1] uppercase">Project Muse</h1>
      </div>

      <div className="px-2 mb-10">
        <button 
          onClick={() => setCurrentProject(null)}
          className="w-full text-left group"
        >
          <div className="bg-[#0f0f0f] rounded-2xl p-4 border border-white/10 group-hover:border-[#5be9b1]/40 transition-all shadow-sm">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">
              <Library className="w-3.5 h-3.5 text-[#5be9b1]" />
              <span>Libreria</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black truncate text-slate-100">{currentProject?.title || 'Seleziona...'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#5be9b1] transition-colors" />
            </div>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-1 space-y-1.5">
        <div className="px-4 mb-3">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Architecture</span>
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center space-x-3 px-5 py-3 rounded-2xl transition-all duration-300 group",
              activeTab === item.id 
                ? "bg-[#5be9b1] text-[#000000] shadow-lg shadow-black/20" 
                : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            <item.icon className={cn("w-4 h-4 transition-colors", activeTab === item.id ? "text-[#000000]" : "group-hover:text-[#5be9b1]/50")} />
            <span className="text-sm font-black tracking-tighter">{item.label}</span>
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

