import React, { useState } from 'react'
import { Lock, ShieldCheck, ArrowLeft, CheckCircle } from 'lucide-react'
import AuthShell, { AuthField, AuthSubmit, AuthError, AuthSuccessIcon, PasswordToggle } from './AuthShell'

interface ResetPasswordPageProps {
  token: string
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ token }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsLoading(true)

    try {
      const { callAPI } = await import('../../util/callApi')

      const result = await callAPI('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })

      setIsSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/login'
      }, 3000)
    } catch (error: any) {
      setError(error?.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title={isSuccess ? 'Contraseña actualizada' : 'Nueva contraseña'}
      subtitle={isSuccess
        ? 'Listo. Te llevamos a iniciar sesión en unos segundos…'
        : 'Elige una contraseña nueva para tu cuenta.'}
      hero={isSuccess ? <AuthSuccessIcon Icon={CheckCircle} /> : undefined}
      footer={
        <button type="button" onClick={() => { window.location.href = '/login' }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 transition-colors hover:text-cyan-400">
          <ArrowLeft size={15} /> Volver a iniciar sesión
        </button>
      }
    >
      {!isSuccess && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthError message={error} />
          <AuthField
            label="Nueva contraseña"
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
          />
          <AuthField
            label="Confirmar contraseña"
            icon={ShieldCheck}
            type={showConfirmPassword ? 'text' : 'password'}
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite tu contraseña"
            trailing={<PasswordToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />}
          />
          <AuthSubmit loading={isLoading}>Guardar contraseña</AuthSubmit>
        </form>
      )}
    </AuthShell>
  )
}

export default ResetPasswordPage
