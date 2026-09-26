import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';
import AuthShell, { AuthField, AuthSubmit, AuthError, AuthSuccessIcon, PasswordToggle } from './AuthShell';
import 'cookie-store';

interface RegisterPageProps {
  isScanContext?: boolean;
  organization?: any;
}

// Conserva ?next= al volver al login (flujo SSO de La Charca).
const keepNext = () => {
  if (typeof window === 'undefined') return ''
  const n = new URLSearchParams(window.location.search).get('next')
  return n && n.startsWith('/') && !n.startsWith('//') ? `?next=${encodeURIComponent(n)}` : ''
}

const RegisterPage: React.FC<RegisterPageProps> = ({ isScanContext = false, organization }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Track page view
  useEffect(() => {
    import('../../util/callApi').then(({ callAPI }) => {
      callAPI('/api/analytics', {
        method: 'POST',
        includeIp: true,
        body: JSON.stringify({
          event: 'view_register_page',
          path: window.location.pathname,
          userAgent: navigator.userAgent,
          screenWidth: screen.width,
          screenHeight: screen.height,
          payload: {},
        }),
      }).catch(() => {})
    })
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('username', username);
      formData.append('password', password);

      const { callAPI } = await import('../../util/callApi');
      
      const response = await callAPI('/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      // callAPI retorna result.data directamente
      if (response?.registered) {
        // Track successful registration
        callAPI('/api/analytics', {
          method: 'POST',
          includeIp: true,
          body: JSON.stringify({
            event: 'action_register',
            path: window.location.pathname,
            userAgent: navigator.userAgent,
            screenWidth: screen.width,
            screenHeight: screen.height,
            payload: {},
          }),
        }).catch(() => {})

        setIsSubmitted(true);
        // Después de 2 segundos, redirigir a login
        setTimeout(() => {
          if (isScanContext && organization?.slug) {
            window.location.href = `/${organization.slug}/login${keepNext()}`;
          } else {
            window.location.href = `/login${keepNext()}`;
          }
        }, 2000);
      } else {
        throw new Error('Error al registrarse. Por favor, intenta nuevamente.');
      }
    } catch (error: any) {
      console.error('Error registering:', error);
      setError(error?.message || 'Error al registrarse. Por favor, verifica tus datos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    if (isScanContext && organization?.slug) {
      window.location.href = `/${organization.slug}/login${keepNext()}`;
    } else {
      window.location.href = `/login${keepNext()}`;
    }
  };

  return (
    <AuthShell
      organization={isScanContext ? organization : null}
      title={isSubmitted ? '¡Cuenta creada!' : 'Crea tu cuenta'}
      subtitle={isSubmitted
        ? 'Tu cuenta está lista. Te llevamos a iniciar sesión…'
        : 'Gratis. Guarda tu progreso, arma tu lista y comenta en todos los scans.'}
      hero={isSubmitted ? <AuthSuccessIcon Icon={CheckCircle} /> : undefined}
      footer={!isSubmitted && (
        <button type="button" onClick={handleGoToLogin} className="text-sm font-semibold text-zinc-400 transition-colors hover:text-cyan-400">
          ¿Ya tienes cuenta? <span className="text-cyan-400">Inicia sesión</span>
        </button>
      )}
    >
      {!isSubmitted ? (
        <form onSubmit={handleRegister} className="space-y-5">
          <AuthError message={error} />
          <AuthField
            label="Nombre de usuario"
            icon={User}
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="tu_alias"
            minLength={3}
            maxLength={20}
            pattern="^[a-zA-Z0-9_]*$"
            hint="De 3 a 20 caracteres: letras, números y guion bajo."
          />
          <AuthField
            label="Correo electrónico"
            icon={Mail}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />
          <AuthField
            label="Contraseña"
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Crea una contraseña"
            minLength={4}
            maxLength={30}
            hint="Mínimo 4 caracteres."
            trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
          />
          <AuthSubmit loading={isLoading}>Crear cuenta</AuthSubmit>
        </form>
      ) : (
        <button
          type="button"
          onClick={handleGoToLogin}
          className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-cyan-500 text-sm font-black uppercase tracking-[0.15em] text-zinc-950 transition-colors hover:bg-cyan-400"
        >
          Iniciar sesión <ArrowRight size={17} />
        </button>
      )}
    </AuthShell>
  );
};

export default RegisterPage;

