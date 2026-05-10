import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Settings as SettingsIcon, X, Book,
  Type, Palette, Layout as LayoutIcon, Eye, RotateCcw, Maximize2,
  AlignLeft, AlignCenter, AlignJustify, Clock, List, ArrowUp, Bookmark,
} from 'lucide-react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import CommentsSection from './CommentsSection';
import { callAPI } from '../../util/callApi';

interface AdjacentChapter {
  number: number;
  title?: string;
  releasedAt?: string | Date | null;
}

interface NovelReaderProps {
  chapter: {
    id?: number;
    number: number;
    title: string;
    bodyMarkdown?: string | null;
    nextChapter?: AdjacentChapter | null;
    previousChapter?: AdjacentChapter | null;
  };
  mangaTitle: string;
  mangaUrl: string;
  mangaSlug?: string;
  chapterUrlPattern: (chapterNumber: number) => string;
  user?: any;
  logged?: boolean;
  organization?: any;
  organizationSlug?: string;
}

type Theme = 'dark' | 'sepia' | 'cream' | 'paper' | 'gray' | 'midnight' | 'highContrast' | 'custom';
type Width = 'narrow' | 'cozy' | 'wide' | 'full';
type Alignment = 'left' | 'justify' | 'center';
type TabKey = 'text' | 'layout' | 'theme' | 'reading';

interface Prefs {
  fontSize: number;
  family: string;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  paragraphSpacing: number;
  paragraphIndent: boolean;
  width: Width;
  alignment: Alignment;
  theme: Theme;
  customBg: string;
  customText: string;
  dropCaps: boolean;
  showProgress: boolean;
  rememberScroll: boolean;
}

interface ThemePalette {
  bg: string;
  text: string;
  accent: string;
  ui: string;
  uiText: string;
  border: string;
  subtle: string;
}

const THEMES: Record<Exclude<Theme, 'custom'>, ThemePalette> = {
  dark:        { bg: '#0a0a0b', text: '#e6e6e6', accent: '#06b6d4', ui: '#18181b', uiText: '#fafafa', border: '#27272a', subtle: '#a1a1aa' },
  sepia:       { bg: '#f4ecd8', text: '#3a2f1c', accent: '#a16207', ui: '#e9dfc4', uiText: '#3a2f1c', border: '#c9b88d', subtle: '#6b5a3e' },
  cream:       { bg: '#faf6ed', text: '#2d2418', accent: '#d97706', ui: '#f0e8d3', uiText: '#2d2418', border: '#e5d5a8', subtle: '#5c4d2c' },
  paper:       { bg: '#fdfcf7', text: '#171717', accent: '#0891b2', ui: '#f5f5f4', uiText: '#171717', border: '#e7e5e4', subtle: '#57534e' },
  gray:        { bg: '#1c1c1e', text: '#d4d4d8', accent: '#06b6d4', ui: '#27272a', uiText: '#fafafa', border: '#3f3f46', subtle: '#a1a1aa' },
  midnight:    { bg: '#0c1224', text: '#cbd5e1', accent: '#7dd3fc', ui: '#1e293b', uiText: '#f1f5f9', border: '#334155', subtle: '#94a3b8' },
  highContrast:{ bg: '#000000', text: '#ffffff', accent: '#fbbf24', ui: '#0a0a0a', uiText: '#ffffff', border: '#525252', subtle: '#a3a3a3' },
};

interface FontDef {
  name: string;
  value: string;
  category: 'serif' | 'sans' | 'mono' | 'a11y';
  google?: string;
}

const FONTS: FontDef[] = [
  { name: 'Georgia',              value: 'Georgia, "Times New Roman", serif',                       category: 'serif' },
  { name: 'Lora',                 value: '"Lora", Georgia, serif',                                  category: 'serif', google: 'Lora:wght@400;500;700' },
  { name: 'Merriweather',         value: '"Merriweather", Georgia, serif',                          category: 'serif', google: 'Merriweather:wght@400;700;900' },
  { name: 'Crimson Text',         value: '"Crimson Text", Georgia, serif',                          category: 'serif', google: 'Crimson+Text:wght@400;600;700' },
  { name: 'Playfair Display',     value: '"Playfair Display", Georgia, serif',                      category: 'serif', google: 'Playfair+Display:wght@400;600;800' },
  { name: 'System UI',            value: 'system-ui, -apple-system, "Segoe UI", sans-serif',        category: 'sans' },
  { name: 'Inter',                value: '"Inter", system-ui, sans-serif',                          category: 'sans', google: 'Inter:wght@400;600;800' },
  { name: 'Plus Jakarta',         value: '"Plus Jakarta Sans", system-ui, sans-serif',              category: 'sans', google: 'Plus+Jakarta+Sans:wght@400;600;800' },
  { name: 'Atkinson Hyperlegible',value: '"Atkinson Hyperlegible", system-ui, sans-serif',          category: 'a11y', google: 'Atkinson+Hyperlegible:wght@400;700' },
  { name: 'OpenDyslexic',         value: '"OpenDyslexic", system-ui, sans-serif',                   category: 'a11y', google: 'OpenDyslexic:wght@400;700' },
  { name: 'JetBrains Mono',       value: '"JetBrains Mono", Menlo, monospace',                      category: 'mono', google: 'JetBrains+Mono:wght@400;700' },
];

const FONT_CATEGORY_LABELS: Record<FontDef['category'], string> = {
  serif: 'Serif',
  sans: 'Sans-serif',
  mono: 'Monoespaciada',
  a11y: 'Accesibles',
};

const WIDTH_PX: Record<Width, string> = {
  narrow: '34rem',
  cozy:   '44rem',
  wide:   '58rem',
  full:   '74rem',
};

const WIDTH_LABELS: Record<Width, string> = {
  narrow: 'Estrecho',
  cozy:   'Cómodo',
  wide:   'Amplio',
  full:   'Completo',
};

const THEME_LABELS: Record<Theme, string> = {
  dark:         'Oscuro',
  sepia:        'Sepia',
  cream:        'Crema',
  paper:        'Papel',
  gray:         'Gris',
  midnight:     'Medianoche',
  highContrast: 'Alto contraste',
  custom:       'Personalizado',
};

const DEFAULT_PREFS: Prefs = {
  fontSize: 18,
  family: 'Georgia, "Times New Roman", serif',
  lineHeight: 1.7,
  letterSpacing: 0,
  wordSpacing: 0,
  paragraphSpacing: 1.0,
  paragraphIndent: false,
  width: 'cozy',
  alignment: 'left',
  theme: 'dark',
  customBg: '#0a0a0b',
  customText: '#e6e6e6',
  dropCaps: false,
  showProgress: true,
  rememberScroll: true,
};

const PREFS_KEY = 'novel-reader-prefs-v2';
const SCROLL_KEY_PREFIX = 'novel-reader-scroll:';
const WORDS_PER_MIN = 230;

const md = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: false });

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
  'blockquote', 'hr', 'a', 'code', 'pre', 'span', 'div',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];
const FORBID_TAGS = ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
const FORBID_ATTR = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'];

const loadedGoogleFonts = new Set<string>();
function loadGoogleFont(spec: string) {
  if (typeof document === 'undefined' || loadedGoogleFonts.has(spec)) return;
  loadedGoogleFonts.add(spec);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  document.head.appendChild(link);
}

function getThemePalette(prefs: Prefs): ThemePalette {
  if (prefs.theme === 'custom') {
    const bg = prefs.customBg;
    const text = prefs.customText;
    const isDark = isDarkColor(bg);
    return {
      bg, text,
      accent: '#06b6d4',
      ui: shadeColor(bg, isDark ? 8 : -6),
      uiText: text,
      border: shadeColor(bg, isDark ? 18 : -14),
      subtle: shadeColor(text, isDark ? -30 : 30),
    };
  }
  return THEMES[prefs.theme];
}

function isDarkColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length !== 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
}

function shadeColor(hex: string, percent: number): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return hex;
  let r = parseInt(c.slice(0, 2), 16);
  let g = parseInt(c.slice(2, 4), 16);
  let b = parseInt(c.slice(4, 6), 16);
  r = Math.max(0, Math.min(255, Math.round(r + (255 - r) * (percent / 100))));
  g = Math.max(0, Math.min(255, Math.round(g + (255 - g) * (percent / 100))));
  b = Math.max(0, Math.min(255, Math.round(b + (255 - b) * (percent / 100))));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const NovelReader: React.FC<NovelReaderProps> = ({
  chapter, mangaTitle, mangaUrl, mangaSlug, chapterUrlPattern,
  user, logged, organization, organizationSlug,
}) => {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('text');
  const [focusMode, setFocusMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // ONE bookmark per work (manga/novel). Stored on the backend as a row in
  // user_page_bookmark; for novels pageNumber encodes scroll % (1-100).
  // null means the user has no bookmark on this work yet.
  const [workBookmark, setWorkBookmark] = useState<{ id: number; chapterId: number; chapterNumber: number; pageNumber: number } | null>(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [bookmarkFlash, setBookmarkFlash] = useState<{ kind: 'added' | 'removed' | 'error'; msg: string } | null>(null);
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  const scrollKey = `${SCROLL_KEY_PREFIX}${mangaUrl}#${chapter.number}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Prefs>;
        setPrefs((p) => ({ ...p, ...parsed }));
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
    }, 200);
  }, [prefs, hydrated]);

  // Lazy-load Google Font when picked
  useEffect(() => {
    const font = FONTS.find((f) => f.value === prefs.family);
    if (font?.google) loadGoogleFont(font.google);
  }, [prefs.family]);

  // Load the single bookmark this user has for THIS work (if any). We fetch
  // all bookmarks and pick one that lives on a chapter belonging to the same
  // mangaCustom — there can only be one per work by backend invariant.
  useEffect(() => {
    if (!logged || !chapter?.id) { setWorkBookmark(null); return; }
    callAPI('/api/bookmarks')
      .then((data: any[]) => {
        const ours = (data || []).find((b: any) =>
          b.chapter?.mangaCustom?.manga?.slug === mangaSlug ||
          (b.chapterId ?? b.chapter?.id) === chapter.id
        );
        setWorkBookmark(ours
          ? {
              id: ours.id,
              chapterId: ours.chapterId ?? ours.chapter?.id,
              chapterNumber: ours.chapter?.number ?? chapter.number,
              pageNumber: ours.pageNumber,
            }
          : null);
      })
      .catch(() => setWorkBookmark(null));
  }, [logged, chapter?.id, mangaSlug]);

  // If we arrived with ?page=N, scroll to that percentage after the article
  // renders. Defers a frame to make sure layout is final.
  useEffect(() => {
    if (typeof window === 'undefined' || !hydrated) return;
    const params = new URLSearchParams(window.location.search);
    const target = params.get('page');
    if (!target) return;
    const pct = Math.max(1, Math.min(100, parseInt(target, 10)));
    if (Number.isNaN(pct)) return;
    requestAnimationFrame(() => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      window.scrollTo({ top: (max * pct) / 100, behavior: 'auto' });
    });
  }, [hydrated, chapter?.id]);

  // Bookmark interaction model — clicking the floating button always opens a
  // modal that surfaces the available actions ("save here", "go to bookmark",
  // "delete bookmark"). Auto-detecting "are you at the bookmark" doesn't work
  // reliably across reading modes (e.g. cascade mangas), so we make every
  // action explicit.
  const isOnBookmarkedChapter = !!workBookmark && workBookmark.chapterId === chapter?.id;

  const scrollToPercent = (pct: number) => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    window.scrollTo({ top: (max * pct) / 100, behavior: 'smooth' });
  };

  const saveBookmarkHere = async () => {
    if (!chapter?.id || bookmarkLoading) return;
    const pageNumber = Math.max(1, Math.min(100, Math.round(scrollProgress) || 1));
    setBookmarkLoading(true);
    try {
      const result: any = await callAPI('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: chapter.id, pageNumber }),
      });
      const bk = result?.bookmark ?? result?.data?.bookmark;
      if (bk) setWorkBookmark({ id: bk.id, chapterId: bk.chapterId, chapterNumber: chapter.number, pageNumber: bk.pageNumber });
      setBookmarkFlash({ kind: 'added', msg: `Marcador guardado al ${pageNumber}%` });
    } catch (err: any) {
      setBookmarkFlash({ kind: 'error', msg: err?.message || 'No se pudo guardar el marcador' });
    } finally {
      setBookmarkLoading(false);
      setBookmarkModalOpen(false);
      setTimeout(() => setBookmarkFlash(null), 2500);
    }
  };

  const deleteCurrentBookmark = async () => {
    if (!workBookmark || bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      await callAPI(`/api/bookmarks/${workBookmark.id}`, { method: 'DELETE' });
      setWorkBookmark(null);
      setBookmarkFlash({ kind: 'removed', msg: 'Marcador eliminado' });
    } catch (err: any) {
      setBookmarkFlash({ kind: 'error', msg: err?.message || 'No se pudo eliminar el marcador' });
    } finally {
      setBookmarkLoading(false);
      setBookmarkModalOpen(false);
      setTimeout(() => setBookmarkFlash(null), 2500);
    }
  };

  const goToBookmark = () => {
    if (!workBookmark) return;
    if (isOnBookmarkedChapter) {
      scrollToPercent(workBookmark.pageNumber);
      setBookmarkModalOpen(false);
      return;
    }
    const target = chapterUrlPattern(workBookmark.chapterNumber);
    window.location.href = `${target}${target.includes('?') ? '&' : '?'}page=${workBookmark.pageNumber}`;
  };

  const handleBookmarkClick = () => {
    if (!chapter?.id) return;
    if (!logged) {
      setBookmarkFlash({ kind: 'error', msg: 'Inicia sesión para marcar este punto.' });
      setTimeout(() => setBookmarkFlash(null), 2500);
      return;
    }
    setBookmarkModalOpen(true);
  };

  // Scroll progress + remember position
  useEffect(() => {
    if (!hydrated) return;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      setScrollProgress(pct);
      if (prefs.rememberScroll) {
        if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
        scrollSaveTimer.current = setTimeout(() => {
          try { localStorage.setItem(scrollKey, String(window.scrollY)); } catch {}
        }, 250);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [hydrated, prefs.rememberScroll, scrollKey]);

  // Restore scroll on mount (after hydration)
  useEffect(() => {
    if (!hydrated || !prefs.rememberScroll) return;
    try {
      const saved = localStorage.getItem(scrollKey);
      if (saved) {
        const y = parseInt(saved, 10);
        if (!Number.isNaN(y) && y > 50) {
          requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'auto' }));
        }
      }
    } catch {}
  }, [hydrated, scrollKey, prefs.rememberScroll]);

  const prevHref = chapter.previousChapter ? chapterUrlPattern(chapter.previousChapter.number) : null;
  const nextHref = chapter.nextChapter ? chapterUrlPattern(chapter.nextChapter.number) : null;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
      if (target && target.isContentEditable) return;
      if (e.key === 'Escape') {
        if (panelOpen) setPanelOpen(false);
        else if (focusMode) setFocusMode(false);
      } else if (e.key === 's' || e.key === 'S') {
        if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); setPanelOpen((o) => !o); }
      } else if (e.key === 'f' || e.key === 'F') {
        if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); setFocusMode((o) => !o); }
      } else if (e.key === 'ArrowLeft' && prevHref) {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); window.location.href = prevHref; }
      } else if (e.key === 'ArrowRight' && nextHref) {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); window.location.href = nextHref; }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [panelOpen, focusMode, prevHref, nextHref]);

  // Click outside to close panel
  useEffect(() => {
    if (!panelOpen) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (toggleRef.current?.contains(t)) return;
      setPanelOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [panelOpen]);

  const html = useMemo(() => {
    const raw = chapter?.bodyMarkdown || '';
    if (!raw) return '';
    const rendered = md.render(raw);
    const sanitized = DOMPurify.sanitize(rendered, {
      ALLOWED_TAGS, ALLOWED_ATTR, FORBID_TAGS, FORBID_ATTR,
      ALLOWED_URI_REGEXP: /^(https?:|mailto:|#)/i,
      ADD_ATTR: ['target', 'rel'],
    });
    return sanitized.replace(/<a\s+([^>]*?)>/gi, (_m, attrs) => {
      const cleaned = attrs.replace(/\s*(target|rel)\s*=\s*"[^"]*"/gi, '').trim();
      return `<a ${cleaned} target="_blank" rel="noopener noreferrer nofollow">`;
    });
  }, [chapter?.bodyMarkdown]);

  const wordCount = useMemo(() => {
    const raw = chapter?.bodyMarkdown || '';
    if (!raw) return 0;
    const stripped = raw.replace(/[#*_>`~\-]/g, ' ').replace(/\[(.*?)\]\(.*?\)/g, '$1');
    return stripped.split(/\s+/).filter(Boolean).length;
  }, [chapter?.bodyMarkdown]);

  const readingMinutes = Math.max(1, Math.round(wordCount / WORDS_PER_MIN));
  const palette = getThemePalette(prefs);

  const articleStyle: React.CSSProperties = {
    color: palette.text,
    fontFamily: prefs.family,
    fontSize: `${prefs.fontSize}px`,
    lineHeight: prefs.lineHeight,
    letterSpacing: `${prefs.letterSpacing}px`,
    wordSpacing: `${prefs.wordSpacing}px`,
    textAlign: prefs.alignment,
    maxWidth: '100%',
  };

  const dynamicCss = `
    .nr-article p { margin: 0 0 ${prefs.paragraphSpacing}em 0; ${prefs.paragraphIndent ? 'text-indent: 1.5em;' : ''} }
    .nr-article p:first-of-type { text-indent: 0; }
    ${prefs.dropCaps ? `
    .nr-article > p:first-of-type::first-letter {
      float: left;
      font-size: 3.4em;
      line-height: 0.95;
      padding: 0.05em 0.12em 0 0;
      font-weight: 700;
      color: ${palette.accent};
    }` : ''}
    .nr-article h1, .nr-article h2, .nr-article h3, .nr-article h4 { color: ${palette.text}; font-weight: 700; margin: 1.6em 0 0.6em; line-height: 1.25; }
    .nr-article h1 { font-size: 1.6em; } .nr-article h2 { font-size: 1.4em; } .nr-article h3 { font-size: 1.2em; } .nr-article h4 { font-size: 1.05em; }
    .nr-article a { color: ${palette.accent}; text-decoration: underline; text-underline-offset: 3px; }
    .nr-article blockquote { border-left: 3px solid ${palette.border}; padding-left: 1em; color: ${palette.subtle}; font-style: italic; margin: 1em 0; }
    .nr-article hr { border: none; border-top: 1px solid ${palette.border}; margin: 2em 0; }
    .nr-article ul, .nr-article ol { padding-left: 1.6em; margin: 0 0 ${prefs.paragraphSpacing}em 0; }
    .nr-article li { margin: 0.3em 0; }
    .nr-article code { background: ${palette.ui}; padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.92em; }
    .nr-article pre { background: ${palette.ui}; padding: 1em; border-radius: 8px; overflow-x: auto; }
    .nr-article pre code { background: transparent; padding: 0; }
    .nr-range::-webkit-slider-thumb { background: ${palette.accent}; }
    .nr-range { accent-color: ${palette.accent}; }
  `;

  const reset = () => setPrefs(DEFAULT_PREFS);

  return (
    <div style={{ background: palette.bg, color: palette.text, minHeight: '100vh', transition: 'background-color 200ms' }}>
      <style dangerouslySetInnerHTML={{ __html: dynamicCss }} />

      {/* Reading progress */}
      {prefs.showProgress && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'transparent', zIndex: 40, pointerEvents: 'none' }}>
          <div style={{ height: '100%', width: `${scrollProgress}%`, background: palette.accent, transition: 'width 80ms linear' }} />
        </div>
      )}

      {/* Header */}
      {!focusMode && (
        <header style={{ background: palette.ui, borderBottom: `1px solid ${palette.border}`, position: 'sticky', top: 0, zIndex: 20 }}>
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
            <a href={mangaUrl} className="flex items-center gap-2 hover:opacity-70 transition-opacity min-w-0" style={{ color: palette.uiText }}>
              <Book size={16} className="shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest truncate">{mangaTitle}</span>
            </a>
            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold opacity-60" style={{ color: palette.uiText }}>
                <Clock size={12} /> {readingMinutes} min
              </span>
              <span className="text-xs font-bold opacity-70" style={{ color: palette.uiText }}>
                Cap. {chapter.number}
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Content */}
      <main style={{ maxWidth: WIDTH_PX[prefs.width], margin: '0 auto', padding: '3rem 1rem' }}>
        <div className="px-2 md:px-4">
          <h1 style={{
            fontFamily: prefs.family,
            color: palette.text,
            fontSize: `${Math.round(prefs.fontSize * 1.9)}px`,
            lineHeight: 1.15,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            marginBottom: '0.4em',
          }}>
            {chapter.title || `Capítulo ${chapter.number}`}
          </h1>
          <div style={{ color: palette.subtle, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '2.5em' }}>
            {wordCount.toLocaleString('es')} palabras · {readingMinutes} min de lectura
          </div>

          {html ? (
            <article className="nr-article" style={articleStyle} dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p style={{ color: palette.subtle }}>Este capítulo aún no tiene contenido.</p>
          )}

          {/* Footer nav */}
          <nav className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-16 pt-8" style={{ borderTop: `1px solid ${palette.border}` }}>
            {prevHref ? (
              <a href={prevHref} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border hover:opacity-80 transition-opacity font-bold text-sm"
                 style={{ background: palette.ui, borderColor: palette.border, color: palette.uiText }}>
                <ChevronLeft size={16} /> Cap. {chapter.previousChapter?.number}
              </a>
            ) : (
              <span className="hidden sm:block" />
            )}
            <a href={mangaUrl} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
               style={{ background: palette.accent, color: '#0a0a0b' }}>
              <List size={16} /> Lista de capítulos
            </a>
            {nextHref ? (
              <a href={nextHref} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border hover:opacity-80 transition-opacity font-bold text-sm"
                 style={{ background: palette.ui, borderColor: palette.border, color: palette.uiText }}>
                Cap. {chapter.nextChapter?.number} <ChevronRight size={16} />
              </a>
            ) : (
              <span className="hidden sm:block" />
            )}
          </nav>

          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
              style={{ background: 'transparent', borderColor: palette.border, color: palette.subtle }}
            >
              <ArrowUp size={14} /> Volver arriba
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: 11, color: palette.subtle, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Atajos: ← anterior · → siguiente · S ajustes · F enfoque · Esc salir
          </div>
        </div>
      </main>

      {/* Comments */}
      {mangaSlug && html && (
        <section style={{ borderTop: `1px solid ${palette.border}`, background: palette.ui, padding: '2rem 1rem' }}>
          <div style={{ maxWidth: WIDTH_PX[prefs.width], margin: '0 auto' }}>
            <CommentsSection
              identifier={`${mangaSlug}_${chapter.number}`}
              logged={logged || false}
              user={user || null}
              organization={organization}
              onLogin={() => {
                const slug = organizationSlug || organization?.slug;
                window.location.href = slug
                  ? `/${slug}/login?redirect=${encodeURIComponent(window.location.pathname)}`
                  : '/login';
              }}
            />
          </div>
        </section>
      )}

      {/* Floating buttons */}
      <div style={{ position: 'fixed', top: focusMode ? 16 : 80, right: 16, zIndex: 30, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          style={{ background: palette.accent, color: '#0a0a0b' }}
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          title="Preferencias de lectura (S)"
          aria-label="Preferencias de lectura"
        >
          {panelOpen ? <X size={20} /> : <SettingsIcon size={20} />}
        </button>
        <button
          type="button"
          onClick={() => setFocusMode((o) => !o)}
          style={{ background: palette.ui, color: palette.uiText, border: `1px solid ${palette.border}` }}
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          title={focusMode ? 'Salir de modo enfoque (F)' : 'Modo enfoque (F)'}
          aria-label="Modo enfoque"
        >
          <Maximize2 size={18} />
        </button>
        <button
          type="button"
          onClick={handleBookmarkClick}
          disabled={bookmarkLoading || !chapter?.id}
          style={{
            background: workBookmark ? '#facc15' : palette.ui,
            color: workBookmark ? '#0a0a0b' : palette.uiText,
            border: workBookmark ? '1px solid transparent' : `1px solid ${palette.border}`,
            opacity: bookmarkLoading ? 0.6 : 1,
          }}
          className="relative w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:cursor-not-allowed"
          title="Marcador"
          aria-label="Marcador"
        >
          <Bookmark size={18} fill={workBookmark ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Bookmark actions modal — always opens on click; surfaces save / go-to / delete. */}
      {bookmarkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setBookmarkModalOpen(false)}>
          <div
            className="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-yellow-500/15 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
                <Bookmark size={18} fill="currentColor" />
              </div>
              <h3 className="text-white font-black text-base">Marcador</h3>
            </div>
            <p className="text-zinc-400 text-xs mb-5">
              {workBookmark
                ? `Tienes un marcador en Cap. ${workBookmark.chapterNumber} · ${workBookmark.pageNumber}%.`
                : 'Aún no tienes un marcador en esta obra.'}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={saveBookmarkHere}
                disabled={bookmarkLoading}
                className="w-full px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Bookmark size={14} fill="currentColor" />
                {workBookmark ? 'Mover marcador aquí' : 'Marcar esta posición'} · {Math.max(1, Math.min(100, Math.round(scrollProgress) || 1))}%
              </button>
              {workBookmark && (
                <button
                  type="button"
                  onClick={goToBookmark}
                  disabled={bookmarkLoading}
                  className="w-full px-4 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60"
                >
                  Ir a mi marcador
                </button>
              )}
              {workBookmark && (
                <button
                  type="button"
                  onClick={deleteCurrentBookmark}
                  disabled={bookmarkLoading}
                  className="w-full px-4 py-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60 border border-red-500/40"
                >
                  Eliminar marcador
                </button>
              )}
              <button
                type="button"
                onClick={() => setBookmarkModalOpen(false)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-black uppercase tracking-widest transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookmark flash toast */}
      {bookmarkFlash && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: bookmarkFlash.kind === 'error' ? '#7f1d1d' : '#0a0a0b',
            color: bookmarkFlash.kind === 'error' ? '#fecaca' : '#facc15',
            border: `1px solid ${bookmarkFlash.kind === 'error' ? '#dc2626' : '#facc15'}`,
            padding: '10px 18px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            zIndex: 50,
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          }}
        >
          {bookmarkFlash.msg}
        </div>
      )}

      {/* Settings panel */}
      {panelOpen && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: focusMode ? 80 : 144,
            right: 16,
            zIndex: 30,
            width: 320,
            maxHeight: 'calc(100vh - 160px)',
            background: palette.ui,
            border: `1px solid ${palette.border}`,
            color: palette.uiText,
            borderRadius: 18,
            boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${palette.border}`, padding: '8px 8px 0' }}>
            {([
              { k: 'text',    label: 'Texto',    icon: <Type size={14} /> },
              { k: 'layout',  label: 'Diseño',   icon: <LayoutIcon size={14} /> },
              { k: 'theme',   label: 'Tema',     icon: <Palette size={14} /> },
              { k: 'reading', label: 'Lectura',  icon: <Eye size={14} /> },
            ] as { k: TabKey; label: string; icon: React.ReactNode }[]).map(({ k, label, icon }) => (
              <button
                key={k}
                type="button"
                onClick={() => setActiveTab(k)}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  borderBottom: activeTab === k ? `2px solid ${palette.accent}` : '2px solid transparent',
                  color: activeTab === k ? palette.accent : palette.subtle,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'color 150ms',
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>
            {activeTab === 'text' && (
              <TextTab prefs={prefs} setPrefs={setPrefs} palette={palette} />
            )}
            {activeTab === 'layout' && (
              <LayoutTab prefs={prefs} setPrefs={setPrefs} palette={palette} />
            )}
            {activeTab === 'theme' && (
              <ThemeTab prefs={prefs} setPrefs={setPrefs} palette={palette} />
            )}
            {activeTab === 'reading' && (
              <ReadingTab prefs={prefs} setPrefs={setPrefs} palette={palette} />
            )}
          </div>

          <div style={{ borderTop: `1px solid ${palette.border}`, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity"
              style={{ color: palette.subtle }}
            >
              <RotateCcw size={12} /> Restablecer
            </button>
            <span style={{ color: palette.subtle, fontSize: 10, letterSpacing: '0.1em' }}>v2</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components for the settings panel tabs
// ─────────────────────────────────────────────────────────────────────────────

interface TabProps {
  prefs: Prefs;
  setPrefs: React.Dispatch<React.SetStateAction<Prefs>>;
  palette: ThemePalette;
}

const Section: React.FC<{ label: string; children: React.ReactNode; palette: ThemePalette; right?: React.ReactNode }> = ({ label, children, palette, right }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: palette.subtle }}>{label}</span>
      {right}
    </div>
    {children}
  </div>
);

const Slider: React.FC<{
  value: number; onChange: (v: number) => void; min: number; max: number; step?: number;
  format?: (v: number) => string; palette: ThemePalette;
}> = ({ value, onChange, min, max, step = 1, format, palette }) => (
  <div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="nr-range w-full"
      style={{ accentColor: palette.accent }}
    />
    <div style={{ marginTop: 4, fontSize: 11, color: palette.subtle, fontVariantNumeric: 'tabular-nums' }}>
      {format ? format(value) : value}
    </div>
  </div>
);

const Pill: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; palette: ThemePalette; title?: string; style?: React.CSSProperties }> = ({ active, onClick, children, palette, title, style }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{
      padding: '8px 6px',
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 8,
      background: active ? palette.accent : 'transparent',
      color: active ? '#0a0a0b' : palette.uiText,
      border: active ? '1px solid transparent' : `1px solid ${palette.border}`,
      cursor: 'pointer',
      transition: 'all 120ms',
      ...style,
    }}
  >
    {children}
  </button>
);

const TextTab: React.FC<TabProps> = ({ prefs, setPrefs, palette }) => {
  const grouped = useMemo(() => {
    const out: Record<FontDef['category'], FontDef[]> = { serif: [], sans: [], mono: [], a11y: [] };
    for (const f of FONTS) out[f.category].push(f);
    return out;
  }, []);

  return (
    <>
      <Section label="Fuente" palette={palette}>
        <select
          value={prefs.family}
          onChange={(e) => setPrefs((p) => ({ ...p, family: e.target.value }))}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: palette.bg,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            borderRadius: 10,
            fontFamily: prefs.family,
            fontSize: 13,
          }}
        >
          {(Object.keys(grouped) as FontDef['category'][]).map((cat) => (
            <optgroup key={cat} label={FONT_CATEGORY_LABELS[cat]}>
              {grouped[cat].map((f) => (
                <option key={f.value} value={f.value}>{f.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Section>

      <Section label={`Tamaño · ${prefs.fontSize}px`} palette={palette}>
        <Slider
          value={prefs.fontSize} min={12} max={32} step={1}
          onChange={(v) => setPrefs((p) => ({ ...p, fontSize: v }))}
          format={(v) => `${v}px`} palette={palette}
        />
      </Section>

      <Section label={`Interlineado · ${prefs.lineHeight.toFixed(2)}`} palette={palette}>
        <Slider
          value={prefs.lineHeight} min={1.2} max={2.4} step={0.05}
          onChange={(v) => setPrefs((p) => ({ ...p, lineHeight: Number(v.toFixed(2)) }))}
          format={(v) => v.toFixed(2)} palette={palette}
        />
      </Section>

      <Section label={`Espaciado entre letras · ${prefs.letterSpacing.toFixed(1)}px`} palette={palette}>
        <Slider
          value={prefs.letterSpacing} min={-1} max={3} step={0.1}
          onChange={(v) => setPrefs((p) => ({ ...p, letterSpacing: Number(v.toFixed(1)) }))}
          format={(v) => `${v.toFixed(1)}px`} palette={palette}
        />
      </Section>

      <Section label={`Espaciado entre palabras · ${prefs.wordSpacing.toFixed(1)}px`} palette={palette}>
        <Slider
          value={prefs.wordSpacing} min={0} max={8} step={0.5}
          onChange={(v) => setPrefs((p) => ({ ...p, wordSpacing: Number(v.toFixed(1)) }))}
          format={(v) => `${v.toFixed(1)}px`} palette={palette}
        />
      </Section>
    </>
  );
};

const LayoutTab: React.FC<TabProps> = ({ prefs, setPrefs, palette }) => (
  <>
    <Section label="Ancho de columna" palette={palette}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {(['narrow', 'cozy', 'wide', 'full'] as Width[]).map((w) => (
          <Pill key={w} active={prefs.width === w} onClick={() => setPrefs((p) => ({ ...p, width: w }))} palette={palette}>
            {WIDTH_LABELS[w]}
          </Pill>
        ))}
      </div>
    </Section>

    <Section label="Alineación" palette={palette}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {([
          { v: 'left',    icon: <AlignLeft size={14} />,    label: 'Izq.' },
          { v: 'justify', icon: <AlignJustify size={14} />, label: 'Just.' },
          { v: 'center',  icon: <AlignCenter size={14} />,  label: 'Cent.' },
        ] as { v: Alignment; icon: React.ReactNode; label: string }[]).map(({ v, icon, label }) => (
          <Pill key={v} active={prefs.alignment === v} onClick={() => setPrefs((p) => ({ ...p, alignment: v }))} palette={palette}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            {icon} {label}
          </Pill>
        ))}
      </div>
    </Section>

    <Section label={`Espacio entre párrafos · ${prefs.paragraphSpacing.toFixed(2)}em`} palette={palette}>
      <Slider
        value={prefs.paragraphSpacing} min={0} max={2.5} step={0.05}
        onChange={(v) => setPrefs((p) => ({ ...p, paragraphSpacing: Number(v.toFixed(2)) }))}
        format={(v) => `${v.toFixed(2)}em`} palette={palette}
      />
    </Section>

    <Toggle label="Sangría en primera línea" value={prefs.paragraphIndent}
            onChange={(v) => setPrefs((p) => ({ ...p, paragraphIndent: v }))} palette={palette} />

    <Toggle label="Capitular (drop cap)" value={prefs.dropCaps}
            onChange={(v) => setPrefs((p) => ({ ...p, dropCaps: v }))} palette={palette} />
  </>
);

const ThemeTab: React.FC<TabProps> = ({ prefs, setPrefs, palette }) => (
  <>
    <Section label="Tema" palette={palette}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
        {(Object.keys(THEME_LABELS) as Theme[]).map((tk) => {
          const previewBg = tk === 'custom' ? prefs.customBg : THEMES[tk].bg;
          const previewText = tk === 'custom' ? prefs.customText : THEMES[tk].text;
          const active = prefs.theme === tk;
          return (
            <button
              key={tk}
              type="button"
              onClick={() => setPrefs((p) => ({ ...p, theme: tk }))}
              style={{
                padding: '10px 12px',
                background: previewBg,
                color: previewText,
                border: active ? `2px solid ${palette.accent}` : `1px solid ${palette.border}`,
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                textAlign: 'left',
                transition: 'all 120ms',
              }}
            >
              {THEME_LABELS[tk]}
            </button>
          );
        })}
      </div>
    </Section>

    {prefs.theme === 'custom' && (
      <>
        <Section label="Color de fondo" palette={palette} right={<code style={{ color: palette.subtle, fontSize: 10 }}>{prefs.customBg}</code>}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="color" value={prefs.customBg}
              onChange={(e) => setPrefs((p) => ({ ...p, customBg: e.target.value }))}
              style={{ width: 44, height: 44, border: `1px solid ${palette.border}`, borderRadius: 8, background: 'transparent', cursor: 'pointer' }}
            />
            <input
              type="text" value={prefs.customBg}
              onChange={(e) => setPrefs((p) => ({ ...p, customBg: e.target.value }))}
              style={{ flex: 1, padding: '8px 10px', background: palette.bg, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
        </Section>
        <Section label="Color de texto" palette={palette} right={<code style={{ color: palette.subtle, fontSize: 10 }}>{prefs.customText}</code>}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="color" value={prefs.customText}
              onChange={(e) => setPrefs((p) => ({ ...p, customText: e.target.value }))}
              style={{ width: 44, height: 44, border: `1px solid ${palette.border}`, borderRadius: 8, background: 'transparent', cursor: 'pointer' }}
            />
            <input
              type="text" value={prefs.customText}
              onChange={(e) => setPrefs((p) => ({ ...p, customText: e.target.value }))}
              style={{ flex: 1, padding: '8px 10px', background: palette.bg, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
        </Section>
        <Section label="Presets rápidos" palette={palette}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {[
              { bg: '#1a0f0a', text: '#fbe6c8' },
              { bg: '#0f1c2e', text: '#cfe9ff' },
              { bg: '#11251a', text: '#d2f0d8' },
              { bg: '#fff8e7', text: '#3a2a1a' },
              { bg: '#f0e8ff', text: '#2a1a3a' },
              { bg: '#181818', text: '#ff6b35' },
              { bg: '#0a0a0a', text: '#a3e635' },
              { bg: '#fef3c7', text: '#451a03' },
            ].map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, customBg: c.bg, customText: c.text }))}
                style={{ height: 32, background: c.bg, color: c.text, border: `1px solid ${palette.border}`, borderRadius: 6, fontSize: 11, fontWeight: 700 }}
              >
                Aa
              </button>
            ))}
          </div>
        </Section>
      </>
    )}
  </>
);

const ReadingTab: React.FC<TabProps> = ({ prefs, setPrefs, palette }) => (
  <>
    <Toggle label="Barra de progreso" hint="Muestra cuánto llevas leído" value={prefs.showProgress}
            onChange={(v) => setPrefs((p) => ({ ...p, showProgress: v }))} palette={palette} />
    <Toggle label="Recordar posición" hint="Vuelves donde te quedaste al volver al capítulo" value={prefs.rememberScroll}
            onChange={(v) => setPrefs((p) => ({ ...p, rememberScroll: v }))} palette={palette} />
    <div style={{ marginTop: 14, padding: 12, background: palette.bg, borderRadius: 10, border: `1px solid ${palette.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: palette.subtle, marginBottom: 8 }}>
        Atajos de teclado
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 10px', fontSize: 12, color: palette.uiText }}>
        <kbd style={kbdStyle(palette)}>←</kbd><span>Capítulo anterior</span>
        <kbd style={kbdStyle(palette)}>→</kbd><span>Capítulo siguiente</span>
        <kbd style={kbdStyle(palette)}>S</kbd><span>Abrir/cerrar ajustes</span>
        <kbd style={kbdStyle(palette)}>F</kbd><span>Modo enfoque</span>
        <kbd style={kbdStyle(palette)}>Esc</kbd><span>Cerrar / salir</span>
      </div>
    </div>
  </>
);

const kbdStyle = (palette: ThemePalette): React.CSSProperties => ({
  background: palette.ui,
  border: `1px solid ${palette.border}`,
  borderRadius: 4,
  padding: '2px 8px',
  fontFamily: 'monospace',
  fontSize: 11,
  fontWeight: 700,
  textAlign: 'center',
  minWidth: 28,
});

const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void; palette: ThemePalette; hint?: string }> = ({ label, value, onChange, palette, hint }) => (
  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', cursor: 'pointer' }}>
    <span style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: palette.uiText }}>{label}</div>
      {hint && <div style={{ fontSize: 11, color: palette.subtle, marginTop: 2 }}>{hint}</div>}
    </span>
    <span style={{
      position: 'relative', width: 38, height: 22, borderRadius: 999,
      background: value ? palette.accent : palette.border,
      transition: 'background 150ms', flexShrink: 0,
    }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
      <span style={{
        position: 'absolute', top: 2, left: value ? 18 : 2, width: 18, height: 18, borderRadius: '50%',
        background: '#fff', transition: 'left 150ms', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </span>
  </label>
);

export default NovelReader;
