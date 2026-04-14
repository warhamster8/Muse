import React from 'react';
import { Plus, Map, Info, Home, Landmark } from 'lucide-react';
import { useWorld } from '../hooks/useWorld';
import type { Setting } from '../hooks/useWorld';
import { cn } from '../lib/utils';

export const WorldView: React.FC = () => {
  const { settings, addSetting, updateSetting } = useWorld();
  const [selectedSetting, setSelectedSetting] = React.useState<Setting | null>(null);

  const handleAdd = async () => {
    const name = prompt('Location Name:');
    if (name) await addSetting(name, 'Primary');
  };

  return (
    <div className="flex h-full gap-6 overflow-hidden">
      {/* Settings List */}
      <div className="w-80 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2">
            <Map className="w-5 h-5 text-emerald-400" />
            World Building
          </h2>
          <button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-500 p-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {settings.map(s => (
            <div 
              key={s.id}
              onClick={() => setSelectedSetting(s)}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer",
                selectedSetting?.id === s.id 
                  ? "glass border-emerald-500 bg-emerald-600/10" 
                  : "bg-slate-800/50 border-slate-700 hover:border-slate-500"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-100">{s.name}</h3>
                {s.type === 'Primary' ? <Landmark className="w-3 h-3 text-emerald-400" /> : <Home className="w-3 h-3 text-slate-500" />}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{s.description || 'No description yet...'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Area */}
      <div className="flex-1 min-w-0 glass rounded-2xl border border-slate-700 flex flex-col overflow-hidden">
        {selectedSetting ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold font-serif">{selectedSetting.name}</h2>
                <span className="text-xs text-slate-500 uppercase tracking-widest">Location Details</span>
              </div>
              <select 
                value={selectedSetting.type}
                onChange={(e) => updateSetting(selectedSetting.id, { type: e.target.value as 'Primary' | 'Secondary' })}
                className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-2 outline-none"
              >
                <option value="Primary">Primary Location</option>
                <option value="Secondary">Secondary Location</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Info className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Description & Sensory Details</h4>
                </div>
                <textarea 
                  className="w-full h-64 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 leading-relaxed"
                  placeholder="What does it smell like? What are the key features? Is it crowded or silent?"
                  value={selectedSetting.description}
                  onChange={(e) => updateSetting(selectedSetting.id, { description: e.target.value })}
                />
              </section>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
            <Map className="w-16 h-16 opacity-10" />
            <p className="text-sm">Select a location to view details.</p>
          </div>
        )}
      </div>
    </div>
  );
};
