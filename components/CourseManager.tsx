
import React, { useState, useEffect } from 'react';
import { Course, GradeCut, GradeActivity } from '../types';
import { Plus, Trash2, Video, Building, FolderOpen, Link2, CheckCircle2, Sparkles, Brain, Loader2, ChevronDown, ChevronUp, Layers, Calculator, CornerDownRight, FileText, Target, Palette } from 'lucide-react';
import { generateText } from '../services/gemini';

interface Props {
  course: Course;
  onClose: () => void;
  onUpdate: (course: Course) => void;
  onDelete: (id: number) => void;
  gradingSystem: { min: number; max: number };
  gradingMode: 'simple' | 'detailed';
}

export const CourseManagerModal: React.FC<Props> = ({ course, onClose, onUpdate, onDelete, gradingSystem, gradingMode }) => {
  const [activeTab, setActiveTab] = useState<'grades' | 'resources' | 'studio' | 'info'>('grades');
  const [localCourse, setLocalCourse] = useState<Course>({ ...course });
  
  // Cut Inputs
  const [newCut, setNewCut] = useState({ name: '', weight: '', grade: '' });
  
  // Expanded Cut ID for detailed view (Default open first one if exists)
  const [expandedCutId, setExpandedCutId] = useState<number | null>(course.cuts.length > 0 ? course.cuts[0].id : null);
  
  // Sub-Activity Input
  const [newActivity, setNewActivity] = useState({ name: '', weight: '', grade: '' });
  
  // Resources Input
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  
  // AI Flashcards State
  const [flashcards, setFlashcards] = useState<{q: string, a: string}[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);

  // --- RECALCULATE GRADES ---
  useEffect(() => {
    if (!localCourse.cuts) return;
    
    let weightedSum = 0;
    let totalCourseWeight = 0;

    const updatedCuts = localCourse.cuts.map(cut => {
       // Check if this cut has sub-activities and we are in detailed mode (or it has historical activities)
       const hasActivities = cut.activities && cut.activities.length > 0;
       
       let finalCutGrade = parseFloat(cut.grade);
       
       if (gradingMode === 'detailed') {
           if (hasActivities) {
               let cutWeightedSum = 0;
               let currentCutWeight = 0;
               
               cut.activities!.forEach(act => {
                   const w = act.weight;
                   const g = parseFloat(act.grade);
                   if(!isNaN(g) && g >= 0) {
                       cutWeightedSum += g * (w / 100);
                   }
                   currentCutWeight += w;
               });
               
               // If weights don't sum to 100 yet, the grade is "in progress"
               // We just sum the weighted parts. (e.g. Quiz 30% * 5.0 = 1.5 accumulated)
               finalCutGrade = cutWeightedSum; 
           } else {
               // If detailed mode but no activities, grade is effectively 0 until added
               // unless user manually put a grade before switching modes. 
               // We'll trust the stored grade if no activities exist, or 0.
               if (!cut.grade) finalCutGrade = 0;
           }
       }
       
       // Calculate Course Average
       const cutW = cut.weight;
       if (!isNaN(finalCutGrade) && finalCutGrade >= 0) {
           weightedSum += finalCutGrade * (cutW / 100);
           totalCourseWeight += cutW;
       }
       
       return { ...cut, grade: isNaN(finalCutGrade) ? '0.0' : finalCutGrade.toFixed(2) };
    });

    const avg = weightedSum.toFixed(2);
    // Progress based on weight of cuts that have been evaluated (simple approx)
    const progress = totalCourseWeight / 100;

    // Avoid infinite loop by checking if values actually changed
    const prevAvg = localCourse.average || "0.0";
    const prevProg = localCourse.progress || 0;

    if(avg !== prevAvg || Math.abs(progress - prevProg) > 0.01) {
         // Create a new object ONLY if stats changed, preserving the updated cuts structure
         // actually we need to update cuts too to show the calculated grade in UI
         setLocalCourse(prev => ({ 
             ...prev, 
             cuts: updatedCuts,
             average: avg, 
             progress: progress 
         }));
    }

  }, [localCourse.cuts, gradingMode]);

  const handleSave = () => {
    onUpdate(localCourse);
    onClose();
  };

  const handleAddCut = () => {
    if (!newCut.name || !newCut.weight) return;
    const newId = Date.now();
    setLocalCourse(prev => ({
      ...prev,
      cuts: [...prev.cuts, { 
        id: newId, 
        name: newCut.name, 
        weight: parseFloat(newCut.weight), 
        grade: gradingMode === 'detailed' ? '0.0' : newCut.grade, // Start at 0 in detailed
        activities: []
      }]
    }));
    setNewCut({ name: '', weight: '', grade: '' });
    if(gradingMode === 'detailed') setExpandedCutId(newId);
  };

  const handleDeleteCut = (id: number) => {
    setLocalCourse(prev => ({ ...prev, cuts: prev.cuts.filter(c => c.id !== id) }));
  };

  const handleAddActivity = (cutId: number) => {
      if (!newActivity.name || !newActivity.weight || !newActivity.grade) return;
      setLocalCourse(prev => ({
          ...prev,
          cuts: prev.cuts.map(c => {
              if (c.id === cutId) {
                  return {
                      ...c,
                      activities: [...(c.activities || []), {
                          id: Date.now(),
                          name: newActivity.name,
                          weight: parseFloat(newActivity.weight),
                          grade: newActivity.grade
                      }]
                  };
              }
              return c;
          })
      }));
      setNewActivity({ name: '', weight: '', grade: '' });
  };

  const removeActivity = (cutId: number, actId: number) => {
      setLocalCourse(prev => ({
          ...prev,
          cuts: prev.cuts.map(c => {
              if (c.id === cutId) {
                  return { ...c, activities: c.activities?.filter(a => a.id !== actId) };
              }
              return c;
          })
      }));
  };

  const handleAddResource = () => {
    if (!newLink.title || !newLink.url) return;
    setLocalCourse(prev => ({
      ...prev,
      resources: [...prev.resources, { id: Date.now(), title: newLink.title, url: newLink.url }]
    }));
    setNewLink({ title: '', url: '' });
  };

  const generateFlashcards = async () => {
    setIsLoadingCards(true);
    const prompt = `Genera 4 preguntas de estudio cortas y sus respuestas para la materia universitaria "${localCourse.name}". Format: P: ... R: ...`;
    try {
        const text = await generateText(prompt);
        const pairs = text.split('P:').filter(t => t.trim().length > 0).map(part => {
            const [q, a] = part.split('R:');
            return { q: q?.trim() || 'Pregunta', a: a?.trim() || 'Respuesta' };
        });
        setFlashcards(pairs);
    } catch (e) {
        setFlashcards([{q: 'Error generando tarjetas', a: 'Intenta nuevamente'}]);
    }
    setIsLoadingCards(false);
  };

  const isPassing = parseFloat(localCourse.average) >= gradingSystem.min;
  
  // Helpers for Color
  const getColorHex = (c: string) => {
      switch(c) {
          case 'emerald': return '#10B981';
          case 'royal': return '#8B5CF6';
          case 'rose': return '#F43F5E';
          case 'amber': return '#F59E0B';
          default: return '#06B6D4'; // cortex
      }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md anim-enter" onClick={onClose}>
      <div className="w-full max-w-2xl card-modern overflow-hidden flex flex-col max-h-[90vh] bg-[var(--bg-card)] shadow-2xl border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-start bg-[var(--bg-input)]/30">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`w-3 h-3 rounded-full shadow-[0_0_10px]`} 
                style={{ 
                    backgroundColor: getColorHex(localCourse.color), 
                    boxShadow: `0 0 10px ${getColorHex(localCourse.color)}`
                }}>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">{localCourse.code || 'NO-CODE'}</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-1">{localCourse.name}</h2>
            <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
              {localCourse.modality === 'virtual' ? <Video size={14} className="text-[var(--royal)]" /> : <Building size={14} className="text-[var(--accent)]" />} 
              {localCourse.modality === 'virtual' ? 'Virtual / Remoto' : 'Presencial'}
            </p>
          </div>
          
          <div className="text-right p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)]">
            <div className={`text-4xl font-mono font-bold ${!isPassing ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
              {localCourse.average || '0.0'}
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-widest mt-1">Acumulado</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-input)]/10">
          {(['grades', 'resources', 'studio', 'info'] as const).map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--accent)]/5' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]'
              }`}
            >
              {tab === 'grades' ? 'Notas' : tab === 'resources' ? 'Recursos' : tab === 'studio' ? 'AI Studio' : 'Ajustes'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-[var(--bg-main)]/50">
          
          {activeTab === 'grades' && (
            <div className="space-y-6">
              
              {/* Add New Cut Box */}
              <div className="p-5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] shadow-sm">
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-[var(--accent)]"><Plus size={16} /> Agregar Corte Principal</h4>
                <div className="flex gap-3">
                  <input placeholder="Nombre (ej: Corte 1)" className="flex-[2] input-glass" value={newCut.name} onChange={e => setNewCut({ ...newCut, name: e.target.value })} />
                  <input type="number" placeholder="Peso %" className="w-24 input-glass text-center" value={newCut.weight} onChange={e => setNewCut({ ...newCut, weight: e.target.value })} />
                  
                  {/* Conditional Grade Input */}
                  {gradingMode === 'simple' ? (
                     <input type="number" placeholder="Nota" className="w-24 input-glass text-center" value={newCut.grade} onChange={e => setNewCut({ ...newCut, grade: e.target.value })} />
                  ) : (
                     <div className="w-24 flex items-center justify-center bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-mono select-none" title="Se calculará automáticamente">
                         <Calculator size={14} className="mr-1"/> Auto
                     </div>
                  )}
                  
                  <button onClick={handleAddCut} className="p-3 bg-[var(--accent)] text-white rounded-xl hover:brightness-110 transition-opacity shadow-lg"><Plus size={20} /></button>
                </div>
                {gradingMode === 'detailed' && <p className="text-[10px] text-[var(--text-secondary)] mt-2 flex items-center gap-1"><Layers size={10}/> Modo Detallado: Agrega el corte y luego inserta sus actividades.</p>}
              </div>

              {/* HIERARCHICAL TREE VIEW FOR DETAILED MODE */}
              <div className="space-y-4">
                {localCourse.cuts.map(cut => {
                   const isExpanded = expandedCutId === cut.id || gradingMode === 'simple'; // Simple mode always visually "closed" but we use the row
                   const currentWeightSum = cut.activities?.reduce((acc, curr) => acc + curr.weight, 0) || 0;
                   const isWeightComplete = currentWeightSum >= 99.9;

                   return (
                  <div key={cut.id} className={`rounded-xl border transition-all ${expandedCutId === cut.id && gradingMode === 'detailed' ? 'border-[var(--accent)] bg-[var(--bg-card)] shadow-md' : 'border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm'}`}>
                    
                    {/* 1. CUT HEADER (The Parent Node) */}
                    <div 
                        className="flex items-center justify-between p-4 cursor-pointer group hover:bg-[var(--bg-input)]/50 rounded-xl"
                        onClick={() => gradingMode === 'detailed' && setExpandedCutId(isExpanded && expandedCutId === cut.id ? null : cut.id)}
                    >
                        <div className="flex items-center gap-4">
                             {/* Folder Icon / Expander */}
                             <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'}`}>
                                 {gradingMode === 'detailed' ? (isExpanded ? <FolderOpen size={20}/> : <FolderOpen size={20} className="opacity-50"/>) : <Target size={20}/>}
                             </div>
                             
                             <div>
                                <p className="font-bold text-[var(--text-primary)] text-sm">{cut.name}</p>
                                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono">
                                    <span className="bg-[var(--bg-input)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">{cut.weight}% del Semestre</span>
                                    {gradingMode === 'detailed' && (
                                        <span className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${isWeightComplete ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
                                            {isWeightComplete ? <CheckCircle2 size={10}/> : <Loader2 size={10}/>} 
                                            Progreso interno: {currentWeightSum}%
                                        </span>
                                    )}
                                </div>
                             </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                {cut.grade ? (
                                    <span className={`font-mono font-bold text-xl ${parseFloat(cut.grade) < gradingSystem.min ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>{cut.grade}</span>
                                ) : <span className="text-xs text-slate-400 italic">--</span>}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteCut(cut.id); }} className="text-slate-400 hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
                        </div>
                    </div>

                    {/* 2. ACTIVITIES TREE (Children Nodes) - Only in Detailed Mode */}
                    {isExpanded && gradingMode === 'detailed' && (
                        <div className="pb-4 pr-4">
                             {/* Connector Line */}
                             <div className="ml-9 border-l-2 border-[var(--border-color)] pl-6 space-y-3 pt-2">
                                
                                {/* List Existing Activities */}
                                {cut.activities?.map(act => (
                                    <div key={act.id} className="relative flex items-center justify-between group/act animate-in slide-in-from-left-2 duration-300">
                                        {/* Branch Curve */}
                                        <div className="absolute -left-6 top-1/2 -mt-px w-4 h-px bg-[var(--border-color)]"></div>
                                        <div className="absolute -left-6 top-0 bottom-1/2 w-px bg-[var(--border-color)] rounded-bl-lg"></div>

                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="p-1.5 rounded bg-[var(--bg-input)] text-[var(--text-secondary)]"><FileText size={14}/></div>
                                            <span className="text-sm text-[var(--text-primary)] font-medium">{act.name}</span>
                                            <span className="text-[10px] bg-[var(--bg-main)] px-1.5 rounded border text-[var(--text-secondary)]">{act.weight}%</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <span className={`font-mono font-bold text-sm ${parseFloat(act.grade) < gradingSystem.min ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>{act.grade}</span>
                                            <button onClick={() => removeActivity(cut.id, act.id)} className="text-[var(--text-secondary)] hover:text-[var(--danger)] opacity-0 group-hover/act:opacity-100"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                ))}

                                {/* Add New Activity Form (The "Leaf" Creator) */}
                                <div className="relative pt-2">
                                     <div className="absolute -left-6 top-5 w-4 h-px bg-[var(--accent)] opacity-50"></div>
                                     
                                     <div className="bg-[var(--bg-input)] p-2 rounded-xl border border-[var(--border-color)] flex items-center gap-2 shadow-sm focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)] transition-all">
                                         <div className="p-1.5 bg-[var(--accent)]/10 rounded text-[var(--accent)]"><CornerDownRight size={14}/></div>
                                         <input 
                                            placeholder="Nueva Actividad (ej: Quiz 1)" 
                                            className="bg-transparent text-sm outline-none flex-1 placeholder:text-[var(--text-secondary)]"
                                            value={newActivity.name} 
                                            onChange={e => setNewActivity({...newActivity, name: e.target.value})}
                                            onKeyDown={e => e.key === 'Enter' && handleAddActivity(cut.id)}
                                         />
                                         <div className="h-4 w-px bg-[var(--border-color)] mx-1"></div>
                                         <input 
                                            placeholder="%" 
                                            type="number" 
                                            className="bg-transparent text-sm outline-none w-12 text-center"
                                            value={newActivity.weight} 
                                            onChange={e => setNewActivity({...newActivity, weight: e.target.value})}
                                            onKeyDown={e => e.key === 'Enter' && handleAddActivity(cut.id)}
                                         />
                                         <div className="h-4 w-px bg-[var(--border-color)] mx-1"></div>
                                         <input 
                                            placeholder="Nota" 
                                            type="number" 
                                            className="bg-transparent text-sm outline-none w-12 text-center font-bold text-[var(--text-primary)]"
                                            value={newActivity.grade} 
                                            onChange={e => setNewActivity({...newActivity, grade: e.target.value})}
                                            onKeyDown={e => e.key === 'Enter' && handleAddActivity(cut.id)}
                                         />
                                         <button onClick={() => handleAddActivity(cut.id)} className="p-1.5 bg-[var(--text-primary)] text-[var(--bg-main)] rounded-lg hover:opacity-90 ml-1 shadow-sm"><Plus size={14}/></button>
                                     </div>
                                </div>
                             </div>
                        </div>
                    )}
                  </div>
                )})}
                {localCourse.cuts.length === 0 && <div className="text-center py-10 text-[var(--text-secondary)] text-sm italic">No hay notas registradas.</div>}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] shadow-sm">
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-[var(--royal)]"><Link2 size={16} /> Nuevo Recurso</h4>
                <div className="flex gap-3">
                  <input placeholder="Título" className="flex-[2] input-glass" value={newLink.title} onChange={e => setNewLink({ ...newLink, title: e.target.value })} />
                  <input placeholder="URL" className="flex-[3] input-glass" value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })} />
                  <button onClick={handleAddResource} className="p-3 bg-[var(--royal)] text-white rounded-xl hover:brightness-110 shadow-lg"><Plus size={20} /></button>
                </div>
              </div>
              <div className="space-y-3">
                {localCourse.resources.map(res => (
                  <div key={res.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--royal)] group shadow-sm">
                    <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)]">
                      <FolderOpen size={18} className="text-[var(--royal)]" /> {res.title}
                    </a>
                    <button onClick={() => setLocalCourse(prev => ({ ...prev, resources: prev.resources.filter(r => r.id !== res.id) }))} className="text-slate-400 hover:text-[var(--danger)] opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="space-y-6 text-center">
                {!flashcards.length && !isLoadingCards && (
                    <div className="py-12 flex flex-col items-center">
                        <div className="w-16 h-16 bg-[var(--accent)]/10 text-[var(--accent)] rounded-2xl flex items-center justify-center mb-4"><Brain size={32}/></div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">Generador de Estudio IA</h3>
                        <p className="text-[var(--text-secondary)] max-w-xs mx-auto mb-6 text-sm">Crea tarjetas de repaso instantáneas basadas en el contenido de esta materia.</p>
                        <button onClick={generateFlashcards} className="btn-primary px-8 py-3 rounded-xl shadow-lg flex items-center gap-2">
                            <Sparkles size={18} /> Generar Flashcards
                        </button>
                    </div>
                )}

                {isLoadingCards && (
                    <div className="py-20 flex flex-col items-center">
                        <Loader2 size={40} className="animate-spin text-[var(--accent)] mb-4" />
                        <p className="text-[var(--text-secondary)] font-medium">La IA está leyendo tus apuntes...</p>
                    </div>
                )}

                {flashcards.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                             <h4 className="font-bold text-[var(--text-primary)]">Tarjetas de Repaso</h4>
                             <button onClick={generateFlashcards} className="text-xs text-[var(--accent)] hover:underline font-bold flex items-center gap-1"><RotateCcw size={12}/> Regenerar</button>
                        </div>
                        <div className="grid gap-4">
                            {flashcards.map((card, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setFlippedCard(flippedCard === idx ? null : idx)}
                                    className="cursor-pointer perspective-1000 group h-32"
                                >
                                    <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${flippedCard === idx ? 'rotate-y-180' : ''}`}>
                                        {/* Front */}
                                        <div className="absolute inset-0 backface-hidden card-modern flex items-center justify-center p-6 text-center border-l-4 border-[var(--accent)] bg-[var(--bg-card)]">
                                            <p className="font-bold text-[var(--text-primary)] text-sm">{card.q}</p>
                                            <span className="absolute bottom-2 right-2 text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-widest">Pregunta</span>
                                        </div>
                                        {/* Back */}
                                        <div className="absolute inset-0 backface-hidden rotate-y-180 card-modern flex items-center justify-center p-6 text-center border-l-4 border-[var(--success)] bg-[var(--bg-input)]">
                                            <p className="font-medium text-[var(--text-primary)] text-sm">{card.a}</p>
                                            <span className="absolute bottom-2 right-2 text-[10px] text-[var(--success)] uppercase font-bold tracking-widest">Respuesta</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-6">
              
              {/* Color Selection - NEW */}
              <div className="p-5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4 flex items-center gap-2"><Palette size={14}/> Color de Identificación</label>
                  <div className="flex gap-4">
                    {[
                      { id: 'cortex', bg: '#06B6D4' },
                      { id: 'emerald', bg: '#10B981' },
                      { id: 'royal', bg: '#8B5CF6' },
                      { id: 'rose', bg: '#F43F5E' },
                      { id: 'amber', bg: '#F59E0B' }
                    ].map((color) => (
                       <button
                         key={color.id}
                         onClick={() => setLocalCourse({...localCourse, color: color.id})}
                         className={`w-12 h-12 rounded-full transition-all border-2 ${localCourse.color === color.id ? 'scale-110 border-[var(--text-primary)] shadow-lg' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}
                         style={{ backgroundColor: color.bg }}
                         title={color.id}
                       />
                    ))}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Semestre</label>
                  <select className="w-full input-glass" value={localCourse.semester} onChange={e => setLocalCourse({ ...localCourse, semester: parseInt(e.target.value) })}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => <option key={s} value={s}>Semestre {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Modalidad</label>
                  <select className="w-full input-glass" value={localCourse.modality} onChange={e => setLocalCourse({ ...localCourse, modality: e.target.value as any })}>
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Ubicación / Link</label><input className="w-full input-glass" value={localCourse.location} onChange={e => setLocalCourse({ ...localCourse, location: e.target.value })} /></div>
              <div><label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Profesor</label><input className="w-full input-glass" value={localCourse.professor} onChange={e => setLocalCourse({ ...localCourse, professor: e.target.value })} /></div>
              
              <div className="pt-6 mt-8 border-t border-[var(--border-color)]">
                <button onClick={() => onDelete(localCourse.id)} className="w-full py-3.5 flex items-center justify-center gap-2 text-[var(--danger)] border border-[var(--danger)] bg-rose-500/5 rounded-xl hover:bg-[var(--danger)] hover:text-white transition-all font-bold text-sm">
                  <Trash2 size={18} /> Eliminar Materia
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-input)]/30 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Cancelar</button>
          <button onClick={handleSave} className="bg-[var(--text-primary)] text-[var(--bg-main)] px-8 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-colors shadow-lg">Guardar</button>
        </div>
      </div>
    </div>
  );
};

// Helper for RotateCcw
function RotateCcw({ size, className }: { size?: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
        </svg>
    );
}
