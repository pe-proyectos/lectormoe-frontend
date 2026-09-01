import { CalendarClock, Gift, Percent, Ticket, Trophy, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'

// Modal del sorteo activo de qori.cc (GTA 6 Ultimate Edition). Se abre por el
// evento 'open-sorteo-modal' y ademas se muestra una vez por sesion como
// promocion. El countdown apunta al cierre: 5 de setiembre 14:02 hora Peru.
const TARGET = Date.UTC(2026, 8, 5, 19, 2, 0) // mes 8 = setiembre
const HREF = 'https://qori.cc/sorteos/primer-sorteo-gta-6-ultimate-edition'
const IMAGE =
  'https://r2.qori.cc/raffles/c71fe453-32ce-481b-85dc-aa82bd457f7d.jpg'
const SEEN_KEY = 'sorteo_gta6_seen'

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

interface SorteoModalProps {
  organization?: any
  logged?: boolean
}

const SorteoModal: React.FC<SorteoModalProps> = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const open = () => setIsOpen(true)
    const close = () => setIsOpen(false)
    window.addEventListener('open-sorteo-modal', open)
    window.addEventListener('close-sorteo-modal', close)

    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const seen = sessionStorage.getItem(SEEN_KEY)
      if (!seen && Date.now() < TARGET) {
        timer = setTimeout(() => {
          setIsOpen(true)
          sessionStorage.setItem(SEEN_KEY, '1')
        }, 1200)
      }
    } catch {
      // sessionStorage no disponible: sin apertura automatica.
    }

    return () => {
      window.removeEventListener('open-sorteo-modal', open)
      window.removeEventListener('close-sorteo-modal', close)
      if (timer) clearTimeout(timer)
    }
  }, [])

  // Bloquea el scroll del fondo y permite cerrar con Escape mientras esta abierto.
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        window.dispatchEvent(new Event('close-sorteo-modal'))
      }
    }
    window.addEventListener('keydown', onKey)
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      clearInterval(id)
    }
  }, [isOpen])

  if (!isOpen) return null

  const close = () => {
    setIsOpen(false)
    window.dispatchEvent(new Event('close-sorteo-modal'))
  }

  const diff = Math.max(0, TARGET - now)
  const total = Math.floor(diff / 1000)
  const units = [
    { value: pad(Math.floor(total / 86400)), label: 'Dias' },
    { value: pad(Math.floor((total % 86400) / 3600)), label: 'Horas' },
    { value: pad(Math.floor((total % 3600) / 60)), label: 'Min' },
    { value: pad(total % 60), label: 'Seg' }
  ]

  const facts = [
    { icon: CalendarClock, label: 'Se sortea', value: 'Sabado 5 Set.' },
    { icon: Ticket, label: 'Costo por ticket', value: 'USD 1' },
    { icon: Percent, label: 'Probabilidades', value: '1/50 a 1/150 por ticket' }
  ]

  return (
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md'
      onClick={close}
      role='dialog'
      aria-modal='true'
    >
      <style>{`
        @keyframes sorteoIn { from { opacity: 0; transform: translateY(20px) scale(.96); } to { opacity: 1; transform: none; } }
        @keyframes sorteoShine { 0% { transform: translateX(-140%) skewX(-16deg); } 60%, 100% { transform: translateX(360%) skewX(-16deg); } }
        @keyframes sorteoGlow { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
      `}</style>

      <div
        className='relative my-auto w-full max-w-md overflow-hidden rounded-[26px] border border-white/10 bg-zinc-950 shadow-[0_40px_120px_-24px_rgba(16,185,129,0.45)] ring-1 ring-emerald-400/10'
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'sorteoIn .4s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Cerrar */}
        <button
          type='button'
          onClick={close}
          aria-label='Cerrar'
          className='absolute right-3.5 top-3.5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/80 backdrop-blur-md transition-all hover:scale-105 hover:bg-black/60 hover:text-white'
        >
          <X size={17} />
        </button>

        {/* Hero: arte del premio */}
        <div className='relative'>
          <div className='relative aspect-[16/10] w-full overflow-hidden'>
            <img
              src={IMAGE}
              alt='GTA 6 Ultimate Edition'
              className='h-full w-full object-cover object-center'
            />
            {/* Fundido inferior hacia el cuerpo */}
            <div className='absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-transparent' />
            {/* Vineta lateral para foco */}
            <div className='absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_55%,rgba(0,0,0,0.45))]' />
            {/* Destello que barre el arte */}
            <span
              aria-hidden='true'
              className='pointer-events-none absolute inset-y-0 -left-1/4 w-1/3 bg-gradient-to-r from-transparent via-white/12 to-transparent'
              style={{ animation: 'sorteoShine 5.5s ease-in-out infinite' }}
            />
          </div>

          {/* Marca + valor sobre el arte */}
          <div className='absolute inset-x-0 bottom-0 flex items-end justify-between px-5 pb-4'>
            <div>
              <div className='flex items-center gap-1.5 text-emerald-300/90'>
                <Trophy size={13} />
                <span className='text-[10px] font-semibold uppercase tracking-[0.16em]'>
                  Premio qori.cc
                </span>
              </div>
              <h2 className='mt-1 text-[22px] font-black leading-none tracking-tight text-white'>
                GTA 6 Ultimate Edition
              </h2>
            </div>
            <div className='shrink-0 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-right backdrop-blur-md'>
              <p className='text-[8px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80'>
                Valor
              </p>
              <p className='text-base font-black leading-none text-emerald-50'>
                USD 100
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo */}
        <div className='px-5 pb-6 pt-4'>
          {/* Countdown */}
          <div className='grid grid-cols-4 gap-2'>
            {units.map((u) => (
              <div
                key={u.label}
                className='relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-center'
              >
                <span
                  aria-hidden='true'
                  className='pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent'
                />
                <div className='font-mono text-2xl font-bold leading-none tabular-nums text-white'>
                  {u.value}
                </div>
                <div className='mt-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-emerald-300/60'>
                  {u.label}
                </div>
              </div>
            ))}
          </div>

          {/* Datos */}
          <ul className='mt-4 divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]'>
            {facts.map((f) => {
              const Icon = f.icon
              return (
                <li
                  key={f.label}
                  className='flex items-center gap-3 px-3.5 py-2.5'
                >
                  <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300'>
                    <Icon size={15} />
                  </span>
                  <span className='text-[11px] font-medium uppercase tracking-wide text-zinc-500'>
                    {f.label}
                  </span>
                  <span className='ml-auto text-right text-[12px] font-semibold text-zinc-100'>
                    {f.value}
                  </span>
                </li>
              )
            })}
          </ul>

          {/* Nota de premio y entrega */}
          <div className='mt-3 flex items-start gap-2.5 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] px-3.5 py-3'>
            <span className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300'>
              <Gift size={14} />
            </span>
            <p className='text-[12px] leading-snug text-emerald-50/90'>
              Al ganar reclamas el premio o su valor en dolares. La entrega es
              el mismo dia del sorteo.
            </p>
          </div>

          {/* CTA */}
          <a
            href={HREF}
            target='_blank'
            rel='noopener noreferrer'
            className='group relative mt-5 flex w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 py-3.5 text-sm font-black uppercase tracking-wide text-emerald-950 shadow-[0_10px_30px_-8px_rgba(16,185,129,0.6)] transition-transform hover:scale-[1.02] active:scale-[0.99]'
          >
            <span
              aria-hidden='true'
              className='pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/30 blur-md'
              style={{ animation: 'sorteoShine 3.5s ease-in-out infinite' }}
            />
            <span className='relative'>Conseguir mi ticket</span>
          </a>
          <p className='mt-3 text-center text-[10.5px] leading-relaxed text-zinc-600'>
            Si no se alcanza el minimo de tickets se reembolsa. Solo mayores de
            18. Juega con responsabilidad.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SorteoModal
