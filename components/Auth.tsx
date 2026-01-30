import React, { useState } from 'react';
import { Brain, User as UserIcon, Mail, Lock, Loader2, Chrome, UserCircle, AlertTriangle, ArrowLeft, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from '../services/firebase';

interface AuthProps {
  onLogin: (data: { name: string; email: string; isGuest?: boolean }) => void;
}

type AuthView = 'login' | 'register' | 'reset';

export const AuthScreen: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  const handleGuestLogin = () => {
    setLoading(true);
    setTimeout(() => {
        onLogin({ name: "Invitado", email: "guest@cortex.local", isGuest: true });
    }, 800);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!auth) return;
      if (!formData.email) {
          setError("Ingresa tu correo para recuperar la contraseña.");
          return;
      }
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
          await sendPasswordResetEmail(auth, formData.email);
          setSuccess("Correo de recuperación enviado. Revisa tu bandeja de entrada (y spam).");
          setLoading(false);
      } catch (err: any) {
          console.error(err);
          let msg = "No se pudo enviar el correo.";
          if (err.code === 'auth/user-not-found') msg = "No existe una cuenta con este correo.";
          if (err.code === 'auth/invalid-email') msg = "El formato del correo es inválido.";
          setError(msg);
          setLoading(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
        if (view === 'login') {
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
        } else if (view === 'register') {
            if (!formData.name) throw new Error("Por favor ingresa tu nombre.");
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await updateProfile(userCredential.user, { displayName: formData.name });
        }
    } catch (err: any) {
        let msg = "Ocurrió un error.";
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') msg = "Credenciales incorrectas.";
        if (err.code === 'auth/email-already-in-use') msg = "Este correo ya está registrado.";
        if (err.code === 'auth/weak-password') msg = "Contraseña muy débil (min 6 caracteres).";
        if (err.code === 'auth/user-not-found') msg = "Usuario no encontrado.";
        if (err.message === "Por favor ingresa tu nombre.") msg = err.message;
        setError(msg);
        setLoading(false);
    }
  };

  // Helper to switch views and clear errors
  const switchView = (v: AuthView) => {
      setView(v);
      setError(null);
      setSuccess(null);
      setShowPassword(false); // Reset password visibility on view switch
  };

  return (
    <div className="h-screen w-full flex bg-[var(--bg-main)] text-[var(--text-primary)] relative overflow-hidden transition-colors duration-500">
      
      {/* Background Shapes - Liquid Living Nebulas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-[var(--accent)] rounded-full blur-[80px] opacity-[0.25] anim-nebula-1 mix-blend-multiply dark:mix-blend-screen" style={{ '--target-opacity': 0.25 } as any} />
        <div className="absolute bottom-[-10%] right-[-20%] w-[70vw] h-[70vw] bg-[var(--royal)] rounded-full blur-[90px] opacity-[0.25] anim-nebula-2 mix-blend-multiply dark:mix-blend-screen" style={{ '--target-opacity': 0.25 } as any} />
        <div className="absolute top-[20%] left-[20%] w-[50vw] h-[50vw] bg-rose-500 rounded-full blur-[100px] opacity-[0.2] anim-nebula-3 mix-blend-multiply dark:mix-blend-screen" style={{ '--target-opacity': 0.2 } as any} />
      </div>

      <div className="w-full flex items-center justify-center z-10 p-4">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 card-modern overflow-hidden min-h-[600px] anim-enter shadow-2xl border-white/60 relative">
          
          {/* Visual Panel (Left) */}
          <div className="hidden md:flex flex-col justify-center p-12 relative overflow-hidden bg-white/40 backdrop-blur-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--royal)]/20 animate-pulse" style={{animationDuration: '8s'}} />
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[var(--accent)] shadow-md mb-8 border border-[var(--border-color)] anim-float">
                <Brain size={32} />
              </div>
              <h1 className="text-5xl font-bold mb-4 text-[var(--text-primary)] tracking-tight">
                Cortex<span className="text-[var(--accent)]">.</span>
              </h1>
              <p className="text-[var(--text-secondary)] text-lg leading-relaxed font-medium">
                Tu Sistema Operativo Académico. <br/>
                Sincronización en la nube e Inteligencia Artificial.
              </p>
            </div>
          </div>

          {/* Form Panel (Right) */}
          <div className="p-8 md:p-12 flex flex-col justify-center bg-[var(--bg-card)]/90 backdrop-blur-xl transition-all">
            <div className="mb-8">
              {view === 'reset' && (
                  <button onClick={() => switchView('login')} className="flex items-center gap-1 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors">
                      <ArrowLeft size={14}/> Volver
                  </button>
              )}

              <h2 className="text-3xl font-bold mb-2 text-[var(--text-primary)] flex items-center gap-2">
                {view === 'login' && 'Bienvenido'}
                {view === 'register' && 'Crear cuenta'}
                {view === 'reset' && <span className="flex items-center gap-2"><KeyRound size={28} className="text-[var(--accent)]"/> Recuperar</span>}
              </h2>
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                {view === 'login' && 'Ingresa tus credenciales para continuar.'}
                {view === 'register' && 'Únete a Cortex para gestionar tu vida académica.'}
                {view === 'reset' && 'Ingresa tu correo y te enviaremos un enlace de restauración.'}
              </p>
              
              {!auth && (
                  <div className="p-3 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-200 mb-4 font-bold flex items-center gap-2">
                      <AlertTriangle size={16}/> Firebase no detectado
                  </div>
              )}

              {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 mb-4 font-bold animate-in slide-in-from-top-2">
                      {error}
                  </div>
              )}

              {success && (
                  <div className="p-3 bg-emerald-50 text-emerald-600 text-xs rounded-lg border border-emerald-100 mb-4 font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                      <CheckCircle2 size={16}/> {success}
                  </div>
              )}
            </div>

            <div className="space-y-4">
                <form onSubmit={view === 'reset' ? handleResetPassword : handleSubmit} className="space-y-4">
                  {view === 'register' && (
                      <div className="relative group anim-enter">
                          <UserIcon className="absolute left-4 top-3.5 text-[var(--text-secondary)]" size={18} />
                          <input type="text" className="w-full pl-12 input-glass" placeholder="Tu Nombre" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                      </div>
                  )}
                  
                  <div className="relative group">
                      <Mail className="absolute left-4 top-3.5 text-[var(--text-secondary)]" size={18} />
                      <input type="email" className="w-full pl-12 input-glass" placeholder="Correo electrónico" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                  
                  {view !== 'reset' && (
                      <div>
                          <div className="relative group anim-enter">
                              <Lock className="absolute left-4 top-3.5 text-[var(--text-secondary)]" size={18} />
                              <input 
                                type={showPassword ? "text" : "password"} 
                                className="w-full pl-12 pr-12 input-glass" 
                                placeholder="Contraseña" 
                                value={formData.password} 
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                                required 
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
                                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                              >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                          </div>
                          {view === 'login' && (
                              <div className="text-right mt-2">
                                  <button type="button" onClick={() => switchView('reset')} className="text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                                      ¿Olvidaste tu contraseña?
                                  </button>
                              </div>
                          )}
                      </div>
                  )}

                  <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 rounded-xl font-bold text-sm shadow-lg mt-2 flex justify-center items-center">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : (
                        view === 'login' ? 'Ingresar' : view === 'register' ? 'Crear Cuenta' : 'Enviar Enlace'
                    )}
                  </button>
                </form>

                <div className="text-center pt-2 space-y-2">
                    {view !== 'reset' && (
                        <button onClick={() => switchView(view === 'login' ? 'register' : 'login')} className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] font-bold transition-colors">
                            {view === 'login' ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia Sesión"}
                        </button>
                    )}
                </div>

                <div className="border-t border-[var(--border-color)] pt-4 mt-2">
                    <button onClick={handleGuestLogin} disabled={loading} className="w-full py-3 rounded-xl border border-dashed border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-input)] transition-all flex items-center justify-center gap-2 text-xs font-bold">
                        <UserCircle size={16} /> Modo Invitado (Sin Guardado)
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};