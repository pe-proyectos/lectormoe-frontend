import React, { useState, useEffect, useCallback } from 'react';
import SuperadminCreateScan from '../admin/SuperadminCreateScan';
import SuperadminUsers from '../admin/SuperadminUsers';
import SuperadminSubscriptions from '../admin/SuperadminSubscriptions';
import SuperadminRaffles from '../admin/SuperadminRaffles';

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
  totalCapibaraFees: number;
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
  capibaraFees: number;
  paypalFees: number;
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

const OverviewTab = ({ token }: { token: string }) => {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    saFetch('/api/superadmin/stats', token)
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg msg={error} />;
  if (!stats) return null;

  const fmt = (n: number) => n.toLocaleString('es');
  const money = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-white">Vista general</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Usuarios totales" value={fmt(stats.totalUsers)} sub={`+${fmt(stats.newUsersThisMonth)} este mes`} />
        <StatCard label="Organizaciones" value={fmt(stats.totalOrgs)} sub={`+${fmt(stats.newOrgsThisMonth)} este mes`} />
        <StatCard label="Mangas" value={fmt(stats.totalMangas)} />
        <StatCard label="Capítulos" value={fmt(stats.totalChapters)} />
        <StatCard label="Comentarios" value={fmt(stats.totalComments)} />
        <StatCard label="Suscripciones activas" value={fmt(stats.totalSubscriptions)} />
        <StatCard label="Revenue total" value={money(stats.totalRevenue)} />
        <StatCard label="Fees CapibaraTraductor" value={money(stats.totalCapibaraFees)} />
      </div>
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
              <SortTh k="totalRevenue" label="Revenue bruto" />
              <SortTh k="capibaraFees" label="Fee Capibara" />
              <SortTh k="paypalFees" label="Fee PayPal" />
              <SortTh k="saldo" label="Saldo actual" />
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
                <td className="px-3 py-3 text-zinc-300">{money(org.totalRevenue)}</td>
                <td className="px-3 py-3 text-yellow-400">{money(org.capibaraFees)}</td>
                <td className="px-3 py-3 text-orange-400">{money(org.paypalFees)}</td>
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

type Tab = 'overview' | 'orgs' | 'requests' | 'create-scan' | 'users' | 'subscriptions' | 'raffles';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Vista general', icon: '📊' },
  { id: 'orgs', label: 'Organizaciones', icon: '🏢' },
  { id: 'users', label: 'Usuarios', icon: '👥' },
  { id: 'subscriptions', label: 'Suscripciones', icon: '💳' },
  { id: 'raffles', label: 'Sorteos', icon: '🎟️' },
  { id: 'requests', label: 'Solicitudes', icon: '📬' },
  { id: 'create-scan', label: 'Alta de Scan', icon: '➕' },
];

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
      </div>
    </div>
  );
};

export default SuperAdminApp;
