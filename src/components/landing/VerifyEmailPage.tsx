import React from 'react'
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react'

interface VerifyEmailPageProps {
  success: boolean
  message: string
}

const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ success, message }) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-12 relative overflow-hidden bg-zinc-950">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[150px] rounded-full animate-pulse" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800 rounded-[40px] p-8 md:p-10 shadow-2xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-6 group cursor-default">
              <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-12 transition-transform shadow-lg shadow-cyan-500/20">
                <span className="text-zinc-950 font-black text-2xl">C</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Capibara<span className="text-cyan-500">Traductor</span>
              </h1>
            </div>

            <div className="flex flex-col items-center animate-in zoom-in duration-300">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 border ${
                success
                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                  : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {success ? <CheckCircle size={32} /> : <XCircle size={32} />}
              </div>
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                {success ? 'Email Verificado' : 'Error'}
              </h2>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8">
                {message}
              </p>
            </div>

            <button
              onClick={() => { window.location.href = success ? '/' : '/settings' }}
              className="w-full py-4 bg-cyan-500 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white transition-all transform active:scale-95 shadow-xl shadow-cyan-500/10"
            >
              {success ? 'Ir al Inicio' : 'Ir a Configuracion'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage
