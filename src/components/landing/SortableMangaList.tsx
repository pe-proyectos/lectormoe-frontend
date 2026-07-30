import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, BookOpen, ChevronRight, Users, CheckCircle2, Circle, Star, Clock, Pause, XCircle, ChevronDown } from 'lucide-react';
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface MangaListEntry {
  id: number; // Favorite / UserList row id — used for reorder
  order?: number;
  finishedAt?: string | null;
  readingStatus?: ReadingStatus | string | null;
  // Caller-provided: whether this entry is also in the user's favorites
  // (only relevant on the /list page where UserList + Favorite cross-references).
  isFavorite?: boolean;
  mangaCustom?: any;
  joint?: any;
  // Convenience (built by callers for MangaCard-style entries)
  [key: string]: any;
}

export type ReadingStatus = 'READING' | 'PLAN_TO_READ' | 'COMPLETED' | 'PAUSED' | 'DROPPED';

export const READING_STATUS_META: Record<ReadingStatus, {
  label: string;
  short: string;
  icon: React.ReactNode;
  text: string;
  bg: string;
  border: string;
  ring: string;
}> = {
  READING:      { label: 'Leyendo',     short: 'Leyendo',  icon: <BookOpen size={12} />,    text: 'text-cyan-300',    bg: 'bg-cyan-500/15',    border: 'border-cyan-500/40',    ring: 'ring-cyan-500/30' },
  PLAN_TO_READ: { label: 'Pendiente',   short: 'Pendiente',icon: <Clock size={12} />,       text: 'text-blue-300',    bg: 'bg-blue-500/15',    border: 'border-blue-500/40',    ring: 'ring-blue-500/30' },
  COMPLETED:    { label: 'Completado',  short: 'Completado',icon: <CheckCircle2 size={12} />,text: 'text-green-300',   bg: 'bg-green-500/15',   border: 'border-green-500/40',   ring: 'ring-green-500/30' },
  PAUSED:       { label: 'En pausa',    short: 'Pausa',    icon: <Pause size={12} />,       text: 'text-yellow-300',  bg: 'bg-yellow-500/15',  border: 'border-yellow-500/40',  ring: 'ring-yellow-500/30' },
  DROPPED:      { label: 'Abandonado',  short: 'Abandonado',icon: <XCircle size={12} />,    text: 'text-red-300',     bg: 'bg-red-500/15',     border: 'border-red-500/40',     ring: 'ring-red-500/30' },
};

export const READING_STATUS_KEYS: ReadingStatus[] = ['READING', 'PLAN_TO_READ', 'COMPLETED', 'PAUSED', 'DROPPED'];

const StatusPicker: React.FC<{
  current: ReadingStatus;
  onChange: (s: ReadingStatus) => void;
  disabled?: boolean;
}> = ({ current, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  // Recompute the popover position whenever it opens, the window resizes, or
  // the page scrolls — the button rect changes in all of those.
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current!.getBoundingClientRect();
      setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const meta = READING_STATUS_META[current];

  if (disabled) {
    return (
      <span
        className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border ${meta.bg} ${meta.border} ${meta.text}`}
        title={meta.label}
      >
        {meta.icon} <span className="hidden sm:inline">{meta.short}</span>
      </span>
    );
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${meta.bg} ${meta.border} ${meta.text} hover:ring-2 ${meta.ring}`}
        title="Cambiar estado de lectura"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {meta.icon} <span className="hidden sm:inline">{meta.short}</span> <ChevronDown size={10} />
      </button>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={popRef}
          style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 1000 }}
          className="w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
          role="listbox"
        >
          {READING_STATUS_KEYS.map((k) => {
            const m = READING_STATUS_META[k];
            const active = k === current;
            return (
              <button
                key={k}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(k); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-semibold hover:bg-zinc-800 transition-colors ${active ? m.text : 'text-zinc-200'}`}
                role="option"
                aria-selected={active}
              >
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded ${m.bg} ${m.text}`}>
                  {m.icon}
                </span>
                <span className="flex-1">{m.label}</span>
                {active && <CheckCircle2 size={12} className={m.text} />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
};

interface RowViewModel {
  key: string | number;
  href: string;
  cover: string | null | undefined;
  title: string;
  subtitle: string;
  lastChapterLabel: string | null;
  isJoint: boolean;
  isNSFW: boolean;
}

function buildRow(entry: MangaListEntry, nsfwMode: boolean): RowViewModel | null {
  // Joint favorite row (user-visible joint directly)
  if (entry.joint) {
    const j = entry.joint;
    const latestChapter = Array.isArray(j.chapters) && j.chapters[0];
    return {
      key: entry.id,
      href: `/joint/manga/${j.slug}`,
      cover: j.imageUrl,
      title: j.title,
      subtitle: 'Joint',
      lastChapterLabel: latestChapter ? `Cap. ${latestChapter.number}` : null,
      isJoint: true,
      isNSFW: false, // MangaJoint has no isNSFW field — joints always public-safe
    };
  }
  // MangaCustom favorite row
  const mc = entry.mangaCustom ?? entry;
  if (!mc || !mc.id) return null;
  const orgSlug = mc.organization?.slug || '';
  const mangaSlug = mc.manga?.slug || mc.slug || '';
  const orgBase = nsfwMode ? `/red/${orgSlug}` : `/${orgSlug}`;
  const href = orgSlug && mangaSlug ? `${orgBase}/manga/${mangaSlug}` : '#';
  const latestChapter = Array.isArray(mc.chapters) && mc.chapters[0];
  return {
    key: entry.id ?? mc.id,
    href,
    cover: mc.imageUrl,
    title: mc.title,
    subtitle: mc.organization?.name || '',
    lastChapterLabel: latestChapter ? `Cap. ${latestChapter.number}` : null,
    isJoint: false,
    isNSFW: !!(mc.isNSFW || mc.organization?.isNSFW),
  };
}

function Row({
  entry,
  index,
  isOwner,
  nsfwMode,
  onToggleFinished,
  onChangeReadingStatus,
  onToggleFavorite,
  showFavoriteIndicator,
}: {
  entry: MangaListEntry;
  index: number;
  isOwner: boolean;
  nsfwMode: boolean;
  onToggleFinished?: (entry: MangaListEntry, next: boolean) => void;
  onChangeReadingStatus?: (entry: MangaListEntry, status: ReadingStatus) => void;
  onToggleFavorite?: (entry: MangaListEntry, next: boolean) => void;
  showFavoriteIndicator?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id, disabled: !isOwner });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  const vm = buildRow(entry, nsfwMode);
  if (!vm) return null;

  return (
    <div
      ref={setNodeRef}
      style={style as React.CSSProperties}
      className={`group flex items-center gap-2 sm:gap-4 bg-zinc-900/40 border rounded-2xl pr-3 sm:pr-4 py-2 pl-2 hover:bg-zinc-900/80 transition-colors min-w-0 w-full overflow-hidden ${
        vm.isNSFW ? 'border-red-900/30 hover:border-red-500/30' : 'border-zinc-800 hover:border-cyan-500/30'
      } ${isDragging ? 'shadow-2xl' : ''}`}
    >
      {/* Drag handle (owner only) */}
      {isOwner ? (
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="shrink-0 p-2 -ml-1 text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing touch-none"
          aria-label="Arrastrar para reordenar"
        >
          <GripVertical size={16} />
        </button>
      ) : (
        <div className="shrink-0 w-6" />
      )}

      {/* Order number */}
      <div className="shrink-0 w-8 text-center text-[11px] font-black text-zinc-600 tabular-nums">
        {index + 1}
      </div>

      {/* Cover */}
      <a href={vm.href} className="shrink-0 block">
        <div className="w-10 h-14 rounded-lg overflow-hidden bg-zinc-800">
          {vm.cover ? (
            <img src={vm.cover} alt={vm.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              <BookOpen size={14} />
            </div>
          )}
        </div>
      </a>

      {/* Title + subtitle — use line-clamp + break-words so long titles wrap
          instead of forcing the row to overflow the viewport. `truncate` sets
          white-space: nowrap, which combined with the badges' shrink-0 was
          overriding min-w-0 constraints on narrow screens. */}
      <a href={vm.href} className="flex-1 min-w-0 overflow-hidden block">
        <h3 className={`font-bold text-sm leading-snug break-words line-clamp-2 transition-colors ${
          vm.isNSFW ? 'text-red-400 group-hover:text-red-300' : 'text-white group-hover:text-cyan-400'
        }`}>
          {vm.isJoint && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[8px] font-black uppercase tracking-widest rounded align-middle mr-1">
              <Users size={8} /> Joint
            </span>
          )}
          {vm.isNSFW && !vm.isJoint && (
            <span className="inline-flex items-center px-1.5 py-0.5 bg-red-500 text-zinc-950 text-[8px] font-black uppercase rounded tracking-tighter align-middle mr-1">+18</span>
          )}
          {vm.title}
        </h3>
        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{vm.subtitle}</p>
      </a>

      {/* Last chapter */}
      <div className="hidden sm:flex shrink-0 text-right">
        {vm.lastChapterLabel && (
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{vm.lastChapterLabel}</span>
        )}
      </div>

      {/* Favorite indicator — outlined star by default, gold filled star when
          the entry is also in the user's favorites. Owner can click to toggle;
          non-owner just sees the state. Only rendered when the caller opts in
          (showFavoriteIndicator), since regular favorites rows already ARE
          favorites and don't need this marker. */}
      {showFavoriteIndicator && onToggleFavorite ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(entry, !entry.isFavorite);
          }}
          className={`shrink-0 p-2 rounded-lg transition-colors ${
            entry.isFavorite
              ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10'
              : 'text-zinc-600 hover:text-yellow-400 hover:bg-zinc-800/60'
          }`}
          title={entry.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          aria-pressed={!!entry.isFavorite}
        >
          <Star size={18} fill={entry.isFavorite ? 'currentColor' : 'none'} />
        </button>
      ) : showFavoriteIndicator && entry.isFavorite ? (
        <div className="shrink-0 text-yellow-400 p-2" title="En favoritos" aria-label="En favoritos">
          <Star size={18} fill="currentColor" />
        </div>
      ) : null}

      {/* Reading status picker — preferred over the legacy finished toggle.
          Owner sees an interactive pill; non-owner sees the badge in read-only mode. */}
      {onChangeReadingStatus && entry.readingStatus ? (
        <StatusPicker
          current={(entry.readingStatus as ReadingStatus) in READING_STATUS_META ? (entry.readingStatus as ReadingStatus) : 'READING'}
          onChange={(s) => onChangeReadingStatus(entry, s)}
        />
      ) : entry.readingStatus && (entry.readingStatus as ReadingStatus) in READING_STATUS_META ? (
        <StatusPicker current={entry.readingStatus as ReadingStatus} onChange={() => {}} disabled />
      ) : null}

      {/* Finished / read indicator (legacy). Only renders for callers that don't
          provide onChangeReadingStatus, to keep the simpler one-toggle UX intact
          (e.g. profile sidebar widgets). */}
      {!onChangeReadingStatus && onToggleFinished ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFinished(entry, !entry.finishedAt);
          }}
          className={`shrink-0 p-2 rounded-lg transition-colors ${
            entry.finishedAt
              ? 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
              : 'text-zinc-600 hover:text-green-400 hover:bg-zinc-800/60'
          }`}
          title={entry.finishedAt ? 'Marcar como no leído' : 'Marcar como leído'}
          aria-pressed={!!entry.finishedAt}
        >
          {entry.finishedAt ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </button>
      ) : !onChangeReadingStatus && entry.finishedAt ? (
        <div
          className="shrink-0 text-green-400 p-2"
          title="Leído"
          aria-label="Leído"
        >
          <CheckCircle2 size={18} />
        </div>
      ) : null}

      {/* Chevron */}
      <a href={vm.href} className="shrink-0 text-zinc-600 group-hover:text-cyan-400 transition-colors">
        <ChevronRight size={16} />
      </a>
    </div>
  );
}

interface Props {
  entries: MangaListEntry[];
  isOwner: boolean;
  nsfwMode?: boolean;
  onReorder?: (newIds: number[]) => void;
  // Legacy single-toggle "finished" UX. Use only for simple widgets that don't
  // need the full status picker.
  onToggleFinished?: (entry: MangaListEntry, next: boolean) => void;
  // Preferred: opens a small picker so the user can set Leyendo / Pendiente /
  // Completado / Pausa / Abandonado. Takes precedence over onToggleFinished
  // when both are provided.
  onChangeReadingStatus?: (entry: MangaListEntry, status: ReadingStatus) => void;
  showFavoriteIndicator?: boolean;
  onToggleFavorite?: (entry: MangaListEntry, next: boolean) => void;
}

const SortableMangaList: React.FC<Props> = ({
  entries,
  isOwner,
  nsfwMode = false,
  onReorder,
  onToggleFinished,
  onChangeReadingStatus,
  showFavoriteIndicator,
  onToggleFavorite,
}) => {
  const sensors = useSensors(
    // Ratón: 5px de movimiento antes de arrastrar (así el click en el enlace de
    // la fila sigue funcionando).
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Táctil: mantener presionado ~180ms activa el arrastre; un swipe rápido
    // (dentro de la tolerancia) hace scroll normal. PointerSensor era poco
    // fiable en el WebView de Android (arrancaba y se soltaba solo).
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = entries.findIndex((e) => e.id === active.id);
    const newIndex = entries.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(entries, oldIndex, newIndex);
    onReorder?.(reordered.map((e) => e.id));
  };

  if (entries.length === 0) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {entries.map((entry, i) => (
            <Row
              key={entry.id}
              entry={entry}
              index={i}
              isOwner={isOwner}
              nsfwMode={nsfwMode}
              onToggleFinished={isOwner ? onToggleFinished : undefined}
              onChangeReadingStatus={isOwner ? onChangeReadingStatus : undefined}
              showFavoriteIndicator={showFavoriteIndicator}
              onToggleFavorite={isOwner ? onToggleFavorite : undefined}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SortableMangaList;
