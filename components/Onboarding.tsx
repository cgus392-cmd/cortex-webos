
import React, { useState, useEffect, useRef } from 'react';
import { School, Wand2, Loader2, Link2, Globe, Search, ChevronRight, GraduationCap, Sun, Moon, Check, ArrowRight, ChevronLeft, Lightbulb, Bot, CalendarPlus, Layers, Zap } from 'lucide-react';
import { User, UniversityDBEntry, Task } from '../types';
import { UniversityBrowser } from './UniversityBrowser';

// CLOUD_DB simulated locally
const CLOUD_DB: UniversityDBEntry[] = [
  { k: ["nacional", "unal", "bogota"], name: "Universidad Nacional de Colombia", domain: "unal.edu.co" },
  { k: ["andes", "uniandes"], name: "Universidad de los Andes", domain: "uniandes.edu.co" },
  { k: ["javeriana", "puj"], name: "Pontificia Universidad Javeriana", domain: "javeriana.edu.co" },
  { k: ["antioquia", "udea"], name: "Universidad de Antioquia", domain: "udea.edu.co" },
  { k: ["norte", "uninorte"], name: "Universidad del Norte", domain: "uninorte.edu.co" },
  { k: ["eafit"], name: "Universidad EAFIT", domain: "eafit.edu.co" },
  { k: ["harvard"], name: "Harvard University", domain: "harvard.edu" },
  { k: ["mit"], name: "MIT", domain: "mit.edu" },
  { k: ["stanford"], name: "Stanford University", domain: "stanford.edu" },
  { k: ["unam"], name: "Universidad Nacional Autónoma de México", domain: "unam.mx" },
  { k: ["tec", "monterrey"], name: "Tecnológico de Monterrey", domain: "tec.mx" },
  { k: ["uba", "buenos aires"], name: "Universidad de Buenos Aires", domain: "uba.ar" }
];

interface OnboardingProps {
  onComplete: (data: Partial<User>, extraTasks?: Task[]) => void;
}

export const OnboardingWizard: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<User>>({
    university: '',
    logoUrl: '',
    career: '',
    targetGrade: 4.0,
    theme: 'light', // Default to light
    accentColor: 'cortex',
    semester: 1,
    gradingMode: 'simple'
  });
  
  // Search State
  const [inputValue, setInputValue] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<UniversityDBEntry[]>([]);
  
  // "Lite Browser" / AI Researcher State
  const [showBrowser, setShowBrowser] = useState(false);
  const [discoveredTasks, setDiscoveredTasks] = useState<Task[]>([]);

  // Sync theme for live preview
  useEffect(() => {
    document.body.setAttribute('data-theme', data.theme || 'light');
    document.body.setAttribute('data-accent', data.accentColor || 'cortex');
  }, [data.theme, data.accentColor]);

  const handleMagicSearch = () => {
    if (!inputValue) return;
    setIsResolving(true);
    setShowResults(false);
    
    setTimeout(() => {
      const lowerInput = inputValue.toLowerCase().trim();
      
      if (lowerInput.includes('.') && !lowerInput.includes(' ')) {
        const domain = lowerInput.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const logo = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        setData({ ...data, university: domain, logoUrl: logo });
        setIsResolving(false);
        return;
      }

      const matches = CLOUD_DB.filter(u => 
        u.name.toLowerCase().includes(lowerInput) || 
        u.k.some(key => lowerInput.includes(key))
      );

      if (matches.length > 0) {
        setResults(matches);
        setShowResults(true);
      } else {
        const guessDomain = lowerInput.replace(/\s+/g, '') + '.edu.co';
        setResults([{ k: [], name: inputValue + " (Probable)", domain: guessDomain, isGuess: true }]);
        setShowResults(true);
      }
      setIsResolving(false);
    }, 600);
  };

  const handleSelectUniversity = (uni: UniversityDBEntry) => {
    const logo = `https://www.google.com/s2/favicons?domain=${uni.domain}&sz=128`;
    const cleanName = uni.name.replace(' (Probable)', '');
    setData({ ...data, university: cleanName, logoUrl: logo });
    setInputValue(cleanName);
    setShowResults(false);
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else onComplete(data, discoveredTasks);
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)] relative overflow-hidden transition-colors duration-500">
      
      {/* Liquid Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[100px] opacity-20 anim-float transition-colors duration-1000 ${
          data.accentColor === 'cortex' ? 'bg-cyan-500' : 
          data.accentColor === 'royal' ? 'bg-violet-500' : 
          data.accentColor === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'
        }`} />
      </div>

      <div className="w-full max-w-lg z-10 anim-enter px-4">
        <div className="card-modern p-8 rounded-3xl min-h-[500px] flex flex-col relative shadow-2xl backdrop-blur-3xl border border-white/50">
          
          {/* Progress Bar */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-500 ${
                i <= step ? 'bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]' : 'bg-[var(--border-color)]'
              }`} />
            ))}
          </div>

          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="anim-enter flex-1 flex flex-col">
              <h2 className="text-3xl font-bold mb-2">Identidad Institucional</h2>
              <p className="text-[var(--text-secondary)] mb-8">Conecta con la base de datos académica.</p>
              
              <div className="space-y-6 flex-1">
                <div className="relative">
                  <label className="text-xs uppercase font-bold text-[var(--text-secondary)] mb-2 block">UNIVERSIDAD</label>
                  <div className="relative group">
                    <School className="absolute left-4 top-3.5 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                    <input 
                      value={inputValue} 
                      onChange={e => {
                        setInputValue(e.target.value);
                        if (e.target.value === '') setShowResults(false);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleMagicSearch()}
                      placeholder="Nombre (ej: Nacional) o URL" 
                      className="w-full input-glass pl-12 pr-12 text-lg font-medium"
                      autoFocus
                    />
                    <button 
                      onClick={handleMagicSearch} 
                      className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${isResolving ? 'bg-[var(--accent)] text-white animate-spin' : 'bg-[var(--bg-input)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white'}`}
                      title="Autodetectar"
                    >
                      {isResolving ? <Loader2 size={18} /> : <Wand2 size={18} />}
                    </button>
                  </div>

                  {showResults && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl max-h-60 overflow-y-auto z-50 backdrop-blur-xl shadow-2xl">
                      {results.map((uni, idx) => (
                        <div key={idx} onClick={() => handleSelectUniversity(uni)} className="p-3 cursor-pointer hover:bg-[var(--bg-input)] flex items-center gap-3 border-b border-[var(--border-color)] last:border-0 group transition-colors">
                          <div className="p-2 rounded-lg bg-[var(--bg-main)] text-[var(--text-secondary)] group-hover:text-[var(--accent)]">
                            {uni.isGuess ? <Lightbulb size={16} /> : <Globe size={16} />}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="font-bold text-sm text-[var(--text-primary)] truncate">{uni.name}</p>
                            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><Link2 size={10} /> {uni.domain}</p>
                          </div>
                          <ChevronRight size={14} className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-100" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {data.university && data.logoUrl ? (
                  <div className="space-y-3">
                      <div className="p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--accent)] flex items-center gap-4 anim-enter shadow-lg ring-1 ring-[var(--accent)]/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[var(--accent)]/5 anim-magic pointer-events-none"></div>
                        <img 
                          src={data.logoUrl} 
                          alt="Logo" 
                          className="w-12 h-12 rounded-xl object-contain bg-white p-2 relative z-10 border border-[var(--border-color)] shadow-sm"
                          onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/64?text=U'}
                        />
                        <div className="flex-1 min-w-0 z-10">
                            <p className="font-bold text-[var(--text-primary)] truncate">{data.university}</p>
                            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><Check size={10}/> Institución Verificada</p>
                        </div>
                      </div>
                      
                      {/* BROWSER LAUNCH BUTTON */}
                      <button 
                        onClick={() => setShowBrowser(true)}
                        className="w-full py-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] hover:border-[var(--accent)] hover:shadow-lg transition-all group flex items-center justify-between px-6 anim-enter"
                        style={{animationDelay: '0.1s'}}
                      >
                         <div className="flex items-center gap-3 text-left">
                            <div className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg group-hover:scale-110 transition-transform">
                                <Bot size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-[var(--text-primary)] text-sm">Investigar Universidad</p>
                                <p className="text-[10px] text-[var(--text-secondary)]">Buscar calendario, carreras y fechas.</p>
                            </div>
                         </div>
                         <div className="bg-[var(--accent)] text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                             <Search size={16} />
                         </div>
                      </button>
                      
                      {discoveredTasks.length > 0 && (
                          <div className="p-3 bg-[var(--success)]/10 border border-[var(--success)] rounded-xl flex items-center gap-2 text-[var(--success)] text-xs font-bold anim-enter">
                              <CalendarPlus size={16}/> {discoveredTasks.length} fechas importadas a Cronos
                          </div>
                      )}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-[var(--border-color)] text-center text-[var(--text-secondary)]">
                    <div className="bg-[var(--bg-input)] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Globe size={20} className="opacity-50" />
                    </div>
                    <p className="text-sm">Usa la varita para buscar.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Academic Profile (With Grading Mode) */}
          {step === 2 && (
            <div className="anim-enter flex-1 flex flex-col">
              <h2 className="text-3xl font-bold mb-2">Perfil Académico</h2>
              <p className="text-[var(--text-secondary)] mb-8">Define tu camino y sistema.</p>
              <div className="space-y-6 flex-1">
                <div>
                  <label className="text-xs uppercase font-bold text-[var(--text-secondary)] mb-2 block">Carrera</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-3.5 text-[var(--text-secondary)]" size={20} />
                    <input value={data.career} onChange={e => setData({...data, career: e.target.value})} placeholder="Ej: Ingeniería de Sistemas" className="w-full input-glass pl-12 pr-4" autoFocus />
                  </div>
                </div>
                
                {/* Grading Mode Selector */}
                <div>
                     <label className="text-xs uppercase font-bold text-[var(--text-secondary)] mb-3 block">Estilo de Calificación</label>
                     <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setData({...data, gradingMode: 'simple'})}
                            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${data.gradingMode === 'simple' ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-md' : 'border-[var(--border-color)] hover:bg-[var(--bg-input)]'}`}
                        >
                            <div className="mb-2 w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors"><Zap size={18}/></div>
                            <h4 className="font-bold text-sm text-[var(--text-primary)]">Simple</h4>
                            <p className="text-[10px] text-[var(--text-secondary)] leading-tight mt-1">Solo la nota final del corte. Rápido y directo.</p>
                            {data.gradingMode === 'simple' && <div className="absolute top-2 right-2 text-[var(--accent)]"><Check size={16}/></div>}
                        </button>

                        <button 
                            onClick={() => setData({...data, gradingMode: 'detailed'})}
                            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${data.gradingMode === 'detailed' ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-md' : 'border-[var(--border-color)] hover:bg-[var(--bg-input)]'}`}
                        >
                            <div className="mb-2 w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors"><Layers size={18}/></div>
                            <h4 className="font-bold text-sm text-[var(--text-primary)]">Detallado</h4>
                            <p className="text-[10px] text-[var(--text-secondary)] leading-tight mt-1">Registra quizes, talleres y parciales por corte.</p>
                            {data.gradingMode === 'detailed' && <div className="absolute top-2 right-2 text-[var(--accent)]"><Check size={16}/></div>}
                        </button>
                     </div>
                </div>

                <div>
                  <label className="text-xs uppercase font-bold text-[var(--text-secondary)] mb-2 block">Semestre Actual</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                      <button key={s} onClick={() => setData({...data, semester: s})} className={`p-3 rounded-xl border text-sm font-bold transition-all ${data.semester === s ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="anim-enter flex-1 flex flex-col">
              <h2 className="text-3xl font-bold mb-2">Tus Metas</h2>
              <p className="text-[var(--text-secondary)] mb-8">Define tu estándar de excelencia.</p>
              <div className="flex-1 flex flex-col justify-center items-center space-y-8">
                <div className="text-center"><span className="text-8xl font-black font-mono tracking-tighter text-[var(--accent)]" style={{ textShadow: '0 0 20px var(--accent-light)' }}>{data.targetGrade?.toFixed(1)}</span><p className="text-sm text-[var(--accent)] uppercase font-bold mt-2 tracking-widest">PROMEDIO IDEAL</p></div>
                <input type="range" min="3.0" max="5.0" step="0.1" value={data.targetGrade} onChange={e => setData({...data, targetGrade: parseFloat(e.target.value)})} className="w-full accent-[var(--accent)] h-2 bg-[var(--border-color)] rounded-lg appearance-none cursor-pointer" />
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="anim-enter flex-1 flex flex-col">
              <h2 className="text-3xl font-bold mb-2">Personalización</h2>
              <p className="text-[var(--text-secondary)] mb-8">Estilo Visual.</p>
              <div className="grid grid-cols-2 gap-4 flex-1 mb-4">
                <button onClick={() => setData({...data, theme: 'light'})} className={`p-6 rounded-2xl border flex flex-col items-center gap-2 transition-all ${data.theme === 'light' ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)] shadow-md' : 'border-[var(--border-color)] hover:bg-[var(--bg-input)]'}`}><Sun size={24} /><span className="text-sm font-bold">Claro</span></button>
                <button onClick={() => setData({...data, theme: 'dark'})} className={`p-6 rounded-2xl border flex flex-col items-center gap-2 transition-all ${data.theme === 'dark' ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] shadow-md' : 'border-[var(--border-color)] hover:bg-[var(--bg-input)]'}`}><Moon size={24} /><span className="text-sm font-bold">Oscuro</span></button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[{id: 'cortex', hex: '#06B6D4'}, {id: 'emerald', hex: '#10B981'}, {id: 'royal', hex: '#8B5CF6'}, {id: 'rose', hex: '#F43F5E'}].map(theme => (
                  <button key={theme.id} onClick={() => setData({...data, accentColor: theme.id as any})} className={`h-12 rounded-xl border transition-all ${data.accentColor === theme.id ? 'border-white scale-105 shadow-lg ring-2 ring-offset-2 ring-[var(--text-primary)]' : 'border-transparent opacity-60 hover:opacity-100'}`} style={{backgroundColor: theme.hex}} />
                ))}
              </div>
            </div>
          )}
          {step === 5 && (
            <div className="anim-enter flex-1 flex flex-col justify-center items-center text-center">
              <div className="w-20 h-20 bg-[var(--accent)] rounded-full flex items-center justify-center text-white mb-6 shadow-2xl anim-magic"><Check size={40} /></div>
              <h2 className="text-3xl font-bold mb-2">¡Todo listo!</h2>
              <p className="text-[var(--text-secondary)]">Tu Cortex está configurado y listo para optimizar tu vida académica.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-[var(--border-color)]">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 text-sm font-bold transition-colors"><ChevronLeft size={16} /> Atrás</button>
            ) : <div />}
            <button onClick={handleNext} disabled={!data.university && step === 1} className="bg-[var(--accent)] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              {step === 5 ? 'Lanzar WebOS' : 'Siguiente'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* --- REUSABLE BROWSER OVERLAY --- */}
      {showBrowser && (
          <UniversityBrowser 
            university={data.university || "Universidad"}
            logoUrl={data.logoUrl}
            onClose={() => setShowBrowser(false)}
            onImportTasks={(tasks) => setDiscoveredTasks(prev => [...prev, ...tasks])}
          />
      )}
    </div>
  );
};
