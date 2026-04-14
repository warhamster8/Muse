import React from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  Lightbulb, 
  Zap,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { groqService } from '../lib/groq';
import { useStore } from '../store/useStore';

type SidekickTab = 'consistency' | 'braindump' | 'transformer';

export const AISidekick: React.FC = () => {
  const { currentSceneContent: content } = useStore();
  const [activeTab, setActiveTab] = React.useState<SidekickTab>('consistency');
  const [analysis, setAnalysis] = React.useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const runStyleTransform = async (style: string) => {
    if (!content || content.length < 10) return;
    setIsAnalyzing(true);
    try {
      const messages = [
        { 
          role: 'system', 
          content: `You are a Senior Fiction Editor. Transform the user's input using the 'Show, Don't Tell' technique. 
          Style focus: ${style.toUpperCase()}. 
          1. VISCERAL: focus on physical sensations. 
          2. ATMOSPHERIC: focus on environment and light. 
          3. METAPHORICAL: use similes and symbolism. 
          4. PSICHOLOGICAL: explore internal monologue.
          BE ORIGINAL AND EVOCATIVE. USE ITALIAN.` 
        },
        { role: 'user', content: `Rewrite this: ${content}` }
      ];
      const res = await groqService.getChatCompletion(messages);
      setAnalysis(res.choices[0]?.message?.content || '');
    } catch (err) {
      setAnalysis('Error connecting to AI service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runConsistencyCheck = async () => {
    if (!content || content.length < 50) return;
    setIsAnalyzing(true);
    try {
      const messages = [
        { 
          role: 'system', 
          content: 'You are a story consistency checker. Analyze the provided scene text and identify potential contradictions with characters or logical gaps. Be concise.' 
        },
        { role: 'user', content: `Analyze this scene: ${content}` }
      ];
      const res = await groqService.getChatCompletion(messages);
      setAnalysis(res.choices[0]?.message?.content || 'No issues found.');
    } catch (err) {
      setAnalysis('Error connecting to AI service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-80 h-screen glass border-l border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-slate-200">AI Sidekick</h2>
        </div>
        {isAnalyzing && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
      </div>

      <div className="flex p-2 gap-1">
        {(['consistency', 'braindump', 'transformer'] as SidekickTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 text-[10px] uppercase tracking-tighter py-2 rounded transition-all",
              activeTab === tab ? "bg-slate-700 text-blue-400" : "text-slate-500 hover:text-slate-300"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'consistency' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Context Analysis</span>
              <button 
                onClick={runConsistencyCheck}
                className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-white flex items-center space-x-1"
              >
                <Zap className="w-3 h-3" />
                <span>Check</span>
              </button>
            </div>
            
            {analysis ? (
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700 text-sm leading-relaxed text-slate-300">
                {analysis}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-600 space-y-2">
                <AlertTriangle className="w-8 h-8 opacity-20" />
                <p className="text-xs text-center">Ready to analyze your scene for contradictions.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'braindump' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">Need inspiration? Use braindumping to explore sensory details or twists.</p>
            <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded-lg flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0" />
              <p className="text-xs text-slate-300">Try focusing on the smell of the room to heighten the tension in this moment.</p>
            </div>
          </div>
        )}
        {activeTab === 'transformer' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">Transform your paragraph using "Show, Don't Tell" styles.</p>
            <div className="grid grid-cols-2 gap-2">
              {['visceral', 'atmospheric', 'metaphorical', 'psychological'].map((style) => (
                <button
                  key={style}
                  onClick={() => runStyleTransform(style)}
                  disabled={isAnalyzing}
                  className="bg-slate-800 hover:bg-slate-700 p-2 rounded text-[10px] uppercase font-bold text-slate-300 border border-slate-700 transition-colors"
                >
                  {style}
                </button>
              ))}
            </div>
            {analysis && activeTab === 'transformer' && (
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700 text-sm leading-relaxed text-slate-300 animate-in fade-in">
                {analysis}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-700 space-y-3">
         <div className="flex items-center space-x-2 text-[10px] text-slate-500 uppercase font-bold">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Llama 3 Connected</span>
         </div>
      </div>
    </div>
  );
};
