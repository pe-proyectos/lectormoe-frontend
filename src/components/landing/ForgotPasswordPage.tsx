import React, { useState } from 'react';
import { Mail, ArrowRight, ShieldCheck, ArrowLeft, CheckCircle } from 'lucide-react';
import 'cookie-store';

interface ForgotPasswordPageProps {
  isScanContext?: boolean;
  organization?: any;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ isScanContext = false, organization }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('email', email);

      const { callAPI } = await import('../../util/callApi');
      
      await callAPI('/api/auth/forgot-password', {
        method: 'POST',
        body: formData,
      });

      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Error sending forgot password:', error);
      setError(error?.message || 'Error al enviar el correo. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    if (isScanContext && organization?.slug) {
      window.location.href = `/${organization.slug}/login`;
    } else {
      window.location.href = '/login';
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

            {isSubmitted ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-500/20">
                  <CheckCircle size={32} />
                </div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                  Correo Enviado
                </h2>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                  Si el correo existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña en unos minutos.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                  Recuperar Cuenta
                </h2>
                
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                  Ingresa tu correo para recibir instrucciones de recuperación.
                </p>
              </>
            )}
          </div>

          {/* Forms */}
          {!isSubmitted ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                  <p className="text-red-400 text-sm font-bold">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-cyan-500/10 ${isLoading ? 'bg-zinc-800 text-zinc-500' : 'bg-cyan-500 text-zinc-950 hover:bg-white'}`}
              >
                {isLoading ? 'Procesando...' : 'Enviar Instrucciones'}
                {!isLoading && <ArrowRight size={16} />}
              </button>

              <button 
                type="button"
                onClick={handleGoToLogin}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                <ArrowLeft size={14} /> Volver al inicio
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <button 
                onClick={handleGoToLogin}
                className="w-full py-4 bg-zinc-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-cyan-500 hover:text-zinc-950 transition-all shadow-xl active:scale-95"
              >
                Ir al Login <ArrowRight size={16} />
              </button>
              <p className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                ¿No recibiste el correo? <button className="text-cyan-500 hover:underline" onClick={() => setIsSubmitted(false)}>Intentar de nuevo</button>
              </p>
            </div>
          )}

          {!isSubmitted && (
            <div className="mt-10 text-center">
              <button 
                onClick={handleGoToLogin}
                className="text-[11px] font-bold text-zinc-500 hover:text-cyan-500 transition-colors"
              >
                ¿Ya tienes una cuenta? Inicia sesión
              </button>
            </div>
          )}
        </div>
        
        <p className="mt-8 text-center text-zinc-600 text-[10px] uppercase tracking-widest leading-relaxed">
          Al continuar, aceptas nuestros <a href="/terms" className="text-zinc-400 hover:text-white underline underline-offset-4">Términos de Servicio</a> y <a href="/privacy" className="text-zinc-400 hover:text-white underline underline-offset-4">Política de Privacidad</a>.
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

