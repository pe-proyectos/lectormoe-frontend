import React from 'react';
import { GripVertical, BookOpen, ChevronRight, Users } from 'lucide-react';
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
}: {
  entry: MangaListEntry;
  index: number;
  isOwner: boolean;
  nsfwMode: boolean;
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
      className={`group flex items-center gap-4 bg-zinc-900/40 border rounded-2xl pr-4 py-2 pl-2 hover:bg-zinc-900/80 transition-colors ${
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

      {/* Title + subtitle */}
      <a href={vm.href} className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`font-bold text-sm truncate transition-colors ${
            vm.isNSFW ? 'text-red-400 group-hover:text-red-300' : 'text-white group-hover:text-cyan-400'
          }`}>
            {vm.title}
          </h3>
          {vm.isJoint && (
            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[8px] font-black uppercase tracking-widest rounded flex items-center gap-1 shrink-0">
              <Users size={8} /> Joint
            </span>
          )}
          {vm.isNSFW && !vm.isJoint && (
            <span className="px-1.5 py-0.5 bg-red-500 text-zinc-950 text-[8px] font-black uppercase rounded tracking-tighter shrink-0">+18</span>
          )}
        </div>
        <p className="text-[10px] text-zinc-500 truncate">{vm.subtitle}</p>
      </a>

      {/* Last chapter */}
      <div className="hidden sm:flex shrink-0 text-right">
        {vm.lastChapterLabel && (
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{vm.lastChapterLabel}</span>
        )}
      </div>

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
}

const SortableMangaList: React.FC<Props> = ({ entries, isOwner, nsfwMode = false, onReorder }) => {
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
            <Row key={entry.id} entry={entry} index={i} isOwner={isOwner} nsfwMode={nsfwMode} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SortableMangaList;
