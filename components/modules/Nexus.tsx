import React, { useState, useEffect, useRef } from 'react';
import { NexusDocument, User } from '../../types';
import { Database, Plus, Search, FileText, ArrowRight, Trash2, Bot, Sparkles, BrainCircuit, ScanLine, X, FileEdit, HelpCircle, Lock, ShieldAlert, CheckCircle2, Trophy } from 'lucide-react';
import { interactWithDocument } from '../../services/gemini';
// @ts-ignore
import ReactMarkdown from 'react-markdown';

export const NexusModule: React.FC<{ user: User }> = ({ user }) => {
    // --- GAMIFICATION STATE ---
    const isUnlocked = user.completedAchievements.includes('pro_user');
    
    // STATE
    const [docs, setDocs] = useState<NexusDocument[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    
    // Editor State
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    // Chat/Neural State
    const [mode, setMode] = useState<'source' | 'neural'>('source');
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- EFFECTS ---
    useEffect(() => {
        const stored = localStorage.getItem('ctx_nexus_docs');
        if (stored) {
            try {
                setDocs(JSON.parse(stored));
            } catch (e) { console.error("Nexus load error", e); }
        }
        
        // Auto-show help on first unlock
        if (isUnlocked && !localStorage.getItem('ctx_nexus_seen_intro')) {
            setShowHelp(true);
            localStorage.setItem('ctx_nexus_seen_intro', 'true');
        }
    }, [isUnlocked]);

    useEffect(() => {
        if (docs.length > 0) {
            localStorage.setItem('ctx_nexus_docs', JSON.stringify(docs));
        }
    }, [docs]);

    useEffect(() => {
        if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isThinking, mode]);

    // --- HANDLERS ---
    const handleSaveDoc = () => {
        if (!newTitle.trim() || !newContent.trim()) return;
        const newDoc: NexusDocument = {
            id: Date.now().toString(),
            title: newTitle,
            content: newContent,
            type: 'text',
            createdAt: new Date().toISOString()
        };
        setDocs(prev => [newDoc, ...prev]);
        setNewTitle('');
        setNewContent('');
        setIsCreating(false);
        setSelectedDocId(newDoc.id);
        setMode('source');
    };

    const handleDeleteDoc = (id: string) => {
        if(confirm("¿Eliminar este nodo de conocimiento?")) {
            setDocs(prev => prev.filter(d => d.id !== id));
            if (selectedDocId === id) setSelectedDocId(null);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !selectedDoc) return;
        const query = chatInput;
        setChatInput('');
        setChatHistory(prev => [...prev, {role: 'user', text: query}]);
        setIsThinking(true);

        const response = await interactWithDocument(selectedDoc.content, chatHistory, query, 'flash');
        
        setChatHistory(prev => [...prev, {role: 'model', text: response}]);
        setIsThinking(false);
    };

    const handleQuickAction = (action: 'summarize' | 'quiz' | 'concepts') => {
        let prompt = "";
        switch(action) {
            case 'summarize': prompt = "Haz un resumen ejecutivo de este documento en 3 puntos clave."; break;
            case 'quiz': prompt = "Genérame 3 preguntas de opción múltiple (con la respuesta correcta oculta al final) para evaluar mi comprensión de este texto."; break;
            case 'concepts': prompt = "Extrae los 5 conceptos o definiciones más importantes de este texto en una lista."; break;
        }
        setChatInput(prompt);
        setChatHistory(prev => [...prev, {role: 'user', text: prompt}]);
        setIsThinking(true);
        interactWithDocument(selectedDoc!.content, chatHistory, prompt, 'flash').then(res => {
            setChatHistory(prev => [...prev, {role: 'model', text: res}]);
            setIsThinking(false);
        });
    };

    const filteredDocs = docs.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const selectedDoc = docs.find(d => d.id === selectedDocId);

    // --- RENDER: LOCKED SCREEN ---
    if (!isUnlocked) {
        return (
            <div className="h-full flex items-center justify-center anim-enter p-6">
                <div className="max-w-lg w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--danger)] to-transparent opacity-50"></div>

                    <div className="w-24 h-24 bg-[var(--bg-input)] rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        <Lock size={48} className="text-[var(--text-secondary)]"/>
                        <div className="absolute -bottom-2 -right-2 bg-[var(--danger)] text-white p-2 rounded-full shadow-lg">
                            <ShieldAlert size={20}/>
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2 tracking-tight">ACCESO DENEGADO</h2>
                    <p className="text-[var(--text-secondary)] font-mono text-sm mb-8 uppercase tracking-widest">Nivel de autorización insuficiente</p>

                    <div className="bg-[var(--bg-input)] p-6 rounded-2xl border border-[var(--border-color)] mb-8 text-left">
                        <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                            <Trophy size={18} className="text-[var(--accent)]"/> Requisitos de Desbloqueo
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-[var(--success)]/20 text-[var(--success)] flex items-center justify-center"><CheckCircle2 size={12}/></div>
                                <span className="text-sm text-[var(--text-primary)] line-through opacity-50">Registrar cuenta</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-[var(--border-color)] text-[var(--text-secondary)] flex items-center justify-center"><div className="w-2 h-2 bg-current rounded-full"></div></div>
                                <span className="text-sm text-[var(--text-primary)] font-bold">Logro: "Estudiante Pro"</span>
                            </div>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-4 pt-4 border-t border-[var(--border-color)]">
                            <span className="font-bold text-[var(--accent)]">Tip:</span> Completa 10 tareas en Cronos y mantén un promedio mayor a 3.5 para obtener acceso a NEXUS.
                        </p>
                    </div>

                    <button disabled className="w-full py-4 bg-[var(--bg-input)] text-[var(--text-secondary)] font-bold rounded-xl cursor-not-allowed opacity-50 flex items-center justify-center gap-2">
                        <Lock size={16}/> Sistema Bloqueado
                    </button>
                </div>
            </div>
        );
    }

    // --- RENDER: MAIN INTERFACE ---
    return (
        <div className="max-w-7xl mx-auto anim-enter h-full flex flex-col md:flex-row gap-6 pb-4 overflow-hidden" style={{maxHeight: 'calc(100vh - 120px)'}}>
            
            {/* --- SIDEBAR: KNOWLEDGE GRAPH (LIST) --- */}
            <div className="w-full md:w-80 flex flex-col card-modern border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden flex-shrink-0 h-[600px] md:h-auto">
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-input)]/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-[var(--accent)]">
                            <Database size={20} />
                            <h2 className="font-bold text-lg text-[var(--text-primary)]">Nexus</h2>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowHelp(true)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title="Ayuda / Tutorial">
                                <HelpCircle size={18}/>
                            </button>
                            <button onClick={() => { setIsCreating(true); setSelectedDocId(null); }} className="p-2 bg-[var(--accent)] text-white rounded-lg hover:brightness-110 shadow-md transition-all">
                                <Plus size={18}/>
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-3 text-[var(--text-secondary)]" />
                        <input 
                            placeholder="Filtrar nodos..." 
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-bold focus:border-[var(--accent)] outline-none"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {isCreating && (
                        <div className="p-3 rounded-xl border border-[var(--accent)] bg-[var(--bg-input)] animate-in slide-in-from-left-2">
                            <input 
                                autoFocus
                                placeholder="Título del Nodo" 
                                className="w-full bg-transparent font-bold text-sm mb-2 outline-none"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                            />
                            <textarea 
                                placeholder="Pega aquí tu texto, apuntes o contenido..." 
                                className="w-full bg-transparent text-xs text-[var(--text-secondary)] outline-none resize-none h-20 mb-2"
                                value={newContent}
                                onChange={e => setNewContent(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsCreating(false)} className="px-3 py-1 text-xs font-bold text-[var(--text-secondary)]">Cancelar</button>
                                <button onClick={handleSaveDoc} className="px-3 py-1 bg-[var(--accent)] text-white rounded-lg text-xs font-bold shadow-sm">Guardar</button>
                            </div>
                        </div>
                    )}

                    {filteredDocs.map(doc => (
                        <div 
                            key={doc.id}
                            onClick={() => { setSelectedDocId(doc.id); setChatHistory([]); setIsCreating(false); }}
                            className={`p-3 rounded-xl cursor-pointer border transition-all group relative ${selectedDocId === doc.id ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-transparent border-transparent hover:bg-[var(--bg-input)] hover:border-[var(--border-color)]'}`}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <div className={`p-2 rounded-lg ${selectedDocId === doc.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'}`}>
                                    <FileText size={16}/>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className={`font-bold text-sm truncate ${selectedDocId === doc.id ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>{doc.title}</h4>
                                    <p className="text-[10px] text-[var(--text-secondary)] truncate">{new Date(doc.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id); }}
                                className="absolute right-2 top-3 p-1.5 text-[var(--text-secondary)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    ))}
                    
                    {filteredDocs.length === 0 && !isCreating && (
                        <div className="text-center py-10 text-[var(--text-secondary)] opacity-50">
                            <BrainCircuit size={32} className="mx-auto mb-2"/>
                            <p className="text-xs">Sin nodos de datos.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MAIN AREA: VIEWER / NEURAL LINK --- */}
            <div className="flex-1 flex flex-col card-modern border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden relative h-[600px] md:h-auto">
                {selectedDoc ? (
                    <>
                        {/* Header */}
                        <div className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-6 bg-[var(--bg-input)]/30 backdrop-blur-md z-20">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold text-[var(--text-primary)]">{selectedDoc.title}</h2>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)]">TEXT</span>
                            </div>
                            
                            <div className="flex bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)]">
                                <button onClick={() => setMode('source')} className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${mode === 'source' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                                    <FileEdit size={14}/> Fuente
                                </button>
                                <button onClick={() => setMode('neural')} className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${mode === 'neural' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                                    <Sparkles size={14}/> Enlace Neuronal
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 relative overflow-hidden">
                            {/* SOURCE VIEW */}
                            <div className={`absolute inset-0 p-8 overflow-y-auto transition-opacity duration-300 ${mode === 'source' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                                <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
                                    <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-[var(--text-secondary)]">
                                        {selectedDoc.content}
                                    </div>
                                </div>
                            </div>

                            {/* NEURAL VIEW (CHAT) */}
                            <div className={`absolute inset-0 flex flex-col bg-[var(--bg-main)]/50 transition-opacity duration-300 ${mode === 'neural' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                                
                                {/* Chat Area */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {chatHistory.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                                            <div className="w-20 h-20 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mb-4 text-[var(--accent)] animate-pulse">
                                                <BrainCircuit size={40}/>
                                            </div>
                                            <h3 className="font-bold text-lg text-[var(--text-primary)]">Enlace Neuronal Establecido</h3>
                                            <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">La IA ha leído este documento. ¿Qué quieres saber?</p>
                                            <div className="flex flex-wrap justify-center gap-3">
                                                <button onClick={() => handleQuickAction('summarize')} className="px-4 py-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">Resumir</button>
                                                <button onClick={() => handleQuickAction('quiz')} className="px-4 py-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold hover:border-[var(--royal)] hover:text-[var(--royal)] transition-all">Crear Quiz</button>
                                                <button onClick={() => handleQuickAction('concepts')} className="px-4 py-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold hover:border-[var(--success)] hover:text-[var(--success)] transition-all">Extraer Conceptos</button>
                                            </div>
                                        </div>
                                    )}

                                    {chatHistory.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} anim-enter`}>
                                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[var(--accent)] text-white rounded-tr-none' : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-none'}`}>
                                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {isThinking && (
                                        <div className="flex justify-start">
                                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce delay-75"></div>
                                                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce delay-150"></div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)] relative z-20">
                                    <div className="relative flex items-center gap-2">
                                        <div className="absolute left-4 p-1.5 bg-[var(--accent)]/10 rounded text-[var(--accent)]">
                                            <Bot size={16}/>
                                        </div>
                                        <input 
                                            placeholder="Pregunta sobre este documento..." 
                                            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent)] outline-none shadow-inner"
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                        />
                                        <button 
                                            onClick={handleSendMessage}
                                            disabled={!chatInput.trim() || isThinking}
                                            className="absolute right-2 p-2 bg-[var(--text-primary)] text-[var(--bg-main)] rounded-lg hover:opacity-80 disabled:opacity-50 transition-all"
                                        >
                                            <ArrowRight size={18}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-40">
                        <ScanLine size={64} strokeWidth={1} className="mb-4 text-[var(--accent)]"/>
                        <h2 className="text-xl font-bold mb-2">Nexus Offline</h2>
                        <p className="text-sm">Selecciona o crea un nodo de datos para iniciar el enlace.</p>
                    </div>
                )}
            </div>

            {/* --- HELP / INTRO MODAL --- */}
            {showHelp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-enter">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 max-w-lg w-full relative shadow-2xl overflow-hidden">
                        <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 p-2 hover:bg-[var(--bg-input)] rounded-full transition-colors"><X size={20}/></button>
                        
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 bg-[var(--accent)] text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[var(--accent)]/30 anim-float">
                                <Database size={32}/>
                            </div>
                            <h3 className="text-2xl font-bold text-[var(--text-primary)]">Bienvenido a NEXUS</h3>
                            <p className="text-[var(--text-secondary)] text-sm">Sistema de Gestión de Conocimiento Neural</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center font-bold text-[var(--text-secondary)] shrink-0 border border-[var(--border-color)]">1</div>
                                <div className="text-left">
                                    <h4 className="font-bold text-[var(--text-primary)] text-sm">Crea un Nodo</h4>
                                    <p className="text-xs text-[var(--text-secondary)]">Pulsa el botón <span className="inline-block p-0.5 bg-[var(--accent)] text-white rounded text-[10px]"><Plus size={10}/></span>. Copia y pega tus apuntes, PDFs convertidos o artículos.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center font-bold text-[var(--text-secondary)] shrink-0 border border-[var(--border-color)]">2</div>
                                <div className="text-left">
                                    <h4 className="font-bold text-[var(--text-primary)] text-sm">Conecta con la IA</h4>
                                    <p className="text-xs text-[var(--text-secondary)]">Selecciona el nodo. La IA leerá el contenido instantáneamente.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center font-bold text-[var(--text-secondary)] shrink-0 border border-[var(--border-color)]">3</div>
                                <div className="text-left">
                                    <h4 className="font-bold text-[var(--text-primary)] text-sm">Interroga tus Datos</h4>
                                    <p className="text-xs text-[var(--text-secondary)]">Pide resúmenes, quizzes o explicaciones. La IA solo usará la información de ese documento.</p>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setShowHelp(false)} className="mt-8 w-full py-3 bg-[var(--text-primary)] text-[var(--bg-main)] font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform">
                            Iniciar Sistema
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};