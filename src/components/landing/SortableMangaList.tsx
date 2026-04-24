import React from 'react';
import { GripVertical, BookOpen, ChevronRight, Users, CheckCircle2, Circle, Star } from 'lucide-react';
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
  // Caller-provided: whether this entry is also in the user's favorites
  // (only relevant on the /list page where UserList + Favorite cross-references).
  isFavorite?: boolean;
  mangaCustom?: any;
  joint?: any;
  // Convenience (built by callers for MangaCard-style entries)
  [key: string]: any;
}

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
  onToggleFavorite,
  showFavoriteIndicator,
}: {
  entry: MangaListEntry;
  index: number;
  isOwner: boolean;
  nsfwMode: boolean;
  onToggleFinished?: (entry: MangaListEntry, next: boolean) => void;
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

      {/* Finished / read indicator. Owner gets a clickable toggle; everyone else
          just sees the current state. Entries without finishedAt support (e.g.
          ad-hoc callers that don't persist it) render nothing. */}
      {onToggleFinished ? (
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
      ) : entry.finishedAt ? (
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
  // Called when the user drops a row into a new position.
  // Receives the new ordered list of ids — callers should persist via API.
  onReorder?: (newIds: number[]) => void;
  // Called when the user toggles the finished-reading indicator on a row.
  // Only passed for owners; non-owners see a read-only badge.
  onToggleFinished?: (entry: MangaListEntry, next: boolean) => void;
  // Only relevant when rendering a UserList (shows whether each entry is
  // also in the user's favorites). Pass onToggleFavorite for owners so the
  // star is interactive.
  showFavoriteIndicator?: boolean;
  onToggleFavorite?: (entry: MangaListEntry, next: boolean) => void;
}

const SortableMangaList: React.FC<Props> = ({
  entries,
  isOwner,
  nsfwMode = false,
  onReorder,
  onToggleFinished,
  showFavoriteIndicator,
  onToggleFavorite,
}) => {
  const sensors = useSensors(
    // Require 5px of movement before starting drag so clicks on the row link still work.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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
