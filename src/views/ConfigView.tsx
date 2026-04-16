import React from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Settings, Cpu, Zap, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/Toast';

export const ConfigView: React.FC = () => {
  const { user, aiConfig, setAIConfig } = useStore();
  const { addToast } = useToast();

  const handleProviderChange = async (provider: 'groq' | 'gemini') => {
    setAIConfig({ provider });
    
    // Salvataggio automatico nel profilo Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({ 
            ai_settings: { 
              ...aiConfig, 
              provider 
            } 
          })
          .eq('user_id', user.id);
          
        if (error) throw error;
        addToast(`Provider aggiornato a ${provider}`, 'success');
      } catch (err) {
        console.error("Errore salvataggio config:", err);
        addToast("Errore durante il salvataggio", 'error');
      }
    } else {
      addToast(`Provider impostato a ${provider} (Sola lettura)`, 'info');
    }
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30">
          <Settings className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Impostazioni AI</h1>
          <p className="text-slate-400">Configura il tuo architetto narrativo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Groq Card */}
        <button
          onClick={() => handleProviderChange('groq')}
          className={`relative p-6 rounded-3xl border text-left transition-all duration-300 overflow-hidden group ${
            aiConfig.provider === 'groq' 
              ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-900/20' 
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${aiConfig.provider === 'groq' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Zap className="w-6 h-6" />
            </div>
            {aiConfig.provider === 'groq' && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500 text-white px-2 py-1 rounded-md">Attivo</span>
            )}
          </div>
          <h3 className="text-xl font-bold mb-2">Groq (Llama 3.3)</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Velocità estrema e latenza quasi zero. Ideale per suggerimenti rapidi e scrittura fluida.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="text-[10px] px-2 py-1 bg-slate-800 rounded text-slate-500 border border-slate-700">70B Parameters</span>
            <span className="text-[10px] px-2 py-1 bg-slate-800 rounded text-slate-500 border border-slate-700">LPU Optimized</span>
          </div>
        </button>

        {/* Gemini Card */}
        <button
          onClick={() => handleProviderChange('gemini')}
          className={`relative p-6 rounded-3xl border text-left transition-all duration-300 overflow-hidden group ${
            aiConfig.provider === 'gemini' 
              ? 'bg-purple-600/10 border-purple-500 shadow-lg shadow-purple-900/20' 
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${aiConfig.provider === 'gemini' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Cpu className="w-6 h-6" />
            </div>
            {aiConfig.provider === 'gemini' && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-purple-500 text-white px-2 py-1 rounded-md">Attivo</span>
            )}
          </div>
          <h3 className="text-xl font-bold mb-2">Gemini 1.5 Flash</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Finestra di contesto enorme (1M+ token). Perfetto per analizzare interi romanzi e mantenere la coerenza.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="text-[10px] px-2 py-1 bg-slate-800 rounded text-slate-500 border border-slate-700">Long Context</span>
            <span className="text-[10px] px-2 py-1 bg-slate-800 rounded text-slate-500 border border-slate-700">Multimodal</span>
          </div>
        </button>
      </div>

      <div className="glass p-8 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
           <ShieldCheck className="w-5 h-5 text-emerald-400" />
           Stato Sicurezza API
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <p className="text-[10px] uppercase tracking-tighter text-slate-500 font-bold mb-1">Status Chiave Gemini</p>
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${aiConfig.geminiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                 <span className="font-mono text-sm">
                    {aiConfig.geminiKey ? 'Configurata nel Database' : 'Non Trovata'}
                 </span>
              </div>
           </div>
           
           <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <p className="text-[10px] uppercase tracking-tighter text-slate-500 font-bold mb-1">Archiviazione</p>
              <span className="text-sm text-slate-300">Supabase Cloud Vault</span>
           </div>
        </div>

        {!aiConfig.geminiKey && (
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200/80 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>
              Non è stata rilevata una chiave Gemini nel tuo profilo. Per attivarla, esegui il comando SQL fornito dall'assistente nel tuo dashboard Supabase.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
