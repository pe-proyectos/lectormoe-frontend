
import React, { useState } from 'react';
import 'cookie-store';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      // @ts-ignore - callAPI se importa dinámicamente
      const { callAPI } = await import('../../util/callApi');
      
      const response = await callAPI('/api/auth/login', {
        method: 'POST',
        body: formData,
      });

      // callAPI retorna result.data directamente, así que response ya es el objeto con token, username, etc.
      if (response?.token) {
        // @ts-ignore - cookieStore está disponible globalmente después de importar 'cookie-store'
        const cookieOptions = {
          path: '/',
          sameSite: 'lax' as const,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        };
        
        await Promise.all([
          cookieStore.set('token', response.token, cookieOptions),
          cookieStore.set('username', response.username, cookieOptions),
          cookieStore.set('userSlug', response.userSlug, cookieOptions),
          response?.user ? cookieStore.set('user', JSON.stringify(response.user), cookieOptions) : Promise.resolve(),
        ]);
        
        // Verificar que las cookies se guardaron correctamente
        // @ts-ignore
        const savedToken = await cookieStore.get('token');
        if (!savedToken || savedToken.value !== response.token) {
          console.error('Error: Las cookies no se guardaron correctamente');
          throw new Error('Error al guardar la sesión. Por favor, intenta nuevamente.');
        }
      } else {
        throw new Error('Error al iniciar sesión. Por favor, verifica tus credenciales.');
      }

      // Pequeño delay para asegurar que las cookies se hayan propagado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Recargar la página para actualizar el estado de autenticación
      window.location.reload();
    } catch (error: any) {
      console.error('Error logging in:', error);
      setError(error?.message || 'Error al iniciar sesión. Por favor, verifica tus credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-[20px_20px_0px_rgba(0,0,0,1)] border-4 border-black overflow-hidden animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-500 p-8 border-b-4 border-black">
          <div className="flex items-center justify-between">
            <div>
              <span className="bg-white text-red-600 px-3 py-1 font-black text-xs uppercase italic g-pen-border">INICIO DE SESIÓN</span>
              <h2 className="text-5xl font-black text-white mt-4 italic uppercase leading-none">¡BIENVENIDO <br/> <span className="text-black">DE VUELTA!</span></h2>
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center bg-white border-4 border-black font-black text-2xl hover:bg-black hover:text-white transition-all"
            >
              ×
            </button>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-4 border-red-600 p-4 rounded-lg">
                <p className="text-red-600 font-bold text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-400">Correo electrónico</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full px-6 py-4 bg-slate-50 border-4 border-black font-bold text-lg focus:outline-none focus:bg-yellow-50 transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-400">Contraseña</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-slate-50 border-4 border-black font-bold text-lg focus:outline-none focus:bg-yellow-50 transition-all" 
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-5 border-4 border-black font-black text-xl hover:bg-slate-100 transition-all uppercase"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] py-5 bg-black text-white font-black text-2xl manga-font hover:bg-red-600 transition-all shadow-[8px_8px_0px_#ccc] disabled:opacity-50 disabled:cursor-not-allowed uppercase"
              >
                {isSubmitting ? 'INICIANDO SESIÓN...' : '¡ENTRAR!'}
              </button>
            </div>

            <div className="pt-6 border-t-2 border-dashed border-slate-200">
              <p className="text-center text-sm font-bold text-slate-600">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    // Disparar evento para abrir registro
                    window.dispatchEvent(new CustomEvent('open-register'));
                  }}
                  className="text-red-600 hover:underline font-black"
                >
                  ¡ÚNETE AQUÍ!
                </button>
              </p>
              <p className="text-center text-sm font-bold text-slate-600 mt-2">
                ¿Olvidaste tu contraseña?{' '}
                <a
                  href="/forgot"
                  className="text-orange-600 hover:underline font-black"
                >
                  Recuperar contraseña
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

