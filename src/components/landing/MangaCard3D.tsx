
import React, { useRef, useState } from 'react';
import { Clock, Book, ArrowRight, Check, Lock, Unlock, CreditCard, AlertTriangle } from 'lucide-react';
import { translateStatus } from '../../util/landing/translateStatus';

interface Chapter {
  id: number;
  number: number;
  title: string;
  releasedAt: string;
  chapterUrl: string;
  isRead?: boolean; // Will be set by the parent component based on user history
}

interface Manga {
  id: string;
  title: string;
  cover: string;
  scan?: string;
  scanName?: string;
  status?: 'Ongoing' | 'Completed' | 'Hiatus';
  lastUpdate?: string;
  chapter?: string;
  chapterTitle?: string;
  prevChapter?: string;
  prevChapterTitle?: string;
  prevChapterUpdate?: string;
  isRead?: boolean;
  isSubscriberOnly?: boolean;
  scanUrl?: string;
  mangaUrl?: string; // Direct URL to manga page: /[scanSlug]/manga/[mangaSlug]
  chapters?: Chapter[]; // Last 2 chapters
  userHasSubscription?: boolean; // Whether user has access to subscriber-only content
  organizationId?: number; // Organization ID for subscription checks (used in landing page)
  subscriptionPlansCanReadUnreleased?: Array<{ id: number; name: string }>;
  subscriptionPlansCanReadReleased?: Array<{ id: number; name: string }>;
  isNSFW?: boolean;
  contentKind?: 'manga' | 'writing';
}

interface Props {
  user?: any;
  organization?: any;
  manga: Manga;
  hideScan?: boolean;
  onSubscribe?: () => void;
  onClick?: () => void;
  nsfwMode?: boolean;
}

const MangaCard3D: React.FC<Props> = ({ user, organization, manga, hideScan = false, onSubscribe, onClick, nsfwMode = false }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  
  // Construir mangaUrl de forma segura, evitando "undefined" en el path
  const getMangaUrl = () => {
    // Si mangaUrl existe y no contiene "undefined", usarlo
    if (manga.mangaUrl && !manga.mangaUrl.includes('undefined')) {
      return manga.mangaUrl;
    }
    
    // Intentar construir desde scanUrl y slug si están disponibles
    if (manga.scanUrl && manga.id && manga.id !== 'undefined') {
      return `${manga.scanUrl}/manga/${manga.id}`;
    }
    
    // Fallback a scanUrl o #
    return manga.scanUrl || '#';
  };
  
  const safeMangaUrl = getMangaUrl();
  const shouldBlur = !nsfwMode && manga.isNSFW === true;

  const formatChapterDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const absMins = Math.floor(Math.abs(diffMs) / 60000);
    if (absMins < 1) return 'ahora';
    const future = diffMs < 0;
    if (absMins < 60) return future ? `en ${absMins}m` : `hace ${absMins}m`;
    const absHours = Math.floor(absMins / 60);
    if (absHours < 24) return future ? `en ${absHours}h` : `hace ${absHours}h`;
    const absDays = Math.floor(absHours / 24);
    if (absDays < 3) return future ? `en ${absDays}d` : `hace ${absDays}d`;
    return (future ? 'el ' : '') + date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Get organization ID from organization prop or manga object (for landing page)
  const organizationId = organization?.id || manga.organizationId;
  
  // Find user permissions for this specific organization
  const userPermissions = user?.permissions?.find((permission: any) => {
    // Match by organization ID if available
    if (organizationId && permission.organizationId === organizationId) {
      return true;
    }
    // Fallback: if organization ID doesn't match, try to find any permission
    // This handles cases where organization object might not have ID
    return false;
  }) || {};

  // Helper function to get required plans for a chapter
  const getRequiredPlansForChapter = (chapter: Chapter): Array<{ id: number; name: string }> | null => {
    const isChapterReleased = chapter.releasedAt 
      ? new Date(chapter.releasedAt).getTime() < new Date().getTime()
      : false;
    
    if (isChapterReleased) {
      const hasCanReadReleasedPlans = (manga.subscriptionPlansCanReadReleased?.length ?? 0) > 0;
      if (hasCanReadReleasedPlans) {
        return manga.subscriptionPlansCanReadReleased || [];
      }
      return null; // Todos pueden leer
    } else {
      const hasCanReadUnreleasedPlans = (manga.subscriptionPlansCanReadUnreleased?.length ?? 0) > 0;
      if (hasCanReadUnreleasedPlans) {
        return manga.subscriptionPlansCanReadUnreleased || [];
      }
      return []; // Nadie puede leer
    }
  };

  // Helper function to check if user has access (considering both subscription and permissions)
  const userHasAccess = (chapter: Chapter): boolean => {
    // Check user permissions first (highest priority)
    if (userPermissions?.canReadUnreleased === true) {
      return true;
    }
    if (userPermissions?.canEditChapter === true) {
      return true;
    }
    if (userPermissions?.canEditPage === true) {
      return true;
    }

    const isChapterReleased = chapter.releasedAt 
      ? new Date(chapter.releasedAt).getTime() < new Date().getTime()
      : false;

    if (isChapterReleased) {
      // Capítulo ya fue lanzado
      const hasCanReadReleasedPlans = (manga.subscriptionPlansCanReadReleased?.length ?? 0) > 0;

      if (hasCanReadReleasedPlans) {
        // Solo usuarios con planes en subscriptionPlansCanReadReleased pueden leer
        if (!user || !organizationId) return false;

        for (const subscription of user.subscriptions || []) {
          if (
            subscription.active === true &&
            subscription?.subscriptionPlan?.organizationId === organizationId
          ) {
            const hasPlan = manga.subscriptionPlansCanReadReleased?.find(
              (plan) => plan.id === subscription?.subscriptionPlan?.id
            );
            if (hasPlan) return true;
          }
        }
        return false;
      } else {
        // subscriptionPlansCanReadReleased está vacío → Todos pueden leer
        return true;
      }
    } else {
      // Capítulo NO ha sido lanzado
      const hasCanReadUnreleasedPlans = (manga.subscriptionPlansCanReadUnreleased?.length ?? 0) > 0;

      if (hasCanReadUnreleasedPlans) {
        // Solo usuarios con planes en subscriptionPlansCanReadUnreleased pueden leer
        if (!user || !organizationId) return false;

        for (const subscription of user.subscriptions || []) {
          if (
            subscription.active === true &&
            subscription?.subscriptionPlan?.organizationId === organizationId
          ) {
            const hasPlan = manga.subscriptionPlansCanReadUnreleased?.find(
              (plan) => plan.id === subscription?.subscriptionPlan?.id
            );
            if (hasPlan) return true;
          }
        }
        return false;
      } else {
        // subscriptionPlansCanReadUnreleased está vacío → Nadie puede leer antes de la fecha
        return false;
      }
    }
  };

  // Helper function to get access reason message
  const getAccessReason = (chapter: Chapter): string => {
    if (userPermissions?.canReadUnreleased) {
      return 'Tienes acceso por permisos especiales de lectura anticipada';
    }
    if (userPermissions?.canEditChapter || userPermissions?.canEditPage) {
      return 'Tienes acceso por permisos de edición';
    }

    const isChapterReleased = chapter.releasedAt 
      ? new Date(chapter.releasedAt).getTime() < new Date().getTime()
      : false;
    const requiredPlans = getRequiredPlansForChapter(chapter);

    if (isChapterReleased) {
      if (requiredPlans && requiredPlans.length > 0) {
        return `Requiere uno de los siguientes planes: ${requiredPlans.map(p => p.name).join(", ")}`;
      }
      return ''; // Todos pueden leer
    } else {
      if (requiredPlans && requiredPlans.length > 0) {
        return `Requiere uno de los siguientes planes para acceso anticipado: ${requiredPlans.map(p => p.name).join(", ")}`;
      }
      return 'Este capítulo aún no ha sido publicado';
    }
  };

  const handleLockClick = (e: React.MouseEvent, chapter: Chapter) => {
    e.stopPropagation();
    const reason = getAccessReason(chapter);
    if (reason) {
      alert(reason);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 12;
    const rotateY = (centerX - x) / 12;
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => setRotate({ x: 0, y: 0 });

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (manga.mangaUrl) {
      // Prefer direct link to manga page
      window.location.href = manga.mangaUrl;
    } else if (manga.scanUrl) {
      // Fallback to scan page
      window.location.href = manga.scanUrl;
    }
  };

  return (
    <div 
      className="perspective-1000 w-full group cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      <div 
        ref={cardRef}
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: rotate.x === 0 ? 'transform 0.5s ease-out' : 'none'
        }}
        className="relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300"
      >
        <div className="aspect-[2/3] relative overflow-hidden rounded-t-2xl">
          <img
            src={manga.cover}
            alt={manga.title}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 rounded-t-2xl ${shouldBlur ? 'blur-xl scale-110' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

          {/* NSFW Badge */}
          {shouldBlur && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <div className="bg-red-500/90 text-white px-4 py-2 rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-lg">
                <AlertTriangle size={16} /> +18
              </div>
            </div>
          )}
          
          {/* Lock Icon - Show locked if no access and has subscription plans */}
          {manga.chapters && manga.chapters.length > 0 && (() => {
            const hasAccess = userHasAccess(manga.chapters[0]);
            const hasSubscriptionPlans = (manga.subscriptionPlansCanReadUnreleased && manga.subscriptionPlansCanReadUnreleased.length > 0) || 
                                        (manga.subscriptionPlansCanReadReleased && manga.subscriptionPlansCanReadReleased.length > 0);
            
            if (!hasAccess && hasSubscriptionPlans) {
              return (
                <div className="absolute top-3 left-3 z-30 p-1.5 bg-yellow-500 rounded-lg text-black shadow-lg">
                  <Lock size={12} fill="currentColor" />
                </div>
              );
            }
            
            return null;
          })()}

          {/* Status badge */}
          {manga.status && (
            <div className="absolute top-3 right-3 z-10">
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${manga.status.toLowerCase() === 'ongoing' ? 'bg-green-500 text-zinc-950' : 'bg-cyan-500 text-zinc-950'}`}>
                {translateStatus(manga.status)}
              </span>
            </div>
          )}

          {/* Writing kind badge */}
          {manga.contentKind === 'writing' && (
            <div className="absolute top-9 right-3 z-10">
              <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-purple-600 text-white flex items-center gap-1">
                <Book size={10} /> Novela
              </span>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 backdrop-blur-[2px] z-20">
            
            <a 
              href={safeMangaUrl}
              className="w-full bg-white text-zinc-950 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
               <Book size={12} /> Ir al Manga
            </a>

            {/* Last 2 Chapters */}
            {manga.chapters && manga.chapters.length > 0 && manga.chapters.map((chapter, index) => {
              const isLatest = index === 0;
              const canAccess = userHasAccess(chapter);
              const isReleased = new Date(chapter.releasedAt).getTime() <= new Date().getTime();
              // canRead: chapter is available to read if user has access
              const canRead = canAccess;
              const needsSubscription = !canAccess;
              
              // Extraer mangaSlug de mangaUrl o usar manga.id
              const getMangaSlug = () => {
                if (manga.mangaUrl) {
                  const match = manga.mangaUrl.match(/\/manga\/([^\/]+)/);
                  if (match) return match[1];
                }
                return manga.id || '';
              };
              
              const mangaSlug = getMangaSlug();
              const organizationSlug = manga.scanUrl?.replace('/', '') || organization?.slug || '';
              
              const href = canRead 
                ? chapter.chapterUrl 
                : (needsSubscription && organizationSlug && mangaSlug 
                  ? `/${organizationSlug}/subscriptions?mangaSlug=${mangaSlug}&chapterNumber=${chapter.number}` 
                  : '#');
              
              return (
                <a
                  key={chapter.id}
                  href={href}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canRead && !needsSubscription) {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full ${
                    isLatest 
                      ? `bg-zinc-900/90 border ${needsSubscription ? 'border-yellow-500/30 opacity-80' : 'border-zinc-800'}`
                      : 'bg-zinc-900/40 border border-zinc-800/50'
                  } text-white p-2 rounded-xl text-left hover:border-cyan-500/50 transition-all group/btn ${!canRead && !needsSubscription ? 'pointer-events-none cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`${
                      isLatest 
                        ? (needsSubscription ? 'text-yellow-500' : (canAccess ? 'text-green-500' : 'text-cyan-400'))
                        : 'text-zinc-400'
                    } font-black text-[10px] uppercase flex items-center gap-1`}>
                      Cap. {chapter.number} 
                      {!canAccess && (
                        <button
                          type="button"
                          className="cursor-pointer hover:scale-110 transition-transform inline-block bg-transparent border-none p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleLockClick(e, chapter);
                          }}
                          title={getAccessReason(chapter)}
                        >
                          <Lock size={8} />
                        </button>
                      )}
                    </span>
                    {index < 2 && (
                      <span
                        className="text-zinc-500 text-[10px] font-bold hidden md:inline-block relative group/date cursor-default"
                        title=""
                      >
                        {formatChapterDate(chapter.releasedAt)}
                        {/* Tooltip desktop */}
                        <span className="pointer-events-none absolute bottom-full right-0 mb-1.5 hidden group-hover/date:flex flex-col gap-0.5 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 shadow-2xl z-50 min-w-max text-left">
                          <span className="text-white text-[10px] font-bold whitespace-nowrap">
                            {new Date(chapter.releasedAt).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            {' · '}
                            {new Date(chapter.releasedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!isReleased && (
                            <span className="text-yellow-400 text-[9px] font-black uppercase tracking-widest">
                              ⏳ Lectura anticipada
                            </span>
                          )}
                          {isReleased && needsSubscription && (
                            <span className="text-yellow-400 text-[9px] font-black uppercase tracking-widest">
                              🔒 Requiere suscripción
                            </span>
                          )}
                          {isReleased && !needsSubscription && (
                            <span className="text-green-400 text-[9px] font-black uppercase tracking-widest">
                              ✓ Disponible
                            </span>
                          )}
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] font-bold truncate leading-none text-zinc-300">
                    {`"${chapter.title || 'Nuevo capítulo'}"`}
                  </p>
                  
                  {/* Mostrar pills de rangos con acceso si hay rangos configurados */}
                  {(() => {
                    const unreleasedPlans = manga.subscriptionPlansCanReadUnreleased || [];
                    const releasedPlans = manga.subscriptionPlansCanReadReleased || [];
                    
                    // Si no hay rangos configurados, no mostrar nada
                    if (unreleasedPlans.length === 0 && releasedPlans.length === 0) {
                      return null;
                    }
                    
                    // Crear un mapa de todos los rangos únicos
                    const allPlansMap = new Map();
                    
                    // Agregar rangos de unreleased
                    unreleasedPlans.forEach((plan: any) => {
                      allPlansMap.set(plan.id, {
                        ...plan,
                        inUnreleased: true,
                        inReleased: false
                      });
                    });
                    
                    // Agregar o actualizar rangos de released
                    releasedPlans.forEach((plan: any) => {
                      if (allPlansMap.has(plan.id)) {
                        allPlansMap.get(plan.id).inReleased = true;
                      } else {
                        allPlansMap.set(plan.id, {
                          ...plan,
                          inUnreleased: false,
                          inReleased: true
                        });
                      }
                    });
                    
                    const allPlans = Array.from(allPlansMap.values());
                    
                    // Verificar si el usuario tiene un rango específico
                    const userHasPlan = (planId: number) => {
                      if (!user || !organizationId) return false;
                      return user.subscriptions?.some((sub: any) => 
                        sub.active === true &&
                        sub?.subscriptionPlan?.organizationId === organizationId &&
                        sub?.subscriptionPlan?.id === planId
                      ) || false;
                    };
                    
                    // Determinar el tooltip para cada rango
                    const getTooltipText = (plan: any) => {
                      if (plan.inUnreleased && plan.inReleased) {
                        return "Acceso de lectura exclusiva + lectura anticipada";
                      } else if (plan.inUnreleased) {
                        return "Acceso de lectura anticipada";
                      } else if (plan.inReleased) {
                        return "Acceso de lectura exclusiva";
                      }
                      return "";
                    };
                    
                    return (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {allPlans.map((plan: any) => {
                          const hasPlan = userHasPlan(plan.id);
                          return (
                            <div key={plan.id} className="relative group/pill">
                              <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase cursor-help ${
                                hasPlan 
                                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                                  : 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                              }`}>
                                {plan.name}
                              </span>
                              {/* Tooltip individual para cada pill */}
                              <div className="absolute bottom-full left-0 mb-2 px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-[8px] font-medium leading-relaxed max-w-[160px] opacity-0 group-hover/pill:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg whitespace-normal">
                                {getTooltipText(plan)}
                                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900"></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  
                  {canRead && (
                    <div className={`flex items-center gap-1 mt-1.5 text-[8px] font-black uppercase transition-colors ${
                      chapter.isRead ? 'text-zinc-600' : 'text-white/40 group-hover/btn:text-green-400'
                    }`}>
                      {chapter.isRead ? (
                        <>
                          <Check size={10} className="text-green-500" /> Leído
                        </>
                      ) : (
                        <>
                          <ArrowRight size={10} /> Leer ahora
                        </>
                      )}
                    </div>
                  )}
                </a>
              );
            })}

            {/* Subscribe CTA in Hover - Show if any chapter user doesn't have access */}
            {manga.chapters?.some(ch => !userHasAccess(ch)) && (() => {
              // Extraer mangaSlug de mangaUrl o usar manga.id
              const getMangaSlug = () => {
                if (manga.mangaUrl) {
                  const match = manga.mangaUrl.match(/\/manga\/([^\/]+)/);
                  if (match) return match[1];
                }
                return manga.id || '';
              };
              
              const mangaSlug = getMangaSlug();
              const organizationSlug = manga.scanUrl?.replace('/', '') || organization?.slug || '';
              const subscribeHref = organizationSlug && mangaSlug
                ? `/${organizationSlug}/subscriptions?mangaSlug=${mangaSlug}`
                : (manga.scanUrl ? `${manga.scanUrl}/subscriptions` : '#');
              
              return (
                <a 
                  href={subscribeHref}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSubscribe) {
                      e.preventDefault();
                      onSubscribe();
                    }
                  }}
                  className="w-full mt-1 bg-yellow-500 text-black py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all shadow-lg"
                >
                  <CreditCard size={12} /> Suscribirme
                </a>
              );
            })()}
          </div>

          <div className="absolute bottom-3 left-4 right-4 group-hover:opacity-0 transition-opacity">
            <h3 className="text-white font-black text-base italic leading-tight mb-2 tracking-tight line-clamp-2">
              {manga.title}
            </h3>
            <div className="flex items-center justify-between text-[10px]">
              {manga.chapters && manga.chapters.length > 0 && (
                (() => {
                  const chapter = manga.chapters[0];
                  const hasAccess = userHasAccess(chapter);
                  const canLink = hasAccess;
                  
                  const content = (
                    <>
                      Cap. {chapter.number}
                      {!hasAccess && (
                        <Lock size={10} />
                      )}
                    </>
                  );
                  
                  if (canLink && chapter.chapterUrl) {
                    return (
                      <a
                        href={chapter.chapterUrl}
                        onClick={(e) => e.stopPropagation()}
                        className={`font-black flex items-center gap-1 hover:underline ${
                          !hasAccess 
                            ? 'text-yellow-500' 
                            : 'text-green-500'
                        }`}
                      >
                        {content}
                      </a>
                    );
                  }
                  
                  return (
                    <span className={`font-black flex items-center gap-1 ${
                      !hasAccess 
                        ? 'text-yellow-500' 
                        : 'text-green-500'
                    }`}>
                      {content}
                    </span>
                  );
                })()
              )}
              {manga.chapters && manga.chapters.length > 0 && manga.chapters[0].releasedAt && (
                <span className="hidden md:flex text-zinc-500 font-bold items-center gap-1 relative group/footerdate cursor-default">
                  <Clock size={10} />
                  {formatChapterDate(manga.chapters[0].releasedAt)}
                  <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 hidden group-hover/footerdate:flex flex-col gap-0.5 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 shadow-2xl z-50 min-w-max">
                    <span className="text-white text-[10px] font-bold whitespace-nowrap">
                      {new Date(manga.chapters[0].releasedAt).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}
                      {new Date(manga.chapters[0].releasedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {new Date(manga.chapters[0].releasedAt).getTime() > Date.now() ? (
                      <span className="text-yellow-400 text-[9px] font-black uppercase tracking-widest">⏳ Lectura anticipada</span>
                    ) : (
                      <span className="text-green-400 text-[9px] font-black uppercase tracking-widest">✓ Disponible</span>
                    )}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
        
        {!hideScan && (manga.scan || manga.scanName) && (
          <div className="px-4 py-3 bg-zinc-900/90 border-t border-zinc-800/50 flex items-center justify-between group-hover:bg-zinc-800 transition-colors">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest truncate">{manga.scan || manga.scanName}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MangaCard3D;

