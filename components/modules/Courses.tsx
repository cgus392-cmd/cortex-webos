
import React, { useState } from 'react';
import { Course } from '../../types';
import { Library, Calculator, Award, Plus, MoreHorizontal, History } from 'lucide-react';

export const CoursesModule: React.FC<{ 
    allCourses: Course[]; 
    currentSemester: number;
    setShowAddModal: (b: boolean, sem?: number) => void;
    setEditingCourse: (c: Course) => void;
    userMinGrade: number;
}> = ({ allCourses, currentSemester, setShowAddModal, setEditingCourse, userMinGrade }) => {
    
    const [selectedSemester, setSelectedSemester] = useState<number>(currentSemester);
    const semesters = Array.from({length: 12}, (_, i) => i + 1);
    const visibleCourses = allCourses.filter(c => c.semester === selectedSemester);
    const semAvg = visibleCourses.length > 0 
        ? (visibleCourses.reduce((acc, c) => acc + (parseFloat(c.average)||0), 0) / visibleCourses.length).toFixed(2) 
        : "0.0";
    const totalCredits = visibleCourses.reduce((acc, c) => acc + (c.credits || 0), 0);
    const activeCoursesAll = allCourses.filter(c => parseFloat(c.average) > 0);
    const globalAverage = activeCoursesAll.length > 0 
        ? (activeCoursesAll.reduce((acc, c) => acc + parseFloat(c.average), 0) / activeCoursesAll.length).toFixed(2) 
        : "0.0";

    return (
        <div className="max-w-7xl mx-auto anim-enter flex flex-col md:flex-row gap-6 h-full pb-10">
            <div className="w-full md:w-60 flex-shrink-0">
                <div className="card-modern p-4 sticky top-6 h-full max-h-[85vh] flex flex-col">
                    <div className="mb-4 px-2">
                        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 mb-1"><Library size={20} className="text-[var(--accent)]"/> Asignaturas</h2>
                        <p className="text-xs text-[var(--text-secondary)]">Gestión Académica</p>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                         {semesters.map(sem => (
                             <button key={sem} onClick={() => setSelectedSemester(sem)} className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${selectedSemester === sem ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]'}`}>
                                <span>Semestre {sem}</span>
                                {sem === currentSemester && <div className={`w-2 h-2 rounded-full ${selectedSemester === sem ? 'bg-white' : 'bg-[var(--accent)]'} animate-pulse`} />}
                             </button>
                         ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                         <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-color)]">
                            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Promedio Global (PGA)</p>
                            <p className="text-2xl font-mono font-black text-[var(--text-primary)]">{globalAverage}</p>
                         </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="card-modern p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--bg-input)] rounded-xl flex items-center justify-center text-[var(--text-primary)] border border-[var(--border-color)]">
                            <span className="font-mono font-bold text-xl">{selectedSemester}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Semestre {selectedSemester}</h3>
                            <div className="flex items-center gap-3 text-xs font-bold text-[var(--text-secondary)]">
                                <span className="flex items-center gap-1"><Calculator size={12}/> Promedio Semestral: <span className="text-[var(--text-primary)]">{semAvg}</span></span>
                                <span className="w-1 h-1 bg-[var(--border-color)] rounded-full"/>
                                <span className="flex items-center gap-1"><Award size={12}/> Créditos: <span className="text-[var(--text-primary)]">{totalCredits}</span></span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setShowAddModal(true, selectedSemester)} className="btn-primary px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                        <Plus size={18} /> Nueva Materia
                    </button>
                </div>
                {visibleCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
                        {visibleCourses.map(c => {
                             const isPassing = parseFloat(c.average) >= userMinGrade;
                             return (
                                <div key={c.id} onClick={() => setEditingCourse(c)} className="card-modern p-5 cursor-pointer group hover:scale-[1.02] transition-transform relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${isPassing ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`}></div>
                                    <div className="flex justify-between items-start mb-3 pl-3">
                                        <div className="px-2 py-0.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] font-bold text-[var(--text-secondary)] uppercase">{c.code || "---"}</div>
                                        <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><MoreHorizontal size={18}/></button>
                                    </div>
                                    <div className="pl-3 mb-4 h-14">
                                        <h4 className="font-bold text-[var(--text-primary)] leading-tight line-clamp-2">{c.name}</h4>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1">{c.credits} Créditos</p>
                                    </div>
                                    <div className="pl-3 pt-3 border-t border-[var(--border-color)] flex justify-between items-center">
                                        <span className="text-xs text-[var(--text-secondary)] font-medium">{c.cuts.length} Cortes</span>
                                        <span className={`font-mono font-bold text-lg ${isPassing ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>{c.average}</span>
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-3xl min-h-[300px] bg-[var(--bg-input)]/30">
                        <div className="w-16 h-16 bg-[var(--bg-input)] rounded-full flex items-center justify-center mb-4"><History size={24} className="opacity-50"/></div>
                        <p className="font-bold mb-2">Semestre Vacío</p>
                        <p className="text-sm max-w-xs text-center mb-6">No hay asignaturas registradas para el Semestre {selectedSemester}.</p>
                        <button onClick={() => setShowAddModal(true, selectedSemester)} className="text-[var(--accent)] text-sm font-bold hover:underline flex items-center gap-2"><Plus size={16}/> Agregar Asignatura</button>
                    </div>
                )}
            </div>
        </div>
    );
};
