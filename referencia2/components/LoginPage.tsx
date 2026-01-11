import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  isScanContext?: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, isScanContext }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simular login
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-12 relative overflow-hidden bg-zinc-950">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[150px] rounded-full animate-pulse" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800 rounded-[40px] p-8 md:p-10 shadow-2xl">
          <div className="text-center mb-10">
            {!isScanContext ? (
              <div className="inline-flex items-center gap-3 mb-6 group cursor-default">
                <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-12 transition-transform shadow-lg shadow-cyan-500/20">
                  <span className="text-zinc-950 font-black text-2xl">C</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Capibara<span className="text-cyan-500">Traductor</span>
                </h1>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em]">
                <ShieldCheck size={14} className="text-cyan-500" /> Portal de Lectura Autorizado
              </div>
            )}

            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
              {isScanContext 
                ? (isLogin ? 'Acceso al Portal' : 'Crea tu Perfil')
                : (isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta')}
            </h2>
            
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">
              {isScanContext
                ? (isLogin 
                    ? 'Inicia sesión para sincronizar tu progreso y acceder a beneficios exclusivos del equipo.' 
                    : 'Regístrate para seguir tus series favoritas y apoyar directamente este proyecto.')
                : (isLogin 
                    ? 'Accede a tu historial y apoya a tus scans favoritos.' 
                    : 'Únete a la comunidad de manga más premium.')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nombre de usuario</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    required 
                    placeholder="Tu alias"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  required 
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Contraseña</label>
                {isLogin && (
                  <button type="button" className="text-[9px] font-black text-cyan-500 uppercase tracking-widest hover:text-white transition-colors">¿Olvidaste tu contraseña?</button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-cyan-500/10 ${isLoading ? 'bg-zinc-800 text-zinc-500' : 'bg-cyan-500 text-zinc-950 hover:bg-white'}`}
            >
              {isLoading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[11px] font-bold text-zinc-500 hover:text-cyan-500 transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes una cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-zinc-600 text-[10px] uppercase tracking-widest leading-relaxed">
          Al continuar, aceptas nuestros <a href="#" className="text-zinc-400 hover:text-white underline underline-offset-4">Términos de Servicio</a> y <a href="#" className="text-zinc-400 hover:text-white underline underline-offset-4">Política de Privacidad</a>.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;