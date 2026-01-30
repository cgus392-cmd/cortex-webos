
import React, { useState, useEffect } from 'react';

type Mood = 'ecstatic' | 'happy' | 'worried' | 'critical';

interface CortexAvatarProps {
    mood: Mood;
    size?: number; // size in px
}

export const CortexAvatar: React.FC<CortexAvatarProps> = ({ mood, size = 80 }) => {
    const [isBouncing, setIsBouncing] = useState(false);
    const [blink, setBlink] = useState(false);

    // Parpadeo aleatorio para dar vida
    useEffect(() => {
        const blinkLoop = setInterval(() => {
            if (Math.random() > 0.7) {
                setBlink(true);
                setTimeout(() => setBlink(false), 150);
            }
        }, 3000);
        return () => clearInterval(blinkLoop);
    }, []);

    const handleInteract = () => {
        setIsBouncing(true);
        // Play sound effect here if desired
        setTimeout(() => setIsBouncing(false), 600);
    };

    // --- CONFIGURACIÓN DE ESTILOS 3D AVANZADOS ---
    const styles = {
        ecstatic: {
            // Samsung Blue/Cyan Gradient
            bg: 'bg-gradient-to-br from-[#00c6ff] to-[#0072ff]',
            shadow: 'shadow-[0_20px_50px_-12px_rgba(0,198,255,0.5)]',
            faceColor: 'white'
        },
        happy: {
            // Samsung Green (Minty)
            bg: 'bg-gradient-to-br from-[#42e695] to-[#3bb2b8]',
            shadow: 'shadow-[0_20px_50px_-12px_rgba(66,230,149,0.5)]',
            faceColor: 'white'
        },
        worried: {
            // Soft Amber/Orange
            bg: 'bg-gradient-to-br from-[#f7971e] to-[#ffd200]',
            shadow: 'shadow-[0_20px_50px_-12px_rgba(247,151,30,0.5)]',
            faceColor: 'white'
        },
        critical: {
            // Soft Red/Rose
            bg: 'bg-gradient-to-br from-[#ff512f] to-[#dd2476]',
            shadow: 'shadow-[0_20px_50px_-12px_rgba(255,81,47,0.5)]',
            faceColor: 'white'
        }
    };

    const current = styles[mood];

    return (
        <div 
            className="relative select-none"
            style={{ width: size, height: size }}
            onClick={handleInteract}
        >
            {/* 1. LA ESFERA PRINCIPAL (BODY) */}
            <div 
                className={`
                    w-full h-full rounded-full 
                    ${current.bg} ${current.shadow}
                    relative cursor-pointer
                    transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
                    ${isBouncing ? 'scale-90 rotate-6' : 'hover:scale-105 hover:-translate-y-2'}
                    animate-float-subtle
                `}
                style={{
                    // Advanced lighting for plastic/glass look
                    boxShadow: `
                        inset 4px 4px 15px rgba(255,255,255,0.4), 
                        inset -8px -8px 20px rgba(0,0,0,0.1),
                        0 10px 20px rgba(0,0,0,0.15)
                    `
                }}
            >
                {/* 2. SPECULAR HIGHLIGHT (Brillo Superior) */}
                <div className="absolute top-[10%] left-[15%] w-[40%] h-[25%] bg-gradient-to-b from-white to-transparent opacity-40 rounded-full blur-[2px] pointer-events-none transform -rotate-12"></div>
                
                {/* 3. RIM LIGHT (Luz de borde inferior) */}
                <div className="absolute bottom-[5%] right-[10%] w-[60%] h-[30%] bg-gradient-to-t from-white to-transparent opacity-20 rounded-full blur-[8px] pointer-events-none"></div>

                {/* 4. LA CARA (SVG en Grid 100x100 para precisión) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg 
                        width="60%" 
                        height="60%" 
                        viewBox="0 0 100 100" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.1))' }} // Sombra sutil a los rasgos
                    >
                        {/* --- EXPRESIONES --- */}
                        
                        {/* ECSTATIC (🤩) */}
                        {mood === 'ecstatic' && (
                            <>
                                {/* Ojos (Estrellas Suavizadas) */}
                                <path 
                                    d="M25 40 Q30 35 35 40 Q30 45 25 40 M25 40 Q20 45 25 50 Q30 45 25 40" 
                                    fill={current.faceColor} stroke={current.faceColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                />
                                <path 
                                    d="M75 40 Q80 35 85 40 Q80 45 75 40 M75 40 Q70 45 75 50 Q80 45 75 40" 
                                    fill={current.faceColor} stroke={current.faceColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                />
                                {/* Boca (Sonrisa muy amplia) */}
                                <path d="M 20 60 Q 50 85 80 60" stroke={current.faceColor} strokeWidth="6" strokeLinecap="round" />
                                {/* Mejillas */}
                                <circle cx="15" cy="55" r="4" fill="#FF9A9E" opacity="0.8" />
                                <circle cx="85" cy="55" r="4" fill="#FF9A9E" opacity="0.8" />
                            </>
                        )}

                        {/* HAPPY (🙂) */}
                        {mood === 'happy' && (
                            <>
                                {/* Ojos (Puntos separados - Escala en Y para parpadeo) */}
                                <ellipse cx="30" cy="42" rx="5" ry={blink ? 0.5 : 6} fill={current.faceColor} className="transition-all duration-100" />
                                <ellipse cx="70" cy="42" rx="5" ry={blink ? 0.5 : 6} fill={current.faceColor} className="transition-all duration-100" />
                                
                                {/* Boca (Sonrisa suave y centrada) */}
                                <path d="M 32 65 Q 50 75 68 65" stroke={current.faceColor} strokeWidth="6" strokeLinecap="round" />
                            </>
                        )}

                        {/* WORRIED (🫤) */}
                        {mood === 'worried' && (
                            <>
                                {/* Ojos (Círculos grandes preocupados) */}
                                <circle cx="30" cy="40" r="7" fill={current.faceColor} />
                                <circle cx="70" cy="40" r="7" fill={current.faceColor} />
                                {/* Cejas */}
                                <path d="M 22 30 Q 30 25 38 30" stroke={current.faceColor} strokeWidth="3" strokeLinecap="round" />
                                <path d="M 62 30 Q 70 25 78 30" stroke={current.faceColor} strokeWidth="3" strokeLinecap="round" />
                                {/* Boca (Línea ondulada/recta) */}
                                <path d="M 35 70 Q 50 65 65 70" stroke={current.faceColor} strokeWidth="5" strokeLinecap="round" />
                                {/* Gota de sudor */}
                                <path d="M 85 30 Q 90 40 85 50 Q 80 40 85 30" fill="white" fillOpacity="0.6" />
                            </>
                        )}

                        {/* CRITICAL (😵) */}
                        {mood === 'critical' && (
                            <>
                                {/* Ojos (X) */}
                                <path d="M 22 35 L 38 51" stroke={current.faceColor} strokeWidth="5" strokeLinecap="round" />
                                <path d="M 38 35 L 22 51" stroke={current.faceColor} strokeWidth="5" strokeLinecap="round" />
                                
                                <path d="M 62 35 L 78 51" stroke={current.faceColor} strokeWidth="5" strokeLinecap="round" />
                                <path d="M 78 35 L 62 51" stroke={current.faceColor} strokeWidth="5" strokeLinecap="round" />
                                
                                {/* Boca (Ondulada triste) */}
                                <path d="M 30 75 Q 40 65 50 75 Q 60 85 70 75" stroke={current.faceColor} strokeWidth="5" strokeLinecap="round" fill="none" />
                            </>
                        )}
                    </svg>
                </div>
            </div>

            {/* Tooltip flotante al interactuar */}
            {isBouncing && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-3 py-1 rounded-xl shadow-lg border border-white/50 text-xs font-bold text-slate-700 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                    {mood === 'ecstatic' ? '¡Imparable! 🚀' : mood === 'happy' ? '¡Todo en orden! 👍' : mood === 'worried' ? 'Revisemos Cronos... 🧐' : '¡Emergencia! 🚨'}
                </div>
            )}
        </div>
    );
};
