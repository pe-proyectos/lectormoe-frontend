import React, { useState } from 'react'
import { Lock, ArrowRight, ArrowLeft, CheckCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react'

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
      setError('La contrasena debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.')
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
      setError(error?.message || 'Error al restablecer la contrasena. El enlace puede haber expirado.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-12 relative overflow-hidden bg-zinc-950">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[150px] rounded-full animate-pulse" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800 rounded-[40px] p-8 md:p-10 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-6 group cursor-default">
              <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-12 transition-transform shadow-lg shadow-cyan-500/20">
                <span className="text-zinc-950 font-black text-2xl">C</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Capibara<span className="text-cyan-500">Traductor</span>
              </h1>
            </div>

            {isSuccess ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-500/20">
                  <CheckCircle size={32} />
                </div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                  Contrasena Actualizada
                </h2>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                  Tu contrasena ha sido restablecida exitosamente. Seras redirigido al login en unos segundos...
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                  Nueva Contrasena
                </h2>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                  Ingresa tu nueva contrasena para restablecer el acceso a tu cuenta.
                </p>
              </>
            )}
          </div>

          {/* Form */}
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                  <p className="text-red-400 text-sm font-bold">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nueva Contrasena</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimo 6 caracteres"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Confirmar Contrasena</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contrasena"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-cyan-500/10 ${isLoading ? 'bg-zinc-800 text-zinc-500' : 'bg-cyan-500 text-zinc-950 hover:bg-white'}`}
              >
                {isLoading ? 'Procesando...' : 'Restablecer Contrasena'}
                {!isLoading && <ArrowRight size={16} />}
              </button>

              <button
                type="button"
                onClick={() => { window.location.href = '/login' }}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                <ArrowLeft size={14} /> Volver al Login
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <button
                onClick={() => { window.location.href = '/login' }}
                className="w-full py-4 bg-zinc-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-cyan-500 hover:text-zinc-950 transition-all shadow-xl active:scale-95"
              >
                Ir al Login <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-zinc-600 text-[10px] uppercase tracking-widest leading-relaxed">
          Al continuar, aceptas nuestros <a href="/terms" className="text-zinc-400 hover:text-white underline underline-offset-4">Términos de Servicio</a> y <a href="/privacy" className="text-zinc-400 hover:text-white underline underline-offset-4">Política de Privacidad</a>.
        </p>
      </div>
    </div>
  )
}

export default ResetPasswordPage
