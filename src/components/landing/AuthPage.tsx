import React, { useState, useEffect } from 'react';
import { Mail, Lock } from 'lucide-react';
import AuthShell, { AuthField, AuthSubmit, AuthError, PasswordToggle } from './AuthShell';
import 'cookie-store';

interface AuthPageProps {
  isScanContext?: boolean;
  organization?: any;
}

// Conserva ?next= al saltar entre login y registro (flujo SSO).
const keepNext = () => {
  if (typeof window === 'undefined') return ''
  const n = new URLSearchParams(window.location.search).get('next')
  return n && n.startsWith('/') && !n.startsWith('//') ? `?next=${encodeURIComponent(n)}` : ''
}

const AuthPage: React.FC<AuthPageProps> = ({ isScanContext = false, organization }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
        
        // Respetar ?next= (solo rutas internas) para flujos como el SSO de La Charca.
        const nextParam = new URLSearchParams(window.location.search).get('next');
        const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;
        const redirectPath = safeNext
          ? safeNext
          : isScanContext && organization?.slug
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
      window.location.href = `/${organization.slug}/register${keepNext()}`;
    } else {
      window.location.href = `/register${keepNext()}`;
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
    <AuthShell
      organization={isScanContext ? organization : null}
      title="Bienvenido de nuevo"
      subtitle={isScanContext && organization?.name ? `Entra para seguir leyendo en ${organization.name}.` : 'Entra para retomar tu lectura donde la dejaste.'}
      footer={
        <button type="button" onClick={handleGoToRegister} className="text-sm font-semibold text-zinc-400 transition-colors hover:text-cyan-400">
          ¿No tienes cuenta? <span className="text-cyan-400">Regístrate gratis</span>
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthError message={error} />
        <AuthField
          label="Correo o nombre de usuario"
          icon={Mail}
          type="text"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com o tu_usuario"
        />
        <AuthField
          label="Contraseña"
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Tu contraseña"
          labelAction={
            <button type="button" onClick={handleGoToForgotPassword} className="text-xs font-bold text-cyan-400 transition-colors hover:text-cyan-300">
              ¿La olvidaste?
            </button>
          }
          trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
        />
        <AuthSubmit loading={isLoading}>Iniciar sesión</AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default AuthPage;

