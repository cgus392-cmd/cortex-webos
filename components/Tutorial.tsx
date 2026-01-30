
import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Target, LayoutDashboard, ListTodo, Library, Settings, Sparkles, Brain } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const slides = [
  {
    title: "Bienvenido a Cortex WebOS",
    desc: "Tu sistema operativo académico centralizado. Aquí tienes una guía rápida de tus herramientas.",
    icon: Brain,
    color: "bg-blue-500"
  },
  {
    title: "Dashboard",
    desc: "Tu centro de mando. Visualiza tu rendimiento gráfico, notas rápidas (Memos) y tus materias activas en un solo vistazo.",
    icon: LayoutDashboard,
    color: "bg-cyan-500"
  },
  {
    title: "Cronos",
    desc: "Gestión de tiempo profesional. Usa el Tablero Kanban para organizar tareas, el Calendario para fechas de entrega y el Modo Focus para estudiar sin distracciones.",
    icon: ListTodo,
    color: "bg-emerald-500"
  },
  {
    title: "Materias",
    desc: "Administra tu malla curricular. Agrega asignaturas, define cortes, porcentajes y lleva un control detallado de cada nota.",
    icon: Library,
    color: "bg-rose-500"
  },
  {
    title: "El Oráculo",
    desc: "Tu estratega matemático. Selecciona una materia y el Oráculo calculará exactamente cuánto necesitas sacar en los cortes restantes para lograr distintas metas (3.0, 4.0, 4.5, 5.0).",
    icon: Target,
    color: "bg-violet-500"
  },
  {
    title: "Cortex AI",
    desc: "Tu copiloto inteligente. Haz preguntas, sube fotos de problemas matemáticos o pídele que cree materias automáticamente.",
    icon: Sparkles,
    color: "bg-amber-500"
  }
];

export const TutorialModal: React.FC<Props> = ({ onClose }) => {
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
    else onClose();
  };

  const handlePrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const SlideIcon = slides[current].icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-enter">
      <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] shadow-2xl overflow-hidden relative flex flex-col min-h-[500px]">
        
        {/* Header Image Area */}
        <div className={`h-40 ${slides[current].color} relative flex items-center justify-center transition-colors duration-500`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-xl relative z-10 anim-float">
            <SlideIcon size={40} />
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors"><X size={16}/></button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 flex flex-col text-center items-center">
           <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{slides[current].title}</h2>
           <p className="text-[var(--text-secondary)] leading-relaxed text-sm mb-6 max-w-sm">
             {slides[current].desc}
           </p>

           {/* Dots */}
           <div className="flex gap-2 mt-auto mb-8">
             {slides.map((_, idx) => (
               <div key={idx} className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === current ? `w-6 ${slides[current].color.replace('bg-', 'bg-')}` : 'bg-[var(--border-color)]'}`}></div>
             ))}
           </div>

           {/* Controls */}
           <div className="flex w-full gap-4">
             <button 
                onClick={handlePrev} 
                className={`flex-1 py-3 rounded-xl font-bold text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)] transition-all ${current === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
             >
               Atrás
             </button>
             <button 
                onClick={handleNext} 
                className="flex-[2] py-3 rounded-xl font-bold text-sm bg-[var(--text-primary)] text-[var(--bg-main)] hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
             >
               {current === slides.length - 1 ? '¡Empezar!' : 'Siguiente'} {current !== slides.length - 1 && <ChevronRight size={16}/>}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};
