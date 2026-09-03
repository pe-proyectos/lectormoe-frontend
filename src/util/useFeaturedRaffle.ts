import { useEffect, useState } from 'react'

// Consume el sorteo destacado de qori.cc. Fuente unica de verdad para la tira
// (SorteoBanner) y el modal (SorteoModal): al cambiar el sorteo en qori, aqui
// se actualiza solo. CORS abierto y Cache-Control 60s, asi que consumimos
// directo desde el cliente. Si no hay sorteo (raffle: null) o falla el fetch,
// los componentes se ocultan.
const ENDPOINT = 'https://qori.cc/api/public/v1/raffles/featured'

export interface FeaturedRaffle {
  id: string
  slug: string
  url: string
  status: string
  prize: {
    name: string
    imageUrl: string
    valueAmount: number
    currency: string
  }
  endsAt: string
  drawTimezone: string
  ticketPriceAmount: number
  minTickets: number
  maxTickets: number
  soldTickets: number
  cashAlternative: boolean
  sameDayDelivery: boolean
  provablyFair: boolean
  minAge: number
}

interface State {
  raffle: FeaturedRaffle | null
  skew: number // serverNow - Date.now(), en ms, para sincronizar el countdown
  ready: boolean
}

export function useFeaturedRaffle(): State {
  const [state, setState] = useState<State>({
    raffle: null,
    skew: 0,
    ready: false
  })

  useEffect(() => {
    let alive = true
    fetch(ENDPOINT, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return
        if (!data) {
          setState({ raffle: null, skew: 0, ready: true })
          return
        }
        const skew =
          typeof data.serverNow === 'string'
            ? Date.parse(data.serverNow) - Date.now()
            : 0
        const raffle: FeaturedRaffle | null = data.raffle ?? null
        setState({
          raffle: raffle && raffle.status === 'open' ? raffle : null,
          skew,
          ready: true
        })
      })
      .catch(() => {
        if (alive) setState({ raffle: null, skew: 0, ready: true })
      })
    return () => {
      alive = false
    }
  }, [])

  return state
}

// Scans inscritos en el programa de referidos de qori.cc (los que aceptaron).
// Se amplia agregando el slug del scan a este set.
const REFERRAL_ENROLLED = new Set<string>(['senshimanga', 'breakscan'])

// Si quien hace clic esta en una pagina de un scan inscrito, agrega su codigo
// de referido (?ref=<slug>) a la URL del sorteo. El scan se detecta desde la
// ruta actual (/{slug}/... o /red/{slug}/...), evaluada al momento del clic.
export function withReferral(baseUrl: string): string {
  try {
    const parts = window.location.pathname.split('/').filter(Boolean)
    const slug = parts[0] === 'red' ? parts[1] : parts[0]
    if (!slug || !REFERRAL_ENROLLED.has(slug)) return baseUrl
    const u = new URL(baseUrl)
    u.searchParams.set('ref', slug)
    return u.toString()
  } catch {
    return baseUrl
  }
}

export function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

// Titulo sin el prefijo "Sorteo " que ya aporta la marca en la UI.
export function prizeTitle(name: string): string {
  return name.replace(/^sorteo\s+/i, '').trim()
}

// Etiqueta de dinero: "USD 100", "USD 1".
export function money(amount: number, currency: string): string {
  return `${currency} ${amount}`
}

// Probabilidades por ticket: "1/50 a 1/150 por ticket".
export function oddsLabel(min: number, max: number): string {
  return `1/${min} a 1/${max} por ticket`
}

// Fecha del sorteo en la zona horaria del sorteo. Devuelve dia y hora ya
// formateados (ej. "Sabado 5 set." y "14:02"). Sin acentos raros ni depender
// del locale del dispositivo mas alla del idioma.
export function drawLabels(
  endsAt: string,
  tz: string
): { day: string; time: string } {
  const d = new Date(endsAt)
  try {
    const day = new Intl.DateTimeFormat('es-PE', {
      timeZone: tz,
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    })
      .format(d)
      .replace(/,/g, '')
    const time = new Intl.DateTimeFormat('es-PE', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d)
    // Capitaliza la primera letra (weekday viene en minuscula).
    return { day: day.charAt(0).toUpperCase() + day.slice(1), time }
  } catch {
    return { day: '', time: '' }
  }
}
