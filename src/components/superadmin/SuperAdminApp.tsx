import React, { useState, useEffect, useCallback } from 'react';
import SuperadminCreateScan from '../admin/SuperadminCreateScan';
import SuperadminUsers from '../admin/SuperadminUsers';
import SuperadminSubscriptions from '../admin/SuperadminSubscriptions';
import SuperadminRaffles from '../admin/SuperadminRaffles';
import { useDialog } from '../ui/useDialog';

const API = import.meta.env.PUBLIC_API_URL as string;

// ── Types ─────────────────────────────────────────────────────────────────────

interface GlobalStats {
  totalUsers: number;
  totalOrgs: number;
  totalMangas: number;
  totalChapters: number;
  totalComments: number;
  totalSubscriptions: number;
  totalRevenue: number;
  grossRevenue: number;
  totalCapibaraFees: number;
  totalPaypalFees: number;
  totalWithdrawn: number;
  newUsersThisMonth: number;
  newOrgsThisMonth: number;
}

interface OrgStat {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdAt: string;
  mangaCount: number;
  chapterCount: number;
  subscriptionCount: number;
  followerCount: number;
  totalRevenue: number;
  grossRevenue: number;
  capibaraFees: number;
  paypalFees: number;
  totalWithdrawn: number;
  saldo: number;
}

interface OrgRequest {
  id: number;
  applicantName: string;
  applicantEmail: string;
  scanName: string;
  references: string;
  previousWorks: string;
  estimatedMonthlyReaders: string;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  user?: { id: number; username: string; slug: string } | null;
}

// ── API helpers ───────────────────────────────────────────────────────────────

const saFetch = async (path: string, token: string, options?: RequestInit) => {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!json.status) throw new Error(json.message ?? 'Error');
  return json.data;
};

// ── Small UI pieces ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
    <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-white">{value}</p>
    {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
  </div>
);

const Badge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    accepted: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[status] ?? 'bg-zinc-700 text-zinc-300'}`}>
      {status}
    </span>
  );
};

// ── Login Screen ──────────────────────────────────────────────────────────────

const LoginScreen = ({ onLogin }: { onLogin: (token: string) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/superadmin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!json.status) throw new Error(json.message ?? 'Error');
      sessionStorage.setItem('sa_token', json.token);
      onLogin(json.token);
    } catch (err: any) {
      setError(err.message ?? 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🦫</div>
          <h1 className="text-2xl font-black text-white">Superadmin</h1>
          <p className="text-zinc-500 text-sm">CapibaraTraductor</p>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm mb-4">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-lg py-3 transition-colors"
          >
            {loading ? 'Iniciando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Overview Tab ──────────────────────────────────────────────────────────────

const toDateInput = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const OverviewTab = ({ token }: { token: string }) => {
  const now = new Date();
  const year = now.getFullYear();
  const PERIODS: { key: string; label: string; from: string; to: string }[] = [
    { key: 'month', label: 'Este mes', from: toDateInput(new Date(year, now.getMonth(), 1)), to: toDateInput(now) },
    { key: 'year', label: `Este año (${year})`, from: `${year}-01-01`, to: toDateInput(now) },
    { key: 'prev-year', label: `${year - 1}`, from: `${year - 1}-01-01`, to: `${year - 1}-12-31` },
    { key: 'all', label: 'Todo', from: '', to: '' },
  ];

  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Por defecto: el año actual.
  const [period, setPeriod] = useState('year');
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(toDateInput(now));

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    saFetch(`/api/superadmin/stats${qs ? `?${qs}` : ''}`, token)
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, from, to]);

  const pickPeriod = (p: (typeof PERIODS)[number]) => {
    setPeriod(p.key);
    setFrom(p.from);
    setTo(p.to);
  };

  const fmt = (n: number) => n.toLocaleString('es');
  const money = (n: number) => `$${n.toFixed(2)}`;
  const periodLabel = period === 'all' ? 'histórico' : `${from || 'inicio'} a ${to || 'hoy'}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-white">Vista general</h2>
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => pickPeriod(p)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${period === p.key ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
              {p.label}
            </button>
          ))}
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPeriod('custom'); }} className="bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2 text-white text-xs" aria-label="Desde" />
          <span className="text-zinc-600 text-xs">a</span>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPeriod('custom'); }} className="bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2 text-white text-xs" aria-label="Hasta" />
        </div>
      </div>

      {loading ? <Spinner /> : error ? <ErrorMsg msg={error} /> : !stats ? null : (
        <>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Finanzas · {periodLabel}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Ingresos brutos" value={money(stats.grossRevenue)} sub="Cobrado a lectores" />
              <StatCard label="Neto scans" value={money(stats.totalRevenue)} sub="Ganancia de las orgs" />
              <StatCard label="Comisión Capibara" value={money(stats.totalCapibaraFees)} sub="Neta, ya sin PayPal" />
              <StatCard label="Comisión PayPal" value={money(stats.totalPaypalFees)} sub="Sale de la mitad Capibara" />
              <StatCard label="Retirado por scans" value={money(stats.totalWithdrawn)} />
              <StatCard label="Saldo pendiente scans" value={money(stats.totalRevenue - stats.totalWithdrawn)} sub="Neto menos retiros" />
            </div>
            <p className="text-zinc-600 text-[11px] mt-2">Incluye suscripciones y publicidad. La comisión Capibara de publicidad es el 50% retenido antes del reparto a scans.</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Plataforma · histórico</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Usuarios totales" value={fmt(stats.totalUsers)} sub={`+${fmt(stats.newUsersThisMonth)} este mes`} />
              <StatCard label="Organizaciones" value={fmt(stats.totalOrgs)} sub={`+${fmt(stats.newOrgsThisMonth)} este mes`} />
              <StatCard label="Mangas" value={fmt(stats.totalMangas)} />
              <StatCard label="Capítulos" value={fmt(stats.totalChapters)} />
              <StatCard label="Comentarios" value={fmt(stats.totalComments)} />
              <StatCard label="Suscripciones activas" value={fmt(stats.totalSubscriptions)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Organizations Tab ─────────────────────────────────────────────────────────

const OrgsTab = ({ token }: { token: string }) => {
  const [orgs, setOrgs] = useState<OrgStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<keyof OrgStat>('totalRevenue');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    saFetch('/api/superadmin/org-stats', token)
      .then(setOrgs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleSort = (key: keyof OrgStat) => {
    if (sortKey === key) setSortDesc((d) => !d);
    else { setSortKey(key); setSortDesc(true); }
  };

  const sorted = [...orgs].sort((a, b) => {
    const av = a[sortKey] as any;
    const bv = b[sortKey] as any;
    if (typeof av === 'number') return sortDesc ? bv - av : av - bv;
    return sortDesc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
  });

  const SortTh = ({ k, label }: { k: keyof OrgStat; label: string }) => (
    <th
      className="px-3 py-2 text-left text-xs text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white select-none whitespace-nowrap"
      onClick={() => toggleSort(k)}
    >
      {label} {sortKey === k ? (sortDesc ? '↓' : '↑') : ''}
    </th>
  );

  const money = (n: number) => `$${n.toFixed(2)}`;

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg msg={error} />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-white">Organizaciones ({orgs.length})</h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900">
            <tr>
              <SortTh k="name" label="Nombre" />
              <SortTh k="followerCount" label="Seguidores" />
              <SortTh k="mangaCount" label="Mangas" />
              <SortTh k="chapterCount" label="Caps" />
              <SortTh k="subscriptionCount" label="Subs activas" />
              <SortTh k="grossRevenue" label="Bruto" />
              <SortTh k="totalRevenue" label="Neto scan" />
              <SortTh k="capibaraFees" label="Fee Capibara" />
              <SortTh k="paypalFees" label="Fee PayPal" />
              <SortTh k="totalWithdrawn" label="Retirado" />
              <SortTh k="saldo" label="Saldo pendiente" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {sorted.map((org) => (
              <tr key={org.id} className="bg-zinc-950 hover:bg-zinc-900 transition-colors">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {org.logoUrl ? (
                      <img src={org.logoUrl} alt={org.name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                        {org.name[0]}
                      </div>
                    )}
                    <div>
                      <a
                        href={`/${org.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-white hover:text-violet-400"
                      >
                        {org.name}
                      </a>
                      <p className="text-zinc-500 text-xs">/{org.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-zinc-300">{org.followerCount.toLocaleString('es')}</td>
                <td className="px-3 py-3 text-zinc-300">{org.mangaCount}</td>
                <td className="px-3 py-3 text-zinc-300">{org.chapterCount}</td>
                <td className="px-3 py-3 text-zinc-300">{org.subscriptionCount}</td>
                <td className="px-3 py-3 text-zinc-300">{money(org.grossRevenue)}</td>
                <td className="px-3 py-3 text-zinc-300">{money(org.totalRevenue)}</td>
                <td className="px-3 py-3 text-yellow-400">{money(org.capibaraFees)}</td>
                <td className="px-3 py-3 text-orange-400">{money(org.paypalFees)}</td>
                <td className="px-3 py-3 text-red-400">{money(org.totalWithdrawn)}</td>
                <td className="px-3 py-3 font-bold text-green-400">{money(org.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Requests Tab ──────────────────────────────────────────────────────────────

const RequestsTab = ({ token }: { token: string }) => {
  const [requests, setRequests] = useState<OrgRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ id: number; msg: string; ok: boolean } | null>(null);

  const load = useCallback((status: string) => {
    setLoading(true);
    saFetch(`/api/superadmin/requests?status=${status}`, token)
      .then((data) => { setRequests(data); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(statusFilter); }, [statusFilter, load]);

  const doReview = async (id: number, action: 'accept' | 'reject' | 'accept_no_email', notes?: string) => {
    setReviewing(id);
    try {
      await saFetch(`/api/superadmin/requests/${id}/review`, token, {
        method: 'PATCH',
        body: JSON.stringify({ action, notes }),
      });
      const msgs: Record<string, string> = {
        accept: 'Aceptada y correo enviado ✓',
        accept_no_email: 'Marcada como aceptada (sin correo) ✓',
        reject: 'Rechazada y correo enviado ✓',
      };
      setActionFeedback({ id, msg: msgs[action], ok: true });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setExpanded(null);
    } catch (e: any) {
      setActionFeedback({ id, msg: e.message, ok: false });
    } finally {
      setReviewing(null);
      setRejectNotes('');
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-black text-white">Solicitudes de registro</h2>
        <div className="flex gap-2">
          {['pending', 'accepted', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setExpanded(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
                statusFilter === s
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {actionFeedback && (
        <div className={`rounded-lg p-3 text-sm font-medium ${actionFeedback.ok ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {actionFeedback.msg}
        </div>
      )}

      {loading && <Spinner />}
      {error && <ErrorMsg msg={error} />}

      {!loading && !error && requests.length === 0 && (
        <div className="text-center py-12 text-zinc-500">No hay solicitudes con estado «{statusFilter}».</div>
      )}

      <div className="space-y-3">
        {requests.map((req) => (
          <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Header row */}
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800 transition-colors"
              onClick={() => setExpanded(expanded === req.id ? null : req.id)}
            >
              <div className="flex items-center gap-3 text-left">
                <div className="text-2xl">📋</div>
                <div>
                  <p className="font-bold text-white">{req.scanName}</p>
                  <p className="text-zinc-400 text-xs">
                    {req.applicantName} · {req.applicantEmail}
                    {req.user && <span className="text-cyan-400 font-bold"> · @{req.user.username}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 text-xs hidden sm:block">
                  {new Date(req.createdAt).toLocaleDateString('es')}
                </span>
                <Badge status={req.status} />
                <span className="text-zinc-500">{expanded === req.id ? '▲' : '▼'}</span>
              </div>
            </button>

            {/* Expanded details */}
            {expanded === req.id && (
              <div className="border-t border-zinc-800 px-5 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <Field label="Nombre del solicitante" value={req.applicantName} />
                  <Field label="Email" value={req.applicantEmail} />
                  <Field label="Cuenta vinculada" value={req.user ? `@${req.user.username} (id ${req.user.id})` : 'Sin cuenta (solicitud antigua)'} />
                  <Field label="Lectores estimados/mes" value={req.estimatedMonthlyReaders} />
                  <Field label="Fecha de solicitud" value={new Date(req.createdAt).toLocaleString('es')} />
                  <Field label="Referencias" value={req.references} className="md:col-span-2" />
                  <Field label="Trabajos previos" value={req.previousWorks} className="md:col-span-2" />
                  {req.reviewNotes && <Field label="Notas de revisión" value={req.reviewNotes} className="md:col-span-2" />}
                </div>

                {req.status === 'pending' && (
                  <div className="border-t border-zinc-800 pt-4 space-y-3">
                    {/* Reject with notes */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Motivo de rechazo (opcional)"
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                      />
                      <button
                        disabled={reviewing === req.id}
                        onClick={() => doReview(req.id, 'reject', rejectNotes)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors whitespace-nowrap"
                      >
                        {reviewing === req.id ? '...' : '✗ Rechazar'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={reviewing === req.id}
                        onClick={() => doReview(req.id, 'accept')}
                        className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
                      >
                        {reviewing === req.id ? '...' : '✓ Aceptar + enviar correo'}
                      </button>
                      <button
                        disabled={reviewing === req.id}
                        onClick={() => doReview(req.id, 'accept_no_email')}
                        className="px-4 py-2.5 bg-zinc-600 hover:bg-zinc-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
                      >
                        {reviewing === req.id ? '...' : '✓ Aceptar sin correo'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Field = ({ label, value, className = '' }: { label: string; value: string; className?: string }) => (
  <div className={className}>
    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-zinc-200 text-sm break-words whitespace-pre-wrap">{value}</p>
  </div>
);

const Spinner = () => (
  <div className="flex justify-center py-12">
    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ErrorMsg = ({ msg }: { msg: string }) => (
  <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{msg}</div>
);

// ── Main App ──────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'orgs' | 'requests' | 'create-scan' | 'users' | 'subscriptions' | 'raffles' | 'reports' | 'moderation' | 'beta';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Vista general', icon: '📊' },
  { id: 'orgs', label: 'Organizaciones', icon: '🏢' },
  { id: 'reports', label: 'Reportes', icon: '🚩' },
  { id: 'moderation', label: 'Auditoría', icon: '📋' },
  { id: 'users', label: 'Usuarios', icon: '👥' },
  { id: 'subscriptions', label: 'Suscripciones', icon: '💳' },
  { id: 'raffles', label: 'Sorteos', icon: '🎟️' },
  { id: 'beta', label: 'Verificadores', icon: '🧪' },
  { id: 'requests', label: 'Solicitudes', icon: '📬' },
  { id: 'create-scan', label: 'Alta de Scan', icon: '➕' },
];

const ACTION_LABEL: Record<string, string> = {
  report_hide_content: 'Contenido oculto (reporte)',
  report_delete_notify: 'Obra borrada y scan notificado',
  report_dismiss: 'Reporte descartado',
  review_hide: 'Reseña oculta',
  manga_delete: 'Manga eliminado',
  chapter_delete: 'Capítulo eliminado',
  genre_create: 'Género creado',
  genre_rename: 'Género renombrado',
  genre_delete: 'Género eliminado',
};

const ModerationLogTab = ({ token }: { token: string }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    saFetch(`/api/superadmin/moderation-log?page=${page}${action ? `&action=${action}` : ''}`, token)
      .then((d: any) => { setRows(d.rows || []); setTotal(d.total || 0); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, page, action]);

  const maxPage = Math.max(1, Math.ceil(total / 30));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-black text-white">Log de auditoría <span className="text-zinc-500 text-sm font-normal">({total})</span></h2>
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm">
          <option value="">Todas las acciones</option>
          {Object.entries(ACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {loading ? <Spinner /> : error ? <ErrorMsg msg={error} /> : rows.length === 0 ? (
        <p className="text-zinc-500 text-center py-10">Sin registros.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{ACTION_LABEL[r.action] || r.action}</p>
                <p className="text-xs text-zinc-500">
                  {r.actor ? `@${r.actor.username}` : 'superadmin'} · {r.targetType} #{r.targetId}
                  {r.details ? ` · ${r.details}` : ''}
                </p>
              </div>
              <span className="text-[11px] text-zinc-600 shrink-0">{new Date(r.createdAt).toLocaleString('es')}</span>
            </div>
          ))}
        </div>
      )}
      {maxPage > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm disabled:opacity-40">Anterior</button>
          <span className="text-zinc-500 text-sm">{page} / {maxPage}</span>
          <button disabled={page >= maxPage} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm disabled:opacity-40">Siguiente</button>
        </div>
      )}
    </div>
  );
};

const ReportsTab = ({ token }: { token: string }) => {
  const dlg = useDialog();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    saFetch(`/api/superadmin/reports?status=${statusFilter}`, token)
      .then(setReports)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [token, statusFilter]);

  const act = async (id: number, action: 'dismiss' | 'hide_content' | 'delete_notify' | 'restore') => {
    let resolutionNote: string | undefined;
    if (action === 'hide_content' && !(await dlg.confirm('Se ocultará el contenido al público y se marcarán los reportes como atendidos.'))) return;
    if (action === 'restore') {
      if (!(await dlg.confirm('La obra volverá a ser visible para los lectores y el reporte quedará como descartado. ¿Continuar?'))) return;
      const motivo = await dlg.prompt('Motivo de la reactivación (opcional, queda en el historial):', { defaultValue: 'El reporte resultó falso; el tema se aclaró.' });
      if (motivo === null) return;
      resolutionNote = motivo.trim() || undefined;
    }
    if (action === 'delete_notify') {
      const reason = await dlg.prompt('Razón del borrado (se enviará al scan por correo y notificación):', { required: true });
      if (reason === null) return;
      if (!reason.trim()) { await dlg.alert('La razón es obligatoria.'); return; }
      resolutionNote = reason.trim();
    }
    setBusyId(id);
    try {
      await saFetch(`/api/superadmin/reports/${id}`, token, { method: 'PATCH', body: JSON.stringify({ action, ...(resolutionNote ? { resolutionNote } : {}) }) });
      load();
    } catch (e: any) { dlg.alert(e.message); } finally { setBusyId(null); }
  };

  const catLabel: Record<string, string> = { menores: 'Menores', ilegal: 'Ilegal', no_etiquetado: '+18 sin etiquetar', spam: 'Spam', otro: 'Otro' };

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg msg={error} />;

  return (
    <div className="space-y-4">
      <dlg.DialogHost />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white">Reportes {statusFilter === 'pending' && `(${reports.length} pendientes)`}</h2>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300">
          <option value="pending">Pendientes</option>
          <option value="all">Todos</option>
        </select>
      </div>
      {reports.length === 0 ? (
        <p className="text-zinc-500 text-sm">No hay reportes.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const target = r.mangaCustom || r.joint;
            const targetUrl = r.mangaCustom ? `/${r.mangaCustom.organization?.slug}/manga/${r.mangaCustom.manga?.slug}` : r.joint ? `/joint/manga/${r.joint.slug}` : '#';
            // La obra está oculta al público si tiene deletedAt (soft delete).
            const isHidden = !!target?.deletedAt;
            return (
              <div key={r.id} className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                {target?.imageUrl && <img src={target.imageUrl} alt="" className="w-10 h-14 object-cover rounded" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={targetUrl} target="_blank" rel="noreferrer" className="font-semibold text-white hover:text-violet-400 truncate">{target?.title || 'Obra'}</a>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${r.category === 'menores' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>{catLabel[r.category] || r.category}</span>
                    {r.reportsForTarget > 1 && <span className="text-[10px] text-zinc-500">{r.reportsForTarget} reportes</span>}
                    {r.status !== 'pending' && <span className="text-[10px] text-zinc-600">{r.status}</span>}
                    {isHidden && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Oculta</span>}
                  </div>
                  <p className="text-zinc-500 text-xs">{r.mangaCustom?.organization?.name} · por @{r.reporter?.slug}</p>
                  {r.details && <p className="text-zinc-400 text-xs mt-1 truncate">{r.details}</p>}
                </div>
                {r.status === 'pending' ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => act(r.id, 'delete_notify')} disabled={busyId === r.id} className="px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 text-[10px] font-black uppercase tracking-widest transition-colors" title="Borra la obra y avisa al scan (correo + notificación) con la razón">Borrar y notificar</button>
                    <button onClick={() => act(r.id, 'hide_content')} disabled={busyId === r.id} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors" title="Borra la obra sin avisar al scan">Ocultar</button>
                    <button onClick={() => act(r.id, 'dismiss')} disabled={busyId === r.id} className="px-3 py-1.5 rounded-lg text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest">Descartar</button>
                  </div>
                ) : isHidden ? (
                  /* Reporte ya atendido y la obra sigue oculta: permitir deshacerlo
                     cuando el reporte resultó falso o el tema se aclaró. */
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => act(r.id, 'restore')} disabled={busyId === r.id} className="px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500 hover:text-zinc-950 text-[10px] font-black uppercase tracking-widest transition-colors" title="Vuelve a hacer visible la obra para los lectores">Reactivar</button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Beta Testers Tab (verificadores de Google Play) ───────────────────────────
const BETA_STATUS: Record<string, { text: string; cls: string }> = {
  pending: { text: 'Pendiente', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  added: { text: 'Agregado', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  rejected: { text: 'Descartado', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

const BetaTestersTab = ({ token }: { token: string }) => {
  const dlg = useDialog();
  const [testers, setTesters] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    saFetch('/api/superadmin/beta-testers', token)
      .then((d: any) => { setTesters(d.testers || []); setCounts(d.counts || {}); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [token]);

  const setStatus = async (id: number, status: string) => {
    setBusyId(id);
    try {
      await saFetch(`/api/superadmin/beta-testers/${id}`, token, { method: 'PATCH', body: JSON.stringify({ status }) });
      load();
    } catch (e: any) { dlg.alert(e.message); } finally { setBusyId(null); }
  };

  const remove = async (id: number) => {
    if (!(await dlg.confirm('¿Eliminar este registro de verificador?'))) return;
    setBusyId(id);
    try {
      await saFetch(`/api/superadmin/beta-testers/${id}`, token, { method: 'DELETE' });
      load();
    } catch (e: any) { dlg.alert(e.message); } finally { setBusyId(null); }
  };

  // Correos para pegar en Play Console (lista de verificadores). Se copian los
  // que aún no fueron descartados.
  const copyEmails = async () => {
    const emails = testers.filter((t) => t.status !== 'rejected').map((t) => t.gmail);
    try {
      await navigator.clipboard.writeText(emails.join(', '));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      dlg.alert(emails.join('\n'));
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg msg={error} />;

  const total = testers.length;
  const usable = testers.filter((t) => t.status !== 'rejected').length;

  return (
    <div className="space-y-4">
      <dlg.DialogHost />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-black text-white">Verificadores de Google Play</h2>
        <button
          onClick={copyEmails}
          className="px-3 py-1.5 rounded-lg bg-cyan-500 text-zinc-950 hover:bg-cyan-400 text-[11px] font-black uppercase tracking-widest transition-colors"
          title="Copia los correos (menos los descartados) separados por coma para pegarlos en Play Console"
        >
          {copied ? '¡Copiado!' : `Copiar correos (${usable})`}
        </button>
      </div>

      {/* Contadores. Meta: 12 verificadores. */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 font-bold">{total} registrados</span>
        <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">{counts.added || 0} agregados</span>
        <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 font-bold">{counts.pending || 0} pendientes</span>
        {(counts.rejected || 0) > 0 && <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-400 font-bold">{counts.rejected} descartados</span>}
        <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-400 font-bold">Meta: 12</span>
      </div>

      {testers.length === 0 ? (
        <p className="text-zinc-500 text-sm">Aún no hay registros. Comparte el enlace /beta.</p>
      ) : (
        <div className="space-y-2">
          {testers.map((t) => (
            <div key={t.id} className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white truncate">{t.name}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${BETA_STATUS[t.status]?.cls || BETA_STATUS.pending.cls}`}>{BETA_STATUS[t.status]?.text || t.status}</span>
                </div>
                <p className="text-cyan-400 text-xs font-mono truncate">{t.gmail}</p>
                <p className="text-zinc-600 text-[11px]">cuenta: @{t.user?.slug} · {new Date(t.createdAt).toLocaleDateString('es')}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {t.status !== 'added' && <button onClick={() => setStatus(t.id, 'added')} disabled={busyId === t.id} className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500 hover:text-zinc-950 text-[10px] font-black uppercase tracking-widest transition-colors" title="Márcalo cuando ya lo agregaste en Play Console">Agregado</button>}
                {t.status !== 'pending' && <button onClick={() => setStatus(t.id, 'pending')} disabled={busyId === t.id} className="px-2.5 py-1.5 rounded-lg text-amber-400 hover:text-amber-300 text-[10px] font-black uppercase tracking-widest">Pendiente</button>}
                {t.status !== 'rejected' && <button onClick={() => setStatus(t.id, 'rejected')} disabled={busyId === t.id} className="px-2.5 py-1.5 rounded-lg text-zinc-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest">Descartar</button>}
                <button onClick={() => remove(t.id)} disabled={busyId === t.id} className="px-2.5 py-1.5 rounded-lg text-zinc-600 hover:text-red-500 text-[10px] font-black uppercase tracking-widest" title="Eliminar registro">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SuperAdminApp = () => {
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    const stored = sessionStorage.getItem('sa_token');
    if (stored) setToken(stored);
  }, []);

  const handleLogin = (t: string) => setToken(t);

  const handleLogout = () => {
    sessionStorage.removeItem('sa_token');
    setToken(null);
  };

  if (!token) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Topbar */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦫</span>
          <span className="font-black text-white">Superadmin</span>
          <span className="text-zinc-600 text-sm hidden sm:inline">— CapibaraTraductor</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1"
        >
          Cerrar sesión
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'overview' && <OverviewTab token={token} />}
        {tab === 'orgs' && <OrgsTab token={token} />}
        {tab === 'requests' && <RequestsTab token={token} />}
        {tab === 'create-scan' && <SuperadminCreateScan token={token} />}
        {tab === 'users' && <SuperadminUsers token={token} />}
        {tab === 'subscriptions' && <SuperadminSubscriptions token={token} />}
        {tab === 'raffles' && <SuperadminRaffles token={token} />}
        {tab === 'reports' && <ReportsTab token={token} />}
        {tab === 'moderation' && <ModerationLogTab token={token} />}
        {tab === 'beta' && <BetaTestersTab token={token} />}
      </div>
    </div>
  );
};

export default SuperAdminApp;
