import React, { useState, useEffect } from 'react'
import { Shield, Bell, Monitor, User as UserIcon, Globe, Save, Loader2, BookOpen, Heart, Zap, CreditCard, BarChart3, MessageSquare, Pause, Play, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
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

const StatusBadge: React.FC<{ status: string; failed: number }> = ({ status, failed }) => {
  const upper = (status || '').toUpperCase()
  const isSuspendedByFailed = upper === 'SUSPENDED' || (failed > 0 && upper !== 'ACTIVE' && upper !== 'CANCELLED')

  if (upper === 'ACTIVE') {
    return <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Activa</span>
  }
  if (upper === 'CANCELLED' || upper === 'EXPIRED') {
    return <span className="text-[10px] font-black text-zinc-400 bg-zinc-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Cancelada</span>
  }
  if (isSuspendedByFailed && upper === 'SUSPENDED' && failed > 0) {
    return <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Suspendida</span>
  }
  if (upper === 'SUSPENDED') {
    return <span className="text-[10px] font-black text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Pausada</span>
  }
  return <span className="text-[10px] font-black text-zinc-400 bg-zinc-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">{status || 'Desconocido'}</span>
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
  busy: boolean
}> = ({ sub, payments, paymentsLoading, paymentsError, expanded, onToggleExpand, onPause, onResume, busy }) => {
  const status = (sub.status || '').toUpperCase()
  const isCancelled = status === 'CANCELLED' || status === 'EXPIRED'
  const isPaused = status === 'SUSPENDED' && sub.failedPaymentsCount === 0
  const isFailedSuspended = status === 'SUSPENDED' && sub.failedPaymentsCount > 0
  const canPause = status === 'ACTIVE'
  const canResume = isPaused || isFailedSuspended
  const org = sub.subscriptionPlan.organization

  return (
    <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-[32px] space-y-4">
      <div className="flex items-start gap-4">
        {org.logoUrl ? (
          <img src={org.logoUrl} alt={org.name} className="w-14 h-14 rounded-2xl object-cover border border-zinc-800 flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
            <CreditCard size={20} className="text-zinc-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold text-sm truncate">{org.name}</p>
            <StatusBadge status={sub.status} failed={sub.failedPaymentsCount} />
          </div>
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mt-1">
            {sub.subscriptionPlan.name} · ${sub.subscriptionPlan.price.toFixed(2)} {sub.subscriptionPlan.currency}/{intervalLabel(sub.subscriptionPlan.interval)}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl px-4 py-3">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Próximo cobro</p>
          <p className="text-white font-medium">
            {isCancelled ? '—' : formatDateLong(sub.nextPayment)}
          </p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl px-4 py-3">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Último pago</p>
          <p className="text-white font-medium">
            {sub.lastPayment
              ? `${formatMoney(sub.lastAmount, sub.subscriptionPlan.currency)} el ${formatDateShort(sub.lastPayment)}`
              : '—'}
          </p>
        </div>
      </div>

      {isFailedSuspended && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
          <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-amber-300 text-[11px] leading-relaxed">
            Tu pago falló {sub.failedPaymentsCount} {sub.failedPaymentsCount === 1 ? 'vez' : 'veces'}. Revisa tu método de pago en PayPal.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {isCancelled && (
          <span className="text-[10px] font-bold text-zinc-500 italic">Cancelada — no puede reactivarse</span>
        )}
        {canPause && (
          <button
            onClick={onPause}
            disabled={busy}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-cyan-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Pause size={12} /> Pausar
          </button>
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
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-2 bg-transparent border border-zinc-800 hover:border-zinc-600 text-zinc-300 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors ml-auto"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Ver pagos
        </button>
      </div>

      {expanded && (
        <div className="pt-4 border-t border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">
          {paymentsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-cyan-500 animate-spin" />
            </div>
          )}
          {paymentsError && (
            <p className="text-red-400 text-xs">{paymentsError}</p>
          )}
          {!paymentsLoading && !paymentsError && payments && payments.length === 0 && (
            <p className="text-zinc-500 text-xs italic">Aún no hay pagos registrados.</p>
          )}
          {!paymentsLoading && !paymentsError && payments && payments.length > 0 && (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-zinc-500 text-left">
                    <th className="font-black uppercase tracking-widest text-[9px] px-2 py-2">Fecha</th>
                    <th className="font-black uppercase tracking-widest text-[9px] px-2 py-2">Monto bruto</th>
                    <th className="font-black uppercase tracking-widest text-[9px] px-2 py-2">Comisiones</th>
                    <th className="font-black uppercase tracking-widest text-[9px] px-2 py-2">Neto al scan</th>
                    <th className="font-black uppercase tracking-widest text-[9px] px-2 py-2">Estado</th>
                    <th className="font-black uppercase tracking-widest text-[9px] px-2 py-2">ID</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  {payments.map((p) => {
                    const fees = p.beforeFeesAmount - p.amount
                    return (
                      <tr key={p.id} className="border-t border-zinc-800/60">
                        <td className="px-2 py-2 whitespace-nowrap">{formatDateShort(p.transactionDate)}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{formatMoney(p.beforeFeesAmount, p.currency)}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-zinc-500">{formatMoney(fees, p.currency)}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-white font-medium">{formatMoney(p.amount, p.currency)}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className="text-[9px] font-black uppercase tracking-wider">{p.status}</span>
                          {p.source === 'paypal' && (
                            <span className="ml-1 text-[8px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Pendiente</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-zinc-500 truncate max-w-[120px]" title={p.transactionId ?? ''}>
                          {p.transactionId ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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

  const handlePause = (sub: UserSubscription) => {
    const ok = typeof window !== 'undefined' && window.confirm(
      `¿Pausar tu suscripción a ${sub.subscriptionPlan.organization.name}? PayPal dejará de cobrarte. Puedes reactivarla cuando quieras.`,
    )
    if (!ok) return
    setActive(sub.id, false)
  }

  const handleResume = (sub: UserSubscription) => {
    setActive(sub.id, true)
  }

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
            No tienes suscripciones activas. Suscríbete a un scan para apoyar a tus traductores favoritos.
          </p>
        </div>
      )}

      {!loading && !loadError && subs && subs.length > 0 && (
        <div className="space-y-3">
          {subs.map((sub) => (
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
              busy={busyId === sub.id}
            />
          ))}
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
                  <MySubscriptionsSection />
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
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
