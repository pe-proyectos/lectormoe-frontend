import React, { useState, useEffect } from 'react'
import { Shield, Bell, Monitor, User as UserIcon, Globe, Save, Loader2, BookOpen, Heart, Zap, CreditCard, BarChart3, MessageSquare } from 'lucide-react'
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
      // Save master toggle
      await callAPI(`/api/user/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ emailNotifications: settingsData.emailNotifications }),
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
