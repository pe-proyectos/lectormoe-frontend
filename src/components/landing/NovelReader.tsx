import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Settings as SettingsIcon, X, Book } from 'lucide-react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

interface AdjacentChapter {
  number: number;
  title?: string;
}

interface NovelReaderProps {
  chapter: {
    number: number;
    title: string;
    bodyMarkdown?: string | null;
    nextChapter?: AdjacentChapter | null;
    previousChapter?: AdjacentChapter | null;
  };
  mangaTitle: string;
  mangaUrl: string;
  chapterUrlPattern: (chapterNumber: number) => string;
}

type Theme = 'dark' | 'sepia' | 'light';
type Family = 'serif' | 'sans' | 'mono';
type Width = 'cozy' | 'wide' | 'full';

interface Prefs {
  fontSize: number;
  family: Family;
  lineHeight: number;
  width: Width;
  theme: Theme;
}

const DEFAULT_PREFS: Prefs = {
  fontSize: 17,
  family: 'serif',
  lineHeight: 1.7,
  width: 'cozy',
  theme: 'dark',
};

const PREFS_KEY = 'novel-reader-prefs-v1';

const md = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: false });

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
  'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'hr', 'a',
  'code', 'pre', 'span', 'div',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'style'];
const FORBID_TAGS = ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
const FORBID_ATTR = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'];

const themeClassMap: Record<Theme, { wrapper: string; pageBg: string; controlBg: string; controlBorder: string; controlText: string }> = {
  dark: {
    wrapper: 'prose-invert',
    pageBg: 'bg-zinc-950',
    controlBg: 'bg-zinc-900',
    controlBorder: 'border-zinc-800',
    controlText: 'text-zinc-100',
  },
  sepia: {
    wrapper: '',
    pageBg: 'bg-[#f4ecd8]',
    controlBg: 'bg-[#e9dfc4]',
    controlBorder: 'border-[#c9b88d]',
    controlText: 'text-[#3a2f1c]',
  },
  light: {
    wrapper: '',
    pageBg: 'bg-white',
    controlBg: 'bg-zinc-50',
    controlBorder: 'border-zinc-200',
    controlText: 'text-zinc-900',
  },
};

const widthClassMap: Record<Width, string> = {
  cozy: 'max-w-2xl',
  wide: 'max-w-4xl',
  full: 'max-w-6xl',
};

const familyStyle: Record<Family, string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: '"Plus Jakarta Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", Menlo, monospace',
};

const NovelReader: React.FC<NovelReaderProps> = ({ chapter, mangaTitle, mangaUrl, chapterUrlPattern }) => {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [panelOpen, setPanelOpen] = useState(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Prefs>;
        setPrefs((p) => ({ ...p, ...parsed }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
    }, 200);
  }, [prefs]);

  const html = useMemo(() => {
    const raw = chapter?.bodyMarkdown || '';
    if (!raw) return '';
    const rendered = md.render(raw);
    const sanitized = DOMPurify.sanitize(rendered, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      FORBID_TAGS,
      FORBID_ATTR,
      ALLOWED_URI_REGEXP: /^(https?:|mailto:|#)/i,
      ADD_ATTR: ['target', 'rel'],
    });
    // Force every <a> to be external-safe.
    return sanitized.replace(/<a\s+([^>]*?)>/gi, (_m, attrs) => {
      const cleaned = attrs.replace(/\s*(target|rel)\s*=\s*"[^"]*"/gi, '').trim();
      return `<a ${cleaned} target="_blank" rel="noopener noreferrer nofollow">`;
    });
  }, [chapter?.bodyMarkdown]);

  const t = themeClassMap[prefs.theme];
  const widthCls = widthClassMap[prefs.width];

  const prevHref = chapter.previousChapter ? chapterUrlPattern(chapter.previousChapter.number) : null;
  const nextHref = chapter.nextChapter ? chapterUrlPattern(chapter.nextChapter.number) : null;

  return (
    <div className={`min-h-screen ${t.pageBg} transition-colors`}>
      {/* Header */}
      <header className={`${t.controlBg} ${t.controlBorder} border-b sticky top-0 z-20`}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <a href={mangaUrl} className={`flex items-center gap-2 ${t.controlText} hover:opacity-70 transition-opacity min-w-0`}>
            <Book size={16} className="shrink-0" />
            <span className="text-xs font-bold uppercase tracking-widest truncate">{mangaTitle}</span>
          </a>
          <div className={`text-xs font-bold ${t.controlText} opacity-70 shrink-0`}>
            Cap. {chapter.number}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={`${widthCls} mx-auto px-4 md:px-8 py-12`}>
        <h1 className={`text-3xl md:text-4xl font-black tracking-tight mb-8 ${t.controlText}`} style={{ fontFamily: familyStyle[prefs.family] }}>
          {chapter.title || `Capítulo ${chapter.number}`}
        </h1>
        {html ? (
          <article
            className={`prose ${t.wrapper} max-w-none`}
            style={{
              fontSize: `${prefs.fontSize}px`,
              lineHeight: prefs.lineHeight,
              fontFamily: familyStyle[prefs.family],
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className={`${t.controlText} opacity-70`}>Este capítulo aún no tiene contenido.</p>
        )}

        {/* Footer nav */}
        <nav className={`flex items-center justify-between gap-4 mt-16 pt-8 border-t ${t.controlBorder}`}>
          {prevHref ? (
            <a href={prevHref} className={`flex items-center gap-2 px-4 py-3 rounded-xl ${t.controlBg} ${t.controlBorder} border ${t.controlText} hover:opacity-80 transition-opacity font-bold text-sm`}>
              <ChevronLeft size={16} /> Capítulo {chapter.previousChapter?.number}
            </a>
          ) : (
            <span />
          )}
          {nextHref ? (
            <a href={nextHref} className={`flex items-center gap-2 px-4 py-3 rounded-xl ${t.controlBg} ${t.controlBorder} border ${t.controlText} hover:opacity-80 transition-opacity font-bold text-sm`}>
              Capítulo {chapter.nextChapter?.number} <ChevronRight size={16} />
            </a>
          ) : (
            <span />
          )}
        </nav>
      </main>

      {/* Floating settings toggle */}
      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        className="fixed top-20 right-4 z-30 w-12 h-12 rounded-full bg-cyan-500 text-zinc-950 shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:scale-110 transition-transform"
        title="Preferencias de lectura"
      >
        {panelOpen ? <X size={20} /> : <SettingsIcon size={20} />}
      </button>

      {/* Settings panel */}
      {panelOpen && (
        <div className={`fixed top-32 right-4 z-30 w-72 ${t.controlBg} ${t.controlBorder} border rounded-2xl shadow-2xl p-5 space-y-5 animate-in fade-in zoom-in-95 duration-200`}>
          <div>
            <label className={`block text-[11px] font-black uppercase tracking-widest ${t.controlText} opacity-70 mb-2`}>
              Tamaño: {prefs.fontSize}px
            </label>
            <input
              type="range"
              min={14}
              max={22}
              value={prefs.fontSize}
              onChange={(e) => setPrefs((p) => ({ ...p, fontSize: Number(e.target.value) }))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <span className={`block text-[11px] font-black uppercase tracking-widest ${t.controlText} opacity-70 mb-2`}>
              Familia
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(['serif', 'sans', 'mono'] as Family[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, family: f }))}
                  className={`px-2 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${
                    prefs.family === f ? 'bg-cyan-500 text-zinc-950' : `${t.controlText} opacity-70 hover:opacity-100`
                  }`}
                  style={{ fontFamily: familyStyle[f] }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={`block text-[11px] font-black uppercase tracking-widest ${t.controlText} opacity-70 mb-2`}>
              Interlineado
            </span>
            <div className="grid grid-cols-4 gap-1">
              {[1.4, 1.6, 1.8, 2.0].map((lh) => (
                <button
                  key={lh}
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, lineHeight: lh }))}
                  className={`px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
                    prefs.lineHeight === lh ? 'bg-cyan-500 text-zinc-950' : `${t.controlText} opacity-70 hover:opacity-100`
                  }`}
                >
                  {lh.toFixed(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={`block text-[11px] font-black uppercase tracking-widest ${t.controlText} opacity-70 mb-2`}>
              Ancho
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { v: 'cozy', label: 'Cómodo' },
                  { v: 'wide', label: 'Amplio' },
                  { v: 'full', label: 'Completo' },
                ] as { v: Width; label: string }[]
              ).map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, width: v }))}
                  className={`px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
                    prefs.width === v ? 'bg-cyan-500 text-zinc-950' : `${t.controlText} opacity-70 hover:opacity-100`
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={`block text-[11px] font-black uppercase tracking-widest ${t.controlText} opacity-70 mb-2`}>
              Tema
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { v: 'dark', label: 'Oscuro' },
                  { v: 'sepia', label: 'Sepia' },
                  { v: 'light', label: 'Claro' },
                ] as { v: Theme; label: string }[]
              ).map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, theme: v }))}
                  className={`px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
                    prefs.theme === v ? 'bg-cyan-500 text-zinc-950' : `${t.controlText} opacity-70 hover:opacity-100`
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovelReader;
