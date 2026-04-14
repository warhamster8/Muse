import React from 'react';
import { 
  Users, 
  Globe, 
  BookOpen, 
  BarChart2, 
  Settings, 
  LogOut,
  ChevronRight,
  Plus,
  Network
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { id: 'narrative', label: 'Narrative', icon: BookOpen },
  { id: 'characters', label: 'Characters', icon: Users },
  { id: 'world', label: 'World Settings', icon: Globe },
  { id: 'mindmap', label: 'Mindmap', icon: Network },
  { id: 'analysis', label: 'Analysis', icon: BarChart2 },
];

export const Sidebar: React.FC = () => {
  const { currentProject, activeTab, setActiveTab } = useStore();

  return (
    <div className="w-64 h-screen glass border-r border-slate-700 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Project Muse
        </h1>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Novel Architect</p>
      </div>

      <div className="px-4 mb-4">
        <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Current Project</p>
          <div className="flex items-center justify-between">
            <span className="font-medium truncate">{currentProject?.title || 'No Project Selected'}</span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
              activeTab === item.id 
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-700/50 space-y-1">
        <button onClick={() => setActiveTab('config')} className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
          <Settings className="w-5 h-5" />
          <span>Config</span>
        </button>
        <button className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-red-900/20 hover:text-red-400 rounded-lg text-slate-400 transition-colors">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
