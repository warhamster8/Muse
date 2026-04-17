import React from 'react';
import { Plus, Map, Info, Home, Landmark } from 'lucide-react';
import { useWorld } from '../hooks/useWorld';
import { cn } from '../lib/utils';
import { CreationModal } from '../components/CreationModal';
import { useToast } from '../components/Toast';

export const WorldView: React.FC = () => {
  const { settings, addSetting, updateSetting } = useWorld();
  const { addToast } = useToast();
  const [selectedSettingId, setSelectedSettingId] = React.useState<string | null>(null);
  const selectedSetting = React.useMemo(() => 
    settings.find(s => s.id === selectedSettingId) || null,
  [settings, selectedSettingId]);

  const [localName, setLocalName] = React.useState('');
  const [localDescription, setLocalDescription] = React.useState('');

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Sync local state when selection changes
  React.useEffect(() => {
    if (selectedSetting) {
      setLocalName(selectedSetting.name || '');
      setLocalDescription(selectedSetting.description || '');
    }
  }, [selectedSetting?.id]);

  // Debounce updates for name
  React.useEffect(() => {
    if (!selectedSetting) return;
    const timer = setTimeout(() => {
      if (localName !== selectedSetting.name && localName.trim() !== '') {
        updateSetting(selectedSetting.id, { name: localName });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [localName, selectedSetting?.id]);

  // Debounce updates for description
  React.useEffect(() => {
    if (!selectedSetting) return;
    const timer = setTimeout(() => {
      if (localDescription !== selectedSetting.description) {
        updateSetting(selectedSetting.id, { description: localDescription });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [localDescription, selectedSetting?.id]);

  const handleConfirmAdd = (name: string) => {
    addSetting(name, 'Primary');
    addToast(`Luogo "${name}" aggiunto al mondo`, 'success');
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
          <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 p-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
          {settings.map(s => (
            <div 
              key={s.id}
              onClick={() => setSelectedSettingId(s.id)}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer",
                selectedSettingId === s.id 
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
            <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/20">
              <div className="flex-1 mr-4">
                <input 
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  className="w-full bg-transparent text-2xl font-bold font-serif text-white focus:outline-none placeholder:opacity-20"
                  placeholder="Nome del luogo..."
                />
                <span className="text-[10px] text-emerald-500/50 uppercase tracking-widest font-bold">Element Identity</span>
              </div>
              <select 
                value={selectedSetting.type}
                onChange={(e) => updateSetting(selectedSetting.id, { type: e.target.value as 'Primary' | 'Secondary' })}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 transition-all font-bold"
              >
                <option value="Primary">Primary Location</option>
                <option value="Secondary">Secondary Location</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Info className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Description & Sensory Details</h4>
                </div>
                <textarea 
                  className="w-full h-80 bg-slate-900/50 border border-slate-700 rounded-2xl p-6 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-slate-900/80 leading-relaxed transition-all placeholder:opacity-20"
                  placeholder="What does it smell like? What are the key features? Is it crowded or silent?"
                  value={localDescription}
                  onChange={(e) => setLocalDescription(e.target.value)}
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
      
      <CreationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAdd}
        title="Nuovo Luogo"
        placeholder="Inserisci il nome della location..."
      />
    </div>
  );
};
