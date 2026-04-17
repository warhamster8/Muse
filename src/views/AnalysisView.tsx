import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  Book, 
  Clock, 
  TrendingUp, 
  Layout,
  Activity
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useCharacters } from '../hooks/useCharacters';
import { 
  cleanHtml, 
  countWords, 
  lexicalDiversity, 
  getTopWords, 
  countCharacterMentions 
} from '../lib/analysisUtils';

const COLORS = ['#10b981', '#059669', '#34d399', '#065f46', '#064e40', '#022c22'];

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, trend }) => (
  <div className="bg-white/[0.02] p-8 rounded-[32px] border border-white/5 hover:border-emerald-500/20 transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-all" />
    <div className="flex items-center justify-between mb-6">
      <div className="p-3 bg-slate-900 rounded-[18px] text-emerald-500 border border-white/5 group-hover:scale-110 transition-transform shadow-inner">
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Pacing</span>
          <span className="text-[9px] text-slate-500">{trend}</span>
        </div>
      )}
    </div>
    <div className="text-4xl font-medium text-slate-50 mb-1 tracking-tighter">{value}</div>
    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{title}</div>
  </div>
);

export const AnalysisView: React.FC = () => {
  const { chapters } = useStore();
  const { characters } = useCharacters();

  // ─── Data Aggregation ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalWords = 0;
    let totalChars = 0;
    const chapterData: any[] = [];
    let fullText = '';
    
    chapters.forEach((chapter, index) => {
      let chapterWords = 0;
      let chapterSentences = 0;
      
      chapter.scenes?.forEach(scene => {
        const plain = cleanHtml(scene.content || '');
        fullText += plain + ' ';
        const words = countWords(plain);
        chapterWords += words;
        totalWords += words;
        totalChars += plain.length;
        
        const sentences = plain.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        chapterSentences += sentences;
      });
      
      chapterData.push({
        name: `C${index + 1}`,
        fullName: `Capitolo ${index + 1}`,
        words: chapterWords,
        pacing: chapterSentences > 0 ? (chapterWords / chapterSentences).toFixed(1) : 0
      });
    });

    const wordsPerMinute = 200;
    const readingTime = Math.ceil(totalWords / wordsPerMinute);
    const diversity = lexicalDiversity(fullText);
    const topWords = getTopWords(fullText, 5);
    const characterMentions = countCharacterMentions(fullText, characters.map(c => c.name));

    return {
      totalWords,
      totalChars,
      readingTime,
      chapterData,
      diversity: diversity.toFixed(1) + '%',
      topWords,
      characterMentions
    };
  }, [chapters, characters]);

  if (chapters.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-6 bg-slate-900/10 rounded-[40px] border border-white/5">
        <Activity className="w-16 h-16 opacity-10" />
        <div className="text-center">
            <h3 className="text-lg font-medium text-slate-400">Nessun dato disponibile</h3>
            <p className="text-xs opacity-50 max-w-[200px] mx-auto mt-2">Inizia a scrivere per sbloccare le proiezioni statistiche del tuo manoscritto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-700">
      <header className="flex items-center justify-between bg-white/[0.02] p-8 rounded-[32px] border border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-[0.2em]">DASHBOARD ANALITICA</span>
          </div>
          <h1 className="text-4xl font-medium tracking-tight">Anatomia del Manoscritto</h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right hidden md:block">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ultimo Update</div>
              <div className="text-xs text-slate-400 font-mono">Just now</div>
           </div>
           <button className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-xl shadow-emerald-950/20 transition-all active:scale-95">
             Genera Report PDF
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-hide">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Parole Totali" value={stats.totalWords.toLocaleString()} icon={Book} trend="+1.2k today" />
          <MetricCard title="Sessione Lettura" value={`${stats.readingTime}m`} icon={Clock} />
          <MetricCard title="Ricchezza Lessico" value={stats.diversity} icon={TrendingUp} />
          <MetricCard title="Draft Volume" value={(stats.totalChars / 1000).toFixed(1) + 'k'} icon={Layout} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chapter Balance Chart */}
          <div className="lg:col-span-2 bg-white/[0.02] p-10 rounded-[40px] border border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-xl font-medium flex items-center gap-3">
                  Bilanciamento Capitoli
                </h2>
                <p className="text-xs text-slate-500 mt-1">Distribuzione della densità testuale per sezione.</p>
              </div>
              <div className="flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-emerald-500/40" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Word Count</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chapterData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} dy={15} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(16, 185, 129, 0.03)' }}
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '12px' }}
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    labelStyle={{ opacity: 0.5, marginBottom: '4px' }}
                  />
                  <Bar dataKey="words" fill="url(#emeraldGradient)" radius={[8, 8, 4, 4]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Character Mentions */}
          <div className="bg-white/[0.02] p-10 rounded-[40px] border border-white/5 shadow-sm flex flex-col">
            <h2 className="text-xl font-medium mb-10">Focus Protagonisti</h2>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.characterMentions}
                    innerRadius={80}
                    outerRadius={105}
                    paddingAngle={8}
                    dataKey="count"
                    stroke="none"
                  >
                    {stats.characterMentions.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle" 
                    wrapperStyle={{ paddingTop: '30px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.1em', opacity: 0.5 }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
          {/* Narrative Pacing Area Chart */}
          <div className="bg-white/[0.02] p-10 rounded-[40px] border border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-xl font-medium">Ritmo Narrativo</h2>
                <p className="text-xs text-slate-500 mt-1">Variazione del pacing tra capitoli (Avg w/s).</p>
              </div>
              <Activity className="w-5 h-5 text-emerald-500/30" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chapterData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} dy={15} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px' }}
                  />
                  <Area type="monotone" dataKey="pacing" stroke="#10b981" strokeWidth={4} fill="url(#paceGradient)" dot={{ r: 5, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 8, stroke: '#020617', strokeWidth: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lexical Lab */}
          <div className="flex flex-col gap-6">
             <div className="bg-white/[0.02] p-10 rounded-[40px] border border-white/5 shadow-sm flex-1">
                <h2 className="text-xl font-medium mb-8">Analisi del Lessico</h2>
                <div className="space-y-6">
                  {stats.topWords.map((item, idx) => (
                    <div key={idx} className="group cursor-default">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-700 tracking-widest">{idx + 1}</span>
                            <span className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 transition-colors uppercase tracking-widest">{item.word}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-white/5 px-2 py-0.5 rounded-lg">{item.count}</span>
                      </div>
                      <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                          style={{ width: `${(item.count / stats.topWords[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
             </div>
             
             <div className="bg-emerald-600 p-10 rounded-[40px] flex items-center gap-6 group hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.3)] transition-all cursor-pointer">
                <div className="p-4 bg-white/20 rounded-[24px] backdrop-blur-md">
                   <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                   <div className="text-lg font-bold text-white tracking-tight">AI Insights Engine</div>
                   <p className="text-sm text-emerald-100 opacity-90 leading-tight mt-1">Analizza la coerenza del tono e il climax della tua opera.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
);
};

const Zap: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor"></polygon>
  </svg>
);
