import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import AuthShell, { AuthField, AuthSubmit, AuthError, AuthSuccessIcon } from './AuthShell';
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
    <AuthShell
      organization={isScanContext ? organization : null}
      title={isSubmitted ? 'Revisa tu correo' : 'Recupera tu cuenta'}
      subtitle={isSubmitted
        ? 'Si ese correo tiene una cuenta, te enviamos un enlace para crear una contraseña nueva. Puede tardar unos minutos; revisa también spam.'
        : 'Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.'}
      hero={isSubmitted ? <AuthSuccessIcon Icon={CheckCircle} /> : undefined}
      footer={
        <button type="button" onClick={handleGoToLogin} className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 transition-colors hover:text-cyan-400">
          <ArrowLeft size={15} /> Volver a iniciar sesión
        </button>
      }
    >
      {!isSubmitted ? (
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <AuthError message={error} />
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
          <AuthSubmit loading={isLoading}>Enviar enlace</AuthSubmit>
        </form>
      ) : (
        <p className="text-center text-sm text-zinc-500">
          ¿No te llegó?{' '}
          <button type="button" className="font-bold text-cyan-400 hover:underline" onClick={() => setIsSubmitted(false)}>
            Intentar de nuevo
          </button>
        </p>
      )}
    </AuthShell>
  );
};

export default ForgotPasswordPage;

