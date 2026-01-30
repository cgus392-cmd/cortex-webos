
import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Loader2, ArrowRight, Lock, CalendarPlus, X, Globe, Wifi, WifiOff } from 'lucide-react';
import { researchUniversity, checkAiConnection } from '../services/gemini';
import { Task } from '../types';

interface Props {
  university: string;
  logoUrl?: string;
  onClose: () => void;
  onImportTasks: (tasks: Task[]) => void;
}

export const UniversityBrowser: React.FC<Props> = ({ university, logoUrl, onClose, onImportTasks }) => {
  const [messages, setMessages] = useState<{role: 'ai'|'user', text: string}[]>([
    {role: 'ai', text: `Conectado a la red de ${university}. ¿Qué deseas investigar? (Ej: Calendario, Admisiones, Costos)`}
  ]);
  const [input, setInput] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [discoveredTasks, setDiscoveredTasks] = useState<Task[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check connection on mount
  useEffect(() => {
      const initHandshake = async () => {
          setConnectionStatus('checking');
          const isConnected = await checkAiConnection();
          setConnectionStatus(isConnected ? 'connected' : 'error');
      };
      initHandshake();
  }, []);

  useEffect(() => {
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!input.trim() || connectionStatus !== 'connected') return;
    
    const query = input;
    setMessages(prev => [...prev, {role: 'user', text: query}]);
    setInput('');
    setIsResearching(true);

    const result = await researchUniversity(university, query);
    
    setMessages(prev => [...prev, {role: 'ai', text: result.text}]);
    
    if (result.foundDates && result.foundDates.length > 0) {
        const newTasks: Task[] = result.foundDates.map(d => ({
            id: Date.now() + Math.random(),
            text: d.text,
            date: d.date,
            done: false
        }));
        setDiscoveredTasks(prev => [...prev, ...newTasks]);
        onImportTasks(newTasks); // Auto-import or stage them
        setMessages(prev => [...prev, {
            role: 'ai', 
            text: `📅 ¡He encontrado ${newTasks.length} fechas! Las he sincronizado con tu módulo Cronos automáticamente.`
        }]);
    }

    setIsResearching(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md anim-enter">
      <div className="w-full max-w-4xl bg-[var(--bg-main)] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-[var(--border-color)]">
        
        {/* Browser Toolbar */}
        <div className="h-14 bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-color)] flex items-center px-4 gap-4 sticky top-0 z-10 select-none">
          {/* Mac-style Window Controls */}
          <div className="flex gap-2 group/controls">
            <div 
                onClick={onClose} 
                className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] cursor-pointer flex items-center justify-center shadow-sm active:scale-90 transition-transform group/close"
                title="Cerrar"
            >
                <X size={8} className="text-black/50 opacity-0 group-hover/controls:opacity-100 transition-opacity stroke-[3px]" />
            </div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-sm"></div>
          </div>

          {/* Address Bar */}
          <div className="flex-1 bg-[var(--bg-input)] rounded-lg h-9 flex items-center px-3 gap-2 text-sm text-[var(--text-secondary)] border border-transparent focus-within:border-[var(--accent)] transition-all">
            <Lock size={12} className="text-[var(--success)]"/>
            <span className="flex-1 truncate font-mono opacity-70 cursor-text selection:bg-[var(--accent)] selection:text-white">
                cortex://research/{university.toLowerCase().replace(/\s/g, '-')}
            </span>
            
            {/* STATUS INDICATOR IN BAR */}
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-color)]">
                {isResearching ? (
                    <Loader2 size={12} className="animate-spin text-[var(--accent)]"/>
                ) : connectionStatus === 'checking' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-secondary)]"><Loader2 size={10} className="animate-spin"/> Connecting...</span>
                ) : connectionStatus === 'error' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--danger)]"><WifiOff size={10}/> Offline</span>
                ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--success)]"><Wifi size={10}/> Secure</span>
                )}
            </div>
          </div>

          {/* Explicit Close Button (Right) */}
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors"
            title="Cerrar Navegador"
          >
             <X size={20} />
          </button>
        </div>

        {/* Browser Content */}
        <div className="flex-1 relative overflow-hidden flex">
          {/* Background Watermark */}
          <div className="absolute inset-0 bg-white dark:bg-slate-900 flex items-center justify-center opacity-10 pointer-events-none">
             {logoUrl ? <img src={logoUrl} className="w-64 h-64 opacity-20 grayscale" /> : <Globe size={128} className="opacity-10"/>}
          </div>

          <div className="flex-1 flex flex-col z-10 p-6 max-w-3xl mx-auto w-full">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar" ref={scrollRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} anim-enter`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--text-primary)] text-[var(--bg-main)]'}`}>
                      {msg.role === 'ai' ? <Bot size={16}/> : <User size={16} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'ai' ? 'bg-[var(--bg-card)] border border-[var(--border-color)]' : 'bg-[var(--text-primary)] text-[var(--bg-main)]'}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {isResearching && (
                <div className="flex justify-start anim-enter">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center"><Bot size={16}/></div>
                    <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
                      <Loader2 size={14} className="animate-spin text-[var(--accent)]"/>
                      Analizando sitio web oficial...
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              {discoveredTasks.length > 0 && (
                <div className="mb-3 p-2 bg-[var(--success)]/10 border border-[var(--success)] rounded-lg text-xs text-[var(--success)] font-bold flex items-center gap-2 justify-center">
                  <CalendarPlus size={14}/> {discoveredTasks.length} eventos sincronizados con Cronos
                </div>
              )}
              <form onSubmit={handleSubmit} className="relative">
                <input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={connectionStatus === 'connected' ? "Pregunta sobre fechas, pensum, costos..." : "Esperando conexión..."}
                  className="w-full pl-5 pr-14 py-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent)] shadow-lg backdrop-blur-xl outline-none transition-all disabled:opacity-50"
                  autoFocus
                  disabled={connectionStatus !== 'connected'}
                />
                <button type="submit" disabled={isResearching || !input || connectionStatus !== 'connected'} className="absolute right-2 top-2 p-2 bg-[var(--accent)] hover:brightness-110 text-white rounded-lg transition-all disabled:opacity-50">
                  <ArrowRight size={20} />
                </button>
              </form>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {["Calendario Académico", "Pensum de mi carrera", "Costos de matrícula", "Fechas de parciales"].map(s => (
                  <button key={s} onClick={() => setInput(s)} disabled={connectionStatus !== 'connected'} className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-xs hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
