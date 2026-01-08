import React, { useState, useEffect, useRef } from 'react';
import { Bookmark, Clock, Heart, Award, Zap, ChevronRight, BookOpen, BookMarked, Users, Pause, PlayCircle, X, Camera, Image as ImageIcon, AlignLeft, Upload, Lock, Unlock, User as UserIcon, Info, Sparkles } from 'lucide-react';
import { callAPI } from '../../util/callApi';
import { uploadFile } from '../../util/uploadFile';
import MangaCard3D from './MangaCard3D';

interface ProfilePageProps {
  user?: any;
  logged?: boolean;
  organization: any;
}

interface FollowedScan {
  id: number;
  name: string;
  logoUrl: string | null;
  slug: string;
  subscription: {
    rank: string;
    price: number;
    currency: string;
    status: 'active' | 'paused';
  } | null;
  followerCount: number;
}

interface ReadingHistory {
  id: number;
  chapter: {
    id: number;
    number: number;
    title: string;
    mangaCustom: {
      organization: {
        slug: string;
      };
      id: number;
      title: string;
      slug: string;
      imageUrl: string | null;
      manga: {
        slug: string;
      };
    };
  };
  pageNumber: number;
  lastReadAt: string;
}

const ProfilePageNew: React.FC<ProfilePageProps> = ({ user, logged, organization }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [followedScans, setFollowedScans] = useState<FollowedScan[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [stats, setStats] = useState({
    read: 0,
    toRead: 0,
    favorites: 0,
    activeDays: 0,
  });
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingScans, setLoadingScans] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const [favoritesTotal, setFavoritesTotal] = useState(0);
  const [loadingMoreFavorites, setLoadingMoreFavorites] = useState(false);
  
  const [editData, setEditData] = useState({
    name: user?.username || '',
    avatar: user?.imageUrl || '',
    banner: user?.bannerUrl || '',
    description: user?.description || ''
  });

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // Check if user has active subscription (Pro)
  const isUserPro = user?.subscriptions?.some((sub: any) => sub.active === true) || false;

  // Update editData when user changes
  useEffect(() => {
    if (user) {
      setEditData({
        name: user.username || '',
        avatar: user.imageUrl || '',
        banner: user.bannerUrl || '',
        description: user.description || ''
      });
      setAvatarFile(null);
      setBannerFile(null);
    }
  }, [user]);

  // Fetch followed organizations
  useEffect(() => {
    const fetchFollowedScans = async () => {
      if (!logged || !user) {
        console.log('Not logged in or no user, skipping followed scans fetch');
        setLoadingScans(false);
        return;
      }

      try {
        setLoadingScans(true);
        console.log('Fetching followed scans for user:', user.id);
        const result = await callAPI('/api/organization/followed');
        
        console.log('Followed scans API response:', result);
        console.log('Result type:', typeof result);
        console.log('Is array:', Array.isArray(result));
        
        // callAPI returns result.data, so result should be the array directly
        if (result && Array.isArray(result)) {
          console.log('Setting followed scans:', result.length, 'scans');
          setFollowedScans(result);
        } else if (result && result.data && Array.isArray(result.data)) {
          // Fallback: if somehow result.data exists
          console.log('Setting followed scans from result.data:', result.data.length, 'scans');
          setFollowedScans(result.data);
        } else {
          console.warn('Unexpected response structure for followed scans:', result);
          setFollowedScans([]);
        }
      } catch (error: any) {
        console.error('Error fetching followed scans:', error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        setFollowedScans([]);
      } finally {
        setLoadingScans(false);
      }
    };

    fetchFollowedScans();
  }, [logged, user]);

  // Fetch reading history
  useEffect(() => {
    const fetchReadingHistory = async () => {
      if (!logged || !user) {
        setLoadingHistory(false);
        return;
      }

      try {
        setLoadingHistory(true);
        const result = await callAPI('/api/user-chapter-history?limit=30');
        
        // callAPI returns result.data, which contains { data, maxPage, total }
        if (result?.data && Array.isArray(result.data)) {
          setReadingHistory(result.data);
          setHistoryTotal(result.total || result.data.length);
        } else {
          setReadingHistory([]);
          setHistoryTotal(0);
        }
      } catch (error) {
        console.error('Error fetching reading history:', error);
        setReadingHistory([]);
        setHistoryTotal(0);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchReadingHistory();
  }, [logged, user]);

  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!logged || !user) {
        setLoadingFavorites(false);
        return;
      }

      try {
        setLoadingFavorites(true);
        const result = await callAPI('/api/favorites?limit=6');
        
        // callAPI returns result.data, which contains { data, maxPage, total }
        if (result?.data && Array.isArray(result.data)) {
          // The API returns favorites with mangaCustom nested
          setFavorites(result.data);
          setFavoritesTotal(result.total || result.data.length);
        } else {
          setFavorites([]);
          setFavoritesTotal(0);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setFavorites([]);
        setFavoritesTotal(0);
      } finally {
        setLoadingFavorites(false);
      }
    };

    fetchFavorites();
  }, [logged, user]);

  // Fetch and calculate stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!logged || !user) {
        return;
      }

      try {
        const result = await callAPI('/api/user/stats');
        
        if (result) {
          setStats({
            read: result.read || 0,
            toRead: result.toRead || 0,
            favorites: favorites.length,
            activeDays: result.activeDays || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback to calculated values
        setStats({
          read: 0,
          toRead: 0,
          favorites: favorites.length,
          activeDays: user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        });
      }
    };

    fetchStats();
  }, [logged, user, favorites]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    if (!isUserPro && type === 'banner') return;
    const file = e.target.files?.[0];
    if (file) {
      // Store the file for upload
      if (type === 'avatar') {
        setAvatarFile(file);
      } else {
        setBannerFile(file);
      }
      
      // Preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData(prev => ({
          ...prev,
          [type]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      
      // Upload avatar if changed
      if (avatarFile) {
        const avatarKey = await uploadFile(avatarFile, undefined, 'profile_pictures');
        formData.append('image', avatarKey);
      } else if (editData.avatar && editData.avatar !== user.imageUrl && !editData.avatar.startsWith('data:')) {
        // If it's a URL (not a data URL), use it directly
        formData.append('image', editData.avatar);
      }
      
      // Upload banner if changed (only for Pro users)
      if (isUserPro) {
        if (bannerFile) {
          const bannerKey = await uploadFile(bannerFile, undefined, 'profile_pictures');
          formData.append('banner', bannerKey);
        } else if (editData.banner && editData.banner !== user.bannerUrl && !editData.banner.startsWith('data:')) {
          formData.append('banner', editData.banner);
        }
      }
      
      // Add other fields
      if (isUserPro && editData.name !== user.username) {
        formData.append('username', editData.name);
      }
      
      if (isUserPro && editData.description !== (user.description || '')) {
        formData.append('description', editData.description);
      }
      
      // Call API to update user
      // Note: The API requires organizationId, but for profile updates we can use any organization
      // The endpoint will use the organization from the header or find a default one
      const result = await callAPI(`/api/user/${user.id}`, {
        method: 'PATCH',
        body: formData,
      });
      
      // callAPI returns result.data, so result should be the user object
      if (result) {
        // Reload page to get updated user data
        window.location.reload();
      } else {
        alert('Error al actualizar el perfil');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(error?.message || 'Error al actualizar el perfil');
    } finally {
      setUploading(false);
    }
  };

  const toggleSubscription = (scanId: number) => {
    // TODO: Implement subscription pause/resume
    console.log('Toggle subscription for scan:', scanId);
  };

  const statsData = [
    { label: 'Leídos', value: stats.read.toString(), icon: <BookOpen className="text-cyan-500" size={18} /> },
    { label: 'Por leer', value: stats.toRead.toString(), icon: <Bookmark className="text-purple-500" size={18} /> },
    { label: 'Favoritos', value: stats.favorites.toString(), icon: <Heart className="text-red-500" size={18} /> },
    { label: 'Días Activo', value: stats.activeDays.toString(), icon: <Clock className="text-yellow-500" size={18} /> },
  ];

  const ProRestrictionTooltip = () => (
    <div className="absolute -top-10 left-0 bg-yellow-500 text-zinc-950 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
      <Info size={12} /> Para ser Miembro Pro debes tener una suscripción activa
    </div>
  );

  const ProUnlockedTooltip = () => (
    <div className="absolute -top-10 right-0 bg-cyan-500 text-zinc-950 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl opacity-0 group-hover/unlocked:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
      <Sparkles size={12} /> Función disponible gracias a tu rango miembro pro
    </div>
  );

  if (!logged || !user) {
    return (
      <div className="pt-24 pb-20 min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 text-lg font-medium">Por favor, inicia sesión para ver tu perfil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Profile Header */}
        <div className="relative mb-12">
          <div className="h-48 md:h-72 rounded-[40px] overflow-hidden relative border border-zinc-800 shadow-2xl">
            <img 
              src={editData.banner || "https://picsum.photos/seed/bannerprof/1200/400"} 
              className="w-full h-full object-cover opacity-60 transition-opacity duration-700" 
              alt="" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          </div>
          
          <div className="relative -mt-16 md:-mt-20 px-8 flex flex-col md:flex-row items-end gap-6 md:gap-10">
            <div className="relative group">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-[40px] overflow-hidden border-8 border-zinc-950 bg-zinc-900 shadow-2xl relative z-10">
                <img 
                  src={editData.avatar || user.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || user.email || 'U')}&background=27272a&color=fff&size=176`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  alt={user.username || user.email} 
                />
              </div>
              <div className={`absolute -bottom-2 -right-2 p-2 rounded-2xl border-4 border-zinc-950 z-20 shadow-lg ${isUserPro ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'}`}>
                {isUserPro ? <Zap size={20} fill="currentColor" /> : <Lock size={20} />}
              </div>
            </div>
            
            <div className="flex-1 pb-4 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                  {user.username || user.email || 'Usuario'}
                </h1>
                {isUserPro && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest mx-auto md:mx-0">
                    <Award size={14} /> Miembro Pro
                  </div>
                )}
              </div>
              <p className="text-zinc-500 font-bold text-base mb-2">{user.email}</p>
              {editData.description && (
                <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-2xl italic">
                  "{editData.description}"
                </p>
              )}
            </div>

            <div className="pb-4 w-full md:w-auto">
              <button 
                onClick={() => {
                  setEditData({
                    name: user.username || '',
                    avatar: user.imageUrl || '',
                    banner: user.bannerUrl || '',
                    description: user.description || ''
                  });
                  setIsEditModalOpen(true);
                }}
                className="w-full md:w-auto bg-white text-zinc-950 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cyan-500 transition-all transform active:scale-95 shadow-xl shadow-white/5"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {statsData.map((stat, idx) => (
            <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-colors flex items-center gap-5 group">
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-black text-white italic leading-none mb-1">{stat.value}</p>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-16">
            {/* Followed Scans Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Mis <span className="text-purple-500">Scans</span></h2>
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  <Users size={14} /> {followedScans.length} seguido(s)
                </div>
              </div>
              {loadingScans ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[32px] animate-pulse">
                      <div className="h-16 bg-zinc-800 rounded mb-4" />
                      <div className="h-20 bg-zinc-800 rounded" />
                    </div>
                  ))}
                </div>
              ) : followedScans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {followedScans.map((scan) => (
                    <div key={scan.id} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[32px] group hover:bg-zinc-900 transition-all shadow-xl">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-zinc-800 bg-zinc-950">
                            <img 
                              src={scan.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(scan.name)}&background=27272a&color=fff&size=64`} 
                              className="w-full h-full object-cover" 
                              alt={scan.name} 
                            />
                          </div>
                          <div>
                            <h4 className="text-white font-black italic text-lg leading-tight uppercase group-hover:text-cyan-400 transition-colors">
                              {scan.name}
                            </h4>
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">
                              {scan.followerCount.toLocaleString()} seguidores
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl mb-4">
                        {scan.subscription ? (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-500"><Award size={16} /></span>
                                <span className="text-white font-bold text-sm">{scan.subscription.rank}</span>
                              </div>
                              <span className="text-white font-black text-sm italic">
                                {scan.subscription.currency === 'USD' ? '$' : scan.subscription.currency}{scan.subscription.price}/mes
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${scan.subscription.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-orange-500'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${scan.subscription.status === 'active' ? 'text-green-500' : 'text-orange-500'}`}>
                                  {scan.subscription.status === 'active' ? 'Suscripción Activa' : 'Suscripción Pausada'}
                                </span>
                              </div>
                              <button 
                                onClick={() => toggleSubscription(scan.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${
                                  scan.subscription.status === 'active' 
                                    ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500 hover:text-white' 
                                    : 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white'
                                }`}
                              >
                                {scan.subscription.status === 'active' ? (
                                  <><Pause size={12} /> Pausar</>
                                ) : (
                                  <><PlayCircle size={12} /> Reanudar</>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between py-1">
                            <span className="text-zinc-500 font-bold text-xs">Sin suscripción activa</span>
                            <a 
                              href={`/${scan.slug}/subscriptions`}
                              className="text-cyan-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                            >
                              Ver Planes
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-900/40 border border-zinc-800 rounded-[32px]">
                  <p className="text-zinc-500 text-lg font-medium">No sigues ningún scan todavía</p>
                </div>
              )}
            </section>

            {/* Favorites Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Mis <span className="text-cyan-500">Favoritos</span></h2>
                {favorites.length > 6 && !showAllFavorites && (
                  <button
                    onClick={async () => {
                      if (favorites.length < favoritesTotal) {
                        setLoadingMoreFavorites(true);
                        try {
                          const result = await callAPI(`/api/favorites?limit=${favoritesTotal}`);
                          if (result?.data && Array.isArray(result.data)) {
                            setFavorites(result.data);
                          }
                        } catch (error) {
                          console.error('Error loading all favorites:', error);
                        } finally {
                          setLoadingMoreFavorites(false);
                        }
                      }
                      setShowAllFavorites(true);
                    }}
                    disabled={loadingMoreFavorites}
                    className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMoreFavorites ? 'Cargando...' : 'Mostrar todos'} <ChevronRight size={14} />
                  </button>
                )}
              </div>
              {loadingFavorites ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-6 animate-pulse">
                      <div className="h-64 bg-zinc-800 rounded mb-4" />
                      <div className="h-4 bg-zinc-800 rounded" />
                    </div>
                  ))}
                </div>
              ) : favorites.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {(showAllFavorites ? favorites : favorites.slice(0, 6)).map((favorite: any) => {
                      const mangaCustom = favorite.mangaCustom || favorite;
                      const orgSlug = mangaCustom.organization?.slug || '';
                      
                      // Check if user has subscription to this organization with canReadUnreleased
                      const userHasSubscription = logged && user?.subscriptions?.some(
                        (sub: any) => sub?.organizationId === mangaCustom.organization?.id && sub.active === true && sub?.subscriptionPlan?.canReadUnreleased === true
                      ) || false;

                      // Map chapters with read status
                      const chaptersWithReadStatus = (mangaCustom.chapters || []).map((chapter: any) => {
                        const isRead = logged && user?.history?.some(
                          (historyItem: any) => historyItem.chapterId === chapter.id && historyItem.finishedAt
                        ) || false;
                        
                        return {
                          id: chapter.id,
                          number: chapter.number,
                          title: chapter.title,
                          releasedAt: chapter.releasedAt,
                          subscribersOnly: chapter.subscribersOnly,
                          chapterUrl: `/${orgSlug}/manga/${mangaCustom.manga?.slug || ''}/chapters/${chapter.number}`,
                          isRead,
                        };
                      });

                      return (
                        <MangaCard3D 
                          key={mangaCustom.id || favorite.id} 
                          user={user}
                          organization={mangaCustom.organization || organization}
                          manga={{
                            id: mangaCustom.id?.toString() || '',
                            title: mangaCustom.title,
                            cover: mangaCustom.imageUrl,
                            scan: mangaCustom.organization?.name || '',
                            scanName: mangaCustom.organization?.name || '',
                            scanUrl: `/${orgSlug}`,
                            mangaUrl: `/${orgSlug}/manga/${mangaCustom.manga?.slug || ''}`,
                            status: mangaCustom.status || 'Ongoing',
                            chapters: chaptersWithReadStatus,
                            userHasSubscription: userHasSubscription,
                          }}
                        />
                      );
                    })}
                  </div>
                  {showAllFavorites && favorites.length > 6 && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={() => setShowAllFavorites(false)}
                        className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-all mx-auto"
                      >
                        Mostrar menos <ChevronRight size={14} className="rotate-180" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-zinc-900/40 border border-zinc-800 rounded-[32px]">
                  <p className="text-zinc-500 text-lg font-medium">No tienes favoritos todavía</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar - Reading History */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                <BookMarked className="text-cyan-500" size={20} /> Continuar leyendo
              </h3>
              {loadingHistory ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-zinc-950/40 border border-zinc-800/50 rounded-2xl p-4 animate-pulse">
                      <div className="h-4 bg-zinc-800 rounded mb-2" />
                      <div className="h-3 bg-zinc-800 rounded" />
                    </div>
                  ))}
                </div>
              ) : readingHistory.length > 0 ? (
                <>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {(showAllHistory ? readingHistory : readingHistory.slice(0, 5)).map((item) => {
                      console.log(item)
                      const orgSlug = item.chapter.mangaCustom.organization.slug;
                      const chapterUrl = `/${orgSlug}/manga/${item.chapter.mangaCustom.manga.slug}/chapters/${item.chapter.number}?page=${item.pageNumber}`;
                      return (
                      <a
                        key={item.id}
                        href={chapterUrl}
                        className="group bg-zinc-950/40 border border-zinc-800/50 rounded-2xl p-4 hover:border-cyan-500/50 transition-all cursor-pointer relative overflow-hidden block"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-[8px] font-black text-cyan-500 uppercase tracking-widest mb-1 truncate">
                              {item.chapter.mangaCustom.title}
                            </p>
                            <h4 className="text-white font-bold text-xs truncate">
                              Cap. {item.chapter.number} - {item.chapter.title}
                            </h4>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:bg-cyan-500 group-hover:text-zinc-950 transition-all shrink-0">
                            <PlayCircle size={14} fill="currentColor" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-600 text-[8px] font-bold uppercase tracking-widest">
                          <Clock size={10} />
                          <span>Visto: {new Date(item.lastReadAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </a>
                      );
                    })}
                  </div>
                  {readingHistory.length > 5 && (
                    <button
                      onClick={async () => {
                        if (!showAllHistory) {
                          // If we're showing all and there might be more, load more
                          if (readingHistory.length < historyTotal) {
                            setLoadingMoreHistory(true);
                            try {
                              const result = await callAPI(`/api/user-chapter-history?limit=${historyTotal}`);
                              if (result?.data && Array.isArray(result.data)) {
                                setReadingHistory(result.data);
                              }
                            } catch (error) {
                              console.error('Error loading more history:', error);
                            } finally {
                              setLoadingMoreHistory(false);
                            }
                          }
                          setShowAllHistory(true);
                        } else {
                          setShowAllHistory(false);
                        }
                      }}
                      disabled={loadingMoreHistory}
                      className="w-full mt-8 text-center text-[10px] font-black text-zinc-500 hover:text-cyan-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMoreHistory ? (
                        'Cargando...'
                      ) : showAllHistory ? (
                        <>
                          Ver menos <ChevronRight size={14} className="group-hover:-translate-x-1 transition-transform rotate-180" />
                        </>
                      ) : (
                        <>
                          Ver historial completo ({historyTotal}) <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-zinc-500 text-sm font-medium">No hay historial de lectura</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:px-0">
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Personalizar <span className="text-cyan-500">Perfil</span></h3>
                {!isUserPro && (
                  <span className="bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border border-zinc-700">
                    <Lock size={10} /> Free User
                  </span>
                )}
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {/* Account Basic Info (Username) */}
              <div className="space-y-3 relative group/input">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <UserIcon size={14} /> Nombre de Usuario
                  </label>
                  <div className="relative group/unlocked">
                    {isUserPro ? (
                      <>
                        <Unlock size={12} className="text-cyan-500" />
                        <ProUnlockedTooltip />
                      </>
                    ) : (
                      <Lock size={12} className="text-yellow-500" />
                    )}
                  </div>
                </div>
                <input 
                  type="text" 
                  value={editData.name}
                  disabled={!isUserPro}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  placeholder="Usuario"
                  className={`w-full bg-zinc-950 border rounded-2xl py-4 px-5 text-white transition-all text-sm ${!isUserPro ? 'border-zinc-800 opacity-50 cursor-not-allowed' : 'border-zinc-800 focus:border-cyan-500'}`}
                />
                {!isUserPro && <ProRestrictionTooltip />}
              </div>

              {/* Banner Edit (Restringido Pro) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} /> Fondo de Perfil (Banner)
                  </label>
                  <div className="relative group/unlocked flex items-center gap-2">
                    {isUserPro ? (
                      <>
                        <Unlock size={12} className="text-cyan-500" />
                        <span className="text-cyan-500 text-[8px] font-black uppercase tracking-widest">Pro Unlocked</span>
                        <ProUnlockedTooltip />
                      </>
                    ) : (
                      <>
                        <Lock size={10} className="text-yellow-500" />
                        <span className="text-yellow-500 text-[8px] font-black uppercase tracking-widest">Pro Only</span>
                      </>
                    )}
                  </div>
                </div>
                <div 
                  onClick={() => isUserPro && bannerInputRef.current?.click()}
                  className={`relative h-40 w-full rounded-3xl overflow-hidden border-2 border-dashed transition-all group/input ${!isUserPro ? 'border-zinc-800 cursor-not-allowed' : 'border-zinc-800 hover:border-cyan-500/50 cursor-pointer bg-zinc-950'}`}
                >
                  {editData.banner ? (
                    <>
                      <img src={editData.banner} className={`w-full h-full object-cover transition-opacity ${!isUserPro ? 'opacity-20 grayscale' : 'opacity-40 group-hover/input:opacity-60'}`} alt="" />
                      {isUserPro && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                          <Upload size={24} className="mb-2 group-hover/input:-translate-y-1 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Cambiar Banner</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                      <Upload size={32} className="mb-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Seleccionar Imagen</span>
                    </div>
                  )}
                  {!isUserPro && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <Lock size={32} className="text-yellow-500 mb-2" />
                      <span className="text-white font-black text-[10px] uppercase tracking-widest">Requiere Suscripción Activa</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={bannerInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'banner')}
                    disabled={!isUserPro}
                  />
                </div>
              </div>

              {/* Avatar Edit (Libre) */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Camera size={14} /> Foto de Perfil (Avatar)
                </label>
                <div className="flex items-center gap-8">
                  <div 
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative w-28 h-28 rounded-[32px] overflow-hidden border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 cursor-pointer group bg-zinc-950 flex items-center justify-center transition-all"
                  >
                    {editData.avatar ? (
                      <img src={editData.avatar} className="w-full h-full object-cover group-hover:opacity-60 transition-opacity" alt="Avatar Preview" />
                    ) : (
                      <Upload size={24} className="text-zinc-600" />
                    )}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/40 transition-opacity">
                      <Camera size={20} className="text-white" />
                    </div>
                    <input 
                      type="file" 
                      ref={avatarInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'avatar')}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-white font-bold text-sm">Cambiar foto de perfil</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">JPG, PNG o WebP (Max 2MB)</p>
                    <button 
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-4 py-2 bg-zinc-800 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-zinc-700 transition-colors"
                    >
                      Elegir archivo
                    </button>
                  </div>
                </div>
              </div>

              {/* Description Edit (Restringido Pro) */}
              <div className="space-y-4 relative group/input">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <AlignLeft size={14} /> Biografía / Descripción
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative group/unlocked">
                      {isUserPro ? (
                        <>
                          <Unlock size={12} className="text-cyan-500" />
                          <ProUnlockedTooltip />
                        </>
                      ) : (
                        <Lock size={12} className="text-yellow-500" />
                      )}
                    </div>
                    <span className={`text-[10px] font-black ${editData.description.length >= 140 ? 'text-red-500' : 'text-zinc-600'}`}>
                      {editData.description.length}/140
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <textarea 
                    value={editData.description}
                    disabled={!isUserPro}
                    onChange={(e) => setEditData({...editData, description: e.target.value.slice(0, 140)})}
                    placeholder={isUserPro ? "Escribe algo sobre ti..." : "Solo miembros Pro pueden tener una descripción personalizada"}
                    rows={4}
                    className={`w-full bg-zinc-950 border rounded-3xl py-4 px-6 text-white transition-all text-sm resize-none ${!isUserPro ? 'border-zinc-800 opacity-50 cursor-not-allowed' : 'border-zinc-800 focus:border-cyan-500'}`}
                  />
                  {!isUserPro && <ProRestrictionTooltip />}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-zinc-800 bg-zinc-950/30 flex items-center gap-4">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-zinc-700 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={uploading}
                className="flex-1 py-4 bg-cyan-500 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white transition-all shadow-lg shadow-cyan-500/10 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Guardando...' : 'Guardar Perfil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePageNew;

