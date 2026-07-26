import React, { useEffect, useRef, useState } from 'react';
import { Download, Check, Loader2, Trash2, HardDriveDownload, X, Library } from 'lucide-react';
import { callAPI } from '../../util/callApi';
import { notify } from '../../util/feedback';
import {
  workKey,
  getDownload,
  downloadChapter,
  deleteWork,
  canDownloadNewWork,
  DownloadCancelled,
  type DownloadedWork,
} from '../../util/downloads';
import BottomSheet from '../ui/BottomSheet';

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

// Descarga una obra para leer sin conexión. El usuario elige qué capítulos,
// puede cancelar, y accede a su biblioteca de descargas. La descarga ocurre en
// línea; luego se lee cifrada desde el dispositivo.
const DownloadButton: React.FC<Props> = ({ user, scanSlug, mangaSlug, title, coverUrl, chapters, isJoint = false }) => {
  const wk = workKey(scanSlug, mangaSlug, isJoint);
  const [state, setState] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [existing, setExisting] = useState<DownloadedWork | null>(null);
  const [progress, setProgress] = useState({ ch: 0, total: 0, page: 0, pageTotal: 0 });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  const refresh = async () => {
    const w = await getDownload(wk);
    setExisting(w || null);
    setState(w ? 'done' : 'idle');
  };
  useEffect(() => { refresh(); }, [wk]);

  const releasedChapters = chapters.filter((c) => !c.isUnreleased);
  const downloadedSet = new Set((existing?.chapters || []).map((c) => c.number));
  const pending = releasedChapters.filter((c) => !downloadedSet.has(c.number));

  const openPicker = async () => {
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
    setSelected(new Set(pending.map((c) => c.number))); // preselecciona los pendientes
    setPickerOpen(true);
  };

  const toggle = (n: number) =>
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(n)) s.delete(n); else s.add(n);
      return s;
    });
  const allPendingSelected = pending.length > 0 && pending.every((c) => selected.has(c.number));
  const toggleAll = () => setSelected(allPendingSelected ? new Set() : new Set(pending.map((c) => c.number)));

  const downloadSelected = async () => {
    const list = releasedChapters.filter((c) => selected.has(c.number) && !downloadedSet.has(c.number));
    if (list.length === 0) { setPickerOpen(false); return; }
    setPickerOpen(false);
    const controller = new AbortController();
    abortRef.current = controller;
    setState('downloading');
    setProgress({ ch: 0, total: list.length, page: 0, pageTotal: 0 });
    try {
      let done = 0;
      for (const ch of list) {
        if (controller.signal.aborted) throw new DownloadCancelled();
        const pages = await callAPI(`/api/manga-custom/${mangaSlug}/chapter/${ch.number}/pages`, {
          headers: { 'x-organization': scanSlug },
        });
        const pageUrls: string[] = (Array.isArray(pages) ? pages : []).map((p: any) => p.imageUrl).filter(Boolean);
        if (pageUrls.length > 0) {
          await downloadChapter({
            work: { key: wk, title, coverUrl, scanSlug, mangaSlug, isJoint },
            chapter: { number: ch.number, title: ch.title || `Capítulo ${ch.number}` },
            pageUrls,
            signal: controller.signal,
            onProgress: (p, t) => setProgress((prev) => ({ ...prev, page: p, pageTotal: t })),
          });
        }
        done++;
        setProgress((prev) => ({ ...prev, ch: done, page: 0, pageTotal: 0 }));
      }
      await refresh();
      notify.success(`${title}: ${list.length} capítulo(s) descargados. Léelos sin conexión desde Descargas.`);
    } catch (e: any) {
      await refresh();
      if (e instanceof DownloadCancelled || e?.name === 'AbortError') {
        notify.success('Descarga cancelada. Lo ya descargado se conservó.');
      } else {
        notify.error(e?.message || 'La descarga se interrumpió. Intenta de nuevo.');
      }
    } finally {
      abortRef.current = null;
    }
  };

  const cancel = () => abortRef.current?.abort();

  const remove = async () => {
    if (typeof window !== 'undefined' && !window.confirm('¿Eliminar esta descarga del dispositivo?')) return;
    await deleteWork(wk);
    await refresh();
    notify.success('Descarga eliminada del dispositivo.');
  };

  const picker = (
    <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Elegir capítulos">
      <div className="space-y-3">
        {pending.length === 0 ? (
          <p className="text-sm text-zinc-400">Ya descargaste todos los capítulos disponibles.</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <button onClick={toggleAll} className="text-xs font-black uppercase tracking-widest text-cyan-400">
                {allPendingSelected ? 'Quitar todos' : 'Seleccionar todos'}
              </button>
              <span className="text-xs text-zinc-500">{selected.size} seleccionados</span>
            </div>
            <div className="max-h-[50vh] overflow-y-auto space-y-1 pr-1">
              {releasedChapters.map((c) => {
                const dl = downloadedSet.has(c.number);
                const on = selected.has(c.number);
                return (
                  <button
                    key={c.number}
                    disabled={dl}
                    onClick={() => toggle(c.number)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      dl ? 'opacity-50' : on ? 'bg-cyan-500/15 border border-cyan-500/30' : 'bg-zinc-900 border border-zinc-800'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                        dl ? 'bg-green-500 text-zinc-950' : on ? 'bg-cyan-500 text-zinc-950' : 'border border-zinc-600'
                      }`}
                    >
                      {(dl || on) && <Check size={14} />}
                    </span>
                    <span className="text-sm text-white truncate">
                      Capítulo {c.number}
                      {c.title ? ` · ${c.title}` : ''}
                    </span>
                    {dl && <span className="ml-auto text-[10px] font-black text-green-400 uppercase shrink-0">Descargado</span>}
                  </button>
                );
              })}
            </div>
            <button
              onClick={downloadSelected}
              disabled={selected.size === 0}
              className="w-full py-3 rounded-2xl bg-cyan-500 text-zinc-950 font-black uppercase text-xs tracking-widest disabled:opacity-50 active:scale-95 transition-transform"
            >
              Descargar {selected.size} capítulo(s)
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  );

  if (state === 'downloading') {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 text-zinc-300 px-4 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-widest">
          <Loader2 size={16} className="animate-spin" /> {progress.ch}/{progress.total}
          {progress.pageTotal ? ` · pág ${progress.page}/${progress.pageTotal}` : ''}
        </span>
        <button
          onClick={cancel}
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/25 px-3 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-widest active:scale-95"
        >
          <X size={15} /> Cancelar
        </button>
      </div>
    );
  }

  return (
    <>
      {picker}
      <div className="inline-flex items-center gap-2 flex-wrap">
        {state === 'done' && existing ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-500/15 text-green-400 px-3 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-widest">
              <Check size={16} /> {existing.chapters.length} descargados
            </span>
            {pending.length > 0 && (
              <button
                onClick={openPicker}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 text-zinc-950 px-3 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-widest active:scale-95"
              >
                <Download size={15} /> Añadir
              </button>
            )}
            <button
              onClick={remove}
              aria-label="Eliminar descarga"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-400 w-11 h-11 active:scale-95"
            >
              <Trash2 size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={openPicker}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-cyan-500 hover:text-zinc-950 px-4 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-widest transition-colors active:scale-95"
          >
            <HardDriveDownload size={16} /> Descargar
          </button>
        )}
        <a
          href="/descargas"
          className="inline-flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-cyan-400 w-11 h-11 active:scale-95"
          aria-label="Ver mis descargas"
          title="Ver mis descargas"
        >
          <Library size={16} />
        </a>
      </div>
    </>
  );
};

export default DownloadButton;
