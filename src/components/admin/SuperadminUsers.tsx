import React, { useCallback, useEffect, useState } from 'react';
import { Search, MailCheck, MailX, Send, Loader2, RotateCcw, EyeOff } from 'lucide-react';

const API = import.meta.env.PUBLIC_API_URL as string;

interface UserRow {
  id: number;
  email: string;
  username: string;
  slug: string | null;
  imageUrl: string | null;
  emailVerified: boolean;
  hideAds: boolean;
  createdAt: string;
}

interface ListResponse {
  items: UserRow[];
  total: number;
  maxPage: number;
}

const PAGE_SIZE = 25;

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });
};

const SuperadminUsers: React.FC<{ token: string }> = ({ token }) => {
  const [items, setItems] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [maxPage, setMaxPage] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [verified, setVerified] = useState<'all' | 'yes' | 'no'>('all');
  const [loading, setLoading] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search.trim()) params.set('search', search.trim());
      if (verified !== 'all') params.set('verified', verified);
      const res = await fetch(`${API}/api/superadmin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.status) throw new Error(json.message ?? 'Error');
      const data = json.data as ListResponse;
      setItems(data.items);
      setTotal(data.total);
      setMaxPage(data.maxPage);
    } catch (e: any) {
      setFeedback({ kind: 'err', msg: e?.message ?? 'Error cargando usuarios' });
    } finally {
      setLoading(false);
    }
  }, [token, page, search, verified]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounce the search input -> committed `search` -> triggers fetch.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput, search]);

  const toggleHideAds = async (userId: number, next: boolean) => {
    setItems((prev) => prev.map((u) => (u.id === userId ? { ...u, hideAds: next } : u)));
    try {
      const res = await fetch(`${API}/api/superadmin/users/${userId}/hide-ads`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hideAds: next }),
      });
      const json = await res.json();
      if (!json.status) throw new Error(json.message ?? 'Error');
      setFeedback({ kind: 'ok', msg: `hideAds ${next ? 'activado' : 'desactivado'}` });
    } catch (e: any) {
      // rollback on failure
      setItems((prev) => prev.map((u) => (u.id === userId ? { ...u, hideAds: !next } : u)));
      setFeedback({ kind: 'err', msg: e?.message ?? 'Error actualizando hideAds' });
    }
  };

  const resend = async (userId: number, email: string) => {
    setResendingId(userId);
    setFeedback(null);
    try {
      const res = await fetch(`${API}/api/superadmin/users/${userId}/resend-verification`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.status) throw new Error(json.message ?? 'Error');
      setFeedback({ kind: 'ok', msg: `Correo de verificación enviado a ${email}` });
    } catch (e: any) {
      setFeedback({ kind: 'err', msg: e?.message ?? 'Error reenviando' });
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Usuarios</h2>
          <p className="text-zinc-400 text-sm">{total.toLocaleString('es')} usuarios en total</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
          Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por email, username o slug..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-lg text-white text-sm focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {(['all', 'yes', 'no'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => { setVerified(opt); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-colors ${
                verified === opt ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {opt === 'all' ? 'Todos' : opt === 'yes' ? 'Verificados' : 'No verificados'}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`p-3 rounded-lg text-sm border ${
          feedback.kind === 'ok'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950/60 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
              <tr>
                <th className="text-left px-4 py-3">Usuario</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Registro</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">No ads</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    <Loader2 size={20} className="inline animate-spin text-cyan-400" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : items.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {u.imageUrl ? (
                        <img src={u.imageUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-bold truncate">{u.username}</p>
                        <p className="text-xs text-zinc-500 truncate">@{u.slug ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-zinc-300">{u.email}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-zinc-500 text-xs">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.emailVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/15 text-green-400 text-[10px] font-bold uppercase tracking-widest">
                        <MailCheck size={11} /> Verificado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 text-[10px] font-bold uppercase tracking-widest">
                        <MailX size={11} /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <button
                      type="button"
                      onClick={() => toggleHideAds(u.id, !u.hideAds)}
                      title={u.hideAds ? 'Sin anuncios (override global)' : 'Activar override sin anuncios'}
                      className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${u.hideAds ? 'bg-purple-500' : 'bg-zinc-800'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${u.hideAds ? 'right-1' : 'left-1'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.emailVerified ? (
                      <span className="text-zinc-600 text-[10px] uppercase tracking-widest">—</span>
                    ) : (
                      <button
                        onClick={() => resend(u.id, u.email)}
                        disabled={resendingId === u.id}
                        className="px-3 py-1.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {resendingId === u.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Reenviar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {maxPage > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Página {page} de {maxPage}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 font-bold"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              disabled={page >= maxPage || loading}
              className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 font-bold"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperadminUsers;
