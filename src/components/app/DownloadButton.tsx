import React, { useEffect, useState } from 'react';
import { Download, Check, Loader2, Trash2, HardDriveDownload } from 'lucide-react';
import { callAPI } from '../../util/callApi';
import { notify } from '../../util/feedback';
import {
  workKey,
  getDownload,
  downloadChapter,
  deleteWork,
  canDownloadNewWork,
  DOWNLOAD_LIMITS,
  type DownloadedWork,
} from '../../util/downloads';

interface ChapterLite {
  number: number;
  title?: string;
  isUnreleased?: boolean;
}

interface Props {
  user?: any;
  scanSlug: string;
  mangaSlug: string;
  title: string;
  coverUrl: string;
  chapters: ChapterLite[];
  isJoint?: boolean;
}

const isPremium = (user: any): boolean =>
  Array.isArray(user?.subscriptions) && user.subscriptions.some((s: any) => s?.active === true);

// Descarga una obra completa (sus capítulos publicados) para leer sin conexión.
// La descarga ocurre estando en línea; luego se lee cifrada desde el dispositivo.
const DownloadButton: React.FC<Props> = ({ user, scanSlug, mangaSlug, title, coverUrl, chapters, isJoint = false }) => {
  const wk = workKey(scanSlug, mangaSlug, isJoint);
  const [state, setState] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [existing, setExisting] = useState<DownloadedWork | null>(null);
  const [progress, setProgress] = useState({ ch: 0, total: 0 });

  const refresh = async () => {
    const w = await getDownload(wk);
    setExisting(w || null);
    setState(w ? 'done' : 'idle');
  };
  useEffect(() => { refresh(); }, [wk]);

  const releasedChapters = chapters.filter((c) => !c.isUnreleased);

  const start = async () => {
    if (!user) { notify.error('Inicia sesión para descargar.'); return; }
    const premium = isPremium(user);
    const gate = await canDownloadNewWork(premium, wk);
    if (!gate.ok) {
      notify.error(
        `Alcanzaste tu límite de ${gate.limit} descargas${premium ? '' : ' (gratis)'}. Libera espacio en Descargas${premium ? '.' : ' o hazte premium para 24.'}`,
        { autoClose: 6000 }
      );
      window.location.href = '/descargas';
      return;
    }
    setState('downloading');
    setProgress({ ch: 0, total: releasedChapters.length });
    try {
      let done = 0;
      for (const ch of releasedChapters) {
        // Trae las páginas del capítulo (estando en línea).
        const pages = await callAPI(`/api/manga-custom/${mangaSlug}/chapter/${ch.number}/pages`, {
          headers: { 'x-organization': scanSlug },
        });
        const pageUrls: string[] = (Array.isArray(pages) ? pages : []).map((p: any) => p.imageUrl).filter(Boolean);
        if (pageUrls.length > 0) {
          await downloadChapter({
            work: { key: wk, title, coverUrl, scanSlug, mangaSlug, isJoint },
            chapter: { number: ch.number, title: ch.title || `Capítulo ${ch.number}` },
            pageUrls,
          });
        }
        done++;
        setProgress({ ch: done, total: releasedChapters.length });
      }
      await refresh();
      notify.success(`${title} descargado. Lee sin conexión desde Descargas.`);
    } catch (e: any) {
      notify.error(e?.message || 'La descarga se interrumpió. Intenta de nuevo.');
      await refresh();
    }
  };

  const remove = async () => {
    await deleteWork(wk);
    await refresh();
    notify.success('Descarga eliminada del dispositivo.');
  };

  if (state === 'downloading') {
    return (
      <button disabled className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 text-zinc-300 px-4 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-widest">
        <Loader2 size={16} className="animate-spin" /> Descargando {progress.ch}/{progress.total}
      </button>
    );
  }

  if (state === 'done' && existing) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-500/15 text-green-400 px-3 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-widest">
          <Check size={16} /> Descargado
        </span>
        {existing.chapters.length < releasedChapters.length && (
          <button onClick={start} className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 text-zinc-950 px-3 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-widest active:scale-95">
            <Download size={15} /> Actualizar
          </button>
        )}
        <button onClick={remove} aria-label="Eliminar descarga" className="inline-flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-400 w-11 h-11 active:scale-95">
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <button onClick={start} className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-cyan-500 hover:text-zinc-950 px-4 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-widest transition-colors active:scale-95">
      <HardDriveDownload size={16} /> Descargar
    </button>
  );
};

export default DownloadButton;
