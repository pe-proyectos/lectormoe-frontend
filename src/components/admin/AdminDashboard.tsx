import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { ResponsiveTreeMap } from '@nivo/treemap'
import { ResponsivePie } from '@nivo/pie'
import { ResponsiveLine } from '@nivo/line'
import { ResponsiveBar } from '@nivo/bar'
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  BookOpen,
  Search,
  Loader2,
  Monitor,
  Globe,
  UserPlus,
  BarChart3,
  Activity,
  LogIn,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Mail,
  CheckCircle,
  XCircle,
  Percent,
  Flame,
} from 'lucide-react'
import { DatePicker } from '../DatePicker'
import { callAPI } from '../../util/callApi'
import Card from './ui/Card'

interface AdminDashboardProps {
  organization: any
  language?: string
  organizationSlug: string
}

interface SummaryData {
  total_views: number
  unique_visitors: number
  total_chapter_reads: number
  total_mangas: number
  total_events: number
}

interface ComparisonData {
  previous: {
    total_views: number
    unique_visitors: number
    total_chapter_reads: number
    total_events: number
  }
  changes: {
    total_views: number
    unique_visitors: number
    total_chapter_reads: number
    total_events: number
  }
}

interface TopChapter {
  manga: string
  chapter: number
  title: string
  label: string
  reads: number
}

interface StatsData {
  manga_views_treemap?: Array<{ x: string; y: number }>
  view_manga_profile?: { series: number[]; labels: string[] }
  view_manga_search?: { series: number[]; labels: string[] }
  view_login_page?: { series: number[]; labels: string[] }
  view_register_page?: { series: number[]; labels: string[] }
  action_search_manga?: { series: number[]; labels: string[] }
  view_manga_chapter?: { series: number[]; labels: string[] }
  action_login?: { series: number[]; labels: string[] }
  action_register?: { series: number[]; labels: string[] }
  summary?: SummaryData
  comparison?: ComparisonData
  unique_visitors_over_time?: { series: number[]; labels: string[] }
  device_distribution?: Array<{ id: string; label: string; value: number }>
  browser_distribution?: Array<{ id: string; label: string; value: number }>
  top_chapters?: TopChapter[]
  new_users_over_time?: { series: number[]; labels: string[] }
}

interface SubscriptionStats {
  activeSubscriptions: number
  inactiveSubscriptions: number
  paidThisMonth: number
  notPaidThisMonth: number
  expectedRevenue: number
  totalSubscriptions: number
  planDistribution: Array<{ planName: string; planPrice: number; netAmount: number; subscriberCount: number }>
}

interface MonthlyRevenue {
  month: string
  year: number
  revenue: number
  transactionCount: number
  subscriptionPayments: number
}

interface EmailStats {
  totalSent: number
  totalFailed: number
  deliveryRate: number
  emailsOverTime: Array<{ date: string; sent: number; failed: number }>
  typeDistribution: Array<{ id: string; label: string; value: number }>
}

interface EngagementStats {
  activeReaders: number
  totalChaptersRead: number
  avgChaptersPerReader: number
  readingOverTime: Array<{ date: string; chapters: number; readers: number }>
  topReaders: Array<{ id: number; username: string; slug: string; imageUrl: string | null; chaptersRead: number }>
}

type DatePreset = '7d' | '14d' | '30d' | '90d' | 'custom'

const nivoTheme = {
  background: 'transparent',
  textColor: '#71717a',
  fontSize: 11,
  axis: {
    domain: { line: { stroke: '#27272a', strokeWidth: 1 } },
    ticks: { line: { stroke: '#27272a', strokeWidth: 1 } },
  },
  grid: { line: { stroke: '#27272a', strokeWidth: 1 } },
  tooltip: {
    container: {
      background: '#18181b',
      color: '#f4f4f5',
      fontSize: 12,
      borderRadius: '8px',
      border: '1px solid #27272a',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    },
  },
}

const cyanPalette = ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#083344']
const multiPalette = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#3b82f6', '#f97316']

const AdminDashboard: React.FC<AdminDashboardProps> = ({ organization, language, organizationSlug }) => {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [preset, setPreset] = useState<DatePreset>('7d')
  const [from, setFrom] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const [to, setTo] = useState(() => new Date())
  const [subStats, setSubStats] = useState<SubscriptionStats | null>(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null)
  const [engagementStats, setEngagementStats] = useState<EngagementStats | null>(null)

  const applyPreset = useCallback((p: DatePreset) => {
    setPreset(p)
    if (p !== 'custom') {
      const days = p === '7d' ? 7 : p === '14d' ? 14 : p === '30d' ? 30 : 90
      setFrom(new Date(Date.now() - days * 24 * 60 * 60 * 1000))
      setTo(new Date())
    }
  }, [])

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.append('from', from.toISOString())
    params.append('to', to.toISOString())
    const queryStr = params.toString()

    Promise.all([
      callAPI(`/api/analytics?${queryStr}`).then((data) => setStats(data)),
      callAPI(`/api/email-statistics?${queryStr}`).then((data) => setEmailStats(data)).catch(() => {}),
      callAPI(`/api/engagement-statistics?${queryStr}`).then((data) => setEngagementStats(data)).catch(() => {}),
    ])
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoading(false))
  }, [from, to])

  // Fetch subscription and revenue data
  useEffect(() => {
    callAPI('/api/subscription-statistics')
      .then((data) => setSubStats(data))
      .catch(() => {})
    callAPI('/api/monthly-revenue')
      .then((data) => { if (Array.isArray(data)) setMonthlyRevenue(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatNumber = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n.toLocaleString()
  }

  const formatCurrency = (n: number): string => `$${n.toFixed(2)}`

  // ── Change Badge ──
  const ChangeBadge: React.FC<{ value: number }> = ({ value }) => {
    if (value === 0) return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-md">
        <Minus size={10} /> 0%
      </span>
    )
    const isPositive = value > 0
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
        {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {isPositive ? '+' : ''}{value}%
      </span>
    )
  }

  // ── Stat Card with comparison ──
  const StatCard: React.FC<{
    title: string
    value: number
    icon: React.ElementType
    color: string
    change?: number
    prevValue?: number
  }> = ({ title, value, icon: Icon, color, change, prevValue }) => (
    <Card className="flex-1 min-w-[140px]">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">{title}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-black text-white tracking-tight">{formatNumber(value)}</p>
            {change !== undefined && <ChangeBadge value={change} />}
          </div>
          {prevValue !== undefined && prevValue > 0 && (
            <p className="text-[10px] text-zinc-600 mt-0.5">Ant: {formatNumber(prevValue)}</p>
          )}
        </div>
      </div>
    </Card>
  )

  // ── Line Chart Card ──
  const LineChartCard: React.FC<{
    title: string; icon: React.ElementType; data: number[]; labels: string[]; color?: string; height?: number
  }> = ({ title, icon: Icon, data, labels, color = '#06b6d4', height = 250 }) => {
    if (!data?.length || !labels?.length) {
      return (
        <Card className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg"><Icon size={18} className="text-cyan-500" /></div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">{title}</h3>
          </div>
          <div className="flex items-center justify-center text-zinc-600 text-sm" style={{ height }}>Sin datos disponibles</div>
        </Card>
      )
    }
    const total = data.reduce((a, b) => a + b, 0)
    return (
      <Card className="flex-1 min-w-[300px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg"><Icon size={18} className="text-cyan-500" /></div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">{title}</h3>
          </div>
          <span className="text-lg font-black text-white">{formatNumber(total)}</span>
        </div>
        <div style={{ height }}>
          <ResponsiveLine
            data={[{ id: title, data: labels.map((l, i) => ({ x: l, y: data[i] || 0 })) }]}
            margin={{ top: 10, right: 20, bottom: 40, left: 45 }}
            xScale={{ type: 'point' }} yScale={{ type: 'linear', min: 0, max: 'auto' }}
            curve="monotoneX"
            axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: -45 }}
            axisLeft={{ tickSize: 0, tickPadding: 8 }}
            colors={[color]} pointSize={5} pointColor={color}
            pointBorderWidth={2} pointBorderColor={{ from: 'serieColor' }}
            enableArea areaOpacity={0.08} useMesh theme={nivoTheme}
          />
        </div>
      </Card>
    )
  }

  // ── Bar Chart Card ──
  const BarChartCard: React.FC<{
    title: string; icon: React.ElementType; data: number[]; labels: string[]; color?: string; height?: number
  }> = ({ title, icon: Icon, data, labels, color = '#06b6d4', height = 250 }) => {
    if (!data?.length || !labels?.length) {
      return (
        <Card className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg"><Icon size={18} className="text-cyan-500" /></div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">{title}</h3>
          </div>
          <div className="flex items-center justify-center text-zinc-600 text-sm" style={{ height }}>Sin datos disponibles</div>
        </Card>
      )
    }
    const total = data.reduce((a, b) => a + b, 0)
    const chartData = labels.map((l, i) => ({ label: l, value: data[i] || 0 }))
    return (
      <Card className="flex-1 min-w-[300px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg"><Icon size={18} className="text-cyan-500" /></div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">{title}</h3>
          </div>
          <span className="text-lg font-black text-white">{formatNumber(total)}</span>
        </div>
        <div style={{ height }}>
          <ResponsiveBar data={chartData} keys={['value']} indexBy="label"
            margin={{ top: 10, right: 20, bottom: 40, left: 45 }} padding={0.3}
            colors={[color]} borderRadius={4}
            axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: -45 }}
            axisLeft={{ tickSize: 0, tickPadding: 8 }}
            labelSkipWidth={12} labelSkipHeight={12} labelTextColor="#18181b" theme={nivoTheme}
          />
        </div>
      </Card>
    )
  }

  // ── Pie Chart Card ──
  const PieChartCard: React.FC<{
    title: string; icon: React.ElementType; data: Array<{ id: string; label: string; value: number }>; height?: number; colors?: string[]
  }> = ({ title, icon: Icon, data, height = 300, colors = multiPalette }) => {
    if (!data?.length) {
      return (
        <Card className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg"><Icon size={18} className="text-cyan-500" /></div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">{title}</h3>
          </div>
          <div className="flex items-center justify-center text-zinc-600 text-sm" style={{ height }}>Sin datos disponibles</div>
        </Card>
      )
    }
    return (
      <Card className="flex-1 min-w-[280px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-cyan-500/10 rounded-lg"><Icon size={18} className="text-cyan-500" /></div>
          <h3 className="text-sm font-black text-white uppercase tracking-tight">{title}</h3>
        </div>
        <div style={{ height }}>
          <ResponsivePie data={data} margin={{ top: 30, right: 80, bottom: 30, left: 80 }}
            innerRadius={0.55} padAngle={1} cornerRadius={4} colors={colors}
            borderWidth={1} borderColor="#27272a"
            arcLinkLabelsSkipAngle={10} arcLinkLabelsTextColor="#a1a1aa"
            arcLinkLabelsThickness={2} arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={10} arcLabelsTextColor="#18181b" theme={nivoTheme}
          />
        </div>
      </Card>
    )
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-cyan-500 animate-spin" />
          <span className="text-zinc-400 font-medium">Cargando estadisticas...</span>
        </div>
      </div>
    )
  }

  const summary = stats?.summary
  const comparison = stats?.comparison

  const presetButtons: { key: DatePreset; label: string }[] = [
    { key: '7d', label: '7 dias' },
    { key: '14d', label: '14 dias' },
    { key: '30d', label: '30 dias' },
    { key: '90d', label: '90 dias' },
    { key: 'custom', label: 'Personalizado' },
  ]

  return (
    <div className="p-3 sm:p-4 md:p-8 space-y-5">
      {/* ═══════════════ Date Filters ═══════════════ */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-cyan-500 flex-shrink-0" />
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Rango de Fechas</h2>
          </div>
          {loading && <Loader2 size={18} className="text-cyan-500 animate-spin" />}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {presetButtons.map(({ key, label }) => (
            <button key={key} onClick={() => applyPreset(key)} disabled={loading}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${preset === key ? 'bg-cyan-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}`}
            >{label}</button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Desde</label>
              <DatePicker language={language} value={from} onChange={setFrom} disabled={loading} />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Hasta</label>
              <DatePicker language={language} value={to} onChange={setTo} disabled={loading} />
            </div>
          </div>
        )}
      </Card>

      {/* ═══════════════ Summary Stat Cards with Comparison ═══════════════ */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard title="Vistas Totales" value={summary.total_views} icon={Eye} color="bg-cyan-600"
            change={comparison?.changes.total_views} prevValue={comparison?.previous.total_views} />
          <StatCard title="Visitantes Unicos" value={summary.unique_visitors} icon={Users} color="bg-violet-600"
            change={comparison?.changes.unique_visitors} prevValue={comparison?.previous.unique_visitors} />
          <StatCard title="Lecturas de Caps" value={summary.total_chapter_reads} icon={BookOpen} color="bg-amber-600"
            change={comparison?.changes.total_chapter_reads} prevValue={comparison?.previous.total_chapter_reads} />
          <StatCard title="Total Mangas" value={summary.total_mangas} icon={BarChart3} color="bg-emerald-600" />
          <StatCard title="Total Eventos" value={summary.total_events} icon={Activity} color="bg-rose-600"
            change={comparison?.changes.total_events} prevValue={comparison?.previous.total_events} />
        </div>
      )}

      {/* ═══════════════ Period Comparison Detail ═══════════════ */}
      {comparison && summary && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <TrendingUp size={18} className="text-cyan-500" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Comparacion vs Periodo Anterior</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Vistas', current: summary.total_views, prev: comparison.previous.total_views, change: comparison.changes.total_views, icon: Eye },
              { label: 'Visitantes', current: summary.unique_visitors, prev: comparison.previous.unique_visitors, change: comparison.changes.unique_visitors, icon: Users },
              { label: 'Lecturas', current: summary.total_chapter_reads, prev: comparison.previous.total_chapter_reads, change: comparison.changes.total_chapter_reads, icon: BookOpen },
              { label: 'Eventos', current: summary.total_events, prev: comparison.previous.total_events, change: comparison.changes.total_events, icon: Activity },
            ].map((item) => {
              const Icon = item.icon
              const isUp = item.change > 0
              const isDown = item.change < 0
              return (
                <div key={item.label} className="bg-zinc-800/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={14} className="text-zinc-500" />
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{item.label}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-lg font-black text-white">{formatNumber(item.current)}</p>
                      <p className="text-xs text-zinc-600">vs {formatNumber(item.prev)}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-bold ${isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-zinc-500'}`}>
                      {isUp ? <TrendingUp size={16} /> : isDown ? <TrendingDown size={16} /> : <Minus size={16} />}
                      <span>{item.change > 0 ? '+' : ''}{item.change}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ═══════════════ Subscription & Revenue ═══════════════ */}
      {(subStats || monthlyRevenue.length > 0) && (
        <>
          {subStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Card className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-green-600"><Users size={20} className="text-white" /></div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Suscriptores Activos</p>
                    <p className="text-2xl font-black text-white">{subStats.activeSubscriptions}</p>
                  </div>
                </div>
              </Card>
              <Card className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-600"><CreditCard size={20} className="text-white" /></div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pagaron Este Mes</p>
                    <p className="text-2xl font-black text-white">{subStats.paidThisMonth}</p>
                  </div>
                </div>
              </Card>
              <Card className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-600"><CreditCard size={20} className="text-white" /></div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sin Pago Este Mes</p>
                    <p className="text-2xl font-black text-white">{subStats.notPaidThisMonth}</p>
                  </div>
                </div>
              </Card>
              <Card className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600"><DollarSign size={20} className="text-white" /></div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ingreso Esperado</p>
                    <p className="text-2xl font-black text-emerald-400">{formatCurrency(subStats.expectedRevenue)}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Monthly Revenue Bar Chart - Full Width */}
          {monthlyRevenue.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg"><DollarSign size={18} className="text-cyan-500" /></div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Ingresos Mensuales</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total anual</p>
                  <span className="text-lg font-black text-emerald-400">
                    {formatCurrency(monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0))}
                  </span>
                </div>
              </div>
              <div style={{ height: 350 }}>
                <ResponsiveBar
                  data={monthlyRevenue.map(m => ({ label: `${m.month.substring(0, 3)} ${m.year}`, value: parseFloat(m.revenue.toFixed(2)) }))}
                  keys={['value']} indexBy="label"
                  margin={{ top: 10, right: 20, bottom: 50, left: 60 }}
                  padding={0.3} colors={['#10b981']} borderRadius={4}
                  axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: -45 }}
                  axisLeft={{ tickSize: 0, tickPadding: 8, format: (v) => `$${v}` }}
                  labelSkipWidth={12} labelSkipHeight={12}
                  label={(d) => `$${d.value}`}
                  labelTextColor="#18181b" theme={nivoTheme}
                />
              </div>
            </Card>
          )}

          {/* Plan Distribution Pie Chart */}
          {subStats && subStats.planDistribution.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <PieChartCard
                title="Suscriptores por Plan"
                icon={Users}
                data={subStats.planDistribution.map(p => ({
                  id: p.planName,
                  label: `${p.planName} ($${p.planPrice})`,
                  value: p.subscriberCount,
                }))}
                colors={['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444']}
              />
            </div>
          )}
        </>
      )}

      {/* ═══════════════ Main Charts: Visitors + Chapter Reads ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <LineChartCard title="Visitantes Unicos por Dia" icon={Users}
          data={stats?.unique_visitors_over_time?.series || []}
          labels={stats?.unique_visitors_over_time?.labels || []} color="#8b5cf6" height={280} />
        <LineChartCard title="Lecturas de Capitulos" icon={BookOpen}
          data={stats?.view_manga_chapter?.series || []}
          labels={stats?.view_manga_chapter?.labels || []} color="#f59e0b" height={280} />
      </div>

      {/* ═══════════════ Popularity: TreeMap + Pie ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg"><TrendingUp size={18} className="text-cyan-500" /></div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Popularidad por Vistas</h3>
          </div>
          <div style={{ height: '380px' }}>
            {stats?.manga_views_treemap?.length ? (
              <ResponsiveTreeMap
                data={{ name: 'mangas', children: stats.manga_views_treemap.map((item) => ({ name: item.x, value: item.y })) }}
                identity="name" value="value"
                label="id"
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                labelSkipSize={12} labelTextColor="#18181b" parentLabelTextColor="#ffffff"
                colors={cyanPalette} borderColor="#27272a"
                theme={nivoTheme}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">Sin datos disponibles</div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg"><BookOpen size={18} className="text-cyan-500" /></div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Top 6 Mas Vistos</h3>
          </div>
          <div style={{ height: '380px' }}>
            {stats?.manga_views_treemap?.length ? (
              <ResponsivePie
                data={stats.manga_views_treemap.slice(0, 6).map((item, i) => ({
                  id: `${i + 1}. ${item.x}`, label: `${i + 1}. ${item.x}`, value: item.y,
                }))}
                margin={{ top: 40, right: 80, bottom: 60, left: 80 }}
                innerRadius={0.5} padAngle={0.7} cornerRadius={4} colors={cyanPalette}
                borderWidth={1} borderColor="#27272a"
                arcLinkLabelsSkipAngle={10} arcLinkLabelsTextColor="#a1a1aa"
                arcLinkLabelsThickness={2} arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10} arcLabelsTextColor="#18181b" theme={nivoTheme}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">Sin datos disponibles</div>
            )}
          </div>
        </Card>
      </div>

      {/* ═══════════════ Top Chapters Table ═══════════════ */}
      {stats?.top_chapters && stats.top_chapters.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg"><BookOpen size={18} className="text-cyan-500" /></div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Top Capitulos Mas Leidos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">#</th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Manga</th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Capitulo</th>
                  <th className="text-right py-2.5 px-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Lecturas</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_chapters.map((ch, i) => (
                  <tr key={`${ch.manga}-${ch.chapter}`} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-zinc-500 font-bold">{i + 1}</td>
                    <td className="py-2.5 px-3 text-white font-medium truncate max-w-[200px]">{ch.manga}</td>
                    <td className="py-2.5 px-3 text-zinc-300">
                      <span className="text-cyan-400 font-bold">#{ch.chapter}</span>
                      {ch.title && ch.title !== `Cap. ${ch.chapter}` && <span className="text-zinc-500 ml-2">- {ch.title}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="bg-cyan-500/10 text-cyan-400 text-xs font-bold px-2 py-1 rounded-md">{formatNumber(ch.reads)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ═══════════════ Device & Browser Distribution ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <PieChartCard title="Distribucion por Dispositivo" icon={Monitor}
          data={stats?.device_distribution || []} colors={['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981']} />
        <PieChartCard title="Distribucion por Navegador" icon={Globe}
          data={stats?.browser_distribution || []} />
      </div>

      {/* ═══════════════ User Growth + Profile Views ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <LineChartCard title="Nuevos Registros" icon={UserPlus}
          data={stats?.new_users_over_time?.series || []}
          labels={stats?.new_users_over_time?.labels || []} color="#10b981" />
        <LineChartCard title="Vistas de Perfiles" icon={Eye}
          data={stats?.view_manga_profile?.series || []}
          labels={stats?.view_manga_profile?.labels || []} color="#06b6d4" />
      </div>

      {/* ═══════════════ Search & Auth Activity ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <BarChartCard title="Busquedas Realizadas" icon={Search}
          data={stats?.action_search_manga?.series || []}
          labels={stats?.action_search_manga?.labels || []} color="#f59e0b" />
        <BarChartCard title="Inicios de Sesion" icon={LogIn}
          data={stats?.action_login?.series || []}
          labels={stats?.action_login?.labels || []} color="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <LineChartCard title="Vistas de Login" icon={LogIn}
          data={stats?.view_login_page?.series || []}
          labels={stats?.view_login_page?.labels || []} color="#ef4444" />
        <LineChartCard title="Vistas de Registro" icon={UserPlus}
          data={stats?.view_register_page?.series || []}
          labels={stats?.view_register_page?.labels || []} color="#10b981" />
      </div>

      {/* ═══════════════ Email Statistics ═══════════════ */}
      {emailStats && (
        <>
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-500/10 rounded-lg"><Mail size={18} className="text-cyan-500" /></div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Estadisticas de Email</h3>
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <StatCard title="Emails Enviados" value={emailStats.totalSent} icon={CheckCircle} color="bg-emerald-600" />
            <StatCard title="Emails Fallidos" value={emailStats.totalFailed} icon={XCircle} color="bg-red-600" />
            <Card className="flex-1 min-w-[140px]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-600">
                  <Percent size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">Tasa de Entrega</p>
                  <p className="text-2xl font-black text-white tracking-tight">{emailStats.deliveryRate}%</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <LineChartCard title="Emails por Dia" icon={Mail}
              data={emailStats.emailsOverTime.map(d => d.sent)}
              labels={emailStats.emailsOverTime.map(d => {
                const date = new Date(d.date)
                return `${date.getDate()}/${date.getMonth() + 1}`
              })}
              color="#10b981" height={250} />
            <PieChartCard title="Distribucion por Tipo" icon={Mail}
              data={emailStats.typeDistribution} height={250} />
          </div>
        </>
      )}

      {/* ═══════════════ Engagement Statistics ═══════════════ */}
      {engagementStats && (
        <>
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-500/10 rounded-lg"><Flame size={18} className="text-cyan-500" /></div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Engagement de Usuarios</h3>
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <StatCard title="Lectores Activos" value={engagementStats.activeReaders} icon={Users} color="bg-violet-600" />
            <StatCard title="Capitulos Leidos" value={engagementStats.totalChaptersRead} icon={BookOpen} color="bg-amber-600" />
            <Card className="flex-1 min-w-[140px]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-600">
                  <BarChart3 size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">Caps/Lector Promedio</p>
                  <p className="text-2xl font-black text-white tracking-tight">{engagementStats.avgChaptersPerReader}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <LineChartCard title="Actividad de Lectura por Dia" icon={BookOpen}
              data={engagementStats.readingOverTime.map(d => d.chapters)}
              labels={engagementStats.readingOverTime.map(d => {
                const date = new Date(d.date)
                return `${date.getDate()}/${date.getMonth() + 1}`
              })}
              color="#f59e0b" height={250} />
            <LineChartCard title="Lectores Unicos por Dia" icon={Users}
              data={engagementStats.readingOverTime.map(d => d.readers)}
              labels={engagementStats.readingOverTime.map(d => {
                const date = new Date(d.date)
                return `${date.getDate()}/${date.getMonth() + 1}`
              })}
              color="#8b5cf6" height={250} />
          </div>

          {/* Top Readers Table */}
          {engagementStats.topReaders.length > 0 && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-500/10 rounded-lg"><Flame size={18} className="text-cyan-500" /></div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Top 10 Lectores del Periodo</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-2.5 px-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">#</th>
                      <th className="text-left py-2.5 px-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Usuario</th>
                      <th className="text-right py-2.5 px-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Capitulos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {engagementStats.topReaders.map((reader, i) => (
                      <tr key={reader.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                        <td className="py-2.5 px-3 text-zinc-500 font-bold">{i + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center text-zinc-400 font-bold text-xs">
                              {reader.imageUrl ? (
                                <img src={reader.imageUrl} alt={reader.username} className="w-full h-full object-cover" />
                              ) : (
                                reader.username[0].toUpperCase()
                              )}
                            </div>
                            <span className="text-white font-medium">{reader.username}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="bg-cyan-500/10 text-cyan-400 text-xs font-bold px-2 py-1 rounded-md">{reader.chaptersRead}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default AdminDashboard
