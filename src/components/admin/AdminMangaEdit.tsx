import React, { useState, useRef, useEffect } from 'react';
import {
  Save, Plus, Calendar, BookOpen, UploadCloud, Trash2,
  Settings2, Layers, GripVertical, ZoomIn, ZoomOut,
  Map as MapIcon, CheckCircle2,
  Camera, List, Info, Edit3, Download, ImageIcon, Clock, Users,
  ArrowRight, Check, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { callAPI } from '../../util/callApi';
import { getTranslator } from '../../util/translate';
import { toast } from 'react-toastify';
import { uploadFile } from '../../util/uploadFile';
import Autocomplete from './ui/Autocomplete';
import GenreCategoryPicker from './GenreCategoryPicker';
import { AdminChapterDialog } from './AdminChapterDialog';
import { MultiImageDropzone } from './ui/MultiImageDropzone';
import NovelEditor from './NovelEditor';
import { Popover, PopoverHandler, PopoverContent } from './ui/Popover';
import { DayPicker } from 'react-day-picker';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import JSZip from 'jszip';
import 'react-toastify/dist/ReactToastify.css';
import 'react-day-picker/dist/style.css';

type TabType = 'info' | 'chapters' | 'upload' | 'members';

interface DateTimePickerProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  showTime?: boolean;
  className?: string;
}

// DateTimePicker component for date and time selection
const DateTimePicker: React.FC<DateTimePickerProps> = ({ 
  value, 
  onChange, 
  disabled = false,
  showTime = true,
  className = ''
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeValue, setTimeValue] = useState<string>('00:00');

  // Initialize from value
  useEffect(() => {
    if (value && value.trim() !== '') {
      // Try to parse as local datetime string (YYYY-MM-DDTHH:mm)
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setTimeValue(`${hours}:${minutes}`);
      } else {
        setSelectedDate(null);
        setTimeValue('00:00');
      }
    } else {
      setSelectedDate(null);
      setTimeValue('00:00');
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(null);
      onChange(null);
      return;
    }

    const [hours, minutes] = timeValue.split(':');
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours || '0', 10));
    newDate.setMinutes(parseInt(minutes || '0', 10));
    
    setSelectedDate(newDate);
    
    // Convert to local datetime string format (YYYY-MM-DDTHH:mm)
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    const formattedTime = `${String(newDate.getHours()).padStart(2, '0')}:${String(newDate.getMinutes()).padStart(2, '0')}`;
    onChange(`${year}-${month}-${day}T${formattedTime}`);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    
    if (selectedDate) {
      const [hours, minutes] = newTime.split(':');
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours || '0', 10));
      newDate.setMinutes(parseInt(minutes || '0', 10));
      
      // Convert to local datetime string format
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, '0');
      const day = String(newDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}T${newTime}`);
    }
  };

  const formatDisplayValue = (val: string | null | undefined): string => {
    if (!val || val.trim() === '') return '';
    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return showTime 
        ? `${day}/${month}/${year} ${hours}:${minutes}`
        : `${day}/${month}/${year}`;
    } catch {
      return val;
    }
  };

  const displayValue = formatDisplayValue(value);
  const placeholder = showTime ? 'Seleccionar fecha y hora' : 'Seleccionar fecha';

  return (
    <div className={`relative ${className}`}>
      <Popover placement="bottom">
        <PopoverHandler>
          <div className={disabled ? "cursor-not-allowed" : "cursor-pointer"}>
            <input
              type="text"
              value={displayValue}
              readOnly
              disabled={disabled}
              placeholder={placeholder}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white text-[11px] font-black uppercase focus:border-cyan-500 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </PopoverHandler>
        {!disabled && (
        <PopoverContent>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl">
            <DayPicker
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDateSelect}
              showOutsideDays
              className="border-0"
              classNames={{
                caption: "flex justify-center py-2 mb-4 relative items-center",
                caption_label: "text-sm font-medium text-white",
                nav: "flex items-center",
                nav_button:
                  "h-6 w-6 bg-transparent hover:bg-zinc-800 p-1 rounded-md transition-colors duration-300 text-zinc-400 hover:text-white",
                nav_button_previous: "absolute left-1.5",
                nav_button_next: "absolute right-1.5",
                table: "w-full border-collapse",
                head_row: "flex font-medium text-zinc-400",
                head_cell: "m-0.5 w-9 font-normal text-sm",
                row: "flex w-full mt-2",
                cell: "text-zinc-400 rounded-md h-9 w-9 text-center text-sm p-0 m-0.5 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-zinc-800/20 [&:has([aria-selected].day-outside)]:text-white [&:has([aria-selected])]:bg-cyan-500 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal hover:bg-zinc-800 rounded-md transition-colors",
                day_range_end: "day-range-end",
                day_selected:
                  "rounded-md bg-cyan-500 text-white hover:bg-cyan-600 hover:text-white focus:bg-cyan-500 focus:text-white",
                day_today: "rounded-md bg-zinc-800 text-white font-semibold",
                day_outside:
                  "day-outside text-zinc-500 opacity-50 aria-selected:bg-zinc-700 aria-selected:text-white aria-selected:bg-opacity-50",
                day_disabled: "text-zinc-600 opacity-50 cursor-not-allowed",
                day_hidden: "invisible",
              }}
              // @ts-ignore - react-day-picker components type issue
              components={{
                IconLeft: ({ ...props }) => (
                  <ChevronLeftIcon {...props} className="h-4 w-4 stroke-2" />
                ),
                IconRight: ({ ...props }) => (
                  <ChevronRightIcon {...props} className="h-4 w-4 stroke-2" />
                ),
              }}
            />
            {showTime && (
              <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-3">
                <Clock size={16} className="text-zinc-400" />
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Hora:
                </label>
                <input
                  type="time"
                  value={timeValue}
                  onChange={handleTimeChange}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm font-bold focus:border-cyan-500 outline-none"
                />
              </div>
            )}
          </div>
        </PopoverContent>
        )}
      </Popover>
    </div>
  );
};

interface AdminMangaEditProps {
  language?: string;
  initialMangaCustom?: any;
  /** When present, this component operates in joint mode: same UI, joint-specific endpoints */
  joint?: any;
  /** Caller's organization (required in joint mode for permission checks) */
  organization?: any;
  organizationSlug: string;
  /** Permisos del usuario en esta org (gatean borrado de capítulo y ficha) */
  canDeleteChapter?: boolean;
  canDeleteMangaCustom?: boolean;
}

const AdminMangaEdit: React.FC<AdminMangaEditProps> = ({
  language,
  initialMangaCustom,
  joint: initialJoint,
  organization,
  organizationSlug,
  canDeleteChapter = false,
  canDeleteMangaCustom = false,
}) => {
  // Joint mode swaps the resource under edit from a MangaCustom to a MangaJoint.
  // Both shapes share id/slug/title/description/imageUrl/bannerUrl/status/workType/chapters,
  // so the component duck-types through the same `mangaCustom` state.
  const mode: 'manga' | 'joint' = initialJoint ? 'joint' : 'manga';
  const isJointMode = mode === 'joint';
  const initialResource = initialJoint || initialMangaCustom;
  const _ = getTranslator(language);
  // In joint mode, default to chapters list (upload may not be available to this member).
  const [activeTab, setActiveTab] = useState<TabType>(initialJoint ? 'chapters' : 'upload');
  const [showMinimap, setShowMinimap] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [loading, setLoading] = useState(false);
  
  const [dragId, setDragId] = useState<string | null>(null);

  const [mangaCustom, setMangaCustom] = useState(initialResource);
  const [activeJoint, setActiveJoint] = useState<{ slug: string; title: string } | null>(null);

  // Joint-only: my membership + invite state for the Miembros tab
  const jointMembers: any[] = (isJointMode ? (mangaCustom?.members || []) : []) as any[];
  const myMember = isJointMode && organization
    ? jointMembers.find((m: any) => m.organization?.id === organization.id)
    : null;
  const isLeader = myMember?.role === 'LEADER';
  const canEditJoint = isLeader || !!myMember?.canEditJoint;
  const canUpload = isLeader || myMember?.role === 'UPLOADER';
  const canInviteJoint = isLeader || !!myMember?.canInvite;
  const [inviteSlug, setInviteSlug] = useState(''); // slug del scan elegido (lo que se envía)
  const [inviteSearch, setInviteSearch] = useState(''); // texto visible en el buscador
  const [inviteResults, setInviteResults] = useState<any[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSearching, setInviteSearching] = useState(false);
  const inviteSearchTimer = useRef<any>(null);
  const [inviteRole, setInviteRole] = useState<'UPLOADER' | 'VIEWER'>('UPLOADER');
  const [inviting, setInviting] = useState(false);

  // Autocompletado de scans por nombre. El usuario ya no necesita saber el slug
  // exacto: busca por nombre y elige de la lista (se guarda el slug real).
  useEffect(() => {
    if (!isJointMode) return;
    if (inviteSearchTimer.current) clearTimeout(inviteSearchTimer.current);
    const q = inviteSearch.trim();
    if (!q) { setInviteResults([]); return; }
    // Si el texto ya coincide exactamente con el scan elegido, no re-buscar.
    inviteSearchTimer.current = setTimeout(async () => {
      setInviteSearching(true);
      try {
        const res = await callAPI(`/api/landing/scans?search=${encodeURIComponent(q)}&limit=8&sort=name`);
        const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
        setInviteResults(items);
      } catch { setInviteResults([]); } finally { setInviteSearching(false); }
    }, 250);
    return () => { if (inviteSearchTimer.current) clearTimeout(inviteSearchTimer.current); };
  }, [inviteSearch, isJointMode]);
  // Joint chapter worked-by selector (accepted member orgs that contributed)
  const [workedByIds, setWorkedByIds] = useState<number[]>([]);

  // ── URL helpers — swap between manga-custom and joint endpoints transparently ──
  // In joint mode the resource slug is the JOINT's own slug (e.g. 'foo-b' when the
  // base manga slug 'foo' was already taken). Joints and their base manga share a
  // `manga.slug` field in the payload, but that's the base manga — NOT the joint —
  // and using it here caused all per-joint API calls to hit the wrong URL.
  const resourceSlug = isJointMode
    ? (mangaCustom?.slug || mangaCustom?.manga?.slug)
    : (mangaCustom?.manga?.slug || mangaCustom?.slug);
  const resourceBase = () => isJointMode
    ? `/api/joint/${resourceSlug}`
    : `/api/manga-custom/${resourceSlug}`;
  const resourceFetchUrl = () => isJointMode
    ? `/api/joint/${resourceSlug}/admin`
    : `/api/manga-custom/${resourceSlug}`;
  const chapterListUrl = () => `${resourceBase()}/chapter`;
  const chapterUrl = (num: number | string) => `${resourceBase()}/chapter/${num}`;
  const pagesUrl = (num: number | string) => `${resourceBase()}/chapter/${num}/pages`;
  
  // Helper functions for date handling
  // Convert UTC date string (from API) to local datetime string for input[type="datetime-local"]
  const utcToLocalDatetimeString = (utcString: string | null | undefined): string => {
    if (!utcString) return '';
    const date = new Date(utcString);
    // Get local date components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Convert local datetime string (from input) to UTC ISO string for API
  const localDatetimeStringToUTC = (localString: string | null | undefined): string | null => {
    if (!localString) return null;
    // Create date from local string (browser interprets it as local time)
    const localDate = new Date(localString);
    // Return ISO string (UTC)
    return localDate.toISOString();
  };

  // Get current date/time in local format for datetime-local input
  const getCurrentLocalDatetimeString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  // Initialize form data from initial resource (manga or joint)
  const initializeFormData = () => {
    // Store dates as local datetime strings for the form inputs
    const releasedAt = utcToLocalDatetimeString(initialResource?.releasedAt);
    const nextChapterAt = utcToLocalDatetimeString(initialResource?.nextChapterAt);

    return {
      title: initialResource?.title || '',
      alternativeTitle: initialResource?.alternativeTitle || '',
      shortDescription: initialResource?.shortDescription || '',
      description: initialResource?.description || '',
      status: initialResource?.status || 'ongoing',
      workType: initialResource?.workType || 'manga',
      releasedAt: releasedAt || null,
      nextChapterAt: nextChapterAt || null,
      nextChapterAtMessage: initialResource?.nextChapterAtMessage || '',
      requireLogin: initialResource?.requireLogin || false,
      isSimulRelease: initialResource?.isSimulRelease || false,
      isNSFW: initialResource?.isNSFW || false,
      isPublic: initialResource?.isPublic !== false,
      isOneShot: initialResource?.isOneShot ?? false,
      demographyId: initialResource?.manga?.demographyId ?? initialResource?.demographyId ?? null,
      hideUnreleasedChapters: initialResource?.hideUnreleasedChapters ?? false,
      finalChapterNumber: initialResource?.finalChapterNumber ?? null,
      groupChaptersByVolume: initialResource?.groupChaptersByVolume ?? false,
      cover: initialResource?.imageUrl || '',
      banner: initialResource?.bannerUrl || '',
      genres: initialResource?.genres || [],
      subscriptionPlansCanReadUnreleased: initialResource?.subscriptionPlansCanReadUnreleased || [],
      subscriptionPlansCanReadReleased: initialResource?.subscriptionPlansCanReadReleased || []
    };
  };

  const [formData, setFormData] = useState(initializeFormData());

  const [newChapter, setNewChapter] = useState({
    number: '',
    title: '',
    releaseDate: '',
    thumbnail: null as File | string | null,
    isUnreleased: false,
    volumeNumber: '' as string,
  });
  
  const [pages, setPages] = useState<(File | string)[]>([]);
  const [singlePageIndexes, setSinglePageIndexes] = useState<number[]>([]);
  // Último número subido EN ESTA SESIÓN del diálogo. Permite encadenar subidas
  // de capítulos viejos (subo 1 → sugiere 2 → subo 2 → sugiere 3) en vez de
  // volver siempre a max+1. Se limpia al cambiar de manga.
  const lastUploadedNumberRef = useRef<number | null>(null);
  useEffect(() => {
    // Cambió el proyecto: la cadena de "capítulos viejos" ya no aplica.
    lastUploadedNumberRef.current = null;
  }, [resourceSlug]);
  // For text-based chapters (novels and other writings). The upload tab swaps
  // its UI based on whether the resolved bookType is in the writing set.
  const [bodyMarkdown, setBodyMarkdown] = useState<string>('');
  const WRITING_BOOK_TYPES = new Set(['novel', 'light-novel', 'book', 'short-story']);
  const bookTypeCode = mangaCustom?.manga?.bookType?.code || (mangaCustom as any)?.bookType?.code || null;
  const isWriting = WRITING_BOOK_TYPES.has(bookTypeCode);

  const [chapters, setChapters] = useState<any[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [editingChapterNumber, setEditingChapterNumber] = useState<number | null>(null);
  const [updatingChapterDate, setUpdatingChapterDate] = useState<number | null>(null); // Chapter ID being updated

  const [genres, setGenres] = useState<any[]>([]);
  const [demographies, setDemographies] = useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [infoLoading, setInfoLoading] = useState(false);

  // Función para validar las suscripciones
  const validateSubscriptions = () => {
    const unreleasedPlans = formData.subscriptionPlansCanReadUnreleased || [];
    const releasedPlans = formData.subscriptionPlansCanReadReleased || [];
    
    // Si ambos tienen valores, verificar que todos los rangos de acceso anticipado estén en capítulos publicados
    if (unreleasedPlans.length > 0 && releasedPlans.length > 0) {
      const unreleasedIds = new Set(unreleasedPlans.map((p: any) => p.id));
      const releasedIds = new Set(releasedPlans.map((p: any) => p.id));
      
      // Encontrar rangos que están en acceso anticipado pero NO en capítulos publicados
      const missingInReleased = unreleasedPlans.filter((p: any) => !releasedIds.has(p.id));
      
      if (missingInReleased.length > 0) {
        return {
          isValid: false,
          error: missingInReleased.map((p: any) => p.name || p.title || `Plan ${p.id}`).join(' y ')
        };
      }
    }
    
    return { isValid: true, error: null };
  };

  // Función para generar el texto explicativo de las combinaciones de suscripciones
  const getSubscriptionExplanation = () => {
    const unreleasedPlans = formData.subscriptionPlansCanReadUnreleased || [];
    const releasedPlans = formData.subscriptionPlansCanReadReleased || [];
    
    // Primero verificar validación
    const validation = validateSubscriptions();
    if (!validation.isValid) {
      const errorRanges = validation.error.split(' y ');
      return {
        content: (
          <>
            Error: Los rangos{' '}
            {errorRanges.map((range, idx) => (
              <React.Fragment key={idx}>
                <span className="font-bold text-yellow-400">{range}</span>
                {idx < errorRanges.length - 1 && ' y '}
              </React.Fragment>
            ))}{' '}
            están en "Suscripciones con Acceso Anticipado" pero no están en "Suscripciones que pueden leer capítulos publicados". Todos los rangos con acceso anticipado deben estar también en capítulos publicados.
          </>
        ),
        isError: true
      };
    }
    
    // Ambos vacíos
    if (unreleasedPlans.length === 0 && releasedPlans.length === 0) {
      return {
        content: "Todos los usuarios podrán leer los capítulos después de su fecha de lanzamiento.",
        isError: false
      };
    }
    
    // Solo acceso anticipado tiene valores
    if (unreleasedPlans.length > 0 && releasedPlans.length === 0) {
      return {
        content: (
          <>
            Todos los usuarios pueden leer los capítulos después de su fecha de lanzamiento. Los usuarios con{' '}
            {unreleasedPlans.map((p: any, idx: number) => (
              <React.Fragment key={p.id}>
                <span className="font-bold text-yellow-400">{p.name || p.title || `Plan ${p.id}`}</span>
                {idx < unreleasedPlans.length - 1 && ' y '}
              </React.Fragment>
            ))}{' '}
            pueden leer los capítulos antes de su fecha de lanzamiento.
          </>
        ),
        isError: false
      };
    }
    
    // Solo capítulos publicados tiene valores
    if (unreleasedPlans.length === 0 && releasedPlans.length > 0) {
      return {
        content: (
          <>
            Solo los usuarios con{' '}
            {releasedPlans.map((p: any, idx: number) => (
              <React.Fragment key={p.id}>
                <span className="font-bold text-yellow-400">{p.name || p.title || `Plan ${p.id}`}</span>
                {idx < releasedPlans.length - 1 && ' y '}
              </React.Fragment>
            ))}{' '}
            pueden leer los capítulos después de su fecha de lanzamiento.
          </>
        ),
        isError: false
      };
    }
    
    // Ambos tienen valores
    const unreleasedIds = new Set(unreleasedPlans.map((p: any) => p.id));
    const releasedIds = new Set(releasedPlans.map((p: any) => p.id));
    
    // Rangos que están solo en released
    const onlyReleased = releasedPlans.filter((p: any) => !unreleasedIds.has(p.id));
    // Rangos que están solo en unreleased
    const onlyUnreleased = unreleasedPlans.filter((p: any) => !releasedIds.has(p.id));
    // Rangos que están en ambos
    const inBoth = unreleasedPlans.filter((p: any) => releasedIds.has(p.id));
    
    const parts: React.ReactNode[] = [];
    
    if (onlyReleased.length > 0) {
      parts.push(
        <>
          Solo los usuarios con{' '}
          {onlyReleased.map((p: any, idx: number) => (
            <React.Fragment key={p.id}>
              <span className="font-bold text-yellow-400">{p.name || p.title || `Plan ${p.id}`}</span>
              {idx < onlyReleased.length - 1 && ' y '}
            </React.Fragment>
          ))}{' '}
          pueden leer los capítulos después de su fecha de lanzamiento.
        </>
      );
    }
    
    if (inBoth.length > 0) {
      parts.push(
        <>
          Los usuarios con{' '}
          {inBoth.map((p: any, idx: number) => (
            <React.Fragment key={p.id}>
              <span className="font-bold text-yellow-400">{p.name || p.title || `Plan ${p.id}`}</span>
              {idx < inBoth.length - 1 && ' y '}
            </React.Fragment>
          ))}{' '}
          pueden leer los capítulos después de su fecha de lanzamiento y también antes de su fecha de lanzamiento.
        </>
      );
    }
    
    if (onlyUnreleased.length > 0) {
      parts.push(
        <>
          Los usuarios con{' '}
          {onlyUnreleased.map((p: any, idx: number) => (
            <React.Fragment key={p.id}>
              <span className="font-bold text-yellow-400">{p.name || p.title || `Plan ${p.id}`}</span>
              {idx < onlyUnreleased.length - 1 && ' y '}
            </React.Fragment>
          ))}{' '}
          pueden leer los capítulos antes de su fecha de lanzamiento.
        </>
      );
    }
    
    return {
      content: parts.length > 0 ? (
        <>
          {parts.map((part, idx) => (
            <React.Fragment key={idx}>
              {part}
              {idx < parts.length - 1 && ' '}
            </React.Fragment>
          ))}
        </>
      ) : (
        "Configuración de suscripciones aplicada."
      ),
      isError: false
    };
  };

  const bannerRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const minimapContainerRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  // Cargar capítulos cuando se cambia al tab de capítulos.
  // También al entrar al upload tab — necesitamos los caps para sugerir
  // el siguiente número por defecto.
  useEffect(() => {
    if ((activeTab === 'chapters' || activeTab === 'upload') && chapters.length === 0) {
      loadChapters();
    }
    // Limpiar estado de edición si se cambia a otro tab que no sea upload
    if (activeTab !== 'upload' && isEditingChapter) {
      setIsEditingChapter(false);
      setEditingChapterNumber(null);
      setNewChapter({
        number: '',
        title: '',
        releaseDate: '',
        isSubscriberOnly: false,
        thumbnail: null,
        isUnreleased: false,
        volumeNumber: '',
      });
      setPages([]);
      setSinglePageIndexes([]);
      setBodyMarkdown('');
    }
  }, [activeTab]);

  // Pre-fill chapter number/title with the next sensible default whenever the
  // user is about to create (NOT edit) a chapter and chapters are loaded.
  // Si el usuario acaba de subir un capítulo en esta sesión, sugerimos ese + 1
  // (para rellenar capítulos viejos en orden); si no, max(existentes) + 1.
  const maxChapterNumber = chapters.reduce((m: number, c: any) => Math.max(m, Number(c?.number) || 0), 0);
  const suggestedFromLast = lastUploadedNumberRef.current !== null
    ? Math.floor(lastUploadedNumberRef.current) + 1
    : null;
  const suggestedNext = suggestedFromLast ?? (Math.floor(maxChapterNumber) + 1);
  const isContinuingOld = suggestedFromLast !== null && suggestedFromLast <= maxChapterNumber;
  useEffect(() => {
    if (isEditingChapter) return;
    if (newChapter.number && newChapter.title) return;
    setNewChapter((prev) => ({
      ...prev,
      number: prev.number || String(suggestedNext),
      title: prev.title || `Capítulo ${suggestedNext}`,
    }));
  }, [chapters, isEditingChapter, suggestedNext]);

  // Las novelas solo tienen una direccion de lectura sensata (texto continuo):
  // fijamos workType a 'text'. El flag +18 (isNSFW) SI se permite; las novelas
  // +18 viven en el lado /red/writings.
  useEffect(() => {
    if (!isWriting) return;
    setFormData((prev) => {
      if (prev.workType === 'text') return prev;
      return { ...prev, workType: 'text' };
    });
  }, [isWriting]);

  // Update form data when initial resource changes
  useEffect(() => {
    if (initialResource) {
      const releasedAt = utcToLocalDatetimeString(initialResource?.releasedAt);
      const nextChapterAt = utcToLocalDatetimeString(initialResource?.nextChapterAt);

      setFormData({
        title: initialResource?.title || '',
        alternativeTitle: initialResource?.alternativeTitle || '',
        shortDescription: initialResource?.shortDescription || '',
        description: initialResource?.description || '',
        status: initialResource?.status || 'ongoing',
        releasedAt: releasedAt || null,
        nextChapterAt: nextChapterAt || null,
        nextChapterAtMessage: initialResource?.nextChapterAtMessage || '',
        requireLogin: initialResource?.requireLogin || false,
        isSimulRelease: initialResource?.isSimulRelease || false,
        isNSFW: initialResource?.isNSFW || false,
        isPublic: initialResource?.isPublic !== false,
        isOneShot: initialResource?.isOneShot ?? false,
        demographyId: initialResource?.manga?.demographyId ?? initialResource?.demographyId ?? null,
        hideUnreleasedChapters: initialResource?.hideUnreleasedChapters ?? false,
        finalChapterNumber: initialResource?.finalChapterNumber ?? null,
        groupChaptersByVolume: initialResource?.groupChaptersByVolume ?? false,
        workType: initialResource?.workType || 'manga',
        cover: initialResource?.imageUrl || '',
        banner: initialResource?.bannerUrl || '',
        genres: initialResource?.genres || [],
        subscriptionPlansCanReadUnreleased: initialResource?.subscriptionPlansCanReadUnreleased || [],
        subscriptionPlansCanReadReleased: initialResource?.subscriptionPlansCanReadReleased || []
      });
      setMangaCustom(initialResource);
    }
  }, [initialResource]);

  // Cargar géneros y planes de suscripción cuando se cambia al tab de información
  useEffect(() => {
    if (activeTab === 'info') {
      loadGenres();
      loadDemographies();
      loadSubscriptionPlans();
    }
  }, [activeTab]);

  // Detect if the base manga is part of an active joint — chapter uploads must go through
  // the joint admin so they reach every member scan, not just this one.
  // (Only relevant in manga mode — joint mode IS the joint.)
  useEffect(() => {
    if (isJointMode) { setActiveJoint(null); return; }
    const slug = initialResource?.manga?.slug || initialResource?.slug;
    if (!slug) return;
    callAPI(`/api/manga/${slug}/joint`)
      .then((j: any) => { setActiveJoint(j && j.slug ? { slug: j.slug, title: j.title } : null); })
      .catch(() => { setActiveJoint(null); });
  }, [initialResource, isJointMode]);

  const loadGenres = async () => {
    try {
      const result = await callAPI('/api/genre');
      if (Array.isArray(result)) {
        setGenres(result);
      }
    } catch (error: any) {
      console.error('Error loading genres:', error);
    }
  };

  const loadDemographies = async () => {
    try {
      const result = await callAPI('/api/demography');
      if (Array.isArray(result)) setDemographies(result);
    } catch (error: any) {
      console.error('Error loading demographies:', error);
    }
  };

  const loadSubscriptionPlans = async () => {
    try {
      const result = await callAPI('/api/subscription-plan');
      // callAPI devuelve result.data, que es { items: [...], maxPage, total }
      if (result?.items && Array.isArray(result.items)) {
        setSubscriptionPlans(result.items);
      } else if (Array.isArray(result)) {
        // Fallback por si el API devuelve directamente un array
        setSubscriptionPlans(result);
      }
    } catch (error: any) {
      console.error('Error loading subscription plans:', error);
    }
  };

  const loadChapters = async () => {
    setChaptersLoading(true);
    try {
      const result = await callAPI(resourceFetchUrl());
      if (result?.data?.chapters) {
        setChapters(result.data.chapters);
        if (isJointMode) setMangaCustom(result.data);
      } else if (result?.chapters) {
        setChapters(result.chapters);
        if (isJointMode) setMangaCustom(result);
      } else if (result?.data) {
        const updated = await callAPI(resourceFetchUrl());
        if (updated?.chapters) {
          setChapters(updated.chapters);
          if (isJointMode) setMangaCustom(updated);
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Error al cargar capítulos');
    } finally {
      setChaptersLoading(false);
    }
  };

  const epubInputRef = useRef<HTMLInputElement>(null);
  const [epubImporting, setEpubImporting] = useState(false);

  // Importa un EPUB completo: lo parsea en el backend (spine + TOC + imagenes a
  // R2) y crea los capitulos en lote, numerando a partir del ultimo existente.
  const handleEpubImport = async (file: File) => {
    setEpubImporting(true);
    const toastId = toast.loading('Importando EPUB...');
    try {
      const API_URL = import.meta.env['PUBLIC_API_URL'];
      const cookies = document.cookie.split(';').reduce((acc, c) => {
        const [k, v] = c.trim().split('=');
        if (k && v) acc[k] = decodeURIComponent(v);
        return acc;
      }, {} as Record<string, string>);
      const token = cookies['token'];
      const parts = window.location.pathname.split('/').filter(Boolean);
      const orgSlug = parts[0] === 'red' ? parts[1] : parts[0];
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/api/files/parse-epub`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(orgSlug ? { 'x-organization': orgSlug } : {}),
        },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || json.status === false) {
        throw new Error(json?.message || 'Error al parsear el EPUB');
      }
      const parsed: Array<{ number: number; title: string; volumeNumber: number | null; bodyMarkdown: string }> =
        json.data.chapters || [];
      if (parsed.length === 0) throw new Error('El EPUB no contiene capitulos con texto.');
      const base = chapters.reduce((mx: number, c: any) => Math.max(mx, Number(c.number) || 0), 0);
      toast.dismiss(toastId);
      const ok = window.confirm(
        `Se importaran ${parsed.length} capitulos${json.data.images ? ` y ${json.data.images} imagenes` : ''} a partir del numero ${base + 1}. Continuar?`
      );
      if (!ok) {
        setEpubImporting(false);
        return;
      }
      const progressId = toast.loading(`Importando capitulos... 0/${parsed.length}`);
      let created = 0;
      const errors: string[] = [];
      for (const ch of parsed) {
        const number = base + ch.number;
        try {
          await callAPI(chapterListUrl(), {
            method: 'POST',
            body: JSON.stringify({
              title: ch.title || `Capitulo ${number}`,
              number,
              releasedAt: new Date().toISOString(),
              pages: [],
              singlePages: [],
              bodyMarkdown: ch.bodyMarkdown,
              isUnreleased: false,
              volumeNumber: ch.volumeNumber ?? null,
            }),
          });
          created += 1;
          toast.loading(`Importando capitulos... ${created}/${parsed.length}`, { id: progressId });
        } catch (e: any) {
          errors.push(`#${number}: ${e?.message || 'error'}`);
        }
      }
      toast.dismiss(progressId);
      if (created) toast.success(`Importados ${created} capitulos del EPUB.`);
      if (errors.length) toast.error(`Fallaron ${errors.length} capitulos. ${errors[0]}`);
      const warnings: string[] = json.data.warnings || [];
      if (warnings.length) toast(`Aviso: ${warnings[0]}`);
      await loadChapters();
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e?.message || 'Error al importar el EPUB');
    } finally {
      setEpubImporting(false);
    }
  };

  const handleDownloadChapter = async (chapter: any) => {
    toast.info(`Descargando capítulo ${chapter.number}...`);
    try {
      const chapterPages = await callAPI(pagesUrl(chapter.number));
      
      const zip = new JSZip();
      const folder = zip.folder(`Chapter ${chapter.number}`);
      
      const pagePromises = chapterPages.map((page: any) => {
        return fetch(page.imageUrl).then((response) => response.blob());
      });
      
      const blobs = await Promise.all(pagePromises);
      blobs.forEach((blob, index) => {
        folder?.file(`Page ${chapterPages[index].number}.jpg`, blob, {
          type: 'blob',
        });
      });
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(zipBlob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Chapter ${chapter.number}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Descarga iniciada');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Error al descargar el capítulo', {
        position: "bottom-right"
      });
    }
  };

  // Borrado de capítulo con modal de confirmación (solo con permiso).
  const [chapterToDelete, setChapterToDelete] = useState<any | null>(null);
  const [deletingChapter, setDeletingChapter] = useState(false);
  const confirmDeleteChapter = async () => {
    if (!chapterToDelete || deletingChapter) return;
    setDeletingChapter(true);
    try {
      await callAPI(chapterUrl(chapterToDelete.number), { method: 'DELETE' });
      toast.success('Capítulo eliminado', { position: 'bottom-right' });
      setChapterToDelete(null);
      loadChapters();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo eliminar el capítulo', { position: 'bottom-right' });
    } finally {
      setDeletingChapter(false);
    }
  };

  // Borrado de la ficha completa del manga (zona de peligro, solo con permiso).
  const [showDeleteMangaModal, setShowDeleteMangaModal] = useState(false);
  const [deleteMangaConfirmText, setDeleteMangaConfirmText] = useState('');
  const [deletingManga, setDeletingManga] = useState(false);
  // El slug de la obra vive en manga.slug (mangaCustom.slug no existe en el
  // payload); sin este fallback el modal mostraba la confirmación vacía y el
  // botón de eliminar nunca se habilitaba.
  const deleteMangaSlug = mangaCustom?.manga?.slug || mangaCustom?.slug || '';
  const copyDeleteSlug = () => {
    navigator.clipboard.writeText(deleteMangaSlug).then(
      () => toast.success('Copiado. Pégalo en el campo para confirmar.', { position: 'bottom-right' }),
      () => toast.error('No se pudo copiar', { position: 'bottom-right' })
    );
  };
  const confirmDeleteManga = async () => {
    if (deletingManga || !deleteMangaSlug || deleteMangaConfirmText.trim() !== deleteMangaSlug) return;
    setDeletingManga(true);
    try {
      await callAPI(`/api/manga-custom/${deleteMangaSlug}`, { method: 'DELETE' });
      toast.success('Obra eliminada', { position: 'bottom-right' });
      window.location.href = `/${organizationSlug}/admin/mangas`;
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo eliminar la obra', { position: 'bottom-right' });
      setDeletingManga(false);
    }
  };

  const handleEditChapter = async (chapter: any) => {
    setLoading(true);
    try {
      // Cargar datos del capítulo
      setNewChapter({
        number: chapter.number.toString(),
        title: chapter.title || '',
        releaseDate: chapter.isUnreleased ? '' : utcToLocalDatetimeString(chapter.releasedAt),
        thumbnail: chapter.imageUrl || null,
        isUnreleased: chapter.isUnreleased || false,
        volumeNumber: chapter.volumeNumber != null ? String(chapter.volumeNumber) : '',
      });
      // Preload the joint worked-by selector from the chapter
      if (isJointMode) {
        setWorkedByIds((chapter.workedByOrganizations || []).map((o: any) => o.id));
      }

      // For writings, load bodyMarkdown from the chapter and skip the pages fetch.
      if (isWriting) {
        setBodyMarkdown(chapter.bodyMarkdown || '');
        setPages([]);
        setSinglePageIndexes([]);
        setIsEditingChapter(true);
        setEditingChapterNumber(chapter.number);
        setActiveTab('upload');
        setLoading(false);
        return;
      }

      // Cargar páginas del capítulo
      const chapterPages = await callAPI(pagesUrl(chapter.number));

      // Convertir páginas al formato esperado
      const loadedPages: string[] = chapterPages.map((page: any) => page.imageUrl);
      setPages(loadedPages);

      // Cargar índices de páginas simples
      const loadedSinglePageIndexes = chapterPages
        .map((page: any, index: number) => page.isSinglePage ? index : null)
        .filter((index: number | null) => index !== null) as number[];
      setSinglePageIndexes(loadedSinglePageIndexes);

      // Marcar como editando
      setIsEditingChapter(true);
      setEditingChapterNumber(chapter.number);
      
      toast.success('Capítulo cargado para edición', {
        position: "bottom-right"
      });
      
      // Cambiar al tab de upload
      setActiveTab('upload');
    } catch (error: any) {
      toast.error(error?.message || 'Error al cargar el capítulo', {
        position: "bottom-right"
      });
    } finally {
      setLoading(false);
    }
  };



  // Helper para obtener la URL de una página (File o string)
  const getPageUrl = (page: File | string): string => {
    if (page instanceof File) {
      return URL.createObjectURL(page);
    }
    return page;
  };

  // Helper para obtener el nombre del archivo
  const getPageFileName = (page: File | string): string => {
    if (page instanceof File) {
      return page.name;
    }
    // Si es una URL, extraer el nombre del archivo
    try {
      const url = new URL(page);
      const pathParts = url.pathname.split('/');
      return pathParts[pathParts.length - 1] || 'imagen.jpg';
    } catch {
      // Si no es una URL válida, intentar extraer de la cadena
      const parts = page.split('/');
      return parts[parts.length - 1] || 'imagen.jpg';
    }
  };

  // Helper para verificar si una página es individual
  const isPageSingle = (index: number): boolean => {
    return singlePageIndexes.includes(index);
  };

  // Toggle para marcar/desmarcar página como individual
  const togglePageType = (index: number) => {
    setSinglePageIndexes(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index].sort((a, b) => a - b);
      }
    });
  };

  // Eliminar página
  const removePage = (index: number) => {
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);

    // Actualizar los índices de páginas simples después de eliminar
    const newSinglePageIndexes = singlePageIndexes
      .filter(i => i !== index)
      .map(i => i > index ? i - 1 : i);
    setSinglePageIndexes(newSinglePageIndexes);
  };

  // Mover una página una posición. El arrastre HTML5 no funciona con el dedo
  // (móvil/app), así que estos botones permiten reordenar también desde el
  // celular. dir = -1 (antes) o +1 (después).
  const movePage = (index: number, dir: number) => {
    const target = index + dir;
    if (target < 0 || target >= pages.length) return;
    const next = [...pages];
    [next[index], next[target]] = [next[target], next[index]];
    setPages(next);
    setSinglePageIndexes(singlePageIndexes.map(i => (i === index ? target : i === target ? index : i)));
  };

  const startAutoscroll = (container: HTMLDivElement, direction: number, speed: number) => {
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    const scroll = () => {
      if (container) {
        container.scrollTop += direction * speed;
        scrollRafRef.current = requestAnimationFrame(scroll);
      }
    };
    scrollRafRef.current = requestAnimationFrame(scroll);
  };

  const stopAutoscroll = () => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
  };

  const handleDrag = (ev: React.DragEvent) => {
    const imageId = (ev.currentTarget as HTMLElement).id;
    const pageIndex = parseInt(imageId.split('-').pop() || '0');
    setDragId(`preview-page-${pageIndex}`);
  };

  const handleDragOver = (ev: React.DragEvent) => {
    ev.preventDefault();
    
    const container = scrollContainerRef.current;
    if (container) {
      const cRect = container.getBoundingClientRect();
      const threshold = 60;
      const mouseRelY = ev.clientY - cRect.top;
      if (mouseRelY < threshold) startAutoscroll(container, -1, 6);
      else if (mouseRelY > cRect.height - threshold) startAutoscroll(container, 1, 6);
      else stopAutoscroll();
    }
  };

  const handleDrop = (ev: React.DragEvent) => {
    ev.preventDefault();
    stopAutoscroll();
    if (!dragId) return;
    
    const dragPageIndex = parseInt(dragId.replace('preview-page-', ''));
    const dropElement = ev.currentTarget as HTMLElement;
    const dropElementId = dropElement.id;
    
    // Puede ser preview-page-X o preview-page-mini-X
    let dropPageIndex: number;
    if (dropElementId.includes('preview-page-mini-')) {
      dropPageIndex = parseInt(dropElementId.replace('preview-page-mini-', ''));
    } else if (dropElementId.includes('preview-page-')) {
      dropPageIndex = parseInt(dropElementId.replace('preview-page-', ''));
    } else {
      dropPageIndex = parseInt(dropElementId.split('-').pop() || '0');
    }
    
    if (dragPageIndex === dropPageIndex) {
      setDragId(null);
      return;
    }
    
    const newPagesOrder = [...pages];
    const [draggedPage] = newPagesOrder.splice(dragPageIndex, 1);
    newPagesOrder.splice(dropPageIndex, 0, draggedPage);
    setPages(newPagesOrder);

    // Actualizar los índices de páginas simples después de reordenar
    const newSinglePageIndexes = singlePageIndexes.map(index => {
      if (index === dragPageIndex) return dropPageIndex;
      if (index < dragPageIndex && index >= dropPageIndex) return index + 1;
      if (index > dragPageIndex && index <= dropPageIndex) return index - 1;
      return index;
    });
    setSinglePageIndexes(newSinglePageIndexes);
    setDragId(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    stopAutoscroll();
  };

  const handlePagesUpload = (files: File[]) => {
    if (files.length === 0) return;
    setPages([...pages, ...files]);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    let uploadToastId: any = null;
    let progressInterval: NodeJS.Timeout | null = null;
    let currentProgress = 0;
    
    try {
      // Función para renderizar el contenido del toast
      const renderProgressToast = (progress: number, message: string) => (
        <div className="space-y-2">
          <div className="text-sm font-bold text-white">{message}</div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-cyan-500 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      );

      // Función para actualizar el progreso
      const updateProgress = (progress: number, message: string) => {
        if (uploadToastId) {
          toast.update(uploadToastId, {
            render: renderProgressToast(progress, message),
            type: 'default',
            isLoading: false,
            position: "bottom-right",
            autoClose: false,
            closeOnClick: false,
            draggable: false,
          });
        }
      };

      // Iniciar barra de progreso animada
      uploadToastId = toast(
        renderProgressToast(0, 'Subiendo banner...'),
        {
          type: 'info',
          position: "bottom-right",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        }
      );

      // Animar progreso gradualmente hasta 40%
      progressInterval = setInterval(() => {
        if (currentProgress < 40) {
          currentProgress += 2;
          updateProgress(currentProgress, 'Subiendo banner...');
        } else {
          if (progressInterval) clearInterval(progressInterval);
        }
      }, 100);
      
      // Mostrar preview temporal mientras se sube
      const tempPreviewUrl = URL.createObjectURL(file);
      setFormData({ ...formData, banner: tempPreviewUrl });
      
      const fileKey = await uploadFile(file, undefined, 'mangas');
      
      // Limpiar preview temporal
      URL.revokeObjectURL(tempPreviewUrl);
      
      // Limpiar intervalo anterior
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      
      // Continuar animación hasta 90%
      progressInterval = setInterval(() => {
        if (currentProgress < 90) {
          currentProgress += 2;
          updateProgress(currentProgress, 'Guardando banner...');
        } else {
          if (progressInterval) clearInterval(progressInterval);
        }
      }, 100);
      
      // 3. Enviar al API para guardar permanentemente
      const response = await callAPI(resourceBase(), {
        method: 'PATCH',
        body: JSON.stringify({
          ...(isJointMode ? {} : { mangaCustomId: mangaCustom?.id }),
          banner: fileKey,
        }),
      });

      // Completar la barra al 100%
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      updateProgress(100, 'Completado');
      
      // Esperar un momento antes de cerrar para que se vea el 100%
      setTimeout(() => {
        if (uploadToastId) {
          toast.dismiss(uploadToastId);
        }
      }, 300);

      if (response) {
        toast.success('Banner actualizado correctamente', {
          position: "bottom-right"
        });
        // Actualizar mangaCustom con la respuesta del servidor
        setMangaCustom(response);
        // Usar la URL completa del servidor (bannerUrl) en lugar del fileKey
        setFormData(prev => ({ ...prev, banner: response.bannerUrl || prev.banner }));
      } else {
        toast.error('Error al guardar el banner en el servidor', {
          position: "bottom-right"
        });
      }
    } catch (error: any) {
      // Limpiar intervalo si hay error
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      // Cerrar toast de progreso si hay error
      if (uploadToastId) {
        toast.dismiss(uploadToastId);
      }
      toast.error(error?.message || 'Error al subir banner', {
        position: "bottom-right"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    let uploadToastId: any = null;
    let progressInterval: NodeJS.Timeout | null = null;
    let currentProgress = 0;
    
    try {
      // Función para renderizar el contenido del toast
      const renderProgressToast = (progress: number, message: string) => (
        <div className="space-y-2">
          <div className="text-sm font-bold text-white">{message}</div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-cyan-500 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      );

      // Función para actualizar el progreso
      const updateProgress = (progress: number, message: string) => {
        if (uploadToastId) {
          toast.update(uploadToastId, {
            render: renderProgressToast(progress, message),
            type: 'default',
            isLoading: false,
            position: "bottom-right",
            autoClose: false,
            closeOnClick: false,
            draggable: false,
          });
        }
      };

      // Iniciar barra de progreso animada
      uploadToastId = toast(
        renderProgressToast(0, 'Subiendo portada...'),
        {
          type: 'info',
          position: "bottom-right",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        }
      );

      // Animar progreso gradualmente hasta 40%
      progressInterval = setInterval(() => {
        if (currentProgress < 40) {
          currentProgress += 2;
          updateProgress(currentProgress, 'Subiendo portada...');
        } else {
          if (progressInterval) clearInterval(progressInterval);
        }
      }, 100);
      
      // Mostrar preview temporal mientras se sube
      const tempPreviewUrl = URL.createObjectURL(file);
      setFormData({ ...formData, cover: tempPreviewUrl });
      
      const fileKey = await uploadFile(file, undefined, 'mangas');
      
      // Limpiar preview temporal
      URL.revokeObjectURL(tempPreviewUrl);
      
      // Limpiar intervalo anterior
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      
      // Continuar animación hasta 90%
      progressInterval = setInterval(() => {
        if (currentProgress < 90) {
          currentProgress += 2;
          updateProgress(currentProgress, 'Guardando portada...');
        } else {
          if (progressInterval) clearInterval(progressInterval);
        }
      }, 100);
      
      // 3. Enviar al API para guardar permanentemente
      const response = await callAPI(resourceBase(), {
        method: 'PATCH',
        body: JSON.stringify({
          ...(isJointMode ? {} : { mangaCustomId: mangaCustom?.id }),
          image: fileKey,
        }),
      });

      // Completar la barra al 100%
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      updateProgress(100, 'Completado');
      
      // Esperar un momento antes de cerrar para que se vea el 100%
      setTimeout(() => {
        if (uploadToastId) {
          toast.dismiss(uploadToastId);
        }
      }, 300);

      if (response) {
        toast.success('Portada actualizada correctamente', {
          position: "bottom-right"
        });
        // Actualizar mangaCustom con la respuesta del servidor
        setMangaCustom(response);
        // Usar la URL completa del servidor (imageUrl) en lugar del fileKey
        setFormData(prev => ({ ...prev, cover: response.imageUrl || prev.cover }));
      } else {
        toast.error('Error al guardar la portada en el servidor', {
          position: "bottom-right"
        });
      }
    } catch (error: any) {
      // Limpiar intervalo si hay error
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      // Cerrar toast de progreso si hay error
      if (uploadToastId) {
        toast.dismiss(uploadToastId);
      }
      toast.error(error?.message || 'Error al subir portada', {
        position: "bottom-right"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInfo = async () => {
    if (!formData.title) {
      toast.error('El título es obligatorio');
      return;
    }

    // Validar suscripciones
    const validation = validateSubscriptions();
    if (!validation.isValid) {
      toast.error(`Error de validación: Los rangos ${validation.error} están en "Suscripciones con Acceso Anticipado" pero no están en "Suscripciones que pueden leer capítulos publicados".`);
      return;
    }

    setInfoLoading(true);
    try {
      // Upload cover and banner if they are File objects
      let coverKey = formData.cover;
      let bannerKey = formData.banner;

      const filesToUpload = [
        formData.cover instanceof File,
        formData.banner instanceof File
      ].filter(Boolean).length;

      let toastId = null;
      let uploadedCount = 0;

      if (filesToUpload > 0) {
        toastId = toast.loading(`Subiendo archivos ${uploadedCount + 1}/${filesToUpload}`, {
          position: "bottom-right"
        });
      }

      try {
        if (formData.cover instanceof File) {
          uploadedCount++;
          toast.update(toastId, { 
            render: `Subiendo archivos ${uploadedCount}/${filesToUpload}`,
            position: "bottom-right"
          });
          coverKey = await uploadFile(formData.cover, undefined, 'mangas');
        }
        
        if (formData.banner instanceof File) {
          uploadedCount++;
          toast.update(toastId, { 
            render: `Subiendo archivos ${uploadedCount}/${filesToUpload}`,
            position: "bottom-right"
          });
          bannerKey = await uploadFile(formData.banner, undefined, 'mangas');
        }

        if (toastId) {
          toast.dismiss(toastId);
          toast.success(`${filesToUpload} ${filesToUpload === 1 ? 'archivo subido' : 'archivos subidos'} correctamente`, {
            position: "bottom-right"
          });
        }
      } catch (error) {
        if (toastId) {
          toast.dismiss(toastId);
          toast.error("Error al subir archivos", {
            position: "bottom-right"
          });
        }
        throw error;
      }

      // Body fields that apply to both manga and joint. Manga-only fields are stripped in joint mode
      // (backend would ignore them but we keep the payload clean).
      const patchBody: any = {
        title: formData.title,
        alternativeTitle: formData.alternativeTitle?.trim() || null,
        shortDescription: formData.shortDescription || null,
        description: formData.description || null,
        status: formData.status,
        workType: formData.workType,
        image: coverKey,
        banner: bannerKey,
      };
      // Géneros: aplica a manga individual y a joint (el joint tiene su propia lista).
      patchBody.genreIds = formData.genres.map((g: any) => g.id);
      if (!isJointMode) {
        patchBody.mangaCustomId = mangaCustom?.id;
        patchBody.releasedAt = localDatetimeStringToUTC(formData.releasedAt);
        patchBody.nextChapterAt = localDatetimeStringToUTC(formData.nextChapterAt);
        patchBody.nextChapterAtMessage = formData.nextChapterAtMessage || null;
        patchBody.requireLogin = formData.requireLogin;
        patchBody.isSimulRelease = formData.isSimulRelease;
        patchBody.isNSFW = formData.isNSFW;
        patchBody.isPublic = formData.isPublic;
        patchBody.isOneShot = formData.isOneShot;
        patchBody.demographyId = formData.demographyId ?? null;
        patchBody.hideUnreleasedChapters = formData.hideUnreleasedChapters;
        patchBody.finalChapterNumber = formData.finalChapterNumber ?? null;
        patchBody.groupChaptersByVolume = formData.groupChaptersByVolume;
        patchBody.subscriptionPlanIdsCanReadUnreleased = formData.subscriptionPlansCanReadUnreleased?.map((p: any) => p.id) || [];
        patchBody.subscriptionPlanIdsCanReadReleased = formData.subscriptionPlansCanReadReleased?.map((p: any) => p.id) || [];
      }
      const response = await callAPI(resourceBase(), {
        method: 'PATCH',
        body: JSON.stringify(patchBody),
      });

      if (response?.status || response) {
        toast.success('Información del manga actualizada correctamente', {
          position: "bottom-right"
        });
        // Update local state with response data
        if (response) {
          setMangaCustom(response);
          setFormData(prev => ({
            ...prev,
            genres: response.genres || prev.genres,
            subscriptionPlansCanReadUnreleased: response.subscriptionPlansCanReadUnreleased || prev.subscriptionPlansCanReadUnreleased,
            subscriptionPlansCanReadReleased: response.subscriptionPlansCanReadReleased || prev.subscriptionPlansCanReadReleased,
            cover: response.imageUrl || prev.cover,
            banner: response.bannerUrl || prev.banner,
          }));
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Error al actualizar la información del manga', {
        position: "bottom-right"
      });
    } finally {
      setInfoLoading(false);
    }
  };

  const scrollToPage = (spreadIndex: number) => {
    const content = scrollContainerRef.current?.querySelector('.spreads-container');
    if (content && content.children[spreadIndex]) {
      content.children[spreadIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSaveChapter = async () => {
    if (!newChapter.number) {
      toast.error('Completa el número de capítulo');
      return;
    }
    if (isWriting) {
      if (!bodyMarkdown.trim()) {
        toast.error('Escribe el contenido del capítulo');
        return;
      }
    } else if (pages.length === 0) {
      toast.error('Sube al menos una página');
      return;
    }

    setLoading(true);
    
    // Declarar variables fuera del bloque try
    const pageKeys: string[] = [];
    let imageKey: string | null = null;
    
    try {
      // Writings don't have per-page images, only the thumbnail can be a file.
      const pagesToUpload = isWriting ? 0 : pages.filter(page => page instanceof File).length;
      const thumbnailToUpload = newChapter.thumbnail instanceof File ? 1 : 0;
      const filesToUpload = pagesToUpload + thumbnailToUpload;

      let toastId = null;
      let uploadedCount = 0;

      if (filesToUpload > 0) {
        toastId = toast.loading(`Subiendo archivos ${uploadedCount + 1}/${filesToUpload}`, {
          position: "bottom-right"
        });
      }

      try {
        // Upload thumbnail if it's a new file
        if (newChapter.thumbnail instanceof File) {
          uploadedCount++;
          toast.update(toastId, { 
            render: `Subiendo archivos ${uploadedCount}/${filesToUpload}`,
            position: "bottom-right"
          });
          imageKey = await uploadFile(newChapter.thumbnail, undefined, 'chapters');
        } else if (typeof newChapter.thumbnail === 'string') {
          // Si ya es un string (URL o fileKey), mantenerlo
          imageKey = newChapter.thumbnail;
        }

        if (!isWriting) {
          // Upload pages that are new files (secuencialmente para actualizar contador)
          for (const page of pages) {
            if (page instanceof File) {
              uploadedCount++;
              toast.update(toastId, {
                render: `Subiendo archivos ${uploadedCount}/${filesToUpload}`,
                position: "bottom-right"
              });
              const key = await uploadFile(page, undefined, 'chapters');
              pageKeys.push(key);
            } else if (typeof page === 'string') {
              // Si es un string (fileKey o URL), mantenerlo como está
              pageKeys.push(page);
            }
          }
        }

        if (toastId) {
          toast.dismiss(toastId);
          toast.success(`${filesToUpload} ${filesToUpload === 1 ? 'archivo subido' : 'archivos subidos'} correctamente`, {
            position: "bottom-right"
          });
        }
      } catch (error) {
        if (toastId) {
          toast.dismiss(toastId);
          toast.error("Error al subir archivos", {
            position: "bottom-right"
          });
        }
        throw error;
      }

      // Determinar si es edición o creación
      const isEdit = isEditingChapter && editingChapterNumber !== null;
      const chapterNumber = isEdit ? editingChapterNumber : parseFloat(newChapter.number);

      const response = await callAPI(
        isEdit ? chapterUrl(chapterNumber as number) : chapterListUrl(),
        {
          method: isEdit ? 'PATCH' : 'POST',
          body: JSON.stringify({
            title: newChapter.title || `Capítulo ${newChapter.number}`,
            number: parseFloat(newChapter.number),
            releasedAt: newChapter.isUnreleased
              ? null
              : (newChapter.releaseDate
                  ? localDatetimeStringToUTC(newChapter.releaseDate)
                  : new Date().toISOString()),
            pages: isWriting ? [] : pageKeys,
            singlePages: isWriting ? [] : singlePageIndexes,
            ...(isWriting ? { bodyMarkdown } : {}),
            ...(imageKey ? { image: imageKey } : {}),
            isUnreleased: newChapter.isUnreleased || false,
            volumeNumber: newChapter.volumeNumber === '' ? null : parseInt(newChapter.volumeNumber, 10),
            ...(isJointMode ? { workedByOrganizationIds: workedByIds } : {}),
          }),
        }
      );

      if (response?.status || response) {
        toast.success(isEdit ? 'Capítulo actualizado exitosamente' : 'Capítulo creado exitosamente', {
          position: "bottom-right"
        });
        // Recordar el número recién subido para encadenar la siguiente sugerencia
        // (solo en creación, no en edición).
        if (!isEdit) {
          const uploaded = parseFloat(newChapter.number);
          if (!Number.isNaN(uploaded)) lastUploadedNumberRef.current = uploaded;
        }
        // Reset form
        setNewChapter({
          number: '',
          title: '',
          isUnreleased: false,
          releaseDate: '',
          isSubscriberOnly: false,
          thumbnail: null,
          volumeNumber: '',
        });
        setPages([]);
        setSinglePageIndexes([]);
        setBodyMarkdown('');
        setIsEditingChapter(false);
        setEditingChapterNumber(null);
        // Recargar capítulos — esto refresca chapters[] y el useEffect de
        // defaults pre-rellena el siguiente número/título automáticamente.
        loadChapters();
      }
    } catch (error: any) {
      toast.error(error?.message || 'Error al crear el capítulo');
    } finally {
      setLoading(false);
    }
  };

  // Function to update chapter date and isUnreleased from table
  // Applies the same rules as the edit chapter form
  // Only updates isUnreleased field, following backend controller logic
  // ── Joint-only handlers (members management) ──
  const reloadResource = async () => {
    try {
      const data = await callAPI(resourceFetchUrl());
      if (data) setMangaCustom(data);
    } catch {}
  };

  const handleInviteMember = async () => {
    if (!inviteSlug.trim()) return;
    setInviting(true);
    try {
      await callAPI(`/api/joint/${resourceSlug}/invite`, {
        method: 'POST',
        body: JSON.stringify({ organizationSlug: inviteSlug.trim(), role: inviteRole }),
      });
      toast.success('Invitación enviada', { position: 'bottom-right' });
      setInviteSlug('');
      setInviteSearch('');
      setInviteResults([]);
      setInviteOpen(false);
      await reloadResource();
    } catch (e: any) {
      toast.error(e?.message || 'Error al invitar', { position: 'bottom-right' });
    } finally {
      setInviting(false);
    }
  };

  const handleExpelMember = async (orgSlug: string) => {
    if (!confirm('¿Expulsar a este scan del joint?')) return;
    try {
      await callAPI(`/api/joint/${resourceSlug}/member/${orgSlug}`, { method: 'DELETE' });
      toast.success('Miembro expulsado', { position: 'bottom-right' });
      await reloadResource();
    } catch (e: any) {
      toast.error(e?.message || 'Error al expulsar', { position: 'bottom-right' });
    }
  };

  const handleTransferLeadership = async (orgSlug: string) => {
    if (!confirm(`¿Transferir el liderazgo a ${orgSlug}? Tú pasarás a ser UPLOADER.`)) return;
    try {
      await callAPI(`/api/joint/${resourceSlug}/transfer`, {
        method: 'PATCH',
        body: JSON.stringify({ organizationSlug: orgSlug }),
      });
      toast.success('Liderazgo transferido', { position: 'bottom-right' });
      await reloadResource();
    } catch (e: any) {
      toast.error(e?.message || 'Error al transferir', { position: 'bottom-right' });
    }
  };

  const handleDissolveJoint = async () => {
    const myCount = (chapters || []).filter((c: any) => (c.uploadedByOrganization?.id ?? c.uploadedByOrganizationId) === organization?.id).length;
    const otherCount = (chapters || []).length - myCount;
    const msg = `¿Disolver el joint?\nCaps a detach:\n  - tu org: ${myCount}\n  - otros miembros: ${otherCount}\nLos capítulos se moverán a cada scan que los subió.`;
    if (!confirm(msg)) return;
    try {
      await callAPI(`/api/joint/${resourceSlug}`, { method: 'DELETE' });
      toast.success('Joint disuelto', { position: 'bottom-right' });
      window.location.href = `/${organizationSlug}/admin/joints`;
    } catch (e: any) {
      toast.error(e?.message || 'Error al disolver', { position: 'bottom-right' });
    }
  };

  const handleLeaveJoint = async () => {
    const myCount = (chapters || []).filter((c: any) => (c.uploadedByOrganization?.id ?? c.uploadedByOrganizationId) === organization?.id).length;
    const msg = `¿Salir del joint?\nVas a sacar ${myCount} capítulos uploaded por tu scan, que volverán a tu MangaCustom.`;
    if (!confirm(msg)) return;
    try {
      const res = await callAPI(`/api/joint/${resourceSlug}/leave`, { method: 'POST' });
      const moved = res?.moved ?? 0;
      const conflicts = res?.conflicts ?? 0;
      const auto = res?.autoDissolved ? ' Joint disuelto (último miembro).' : '';
      toast.success(`Saliste del joint. ${moved} capítulos detached${conflicts ? `, ${conflicts} conflictos resueltos` : ''}.${auto}`, { position: 'bottom-right' });
      window.location.href = `/${organizationSlug}/admin/joints`;
    } catch (e: any) {
      toast.error(e?.message || 'Error al salir del joint', { position: 'bottom-right' });
    }
  };

  const handlePromoteChapter = async (chapterId: number) => {
    if (!confirm('¿Mover este capítulo al joint? Será visible bajo el joint y dejará de estar en tu scan.')) return;
    try {
      await callAPI(`/api/joint/${resourceSlug}/chapters/${chapterId}/promote`, { method: 'POST' });
      toast.success('Capítulo movido al joint', { position: 'bottom-right' });
      await reloadResource();
    } catch (e: any) {
      toast.error(e?.message || 'Error al promover', { position: 'bottom-right' });
    }
  };

  const handleDemoteChapter = async (chapterId: number, opts: { replace?: boolean } = {}) => {
    try {
      const url = `/api/joint/${resourceSlug}/chapters/${chapterId}/demote${opts.replace ? '?replace=1' : ''}`;
      const res = await callAPI(url, { method: 'POST' });
      if (res?.conflict) {
        if (confirm('Tu scan ya tiene un capítulo con ese número. ¿Reemplazarlo? El existente será movido a la papelera.')) {
          return handleDemoteChapter(chapterId, { replace: true });
        }
        return;
      }
      toast.success('Capítulo movido a tu scan', { position: 'bottom-right' });
      await reloadResource();
    } catch (e: any) {
      toast.error(e?.message || 'Error al demover', { position: 'bottom-right' });
    }
  };

  const handleBulkMove = async (direction: 'promote' | 'demote', chapterIds: number[]) => {
    if (chapterIds.length === 0) return;
    if (!confirm(`¿Mover ${chapterIds.length} capítulos al ${direction === 'promote' ? 'joint' : 'scan'}?`)) return;
    try {
      const res = await callAPI(`/api/joint/${resourceSlug}/chapters/bulk-move`, {
        method: 'POST',
        body: JSON.stringify({ chapterIds, direction }),
      });
      const moved = res?.moved ?? 0;
      const skipped = res?.skipped?.length ?? 0;
      const confs = res?.conflicts?.length ?? 0;
      toast.success(`Movidos: ${moved}. Omitidos: ${skipped}. Conflictos: ${confs}.`, { position: 'bottom-right' });
      await reloadResource();
    } catch (e: any) {
      toast.error(e?.message || 'Error en bulk move', { position: 'bottom-right' });
    }
  };

  const handleTransferAuthorship = async (chapterId: number, toOrganizationId: number) => {
    if (!confirm('¿Transferir la autoría de este capítulo? Esta acción es destructiva.')) return;
    if (!confirm('Confirma de nuevo: la autoría pasará a otra org y futuras detaches se basarán en eso.')) return;
    try {
      await callAPI(`/api/joint/${resourceSlug}/chapters/${chapterId}/transfer-authorship`, {
        method: 'POST',
        body: JSON.stringify({ toOrganizationId }),
      });
      toast.success('Autoría transferida', { position: 'bottom-right' });
      await reloadResource();
    } catch (e: any) {
      toast.error(e?.message || 'Error al transferir autoría', { position: 'bottom-right' });
    }
  };

  const toggleWorkedBy = (orgId: number) => {
    setWorkedByIds(prev => prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]);
  };

  const handleUpdateChapterDate = async (chapter: any, newDate: string | null, isUnreleased: boolean) => {
    setUpdatingChapterDate(chapter.id);
    
    try {
      // Build request body following the same rules as handleSaveChapter and backend controller
      const requestBody: any = {};

      // Only send isUnreleased if it's being changed
      const isUnreleasedChanged = chapter.isUnreleased !== isUnreleased;
      
      if (isUnreleasedChanged) {
        requestBody.isUnreleased = isUnreleased;
        
        // Apply the same logic as backend controller
        if (isUnreleased === true) {
          // Si isUnreleased es true, releasedAt debe ser null
          requestBody.releasedAt = null;
        } else {
          // Si isUnreleased cambia de true a false
          if (newDate) {
            // Si hay fecha nueva, convertir a UTC
            requestBody.releasedAt = localDatetimeStringToUTC(newDate);
          } else {
            // Si no hay fecha, usar fecha actual (backend lo hará, pero lo enviamos para consistencia)
            requestBody.releasedAt = new Date().toISOString();
          }
        }
      } else if (newDate !== null) {
        // Si solo se actualiza la fecha (sin cambiar isUnreleased)
        // Solo actualizar si isUnreleased no es true
        if (!chapter.isUnreleased) {
          requestBody.releasedAt = localDatetimeStringToUTC(newDate);
        }
      }

      // Only make request if there's something to update
      if (Object.keys(requestBody).length === 0) {
        setUpdatingChapterDate(null);
        return;
      }

      const response = await callAPI(
        chapterUrl(chapter.number),
        {
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        }
      );

      if (response?.status || response) {
        toast.success('Fecha del capítulo actualizada', {
          position: "bottom-right"
        });
        // Update local chapters state
        setChapters((prevChapters) =>
          prevChapters.map((ch: any) =>
            ch.id === chapter.id
              ? {
                  ...ch,
                  releasedAt: isUnreleased 
                    ? null 
                    : (newDate 
                        ? localDatetimeStringToUTC(newDate) 
                        : (isUnreleasedChanged && chapter.isUnreleased === true 
                            ? new Date().toISOString() 
                            : ch.releasedAt)),
                  isUnreleased: isUnreleasedChanged ? isUnreleased : ch.isUnreleased,
                }
              : ch
          )
        );
      }
    } catch (error: any) {
      toast.error(error?.message || 'Error al actualizar la fecha del capítulo', {
        position: "bottom-right"
      });
    } finally {
      setUpdatingChapterDate(null);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-zinc-950">
      
      {/* Banner */}
      <div className="relative h-56 md:h-72 w-full overflow-hidden group">
        <img 
          src={formData.banner || 'https://via.placeholder.com/1200x400'} 
          className="w-full h-full object-cover opacity-20" 
          alt="Banner" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <button 
          onClick={() => bannerRef.current?.click()} 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md text-white p-4 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-cyan-500 hover:text-zinc-950 z-20"
        >
          <Camera size={24} />
        </button>
        <input 
          type="file" 
          ref={bannerRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleBannerUpload}
        />

        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-8 flex items-end gap-6 pb-6">
          <div className="relative w-28 h-40 md:w-36 md:h-52 rounded-2xl overflow-hidden border-4 border-zinc-950 shadow-2xl bg-zinc-900 shrink-0 group/cover">
            <img 
              src={formData.cover || 'https://via.placeholder.com/400x600'} 
              className="w-full h-full object-cover" 
              alt="Cover" 
            />
            <button 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = handleCoverUpload;
                input.click();
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md text-white opacity-0 group-hover/cover:opacity-100 transition-all flex items-center justify-center"
            >
              <Camera size={24} />
            </button>
          </div>
          <div className="flex-1 pb-4">
            <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
              {formData.title || mangaCustom?.title || 'Sin título'}
            </h1>
            <div className="flex items-center gap-4 mt-3">
            <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-1.5">
              {isJointMode ? <><Users size={12} /> Joint · Editor</> : <><Settings2 size={12} /> Editor de Capítulos</>}
            </p>
              <span className="text-zinc-700">•</span>
              <a
                href={isJointMode ? `/joint/manga/${resourceSlug}` : `/${organizationSlug}/manga/${resourceSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-cyan-500 text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5"
              >
                <BookOpen size={12} /> {isJointMode ? 'Ver joint' : 'Ir al manga'}
              </a>
              {isJointMode && myMember && (
                <>
                  <span className="text-zinc-700">•</span>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    isLeader ? 'bg-yellow-500/20 text-yellow-400'
                    : myMember.role === 'UPLOADER' ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {isLeader ? '★ Líder' : myMember.role === 'UPLOADER' ? 'Uploader' : 'Viewer'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* Active-joint notice: base manga has a joint → chapter uploads must go through the joint admin */}
        {activeJoint && (
          <div className="mb-8 flex items-center gap-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl px-6 py-4">
            <Users size={20} className="text-cyan-400 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="text-white font-bold">
                Este manga es parte del joint <span className="text-cyan-400">{activeJoint.title}</span>
              </p>
              <p className="text-zinc-400 text-xs mt-0.5">
                Los capítulos deben subirse desde el admin del joint para que lleguen a todos los scans participantes.
              </p>
            </div>
            <a
              href={`/${organizationSlug}/admin/joints/${activeJoint.slug}`}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-black py-2 px-5 rounded-xl text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap"
            >
              Ir al joint →
            </a>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl w-fit mb-10">
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-zinc-800 text-cyan-400 shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            <Settings2 size={14} /> Información
          </button>
          {isJointMode && (
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'members' ? 'bg-zinc-800 text-cyan-400 shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              <Users size={14} /> Miembros
            </button>
          )}
          <button
            onClick={() => setActiveTab('chapters')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'chapters' ? 'bg-zinc-800 text-cyan-400 shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            <List size={14} /> Capítulos
          </button>
          {(!isJointMode || canUpload) && (
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'upload' ? 'bg-cyan-500 text-zinc-950 shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              <UploadCloud size={14} /> {isEditingChapter ? 'Editar Capítulo' : 'Subir Capítulo'}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
          
          {activeTab === 'upload' && (
            <div className="space-y-8">
              {/* Context Header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500 border border-cyan-500/20">
                  <Plus size={20} />
                </div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  {isEditingChapter ? 'Editar' : 'Subir'} capítulo de <span className="text-cyan-500">{formData.title || mangaCustom?.title}</span>
                </h2>
              </div>

              <div className="grid lg:grid-cols-12 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-8 space-y-8">
                  
                  {/* PÁGINAS / CONTENIDO (writing chapters use NovelEditor instead of pages) */}
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 space-y-6">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Layers size={16} className="text-cyan-500" /> {isWriting ? 'Contenido' : 'Páginas'}
                      </h3>
                      <div className="flex items-center gap-3">
                        {isWriting && (
                          <>
                            <input
                              ref={epubInputRef}
                              type="file"
                              accept=".epub,application/epub+zip"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleEpubImport(f);
                                e.target.value = '';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => epubInputRef.current?.click()}
                              disabled={epubImporting}
                              className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                            >
                              {epubImporting ? 'Importando...' : 'Importar EPUB'}
                            </button>
                          </>
                        )}
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{isWriting ? 'Markdown · texto' : 'Máximo 25MB por archivo'}</span>
                      </div>
                    </div>

                    {isWriting ? (
                      <NovelEditor value={bodyMarkdown} onChange={setBodyMarkdown} />
                    ) : (<>
                    {/* MultiImageDropzone */}
                    <MultiImageDropzone
                      onDrop={handlePagesUpload}
                      label="Arrastra y suelta imágenes aquí o haz clic para seleccionar"
                      maxFileSize={25 * 1024 * 1024}
                      maxFiles={100}
                    />
                    
                    {/* Maquetación con Max Height */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 space-y-4 flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-500">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Maquetación de Páginas</h3>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Doble página por defecto (Arrastra para fusionar)</p>
                  </div>
                </div>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 gap-2">
                  <button 
                    onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} 
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-[10px] font-black text-white min-w-[30px] text-center">{zoomLevel}%</span>
                  <button 
                    onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} 
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <div className="w-px h-4 bg-zinc-800 mx-1" />
                  <button 
                    onClick={() => setShowMinimap(!showMinimap)} 
                    className={`p-1 transition-colors ${showMinimap ? 'text-cyan-500' : 'text-zinc-600'}`}
                  >
                    <MapIcon size={16} />
                  </button>
                </div>
              </div>

              <div className="relative flex gap-4 flex-1 min-h-0">
                <div 
                  ref={scrollContainerRef} 
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-y-auto custom-scrollbar p-6"
                >
                  {pages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-zinc-500">
                      <UploadCloud size={48} className="mb-4 opacity-50" />
                      <p className="text-sm font-bold uppercase tracking-wider">No hay páginas cargadas</p>
                      <p className="text-xs mt-2">Arrastra imágenes o haz clic en el área de arriba</p>
                    </div>
                  ) : (
                    <div 
                      className="spreads-container flex flex-col items-center gap-12 mx-auto transition-all duration-300" 
                      style={{ width: `${zoomLevel}%` }}
                    >
                      {(() => {
                        // Lógica de agrupación igual que en el Reader
                        // Si una página está marcada como individual (isPageSingle), se muestra sola
                        // Si no, intenta agruparse con la siguiente si tampoco es individual
                        const pageGroups: Array<number[]> = [];
                        const processedIndices = new Set<number>();
                        
                        for (let i = 0; i < pages.length; i++) {
                          if (processedIndices.has(i)) continue;
                          
                          if (isPageSingle(i)) {
                            // Página marcada como individual - mostrar sola
                            pageGroups.push([i]);
                            processedIndices.add(i);
                          } else {
                            // Página no individual - intentar agrupar con la siguiente
                            const nextIndex = i + 1;
                            if (nextIndex < pages.length && !isPageSingle(nextIndex)) {
                              // Ambas páginas pueden agruparse
                              pageGroups.push([i, nextIndex]);
                              processedIndices.add(i);
                              processedIndices.add(nextIndex);
                            } else {
                              // No hay siguiente o la siguiente es individual - mostrar sola
                              pageGroups.push([i]);
                              processedIndices.add(i);
                            }
                          }
                        }
                        
                        return pageGroups.map((group, groupIdx) => {
                          // Para mangas: invertir el orden cuando hay 2 páginas (página 2 a la izquierda, página 1 a la derecha)
                          const displayGroup = group.length === 2 ? [group[1], group[0]] : group;
                          
                          // Usar una key más estable basada en los índices de las páginas
                          const groupKey = `group-${group.join('-')}`;
                          
                          return (
                            <div 
                              key={groupKey}
                              className={`flex gap-6 ${group.length === 1 ? 'justify-center' : 'justify-center'} items-start w-full`}
                            >
                              {displayGroup.map((pageIdx) => (
                              <div 
                                key={pageIdx} 
                                id={`preview-page-${pageIdx}`}
                                draggable
                                onDragStart={handleDrag}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onDragEnd={handleDragEnd}
                                className={`relative group/page transition-all ${group.length === 1 ? 'w-full max-w-2xl' : 'w-full max-w-sm'} ${dragId === `preview-page-${pageIdx}` ? 'opacity-30 scale-95 blur-sm' : ''}`}
                              >
                                {/* Contenedor individual de cada página */}
                                <div className="p-3 bg-zinc-900/40 border border-white/5 rounded-2xl shadow-2xl relative overflow-hidden aspect-[2/3] max-h-[40rem]">
                                  <img 
                                    id={`preview-page-image-${pageIdx}`}
                                    draggable={true}
                                    onDragStart={handleDrag}
                                    onDragEnd={handleDragEnd}
                                    src={getPageUrl(pages[pageIdx])}
                                    className="w-full h-full object-contain cursor-move rounded-lg bg-zinc-950"
                                    alt={`Página ${pageIdx + 1}`}
                                  />

                                  {/* Reordenar (siempre visible): el arrastre no
                                      funciona con el dedo en la app, así que estos
                                      botones permiten mover la página al tocar. */}
                                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-full px-1.5 py-1 border border-white/10">
                                    <button
                                      type="button"
                                      aria-label="Mover antes"
                                      title="Mover antes"
                                      disabled={pageIdx === 0}
                                      onClick={(e) => { e.stopPropagation(); movePage(pageIdx, -1); }}
                                      className="p-1 rounded-full text-white disabled:opacity-30 hover:bg-white/10 active:scale-95"
                                    >
                                      <ChevronLeft size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      aria-label="Mover después"
                                      title="Mover después"
                                      disabled={pageIdx === pages.length - 1}
                                      onClick={(e) => { e.stopPropagation(); movePage(pageIdx, 1); }}
                                      className="p-1 rounded-full text-white disabled:opacity-30 hover:bg-white/10 active:scale-95"
                                    >
                                      <ChevronRight size={16} />
                                    </button>
                                  </div>
                                  
                                  {/* Numeración y nombre del archivo */}
                                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10">
                                    <div className="px-3 py-1 bg-black/70 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black text-white shadow-lg">
                                      PÁGINA {pageIdx + 1}
                                    </div>
                                    <div className="px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[8px] font-medium text-zinc-300 shadow-md max-w-[200px] truncate">
                                      {getPageFileName(pages[pageIdx])}
                                    </div>
                                  </div>
                                  
                                  {/* CONTROLES INTERNOS (DENTRO DEL HOVER) - Por página individual */}
                                  <div className="absolute inset-0 z-20 opacity-0 group-hover/page:opacity-100 transition-all pointer-events-none flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-[2px]">
                                    <div className="flex items-center gap-3 pointer-events-auto">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          togglePageType(pageIdx);
                                        }}
                                        className={`p-4 rounded-2xl border transition-all shadow-xl hover:scale-110 active:scale-95 ${
                                          isPageSingle(pageIdx)
                                            ? 'bg-cyan-500 border-cyan-400 text-zinc-950'
                                            : 'bg-zinc-800/90 border-white/10 text-white hover:bg-zinc-700'
                                        }`}
                                        title={isPageSingle(pageIdx) ? "Mostrar como doble página" : "Mostrar como página sola"}
                                      >
                                        <Layers size={24} />
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removePage(pageIdx);
                                        }}
                                        className="p-4 bg-red-500/90 border border-red-400/20 rounded-2xl text-white hover:bg-red-600 transition-all shadow-xl hover:scale-110 active:scale-95"
                                        title="Eliminar"
                                      >
                                        <Trash2 size={24} />
                                      </button>
                                    </div>
                                    <div className="p-4 bg-white/10 border border-white/10 rounded-2xl text-white/50 cursor-grab active:cursor-grabbing pointer-events-auto hover:text-white transition-colors">
                                      <GripVertical size={28} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            </div>
                          );
                        })
                      })()}
                    </div>
                  )}
                </div>

                {/* MINIMAPA */}
                {showMinimap && pages.length > 0 && (
                  <div 
                    ref={minimapContainerRef} 
                    className="w-24 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col overflow-y-auto custom-scrollbar p-2 gap-2 shrink-0 animate-in slide-in-from-right-2 duration-300"
                  >
                    {(() => {
                      // Lógica de agrupación igual que en la vista principal
                      const pageGroups: Array<number[]> = [];
                      const processedIndices = new Set<number>();
                      
                      for (let i = 0; i < pages.length; i++) {
                        if (processedIndices.has(i)) continue;
                        
                        if (isPageSingle(i)) {
                          // Página marcada como individual - mostrar sola
                          pageGroups.push([i]);
                          processedIndices.add(i);
                        } else {
                          // Página no individual - intentar agrupar con la siguiente
                          const nextIndex = i + 1;
                          if (nextIndex < pages.length && !isPageSingle(nextIndex)) {
                            // Ambas páginas pueden agruparse
                            pageGroups.push([i, nextIndex]);
                            processedIndices.add(i);
                            processedIndices.add(nextIndex);
                          } else {
                            // No hay siguiente o la siguiente es individual - mostrar sola
                            pageGroups.push([i]);
                            processedIndices.add(i);
                          }
                        }
                      }
                      
                      return pageGroups.map((group, groupIdx) => {
                        // Para mangas: invertir el orden cuando hay 2 páginas (página 2 a la izquierda, página 1 a la derecha)
                        const displayGroup = group.length === 2 ? [group[1], group[0]] : group;
                        
                        // Usar una key más estable basada en los índices de las páginas
                        const groupKey = `mini-group-${group.join('-')}`;
                        
                        return (
                          <div
                            key={groupKey}
                            className={`flex gap-1 ${group.length === 1 ? 'justify-center' : 'justify-center'} items-start w-full`}
                          >
                            {displayGroup.map((pageIdx) => (
                            <div
                              key={`mini-${pageIdx}`}
                              id={`preview-page-mini-${pageIdx}`}
                              draggable
                              onDragStart={handleDrag}
                              onDragOver={handleDragOver}
                              onDrop={handleDrop}
                              onClick={() => {
                                // Scroll a la página correspondiente
                                const container = scrollContainerRef.current;
                                const pageElement = container?.querySelector(`#preview-page-${pageIdx}`);
                                if (pageElement) {
                                  pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              className={`relative rounded-lg overflow-hidden border transition-all cursor-pointer group/mini shrink-0 aspect-[2/3] ${group.length === 1 ? 'w-full' : 'flex-1'} ${dragId === `preview-page-${pageIdx}` ? 'opacity-30 border-cyan-500 scale-90' : 'border-zinc-800 hover:border-cyan-500/50'}`}
                            >
                              <img 
                                src={getPageUrl(pages[pageIdx])} 
                                className="w-full h-full object-cover opacity-60" 
                                alt={`Página ${pageIdx + 1}`}
                              />
                              <div className="absolute inset-0 bg-black/20 group-hover/mini:bg-transparent transition-colors" />
                              <span className="absolute bottom-1 right-1 text-[8px] font-black text-white bg-black/60 px-1 rounded">
                                {pageIdx + 1}
                              </span>
                            </div>
                          ))}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
                    </div>
                  </>)}
                  </div>
                </div>

                {/* Settings Column */}
                <div className="lg:col-span-4 space-y-8">
                  
                  {/* OPCIONES */}
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 space-y-8 shadow-xl">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-4">
                      <Settings2 size={16} className="text-cyan-500" /> Opciones
                    </h3>

                    {/* Número y Título del capítulo */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Número del capítulo</label>
                        <input
                          type="text"
                          value={newChapter.number}
                          onChange={(e) => setNewChapter((prev) => ({ ...prev, number: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:border-cyan-500 outline-none"
                          placeholder="23"
                        />
                        {!isEditingChapter && isContinuingOld && (
                          <p className="text-[10px] text-zinc-500 ml-1 leading-relaxed">
                            Continuando desde el cap. {Math.floor(lastUploadedNumberRef.current as number)} que acabas de subir. El último del proyecto es el {maxChapterNumber}.{' '}
                            <button
                              type="button"
                              onClick={() => {
                                lastUploadedNumberRef.current = null;
                                setNewChapter((prev) => ({ ...prev, number: String(Math.floor(maxChapterNumber) + 1), title: `Capítulo ${Math.floor(maxChapterNumber) + 1}` }));
                              }}
                              className="text-cyan-400 hover:text-cyan-300 font-black"
                            >
                              Usar {Math.floor(maxChapterNumber) + 1}
                            </button>
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">N.º de volumen (opcional)</label>
                        <input
                          type="number"
                          min={1}
                          value={newChapter.volumeNumber}
                          onChange={(e) => setNewChapter((prev) => ({ ...prev, volumeNumber: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:border-cyan-500 outline-none"
                          placeholder="Ej. 3"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título del capítulo</label>
                        <input
                          type="text"
                          value={newChapter.title}
                          onChange={(e) => setNewChapter((prev) => ({ ...prev, title: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:border-cyan-500 outline-none" 
                          placeholder="Capítulo 23"
                        />
                      </div>
                      
                      {/* Miniatura del capítulo */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Miniatura del capítulo (Opcional)</label>
                        <div 
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e: any) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNewChapter((prev) => ({ ...prev, thumbnail: file }));
                              }
                            };
                            input.click();
                          }}
                          className="relative aspect-video bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center transition-all hover:border-cyan-500/50 group cursor-pointer overflow-hidden"
                        >
                          {newChapter.thumbnail && !(newChapter.thumbnail instanceof File) ? (
                            <img src={newChapter.thumbnail} className="w-full h-full object-cover" alt="Thumbnail" />
                          ) : newChapter.thumbnail instanceof File ? (
                            <img src={URL.createObjectURL(newChapter.thumbnail)} className="w-full h-full object-cover" alt="Thumbnail preview" />
                          ) : (
                            <div className="flex flex-col items-center text-center px-4">
                              <ImageIcon size={32} className="text-zinc-600 mb-2" />
                              <span className="text-white font-black text-[10px] uppercase tracking-widest">Haz clic para subir miniatura</span>
                              <span className="text-zinc-600 text-[9px] mt-1 font-bold">Máximo 25MB</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera size={24} className="text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Release Date */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Calendar size={12} /> Fecha de salida
                      </label>
                      <DateTimePicker
                        value={newChapter.releaseDate}
                        onChange={(value) => setNewChapter((prev) => ({ ...prev, releaseDate: value || '' }))}
                        disabled={newChapter.isUnreleased}
                        showTime={true}
                      />
                      <div className="flex gap-2 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                        <Info size={14} className="text-cyan-500 shrink-0 mt-0.5" />
                        <p className="text-[9px] text-zinc-500 font-medium leading-snug">
                          {newChapter.isUnreleased 
                            ? "Este capítulo está bloqueado para lectura anticipada, por lo que no tiene fecha de salida. Solo los suscriptores exclusivos y los suscriptores con acceso anticipado del manga pueden leerlo."
                            : "Solo los suscriptores podrán leer este capítulo antes de la fecha de salida, pasado este tiempo, cualquier usuario podrá leerlo"}
                        </p>
                      </div>
                    </div>

                    {/* Blocked for Unreleased */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest">
                        <input
                          type="checkbox"
                          checked={newChapter.isUnreleased}
                          onChange={(e) => {
                            const isUnreleased = e.target.checked;
                            setNewChapter((prev) => ({
                              ...prev,
                              isUnreleased,
                              // Si se marca isUnreleased, releasedAt debe ser null
                              // Si se desmarca, releasedAt debe ser la fecha actual en formato local
                              releaseDate: isUnreleased ? '' : getCurrentLocalDatetimeString()
                            }));
                          }}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-zinc-950"
                        />
                        Bloqueado para lectura anticipada
                      </label>
                      <div className="flex gap-2 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                        <Info size={14} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-[9px] text-zinc-500 font-medium leading-snug">
                          Si está activado, este capítulo solo podrá ser leído por los suscriptores exclusivos y los suscriptores con acceso anticipado del manga. No tendrá fecha de salida y permanecerá bloqueado hasta que se desactive esta opción.
                        </p>
                      </div>
                    </div>

                    {/* Worked by — joint only */}
                    {isJointMode && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Trabajado por</label>
                        <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
                          Marca qué scans del joint participaron en este capítulo.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {jointMembers.filter((m: any) => m.status === 'ACCEPTED').map((m: any) => (
                            <button
                              key={m.organization.id}
                              type="button"
                              onClick={() => toggleWorkedBy(m.organization.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                                workedByIds.includes(m.organization.id)
                                  ? 'bg-cyan-500 text-black'
                                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                              }`}
                            >
                              {m.organization.logoUrl && (
                                <img src={m.organization.logoUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                              )}
                              {m.organization.name}
                              {workedByIds.includes(m.organization.id) && <Check size={12} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-6 space-y-3 border-t border-zinc-800">
                      <button
                        onClick={handleSaveChapter}
                        disabled={loading || !newChapter.number || (!isWriting && pages.length === 0)}
                        className="w-full py-4 bg-cyan-500 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-cyan-500/10 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 size={18} /> {loading ? 'Guardando...' : isEditingChapter ? 'Actualizar capítulo' : 'Guardar capítulo'}
                      </button>
                      <button 
                        onClick={() => {
                          setNewChapter({
                            number: '',
                            title: '',
                            releaseDate: '',
                            thumbnail: null,
                            isUnreleased: false,
                            volumeNumber: '',
                          });
                          setPages([]);
                          setSinglePageIndexes([]);
                          setIsEditingChapter(false);
                          setEditingChapterNumber(null);
                          setActiveTab('chapters');
                        }}
                        className="w-full py-4 bg-transparent text-zinc-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white border border-transparent hover:border-zinc-800 transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Miembros tab (joint only) ── */}
          {isJointMode && activeTab === 'members' && (
            <div className="space-y-6 max-w-5xl">
              {canInviteJoint && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Plus size={14} className="text-cyan-500" /> Invitar scan
                  </h3>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={inviteSearch}
                        onChange={e => { setInviteSearch(e.target.value); setInviteSlug(''); setInviteOpen(true); }}
                        onFocus={() => { if (inviteResults.length) setInviteOpen(true); }}
                        onBlur={() => setTimeout(() => setInviteOpen(false), 150)}
                        placeholder="Busca el scan por nombre…"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-5 text-white text-sm focus:border-cyan-500 transition-all outline-none"
                      />
                      {inviteOpen && (inviteSearching || inviteResults.length > 0 || inviteSearch.trim()) && (
                        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl">
                          {inviteSearching && inviteResults.length === 0 && (
                            <div className="px-4 py-3 text-xs text-zinc-500">Buscando…</div>
                          )}
                          {inviteResults.map((s: any) => {
                            const slug = s.slug || s.id || (s.url || '').replace('/', '');
                            return (
                              <button
                                key={slug}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setInviteSlug(slug); setInviteSearch(s.name || slug); setInviteOpen(false); setInviteResults([]); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-zinc-800 transition-colors"
                              >
                                {s.logoUrl && <img src={s.logoUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />}
                                <span className="text-sm text-white truncate">{s.name || slug}</span>
                                <span className="ml-auto text-[10px] text-zinc-500 truncate">/{slug}</span>
                              </button>
                            );
                          })}
                          {!inviteSearching && inviteResults.length === 0 && inviteSearch.trim() && (
                            <div className="px-4 py-3 text-xs text-zinc-500">Sin resultados</div>
                          )}
                        </div>
                      )}
                    </div>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value as 'UPLOADER' | 'VIEWER')}
                      className="bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-4 text-white text-sm focus:border-cyan-500 outline-none"
                    >
                      <option value="UPLOADER">Uploader</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                    <button
                      onClick={handleInviteMember}
                      disabled={inviting || !inviteSlug}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 px-6 rounded-2xl text-[10px] uppercase tracking-widest disabled:opacity-50 whitespace-nowrap"
                    >
                      {inviting ? '...' : 'Invitar'}
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Miembros del Joint</h3>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1 block">
                      {jointMembers.length} escáneres
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {myMember && myMember.status === 'ACCEPTED' && (
                      <button
                        onClick={handleLeaveJoint}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-black py-2 px-5 rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2"
                      >
                        Salir del joint
                      </button>
                    )}
                    {isLeader && (
                      <button
                        onClick={handleDissolveJoint}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black py-2 px-5 rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2"
                      >
                        <Trash2 size={12} /> Disolver joint
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950/50 border-b border-zinc-800">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Scan</th>
                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-28">Rol</th>
                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-28">Estado</th>
                        {isLeader && <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right w-32">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {jointMembers.map((m: any) => (
                        <tr key={m.id} className="hover:bg-zinc-800/20 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              {m.organization.logoUrl ? (
                                <img
                                  src={m.organization.logoUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e: any) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-zinc-800" />
                              )}
                              <div>
                                <p className="text-white font-bold text-sm">{m.organization.name}</p>
                                <p className="text-zinc-500 text-xs">{m.organization.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                              m.role === 'LEADER' ? 'bg-yellow-500/20 text-yellow-400'
                                : m.role === 'UPLOADER' ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-zinc-700 text-zinc-400'
                            }`}>
                              {m.role === 'LEADER' ? '★ Líder' : m.role}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                              m.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-400'
                                : m.status === 'INVITED' ? 'bg-yellow-500/10 text-yellow-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {m.status === 'ACCEPTED' ? 'Activo' : m.status === 'INVITED' ? 'Invitado' : 'Expulsado'}
                            </span>
                          </td>
                          {isLeader && (
                            <td className="px-8 py-5 text-right">
                              {m.organization.id !== organization?.id && m.role !== 'LEADER' && m.status === 'ACCEPTED' && (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleTransferLeadership(m.organization.slug)}
                                    title="Transferir liderazgo"
                                    className="p-2 bg-zinc-950 text-zinc-500 hover:text-yellow-400 border border-zinc-800 rounded-lg transition-all"
                                  >
                                    <ArrowRight size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleExpelMember(m.organization.slug)}
                                    title="Expulsar"
                                    className="p-2 bg-zinc-950 text-zinc-500 hover:text-red-400 border border-zinc-800 rounded-lg transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* "Mis capítulos en este joint" — uploader's view per chapter */}
              {myMember && organization && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Mis capítulos en este joint</h3>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                        Solo capítulos uploaded por tu scan ({organization.name})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const ids = (chapters || [])
                            .filter((c: any) => (c.uploadedByOrganization?.id ?? c.uploadedByOrganizationId) === organization?.id && c.source === 'solo')
                            .map((c: any) => c.id);
                          handleBulkMove('promote', ids);
                        }}
                        className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-black py-2 px-4 rounded-xl text-[10px] uppercase tracking-widest"
                      >
                        Mover TODOS los míos al joint
                      </button>
                      <button
                        onClick={() => {
                          const ids = (chapters || [])
                            .filter((c: any) => (c.uploadedByOrganization?.id ?? c.uploadedByOrganizationId) === organization?.id && c.source === 'joint')
                            .map((c: any) => c.id);
                          handleBulkMove('demote', ids);
                        }}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-black py-2 px-4 rounded-xl text-[10px] uppercase tracking-widest"
                      >
                        Mover TODOS los míos al solo
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-950/50 border-b border-zinc-800">
                        <tr>
                          <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-16">N°</th>
                          <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Título</th>
                          <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-24">Anchor</th>
                          <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right w-72">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {(chapters || [])
                          .filter((c: any) => (c.uploadedByOrganization?.id ?? c.uploadedByOrganizationId) === organization?.id)
                          .sort((a: any, b: any) => (b.number || 0) - (a.number || 0))
                          .map((c: any) => (
                            <tr key={c.id} className="hover:bg-zinc-800/20">
                              <td className="px-4 py-3 text-cyan-500 font-black">#{c.number}</td>
                              <td className="px-4 py-3 text-white">{c.title || `Capítulo ${c.number}`}</td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                  c.source === 'joint' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-700 text-zinc-400'
                                }`}>
                                  {c.source === 'joint' ? 'JOINT' : 'SOLO'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {c.source === 'solo' && (
                                    <button
                                      onClick={() => handlePromoteChapter(c.id)}
                                      className="px-3 py-1.5 bg-zinc-950 text-cyan-400 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                                    >
                                      Mover al joint →
                                    </button>
                                  )}
                                  {c.source === 'joint' && (
                                    <>
                                      <button
                                        onClick={() => handleDemoteChapter(c.id)}
                                        className="px-3 py-1.5 bg-zinc-950 text-amber-400 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                                      >
                                        ← Mover al solo
                                      </button>
                                      <select
                                        defaultValue=""
                                        onChange={(e) => {
                                          const v = parseInt(e.target.value);
                                          if (v) handleTransferAuthorship(c.id, v);
                                          e.currentTarget.value = '';
                                        }}
                                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-zinc-400"
                                        title="Transferir autoría"
                                      >
                                        <option value="">Transferir autoría…</option>
                                        {jointMembers
                                          .filter((m: any) => m.status === 'ACCEPTED' && m.organization.id !== organization?.id)
                                          .map((m: any) => (
                                            <option key={m.organization.id} value={m.organization.id}>
                                              {m.organization.name}
                                            </option>
                                          ))}
                                      </select>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 md:p-10 space-y-8">
                  {/* Título */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-xl font-black italic tracking-tighter uppercase focus:border-cyan-500 transition-all outline-none"
                      placeholder="One Punch-Man"
                    />
                  </div>

                  {/* Título alternativo / original */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título alternativo / original (Opcional)</label>
                    <input
                      type="text"
                      value={formData.alternativeTitle}
                      onChange={(e) => setFormData((prev) => ({ ...prev, alternativeTitle: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-6 text-white text-base font-semibold italic focus:border-cyan-500 transition-all outline-none"
                      placeholder="One Punch Man / ワンパンマン"
                    />
                    <p className="text-[10px] text-zinc-600 ml-1">Nombre original o alterno (p. ej. en japonés/romaji). Aparece debajo del título en la ficha y ayuda a que se encuentre en Google.</p>
                  </div>

                  {/* Descripción corta */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                        Descripción corta (Opcional)
                      </label>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${(formData.shortDescription?.length || 0) > 300 ? 'text-red-500' : 'text-zinc-600'}`}>
                        {(formData.shortDescription?.length || 0)}/300 caracteres
                      </span>
                    </div>
                    <textarea 
                      rows={3}
                      value={formData.shortDescription}
                      onChange={(e) => {
                        if (e.target.value.length <= 300) {
                          setFormData((prev) => ({ ...prev, shortDescription: e.target.value }));
                        }
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm leading-relaxed focus:border-cyan-500 transition-all outline-none resize-none"
                      placeholder="Saitama es un superhéroe tan fuerte que derrota a cualquier clase de monstruo de un puñetazo..."
                    />
                  </div>

                  {/* Sinopsis */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Sinopsis (Opcional)</label>
                    <textarea 
                      rows={6}
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl py-4 px-6 text-white text-sm leading-relaxed focus:border-cyan-500 transition-all outline-none resize-none"
                      placeholder="La historia tiene lugar en una de las metrópolis de ficción de la Tierra, la Ciudad-Z..."
                    />
                  </div>

                  {/* Géneros — el joint tiene su propia lista de géneros */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Géneros</label>
                    <GenreCategoryPicker
                      options={genres as any}
                      value={formData.genres as any}
                      onChange={(next) => setFormData((prev) => ({ ...prev, genres: next as any[] }))}
                      showNsfw={true}
                    />
                  </div>

                  {/* Suscripciones — solo manga */}
                  {!isJointMode && (
                  <>

                  {/* Suscripciones con Acceso Anticipado */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Suscripciones con Acceso Anticipado</label>
                    <p className="text-[9px] text-zinc-500 font-medium leading-relaxed ml-1">
                      Selecciona los planes de suscripción que podrán leer capítulos antes de su fecha de publicación. Si está vacío, nadie podrá leer los capítulos antes de la fecha de publicación.
                    </p>
                    <Autocomplete
                      multiple
                      options={subscriptionPlans || []}
                      value={formData.subscriptionPlansCanReadUnreleased || []}
                      onChange={(_, newValue) => setFormData((prev) => ({ ...prev, subscriptionPlansCanReadUnreleased: (newValue as any[]) || [] }))}
                      getOptionLabel={(option: any) => option?.name || option?.title || String(option || '')}
                      isOptionEqualToValue={(option: any, value: any) => option?.id === value?.id}
                      placeholder="Suscripciones con Acceso Anticipado..."
                      label=""
                    />
                  </div>

                  {/* Suscripciones que pueden leer capítulos publicados */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Suscripciones que pueden leer capítulos publicados</label>
                    <p className="text-[9px] text-zinc-500 font-medium leading-relaxed ml-1">
                      Selecciona los planes de suscripción que podrán leer los capítulos después de su fecha de publicación. Si está vacío, todos los usuarios (con o sin suscripción) podrán leer los capítulos después de la fecha de publicación.
                    </p>
                    <Autocomplete
                      multiple
                      options={subscriptionPlans || []}
                      value={formData.subscriptionPlansCanReadReleased || []}
                      onChange={(_, newValue) => setFormData((prev) => ({ ...prev, subscriptionPlansCanReadReleased: (newValue as any[]) || [] }))}
                      getOptionLabel={(option: any) => option?.name || option?.title || String(option || '')}
                      isOptionEqualToValue={(option: any, value: any) => option?.id === value?.id}
                      placeholder="Suscripciones que pueden leer capítulos publicados..."
                      label=""
                    />
                  </div>

                  {/* Texto explicativo dinámico */}
                  {(() => {
                    const explanation = getSubscriptionExplanation();
                    return (
                      <div className={`space-y-2 p-4 bg-zinc-950/50 rounded-xl border ${explanation.isError ? 'border-red-500/50' : 'border-cyan-500/20'}`}>
                        <div className="flex items-start gap-2">
                          <Info size={16} className={`shrink-0 mt-0.5 ${explanation.isError ? 'text-red-500' : 'text-cyan-500'}`} />
                          <div className={`text-xs font-medium leading-relaxed ${explanation.isError ? 'text-red-400' : 'text-cyan-400'}`}>
                            {explanation.content}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  </>
                  )}

                  {/* Estado de la obra */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Estado de la obra</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:border-cyan-500 transition-all outline-none"
                    >
                      <option value="ongoing">En emisión</option>
                      <option value="completed">Completado</option>
                      <option value="hiatus">En pausa</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                  {/* Tipo de lectura — for writings only 'text' makes sense, so we lock it. */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Tipo de lectura</label>
                    <select
                      value={formData.workType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, workType: e.target.value }))}
                      disabled={isWriting}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:border-cyan-500 transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isWriting ? (
                        <option value="text">Texto (lectura continua)</option>
                      ) : (
                        <>
                          <option value="manga">Manga (derecha → izquierda)</option>
                          <option value="manwha">Manwha (scroll vertical)</option>
                          <option value="comic">Comic (izquierda → derecha)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Fecha de salida — manga only */}
                  {!isJointMode && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Calendar size={12} /> Fecha de salida (Opcional)
                    </label>
                    <DateTimePicker
                      value={formData.releasedAt}
                      onChange={(value) => setFormData((prev) => ({ ...prev, releasedAt: value }))}
                      showTime={true}
                    />
                  </div>
                  )}

                  {/* Fecha del próximo capítulo — manga only */}
                  {!isJointMode && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Calendar size={12} /> Fecha del próximo capítulo (Opcional)
                    </label>
                    <DateTimePicker
                      value={formData.nextChapterAt}
                      onChange={(value) => setFormData((prev) => ({ ...prev, nextChapterAt: value }))}
                      showTime={true}
                    />
                  </div>
                  )}

                  {/* Mensaje del próximo capítulo — manga only */}
                  {!isJointMode && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Mensaje del próximo capítulo (Opcional)</label>
                    <input
                      type="text"
                      value={formData.nextChapterAtMessage}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nextChapterAtMessage: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm font-bold focus:border-cyan-500 outline-none"
                      placeholder="Ej: ¡Próximo capítulo el 15 de marzo!"
                    />
                  </div>
                  )}

                  {/* Toggles — manga only (joints don't have these flags) */}
                  {!isJointMode && (
                  <div className="space-y-6 pt-4 border-t border-zinc-800">
                    {/* Simul release */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{isWriting ? 'Novela con simul release' : 'Manga con simul release'}</span>
                        <div 
                          onClick={() => setFormData((prev) => ({ ...prev, isSimulRelease: !formData.isSimulRelease }))}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${formData.isSimulRelease ? 'bg-cyan-500' : 'bg-zinc-800'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isSimulRelease ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
                        Informa a los usuarios que esto se publicará simultáneamente con su lanzamiento de país origen
                      </p>
                    </div>

                    {/* +18 — las novelas +18 viven en el lado /red/writings */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{isWriting ? 'Novela +18' : 'Manga +18'}</span>
                        <div
                          onClick={() => setFormData((prev) => ({ ...prev, isNSFW: !formData.isNSFW }))}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${formData.isNSFW ? 'bg-red-500' : 'bg-zinc-800'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isNSFW ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
                        {isWriting
                          ? 'Si se activa, la novela se marca como +18 y solo se mostrará en el lado /red.'
                          : 'Si se activa, este manga contendrá contenido para adultos y será marcado como +18'}
                      </p>
                    </div>

                    {/* Obra pública / privada (retiro por copyright) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Obra pública</span>
                        <div
                          onClick={() => setFormData((prev: any) => ({ ...prev, isPublic: !prev.isPublic }))}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${formData.isPublic ? 'bg-green-500' : 'bg-amber-500'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isPublic ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
                        Si la desactivas (privada), la obra desaparece del sitio, la búsqueda y el inicio; solo tu equipo la ve y se apagan los anuncios. Úsalo para retirar contenido con copyright sin borrarlo.
                      </p>
                    </div>

                    {/* One-shot */}
                    {!isJointMode && (() => {
                      const chapterCount = (initialResource?.chapters?.length) || 0;
                      const canBeOneShot = formData.isOneShot || chapterCount <= 1;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">One-shot</span>
                            <div
                              onClick={() => canBeOneShot && setFormData((prev: any) => ({ ...prev, isOneShot: !prev.isOneShot }))}
                              className={`w-10 h-5 rounded-full relative transition-colors ${formData.isOneShot ? 'bg-cyan-500' : 'bg-zinc-800'} ${canBeOneShot ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                            >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isOneShot ? 'right-1' : 'left-1'}`} />
                            </div>
                          </div>
                          <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
                            {canBeOneShot
                              ? 'Actívalo si la obra es de un solo capítulo. Al activarlo, no se podrán subir más capítulos.'
                              : 'No disponible: la obra tiene más de un capítulo. Un one-shot solo puede tener uno.'}
                          </p>
                        </div>
                      );
                    })()}

                    {/* Demografía (del manga base) */}
                    {!isJointMode && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Demografía</span>
                      <select
                        value={formData.demographyId ?? ''}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, demographyId: e.target.value ? Number(e.target.value) : null }))}
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">Sin demografía</option>
                        {demographies.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
                        Shōnen, Shōjo, Seinen, Josei o Kodomo. Pertenece al manga base (se comparte entre scans).
                      </p>
                    </div>
                    )}

                    {/* Requiere inicio de sesión */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Requiere inicio de sesión (Opcional)</span>
                        <div
                          onClick={() => setFormData((prev) => ({ ...prev, requireLogin: !formData.requireLogin }))}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${formData.requireLogin ? 'bg-yellow-500' : 'bg-zinc-800'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.requireLogin ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
                        Si se activa, el usuario deberá iniciar sesión para leer este capítulo
                      </p>
                    </div>

                    {/* Ocultar capítulos programados */}
                    <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                      <div>
                        <p className="text-sm font-medium text-white">Ocultar capítulos programados</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Los capítulos con fecha futura no aparecen en listas públicas ni en últimas actualizaciones</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.hideUnreleasedChapters}
                          onChange={(e) => setFormData(prev => ({ ...prev, hideUnreleasedChapters: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                    </div>

                    {/* Agrupar por volumen */}
                    <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                      <div>
                        <p className="text-sm font-medium text-white">Agrupar capítulos por volumen</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Muestra los capítulos agrupados por tomo en la página pública</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.groupChaptersByVolume}
                          onChange={(e) => setFormData(prev => ({ ...prev, groupChaptersByVolume: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>

                    {/* Capítulo final */}
                    <div className="py-3">
                      <p className="text-sm font-medium text-white mb-1">Capítulo final</p>
                      <p className="text-xs text-zinc-400 mb-2">Marca el capítulo donde termina la historia. Los extras y epílogos posteriores pueden seguir subiéndose; puedes mover la marca cuando quieras.</p>
                      <select
                        value={formData.finalChapterNumber ?? ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, finalChapterNumber: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-cyan-500 outline-none"
                      >
                        <option value="">Sin marcar</option>
                        {/* Si hay una marca guardada pero los capítulos aún no cargaron, conserva la opción */}
                        {formData.finalChapterNumber != null && !chapters.some((c: any) => Number(c.number) === formData.finalChapterNumber) && (
                          <option value={formData.finalChapterNumber}>Cap. {formData.finalChapterNumber}</option>
                        )}
                        {[...chapters].sort((a: any, b: any) => Number(b.number) - Number(a.number)).map((c: any) => (
                          <option key={c.id} value={c.number}>Cap. {c.number}{c.title ? ` - ${c.title}` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  )}

                  {/* Save Button */}
                  <div className="pt-6 border-t border-zinc-800">
                    <button
                      onClick={handleSaveInfo}
                      disabled={infoLoading || !formData.title}
                      className="w-full py-4 bg-cyan-500 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-cyan-500/10 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={18} /> {infoLoading ? 'Guardando...' : 'Guardar información'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chapters' && (
            <div className="space-y-6">
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Índice de Capítulos</h3>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1 block">{chapters.length} Episodios Publicados</span>
                  </div>
                </div>
                {chaptersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-zinc-800 border-t-cyan-500 rounded-full animate-spin" />
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">
                    <p className="text-sm font-bold uppercase">No hay capítulos publicados</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-950/50 border-b border-zinc-800">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-32">Miniatura</th>
                          <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-24">N°</th>
                          <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nombre</th>
                          <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-24">Lecturas</th>
                          <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-48">Fecha de salida</th>
                          <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right w-64">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {[...chapters].sort((a, b) => (b.number || 0) - (a.number || 0)).map((ch: any) => (
                          <tr key={ch.id} className="hover:bg-zinc-800/20 transition-colors group">
                            <td className="px-8 py-6">
                              {ch.imageUrl ? (
                                <img
                                  src={ch.imageUrl}
                                  alt={ch.title || `Capítulo ${ch.number}`}
                                  decoding="async"
                                  loading="lazy"
                                  className="max-w-24 max-h-36 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-24 h-36 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 text-xs text-center px-2">
                                  Sin miniatura
                                </div>
                              )}
                            </td>
                            <td className="px-8 py-6 text-cyan-500 font-black italic">#{ch.number}</td>
                            <td className="px-8 py-6 text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{ch.title || `Capítulo ${ch.number}`}</td>
                            <td className="px-8 py-6 text-xs font-bold text-zinc-500">{ch.views?.toLocaleString() || '0'}</td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-2 min-w-[200px]">
                                {/* Checkbox para isUnreleased */}
                                <label className={`flex items-center gap-2 group/checkbox ${updatingChapterDate === ch.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                  <input
                                    type="checkbox"
                                    checked={ch.isUnreleased || false}
                                    disabled={updatingChapterDate === ch.id}
                                    onChange={(e) => {
                                      if (updatingChapterDate === ch.id) return;
                                      const newIsUnreleased = e.target.checked;
                                      // Si se desmarca isUnreleased, usar fecha actual si no hay fecha o si estaba bloqueado
                                      const newDate = newIsUnreleased 
                                        ? null 
                                        : (ch.releasedAt && !ch.isUnreleased 
                                            ? utcToLocalDatetimeString(ch.releasedAt) 
                                            : getCurrentLocalDatetimeString());
                                      handleUpdateChapterDate(ch, newDate, newIsUnreleased);
                                    }}
                                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-zinc-950 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest group-hover/checkbox:text-zinc-300">
                                    Bloqueado para lectura anticipada
                                  </span>
                                </label>
                                
                                {/* DateTimePicker para fecha (solo si no está bloqueado) */}
                                {!ch.isUnreleased && (
                                  <div className="flex items-center gap-2">
                                    <DateTimePicker
                                      value={ch.releasedAt ? utcToLocalDatetimeString(ch.releasedAt) : null}
                                      onChange={(value) => {
                                        if (value && updatingChapterDate !== ch.id && !ch.isUnreleased) {
                                          handleUpdateChapterDate(ch, value, false);
                                        }
                                      }}
                                      disabled={updatingChapterDate === ch.id || ch.isUnreleased}
                                      showTime={true}
                                      className="flex-1"
                                    />
                                  </div>
                                )}
                                
                                {/* Mostrar estado si está bloqueado */}
                                {ch.isUnreleased && (
                                  <span className="text-xs font-bold text-red-500">Bloqueado</span>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditChapter(ch)}
                                  className="p-2 bg-zinc-950 text-zinc-500 hover:text-cyan-400 border border-zinc-800 rounded-lg transition-all"
                                  title="Editar"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDownloadChapter(ch)}
                                  className="p-2 bg-zinc-950 text-zinc-500 hover:text-white border border-zinc-800 rounded-lg transition-all"
                                  title="Descargar"
                                >
                                  <Download size={16} />
                                </button>
                                {!isJointMode && canDeleteChapter && (
                                  <button
                                    onClick={() => setChapterToDelete(ch)}
                                    className="p-2 bg-zinc-950 text-zinc-500 hover:text-red-400 border border-zinc-800 rounded-lg transition-all"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>


            </div>
          )}

        </div>
      </div>

      {/* Zona de peligro: eliminar la ficha del manga (solo con permiso) */}
      {!isJointMode && canDeleteMangaCustom && (
        <div className="mt-10 border border-red-500/20 rounded-[32px] p-8 bg-red-500/[0.03]">
          <h3 className="text-xs font-black text-red-400 uppercase tracking-widest mb-2">Zona de peligro</h3>
          <p className="text-zinc-500 text-sm mb-4">
            Eliminar esta obra la oculta a los lectores junto con sus capítulos (no se borran los archivos). Si está en un joint activo, primero debe salir del joint.
          </p>
          <button
            onClick={() => { setShowDeleteMangaModal(true); setDeleteMangaConfirmText(''); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 font-black text-[10px] uppercase tracking-widest transition-colors"
          >
            <Trash2 size={14} /> Eliminar esta obra
          </button>
        </div>
      )}

      {/* Modal: confirmar borrado de capítulo */}
      {chapterToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4" onClick={() => !deletingChapter && setChapterToDelete(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-white mb-3">Eliminar capítulo</h3>
            <p className="text-zinc-300 text-sm mb-2">
              Cap. {chapterToDelete.number}{chapterToDelete.title ? ` - ${chapterToDelete.title}` : ''}
            </p>
            <p className="text-zinc-500 text-xs mb-5 leading-relaxed">
              El capítulo dejará de ser visible para los lectores. Esta acción la puede revertir soporte, pero no desde este panel.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setChapterToDelete(null)} disabled={deletingChapter} className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Cancelar</button>
              <button onClick={confirmDeleteChapter} disabled={deletingChapter} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-400 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50">
                {deletingChapter && <Loader2 size={14} className="animate-spin" />} Eliminar capítulo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar borrado de la obra (requiere escribir el slug) */}
      {showDeleteMangaModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4" onClick={() => !deletingManga && setShowDeleteMangaModal(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              {mangaCustom?.imageUrl && <img src={mangaCustom.imageUrl} alt="" className="w-12 h-16 object-cover rounded-lg" />}
              <div>
                <h3 className="text-lg font-black text-white">Eliminar obra</h3>
                <p className="text-zinc-500 text-xs">{mangaCustom?.title} · {chapters.length} capítulos</p>
              </div>
            </div>
            <p className="text-zinc-400 text-xs mb-4 leading-relaxed">
              La obra y sus capítulos dejarán de ser visibles para los lectores (no se borran los archivos). Si la obra está en un joint activo, primero debe salir del joint.
            </p>
            <p className="text-zinc-400 text-xs mb-2">Para confirmar, escribe este texto tal cual (o cópialo con el botón):</p>
            <div className="flex items-center gap-2 bg-zinc-950 border border-red-500/30 rounded-xl px-3 py-2.5 mb-2">
              <code className="flex-1 text-red-300 text-sm font-bold break-all select-all">{deleteMangaSlug}</code>
              <button
                type="button"
                onClick={copyDeleteSlug}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 hover:text-white transition-colors active:scale-95"
              >
                Copiar
              </button>
            </div>
            <input
              value={deleteMangaConfirmText}
              onChange={(e) => setDeleteMangaConfirmText(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-red-500 outline-none mb-1"
              placeholder="Escribe o pega aquí el texto de arriba"
              aria-label="Confirmación de borrado"
            />
            <p className={`text-[11px] mb-4 min-h-[16px] ${deleteMangaConfirmText && deleteMangaConfirmText.trim() !== deleteMangaSlug ? 'text-red-400' : 'text-zinc-600'}`}>
              {deleteMangaConfirmText
                ? deleteMangaConfirmText.trim() === deleteMangaSlug
                  ? 'Coincide. Ya puedes eliminar la obra.'
                  : 'Todavía no coincide con el texto de arriba.'
                : 'El botón rojo se habilita cuando el texto coincida.'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowDeleteMangaModal(false)} disabled={deletingManga} className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Cancelar</button>
              <button
                onClick={confirmDeleteManga}
                disabled={deletingManga || !deleteMangaSlug || deleteMangaConfirmText.trim() !== deleteMangaSlug}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-400 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deletingManga && <Loader2 size={14} className="animate-spin" />} Eliminar obra
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}} />
    </div>
  );
};

export default AdminMangaEdit;
