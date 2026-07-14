import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Zap, Search, Users, Megaphone, ChevronDown, X } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import { callAPI } from '../../util/callApi';
import ContactScanModal from './ContactScanModal';

interface Props {
  user: any;
  logged: boolean;
  nsfwMode?: boolean;
}

interface Post {
  id: number;
  title: string;
  description: string;
  requirements: string | null;
  roles: string;
  language: string;
  urgent: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  organization: { name: string; slug: string; logoUrl: string | null; _count?: { followers: number } };
}

const ROLE_LABEL: Record<string, string> = { cleaner: 'Cleaner', typer: 'Typer', traductor: 'Traductor', redrawer: 'Redrawer', proofreader: 'Proofreader', editor: 'Editor', otro: 'Otro' };
const ROLES = Object.keys(ROLE_LABEL);
const LANG_LABEL: Record<string, string> = { es: 'Español', en: 'Inglés', ambos: 'Español e inglés' };

const relTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return 'hoy';
  if (d === 1) return 'ayer';
  if (d < 30) return `hace ${d} días`;
  const months = Math.floor(d / 30);
  return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
};

const RecruitmentBoardPage: React.FC<Props> = ({ user, logged, nsfwMode = false }) => {
  const go = (url: string) => { window.location.href = url; };
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [language, setLanguage] = useState('');
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [applyPost, setApplyPost] = useState<Post | null>(null);

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 350); return () => clearTimeout(t); }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (role) params.set('role', role);
      if (language) params.set('language', language);
      if (debounced) params.set('search', debounced);
      const res = await callAPI(`/api/recruitment?${params.toString()}`);
      setPosts(res || []);
    } catch { setPosts([]); } finally { setLoading(false); }
  }, [role, language, debounced]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => (onlyUrgent ? posts.filter((p) => p.urgent) : posts), [posts, onlyUrgent]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar user={user} logged={logged} nsfwMode={nsfwMode} activeView="home"
        onOpenLogin={() => go('/login')} onOpenRegister={() => go('/register')}
        onGoHome={() => go(nsfwMode ? '/red' : '/')} onGoExplore={() => go('/scans')} onGoSearch={() => go('/search')} />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2"><Megaphone size={14} /> Comunidad</div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Mural de reclutamiento</h1>
          <p className="text-zinc-400 mt-1">Scans que buscan talento. Encuentra tu rol y postúlate en un clic.</p>
        </div>

        {/* Filtros */}
        <div className="space-y-3 mb-6">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setRole('')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${!role ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>Todos</button>
            {ROLES.map((r) => (
              <button key={r} onClick={() => setRole(role === r ? '' : r)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${role === r ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>{ROLE_LABEL[r]}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por scan o título…" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-3 text-white text-sm focus:border-cyan-500 outline-none" />
            </div>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-cyan-500 outline-none">
              <option value="">Todo idioma</option>
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="ambos">Ambos</option>
            </select>
            <button onClick={() => setOnlyUrgent((v) => !v)} className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${onlyUrgent ? 'bg-red-500 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}><Zap size={14} /> Solo urgentes</button>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-600" size={28} /></div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 text-zinc-600"><Users className="mx-auto mb-3" size={32} /><p>No hay anuncios que coincidan con tu búsqueda.</p></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((p) => {
              const roles = p.roles.split(',').filter(Boolean);
              const isOpen = expanded === p.id;
              return (
                <div key={p.id} className={`bg-zinc-900 border rounded-2xl p-5 transition-colors ${p.urgent ? 'border-red-500/40' : 'border-zinc-800'}`}>
                  <div className="flex items-start gap-3">
                    <a href={`/${p.organization.slug}`} className="shrink-0">
                      {p.organization.logoUrl ? (
                        <img src={p.organization.logoUrl} alt={p.organization.name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 font-black">{p.organization.name.charAt(0)}</div>
                      )}
                    </a>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <a href={`/${p.organization.slug}`} className="text-sm font-bold text-zinc-300 hover:text-cyan-400 truncate">{p.organization.name}</a>
                        {p.urgent && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 rounded-full px-2 py-0.5"><Zap size={10} /> Urgente</span>}
                        {p.status === 'filled' ? (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-zinc-700/40 text-zinc-400 rounded-full px-2 py-0.5">Cupos llenos</span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-green-500/15 text-green-400 rounded-full px-2 py-0.5">Reclutando</span>
                        )}
                      </div>
                      <h3 className="text-white font-black leading-tight">{p.title}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {roles.map((r) => <span key={r} className="text-[11px] font-bold bg-cyan-500/10 text-cyan-300 rounded-md px-2 py-0.5">{ROLE_LABEL[r] || r}</span>)}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-2">
                        {LANG_LABEL[p.language] || p.language} · Publicado {relTime(p.createdAt)}
                        {new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime() > 86400000 ? ` · actualizado ${relTime(p.updatedAt)}` : ''}
                      </p>
                    </div>
                  </div>

                  <button onClick={() => setExpanded(isOpen ? null : p.id)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white">
                    {isOpen ? 'Ocultar detalles' : 'Ver detalles'} <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{p.description}</p>
                      {p.requirements && (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Requisitos</p>
                          <p className="text-sm text-zinc-400 whitespace-pre-wrap">{p.requirements}</p>
                        </div>
                      )}
                      {p.status === 'open' && (
                        logged ? (
                          <button onClick={() => setApplyPost(p)} className="inline-flex items-center justify-center gap-2 bg-cyan-500 text-zinc-950 rounded-xl px-5 py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors">Postularme</button>
                        ) : (
                          <a href="/login" className="inline-flex items-center justify-center gap-2 bg-zinc-800 text-zinc-300 rounded-xl px-5 py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-colors">Inicia sesión para postularte</a>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
      {applyPost && (
        <ContactScanModal
          scanSlug={applyPost.organization.slug}
          open={!!applyPost}
          onClose={() => setApplyPost(null)}
          defaultCategory="unirme"
          defaultSubject={`Postulación: ${applyPost.title}`}
        />
      )}
    </div>
  );
};

export default RecruitmentBoardPage;
