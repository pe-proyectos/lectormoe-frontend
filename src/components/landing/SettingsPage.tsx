import React, { useState, useEffect } from 'react'
import { Shield, Bell, Monitor, User as UserIcon, Globe, Save, Loader2, BookOpen, Zap, CreditCard, BarChart3, MessageSquare, Pause, Play, ChevronDown, ChevronUp, AlertTriangle, Ticket, Trophy, RotateCcw, Wallet, Link2, Unlink, RefreshCw, XCircle, ExternalLink, Clock, CheckCircle2 } from 'lucide-react'
import { callAPI } from '../../util/callApi'

interface User {
  id: number
  username: string
  email: string
  imageUrl: string | null
  emailVerified: boolean
  isPublicProfile: boolean
  isPrivateHistory: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  notifyCommentsOnOwnedContent?: boolean
  theme: string
  discordId?: string | null
  discordUsername?: string | null
  discordAvatar?: string | null
  discordVerifiedAt?: string | null
  discordLastCheckAt?: string | null
}

interface EmailPreferences {
  newChapterAlert: boolean
  newMangaRelease: boolean
  dailyDigest: boolean
  weeklyReadingSummary: boolean
  subscriptionReminders: boolean
  readingStreakMilestones: boolean
  reEngagement: boolean
  recommendations: boolean
  commentReplyAlert: boolean
  weeklyOrgReport: boolean
  newSubscriberAlert: boolean
  revenueAlert: boolean
  contentPerformance: boolean
  failedPaymentAlert: boolean
}

interface SettingsPageProps {
  user: User
  language: string
  organizationSlug?: string
  isStaff?: boolean
}

const Toggle: React.FC<{ value: boolean; onChange: () => void }> = ({ value, onChange }) => (
  <button
    onClick={onChange}
    className={`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors ${
      value ? 'bg-cyan-500' : 'bg-zinc-800'
    }`}
  >
    <div className={`w-4 h-4 bg-zinc-950 rounded-full transition-all absolute top-1 ${
      value ? 'right-1' : 'left-1'
    }`} />
  </button>
)

const ToggleRow: React.FC<{
  title: string
  description: string
  value: boolean
  onChange: () => void
  disabled?: boolean
}> = ({ title, description, value, onChange, disabled }) => (
  <div className={`flex items-center justify-between p-6 bg-zinc-950 border border-zinc-800 rounded-[32px] ${disabled ? 'opacity-40' : ''}`}>
    <div>
      <p className="text-white font-bold text-sm">{title}</p>
      <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mt-1">{description}</p>
    </div>
    {!disabled && <Toggle value={value} onChange={onChange} />}
  </div>
)

interface UserSubscription {
  id: number
  status: string
  active: boolean
  startDate: string | null
  endDate: string | null
  nextPayment: string | null
  lastPayment: string | null
  lastAmount: number | null
  cycleExecutions: number
  failedPaymentsCount: number
  paypalSubscriptionId: string
  subscriptionPlan: {
    id: number
    name: string
    price: number
    currency: string
    interval: string
    organization: {
      id: number
      slug: string
      name: string
      logoUrl: string | null
    }
  }
}

interface SubscriptionPayment {
  id: number | string
  transactionDate: string | null
  beforeFeesAmount: number
  amount: number
  currency: string
  status: string
  transactionId: string | null
  source?: 'db' | 'paypal'
}

const formatDateLong = (iso: string | null): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

const formatDateShort = (iso: string | null): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

const formatMoney = (amount: number | null | undefined, currency: string = 'USD'): string => {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `$${amount.toFixed(2)} ${currency}`
}

const intervalLabel = (interval: string): string => {
  switch (interval) {
    case 'DAY': return 'día'
    case 'WEEK': return 'semana'
    case 'MONTH': return 'mes'
    case 'YEAR': return 'año'
    default: return interval.toLowerCase()
  }
}

const AccessBadge: React.FC<{ active: boolean; endDate: string | null; status: string }> = ({ active, endDate, status }) => {
  const upper = (status || '').toUpperCase()
  const isCancelledOrExpired = upper === 'CANCELLED' || upper === 'EXPIRED'
  const now = new Date()
  const end = endDate ? new Date(endDate) : null
  const inGracePeriod = isCancelledOrExpired && active && end && end > now

  if (inGracePeriod) {
    return <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Acceso activo</span>
  }
  if (active) {
    return <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Activa</span>
  }
  return <span className="text-[10px] font-black text-zinc-400 bg-zinc-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Sin acceso</span>
}

const PaypalStatusBadge: React.FC<{ status: string; failed: number }> = ({ status, failed }) => {
  const upper = (status || '').toUpperCase()
  if (upper === 'ACTIVE') {
    return <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Renovación activa</span>
  }
  if (upper === 'CANCELLED') {
    return <span className="text-[9px] font-black text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Renovación cancelada</span>
  }
  if (upper === 'EXPIRED') {
    return <span className="text-[9px] font-black text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Expirada</span>
  }
  if (upper === 'SUSPENDED') {
    if (failed > 0) return <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Pago fallido</span>
    return <span className="text-[9px] font-black text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Pausada</span>
  }
  return null
}

const SubscriptionCard: React.FC<{
  sub: UserSubscription
  payments: SubscriptionPayment[] | null
  paymentsLoading: boolean
  paymentsError: string | null
  expanded: boolean
  onToggleExpand: () => void
  onPause: () => void
  onResume: () => void
  onCancel: () => void
  busy: boolean
}> = ({ sub, payments, paymentsLoading, paymentsError, expanded, onToggleExpand, onPause, onResume, onCancel, busy }) => {
  const status = (sub.status || '').toUpperCase()
  const isCancelled = status === 'CANCELLED' || status === 'EXPIRED'
  const isPaused = status === 'SUSPENDED' && sub.failedPaymentsCount === 0
  const isFailedSuspended = status === 'SUSPENDED' && sub.failedPaymentsCount > 0
  const canPause = status === 'ACTIVE'
  const canResume = isPaused || isFailedSuspended
  const canCancel = status === 'ACTIVE' || status === 'SUSPENDED'
  const org = sub.subscriptionPlan.organization

  const now = new Date()
  const endDate = sub.endDate ? new Date(sub.endDate) : null
  const inGracePeriod = isCancelled && sub.active && endDate && endDate > now

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-[32px] overflow-hidden">
      {/* Header strip */}
      <div className="p-5 flex items-start gap-4">
        <a href={`/${org.slug}`} className="flex-shrink-0">
          {org.logoUrl ? (
            <img src={org.logoUrl} alt={org.name} className="w-14 h-14 rounded-2xl object-cover border border-zinc-800 hover:border-cyan-500 transition-colors" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <CreditCard size={20} className="text-zinc-600" />
            </div>
          )}
        </a>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a href={`/${org.slug}`} className="text-white font-bold text-sm truncate hover:text-cyan-400 transition-colors flex items-center gap-1">
              {org.name} <ExternalLink size={11} className="text-zinc-600" />
            </a>
            <AccessBadge active={sub.active} endDate={sub.endDate} status={sub.status} />
          </div>
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mt-1">
            {sub.subscriptionPlan.name} · {formatMoney(sub.subscriptionPlan.price, sub.subscriptionPlan.currency)}/{intervalLabel(sub.subscriptionPlan.interval)}
          </p>
          <div className="mt-1.5">
            <PaypalStatusBadge status={sub.status} failed={sub.failedPaymentsCount} />
          </div>
        </div>
      </div>

      {/* Grace period banner */}
      {inGracePeriod && endDate && (
        <div className="mx-5 mb-3 flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
          <Clock size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-amber-300 text-[11px] leading-relaxed">
            Cancelaste el cobro recurrente. Tienes acceso hasta el <strong>{formatDateLong(sub.endDate)}</strong>, cuando ya finaliza el período que pagaste.
          </p>
        </div>
      )}

      {/* Failed payment warning */}
      {isFailedSuspended && (
        <div className="mx-5 mb-3 flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
          <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-amber-300 text-[11px] leading-relaxed">
            Tu pago falló {sub.failedPaymentsCount} {sub.failedPaymentsCount === 1 ? 'vez' : 'veces'}. Revisa tu método de pago en PayPal para no perder el acceso.
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="px-5 pb-3 grid sm:grid-cols-3 gap-2 text-xs">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl px-3 py-2.5">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">
            {isCancelled ? 'Acceso hasta' : 'Próximo cobro'}
          </p>
          <p className="text-white font-medium text-sm">
            {isCancelled
              ? (endDate ? formatDateLong(sub.endDate) : '—')
              : formatDateLong(sub.nextPayment)}
          </p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl px-3 py-2.5">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Último pago</p>
          <p className="text-white font-medium text-sm">
            {sub.lastPayment ? formatDateShort(sub.lastPayment) : '—'}
          </p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl px-3 py-2.5">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Monto</p>
          <p className="text-white font-medium text-sm">
            {sub.lastAmount != null ? formatMoney(sub.lastAmount, sub.subscriptionPlan.currency) : '—'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex items-center gap-2 flex-wrap">
        {isCancelled && !inGracePeriod && (
          <span className="text-[10px] font-bold text-zinc-500 italic">Ya no tienes acceso a este scan</span>
        )}
        {canResume && (
          <button
            onClick={onResume}
            disabled={busy}
            className="flex items-center gap-2 bg-cyan-500 text-zinc-950 hover:bg-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={12} /> Reanudar
          </button>
        )}
        {canPause && (
          <button
            onClick={onPause}
            disabled={busy}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Pause size={12} /> Pausar
          </button>
        )}
        {canCancel && (
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex items-center gap-2 bg-transparent border border-red-500/30 hover:border-red-500 text-red-400 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle size={12} /> Cancelar
          </button>
        )}
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-2 bg-transparent border border-zinc-800 hover:border-zinc-600 text-zinc-400 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors ml-auto"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Historial de pagos
        </button>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {paymentsLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={18} className="text-cyan-500 animate-spin" />
            </div>
          )}
          {paymentsError && (
            <p className="text-red-400 text-xs">{paymentsError}</p>
          )}
          {!paymentsLoading && !paymentsError && payments && payments.length === 0 && (
            <p className="text-zinc-500 text-xs italic">Aún no hay pagos registrados.</p>
          )}
          {!paymentsLoading && !paymentsError && payments && payments.length > 0 && (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-zinc-900/40 rounded-2xl border border-zinc-800/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 size={13} className={p.status === 'COMPLETED' || p.status === 'Completed' ? 'text-emerald-400' : 'text-zinc-600'} />
                    <div className="min-w-0">
                      <p className="text-white text-xs font-bold">{formatMoney(p.beforeFeesAmount, p.currency)}</p>
                      <p className="text-zinc-500 text-[10px] font-mono truncate max-w-[140px]" title={p.transactionId ?? ''}>
                        {p.transactionId ? p.transactionId.slice(0, 18) + '…' : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-zinc-300 text-[11px]">{formatDateLong(p.transactionDate)}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <span className={`text-[9px] font-black uppercase tracking-wider ${
                        p.status === 'COMPLETED' || p.status === 'Completed' ? 'text-emerald-400' : 'text-zinc-500'
                      }`}>{p.status}</span>
                      {p.source === 'paypal' && (
                        <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">No confirmado</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const MySubscriptionsSection: React.FC = () => {
  const [subs, setSubs] = useState<UserSubscription[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [paymentsCache, setPaymentsCache] = useState<Record<number, SubscriptionPayment[]>>({})
  const [paymentsLoading, setPaymentsLoading] = useState<Record<number, boolean>>({})
  const [paymentsErrors, setPaymentsErrors] = useState<Record<number, string>>({})
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadSubs = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await callAPI('/api/subscription/me')
      setSubs(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setLoadError(err?.message || 'No se pudieron cargar tus suscripciones.')
      setSubs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSubs() }, [])

  const togglePayments = async (subId: number) => {
    const willExpand = !expanded[subId]
    setExpanded((prev) => ({ ...prev, [subId]: willExpand }))
    if (willExpand && !paymentsCache[subId]) {
      setPaymentsLoading((prev) => ({ ...prev, [subId]: true }))
      setPaymentsErrors((prev) => { const n = { ...prev }; delete n[subId]; return n })
      try {
        const data = await callAPI(`/api/subscription/me/${subId}/payments`)
        setPaymentsCache((prev) => ({ ...prev, [subId]: Array.isArray(data) ? data : [] }))
      } catch (err: any) {
        setPaymentsErrors((prev) => ({ ...prev, [subId]: err?.message || 'No se pudieron cargar los pagos.' }))
      } finally {
        setPaymentsLoading((prev) => ({ ...prev, [subId]: false }))
      }
    }
  }

  const setActive = async (subId: number, active: boolean) => {
    setBusyId(subId)
    setActionError(null)
    try {
      await callAPI(`/api/subscription/me/${subId}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      })
      await loadSubs()
    } catch (err: any) {
      setActionError(err?.message || 'No se pudo actualizar la suscripción.')
    } finally {
      setBusyId(null)
    }
  }

  const cancelSub = async (subId: number) => {
    setBusyId(subId)
    setActionError(null)
    try {
      await callAPI(`/api/subscription/me/${subId}/cancel`, { method: 'DELETE' })
      await loadSubs()
    } catch (err: any) {
      setActionError(err?.message || 'No se pudo cancelar la suscripción.')
    } finally {
      setBusyId(null)
    }
  }

  const handlePause = (sub: UserSubscription) => {
    const ok = typeof window !== 'undefined' && window.confirm(
      `¿Pausar tu suscripción a ${sub.subscriptionPlan.organization.name}?\n\nPayPal dejará de cobrarte temporalmente. Puedes reactivarla cuando quieras desde esta misma sección.`,
    )
    if (!ok) return
    setActive(sub.id, false)
  }

  const handleResume = (sub: UserSubscription) => {
    setActive(sub.id, true)
  }

  const handleCancel = (sub: UserSubscription) => {
    const ok = typeof window !== 'undefined' && window.confirm(
      `¿Cancelar tu suscripción a ${sub.subscriptionPlan.organization.name}?\n\nSeguirás teniendo acceso hasta el final del período que ya pagaste. Esta acción no se puede deshacer.`,
    )
    if (!ok) return
    cancelSub(sub.id)
  }

  // Separate active and inactive subs
  const activeSubs = (subs ?? []).filter((s) => s.active || (s.status !== 'CANCELLED' && s.status !== 'EXPIRED'))
  const inactiveSubs = (subs ?? []).filter((s) => !s.active && (s.status === 'CANCELLED' || s.status === 'EXPIRED'))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard size={16} className="text-cyan-500" />
        <h3 className="text-sm font-black text-white uppercase tracking-wider">Mis suscripciones</h3>
      </div>

      {actionError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs">
          {actionError}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-cyan-500 animate-spin" />
        </div>
      )}

      {!loading && loadError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs">
          {loadError}
        </div>
      )}

      {!loading && !loadError && subs && subs.length === 0 && (
        <div className="p-6 bg-zinc-950 border border-dashed border-zinc-800 rounded-[32px]">
          <p className="text-zinc-400 text-sm">
            No tienes suscripciones activas.{' '}
            <a href="/scans" className="text-cyan-400 font-bold hover:underline">Explora los scans</a>{' '}
            para apoyar a tus traductores favoritos.
          </p>
        </div>
      )}

      {!loading && !loadError && subs && subs.length > 0 && (
        <>
          {activeSubs.length > 0 && (
            <div className="space-y-3">
              {activeSubs.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  sub={sub}
                  payments={paymentsCache[sub.id] ?? null}
                  paymentsLoading={!!paymentsLoading[sub.id]}
                  paymentsError={paymentsErrors[sub.id] ?? null}
                  expanded={!!expanded[sub.id]}
                  onToggleExpand={() => togglePayments(sub.id)}
                  onPause={() => handlePause(sub)}
                  onResume={() => handleResume(sub)}
                  onCancel={() => handleCancel(sub)}
                  busy={busyId === sub.id}
                />
              ))}
            </div>
          )}

          {inactiveSubs.length > 0 && (
            <div className="space-y-2">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest px-1">Historial</p>
              {inactiveSubs.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  sub={sub}
                  payments={paymentsCache[sub.id] ?? null}
                  paymentsLoading={!!paymentsLoading[sub.id]}
                  paymentsError={paymentsErrors[sub.id] ?? null}
                  expanded={!!expanded[sub.id]}
                  onToggleExpand={() => togglePayments(sub.id)}
                  onPause={() => handlePause(sub)}
                  onResume={() => handleResume(sub)}
                  onCancel={() => handleCancel(sub)}
                  busy={busyId === sub.id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface RaffleTicketRow {
  id: number
  number: string
  comment: string | null
  amountPaid: number
  refundedAt: string | null
  createdAt: string
  isWinner: boolean
  raffle: {
    slug: string
    title: string
    imageUrl: string | null
    status: string
    ticketPrice: number
    currency: string
    drawType: string
    drawAt: string | null
    maxTickets: number
  }
}

interface RaffleRefundRow {
  id: number
  ticketNumber: string
  amount: number
  currency: string
  paypalRefundId: string | null
  status: string
  failureReason: string | null
  createdAt: string
  raffle: { slug: string; title: string; imageUrl: string | null }
}

const MyRafflesSection: React.FC = () => {
  const [tickets, setTickets] = useState<RaffleTicketRow[] | null>(null)
  const [refunds, setRefunds] = useState<RaffleRefundRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openTickets, setOpenTickets] = useState(true)
  const [openPast, setOpenPast] = useState(false)
  const [openRefunds, setOpenRefunds] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [t, r] = await Promise.all([
          callAPI('/api/raffle/me/tickets'),
          callAPI('/api/raffle/me/refunds'),
        ])
        setTickets(Array.isArray(t) ? t : [])
        setRefunds(Array.isArray(r) ? r : [])
      } catch (err: any) {
        setError(err?.message || 'No se pudieron cargar tus sorteos.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const active = (tickets ?? []).filter((t) => t.raffle.status === 'active' || t.raffle.status === 'drawing')
  const past = (tickets ?? []).filter((t) => t.raffle.status === 'completed' || t.raffle.status === 'cancelled')

  const TicketRow: React.FC<{ t: RaffleTicketRow }> = ({ t }) => (
    <a
      href={`/luckys/${t.raffle.slug}`}
      className="flex items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-800 rounded-2xl hover:border-yellow-500/40 transition-colors"
    >
      {t.raffle.imageUrl ? (
        <img src={t.raffle.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 flex-shrink-0">🎟️</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{t.raffle.title}</p>
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">
          #{t.number} · {t.amountPaid > 0 ? formatMoney(t.amountPaid, t.raffle.currency) : 'GRATIS'}
        </p>
      </div>
      {t.isWinner && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-400 text-zinc-950 text-[10px] font-black uppercase tracking-widest">
          <Trophy size={10} /> Ganador
        </span>
      )}
      {t.refundedAt && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
          <RotateCcw size={10} /> Reembolsado
        </span>
      )}
    </a>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Ticket size={16} className="text-yellow-400" />
        <h3 className="text-sm font-black text-white uppercase tracking-wider">Mis sorteos</h3>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="text-yellow-500 animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs">{error}</div>
      )}

      {!loading && !error && tickets && tickets.length === 0 && refunds?.length === 0 && (
        <div className="p-6 bg-zinc-950 border border-dashed border-zinc-800 rounded-[32px]">
          <p className="text-zinc-400 text-sm">
            No has participado en ningún sorteo. <a href="/luckys" className="text-yellow-400 font-bold hover:underline">Mira los activos</a>.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          <button
            onClick={() => setOpenTickets((v) => !v)}
            className="w-full flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-zinc-700"
          >
            <span className="text-white font-bold text-sm flex items-center gap-2">
              <Ticket size={14} className="text-emerald-400" /> Tickets activos ({active.length})
            </span>
            {openTickets ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {openTickets && (
            <div className="space-y-2">
              {active.length === 0 && <p className="text-zinc-500 text-xs italic px-2">Sin tickets activos.</p>}
              {active.map((t) => <TicketRow key={t.id} t={t} />)}
            </div>
          )}

          <button
            onClick={() => setOpenPast((v) => !v)}
            className="w-full flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-zinc-700"
          >
            <span className="text-white font-bold text-sm flex items-center gap-2">
              <Trophy size={14} className="text-amber-400" /> Tickets pasados ({past.length})
            </span>
            {openPast ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {openPast && (
            <div className="space-y-2">
              {past.length === 0 && <p className="text-zinc-500 text-xs italic px-2">Sin historial.</p>}
              {past.map((t) => <TicketRow key={t.id} t={t} />)}
            </div>
          )}

          <button
            onClick={() => setOpenRefunds((v) => !v)}
            className="w-full flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-zinc-700"
          >
            <span className="text-white font-bold text-sm flex items-center gap-2">
              <RotateCcw size={14} className="text-cyan-400" /> Reembolsos ({refunds?.length ?? 0})
            </span>
            {openRefunds ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {openRefunds && (
            <div className="space-y-2">
              {(!refunds || refunds.length === 0) && <p className="text-zinc-500 text-xs italic px-2">Sin reembolsos.</p>}
              {refunds && refunds.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
                  {r.raffle.imageUrl ? (
                    <img src={r.raffle.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500">🎟️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{r.raffle.title}</p>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">
                      #{r.ticketNumber} · {formatMoney(r.amount, r.currency)} · {formatDateShort(r.createdAt)}
                    </p>
                    {r.paypalRefundId && <p className="text-[10px] text-zinc-600 font-mono truncate">{r.paypalRefundId}</p>}
                    {r.failureReason && <p className="text-[10px] text-red-400">{r.failureReason}</p>}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                    r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                    r.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

const DISCORD_INVITE = 'https://discord.gg/xJqCWAUxVt'

const discordAvatarUrl = (discordId?: string | null, avatar?: string | null) => {
  if (discordId && avatar) return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`
  return 'https://cdn.discordapp.com/embed/avatars/0.png'
}

const timeAgo = (iso?: string | null): string => {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (diffSec < 60) return `hace ${diffSec}s`
  if (diffSec < 3600) return `hace ${Math.floor(diffSec / 60)}min`
  if (diffSec < 86400) return `hace ${Math.floor(diffSec / 3600)}h`
  return `hace ${Math.floor(diffSec / 86400)}d`
}

const DiscordSection: React.FC<{ user: User }> = ({ user }) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null)
  const [linked, setLinked] = useState<boolean>(!!user.discordId)
  const [profile, setProfile] = useState({
    discordId: user.discordId ?? null,
    discordUsername: user.discordUsername ?? null,
    discordAvatar: user.discordAvatar ?? null,
    discordVerifiedAt: user.discordVerifiedAt ?? null,
    discordLastCheckAt: user.discordLastCheckAt ?? null,
  })
  // Surface the ?discord=... toast that the API callback redirects to.
  const [toast, setToast] = useState<{ kind: 'ok' | 'error' | 'join-required' | 'conflict'; text: string } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const status = params.get('discord')
    if (!status) return
    if (status === 'ok') setToast({ kind: 'ok', text: '¡Discord vinculado correctamente!' })
    else if (status === 'join-required') setToast({ kind: 'join-required', text: 'Únete primero al servidor de CapibaraTraductor y vuelve a intentar.' })
    else if (status === 'conflict') setToast({ kind: 'conflict', text: 'Esa cuenta de Discord ya está vinculada a otro usuario.' })
    else setToast({ kind: 'error', text: `No pudimos vincular tu Discord (${params.get('reason') || 'desconocido'}).` })
    // strip the param so the toast doesn't reappear on refresh
    params.delete('discord')
    params.delete('reason')
    const newQs = params.toString()
    const newUrl = window.location.pathname + (newQs ? `?${newQs}` : '') + window.location.hash
    window.history.replaceState({}, '', newUrl)
  }, [])

  const startLink = async () => {
    setBusy(true); setError(null)
    try {
      const data = await callAPI('/api/discord/oauth-url')
      if (data?.url) window.location.href = data.url
    } catch (err: any) {
      setError(err?.message || 'No se pudo iniciar la vinculación.')
    } finally {
      setBusy(false)
    }
  }

  const reverify = async () => {
    setBusy(true); setError(null); setVerifyMsg(null)
    try {
      const data = await callAPI('/api/discord/verify', { method: 'POST' })
      if (data?.verified) {
        setVerifyMsg('✓ Sigues en el server')
        setProfile((p) => ({ ...p, discordLastCheckAt: new Date().toISOString() }))
      } else if (data?.reason === 'not-linked') {
        setVerifyMsg('No tienes Discord vinculado.')
        setLinked(false)
      } else {
        setVerifyMsg(`✗ Ya no estás en el server, únete: ${DISCORD_INVITE}`)
      }
    } catch (err: any) {
      setError(err?.message || 'Error al verificar.')
    } finally {
      setBusy(false)
    }
  }

  const unlink = async () => {
    if (typeof window !== 'undefined' && !window.confirm('¿Desvincular tu cuenta de Discord?')) return
    setBusy(true); setError(null)
    try {
      await callAPI('/api/discord/me', { method: 'DELETE' })
      setLinked(false)
      setProfile({ discordId: null, discordUsername: null, discordAvatar: null, discordVerifiedAt: null, discordLastCheckAt: null })
      setVerifyMsg(null)
    } catch (err: any) {
      setError(err?.message || 'No se pudo desvincular.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div id="discord" className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare size={16} className="text-indigo-400" />
        <h3 className="text-sm font-black text-white uppercase tracking-wider">Discord</h3>
      </div>

      {toast && (
        <div className={`p-4 rounded-2xl text-xs border ${
          toast.kind === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
          toast.kind === 'join-required' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' :
          toast.kind === 'conflict' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' :
          'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          {toast.text}
          {toast.kind === 'join-required' && (
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="ml-2 underline font-bold">Abrir invitación</a>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs">{error}</div>
      )}

      {!linked && (
        <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-[32px] space-y-4">
          <div>
            <p className="text-white font-bold text-sm">Vincula tu Discord para participar en sorteos</p>
            <p className="text-zinc-500 text-xs mt-1">
              Necesitas estar en el servidor de CapibaraTraductor para comprar tickets de Luckys.
            </p>
          </div>
          <button
            onClick={startLink}
            disabled={busy}
            className="flex items-center gap-2 bg-indigo-500 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-400 transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            Vincular cuenta de Discord
          </button>
        </div>
      )}

      {linked && (
        <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-[32px] space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={discordAvatarUrl(profile.discordId, profile.discordAvatar)}
              alt=""
              className="w-12 h-12 rounded-full object-cover border border-zinc-800"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">@{profile.discordUsername || 'discord'}</p>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mt-1">
                Vinculado el {profile.discordVerifiedAt ? new Date(profile.discordVerifiedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </p>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mt-0.5">
                Verificado: {timeAgo(profile.discordLastCheckAt)}
              </p>
            </div>
          </div>

          {verifyMsg && (
            <div className={`p-3 rounded-xl text-xs ${verifyMsg.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-200'}`}>
              {verifyMsg}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={reverify}
              disabled={busy}
              className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-indigo-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Volver a verificar
            </button>
            <button
              onClick={unlink}
              disabled={busy}
              className="flex items-center gap-2 bg-transparent border border-red-500/40 hover:border-red-500 text-red-400 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              <Unlink size={12} /> Desvincular
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, language, organizationSlug, isStaff = false }) => {
  const [activeTab, setActiveTab] = useState('account')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [settingsData, setSettingsData] = useState({
    isPublicProfile: user.isPublicProfile,
    isPrivateHistory: user.isPrivateHistory,
    emailNotifications: user.emailNotifications,
    pushNotifications: user.pushNotifications,
    notifyCommentsOnOwnedContent: user.notifyCommentsOnOwnedContent ?? true,
  })

  // Email preferences state
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences | null>(null)
  const [emailPrefsLoading, setEmailPrefsLoading] = useState(false)
  const [emailPrefsSaving, setEmailPrefsSaving] = useState(false)

  // Load email preferences when notifications tab is selected
  useEffect(() => {
    if (activeTab === 'notifications' && !emailPrefs) {
      setEmailPrefsLoading(true)
      callAPI('/api/email/preferences')
        .then((data: any) => {
          if (data) setEmailPrefs(data)
        })
        .catch(() => {})
        .finally(() => setEmailPrefsLoading(false))
    }
  }, [activeTab])

  const sections = [
    { id: 'account', label: 'Cuenta', icon: <UserIcon size={18} /> },
    { id: 'appearance', label: 'Apariencia', icon: <Monitor size={18} /> },
    { id: 'notifications', label: 'Notificaciones', icon: <Bell size={18} /> },
    { id: 'privacy', label: 'Privacidad', icon: <Shield size={18} /> },
  ]

  const handleSaveSettings = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      await callAPI(`/api/user/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(settingsData),
      })

      setSuccess('Ajustes guardados correctamente')
      setTimeout(() => { window.location.reload() }, 1000)
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveEmailPrefs = async () => {
    if (!emailPrefs) return
    setEmailPrefsSaving(true)
    setError('')
    setSuccess('')

    try {
      // Save master toggle + the in-app comment-on-owned-content opt-in.
      await callAPI(`/api/user/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          emailNotifications: settingsData.emailNotifications,
          notifyCommentsOnOwnedContent: settingsData.notifyCommentsOnOwnedContent,
        }),
      })

      // Save granular preferences (only boolean fields)
      const prefsToSave: Record<string, boolean> = {}
      for (const [key, value] of Object.entries(emailPrefs)) {
        if (typeof value === 'boolean') prefsToSave[key] = value
      }
      await callAPI('/api/email/preferences', {
        method: 'PATCH',
        body: JSON.stringify(prefsToSave),
      })

      setSuccess('Preferencias de notificacion guardadas')
      setTimeout(() => { window.location.reload() }, 1000)
    } catch (err: any) {
      setError(err.message || 'Error al guardar las preferencias')
    } finally {
      setEmailPrefsSaving(false)
    }
  }

  const updatePref = (key: keyof EmailPreferences) => {
    if (!emailPrefs) return
    setEmailPrefs({ ...emailPrefs, [key]: !emailPrefs[key] })
  }

  return (
    <div className="pt-24 pb-20 min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 md:px-8">

        <div className="mb-12 space-y-1">
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            Ajustes de <span className="text-cyan-500">Configuracion</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium">Gestiona tu experiencia en Capibara Traductor.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-sm">
            {success}
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-10 items-start">

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${
                  activeTab === sec.id
                    ? 'bg-cyan-500 text-zinc-950 shadow-lg shadow-cyan-500/10'
                    : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {sec.icon} {sec.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-8 bg-zinc-900/30 border border-zinc-800 rounded-[40px] p-8 md:p-12">

            {activeTab === 'account' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Correo Electronico</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-6 text-zinc-500 cursor-not-allowed"
                    />
                    <div className="flex items-center gap-2 ml-1">
                      <p className="text-zinc-600 text-xs">El correo no se puede cambiar por ahora</p>
                      {user.emailVerified ? (
                        <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Verificado</span>
                      ) : (
                        <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">No verificado</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-800">
                  <DiscordSection user={user} />
                </div>

                <div className="pt-6 border-t border-zinc-800 space-y-10">
                  <div className="flex items-center gap-2">
                    <Wallet size={18} className="text-cyan-500" />
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Facturación</h2>
                  </div>
                  <MySubscriptionsSection />
                  <div className="pt-6 border-t border-zinc-800/60">
                    <MyRafflesSection />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">Interfaz</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-950 border-2 border-cyan-500 rounded-2xl flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-bold text-white">Modo Oscuro</span>
                      <Monitor size={20} className="text-cyan-500" />
                    </div>
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between opacity-50 cursor-not-allowed">
                      <span className="text-sm font-bold text-zinc-500">Modo Claro</span>
                      <Globe size={20} className="text-zinc-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {emailPrefsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="text-cyan-500 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Master Toggle */}
                    <ToggleRow
                      title="Notificaciones por Email"
                      description="Activar o desactivar todas las notificaciones"
                      value={settingsData.emailNotifications}
                      onChange={() => setSettingsData({ ...settingsData, emailNotifications: !settingsData.emailNotifications })}
                    />

                    {/* In-app preference (independent of email master toggle). */}
                    <ToggleRow
                      title="Comentarios en Contenido Propio"
                      description="Notificarme cuando alguien comente en un manga, capítulo o joint que administro"
                      value={settingsData.notifyCommentsOnOwnedContent}
                      onChange={() => setSettingsData({ ...settingsData, notifyCommentsOnOwnedContent: !settingsData.notifyCommentsOnOwnedContent })}
                    />

                    {settingsData.emailNotifications && emailPrefs && (
                      <>
                        {/* Reader Notifications */}
                        <div className="pt-4">
                          <div className="flex items-center gap-2 mb-4">
                            <BookOpen size={16} className="text-cyan-500" />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Lectura</h3>
                          </div>
                          <div className="space-y-3">
                            <ToggleRow
                              title="Nuevo Capitulo"
                              description="Cuando un manga favorito tiene un nuevo capitulo"
                              value={emailPrefs.newChapterAlert}
                              onChange={() => updatePref('newChapterAlert')}
                            />
                            <ToggleRow
                              title="Nuevo Manga"
                              description="Cuando un grupo que sigues publica un nuevo manga"
                              value={emailPrefs.newMangaRelease}
                              onChange={() => updatePref('newMangaRelease')}
                            />
                            <ToggleRow
                              title="Resumen Diario"
                              description="Resumen diario de capitulos nuevos y recomendaciones"
                              value={emailPrefs.dailyDigest}
                              onChange={() => updatePref('dailyDigest')}
                            />
                            <ToggleRow
                              title="Resumen Semanal"
                              description="Estadisticas semanales de tu lectura"
                              value={emailPrefs.weeklyReadingSummary}
                              onChange={() => updatePref('weeklyReadingSummary')}
                            />
                          </div>
                        </div>

                        {/* Subscription Notifications */}
                        <div className="pt-4">
                          <div className="flex items-center gap-2 mb-4">
                            <CreditCard size={16} className="text-cyan-500" />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Suscripciones</h3>
                          </div>
                          <div className="space-y-3">
                            <ToggleRow
                              title="Recordatorios de Pago"
                              description="Pagos pendientes, fallidos o por vencer"
                              value={emailPrefs.subscriptionReminders}
                              onChange={() => updatePref('subscriptionReminders')}
                            />
                          </div>
                        </div>

                        {/* Engagement */}
                        <div className="pt-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Zap size={16} className="text-cyan-500" />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Engagement</h3>
                          </div>
                          <div className="space-y-3">
                            <ToggleRow
                              title="Racha de Lectura"
                              description="Hitos de tu racha de lectura diaria"
                              value={emailPrefs.readingStreakMilestones}
                              onChange={() => updatePref('readingStreakMilestones')}
                            />
                            <ToggleRow
                              title="Recomendaciones"
                              description="Mangas recomendados basados en tus gustos"
                              value={emailPrefs.recommendations}
                              onChange={() => updatePref('recommendations')}
                            />
                            <ToggleRow
                              title="Re-engagement"
                              description="Recordatorios cuando llevas tiempo sin leer"
                              value={emailPrefs.reEngagement}
                              onChange={() => updatePref('reEngagement')}
                            />
                          </div>
                        </div>

                        {/* Community */}
                        <div className="pt-4">
                          <div className="flex items-center gap-2 mb-4">
                            <MessageSquare size={16} className="text-cyan-500" />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Comunidad</h3>
                          </div>
                          <div className="space-y-3">
                            <ToggleRow
                              title="Respuestas a Comentarios"
                              description="Notificaciones cuando alguien responde a tus comentarios"
                              value={emailPrefs.commentReplyAlert}
                              onChange={() => updatePref('commentReplyAlert')}
                            />
                          </div>
                        </div>

                        {/* Staff Section - only visible to users with admin permissions */}
                        {isStaff && (
                          <div className="pt-4">
                            <div className="flex items-center gap-2 mb-4">
                              <BarChart3 size={16} className="text-cyan-500" />
                              <h3 className="text-sm font-black text-white uppercase tracking-wider">Staff / Admin</h3>
                            </div>
                            <div className="space-y-3">
                              <ToggleRow
                                title="Reporte Semanal"
                                description="Resumen semanal de estadisticas de tu organizacion"
                                value={emailPrefs.weeklyOrgReport}
                                onChange={() => updatePref('weeklyOrgReport')}
                              />
                              <ToggleRow
                                title="Nuevo Suscriptor"
                                description="Cuando alguien se suscribe a tu organizacion"
                                value={emailPrefs.newSubscriberAlert}
                                onChange={() => updatePref('newSubscriberAlert')}
                              />
                              <ToggleRow
                                title="Alertas de Ingresos"
                                description="Resumen de ingresos y transacciones"
                                value={emailPrefs.revenueAlert}
                                onChange={() => updatePref('revenueAlert')}
                              />
                              <ToggleRow
                                title="Rendimiento de Contenido"
                                description="Capitulos y mangas con mejor rendimiento"
                                value={emailPrefs.contentPerformance}
                                onChange={() => updatePref('contentPerformance')}
                              />
                              <ToggleRow
                                title="Pagos Fallidos"
                                description="Cuando un pago de suscripcion falla"
                                value={emailPrefs.failedPaymentAlert}
                                onChange={() => updatePref('failedPaymentAlert')}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Save Button */}
                    <div className="pt-6 border-t border-zinc-800">
                      <button
                        onClick={handleSaveEmailPrefs}
                        disabled={emailPrefsSaving}
                        className="flex items-center gap-3 bg-cyan-500 text-zinc-950 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-xl shadow-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save size={16} /> {emailPrefsSaving ? 'Guardando...' : 'Guardar Preferencias'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ToggleRow
                  title="Perfil Publico"
                  description="Permitir que otros vean tu perfil"
                  value={settingsData.isPublicProfile}
                  onChange={() => setSettingsData({ ...settingsData, isPublicProfile: !settingsData.isPublicProfile })}
                />
                <ToggleRow
                  title="Historial de Lectura Privado"
                  description="Solo tu podras ver tus lecturas"
                  value={settingsData.isPrivateHistory}
                  onChange={() => setSettingsData({ ...settingsData, isPrivateHistory: !settingsData.isPrivateHistory })}
                />

                <div className="pt-6 border-t border-zinc-800">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    className="flex items-center gap-3 bg-cyan-500 text-zinc-950 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-xl shadow-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={16} /> {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>

                {/* Zona de peligro: eliminar la cuenta y los datos asociados. */}
                <div className="pt-6 border-t border-red-500/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">Zona de peligro</p>
                  <p className="text-zinc-500 text-sm mb-3 max-w-md">Elimina tu cuenta y tus datos personales de forma permanente. Esta acción no se puede deshacer.</p>
                  <a href="/eliminar-cuenta" className="inline-flex items-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors">
                    Eliminar mi cuenta
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
