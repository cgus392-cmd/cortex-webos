import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Course, Task } from '../../types';
import { StickyNote, TrendingUp, Plus, Activity, ArrowUp, Layers, Trash2, Target, X, BookOpen, Calculator, AlertTriangle, ChevronDown, ChevronUp, LayoutGrid, Zap, BarChart2, MoreHorizontal } from 'lucide-react';
import { CortexAvatar } from '../CortexAvatar';

interface Memo {
    id: number;
    text: string;
    color: 'amber' | 'blue' | 'rose' | 'emerald' | 'violet';
}

interface ChartPoint {
    x: number;
    y: number;
    val: number;
    progress: number;
    course: Course;
}

type DashboardView = 'analytics' | 'grid' | 'focus';

export const DashboardModule: React.FC<{ 
    courses: Course[]; 
    tasks: Task[];
    notes: string; 
    setNotes: (s: string) => void; 
    setShowAddModal: (b: boolean) => void;
    setEditingCourse: (c: Course) => void;
    userMinGrade: number;
    globalAvg: string;
    userName: string;
    semester: number;
    accent: string;
    targetGrade: number;
}> = ({ courses, tasks, notes, setNotes, setShowAddModal, setEditingCourse, userMinGrade, globalAvg, userName, targetGrade }) => {
    
    // UI STATE
    const [view, setView] = useState<DashboardView>('analytics');
    const [selectedPoint, setSelectedPoint] = useState<ChartPoint | null>(null);
    const [showKPIs, setShowKPIs] = useState(true);
    
    // MEMO STATE
    const [memos, setMemos] = useState<Memo[]>([]);
    const [activeMemo, setActiveMemo] = useState<Memo | null>(null);
    const [isSwiping, setIsSwiping] = useState(false);

    useEffect(() => {
        try {
            if (!notes) { setMemos([]); return; }
            const parsed = JSON.parse(notes);
            if (Array.isArray(parsed)) { setMemos(parsed); } 
            else { setMemos([{ id: Date.now(), text: notes, color: 'amber' }]); }
        } catch (e) {
             if (notes.trim()) { setMemos([{ id: Date.now(), text: notes, color: 'amber' }]); } 
             else { setMemos([]); }
        }
    }, []);

    const persistMemos = (newMemos: Memo[]) => {
        setMemos(newMemos);
        setNotes(JSON.stringify(newMemos));
    };

    const addMemo = () => {
        const newMemo: Memo = { id: Date.now(), text: '', color: 'amber' };
        const updated = [newMemo, ...memos];
        persistMemos(updated);
        setActiveMemo(newMemo);
    };

    const updateActiveMemo = (text: string) => {
        if (!activeMemo) return;
        const updatedMemo = { ...activeMemo, text };
        setActiveMemo(updatedMemo);
        const updatedList = memos.map(m => m.id === activeMemo.id ? updatedMemo : m);
        persistMemos(updatedList);
    };

    const changeMemoColor = (color: Memo['color']) => {
        if (!activeMemo) return;
        const updatedMemo = { ...activeMemo, color };
        setActiveMemo(updatedMemo);
        const updatedList = memos.map(m => m.id === activeMemo.id ? updatedMemo : m);
        persistMemos(updatedList);
    };

    const deleteMemo = (id: number) => {
        const updated = memos.filter(m => m.id !== id);
        persistMemos(updated);
        if (activeMemo?.id === id) setActiveMemo(null);
    };

    const handleNextMemo = () => {
        if (memos.length <= 1) return;
        setIsSwiping(true);
        setTimeout(() => {
            const [first, ...rest] = memos;
            persistMemos([...rest, first]);
            setIsSwiping(false);
        }, 200);
    };

    const getMemoColorClass = useCallback((color: Memo['color']) => {
        switch(color) {
            case 'amber': return 'bg-amber-50 text-amber-900 border-amber-200 shadow-sm dark:bg-[#451a03] dark:text-amber-100 dark:border-[#78350F]';
            case 'blue': return 'bg-blue-50 text-blue-900 border-blue-200 shadow-sm dark:bg-[#172554] dark:text-blue-100 dark:border-[#1e3a8a]';
            case 'rose': return 'bg-rose-50 text-rose-900 border-rose-200 shadow-sm dark:bg-[#4c0519] dark:text-rose-100 dark:border-[#881337]';
            case 'emerald': return 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-sm dark:bg-[#022c22] dark:text-emerald-100 dark:border-[#064e3b]';
            case 'violet': return 'bg-violet-50 text-violet-900 border-violet-200 shadow-sm dark:bg-[#2e1065] dark:text-violet-100 dark:border-[#5b21b6]';
            default: return 'bg-amber-50 text-amber-900 border-amber-200';
        }
    }, []);

    // --- MEMOIZED STATISTICS (KPIs) ---
    const stats = useMemo(() => {
        const activeCourses = courses.filter(c => parseFloat(c.average) > 0 || c.progress > 0);
        const riskCourses = activeCourses.filter(c => parseFloat(c.average) < userMinGrade).length;
        const avgNum = parseFloat(globalAvg);
        const efficiency = activeCourses.length > 0 
            ? Math.round(activeCourses.reduce((acc, c) => acc + (c.progress), 0) / activeCourses.length * 100) 
            : 0;
        const pendingTasksCount = tasks ? tasks.filter(t => !t.done).length : 0;
        
        // Find critical course (lowest grade)
        const criticalCourse = activeCourses.sort((a, b) => parseFloat(a.average) - parseFloat(b.average))[0];

        // Determine Mood
        let mood: 'ecstatic' | 'happy' | 'worried' | 'critical' = 'happy';
        if (avgNum >= 4.5 && riskCourses === 0) mood = 'ecstatic';
        else if (avgNum >= 3.5 && riskCourses === 0 && pendingTasksCount < 5) mood = 'happy';
        else if (avgNum < 3.0 || riskCourses > 1) mood = 'critical';
        else mood = 'worried';

        return { activeCourses, riskCourses, avgNum, efficiency, criticalCourse, pendingTasksCount, mood };
    }, [courses, userMinGrade, globalAvg, tasks]);

    // --- MEMOIZED CHART DATA ---
    const chartData = useMemo(() => {
        const { activeCourses } = stats;
        const width = 800;
        const height = 300;
        const paddingX = 60;
        const paddingY = 40;
        const chartHeight = height - (paddingY * 2);
        const maxGrade = 5.0;

        const points: ChartPoint[] = [];
        if (activeCourses.length > 0) {
            const step = (width - (paddingX * 2)) / Math.max(1, activeCourses.length - 1);
            activeCourses.forEach((c, i) => {
                const val = parseFloat(c.average) || 0;
                const x = activeCourses.length === 1 ? width / 2 : paddingX + (i * step);
                const y = height - paddingY - ((val / maxGrade) * chartHeight);
                points.push({x, y, val, progress: c.progress, course: c});
            });
        }

        let pathD = "";
        let fillD = "";
        if (points.length > 1) {
            let d = `M ${points[0].x} ${points[0].y}`;
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i+1];
                const cp1x = p0.x + (p1.x - p0.x) / 2;
                const cp1y = p0.y;
                const cp2x = p0.x + (p1.x - p0.x) / 2;
                const cp2y = p1.y;
                d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
            }
            pathD = d;
            fillD = `${d} L ${points[points.length-1].x} ${height} L ${points[0].x} ${height} Z`;
        } else if (points.length === 1) {
            pathD = `M ${paddingX} ${points[0].y} L ${width - paddingX} ${points[0].y}`;
            fillD = `M ${paddingX} ${points[0].y} L ${width - paddingX} ${points[0].y} L ${width - paddingX} ${height} L ${paddingX} ${height} Z`;
        }

        const targetY = height - paddingY - ((targetGrade / maxGrade) * chartHeight);

        return { points, pathD, fillD, targetY, width, height, paddingY, chartHeight };
    }, [stats.activeCourses, targetGrade]);

    // --- REUSABLE COMPONENTS ---
    const MemoWidget = ({ compact = false }) => (
        <div className={`card-modern flex flex-col bg-[var(--bg-card)] ${compact ? 'h-full' : 'h-[300px]'} relative overflow-hidden`}>
            <div className="p-5 flex items-center justify-between relative z-20">
                <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><StickyNote size={18} className="text-[var(--royal)]"/> Memos</h3>
                <div className="flex gap-1">
                    <button onClick={handleNextMemo} className="p-1.5 rounded hover:bg-[var(--bg-input)] text-[var(--text-secondary)]"><Layers size={14}/></button>
                    <button onClick={addMemo} className="p-1.5 rounded hover:bg-[var(--bg-input)] text-[var(--text-secondary)]"><Plus size={14}/></button>
                </div>
            </div>
            <div className="flex-1 relative flex items-center justify-center p-4">
                {memos.length > 0 ? (
                    <div className="relative w-full h-full">
                    {memos.slice(0, 3).reverse().map((memo, reverseIndex) => {
                        const realIndex = memos.slice(0, 3).length - 1 - reverseIndex;
                        const isTop = realIndex === 0;
                        return (
                            <div 
                                key={memo.id} 
                                onClick={() => isTop ? setActiveMemo(memo) : handleNextMemo()}
                                className={`absolute inset-0 rounded-2xl p-5 border flex flex-col transition-all duration-500 shadow-sm cursor-pointer ${getMemoColorClass(memo.color)}`}
                                style={{
                                    top: realIndex * 10,
                                    left: realIndex * 5,
                                    right: realIndex * 5,
                                    bottom: 0,
                                    zIndex: 10 - realIndex,
                                    transform: isTop && isSwiping ? 'translateY(-10px) scale(0.95)' : 'none',
                                    opacity: 1 - (realIndex * 0.2)
                                }}
                            >
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap select-none">{memo.text || "Nueva Nota..."}</p>
                                </div>
                                {isTop && <p className="text-[10px] opacity-50 mt-2 text-right">Click para editar</p>}
                            </div>
                        )
                    })}
                    </div>
                ) : (
                    <div className="text-center text-[var(--text-secondary)] opacity-50"><p className="text-xs">No hay notas</p></div>
                )}
            </div>
        </div>
    );

    const QuickAccess = () => (
        <div className="card-modern p-5 flex flex-col h-[176px]">
            <h3 className="font-bold text-[var(--text-primary)] mb-3 text-sm">Accesos Directos</h3>
            <div className="grid grid-cols-2 gap-3 flex-1">
                <button onClick={() => setShowAddModal(true)} className="rounded-xl border border-dashed border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all flex flex-col items-center justify-center gap-1 text-[var(--text-secondary)]">
                    <Plus size={20}/> <span className="text-xs font-bold">Materia</span>
                </button>
                {courses.length > 0 && (
                    <button onClick={() => setEditingCourse(courses[0])} className="rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-input)]/80 transition-all flex flex-col items-center justify-center gap-1 text-[var(--text-primary)] border border-[var(--border-color)]">
                        <BookOpen size={20} className="text-[var(--royal)]"/> <span className="text-xs font-bold truncate w-full px-2 text-center">{courses[0].name.substring(0,10)}...</span>
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto anim-enter space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div className="flex items-center gap-6">
                    {/* IMPORT NEW CORTEX AVATAR MODULE */}
                    <CortexAvatar mood={stats.mood} size={80} />
                    
                    <div className="mb-1">
                        <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-1">Hola, {(userName || "Estudiante").split(' ')[0]}</h1>
                        <p className="text-[var(--text-secondary)]">Aquí tienes tu resumen operativo.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)] shadow-sm">
                        <button onClick={() => setView('analytics')} className={`p-2 rounded-lg transition-all ${view === 'analytics' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} title="Gráfica">
                            <BarChart2 size={18}/>
                        </button>
                        <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} title="Cuadrícula">
                            <LayoutGrid size={18}/>
                        </button>
                        <button onClick={() => setView('focus')} className={`p-2 rounded-lg transition-all ${view === 'focus' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} title="Modo Foco">
                            <Zap size={18}/>
                        </button>
                    </div>
                    
                    {view !== 'focus' && (
                        <button 
                            onClick={() => setShowKPIs(!showKPIs)}
                            className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all shadow-sm"
                        >
                            {showKPIs ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                        </button>
                    )}
                    
                    <button onClick={() => setShowAddModal(true)} className="px-4 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-bold shadow-lg hover:brightness-110 flex items-center gap-2 transition-all">
                        <Plus size={18}/> <span className="hidden sm:inline">Materia</span>
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            {view !== 'focus' && (
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showKPIs ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
                        <div className="card-modern p-5 flex items-center gap-4 border border-[var(--border-color)]">
                            <div className={`p-3 rounded-2xl ${stats.avgNum >= targetGrade ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--accent)]/10 text-[var(--accent)]'}`}>
                                <Calculator size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Promedio Global</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-black font-mono text-[var(--text-primary)] tracking-tighter">{globalAvg}</span>
                                    <span className={`text-xs font-bold mb-1 ${stats.avgNum >= targetGrade ? 'text-[var(--success)]' : 'text-[var(--text-secondary)]'}`}>
                                        {stats.avgNum >= targetGrade ? 'Meta Alcanzada' : `/ ${targetGrade.toFixed(1)}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="card-modern p-5 flex items-center gap-4 border border-[var(--border-color)]">
                            <div className="p-3 rounded-2xl bg-[var(--royal)]/10 text-[var(--royal)]">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Eficiencia Semestral</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-black font-mono text-[var(--text-primary)] tracking-tighter">{stats.efficiency}%</span>
                                    <span className="text-xs text-[var(--text-secondary)] font-bold mb-1">Progreso Total</span>
                                </div>
                            </div>
                        </div>

                        <div className="card-modern p-5 flex items-center gap-4 border border-[var(--border-color)]">
                            <div className={`p-3 rounded-2xl ${stats.riskCourses > 0 ? 'bg-[var(--danger)]/10 text-[var(--danger)]' : 'bg-[var(--success)]/10 text-[var(--success)]'}`}>
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Riesgo Académico</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-black font-mono text-[var(--text-primary)] tracking-tighter">{stats.riskCourses}</span>
                                    <span className="text-xs text-[var(--text-secondary)] font-bold mb-1">Materias en Peligro</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW: ANALYTICS (Original) --- */}
            {view === 'analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 anim-enter">
                    {/* COMBO CHART */}
                    <div className="lg:col-span-2 card-modern bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col h-[500px] overflow-hidden relative">
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-input)]/30 backdrop-blur-sm z-10">
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)] text-lg flex items-center gap-2"><TrendingUp size={20} className="text-[var(--accent)]"/> Rendimiento vs. Progreso</h3>
                                <p className="text-xs text-[var(--text-secondary)]">Análisis comparativo por materia</p>
                            </div>
                            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--accent)]"></div> Nota</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[var(--text-secondary)] opacity-20"></div> Progreso</div>
                            </div>
                        </div>

                        <div className="flex-1 flex relative">
                            {/* CHART AREA */}
                            <div className="flex-1 relative overflow-hidden">
                                {stats.activeCourses.length > 0 ? (
                                    <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                                            </linearGradient>
                                            <filter id="glowChart" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                                <feMerge>
                                                    <feMergeNode in="coloredBlur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-color)" strokeWidth="0.5" opacity="0.3"/>
                                            </pattern>
                                        </defs>

                                        {/* GRID BACKGROUND */}
                                        <rect width="100%" height="100%" fill="url(#gridPattern)" />

                                        {/* PROGRESS BARS */}
                                        {chartData.points.map((p, i) => {
                                            const barHeight = p.progress * chartData.chartHeight; 
                                            return (
                                                <g key={`bar-${i}`}>
                                                    <rect 
                                                        x={p.x - 15} 
                                                        y={chartData.height - chartData.paddingY - barHeight} 
                                                        width="30" 
                                                        height={barHeight} 
                                                        fill="var(--text-primary)" 
                                                        opacity="0.05"
                                                        rx="4"
                                                    />
                                                    {/* Percentage Label */}
                                                    {chartData.points.length < 15 && (
                                                        <text 
                                                            x={p.x} 
                                                            y={chartData.height - chartData.paddingY - barHeight - 10} 
                                                            textAnchor="middle" 
                                                            fill="var(--text-secondary)" 
                                                            fontSize="10" 
                                                            fontWeight="bold"
                                                            opacity="0.5"
                                                        >
                                                            {Math.round(p.progress * 100)}%
                                                        </text>
                                                    )}
                                                </g>
                                            )
                                        })}

                                        {/* TARGET LINE */}
                                        <line x1="0" y1={chartData.targetY} x2={chartData.width} y2={chartData.targetY} stroke="var(--success)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                                        <text x={chartData.width - 10} y={chartData.targetY - 5} textAnchor="end" fill="var(--success)" fontSize="10" fontWeight="bold">META {targetGrade.toFixed(1)}</text>

                                        {/* AREA FILL & LINE */}
                                        <path d={chartData.fillD} fill="url(#chartGradient)" />
                                        <path d={chartData.pathD} fill="none" stroke="var(--accent)" strokeWidth="3" filter="url(#glowChart)" strokeLinecap="round" strokeLinejoin="round" />

                                        {/* INTERACTIVE NODES */}
                                        {chartData.points.map((p, i) => (
                                            <g key={`node-${i}`} onClick={() => setSelectedPoint(p)} className="cursor-pointer group/node">
                                                <line x1={p.x} y1={chartData.paddingY} x2={p.x} y2={chartData.height-chartData.paddingY} stroke="var(--border-color)" strokeWidth="1" opacity="0" className="group-hover/node:opacity-100 transition-opacity" />
                                                <circle cx={p.x} cy={p.y} r="15" fill="var(--accent)" opacity="0" className="group-hover/node:opacity-20 transition-opacity" />
                                                <circle cx={p.x} cy={p.y} r="5" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="2.5" className={`transition-all ${selectedPoint?.course.id === p.course.id ? 'scale-150 stroke-[var(--text-primary)] fill-[var(--accent)]' : ''}`} />
                                                {(chartData.points.length < 12 || i % 2 === 0) && (
                                                    <text x={p.x} y={chartData.height - 15} textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="bold" className={`uppercase transition-colors ${selectedPoint?.course.id === p.course.id ? 'fill-[var(--accent)]' : ''}`}>{p.course.code || p.course.name.substring(0,3)}</text>
                                                )}
                                            </g>
                                        ))}
                                    </svg>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-50">
                                        <Activity size={48} className="mb-2 text-[var(--accent)]"/>
                                        <p className="text-sm font-bold">Sin datos suficientes</p>
                                    </div>
                                )}
                            </div>

                            {/* INSPECTOR PANEL */}
                            {selectedPoint ? (
                                <div className="w-64 border-l border-[var(--border-color)] bg-[var(--bg-input)]/20 p-5 flex flex-col animate-in slide-in-from-right-10 overflow-y-auto">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] shadow-sm"><BookOpen size={20}/></div>
                                        <button onClick={() => setSelectedPoint(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={16}/></button>
                                    </div>
                                    <h4 className="font-bold text-[var(--text-primary)] leading-tight mb-1">{selectedPoint.course.name}</h4>
                                    <p className="text-xs text-[var(--text-secondary)] mb-6 uppercase tracking-wider font-bold">{selectedPoint.course.code}</p>
                                    <div className="space-y-4">
                                        <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
                                            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold mb-1">Nota Actual</p>
                                            <div className="flex items-end gap-2">
                                                <span className={`text-3xl font-black font-mono ${selectedPoint.val < userMinGrade ? 'text-[var(--danger)]' : 'text-[var(--accent)]'}`}>{selectedPoint.val.toFixed(2)}</span>
                                                <span className="text-xs font-bold text-[var(--text-secondary)] mb-1">/ 5.0</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setEditingCourse(selectedPoint.course)} className="w-full py-2 bg-[var(--text-primary)] text-[var(--bg-main)] rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">Ver Detalles</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-64 border-l border-[var(--border-color)] bg-[var(--bg-input)]/10 flex flex-col items-center justify-center p-6 text-center text-[var(--text-secondary)]">
                                    <Activity size={32} className="opacity-20 mb-2"/>
                                    <p className="text-xs">Selecciona un punto en la gráfica para ver métricas detalladas.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SIDEBAR WIDGETS */}
                    <div className="lg:col-span-1 space-y-6">
                        <MemoWidget />
                        <QuickAccess />
                    </div>
                </div>
            )}

            {/* --- VIEW: GRID (Cards) --- */}
            {view === 'grid' && (
                <div className="anim-enter">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(c => {
                            const grade = parseFloat(c.average);
                            const isPassing = grade >= userMinGrade;
                            return (
                                <div key={c.id} onClick={() => setEditingCourse(c)} className="card-modern p-6 cursor-pointer group hover:scale-[1.02] transition-all bg-[var(--bg-card)] border-[var(--border-color)] relative overflow-hidden">
                                    {/* Progress Bar Top */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--bg-input)]">
                                        <div className="h-full bg-[var(--accent)]" style={{width: `${c.progress * 100}%`}}></div>
                                    </div>
                                    
                                    <div className="flex justify-between items-start mb-4 mt-2">
                                        <span className="px-2 py-1 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] font-bold text-[var(--text-secondary)] uppercase">{c.code || "GEN-001"}</span>
                                        <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><MoreHorizontal size={20}/></button>
                                    </div>
                                    
                                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-1 line-clamp-1">{c.name}</h4>
                                    <p className="text-xs text-[var(--text-secondary)] mb-6">{c.credits} Créditos • {Math.round(c.progress * 100)}% Evaluado</p>
                                    
                                    <div className="flex items-end justify-between p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Promedio</span>
                                            <span className={`text-2xl font-black font-mono ${isPassing ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>{c.average}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Meta</span>
                                            <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1">
                                                {grade >= targetGrade ? <Target size={12} className="text-[var(--success)]"/> : <ArrowUp size={12} className="text-[var(--text-secondary)]"/>}
                                                {targetGrade.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {/* Add Card */}
                        <div onClick={() => setShowAddModal(true)} className="card-modern border-2 border-dashed border-[var(--border-color)] bg-transparent flex flex-col items-center justify-center p-6 text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer min-h-[200px]">
                            <div className="w-12 h-12 rounded-full bg-[var(--bg-input)] flex items-center justify-center mb-3"><Plus size={24}/></div>
                            <span className="font-bold text-sm">Nueva Materia</span>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW: FOCUS (Minimal) --- */}
            {view === 'focus' && (
                <div className="anim-enter grid grid-cols-1 md:grid-cols-2 gap-8 items-start h-full">
                    {/* Left: Urgent Attention */}
                    <div className="space-y-6">
                        <div className="card-modern p-8 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-input)] border border-[var(--border-color)]">
                            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                                <Zap size={24} className="text-[var(--accent)] fill-current" /> Foco Principal
                            </h3>
                            
                            {stats.criticalCourse ? (
                                <div>
                                    <p className="text-sm text-[var(--text-secondary)] mb-2">Materia que requiere más atención:</p>
                                    <div className="p-6 rounded-2xl bg-[var(--bg-main)] border border-[var(--danger)]/30 shadow-lg relative overflow-hidden group cursor-pointer" onClick={() => setEditingCourse(stats.criticalCourse)}>
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertTriangle size={64} className="text-[var(--danger)]"/></div>
                                        <h4 className="text-xl font-bold text-[var(--text-primary)] mb-1">{stats.criticalCourse.name}</h4>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-xs font-mono font-bold bg-[var(--danger)]/10 text-[var(--danger)] px-2 py-1 rounded">Avg: {stats.criticalCourse.average}</span>
                                            <span className="text-xs text-[var(--text-secondary)]">Meta: {targetGrade}</span>
                                        </div>
                                        <button className="w-full py-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-main)] text-xs font-bold hover:opacity-90">Gestionar Notas</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 rounded-2xl bg-[var(--success)]/10 border border-[var(--success)]/20 text-center">
                                    <div className="w-12 h-12 bg-[var(--success)] rounded-full flex items-center justify-center text-white mx-auto mb-3"><Target size={24}/></div>
                                    <p className="font-bold text-[var(--success)]">¡Todo bajo control!</p>
                                    <p className="text-xs text-[var(--success)]/80">No hay materias en riesgo crítico.</p>
                                </div>
                            )}
                        </div>

                        <QuickAccess />
                    </div>

                    {/* Right: Expanded Memos */}
                    <div className="h-[500px]">
                        <MemoWidget compact={true} />
                    </div>
                </div>
            )}

            {/* FULLSCREEN MEMO EDITOR (COMMON) */}
            {activeMemo && (
                <div className="absolute inset-0 z-50 bg-[var(--bg-card)]/95 backdrop-blur-md flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200 rounded-3xl m-4 border border-[var(--border-color)] shadow-2xl">
                    <div className={`flex-1 rounded-2xl p-6 shadow-lg border mb-4 flex flex-col relative transition-colors ${getMemoColorClass(activeMemo.color)}`}>
                        <textarea 
                        className="w-full h-full bg-transparent border-none outline-none resize-none text-base font-medium leading-relaxed placeholder:opacity-50 scrollbar-hide"
                        placeholder="Escribe aquí..."
                        value={activeMemo.text}
                        onChange={(e) => updateActiveMemo(e.target.value)}
                        autoFocus
                        ></textarea>
                        <button onClick={() => deleteMemo(activeMemo.id)} className="absolute bottom-3 right-3 p-2 rounded-full hover:bg-black/10 transition-colors text-current opacity-50 hover:opacity-100"><Trash2 size={16}/></button>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            {['amber', 'blue', 'rose', 'emerald', 'violet'].map((c: any) => (
                                <button key={c} onClick={() => changeMemoColor(c)} className={`w-6 h-6 rounded-full border border-black/10 ${activeMemo.color === c ? 'ring-2 ring-[var(--text-primary)]' : ''}`} style={{backgroundColor: c === 'amber' ? '#fcd34d' : c === 'blue' ? '#93c5fd' : c === 'rose' ? '#fda4af' : c === 'emerald' ? '#6ee7b7' : '#c4b5fd'}} />
                            ))}
                        </div>
                        <button onClick={() => setActiveMemo(null)} className="text-xs font-bold px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-main)] rounded-lg">Listo</button>
                    </div>
                </div>
            )}
        </div>
    );
};