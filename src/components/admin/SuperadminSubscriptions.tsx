import React, { useCallback, useEffect, useState } from 'react';
import { Search, Loader2, RotateCcw, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const API = import.meta.env.PUBLIC_API_URL as string;

interface SubscriptionRow {
  id: number;
  status: string;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  nextPayment: string | null;
  lastPayment: string | null;
  lastAmount: number | null;
  failedPaymentsCount: number | null;
  paypalSubscriptionId: string | null;
  user: { id: number; slug: string | null; username: string | null; email: string; imageUrl: string | null };
  subscriptionPlan: {
    id: number; name: string; price: number; currency: string | null; interval: string | null;
    organization: { id: number; slug: string; name: string; logoUrl: string | null };
  };
}

interface Payment {
  id: string | number;
  transactionDate: string | null;
  beforeFeesAmount: number | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  transactionId: string | null;
  source: 'db' | 'paypal';
}

const PAGE_SIZE = 25;

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });
};
const fmtMoney = (n: number | null, c: string | null) => (n == null ? '—' : `${n.toFixed(2)} ${c || 'USD'}`);

const StatusPill: React.FC<{ s: SubscriptionRow }> = ({ s }) => {
  const cancelled = s.status === 'CANCELLED' || s.status === 'EXPIRED';
  const suspended = s.status === 'SUSPENDED';
  const active = s.status === 'ACTIVE';
  const cls = cancelled
    ? 'bg-zinc-700/40 text-zinc-300'
    : active
    ? 'bg-green-500/20 text-green-400'
    : suspended && (s.failedPaymentsCount ?? 0) > 0
    ? 'bg-orange-500/20 text-orange-400'
    : 'bg-cyan-500/20 text-cyan-400';
  const label = cancelled ? 'Cancelada' : active ? 'Activa' : suspended && (s.failedPaymentsCount ?? 0) > 0 ? 'Suspendida' : 'Pausada';
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${cls}`}>{label}</span>;
};

const SuperadminSubscriptions: React.FC<{ token: string }> = ({ token }) => {
  const [items, setItems] = useState<SubscriptionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [maxPage, setMaxPage] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<'all' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'>('all');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [paymentsBySub, setPaymentsBySub] = useState<Record<number, Payment[] | 'loading'>>({});

  const fetchList = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search.trim()) params.set('search', search.trim());
      if (status !== 'all') params.set('status', status);
      const res = await fetch(`${API}/api/superadmin/subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.status) throw new Error(json.message ?? 'Error');
      setItems(json.data.items);
      setTotal(json.data.total);
      setMaxPage(json.data.maxPage);
    } catch (e: any) {
      setFeedback(e?.message ?? 'Error cargando suscripciones');
    } finally {
      setLoading(false);
    }
  }, [token, page, search, status]);

  useEffect(() => { fetchList(); }, [fetchList]);
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (searchInput !== search) { setSearch(searchInput); setPage(1); }
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput, search]);

  const togglePayments = async (id: number) => {
    const next = openId === id ? null : id;
    setOpenId(next);
    if (next === null) return;
    if (paymentsBySub[id]) return; // cached
    setPaymentsBySub((p) => ({ ...p, [id]: 'loading' }));
    try {
      const res = await fetch(`${API}/api/superadmin/subscriptions/${id}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.status) throw new Error(json.message ?? 'Error');
      setPaymentsBySub((p) => ({ ...p, [id]: json.data as Payment[] }));
    } catch (e: any) {
      setPaymentsBySub((p) => ({ ...p, [id]: [] }));
      setFeedback(e?.message ?? 'Error cargando pagos');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Suscripciones</h2>
          <p className="text-zinc-400 text-sm">{total.toLocaleString('es')} suscripciones en total</p>
        </div>
        <button
          onClick={fetchList}
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por usuario, email, scan, paypalSubId..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-lg text-white text-sm focus:outline-none"
          />
        </div>
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {(['all', 'ACTIVE', 'SUSPENDED', 'CANCELLED'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => { setStatus(opt); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-colors ${
                status === opt ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {opt === 'all' ? 'Todas' : opt === 'ACTIVE' ? 'Activas' : opt === 'SUSPENDED' ? 'Suspendidas' : 'Canceladas'}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg text-sm border bg-red-500/10 border-red-500/30 text-red-400">{feedback}</div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950/60 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
              <tr>
                <th className="text-left px-4 py-3">Usuario</th>
                <th className="text-left px-4 py-3">Scan / Plan</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Estado</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Próximo cobro</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Último pago</th>
                <th className="text-right px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading && items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500"><Loader2 size={20} className="inline animate-spin text-cyan-400" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">Sin suscripciones</td></tr>
              ) : items.map((s) => {
                const open = openId === s.id;
                const payments = paymentsBySub[s.id];
                return (
                  <React.Fragment key={s.id}>
                    <tr className="hover:bg-zinc-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {s.user.imageUrl ? <img src={s.user.imageUrl} className="w-7 h-7 rounded-full object-cover" alt="" /> : <div className="w-7 h-7 rounded-full bg-zinc-800" />}
                          <div className="min-w-0">
                            <p className="text-white text-xs font-bold truncate">{s.user.username || s.user.email}</p>
                            <p className="text-zinc-500 text-[10px] truncate">{s.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {s.subscriptionPlan.organization.logoUrl ? (
                            <img src={s.subscriptionPlan.organization.logoUrl} className="w-7 h-7 rounded-md object-cover" alt="" />
                          ) : (
                            <div className="w-7 h-7 rounded-md bg-zinc-800" />
                          )}
                          <div className="min-w-0">
                            <p className="text-white text-xs font-bold truncate">{s.subscriptionPlan.organization.name}</p>
                            <p className="text-zinc-400 text-[10px] truncate">{s.subscriptionPlan.name} · ${s.subscriptionPlan.price}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <StatusPill s={s} />
                          {(s.failedPaymentsCount ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 text-orange-400" title={`${s.failedPaymentsCount} pagos fallidos`}>
                              <AlertTriangle size={12} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-zinc-300 text-xs">{fmtDate(s.nextPayment)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-zinc-300 text-xs">{fmtMoney(s.lastAmount, s.subscriptionPlan.currency)} · <span className="text-zinc-500">{fmtDate(s.lastPayment)}</span></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => togglePayments(s.id)}
                          className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
                        >
                          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Pagos
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-zinc-950/60">
                        <td colSpan={6} className="px-4 py-4">
                          {payments === 'loading' ? (
                            <div className="flex items-center gap-2 text-zinc-500 text-xs"><Loader2 size={14} className="animate-spin" /> Cargando pagos...</div>
                          ) : !payments || payments.length === 0 ? (
                            <p className="text-zinc-500 text-xs">Sin pagos registrados.</p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                                <tr>
                                  <th className="text-left py-2">Fecha</th>
                                  <th className="text-left py-2">Bruto</th>
                                  <th className="text-left py-2">Neto al scan</th>
                                  <th className="text-left py-2">Estado</th>
                                  <th className="text-left py-2">ID</th>
                                  <th className="text-right py-2" />
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800/60">
                                {payments.map((p) => (
                                  <tr key={p.id}>
                                    <td className="py-2 text-zinc-300">{fmtDate(p.transactionDate)}</td>
                                    <td className="py-2 text-zinc-300">{fmtMoney(p.beforeFeesAmount, p.currency)}</td>
                                    <td className="py-2 text-zinc-300">{fmtMoney(p.amount, p.currency)}</td>
                                    <td className="py-2 text-zinc-400">{p.status}</td>
                                    <td className="py-2 text-zinc-500 font-mono text-[10px] truncate max-w-[200px]">{p.transactionId || '—'}</td>
                                    <td className="py-2 text-right">
                                      {p.source === 'paypal' && (
                                        <span className="px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 text-[9px] font-bold uppercase tracking-widest">Pendiente</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {maxPage > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Página {page} de {maxPage}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 font-bold">← Anterior</button>
            <button onClick={() => setPage((p) => Math.min(maxPage, p + 1))} disabled={page >= maxPage || loading} className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 font-bold">Siguiente →</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperadminSubscriptions;
