import React, { useEffect, useState } from 'react';
import { HardDriveDownload, Trash2, BookOpen, WifiOff, Crown } from 'lucide-react';
import { notify } from '../../util/feedback';
import { getDownloads, deleteWork, DOWNLOAD_LIMITS, type DownloadedWork } from '../../util/downloads';

const isPremium = (user: any): boolean =>
  Array.isArray(user?.subscriptions) && user.subscriptions.some((s: any) => s?.active === true);

const fmtBytes = (b: number) => (b > 1e9 ? (b / 1e9).toFixed(1) + ' GB' : b > 1e6 ? (b / 1e6).toFixed(0) + ' MB' : (b / 1e3).toFixed(0) + ' KB');

interface Props { user?: any; logged?: boolean }

const DownloadsLibrary: React.FC<Props> = ({ user, logged }) => {
  const [works, setWorks] = useState<DownloadedWork[]>([]);
  const [loading, setLoading] = useState(true);
  const premium = isPremium(user);
  const limit = premium ? DOWNLOAD_LIMITS.premium : DOWNLOAD_LIMITS.free;

  const load = async () => {
    setLoading(true);
    try { setWorks(await getDownloads()); } catch { setWorks([]); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (w: DownloadedWork) => {
    if (!confirm(`¿Eliminar la descarga de "${w.title}"? Podrás volver a descargarla cuando tengas conexión.`)) return;
    await deleteWork(w.key);
    await load();
    notify.success('Descarga eliminada.');
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-2 text-cyan-400 font-black text-[10px] uppercase tracking-[0.3em] mb-1">
          <HardDriveDownload size={14} /> En este dispositivo
        </div>
        <h1 className="text-2xl font-black text-white">Mis descargas</h1>
        <div className="flex items-center justify-between mt-2 mb-6">
          <p className="text-zinc-500 text-sm">Lee sin conexión. {works.length} de {limit} obras usadas.</p>
          {!premium && (
            <a href="/scans" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300">
              <Crown size={12} /> Sube a 24
            </a>
          )}
        </div>
        {/* Barra de uso */}
        <div className="h-2 rounded-full bg-zinc-900 overflow-hidden mb-6">
          <div className="h-full bg-cyan-500 transition-all" style={{ width: `${Math.min(100, (works.length / limit) * 100)}%` }} />
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-zinc-900 rounded-2xl animate-pulse" />)}</div>
        ) : works.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-[32px]">
            <WifiOff size={36} className="mx-auto mb-3 text-zinc-700" />
            <p className="text-zinc-400 font-bold mb-1">Aún no tienes descargas</p>
            <p className="text-zinc-600 text-sm mb-4">Descarga mangas para leerlos sin conexión, en cualquier lugar.</p>
            <a href="/" className="inline-block bg-cyan-500 text-zinc-950 rounded-xl px-5 py-2.5 font-black text-[10px] uppercase tracking-widest">Explorar mangas</a>
          </div>
        ) : (
          <div className="space-y-2.5">
            {works.map((w) => (
              <div key={w.key} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
                <a href={`/descargas/leer?w=${encodeURIComponent(w.key)}`} className="shrink-0">
                  {w.cover ? <img src={w.cover} alt="" className="w-12 h-16 object-cover rounded-lg" /> : <div className="w-12 h-16 rounded-lg bg-zinc-800" />}
                </a>
                <a href={`/descargas/leer?w=${encodeURIComponent(w.key)}`} className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{w.title}</p>
                  <p className="text-xs text-zinc-500">{w.chapters.length} capítulo{w.chapters.length !== 1 ? 's' : ''} · {fmtBytes(w.bytes)}</p>
                </a>
                <a href={`/descargas/leer?w=${encodeURIComponent(w.key)}`} aria-label="Leer" className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-cyan-500/15 text-cyan-400 active:scale-95">
                  <BookOpen size={18} />
                </a>
                <button onClick={() => remove(w)} aria-label="Eliminar" className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-400 active:scale-95">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsLibrary;
