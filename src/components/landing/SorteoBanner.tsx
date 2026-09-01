import React, { useEffect, useState } from 'react'

// Tira superior (no sticky, poca altura) que anuncia el sorteo activo y enlaza
// a la landing del sorteo en qori.cc. En reposo late suavemente para llamar la
// atencion; al hacer hover se expande y muestra los detalles del sorteo.
// El countdown apunta al cierre: 5 de setiembre 14:02 hora Peru (UTC-5).
const TARGET = Date.UTC(2026, 8, 5, 19, 2, 0) // mes 8 = setiembre
const HREF = 'https://qori.cc/sorteos/primer-sorteo-gta-6-ultimate-edition'
const LOGO = 'https://qori.cc/logo.png'

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

interface Unit {
  value: string
  label: string
}

interface Detail {
  label: string
  value: string
}

const DETAILS: Detail[] = [
  { label: 'Valor del premio', value: 'USD 100' },
  { label: 'Se sortea en vivo', value: 'Sabado 5 set, 14:02 Peru' },
  { label: 'Tickets', value: '150 en total, minimo 50' },
  { label: 'Transparencia', value: 'Verificable (provably-fair)' }
]

const SorteoBanner: React.FC = () => {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // El tiempo solo existe en cliente; no renderizamos en SSR ni cuando el
  // sorteo ya cerro.
  if (now === null) return null
  const diff = TARGET - now
  if (diff <= 0) return null

  const total = Math.floor(diff / 1000)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60

  const units: Unit[] = [
    { value: pad(days), label: 'dias' },
    { value: pad(hours), label: 'hrs' },
    { value: pad(mins), label: 'min' },
    { value: pad(secs), label: 'seg' }
  ]

  return (
    <a
      href={HREF}
      target="_blank"
      rel="noopener noreferrer"
      className="qori-bar group relative block w-full overflow-hidden border-b border-emerald-400/15 bg-[#04140d] transition-[background-color,border-color,box-shadow] duration-300 hover:border-emerald-400/40 hover:bg-[#06200f] hover:shadow-[0_10px_34px_-12px_rgba(16,185,129,0.5)]"
    >
      {/* Keyframes y clases de animacion propias del banner */}
      <style>{`
        @keyframes qoriGlow {
          0%, 100% { opacity: .35; }
          50% { opacity: 1; }
        }
        @keyframes qoriShimmer {
          0% { transform: translateX(-140%) skewX(-18deg); }
          100% { transform: translateX(320%) skewX(-18deg); }
        }
        @keyframes qoriFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-1px) rotate(-4deg); }
        }
        .qori-glow { animation: qoriGlow 2.8s ease-in-out infinite; }
        .qori-shimmer { animation: qoriShimmer 5s ease-in-out infinite; }
        .qori-logo { animation: qoriFloat 3.2s ease-in-out infinite; transition: transform .3s ease; }
        .qori-bar:hover .qori-glow { animation-play-state: paused; opacity: 1; }
        .qori-bar:hover .qori-shimmer { animation-play-state: paused; }
        .qori-bar:hover .qori-logo { transform: scale(1.12) rotate(0deg); }
        @media (prefers-reduced-motion: reduce) {
          .qori-glow, .qori-shimmer, .qori-logo { animation: none; }
        }
      `}</style>

      {/* Brillo esmeralda difuso a la izquierda, latiendo en reposo */}
      <span
        aria-hidden="true"
        className="qori-glow pointer-events-none absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-emerald-500/20 to-transparent"
      />
      {/* Destello que barre la tira para captar la vista */}
      <span
        aria-hidden="true"
        className="qori-shimmer pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent"
      />
      {/* Filo superior de luz que se intensifica en hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent transition-opacity duration-300 group-hover:via-emerald-200/70"
      />

      {/* Fila compacta siempre visible */}
      <div className="relative mx-auto flex max-w-6xl items-center justify-center gap-x-2.5 px-3 py-1.5 sm:gap-x-3">
        {/* Indicador en vivo */}
        <span className="relative hidden h-2 w-2 shrink-0 sm:flex">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>

        {/* Logo oficial de qori.cc, sin borde */}
        <img
          src={LOGO}
          alt="qori.cc"
          loading="lazy"
          className="qori-logo h-6 w-6 shrink-0 object-contain drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
        />

        {/* Marca + premio */}
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
            Sorteo qori.cc
          </span>
          <span className="whitespace-nowrap text-[12px] font-bold tracking-tight text-emerald-50">
            GTA 6 Ultimate Edition
          </span>
        </span>

        {/* Separador */}
        <span aria-hidden="true" className="hidden h-6 w-px shrink-0 bg-emerald-400/15 sm:block" />

        {/* Countdown */}
        <span className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {units.map((u) => (
            <span key={u.label} className="flex w-6 flex-col items-center leading-none sm:w-7">
              <span className="font-mono text-[13px] font-bold tabular-nums text-emerald-50 transition-transform duration-300 group-hover:scale-110">
                {u.value}
              </span>
              <span className="mt-0.5 text-[7px] font-medium uppercase tracking-[0.12em] text-emerald-400/60">
                {u.label}
              </span>
            </span>
          ))}
        </span>

        {/* CTA: sutil en reposo, se rellena en hover, letras blancas */}
        <span className="ml-1 hidden shrink-0 items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white transition-all duration-300 group-hover:bg-emerald-500 group-hover:shadow-[0_0_16px_rgba(16,185,129,0.5)] md:inline-flex">
          Participar
        </span>
      </div>

      {/* Panel de detalles: se despliega al hacer hover (grid-rows trick) */}
      <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr]">
        <div className="overflow-hidden">
          <div className="mx-auto max-w-6xl border-t border-emerald-400/10 px-4 py-2.5">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {DETAILS.map((d) => (
                <span key={d.label} className="flex flex-col leading-tight">
                  <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-emerald-400/70">
                    {d.label}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-50">{d.value}</span>
                </span>
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] text-emerald-200/50">
              Si no se alcanza el minimo de tickets se reembolsa. Solo mayores de 18. Juega con responsabilidad.
            </p>
          </div>
        </div>
      </div>
    </a>
  )
}

export default SorteoBanner
