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
    <div className="w-64 h-[calc(100vh-1rem)] m-1 glass-dark rounded-[40px] flex flex-col p-6 z-30 shadow-2xl relative overflow-hidden">
      {/* Sidebar background decorative glow */}
      <div className="absolute top-0 left-0 w-full h-32 bg-[#5be9b1]/5 blur-[60px] pointer-events-none" />

      <div className="relative flex flex-col items-center mb-10 pt-2">
        <div className="w-48 aspect-square flex items-center justify-center logo-glow overflow-hidden group">
          <img 
            src="/logo.png" 
            alt="Muse Logo" 
            className="w-full h-full object-contain logo-blend transition-all duration-1000 group-hover:scale-110 group-hover:rotate-3" 
          />
        </div>
      </div>

      <div className="mb-10">
        <button 
          onClick={() => setCurrentProject(null)}
          className="w-full text-left group"
        >
          <div className="glass-emerald rounded-[32px] p-5 border border-white/5 group-hover:border-[#5be9b1]/40 transition-all hover:translate-x-1 shadow-lg">
            <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-black mb-1.5 tracking-[0.3em]">
              <Library className="w-3.5 h-3.5 text-[#5be9b1]" />
              <span>Project Nexus</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black truncate text-slate-100 uppercase tracking-tighter">{currentProject?.title || 'Open Library'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#5be9b1] transition-all group-hover:translate-x-1" />
            </div>
          </div>
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        <div className="px-5 mb-4">
            <span className="text-[10px] font-black text-[#5be9b1]/30 uppercase tracking-[0.4em]">Architecture</span>
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center space-x-4 px-6 py-4 rounded-[24px] transition-all duration-500 group relative overflow-hidden",
              activeTab === item.id 
                ? "bg-[#5be9b1] text-[#0b0e11] shadow-[0_15px_30px_-5px_rgba(91,233,177,0.3)] scale-105" 
                : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            {activeTab === item.id && (
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
            )}
            <item.icon className={cn("w-4 h-4 transition-all duration-500 z-10", activeTab === item.id ? "text-[#0b0e11] scale-110" : "group-hover:text-[#5be9b1]")} />
            <span className="text-[11px] font-black uppercase tracking-widest z-10">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="w-full h-12 flex items-center justify-center gap-3 bg-red-500/5 hover:bg-red-500/10 text-red-400/50 hover:text-red-400 rounded-2xl transition-all duration-500 text-[10px] font-black uppercase tracking-widest group border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Exit System</span>
        </button>
      </div>
    </div>
  );
};

