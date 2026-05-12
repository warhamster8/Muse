import React from 'react';
import { 
  Users, 
  Globe, 
  BookOpen, 
  BarChart2, 
  Settings, 
  LogOut,
  StickyNote,
  GitCommit,
  Sun,
  Moon
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
  { id: 'timeline', label: 'Timeline', icon: GitCommit },
  { id: 'analysis', label: 'Analysis', icon: BarChart2 },
  { id: 'config', label: 'Project & AI', icon: Settings },
];

export const Sidebar: React.FC = React.memo(() => {
  const activeTab = useStore(s => s.activeTab);
  const setActiveTab = useStore(s => s.setActiveTab);
  const logout = useStore(s => s.logout);
  const theme = useStore(s => s.theme);
  const setTheme = useStore(s => s.setTheme);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
  };

  return (
    <div className="w-full md:w-16 h-16 md:h-full glass rounded-t-[24px] md:rounded-b-none flex flex-row md:flex-col p-2 z-40 shadow-soft relative overflow-hidden transition-all duration-500 items-center justify-between">
      
      {/* Top Logo Area */}
      <div className="hidden md:flex relative flex-col items-center mb-6 pt-2">
        <div className="w-10 h-10 flex items-center justify-center logo-glow overflow-hidden rounded-xl p-1">
          <img src="/logo.png" alt="Muse" className="w-full h-full object-contain logo-blend" />
        </div>
      </div>

      {/* Nav Icons */}
      <nav className="flex-1 flex flex-row md:flex-col items-center md:items-center justify-center space-x-2 md:space-x-0 md:space-y-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 group relative",
              activeTab === item.id 
                ? "bg-[var(--accent)] text-[var(--bg-deep)] shadow-glow-mint" 
                : "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
            )}
          >
            <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "")} />
          </button>
        ))}
      </nav>

      {/* Bottom Icons */}
      <div className="flex flex-row md:flex-col items-center md:items-center border-l md:border-l-0 md:border-t border-[var(--border-subtle)] space-x-2 md:space-x-0 md:space-y-4 pt-0 md:pt-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-10 h-10 flex items-center justify-center bg-[var(--bg-surface)]/40 hover:bg-[var(--accent-soft)] text-[var(--text-secondary)] hover:text-[var(--accent)] rounded-xl transition-all"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button 
          onClick={handleLogout}
          className="w-10 h-10 flex items-center justify-center bg-red-500/5 hover:bg-red-500/10 text-red-400/50 hover:text-red-400 rounded-xl transition-all"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

