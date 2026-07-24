import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, List, X } from 'lucide-react';
import { getDownload, getDecryptedChapterPages, revokePageUrls, type DownloadedWork } from '../../util/downloads';

// Lector offline con gestos nativos: deslizar para cambiar de página, zonas de
// toque izquierda/derecha, toque central para mostrar/ocultar la UI y doble
// toque para acercar. Las páginas se descifran en memoria (object URLs) y se
// revocan al salir para no dejar nada legible.
interface Props { workKey: string }

const OfflineReader: React.FC<Props> = ({ workKey }) => {
  const [work, setWork] = useState<DownloadedWork | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [uiVisible, setUiVisible] = useState(true);
  const [showChapters, setShowChapters] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);

  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTap = useRef(0);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    getDownload(workKey).then((w) => {
      setWork(w || null);
      if (w && w.chapters.length) openChapter(w.chapters[0].number, w);
    });
    return () => { revokePageUrls(urlsRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workKey]);

  const openChapter = useCallback(async (num: number, w?: DownloadedWork | null) => {
    const wk = (w || work);
    if (!wk) return;
    setLoading(true);
    setShowChapters(false);
    revokePageUrls(urlsRef.current);
    try {
      const urls = await getDecryptedChapterPages(workKey, num);
      urlsRef.current = urls;
      setPages(urls);
      setChapter(num);
      setIdx(0);
      setZoom(1);
      setUiVisible(true);
    } finally {
      setLoading(false);
    }
  }, [work, workKey]);

  const go = (dir: 1 | -1) => {
    setZoom(1);
    setIdx((i) => {
      const next = i + dir;
      if (next < 0) { prevChapter(); return i; }
      if (next >= pages.length) { nextChapter(); return i; }
      return next;
    });
  };

  const chapterList = work?.chapters || [];
  const chapterPos = chapterList.findIndex((c) => c.number === chapter);
  const nextChapter = () => { if (chapterPos >= 0 && chapterPos < chapterList.length - 1) openChapter(chapterList[chapterPos + 1].number); };
  const prevChapter = () => { if (chapterPos > 0) openChapter(chapterList[chapterPos - 1].number); };

  // ── Gestos ──────────────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touchStart.current;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    const dt = Date.now() - s.t;
    const absX = Math.abs(dx), absY = Math.abs(dy);
    // Deslizar horizontal → cambiar de página (si no está en zoom).
    if (zoom === 1 && absX > 50 && absX > absY * 1.5) {
      go(dx < 0 ? 1 : -1);
      return;
    }
    // Toque corto sin desplazamiento → zonas / doble toque / UI.
    if (dt < 250 && absX < 12 && absY < 12) {
      const now = Date.now();
      if (now - lastTap.current < 280) {
        // Doble toque → alternar zoom.
        setZoom((z) => (z === 1 ? 2 : 1));
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;
      const w = window.innerWidth;
      setTimeout(() => {
        if (lastTap.current === now) {
          if (t.clientX < w * 0.33) go(-1);
          else if (t.clientX > w * 0.67) go(1);
          else setUiVisible((v) => !v);
        }
      }, 280);
    }
  };

  if (!work) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 p-6 text-center">
        Esta descarga no está disponible en el dispositivo.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black select-none overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Página actual */}
      <div className="w-full h-full flex items-center justify-center overflow-auto">
        {loading ? (
          <div className="w-8 h-8 border-3 border-zinc-700 border-t-cyan-500 rounded-full animate-spin" />
        ) : pages[idx] ? (
          <img
            src={pages[idx]}
            alt=""
            draggable={false}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          />
        ) : (
          <p className="text-zinc-600">Sin páginas</p>
        )}
      </div>

      {/* Barra superior */}
      <div className={`fixed top-0 inset-x-0 z-20 bg-gradient-to-b from-black/90 to-transparent pt-[env(safe-area-inset-top)] transition-opacity ${uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3 px-4 h-14">
          <a href="/descargas" aria-label="Volver" className="w-11 h-11 -ml-2 flex items-center justify-center text-white"><ArrowLeft size={22} /></a>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-black truncate">{work.title}</p>
            <p className="text-zinc-400 text-[11px]">Capítulo {chapter}</p>
          </div>
          <button onClick={() => setShowChapters(true)} aria-label="Capítulos" className="w-11 h-11 flex items-center justify-center text-white"><List size={20} /></button>
        </div>
      </div>

      {/* Barra inferior con progreso */}
      <div className={`fixed bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/90 to-transparent pb-[env(safe-area-inset-bottom)] transition-opacity ${uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => go(-1)} className="w-11 h-11 flex items-center justify-center text-white"><ChevronLeft size={22} /></button>
          <div className="flex-1 text-center text-zinc-300 text-xs font-bold">{pages.length ? idx + 1 : 0} / {pages.length}</div>
          <button onClick={() => go(1)} className="w-11 h-11 flex items-center justify-center text-white"><ChevronRight size={22} /></button>
        </div>
      </div>

      {/* Hoja de capítulos */}
      {showChapters && (
        <div className="fixed inset-0 z-30 bg-black/70 flex items-end" onClick={() => setShowChapters(false)}>
          <div className="w-full bg-zinc-900 rounded-t-[24px] max-h-[70dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 h-14 border-b border-zinc-800 sticky top-0 bg-zinc-900">
              <span className="text-white font-black text-sm uppercase tracking-widest">Capítulos</span>
              <button onClick={() => setShowChapters(false)} className="w-11 h-11 -mr-2 flex items-center justify-center text-zinc-400"><X size={20} /></button>
            </div>
            {chapterList.map((c) => (
              <button key={c.number} onClick={() => openChapter(c.number)} className={`w-full text-left px-5 min-h-[48px] flex items-center text-sm font-bold ${c.number === chapter ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                Capítulo {c.number}{c.title ? ` · ${c.title}` : ''}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineReader;
