import React, { useState, useEffect } from 'react';
import { Course, User } from '../../types';
import { Sparkles, Info, Check, Target, AlertCircle, BrainCircuit, X } from 'lucide-react';
import { generateGradeStrategy } from '../../services/gemini';
import ReactMarkdown from 'react-markdown';

export const OracleModule: React.FC<{ courses: Course[]; gradingSystem: { max: number; min: number }; userModel: 'flash' | 'pro' }> = ({ courses, gradingSystem, userModel }) => {
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(courses.length > 0 ? courses[0].id : null);
    
    // AI Strategy State
    const [strategy, setStrategy] = useState<string | null>(null);
    const [loadingStrategy, setLoadingStrategy] = useState(false);
    const [activeScenarioTarget, setActiveScenarioTarget] = useState<number | null>(null);

    // Auto-select first course
    useEffect(() => {
        if (!selectedCourseId && courses.length > 0) {
            setSelectedCourseId(courses[0].id);
        }
    }, [courses]);

    // Reset strategy when course changes
    useEffect(() => {
        setStrategy(null);
        setActiveScenarioTarget(null);
    }, [selectedCourseId]);

    const selectedCourse = courses.find(c => c.id === selectedCourseId);

    // --- LOGIC ---
    let evaluatedWeight = 0;
    let accumulatedGrade = 0;

    if (selectedCourse) {
        selectedCourse.cuts.forEach(cut => {
             const w = cut.weight;
             const g = parseFloat(cut.grade);
             
             if (!isNaN(g) && w > 0) {
                 evaluatedWeight += w;
                 accumulatedGrade += g * (w / 100);
             }
        });
    }

    const remainingWeight = 100 - evaluatedWeight;
    const currentAbsoluteGrade = accumulatedGrade; // This is e.g. 1.14 out of 5.0 total

    // Helper to calc needed
    const calculateNeeded = (target: number) => {
        if (remainingWeight <= 0) return 0;
        const needed = (target - currentAbsoluteGrade) / (remainingWeight / 100);
        return needed;
    };

    const handleGenerateStrategy = async (target: number) => {
        if (!selectedCourse) return;
        setLoadingStrategy(true);
        setActiveScenarioTarget(target);
        const needed = calculateNeeded(target);
        
        const response = await generateGradeStrategy(
            selectedCourse.name,
            currentAbsoluteGrade,
            target,
            needed,
            remainingWeight,
            userModel
        );
        
        setStrategy(response);
        setLoadingStrategy(false);
    };

    const scenarios = [
        { label: 'PASAR RASPANDO', target: gradingSystem.min, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
        { label: 'PROMEDIO ALTO', target: 4.0, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        { label: 'EXCELENCIA', target: 4.5, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
        { label: 'PERFECCIÓN', target: 5.0, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' }
    ];

    return (
        <div className="max-w-6xl mx-auto anim-enter h-full flex flex-col md:flex-row gap-6 pb-8">
            
            {/* Sidebar / Course Selector */}
            <div className="w-full md:w-80 flex-shrink-0">
                <div className="mb-6 text-center md:text-left">
                    <div className="w-16 h-16 bg-violet-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-violet-500/20 mb-4 mx-auto md:mx-0">
                        <Sparkles size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-[var(--text-primary)]">El Oráculo</h2>
                    <p className="text-[var(--text-secondary)] text-sm mb-4">Proyección matemática y estrategia IA.</p>
                    
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--bg-input)] rounded-lg text-xs font-bold border border-[var(--border-color)]">
                        <span className={`w-2 h-2 rounded-full ${userModel === 'pro' ? 'bg-violet-500' : 'bg-cyan-500'}`}></span>
                        Modelo: {userModel === 'pro' ? 'Gemini Pro' : 'Gemini Flash'}
                    </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar mt-4">
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 pl-2">SELECCIONA MATERIA</p>
                    {courses.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedCourseId(c.id)}
                            className={`w-full p-4 rounded-xl flex justify-between items-center transition-all ${
                                selectedCourseId === c.id 
                                ? 'bg-violet-600 text-white shadow-lg scale-[1.02]' 
                                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
                            }`}
                        >
                            <span className="font-bold text-sm uppercase truncate max-w-[150px]">{c.name}</span>
                            <span className="font-mono font-bold opacity-80">{c.average}</span>
                        </button>
                    ))}
                    {courses.length === 0 && (
                        <div className="p-4 border-2 border-dashed border-[var(--border-color)] rounded-xl text-center text-xs text-[var(--text-secondary)]">
                            No tienes materias registradas.
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 space-y-6 relative">
                {selectedCourse ? (
                    <>
                        {/* Status Card */}
                        <div className="card-modern p-8 bg-[var(--bg-card)] border border-[var(--border-color)] relative overflow-hidden">
                             {/* Decorative bg */}
                             <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                             <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Estado Actual: <span className="text-violet-600">{selectedCourse.name}</span></h3>
                             
                             <div className="flex flex-col md:flex-row gap-12">
                                 <div>
                                     <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">NOTA ACUMULADA</p>
                                     <p className="text-5xl font-black text-violet-600 font-mono tracking-tighter">{currentAbsoluteGrade.toFixed(2)}</p>
                                 </div>
                                 
                                 <div className="flex-1 max-w-xs">
                                     <div className="flex justify-between items-end mb-1">
                                         <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">PESO EVALUADO</p>
                                         <p className="text-sm font-bold text-[var(--text-primary)]">{evaluatedWeight}%</p>
                                     </div>
                                     <div className="h-3 w-full bg-[var(--bg-input)] rounded-full overflow-hidden">
                                         <div className="h-full bg-violet-500 rounded-full transition-all duration-1000" style={{width: `${evaluatedWeight}%`}}></div>
                                     </div>
                                 </div>
                             </div>

                             <div className="mt-8 flex items-center gap-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-main)]/50 p-3 rounded-lg w-fit">
                                 <Info size={16} className="text-violet-500"/>
                                 <span>Falta evaluar el <strong>{remainingWeight}%</strong> de la materia.</span>
                             </div>
                        </div>

                        {/* Scenarios Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {scenarios.map((s, idx) => {
                                const needed = calculateNeeded(s.target);
                                const isImpossible = needed > gradingSystem.max;
                                const isAchieved = currentAbsoluteGrade >= s.target;
                                const isFree = remainingWeight <= 0;
                                const isActive = activeScenarioTarget === s.target;

                                return (
                                    <div key={idx} className={`p-6 rounded-2xl border transition-all relative ${s.bg} ${s.border} ${isActive ? 'ring-2 ring-violet-500 shadow-lg' : 'hover:shadow-md'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">{s.label}</p>
                                                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{s.target.toFixed(1)}</p>
                                            </div>
                                            {isAchieved && <div className="p-2 bg-white rounded-full text-emerald-500 shadow-sm"><Check size={20}/></div>}
                                            {isImpossible && !isAchieved && !isFree && <div className="p-2 bg-white rounded-full text-rose-500 shadow-sm"><AlertCircle size={20}/></div>}
                                        </div>

                                        <div className="text-right border-t border-black/5 pt-4">
                                            {isAchieved ? (
                                                <p className="text-sm font-bold text-emerald-600">¡Meta Alcanzada! 🎉</p>
                                            ) : isFree ? (
                                                <p className="text-sm font-bold text-[var(--text-secondary)]">Materia Finalizada</p>
                                            ) : (
                                                <>
                                                    <p className="text-[10px] text-[var(--text-secondary)] uppercase">Necesitas en el resto:</p>
                                                    <p className={`text-2xl font-mono font-black ${isImpossible ? 'text-rose-500' : 'text-violet-600'}`}>
                                                        {needed < 0 ? '0.00' : needed.toFixed(2)}
                                                    </p>
                                                    {isImpossible ? (
                                                        <p className="text-[10px] font-bold text-rose-500 mt-1">Matemáticamente Imposible</p>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleGenerateStrategy(s.target)}
                                                            disabled={loadingStrategy}
                                                            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/80 hover:bg-white text-violet-700 text-xs font-bold shadow-sm border border-violet-100 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                                        >
                                                            {loadingStrategy && isActive ? <div className="w-3 h-3 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div> : <BrainCircuit size={14} />}
                                                            {loadingStrategy && isActive ? 'Pensando...' : 'Pedir Estrategia IA'}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-[var(--border-color)] rounded-3xl opacity-50">
                        <p>Selecciona una materia para comenzar</p>
                    </div>
                )}
                
                {/* STRATEGY MODAL / OVERLAY */}
                {strategy && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl" onClick={() => setStrategy(null)}></div>
                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-2xl p-6 w-full max-w-lg relative anim-enter flex flex-col max-h-full">
                            <button onClick={() => setStrategy(null)} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                <X size={20} />
                            </button>
                            
                            <div className="flex items-center gap-3 mb-4 text-violet-600">
                                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                    <BrainCircuit size={24} />
                                </div>
                                <h3 className="font-bold text-lg">Estrategia Táctica</h3>
                            </div>
                            
                            <div className="prose prose-sm dark:prose-invert overflow-y-auto custom-scrollbar pr-2 max-h-[300px]">
                                <ReactMarkdown>{strategy}</ReactMarkdown>
                            </div>

                            <div className="mt-6 pt-4 border-t border-[var(--border-color)] text-right">
                                <button onClick={() => setStrategy(null)} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-bold shadow-lg hover:brightness-110">
                                    Entendido, ¡a estudiar!
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};