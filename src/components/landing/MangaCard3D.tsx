
import React, { useRef, useState } from 'react';
import { Clock, Book, ArrowRight, Check, Lock, Unlock, CreditCard } from 'lucide-react';
import { translateStatus } from '../../util/landing/translateStatus';

interface Chapter {
  id: number;
  number: number;
  title: string;
  releasedAt: string;
  subscribersOnly: boolean;
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
}

interface Props {
  user?: any;
  organization?: any;
  manga: Manga;
  hideScan?: boolean;
  onSubscribe?: () => void;
  onClick?: () => void;
}

const MangaCard3D: React.FC<Props> = ({ user, organization, manga, hideScan = false, onSubscribe, onClick }) => {
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

  // Find user permissions for this specific organization
  const userPermissions = user?.permissions?.find((permission: any) => {
    // Match by organization ID if available
    if (organization?.id && permission.organizationId === organization.id) {
      return true;
    }
    // Fallback: if organization ID doesn't match, try to find any permission
    // This handles cases where organization object might not have ID
    return false;
  }) || {};

  // Helper function to check if user has access (considering both subscription and permissions)
  const userHasAccess = (chapter: Chapter): boolean => {
    // If chapter is not subscriber-only, everyone can access
    if (!chapter.subscribersOnly) {
      return true;
    }

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

    // Check if user has subscription with canReadUnreleased for this organization
    if (user?.subscriptions && organization?.id) {
      for (const subscription of user.subscriptions) {
        if (
          subscription?.subscriptionPlan?.canReadUnreleased === true && 
          subscription.active === true &&
          subscription?.organizationId === organization.id
        ) {
          return true;
        }
      }
    }

    // Fallback: check manga.userHasSubscription (for backward compatibility)
    if (manga.userHasSubscription) {
      return true;
    }

    // No access
    return false;
  };

  // Helper function to get access reason message
  const getAccessReason = (chapter: Chapter): string => {
    if (!chapter.subscribersOnly) return '';
    
    if (userPermissions?.canReadUnreleased) {
      return 'Tienes acceso por permisos especiales de lectura anticipada';
    }
    if (userPermissions?.canEditChapter || userPermissions?.canEditPage) {
      return 'Tienes acceso por permisos de edición';
    }
    if (manga.userHasSubscription) {
      return 'Tienes acceso premium activo';
    }
    return '';
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
        <div className="aspect-[2/3] relative overflow-hidden">
          <img 
            src={manga.cover} 
            alt={manga.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
          
          {/* Lock Icon for Sub only - Show locked if no access, unlocked if has access */}
          {manga.chapters && manga.chapters.length > 0 && manga.chapters[0].subscribersOnly && (
            userHasAccess(manga.chapters[0]) ? (
              <a 
                href={manga.chapters[0].chapterUrl}
                className="absolute top-3 left-3 z-30 p-1.5 bg-green-500 rounded-lg text-white shadow-lg cursor-pointer hover:bg-green-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLockClick(e, manga.chapters[0]);
                }}
                title={getAccessReason(manga.chapters[0])}
              >
                <Unlock size={12} />
              </a>
            ) : (
              <div className="absolute top-3 left-3 z-30 p-1.5 bg-yellow-500 rounded-lg text-black shadow-lg">
                <Lock size={12} fill="currentColor" />
              </div>
            )
          )}

          {/* Status badge */}
          {manga.status && (
            <div className="absolute top-3 right-3 z-10">
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${manga.status.toLowerCase() === 'ongoing' ? 'bg-green-500 text-zinc-950' : 'bg-cyan-500 text-zinc-950'}`}>
                {translateStatus(manga.status)}
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
              // canRead: chapter is available to read
              // - Public chapters: if released
              // - Subscriber-only chapters: if user has access (incluso si no está publicado)
              const canRead = (!chapter.subscribersOnly && isReleased) || (chapter.subscribersOnly && canAccess);
              const needsSubscription = chapter.subscribersOnly && !canAccess;
              const href = canRead 
                ? chapter.chapterUrl 
                : (needsSubscription && manga.scanUrl ? `${manga.scanUrl}/subscriptions` : '#');
              
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
                        ? (needsSubscription ? 'text-yellow-500' : (chapter.subscribersOnly ? 'text-green-500' : 'text-cyan-400'))
                        : 'text-zinc-400'
                    } font-black text-[10px] uppercase flex items-center gap-1`}>
                      Cap. {chapter.number} 
                      {chapter.subscribersOnly && (
                        canAccess ? (
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
                            <Unlock size={8} />
                          </button>
                        ) : (
                          <Lock size={8} />
                        )
                      )}
                    </span>
                    {isLatest && (
                      <span className="text-zinc-600 text-[8px] font-bold">
                        {new Date(chapter.releasedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] font-bold truncate leading-none text-zinc-300">
                    {needsSubscription 
                      ? 'Solo para suscriptores' 
                      : `"${chapter.title || 'Nuevo capítulo'}"`
                    }
                  </p>
                  {canRead && (
                    <div className={`flex items-center gap-1 mt-1.5 text-[8px] font-black uppercase transition-colors ${
                      chapter.isRead ? 'text-zinc-600' : 'text-white/40 group-hover/btn:text-cyan-400'
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

            {/* Subscribe CTA in Hover - Show if any chapter is subscriber-only and user doesn't have access */}
            {manga.chapters?.some(ch => ch.subscribersOnly && !userHasAccess(ch)) && (
              <a 
                href={manga.scanUrl ? `${manga.scanUrl}/subscriptions` : '#'}
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
            )}
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
                  const isSubscriberOnly = chapter.subscribersOnly;
                  const canLink = !isSubscriberOnly || hasAccess;
                  
                  const content = (
                    <>
                      Cap. {chapter.number}
                      {isSubscriberOnly && (
                        hasAccess ? (
                          <span 
                            className="cursor-pointer hover:scale-110 transition-transform inline-flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLockClick(e, chapter);
                            }}
                            title={getAccessReason(chapter)}
                          >
                            <Unlock size={10} />
                          </span>
                        ) : (
                          <Lock size={10} />
                        )
                      )}
                    </>
                  );
                  
                  if (canLink && chapter.chapterUrl) {
                    return (
                      <a
                        href={chapter.chapterUrl}
                        onClick={(e) => e.stopPropagation()}
                        className={`font-black flex items-center gap-1 hover:underline ${
                          isSubscriberOnly && !hasAccess 
                            ? 'text-yellow-500' 
                            : (isSubscriberOnly ? 'text-green-500' : 'text-white')
                        }`}
                      >
                        {content}
                      </a>
                    );
                  }
                  
                  return (
                    <span className={`font-black flex items-center gap-1 ${
                      isSubscriberOnly && !hasAccess 
                        ? 'text-yellow-500' 
                        : (isSubscriberOnly ? 'text-green-500' : 'text-white')
                    }`}>
                      {content}
                    </span>
                  );
                })()
              )}
              {manga.chapters && manga.chapters.length > 0 && manga.chapters[0].releasedAt && (
                <span className="text-zinc-500 font-bold flex items-center gap-1">
                  <Clock size={10} /> 
                  {new Date(manga.chapters[0].releasedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
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

