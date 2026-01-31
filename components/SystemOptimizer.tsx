
import React, { useEffect, useState, useRef } from 'react';
import { UserPreferences } from '../types';
import { Cpu, Zap, CheckCircle2, AlertTriangle, Gauge } from 'lucide-react';

interface Props {
    onComplete: (prefs: Partial<UserPreferences>) => void;
}

export const SystemOptimizer: React.FC<Props> = ({ onComplete }) => {
    const [phase, setPhase] = useState<'init' | 'analyzing' | 'result'>('init');
    const [fps, setFps] = useState(0);
    const [score, setScore] = useState(0);
    const [tier, setTier] = useState<'ultra' | 'balanced' | 'eco'>('balanced');
    const [progress, setProgress] = useState(0);
    
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const frameCountRef = useRef(0);

    useEffect(() => {
        // Start sequence
        const timer = setTimeout(() => {
            setPhase('analyzing');
            runBenchmark();
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const runBenchmark = () => {
        startTimeRef.current = performance.now();
        frameCountRef.current = 0;
        
        const loop = (time: number) => {
            frameCountRef.current++;
            const elapsed = time - (startTimeRef.current || time);
            
            // Visual Progress
            const prog = Math.min((elapsed / 2000) * 100, 100);
            setProgress(prog);

            if (elapsed < 2000) { // Run for 2 seconds
                // ARTIFICIAL LOAD: Force GPU/CPU calculation
                // We create a heavy loop to test device limits without freezing it completely
                for(let i=0; i<5000; i++) {
                    Math.sqrt(Math.random() * 10000);
                }
                requestRef.current = requestAnimationFrame(loop);
            } else {
                finishBenchmark(elapsed);
            }
        };
        requestRef.current = requestAnimationFrame(loop);
    };

    const finishBenchmark = (elapsed: number) => {
        const calculatedFps = Math.round((frameCountRef.current / elapsed) * 1000);
        setFps(calculatedFps);
        
        let resultTier: 'ultra' | 'balanced' | 'eco' = 'eco';
        let calcScore = 0;
        
        // Scoring Logic based on 60fps target
        if (calculatedFps >= 50) {
            resultTier = 'ultra';
            calcScore = Math.min(100, 90 + Math.round((calculatedFps - 50)/2));
        } else if (calculatedFps >= 30) {
            resultTier = 'balanced';
            calcScore = 70 + Math.round((calculatedFps - 30));
        } else {
            resultTier = 'eco';
            calcScore = Math.max(10, calculatedFps * 2);
        }

        setTier(resultTier);
        setScore(calcScore);
        setPhase('result');

        // Auto-close after showing result
        setTimeout(() => {
            const prefs = getPreferencesForTier(resultTier);
            onComplete(prefs);
        }, 3000);
    };

    const getPreferencesForTier = (t: string): Partial<UserPreferences> => {
        switch(t) {
            case 'ultra':
                return {
                    lowPowerMode: false,
                    glassStrength: 'high',
                    enableTexture: true,
                    nebulaIntensity: 0.3,
                    reducedMotion: false
                };
            case 'balanced':
                return {
                    lowPowerMode: false,
                    glassStrength: 'low',
                    enableTexture: false, // Texture is heavy on mobile
                    nebulaIntensity: 0.15,
                    reducedMotion: false
                };
            case 'eco':
            default:
                return {
                    lowPowerMode: true, // Kills backdrop-filter
                    glassStrength: 'none',
                    enableTexture: false,
                    nebulaIntensity: 0, // No animations
                    reducedMotion: true
                };
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)]">
            
            {/* Background Chaos for Stress Test */}
            {phase === 'analyzing' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
                    {Array.from({length: 20}).map((_, i) => (
                        <div key={i} className="absolute w-20 h-20 bg-[var(--accent)] rounded-full animate-ping" 
                             style={{
                                 top: `${Math.random()*100}%`, 
                                 left: `${Math.random()*100}%`, 
                                 animationDuration: `${0.5 + Math.random()}s`
                             }}
                        ></div>
                    ))}
                </div>
            )}

            <div className="max-w-sm w-full p-8 text-center relative z-10 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] shadow-2xl">
                
                {phase === 'init' && (
                    <div className="anim-enter py-10">
                        <Gauge size={48} className="mx-auto mb-4 text-[var(--text-secondary)] animate-pulse"/>
                        <h2 className="text-xl font-bold">Iniciando Diagnóstico</h2>
                    </div>
                )}

                {phase === 'analyzing' && (
                    <div className="anim-enter">
                        <div className="w-24 h-24 mx-auto mb-6 relative">
                            {/* Spinning Ring */}
                            <div className="absolute inset-0 rounded-full border-4 border-[var(--bg-input)]"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-[var(--accent)] animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-[var(--accent)] font-mono font-bold text-xl">
                                {Math.round(progress)}%
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Calibrando GPU</h2>
                        <p className="text-[var(--text-secondary)] mb-6 text-xs">Midiendo framerate y latencia para optimizar tu experiencia...</p>
                    </div>
                )}

                {phase === 'result' && (
                    <div className="anim-enter">
                        <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg transform transition-all scale-110 ${
                            tier === 'ultra' ? 'bg-violet-500 text-white' : 
                            tier === 'balanced' ? 'bg-emerald-500 text-white' : 
                            'bg-amber-500 text-white'
                        }`}>
                            {tier === 'ultra' ? <Zap size={36} fill="currentColor"/> : tier === 'balanced' ? <CheckCircle2 size={36}/> : <AlertTriangle size={36}/>}
                        </div>
                        
                        <div className="mb-6">
                            <span className="text-4xl font-black">{score}</span>
                            <span className="text-sm text-[var(--text-secondary)]">/100</span>
                        </div>

                        <h3 className="text-lg font-bold mb-1 uppercase tracking-wider">
                            MODO {tier === 'ultra' ? 'ULTRA' : tier === 'balanced' ? 'BALANCEADO' : 'ECO'}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mb-6">
                            {tier === 'ultra' ? 'Tu dispositivo vuela. Gráficos al máximo.' : 
                             tier === 'balanced' ? 'Rendimiento sólido. Efectos optimizados.' : 
                             'Priorizando velocidad sobre efectos visuales.'}
                        </p>

                        <div className="bg-[var(--bg-input)] rounded-xl p-3 border border-[var(--border-color)] flex justify-between items-center text-xs font-mono">
                            <span>FPS Promedio:</span>
                            <span className="font-bold">{fps}</span>
                        </div>
                        
                        <div className="mt-4 h-1 w-full bg-[var(--bg-input)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--accent)] animate-progress-indeterminate"></div>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-2">Aplicando configuración...</p>
                    </div>
                )}

            </div>
        </div>
    );
};
