
import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../../types';
import { Kanban, Calendar as CalendarIcon, ListTodo, Timer, Plus, MoreVertical, CheckCircle2, Trash2, Sparkles, ArrowUp, ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { generateText } from '../../services/gemini';
import { triggerHaptic } from '../../services/platform';

export const CronosModule: React.FC<{ tasks: Task[]; setTasks: React.Dispatch<React.SetStateAction<Task[]>> }> = ({ tasks, setTasks }) => {
  const [view, setView] = useState<'board' | 'calendar' | 'list' | 'focus'>('board');
  const [newTask, setNewTask] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Focus Mode State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [focusMode, setFocusMode] = useState<'work' | 'break'>('work');
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
       setIsActive(false);
       if(timerRef.current) clearInterval(timerRef.current);
       triggerHaptic('heavy'); // Alarm vibration
       // Play sound or notification here
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
      triggerHaptic('medium');
      setIsActive(!isActive);
  };
  const resetTimer = () => {
      triggerHaptic('light');
      setIsActive(false);
      setTimeLeft(focusMode === 'work' ? 25 * 60 : 5 * 60);
  };
  const switchFocusMode = (m: 'work' | 'break') => {
      triggerHaptic('medium');
      setFocusMode(m);
      setIsActive(false);
      setTimeLeft(m === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- TASK ACTIONS ---
  const addTask = () => {
    if (!newTask.trim()) return;
    const t: Task = { 
        id: Date.now(), 
        text: newTask, 
        date: taskDate || new Date().toISOString().split('T')[0], 
        done: false,
        status: 'todo',
        priority: taskPriority 
    };
    setTasks([...tasks, t]);
    setNewTask('');
    setTaskDate('');
    triggerHaptic('light');
  };

  const updateTaskStatus = (id: number, status: 'todo' | 'in_progress' | 'done') => {
      if (status === 'done') triggerHaptic('medium');
      setTasks(tasks.map(t => t.id === id ? { ...t, status, done: status === 'done' } : t));
  };
  
  const toggleDone = (id: number) => {
      setTasks(tasks.map(t => {
          if (t.id === id) {
              const newDone = !t.done;
              if (newDone) triggerHaptic('medium'); // Satisfying click
              return { ...t, done: newDone, status: newDone ? 'done' : 'todo' };
          }
          return t;
      }));
  };

  const deleteTask = (id: number) => setTasks(tasks.filter(t => t.id !== id));

  const handleAiBreakdown = async (taskText: string) => {
      setIsGenerating(true);
      triggerHaptic('light');
      const prompt = `Desglosa la tarea académica "${taskText}" en 3 pasos accionables y breves. Devuélvelos separados por saltos de línea.`;
      try {
          const result = await generateText(prompt);
          const lines = result.split('\n').filter(l => l.trim().length > 0);
          const subTasks = lines.map(line => ({
              id: Date.now() + Math.random(),
              text: line.replace(/^[-*•\d]+\.?\s*/, '').trim(),
              date: new Date().toISOString().split('T')[0],
              done: false,
              status: 'todo' as const,
              priority: 'medium' as const
          }));
          setTasks(prev => [...prev, ...subTasks]);
          triggerHaptic('medium');
      } catch (e) {
          console.error("Error conectando con AI", e);
      }
      setIsGenerating(false);
  };

  const getPriorityColor = (p?: string) => {
      if (p === 'high') return 'text-rose-500 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800';
      if (p === 'low') return 'text-emerald-500 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800';
      return 'text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800';
  };

  // --- CALENDAR HELPERS ---
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => {
      const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay(); 
      return day === 0 ? 6 : day - 1; // Adjust to make Monday = 0
  };
  
  const changeMonth = (offset: number) => {
      const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
      setCurrentDate(new Date(newDate));
  };

  return (
    <div className="max-w-7xl mx-auto anim-enter h-full flex flex-col">
       <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Cronos</h2>
          <p className="text-[var(--text-secondary)]">Gestión profesional de tareas y tiempo.</p>
        </div>
        
        <div className="flex bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)] shadow-sm">
          <button onClick={() => setView('board')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'board' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              <Kanban size={14}/> Tablero
          </button>
          <button onClick={() => setView('calendar')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'calendar' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              <CalendarIcon size={14}/> Calendario
          </button>
           <button onClick={() => setView('list')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'list' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              <ListTodo size={14}/> Lista
          </button>
          <button onClick={() => setView('focus')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'focus' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              <Timer size={14}/> Focus
          </button>
        </div>
      </div>

      {view !== 'focus' && (
          <div className="card-modern p-3 mb-6 flex flex-col md:flex-row gap-3 items-center bg-[var(--bg-card)]">
             <div className="p-2 bg-[var(--accent)]/10 rounded-lg text-[var(--accent)]"><Plus size={20}/></div>
             <input className="flex-1 bg-transparent p-2 outline-none text-[var(--text-primary)] font-medium placeholder:text-[var(--text-secondary)]" placeholder="Nueva tarea..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
             <div className="flex items-center gap-2 w-full md:w-auto">
                 <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as any)} className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold rounded-lg px-3 py-2 outline-none cursor-pointer hover:border-[var(--accent)]"><option value="high">Alta Prioridad</option><option value="medium">Media</option><option value="low">Baja</option></select>
                 <input type="date" className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold rounded-lg px-3 py-2 outline-none cursor-pointer hover:border-[var(--accent)]" value={taskDate} onChange={e => setTaskDate(e.target.value)} />
                 <button onClick={addTask} className="btn-primary px-6 py-2 rounded-lg font-bold text-sm shadow-md whitespace-nowrap">Crear Tarea</button>
             </div>
          </div>
      )}

      {/* --- BOARD VIEW --- */}
      {view === 'board' && (
          <div className="flex-1 overflow-x-auto pb-4">
              <div className="flex gap-6 min-w-[800px] h-full">
                  {[{ id: 'todo', title: 'Por hacer', color: 'bg-zinc-500' }, { id: 'in_progress', title: 'En Progreso', color: 'bg-[var(--accent)]' }, { id: 'done', title: 'Terminado', color: 'bg-[var(--success)]' }].map(col => {
                      const colTasks = tasks.filter(t => (t.status === col.id) || (col.id === 'todo' && !t.status && !t.done) || (col.id === 'done' && t.done)); 
                      return (
                          <div key={col.id} className="flex-1 flex flex-col bg-[var(--bg-input)]/50 rounded-2xl border border-[var(--border-color)] h-full min-h-[500px]">
                              <div className="p-4 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-card)] rounded-t-2xl sticky top-0 z-10"><div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${col.color}`}></div><h3 className="font-bold text-[var(--text-primary)] text-sm">{col.title}</h3><span className="bg-[var(--bg-input)] px-2 py-0.5 rounded text-[10px] font-bold text-[var(--text-secondary)] border border-[var(--border-color)]">{colTasks.length}</span></div><MoreVertical size={16} className="text-[var(--text-secondary)]"/></div>
                              <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                                  {colTasks.map(t => (
                                      <div key={t.id} className="card-modern p-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all border border-[var(--border-color)] group relative bg-[var(--bg-card)]">
                                          <div className="flex justify-between items-start mb-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(t.priority)}`}>{t.priority === 'high' ? 'Alta' : t.priority === 'low' ? 'Baja' : 'Media'}</span>{col.id !== 'done' && (<button onClick={() => updateTaskStatus(t.id, 'done')} className="text-[var(--text-secondary)] hover:text-[var(--success)] transition-colors"><CheckCircle2 size={16}/></button>)}</div>
                                          <p className="font-medium text-[var(--text-primary)] text-sm mb-3 leading-snug">{t.text}</p>
                                          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]"><div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] font-medium"><CalendarIcon size={12}/> {t.date ? new Date(t.date).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'Sin fecha'}</div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">{col.id === 'todo' && (<button onClick={() => updateTaskStatus(t.id, 'in_progress')} className="p-1 rounded hover:bg-[var(--accent)] hover:text-white text-[var(--text-secondary)]"><ArrowUp size={14} className="rotate-90"/></button>)}{col.id === 'in_progress' && (<button onClick={() => updateTaskStatus(t.id, 'todo')} className="p-1 rounded hover:bg-[var(--bg-input)] text-[var(--text-secondary)]"><ArrowUp size={14} className="-rotate-90"/></button>)}<button onClick={() => deleteTask(t.id)} className="p-1 rounded hover:bg-[var(--danger)] hover:text-white text-[var(--text-secondary)]"><Trash2 size={14}/></button><button onClick={() => handleAiBreakdown(t.text)} className="p-1 rounded hover:bg-[var(--royal)] hover:text-white text-[var(--text-secondary)]"><Sparkles size={14}/></button></div></div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* --- CALENDAR VIEW --- */}
      {view === 'calendar' && (
          <div className="flex-1 flex flex-col bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm anim-enter">
              {/* Calendar Header */}
              <div className="p-4 flex items-center justify-between border-b border-[var(--border-color)]">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] capitalize">
                      {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex gap-1">
                      <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-[var(--bg-input)] text-[var(--text-secondary)]"><ChevronLeft size={20}/></button>
                      <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 rounded-lg hover:bg-[var(--bg-input)] text-[var(--text-secondary)] text-xs font-bold">Hoy</button>
                      <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-[var(--bg-input)] text-[var(--text-secondary)]"><ChevronRight size={20}/></button>
                  </div>
              </div>

              {/* Grid Header */}
              <div className="grid grid-cols-7 bg-[var(--bg-input)]/50 border-b border-[var(--border-color)]">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                      <div key={d} className="py-2 text-center text-xs font-bold text-[var(--text-secondary)] uppercase">{d}</div>
                  ))}
              </div>

              {/* Grid Body */}
              <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-[var(--bg-input)]/20">
                  {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, i) => (
                      <div key={`empty-${i}`} className="border-r border-b border-[var(--border-color)] bg-[var(--bg-input)]/10" />
                  ))}
                  
                  {Array.from({ length: getDaysInMonth(currentDate) }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isToday = new Date().toISOString().split('T')[0] === dateStr;
                      const dayTasks = tasks.filter(t => t.date === dateStr);

                      return (
                          <div key={day} className={`min-h-[100px] p-2 border-r border-b border-[var(--border-color)] relative group hover:bg-[var(--bg-input)] transition-colors ${isToday ? 'bg-[var(--accent)]/5' : ''}`}>
                              <span className={`text-xs font-bold inline-block w-6 h-6 text-center leading-6 rounded-full ${isToday ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]'}`}>{day}</span>
                              <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                  {dayTasks.map(t => (
                                      <div key={t.id} className={`text-[10px] p-1 rounded border truncate cursor-pointer ${t.done ? 'line-through opacity-50 bg-gray-100 border-gray-200 text-gray-500' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)] shadow-sm'}`} title={t.text} onClick={() => toggleDone(t.id)}>
                                          <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${t.priority === 'high' ? 'bg-rose-500' : t.priority === 'low' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                          {t.text}
                                      </div>
                                  ))}
                              </div>
                              <button onClick={() => { setNewTask(''); setTaskDate(dateStr); setView('board'); }} className="absolute top-2 right-2 p-1 rounded hover:bg-[var(--bg-input)] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={14}/></button>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* --- LIST VIEW --- */}
      {view === 'list' && (
          <div className="flex-1 overflow-y-auto anim-enter">
              <div className="card-modern overflow-hidden border border-[var(--border-color)]">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-[var(--bg-input)] text-[var(--text-secondary)] text-xs uppercase border-b border-[var(--border-color)]">
                              <th className="p-4 font-bold w-12 text-center"></th>
                              <th className="p-4 font-bold">Tarea</th>
                              <th className="p-4 font-bold w-32">Fecha</th>
                              <th className="p-4 font-bold w-32">Prioridad</th>
                              <th className="p-4 font-bold w-20 text-center">Acciones</th>
                          </tr>
                      </thead>
                      <tbody>
                          {tasks.length === 0 ? (
                              <tr><td colSpan={5} className="p-8 text-center text-[var(--text-secondary)] text-sm">No tienes tareas pendientes.</td></tr>
                          ) : (
                              tasks.sort((a,b) => (a.done === b.done) ? 0 : a.done ? 1 : -1).map(t => (
                                  <tr key={t.id} className={`border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-input)]/50 transition-colors group ${t.done ? 'bg-gray-50/50' : ''}`}>
                                      <td className="p-4 text-center">
                                          <button onClick={() => toggleDone(t.id)} className={`transition-colors ${t.done ? 'text-[var(--success)]' : 'text-[var(--border-color)] hover:text-[var(--text-secondary)]'}`}>
                                              <CheckCircle2 size={20} className={t.done ? "fill-current" : ""} />
                                          </button>
                                      </td>
                                      <td className="p-4">
                                          <span className={`font-medium text-sm ${t.done ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>{t.text}</span>
                                      </td>
                                      <td className="p-4">
                                          <span className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-input)] px-2 py-1 rounded border border-[var(--border-color)]">
                                              {t.date || "---"}
                                          </span>
                                      </td>
                                      <td className="p-4">
                                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border ${getPriorityColor(t.priority)}`}>
                                              {t.priority === 'high' ? 'Alta' : t.priority === 'low' ? 'Baja' : 'Media'}
                                          </span>
                                      </td>
                                      <td className="p-4 text-center">
                                          <button onClick={() => deleteTask(t.id)} className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors opacity-0 group-hover:opacity-100">
                                              <Trash2 size={16}/>
                                          </button>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- FOCUS VIEW (POMODORO) --- */}
      {view === 'focus' && (
          <div className="flex-1 flex flex-col md:flex-row gap-6 anim-enter items-center justify-center">
              
              <div className="flex-1 max-w-md w-full">
                  <div className="card-modern p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                      {/* Decorative Pulse */}
                      {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-64 h-64 bg-[var(--accent)]/10 rounded-full animate-ping opacity-20"></div>
                          </div>
                      )}

                      <div className="flex gap-2 mb-8 bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)] relative z-10">
                          <button onClick={() => switchFocusMode('work')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${focusMode === 'work' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                              <Brain size={16}/> Work
                          </button>
                          <button onClick={() => switchFocusMode('break')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${focusMode === 'break' ? 'bg-[var(--royal)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                              <Coffee size={16}/> Break
                          </button>
                      </div>

                      <div className="text-8xl font-black font-mono mb-8 tracking-tighter text-[var(--text-primary)] relative z-10 tabular-nums">
                          {formatTime(timeLeft)}
                      </div>

                      <div className="flex gap-4 relative z-10">
                          <button onClick={toggleTimer} className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${isActive ? 'bg-[var(--text-secondary)]' : 'bg-[var(--accent)]'}`}>
                              {isActive ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor" className="ml-1"/>}
                          </button>
                          <button onClick={resetTimer} className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--accent)] shadow-sm transition-colors">
                              <RotateCcw size={28}/>
                          </button>
                      </div>

                      {activeTaskId && (
                          <div className="mt-8 p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-color)] text-sm max-w-xs animate-in slide-in-from-bottom-2">
                              <p className="text-[var(--text-secondary)] text-xs font-bold uppercase mb-1">Enfocado en:</p>
                              <p className="font-bold text-[var(--text-primary)] line-clamp-1">{tasks.find(t => t.id === activeTaskId)?.text}</p>
                          </div>
                      )}
                  </div>
              </div>

              {/* Task Selector for Focus */}
              <div className="w-full md:w-80 h-[500px] flex flex-col card-modern border border-[var(--border-color)] overflow-hidden">
                  <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-input)]/50">
                      <h3 className="font-bold text-sm text-[var(--text-primary)]">Cola de Tareas</h3>
                      <p className="text-xs text-[var(--text-secondary)]">Selecciona una para enfocarte.</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                      {tasks.filter(t => !t.done).map(t => (
                          <div 
                            key={t.id} 
                            onClick={() => setActiveTaskId(t.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${activeTaskId === t.id ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent)]'}`}
                          >
                              <p className="text-sm font-bold mb-1 leading-snug">{t.text}</p>
                              <div className="flex justify-between items-center opacity-80">
                                  <span className="text-[10px] font-mono">{t.date}</span>
                                  <span className={`w-2 h-2 rounded-full ${t.priority === 'high' ? 'bg-rose-400' : t.priority === 'low' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                              </div>
                          </div>
                      ))}
                      {tasks.filter(t => !t.done).length === 0 && (
                          <div className="p-8 text-center text-[var(--text-secondary)] text-sm">
                              ¡Estás al día! 🎉
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
