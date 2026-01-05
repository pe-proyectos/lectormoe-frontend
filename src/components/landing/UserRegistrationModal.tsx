
import React, { useState } from 'react';
import 'cookie-store';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserRegistrationModal: React.FC<UserRegistrationModalProps> = ({ isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('username', username);
      formData.append('password', password);

      // @ts-ignore - callAPI se importa dinámicamente
      const { callAPI } = await import('../../util/callApi');
      
      const { registered } = await callAPI('/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      if (!registered) {
        setError('Error al registrarse. Por favor, intenta nuevamente.');
        return;
      }

      setSuccess(true);
      
      // Después de 2 segundos, cerrar y abrir login
      setTimeout(() => {
        onClose();
        // Disparar evento para abrir login
        window.dispatchEvent(new CustomEvent('open-login'));
      }, 2000);
    } catch (error: any) {
      console.error('Error registering:', error);
      setError(error?.message || 'Error al registrarse. Por favor, verifica tus datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          onClick={onClose}
        />
        
        <div className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-[20px_20px_0px_rgba(0,0,0,1)] border-4 border-black overflow-hidden animate-in zoom-in duration-300">
          <div className="text-center py-12 px-8">
            <div className="w-24 h-24 bg-white text-black border-4 border-black rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-[8px_8px_0px_#22c55e] animate-in zoom-in duration-300">
              ✓
            </div>
            <h2 className="text-5xl font-black text-slate-900 mb-6 italic uppercase leading-none">
              ¡REGISTRO <br/> <span className="text-red-600">EXITOSO!</span>
            </h2>
            <p className="text-slate-600 mb-10 font-bold leading-relaxed max-w-sm mx-auto">
              Tu cuenta ha sido creada correctamente. Serás redirigido al inicio de sesión...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-[20px_20px_0px_rgba(0,0,0,1)] border-4 border-black overflow-hidden animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-8 border-b-4 border-black">
          <div className="flex items-center justify-between">
            <div>
              <span className="bg-white text-orange-600 px-3 py-1 font-black text-xs uppercase italic g-pen-border">NUEVO USUARIO</span>
              <h2 className="text-5xl font-black text-white mt-4 italic uppercase leading-none">¡ÚNETE A LA <br/> <span className="text-black">COMUNIDAD!</span></h2>
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
              <label className="block text-xs font-black uppercase text-slate-400">Nombre de usuario</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="tu_usuario"
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
                minLength={6}
                className="w-full px-6 py-4 bg-slate-50 border-4 border-black font-bold text-lg focus:outline-none focus:bg-yellow-50 transition-all" 
              />
              <p className="text-xs text-slate-500 font-bold">Mínimo 6 caracteres</p>
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
                className="flex-[2] py-5 bg-black text-white font-black text-2xl manga-font hover:bg-orange-500 transition-all shadow-[8px_8px_0px_#ccc] disabled:opacity-50 disabled:cursor-not-allowed uppercase"
              >
                {isSubmitting ? 'REGISTRANDO...' : '¡CREAR CUENTA!'}
              </button>
            </div>

            <div className="pt-6 border-t-2 border-dashed border-slate-200">
              <p className="text-center text-sm font-bold text-slate-600">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    // Disparar evento para abrir login
                    window.dispatchEvent(new CustomEvent('open-login'));
                  }}
                  className="text-red-600 hover:underline font-black"
                >
                  ¡ENTRA AQUÍ!
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserRegistrationModal;

