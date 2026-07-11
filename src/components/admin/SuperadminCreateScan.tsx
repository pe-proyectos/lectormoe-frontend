import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API = import.meta.env.PUBLIC_API_URL as string;

interface UserResult {
  id: number;
  slug: string;
  username: string;
  email: string;
  imageUrl: string | null;
}

interface Props {
  token: string;
}

const slugify = (raw: string): string =>
  raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const SLUG_REGEX = /^[a-z0-9-]+$/;

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

const SuperadminCreateScan: React.FC<Props> = ({ token }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  // Tracks whether the slug field has been manually edited; once it has, we
  // stop auto-syncing it from `name` so the user's override sticks.
  const [slugTouched, setSlugTouched] = useState(false);
  const [isNSFW, setIsNSFW] = useState(false);

  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Auto-derive the slug from the name until the user takes ownership of it
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  // Debounced user autocomplete; cancels in-flight timers so only the last
  // keystroke fires a request.
  useEffect(() => {
    if (selectedUser) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = userQuery.trim();
    if (!q) {
      setUserResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const data = await saFetch(
          `/api/superadmin/users/search?q=${encodeURIComponent(q)}&limit=10`,
          token
        );
        setUserResults(data ?? []);
        setShowResults(true);
      } catch (err: any) {
        toast.error(err?.message ?? 'Error buscando usuarios');
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [userQuery, token, selectedUser]);

  // Close the autocomplete dropdown when clicking outside it
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pickUser = (u: UserResult) => {
    setSelectedUser(u);
    setUserQuery(`${u.username} (${u.email})`);
    setShowResults(false);
  };

  const clearUser = () => {
    setSelectedUser(null);
    setUserQuery('');
    setUserResults([]);
  };

  const onUserInputChange = (val: string) => {
    if (selectedUser) setSelectedUser(null);
    setUserQuery(val);
  };

  const trimmedName = name.trim();
  const trimmedSlug = slug.trim().toLowerCase();
  const slugValid = trimmedSlug.length > 0 && SLUG_REGEX.test(trimmedSlug);
  const canSubmit =
    !!trimmedName && slugValid && !!selectedUser?.id && !submitting;

  const resetForm = () => {
    setName('');
    setSlug('');
    setSlugTouched(false);
    setIsNSFW(false);
    setSelectedUser(null);
    setUserQuery('');
    setUserResults([]);
  };

  const [recentScans, setRecentScans] = useState<{ id: number; name: string; slug: string; isNSFW: boolean; createdAt: string }[]>([]);
  const loadRecent = useCallback(() => {
    saFetch('/api/superadmin/recent-scans', token).then(setRecentScans).catch(() => {});
  }, [token]);
  useEffect(() => { loadRecent(); }, [loadRecent]);

  const scanUrl = (s: { slug: string; isNSFW: boolean }) => `https://capibaratraductor.com${s.isNSFW ? '/red' : ''}/${s.slug}`;
  const copyUrl = (s: { slug: string; isNSFW: boolean }) => {
    navigator.clipboard.writeText(scanUrl(s)).then(() => toast.success('Link copiado'), () => toast.error('No se pudo copiar'));
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || !selectedUser) return;
      setSubmitting(true);
      try {
        const data = await saFetch('/api/superadmin/scan', token, {
          method: 'POST',
          body: JSON.stringify({
            name: trimmedName,
            slug: trimmedSlug,
            isNSFW,
            ownerUserId: selectedUser.id,
          }),
        });
        toast.success(`Scan creado: ${data.name} (#${data.id})`);
        resetForm();
        loadRecent();
      } catch (err: any) {
        toast.error(err?.message ?? 'Error al crear el scan');
      } finally {
        setSubmitting(false);
      }
    },
    [canSubmit, selectedUser, token, trimmedName, trimmedSlug, isNSFW, loadRecent]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Alta de Scan</h2>
        <p className="text-zinc-500 text-sm mt-1">
          Crea una nueva organización y le asigna permisos al dueño y al admin de la plataforma.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 max-w-2xl"
      >
        {/* Owner user picker */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5">
            Dueño del scan (usuario)
          </label>
          <div className="relative">
            <input
              type="text"
              value={userQuery}
              onChange={(e) => onUserInputChange(e.target.value)}
              onFocus={() => {
                if (!selectedUser && userResults.length > 0) setShowResults(true);
              }}
              placeholder="Busca por username, email o slug..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              autoComplete="off"
            />
            {selectedUser && (
              <button
                type="button"
                onClick={clearUser}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                aria-label="Limpiar selección"
              >
                ×
              </button>
            )}
          </div>

          {showResults && !selectedUser && (
            <div className="absolute z-20 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
              {searchingUsers && (
                <div className="px-4 py-3 text-zinc-500 text-sm">Buscando...</div>
              )}
              {!searchingUsers && userResults.length === 0 && (
                <div className="px-4 py-3 text-zinc-500 text-sm">Sin resultados.</div>
              )}
              {!searchingUsers &&
                userResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => pickUser(u)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800 transition-colors text-left"
                  >
                    {u.imageUrl ? (
                      <img
                        src={u.imageUrl}
                        alt={u.username}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 flex-shrink-0">
                        {(u.username?.[0] ?? '?').toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {u.username}
                      </p>
                      <p className="text-zinc-500 text-xs truncate">{u.email}</p>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5">
            Nombre de la organización
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Senshi Manga"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5">
            Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="ej-senshi-manga"
            className={`w-full bg-zinc-800 border rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none ${
              slug && !slugValid
                ? 'border-red-500 focus:border-red-500'
                : 'border-zinc-700 focus:border-violet-500'
            }`}
          />
          <p className="text-zinc-500 text-xs mt-1.5">
            Se usará para <code className="text-violet-400">domain</code> y{' '}
            <code className="text-violet-400">slug</code>.
          </p>
          {slug && !slugValid && (
            <p className="text-red-400 text-xs mt-1">
              Solo minúsculas, números y guiones (`a-z0-9-`).
            </p>
          )}
        </div>

        {/* NSFW switch */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <span className="relative inline-block w-10 h-6">
            <input
              type="checkbox"
              checked={isNSFW}
              onChange={(e) => setIsNSFW(e.target.checked)}
              className="peer sr-only"
            />
            <span className="absolute inset-0 bg-zinc-700 peer-checked:bg-violet-600 rounded-full transition-colors" />
            <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
          </span>
          <span className="text-zinc-200 text-sm">Es NSFW (+18)</span>
        </label>

        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            {submitting && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {submitting ? 'Creando...' : 'Crear scan'}
          </button>
        </div>
      </form>

      {/* Últimos scans dados de alta, con link listo para copiar */}
      {recentScans.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3">Últimos 5 scans dados de alta</h3>
          <div className="space-y-2">
            {recentScans.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{s.name} {s.isNSFW && <span className="text-[10px] font-black text-red-400 uppercase ml-1">NSFW</span>}</p>
                  <a href={scanUrl(s)} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline truncate block">{scanUrl(s)}</a>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-zinc-600">{new Date(s.createdAt).toLocaleDateString('es')}</span>
                  <button onClick={() => copyUrl(s)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-cyan-500 hover:text-zinc-950 transition-colors">Copiar link</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ToastContainer theme="dark" position="bottom-right" />
    </div>
  );
};

export default SuperadminCreateScan;
