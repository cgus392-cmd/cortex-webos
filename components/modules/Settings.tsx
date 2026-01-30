
import React, { useState, useRef } from 'react';
import { User, Task, Course, Achievement, AppTab } from '../../types';
import { User as UserIcon, GraduationCap, Palette, Database, Shield, ChevronRight, Sun, Moon, CheckCircle2, Sheet, AlertTriangle, ExternalLink, Code, Sparkles, Search, Bot, Check, Zap, Layers, Terminal, Cpu, Lock, Trophy, ZapOff, Upload, BrainCircuit, LayoutDashboard, ListTodo, Target, FileText, Type, Sidebar, Monitor, Circle, Square, BatteryCharging } from 'lucide-react';
import { UniversityBrowser } from '../UniversityBrowser';
import * as XLSX from 'xlsx';

// --- ACHIEVEMENTS DEFINITION ---
export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'init',
        title: 'Cortex Iniciado',
        description: 'Completa la configuración inicial.',
        icon: Sparkles,
        condition: (u) => !!u.university,
        reward: 'Acceso Básico'
    },
    {
        id: 'task_master',
        title: 'Productivo',
        description: 'Completa al menos 5 tareas en Cronos.',
        icon: CheckCircle2,
        condition: (u, t) => t.filter(task => task.done).length >= 5,
        reward: '+100 XP'
    },
    {
        id: 'strategist',
        title: 'Estratega',
        description: 'Registra al menos 3 materias.',
        icon: Layers,
        condition: (u, t, c) => c.length >= 3,
        reward: '+200 XP'
    },
    {
        id: 'pro_user',
        title: 'Estudiante Pro',
        description: 'Completa 10 tareas Y mantén un promedio global > 3.5.',
        icon: Trophy,
        condition: (u, t, c) => {
            const completed = t.filter(task => task.done).length >= 10;
            const avg = c.length > 0 ? c.reduce((acc, curr) => acc + (parseFloat(curr.average)||0), 0) / c.length : 0;
            return completed && avg >= 3.5;
        },
        reward: 'Desbloquea Modelo Gemini Pro'
    }
];

export const SettingsModule: React.FC<{ user: User; setUser: (u: User) => void; onImport: (d: any) => void; exportData: () => void; onAddTasks: (tasks: Task[]) => void }> = ({ user, setUser, onImport, exportData, onAddTasks }) => {
    const [activeSection, setActiveSection] = useState<'profile' | 'academic' | 'ai' | 'appearance' | 'data' | 'info'>('appearance');
    const [showBrowser, setShowBrowser] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Ensure preferences exist
    const prefs = user.preferences || { nebulaIntensity: 0.25, glassStrength: 'high', fontStyle: 'modern', startTab: 'dashboard', reducedMotion: false, enableTexture: false, interfaceRoundness: 'modern', sidebarPosition: 'left', lowPowerMode: false };
    const updatePrefs = (newPrefs: Partial<typeof prefs>) => {
        setUser({ ...user, preferences: { ...prefs, ...newPrefs } });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const fileReader = new FileReader();
        fileReader.readAsText(e.target.files[0], "UTF-8");
        fileReader.onload = evt => {
            try {
                if (evt.target?.result) {
                    const parsedData = JSON.parse(evt.target.result as string);
                    if (parsedData.courses && parsedData.tasks && parsedData.user) { onImport(parsedData); alert("¡Datos restaurados con éxito!"); } else { alert("Archivo inválido."); }
                }
            } catch (err) { alert("Error al leer el archivo."); }
        };
    };

    const handleClearData = () => {
        if(confirm("⚠️ ¿Estás seguro? Se borrarán todas tus materias, tareas y configuraciones. Esta acción es irreversible.")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const handleJsonExport = () => {
        const data = {
            user: JSON.parse(localStorage.getItem('ctx_user') || '{}'),
            courses: JSON.parse(localStorage.getItem('ctx_courses') || '[]'),
            tasks: JSON.parse(localStorage.getItem('ctx_tasks') || '[]'),
            notes: localStorage.getItem('ctx_notes') || ''
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cortex_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const handleExcelExport = () => {
        const storedCourses = JSON.parse(localStorage.getItem('ctx_courses') || '[]') as Course[];
        const storedTasks = JSON.parse(localStorage.getItem('ctx_tasks') || '[]') as Task[];
        const wb = XLSX.utils.book_new();
        const summaryData = [["REPORTE EJECUTIVO - CORTEX WEBOS"],["Generado el:", new Date().toLocaleDateString()],[""],["Estudiante", user.name],["Universidad", user.university || "N/A"],["Carrera", user.career || "N/A"],["Semestre Actual", user.semester],["Promedio Objetivo", user.targetGrade],[""],["ESTADÍSTICAS GLOBALES"],["Total Materias", storedCourses.length],["Tareas Pendientes", storedTasks.filter(t => !t.done).length]];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");
        const coursesData = storedCourses.map(c => ({"Semestre": c.semester,"Código": c.code,"Materia": c.name,"Créditos": c.credits,"Profesor": c.professor,"Modalidad": c.modality,"Promedio Actual": c.average,"Estado": parseFloat(c.average) >= user.minGrade ? "APROBANDO" : "EN RIESGO","Cortes Evaluados": c.cuts.length})).sort((a,b) => a.Semestre - b.Semestre);
        const wsCourses = XLSX.utils.json_to_sheet(coursesData);
        XLSX.utils.book_append_sheet(wb, wsCourses, "Materias");
        const tasksData = storedTasks.map(t => ({"Estado": t.done ? "Completada" : "Pendiente","Tarea": t.text,"Fecha Límite": t.date || "Sin fecha"}));
        const wsTasks = XLSX.utils.json_to_sheet(tasksData);
        XLSX.utils.book_append_sheet(wb, wsTasks, "Cronos");
        XLSX.writeFile(wb, `Cortex_Reporte_${(user.name || "Estudiante").split(' ')[0]}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const SettingsSidebarItem = ({ id, icon: Icon, label }: any) => (
        <button onClick={() => setActiveSection(id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-medium text-sm mb-1 text-left ${activeSection === id ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]'}`}>
            <Icon size={18} /> {label}
            {activeSection === id && <ChevronRight size={16} className="ml-auto opacity-60" />}
        </button>
    );

    return (
        <div className="max-w-6xl mx-auto anim-enter pb-10 h-full flex flex-col">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Panel de Control</h2>
            <div className="flex flex-col md:flex-row gap-8 flex-1">
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="card-modern p-4 sticky top-6">
                        <div className="mb-6 px-2">
                            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">General</p>
                            <SettingsSidebarItem id="profile" icon={UserIcon} label="Perfil" />
                            <SettingsSidebarItem id="academic" icon={GraduationCap} label="Académico" />
                            <SettingsSidebarItem id="ai" icon={Cpu} label="IA & Logros" />
                            <SettingsSidebarItem id="appearance" icon={Palette} label="Apariencia" />
                        </div>
                        <div className="mb-2 px-2">
                             <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">Sistema</p>
                             <SettingsSidebarItem id="data" icon={Database} label="Datos & Backup" />
                             <SettingsSidebarItem id="info" icon={Shield} label="Legal & Info" />
                        </div>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    
                    {/* PROFILE SECTION */}
                    {activeSection === 'profile' && (
                        <div className="anim-enter space-y-6">
                            <div className="card-modern p-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[var(--accent)]/20 to-[var(--royal)]/20"></div>
                                <div className="relative flex items-end gap-6 mb-6 mt-4">
                                    <div className="w-24 h-24 rounded-full bg-[var(--bg-card)] border-4 border-[var(--bg-card)] shadow-xl flex items-center justify-center text-[var(--text-primary)] text-3xl font-bold overflow-hidden">
                                         {user.logoUrl ? (
                                            <img 
                                                src={user.logoUrl} 
                                                className="w-full h-full object-contain p-2" 
                                                onError={(e) => {
                                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&color=fff&size=128`;
                                                }}
                                            />
                                         ) : (
                                            (user.name || "U").charAt(0)
                                         )}
                                    </div>
                                    <div className="mb-2">
                                        <h3 className="text-2xl font-bold text-[var(--text-primary)]">{user.name}</h3>
                                        <p className="text-[var(--text-secondary)]">{user.email || 'usuario@local.host'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div><label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Nombre Completo</label><input className="w-full input-glass" value={user.name} onChange={e => setUser({...user, name: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Universidad</label><input className="w-full input-glass" value={user.university || ''} onChange={e => setUser({...user, university: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Carrera</label><input className="w-full input-glass" value={user.career || ''} onChange={e => setUser({...user, career: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Semestre Actual</label><select className="w-full input-glass" value={user.semester} onChange={e => setUser({...user, semester: parseInt(e.target.value)})}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(i => <option key={i} value={i}>{i}º Semestre</option>)}</select></div>
                                </div>
                            </div>
                            
                            <div className="card-modern p-8">
                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Comportamiento Inicial</h3>
                                <p className="text-sm text-[var(--text-secondary)] mb-4">Elige qué módulo se abre al iniciar la aplicación.</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[{id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard}, {id: 'cronos', label: 'Cronos', icon: ListTodo}, {id: 'courses', label: 'Materias', icon: FileText}, {id: 'oracle', label: 'Oráculo', icon: Target}].map(opt => {
                                        const Icon = opt.icon;
                                        return (
                                            <button 
                                                key={opt.id}
                                                onClick={() => updatePrefs({ startTab: opt.id as AppTab })}
                                                className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${prefs.startTab === opt.id ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' : 'bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                            >
                                                <Icon size={20}/> {opt.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI & GAMIFICATION SECTION */}
                    {activeSection === 'ai' && (
                        <div className="anim-enter space-y-6">
                            {/* Model Selector */}
                            <div className="card-modern p-8">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Motor de Inteligencia</h3>
                                <p className="text-sm text-[var(--text-secondary)] mb-6">Selecciona el modelo de IA que potenciará tu Cortex.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Flash Model */}
                                    <button 
                                        onClick={() => setUser({...user, selectedModel: 'flash'})}
                                        className={`relative p-6 rounded-2xl border text-left transition-all overflow-hidden group ${user.selectedModel === 'flash' ? 'border-cyan-500 bg-cyan-50/10 shadow-lg ring-1 ring-cyan-500' : 'border-[var(--border-color)] hover:bg-[var(--bg-input)]'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 rounded-xl"><Zap size={24}/></div>
                                            {user.selectedModel === 'flash' && <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white"><Check size={14}/></div>}
                                        </div>
                                        <h4 className="font-bold text-lg text-[var(--text-primary)]">Gemini Flash</h4>
                                        <p className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-2">Velocidad Extrema</p>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">Ideal para respuestas rápidas, organización de tareas y consultas generales. Consumo bajo.</p>
                                    </button>

                                    {/* Pro Model */}
                                    <button 
                                        onClick={() => user.unlockedModels.includes('pro') && setUser({...user, selectedModel: 'pro'})}
                                        className={`relative p-6 rounded-2xl border text-left transition-all overflow-hidden group ${
                                            !user.unlockedModels.includes('pro') 
                                            ? 'opacity-80 border-[var(--border-color)] bg-gray-50/50 cursor-not-allowed grayscale-[0.5]' 
                                            : user.selectedModel === 'pro' 
                                                ? 'border-violet-500 bg-violet-50/10 shadow-lg ring-1 ring-violet-500' 
                                                : 'border-[var(--border-color)] hover:bg-[var(--bg-input)]'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-xl"><BrainCircuit size={24}/></div>
                                            {user.unlockedModels.includes('pro') ? (
                                                user.selectedModel === 'pro' && <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center text-white"><Check size={14}/></div>
                                            ) : (
                                                <div className="w-6 h-6 bg-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-secondary)]"><Lock size={12}/></div>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-lg text-[var(--text-primary)]">Gemini Pro</h4>
                                        <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">Razonamiento Avanzado</p>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">Capacidad superior para estrategias complejas, matemáticas difíciles y análisis profundo.</p>
                                        {!user.unlockedModels.includes('pro') && (
                                            <div className="mt-3 p-2 bg-black/5 rounded-lg text-xs font-bold text-[var(--text-secondary)] flex items-center gap-2">
                                                <Trophy size={12}/> Desbloquea logrando "Estudiante Pro"
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Achievements */}
                            <div className="card-modern p-8">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2"><Trophy size={20} className="text-amber-500"/> Logros & Desbloqueables</h3>
                                <div className="space-y-4">
                                    {ACHIEVEMENTS.map(ach => {
                                        const isUnlocked = user.completedAchievements.includes(ach.id);
                                        const Icon = ach.icon;
                                        return (
                                            <div key={ach.id} className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${isUnlocked ? 'bg-[var(--accent)]/5 border-[var(--accent)]/30' : 'bg-[var(--bg-input)] border-[var(--border-color)] opacity-70'}`}>
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isUnlocked ? 'bg-[var(--accent)] text-white shadow-md' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]'}`}>
                                                    <Icon size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <h4 className={`font-bold text-sm ${isUnlocked ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{ach.title}</h4>
                                                        {isUnlocked && <span className="text-[10px] bg-[var(--success)] text-white px-2 py-0.5 rounded-full font-bold">COMPLETADO</span>}
                                                    </div>
                                                    <p className="text-xs text-[var(--text-secondary)]">{ach.description}</p>
                                                    <p className="text-[10px] font-bold text-[var(--accent)] mt-1 flex items-center gap-1"><Zap size={10}/> Recompensa: {ach.reward}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACADEMIC SECTION */}
                    {activeSection === 'academic' && (
                        <div className="anim-enter space-y-6">
                            <div className="card-modern p-8">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Configuración de Escala</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div>
                                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Nota Mínima</label>
                                        <input type="number" step="0.1" className="w-full input-glass text-center font-mono font-bold" value={user.minGrade} onChange={e => setUser({...user, minGrade: parseFloat(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Nota Máxima</label>
                                        <input type="number" step="0.1" className="w-full input-glass text-center font-mono font-bold" value={user.maxGrade} onChange={e => setUser({...user, maxGrade: parseFloat(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--accent)] uppercase mb-2 block">Meta Personal</label>
                                        <input type="number" step="0.1" className="w-full input-glass text-center font-mono font-bold border-[var(--accent)] text-[var(--accent)]" value={user.targetGrade} onChange={e => setUser({...user, targetGrade: parseFloat(e.target.value)})} />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Modo de Calificación</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setUser({...user, gradingMode: 'simple'})}
                                        className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${user.gradingMode === 'simple' ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-md' : 'border-[var(--border-color)] hover:bg-[var(--bg-input)]'}`}
                                    >
                                        <div className="mb-2 w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors"><Zap size={18}/></div>
                                        <h4 className="font-bold text-sm text-[var(--text-primary)]">Modo Simple</h4>
                                        <p className="text-[10px] text-[var(--text-secondary)] leading-tight mt-1">Registra solo la nota final de cada corte (ej: Corte 1: 4.5). Ideal para rapidez.</p>
                                        {user.gradingMode === 'simple' && <div className="absolute top-2 right-2 text-[var(--accent)]"><Check size={16}/></div>}
                                    </button>

                                    <button 
                                        onClick={() => setUser({...user, gradingMode: 'detailed'})}
                                        className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${user.gradingMode === 'detailed' ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-md' : 'border-[var(--border-color)] hover:bg-[var(--bg-input)]'}`}
                                    >
                                        <div className="mb-2 w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors"><Layers size={18}/></div>
                                        <h4 className="font-bold text-sm text-[var(--text-primary)]">Modo Detallado</h4>
                                        <p className="text-[10px] text-[var(--text-secondary)] leading-tight mt-1">Desglosa cortes en actividades (Quizes, Talleres, Parciales). Mayor precisión.</p>
                                        {user.gradingMode === 'detailed' && <div className="absolute top-2 right-2 text-[var(--accent)]"><Check size={16}/></div>}
                                    </button>
                                </div>
                            </div>

                            <div className="card-modern p-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Navegador Institucional</h3>
                                    <p className="text-sm text-[var(--text-secondary)]">Investiga fechas y calendarios usando IA.</p>
                                </div>
                                <button onClick={() => setShowBrowser(true)} className="btn-primary px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 font-bold text-sm">
                                    <Search size={18}/> Abrir Navegador
                                </button>
                            </div>
                        </div>
                    )}

                    {/* APPEARANCE SECTION */}
                     {activeSection === 'appearance' && (
                        <div className="anim-enter space-y-6">
                             <div className="card-modern p-8">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Tema de Interfaz</h3>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <button onClick={() => setUser({ ...user, theme: 'light' })} className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${user.theme === 'light' ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'}`}><Sun size={24} /> <span className="font-bold">Modo Claro</span></button>
                                    <button onClick={() => setUser({ ...user, theme: 'dark' })} className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${user.theme === 'dark' ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'}`}><Moon size={24} /> <span className="font-bold">Modo Oscuro</span></button>
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Color de Acento</h3>
                                <div className="grid grid-cols-5 gap-4 mb-8">
                                    {[{ id: 'cortex', hex: '#06B6D4' }, { id: 'emerald', hex: '#10B981' }, { id: 'royal', hex: '#8B5CF6' }, { id: 'rose', hex: '#F43F5E' }, { id: 'amber', hex: '#F59E0B' }].map(c => (
                                        <button key={c.id} onClick={() => setUser({...user, accentColor: c.id as any})} className={`h-16 rounded-2xl flex items-center justify-center transition-all ${user.accentColor === c.id ? 'ring-2 ring-offset-2 ring-[var(--text-primary)] scale-105' : 'hover:scale-105 opacity-80'}`} style={{ backgroundColor: c.hex }}>{user.accentColor === c.id && <CheckCircle2 className="text-white drop-shadow-md" size={24} />}</button>
                                    ))}
                                </div>

                                <div className="border-t border-[var(--border-color)] pt-8 mt-8">
                                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">Personalización Avanzada <span className="text-[10px] bg-[var(--accent)] text-white px-2 py-0.5 rounded-full uppercase">Nuevo</span></h3>
                                    
                                    {/* ECO MODE SWITCH */}
                                    <div 
                                        className={`mb-6 p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${prefs.lowPowerMode ? 'bg-emerald-500/10 border-emerald-500' : 'bg-[var(--bg-input)] border-[var(--border-color)]'}`}
                                        onClick={() => updatePrefs({ lowPowerMode: !prefs.lowPowerMode })}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${prefs.lowPowerMode ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'}`}>
                                                <BatteryCharging size={24}/>
                                            </div>
                                            <div>
                                                <p className="font-bold text-[var(--text-primary)]">Modo Ahorro de Energía (Eco)</p>
                                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Optimiza el rendimiento para móviles. Desactiva blur y animaciones.</p>
                                            </div>
                                        </div>
                                        <div className={`w-12 h-7 rounded-full p-1 transition-colors ${prefs.lowPowerMode ? 'bg-emerald-500' : 'bg-[var(--border-color)]'}`}>
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${prefs.lowPowerMode ? 'translate-x-5' : ''}`}></div>
                                        </div>
                                    </div>

                                    {/* PREMIUM NEBULA SLIDER */}
                                    <div className={`mb-10 bg-[var(--bg-input)] p-6 rounded-3xl border border-[var(--border-color)] relative overflow-hidden transition-opacity ${prefs.lowPowerMode ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                                        {/* Background Glow */}
                                        <div className="absolute inset-0 bg-[var(--accent)]/5"></div>
                                        
                                        <div className="flex justify-between items-center mb-4 relative z-10">
                                            <label className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2"><Sparkles size={16} className="text-[var(--accent)]"/> Potencia de Nebula (Fondo Animado)</label>
                                            <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">{Math.round(prefs.nebulaIntensity * 100)}%</span>
                                        </div>
                                        
                                        <div className="relative h-8 flex items-center z-10">
                                            <Zap size={16} className="absolute left-0 text-[var(--text-secondary)] opacity-50"/>
                                            <div className="flex-1 mx-8 relative">
                                                {/* Track Background */}
                                                <div className="absolute top-1/2 -mt-1 w-full h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-[var(--text-secondary)] to-[var(--accent)] opacity-50 w-full"></div>
                                                </div>
                                                {/* Filled Track (Dynamic) */}
                                                <div 
                                                    className="absolute top-1/2 -mt-1 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" 
                                                    style={{width: `${prefs.nebulaIntensity * 100}%`}}
                                                ></div>
                                                <input 
                                                    type="range" 
                                                    min="0" max="1" step="0.05" 
                                                    value={prefs.nebulaIntensity} 
                                                    onChange={(e) => updatePrefs({ nebulaIntensity: parseFloat(e.target.value) })}
                                                    className="nebula-slider relative z-20 opacity-0 w-full h-full cursor-pointer" 
                                                />
                                            </div>
                                            <Zap size={20} className="absolute right-0 text-[var(--accent)] fill-current drop-shadow-md"/>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Glass Strength */}
                                        <div className={prefs.lowPowerMode ? 'opacity-50 pointer-events-none' : ''}>
                                            <label className="text-xs uppercase font-bold text-[var(--text-secondary)] mb-3 block">Cristal (Blur)</label>
                                            <div className="flex bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)]">
                                                {[{id: 'none', label: 'Sólido'}, {id: 'low', label: 'Suave'}, {id: 'high', label: 'Intenso'}].map((opt) => (
                                                    <button 
                                                        key={opt.id}
                                                        onClick={() => updatePrefs({ glassStrength: opt.id as any })}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${prefs.glassStrength === opt.id ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Font Style */}
                                        <div>
                                            <label className="text-xs uppercase font-bold text-[var(--text-secondary)] mb-3 block">Tipografía</label>
                                            <div className="flex bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)]">
                                                <button 
                                                    onClick={() => updatePrefs({ fontStyle: 'modern' })}
                                                    style={{ fontFamily: '"Inter", sans-serif' }}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${prefs.fontStyle === 'modern' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                                >
                                                    <Type size={14}/> Moderna
                                                </button>
                                                <button 
                                                    onClick={() => updatePrefs({ fontStyle: 'technical' })}
                                                    style={{ fontFamily: '"JetBrains Mono", monospace' }}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${prefs.fontStyle === 'technical' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                                >
                                                    <Terminal size={14}/> Técnica
                                                </button>
                                            </div>
                                        </div>

                                        {/* Roundness */}
                                        <div>
                                            <label className="text-xs uppercase font-bold text-[var(--text-secondary)] mb-3 block">Bordes</label>
                                            <div className="flex bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)]">
                                                <button onClick={() => updatePrefs({ interfaceRoundness: 'modern' })} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${prefs.interfaceRoundness === 'modern' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><Square size={14} className="rounded-md"/> Normal</button>
                                                <button onClick={() => updatePrefs({ interfaceRoundness: 'full' })} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${prefs.interfaceRoundness === 'full' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><Circle size={14}/> Full</button>
                                                <button onClick={() => updatePrefs({ interfaceRoundness: 'none' })} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${prefs.interfaceRoundness === 'none' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><Square size={14} className="rounded-none"/> Sharp</button>
                                            </div>
                                        </div>

                                        {/* Sidebar Position */}
                                        <div>
                                            <label className="text-xs uppercase font-bold text-[var(--text-secondary)] mb-3 block">Posición Menú</label>
                                            <div className="flex bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)]">
                                                <button onClick={() => updatePrefs({ sidebarPosition: 'left' })} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${prefs.sidebarPosition === 'left' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><Sidebar size={14} className="rotate-180"/> Izquierda</button>
                                                <button onClick={() => updatePrefs({ sidebarPosition: 'right' })} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${prefs.sidebarPosition === 'right' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><Sidebar size={14}/> Derecha</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Texture Toggle */}
                                    <div className={`mt-6 p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-between cursor-pointer hover:border-[var(--accent)] transition-colors ${prefs.lowPowerMode ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => updatePrefs({ enableTexture: !prefs.enableTexture })}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${prefs.enableTexture ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'}`}><Monitor size={20}/></div>
                                            <div>
                                                <p className="text-sm font-bold text-[var(--text-primary)]">Textura de Ruido (Film Grain)</p>
                                                <p className="text-xs text-[var(--text-secondary)]">Añade un efecto de grano cinematográfico sutil.</p>
                                            </div>
                                        </div>
                                        <div className={`w-12 h-7 rounded-full p-1 transition-colors ${prefs.enableTexture ? 'bg-[var(--accent)]' : 'bg-[var(--border-color)]'}`}>
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${prefs.enableTexture ? 'translate-x-5' : ''}`}></div>
                                        </div>
                                    </div>

                                </div>
                             </div>
                        </div>
                    )}

                    {/* DATA SECTION */}
                    {activeSection === 'data' && (
                        <div className="anim-enter space-y-6">
                            <div className="card-modern p-8">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Exportar Datos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button onClick={handleExcelExport} className="p-4 rounded-xl border border-[var(--border-color)] hover:border-[var(--success)] hover:bg-[var(--success)]/5 group text-left transition-all">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-[var(--success)]/10 text-[var(--success)] rounded-lg"><Sheet size={20}/></div>
                                            <span className="font-bold text-[var(--text-primary)]">Reporte Excel</span>
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)]">Descarga un reporte detallado de tus notas y tareas para imprimir o compartir.</p>
                                    </button>
                                    
                                    <button onClick={handleJsonExport} className="p-4 rounded-xl border border-[var(--border-color)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 group text-left transition-all">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg"><Code size={20}/></div>
                                            <span className="font-bold text-[var(--text-primary)]">Backup JSON</span>
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)]">Guarda una copia de seguridad completa de tu base de datos local.</p>
                                    </button>
                                </div>
                            </div>

                            <div className="card-modern p-8">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Restaurar Datos</h3>
                                <div className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-8 text-center hover:bg-[var(--bg-input)] transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                                    <Upload size={32} className="mx-auto text-[var(--text-secondary)] mb-2"/>
                                    <p className="font-bold text-[var(--text-primary)]">Click para subir Backup (.json)</p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">Esto reemplazará tus datos actuales.</p>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30">
                                <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2"><AlertTriangle size={20}/> Zona de Peligro</h3>
                                <p className="text-sm text-rose-600/80 dark:text-rose-400/80 mb-4">Esta acción borrará todas tus materias, notas y configuraciones de este dispositivo. No se puede deshacer.</p>
                                <button onClick={handleClearData} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors">
                                    Borrar Todo y Reiniciar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* INFO SECTION */}
                    {activeSection === 'info' && (
                        <div className="anim-enter space-y-6">
                            <div className="card-modern p-8 text-center relative overflow-hidden">
                                
                                <div className="relative z-10">
                                    <div className="w-20 h-20 bg-[var(--text-primary)] text-[var(--bg-main)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                                        <Sparkles size={40}/>
                                    </div>
                                    <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-1">Cortex WebOS</h2>
                                    <p className="text-[var(--text-secondary)] font-medium mb-4">Versión 17.3 (Stable Core)</p>
                                    
                                    {/* CREDITS BADGE */}
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold mb-8 border border-[var(--accent)]/20 shadow-sm animate-in zoom-in duration-500">
                                        <span>Desarrollado por <span className="uppercase tracking-wide">CG Labs</span></span>
                                        <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                                        <span className="flex items-center gap-1"><Bot size={12}/> Cortex AI</span>
                                    </div>

                                    <div className="flex flex-col gap-3 max-w-sm mx-auto text-left text-sm text-[var(--text-secondary)] bg-[var(--bg-input)] p-6 rounded-xl border border-[var(--border-color)]">
                                        <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
                                            <span>Build</span>
                                            <span className="font-mono font-bold text-[var(--text-primary)]">2024.10.C</span>
                                        </div>
                                        <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
                                            <span>Motor IA</span>
                                            <span className="font-mono font-bold text-[var(--text-primary)]">Gemini 1.5 Flash</span>
                                        </div>
                                        <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
                                            <span>Licencia</span>
                                            <span className="font-mono font-bold text-[var(--text-primary)]">MIT Open Source</span>
                                        </div>
                                        <div className="flex justify-between pt-1">
                                            <span>Terminal</span>
                                            <span className="font-mono font-bold text-[var(--accent)] flex items-center gap-1"><Terminal size={12}/> CG-LABS-DEV</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-center gap-4">
                                        <a href="#" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-sm font-bold">
                                            <ExternalLink size={14}/> Documentación
                                        </a>
                                        <a href="#" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-sm font-bold">
                                            <ExternalLink size={14}/> GitHub
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
            {showBrowser && <UniversityBrowser university={user.university || "tu universidad"} logoUrl={user.logoUrl} onClose={() => setShowBrowser(false)} onImportTasks={onAddTasks} />}
        </div>
    );
};
