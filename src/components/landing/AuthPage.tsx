import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import 'cookie-store';

interface AuthPageProps {
  isScanContext?: boolean;
  organization?: any;
}

const AuthPage: React.FC<AuthPageProps> = ({ isScanContext = false, organization }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Track page view
  useEffect(() => {
    import('../../util/callApi').then(({ callAPI }) => {
      callAPI('/api/analytics', {
        method: 'POST',
        includeIp: true,
        body: JSON.stringify({
          event: 'view_login_page',
          path: window.location.pathname,
          userAgent: navigator.userAgent,
          screenWidth: screen.width,
          screenHeight: screen.height,
          payload: {},
        }),
      }).catch(() => {})
    })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const { callAPI } = await import('../../util/callApi');
      
      const response = await callAPI('/api/auth/login', {
        method: 'POST',
        body: formData,
      });

      // callAPI retorna result.data directamente
      if (response?.token) {
        const token = response.token;
        const username = response.username;
        const userSlug = response.userSlug;
        const user = response.user;
        
        // Función helper para establecer cookies usando document.cookie
        const setCookie = (name: string, value: string, days: number = 7) => {
          const expires = new Date();
          expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
          
          const cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
          
          document.cookie = cookieString;
        };
        
        // Limpiar cualquier dato antiguo de localStorage
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (e) {
          // Silently fail
        }
        
        // Siempre usar document.cookie directamente (más confiable)
        try {
          setCookie('token', token, 7);
          setCookie('username', username || '', 7);
          setCookie('userSlug', userSlug || '', 7);
          if (user) {
            setCookie('user', JSON.stringify(user), 7);
          }
        } catch (error) {
          // Silently fail
        }

        // Track successful login
        callAPI('/api/analytics', {
          method: 'POST',
          includeIp: true,
          body: JSON.stringify({
            event: 'action_login',
            path: window.location.pathname,
            userAgent: navigator.userAgent,
            screenWidth: screen.width,
            screenHeight: screen.height,
            payload: {},
          }),
        }).catch(() => {})

        // Disparar evento para actualizar el navbar
        window.dispatchEvent(new Event('auth-changed'));
        
        const redirectPath = isScanContext && organization?.slug 
          ? `/${organization.slug}` 
          : '/';
        
        // Redirigir según el contexto
        window.location.href = redirectPath;
      } else {
        throw new Error('Error al iniciar sesión. Por favor, verifica tus credenciales.');
      }
    } catch (error: any) {
      console.error('❌ Error logging in:', error);
      console.error('❌ Error stack:', error?.stack);
      console.error('❌ Error message:', error?.message);
      setError(error?.message || 'Error al iniciar sesión. Por favor, verifica tus credenciales.');
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    handleLogin(e);
  };

  const handleGoToRegister = () => {
    if (isScanContext && organization?.slug) {
      window.location.href = `/${organization.slug}/register`;
    } else {
      window.location.href = '/register';
    }
  };

  const handleGoToForgotPassword = () => {
    if (isScanContext && organization?.slug) {
      window.location.href = `/${organization.slug}/forgot-password`;
    } else {
      window.location.href = '/forgot-password';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-12 relative overflow-hidden bg-zinc-950">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[150px] rounded-full animate-pulse" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800 rounded-[40px] p-8 md:p-10 shadow-2xl">
          
          {/* Header */}
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
              <>
                {organization?.logoUrl && (
                  <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-cyan-500 shadow-lg shadow-cyan-500/10">
                      <img 
                        src={organization.logoUrl} 
                        alt={organization.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                )}
                <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em]">
                  <ShieldCheck size={14} className="text-cyan-500" /> Portal de Lectura Autorizado
                </div>
              </>
            )}

            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
              {isScanContext ? 'Ingreso' : 'Bienvenido de nuevo'}
            </h2>
            
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">
              {isScanContext ? 'Inicia sesión para sincronizar tu progreso.' : 'Accede a tu historial y apoya a tus scans.'}
            </p>
          </div>

          {/* Forms */}
          <form onSubmit={(e) => {
            handleSubmit(e);
          }} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                <p className="text-red-400 text-sm font-bold">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Correo Electrónico o Nombre de Usuario</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com o tu_usuario"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Contraseña</label>
                <button 
                  type="button" 
                  onClick={handleGoToForgotPassword}
                  className="text-[9px] font-black text-cyan-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? 'Procesando...' : 'Iniciar Sesión'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button 
              onClick={handleGoToRegister}
              className="text-[11px] font-bold text-zinc-500 hover:text-cyan-500 transition-colors"
            >
              ¿No tienes cuenta? Regístrate gratis
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

export default AuthPage;

