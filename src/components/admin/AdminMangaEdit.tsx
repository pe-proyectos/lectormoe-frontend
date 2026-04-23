import React, { useState, useRef, useEffect } from 'react';
import {
  Save, Plus, Calendar, BookOpen, UploadCloud, Trash2,
  Settings2, Layers, GripVertical, ZoomIn, ZoomOut,
  Map as MapIcon, CheckCircle2,
  Camera, List, Info, Edit3, Download, ImageIcon, Clock, Users,
  ArrowRight, Check,
} from 'lucide-react';
import { callAPI } from '../../util/callApi';
import { getTranslator } from '../../util/translate';
import { toast, ToastContainer } from 'react-toastify';
import { uploadFile } from '../../util/uploadFile';
import Autocomplete from './ui/Autocomplete';
import { AdminChapterDialog } from './AdminChapterDialog';
import { MultiImageDropzone } from './ui/MultiImageDropzone';
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
}

const AdminMangaEdit: React.FC<AdminMangaEditProps> = ({
  language,
  initialMangaCustom,
  joint: initialJoint,
  organization,
  organizationSlug,
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
  const [inviteSlug, setInviteSlug] = useState('');
  const [inviteRole, setInviteRole] = useState<'UPLOADER' | 'VIEWER'>('UPLOADER');
  const [inviting, setInviting] = useState(false);
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
  });
  
  const [pages, setPages] = useState<(File | string)[]>([]);
  const [singlePageIndexes, setSinglePageIndexes] = useState<number[]>([]);

  const [chapters, setChapters] = useState<any[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [editingChapterNumber, setEditingChapterNumber] = useState<number | null>(null);
  const [updatingChapterDate, setUpdatingChapterDate] = useState<number | null>(null); // Chapter ID being updated

  const [genres, setGenres] = useState<any[]>([]);
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

  // Cargar capítulos cuando se cambia al tab de capítulos
  useEffect(() => {
    if (activeTab === 'chapters' && chapters.length === 0) {
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
      });
      setPages([]);
      setSinglePageIndexes([]);
    }
  }, [activeTab]);

  // Update form data when initial resource changes
  useEffect(() => {
    if (initialResource) {
      const releasedAt = utcToLocalDatetimeString(initialResource?.releasedAt);
      const nextChapterAt = utcToLocalDatetimeString(initialResource?.nextChapterAt);

      setFormData({
        title: initialResource?.title || '',
        shortDescription: initialResource?.shortDescription || '',
        description: initialResource?.description || '',
        status: initialResource?.status || 'ongoing',
        releasedAt: releasedAt || null,
        nextChapterAt: nextChapterAt || null,
        nextChapterAtMessage: initialResource?.nextChapterAtMessage || '',
        requireLogin: initialResource?.requireLogin || false,
        isSimulRelease: initialResource?.isSimulRelease || false,
        isNSFW: initialResource?.isNSFW || false,
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
      });
      // Preload the joint worked-by selector from the chapter
      if (isJointMode) {
        setWorkedByIds((chapter.workedByOrganizations || []).map((o: any) => o.id));
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
        shortDescription: formData.shortDescription || null,
        description: formData.description || null,
        status: formData.status,
        workType: formData.workType,
        image: coverKey,
        banner: bannerKey,
      };
      if (!isJointMode) {
        patchBody.mangaCustomId = mangaCustom?.id;
        patchBody.releasedAt = localDatetimeStringToUTC(formData.releasedAt);
        patchBody.nextChapterAt = localDatetimeStringToUTC(formData.nextChapterAt);
        patchBody.nextChapterAtMessage = formData.nextChapterAtMessage || null;
        patchBody.requireLogin = formData.requireLogin;
        patchBody.isSimulRelease = formData.isSimulRelease;
        patchBody.isNSFW = formData.isNSFW;
        patchBody.genreIds = formData.genres.map((g: any) => g.id);
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
    if (!newChapter.number || pages.length === 0) {
      toast.error('Completa el número de capítulo y sube al menos una página');
      return;
    }

    setLoading(true);
    
    // Declarar variables fuera del bloque try
    const pageKeys: string[] = [];
    let imageKey: string | null = null;
    
    try {
      // Contar archivos a subir (páginas + miniatura si es File)
      const pagesToUpload = pages.filter(page => page instanceof File).length;
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
            pages: pageKeys,
            singlePages: singlePageIndexes,
            ...(imageKey ? { image: imageKey } : {}),
            isUnreleased: newChapter.isUnreleased || false,
            ...(isJointMode ? { workedByOrganizationIds: workedByIds } : {}),
          }),
        }
      );

      if (response?.status || response) {
        toast.success(isEdit ? 'Capítulo actualizado exitosamente' : 'Capítulo creado exitosamente', {
          position: "bottom-right"
        });
        // Reset form
        setNewChapter({
          number: '',
          title: '',
          isUnreleased: false,
          releaseDate: '',
          isSubscriberOnly: false,
          thumbnail: null,
        });
        setPages([]);
        setSinglePageIndexes([]);
        setIsEditingChapter(false);
        setEditingChapterNumber(null);
        // Recargar capítulos
        if (activeTab === 'chapters') {
          loadChapters();
        }
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
    if (!confirm('¿Disolver el joint? Esto eliminará todos los capítulos del joint.')) return;
    try {
      await callAPI(`/api/joint/${resourceSlug}`, { method: 'DELETE' });
      toast.success('Joint disuelto', { position: 'bottom-right' });
      window.location.href = `/${organizationSlug}/admin/joints`;
    } catch (e: any) {
      toast.error(e?.message || 'Error al disolver', { position: 'bottom-right' });
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
                  
                  {/* PÁGINAS */}
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 space-y-6">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Layers size={16} className="text-cyan-500" /> Páginas
                      </h3>
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Máximo 25MB por archivo</span>
                    </div>
                    
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
                          onChange={(e) => setNewChapter({...newChapter, number: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:border-cyan-500 outline-none" 
                          placeholder="23"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título del capítulo</label>
                        <input 
                          type="text" 
                          value={newChapter.title}
                          onChange={(e) => setNewChapter({...newChapter, title: e.target.value})}
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
                                setNewChapter({...newChapter, thumbnail: file});
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
                        onChange={(value) => setNewChapter({...newChapter, releaseDate: value || ''})}
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
                            setNewChapter({
                              ...newChapter, 
                              isUnreleased,
                              // Si se marca isUnreleased, releasedAt debe ser null
                              // Si se desmarca, releasedAt debe ser la fecha actual en formato local
                              releaseDate: isUnreleased ? '' : getCurrentLocalDatetimeString()
                            });
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
                        disabled={loading || !newChapter.number || pages.length === 0}
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
                    <input
                      type="text"
                      value={inviteSlug}
                      onChange={e => setInviteSlug(e.target.value)}
                      placeholder="Slug del scan (ej: senshimanga)"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-5 text-white text-sm focus:border-cyan-500 transition-all outline-none"
                    />
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
                      disabled={inviting || !inviteSlug.trim()}
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
                  {isLeader && (
                    <button
                      onClick={handleDissolveJoint}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black py-2 px-5 rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2"
                    >
                      <Trash2 size={12} /> Disolver joint
                    </button>
                  )}
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
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-xl font-black italic tracking-tighter uppercase focus:border-cyan-500 transition-all outline-none"
                      placeholder="One Punch-Man"
                    />
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
                          setFormData({...formData, shortDescription: e.target.value});
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
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl py-4 px-6 text-white text-sm leading-relaxed focus:border-cyan-500 transition-all outline-none resize-none"
                      placeholder="La historia tiene lugar en una de las metrópolis de ficción de la Tierra, la Ciudad-Z..."
                    />
                  </div>

                  {/* Géneros (manga only — joints inherit from base manga) */}
                  {!isJointMode && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Géneros</label>
                    <Autocomplete
                      multiple
                      options={genres}
                      value={formData.genres}
                      onChange={(_, newValue) => setFormData({...formData, genres: newValue as any[]})}
                      getOptionLabel={(option: any) => option.name || option.title || String(option)}
                      isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
                      placeholder="Géneros..."
                      label=""
                    />
                  </div>
                  )}

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
                      onChange={(_, newValue) => setFormData({...formData, subscriptionPlansCanReadUnreleased: (newValue as any[]) || []})}
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
                      onChange={(_, newValue) => setFormData({...formData, subscriptionPlansCanReadReleased: (newValue as any[]) || []})}
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
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:border-cyan-500 transition-all outline-none"
                    >
                      <option value="ongoing">En emisión</option>
                      <option value="completed">Completado</option>
                      <option value="hiatus">En pausa</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                  {/* Tipo de obra */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Tipo de obra</label>
                    <select
                      value={formData.workType}
                      onChange={(e) => setFormData({...formData, workType: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:border-cyan-500 transition-all outline-none"
                    >
                      <option value="manga">Manga (derecha → izquierda)</option>
                      <option value="manwha">Manwha (scroll vertical)</option>
                      <option value="comic">Comic (izquierda → derecha)</option>
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
                      onChange={(value) => setFormData({...formData, releasedAt: value})}
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
                      onChange={(value) => setFormData({...formData, nextChapterAt: value})}
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
                      onChange={(e) => setFormData({...formData, nextChapterAtMessage: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm font-bold focus:border-cyan-500 outline-none"
                      placeholder="Ej: ¡Próximo capítulo el 15 de marzo!"
                    />
                  </div>
                  )}

                  {/* Toggles — manga only (joints don't have these flags) */}
                  {!isJointMode && (
                  <div className="space-y-6 pt-4 border-t border-zinc-800">
                    {/* Manga con simul release */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Manga con simul release</span>
                        <div 
                          onClick={() => setFormData({...formData, isSimulRelease: !formData.isSimulRelease})}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${formData.isSimulRelease ? 'bg-cyan-500' : 'bg-zinc-800'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isSimulRelease ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
                        Informa a los usuarios que este manga se publicará simultáneamente con su lanzamiento de pais origen
                      </p>
                    </div>

                    {/* Manga +18 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Manga +18</span>
                        <div 
                          onClick={() => setFormData({...formData, isNSFW: !formData.isNSFW})}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${formData.isNSFW ? 'bg-red-500' : 'bg-zinc-800'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isNSFW ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
                        Si se activa, este manga contendrá contenido para adultos y será marcado como +18
                      </p>
                    </div>

                    {/* Requiere inicio de sesión */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Requiere inicio de sesión (Opcional)</span>
                        <div
                          onClick={() => setFormData({...formData, requireLogin: !formData.requireLogin})}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${formData.requireLogin ? 'bg-yellow-500' : 'bg-zinc-800'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.requireLogin ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
                        Si se activa, el usuario deberá iniciar sesión para leer este capítulo
                      </p>
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

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}} />
      <ToastContainer theme="dark" position="bottom-right" />
    </div>
  );
};

export default AdminMangaEdit;
