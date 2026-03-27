import React, { useState, useEffect, useRef } from 'react';
import { Bookmark, Clock, Heart, Award, Zap, ChevronRight, BookOpen, BookMarked, Users, Pause, PlayCircle, X, Camera, Image as ImageIcon, AlignLeft, Upload, Lock, Unlock, User as UserIcon, Info, Sparkles, Crown, Calendar, Flame, Trophy, MessageSquare } from 'lucide-react';
import { callAPI } from '../../util/callApi';
import { uploadFile } from '../../util/uploadFile';
import MangaCard3D from './MangaCard3D';

interface ProfilePageProps {
  user?: any;
  logged?: boolean;
  organization: any;
  profileSlug?: string;
  isOwner?: boolean;
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
    interval: string;
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

const ProfilePageNew: React.FC<ProfilePageProps> = ({ user, logged, organization, profileSlug, isOwner = false }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [followedScans, setFollowedScans] = useState<FollowedScan[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(!isOwner);
  const [stats, setStats] = useState({
    read: 0,
    toRead: 0,
    favorites: 0,
    accountAge: 0,
    activeDaysStreak: 0,
    streak: 0,
    favoriteGenre: null as string | null,
    hoursEstimated: 0,
    weekChaptersRead: 0,
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
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [commentRank, setCommentRank] = useState<{ rank: number; count: number } | null>(null);
  const [loadingAchievements, setLoadingAchievements] = useState(true);

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

  // The display user: owner uses their own data, visitors use fetched profile
  const displayUser = isOwner ? user : profileData;

  // Check if display user has active subscription (Pro)
  const isUserPro = displayUser?.subscriptions?.some((sub: any) => sub.active === true) || false;

  // Get the most expensive active subscription across all organizations
  const getMostExpensiveActiveSubscription = () => {
    if (!displayUser?.subscriptions) return null;

    const activeSubscriptions = displayUser.subscriptions.filter((sub: any) => {
      return sub.active === true && sub.subscriptionPlan?.price;
    });

    if (activeSubscriptions.length === 0) return null;

    if (organization) {
      const orgSubscriptions = activeSubscriptions.filter(
        (sub: any) => sub.subscriptionPlan?.organizationId === organization.id
      );

      if (orgSubscriptions.length > 0) {
        return orgSubscriptions.reduce((prev: any, current: any) => {
          const prevPrice = prev.subscriptionPlan?.price || 0;
          const currentPrice = current.subscriptionPlan?.price || 0;
          return currentPrice > prevPrice ? current : prev;
        });
      }
    }

    const mostExpensive = activeSubscriptions.reduce((prev: any, current: any) => {
      const prevPrice = prev.subscriptionPlan?.price || 0;
      const currentPrice = current.subscriptionPlan?.price || 0;
      return currentPrice > prevPrice ? current : prev;
    });

    return mostExpensive;
  };

  const mostExpensiveSubscription = getMostExpensiveActiveSubscription();

  // Load subscription plans to determine color
  useEffect(() => {
    const targetOrgId = organization?.id || mostExpensiveSubscription?.subscriptionPlan?.organizationId;

    if (!targetOrgId) return;

    const fetchPlans = async () => {
      try {
        if (organization?.slug) {
          const result = await callAPI('/api/subscription-plan');
          if (result && typeof result === 'object' && Array.isArray(result.items) && result.items.length > 0) {
            const sortedPlans = [...result.items].sort((a, b) => a.price - b.price);
            setSubscriptionPlans(sortedPlans);
          }
        } else {
          const result = await callAPI('/api/subscription-plan');
          if (result && typeof result === 'object' && Array.isArray(result.items) && result.items.length > 0) {
            const orgPlans = result.items.filter((plan: any) => plan.organizationId === targetOrgId);
            if (orgPlans.length > 0) {
              const sortedPlans = [...orgPlans].sort((a, b) => a.price - b.price);
              setSubscriptionPlans(sortedPlans);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
      }
    };

    fetchPlans();
  }, [mostExpensiveSubscription, organization]);

  // Get color for subscription plan based on price order
  const getSubscriptionColor = (subscription: any) => {
    if (!subscription?.subscriptionPlan) {
      return { bg: 'bg-zinc-800', text: 'text-zinc-500' };
    }

    if (subscriptionPlans.length === 0) {
      const price = subscription.subscriptionPlan.price || 0;
      if (price >= 10) return { bg: 'bg-yellow-500', text: 'text-zinc-950' };
      if (price >= 5) return { bg: 'bg-purple-500', text: 'text-white' };
      if (price >= 2) return { bg: 'bg-cyan-500', text: 'text-zinc-950' };
      return { bg: 'bg-zinc-600', text: 'text-white' };
    }

    const planIndex = subscriptionPlans.findIndex(
      (plan: any) => plan.id === subscription.subscriptionPlan.id
    );

    if (planIndex === -1) {
      return { bg: 'bg-zinc-800', text: 'text-zinc-500' };
    }

    const total = subscriptionPlans.length;

    const colors = [
      { bg: 'bg-zinc-600', text: 'text-white' },
      { bg: 'bg-cyan-500', text: 'text-zinc-950' },
      { bg: 'bg-purple-500', text: 'text-white' },
      { bg: 'bg-yellow-500', text: 'text-zinc-950' },
    ];

    if (total === 1) {
      return colors[3];
    } else if (total === 2) {
      return planIndex === 0 ? colors[0] : colors[3];
    } else if (total === 3) {
      return planIndex === 0 ? colors[0] : planIndex === 1 ? colors[1] : colors[3];
    } else {
      const lastIndex = total - 1;
      const segmentSize = lastIndex / 3;

      if (planIndex === 0) {
        return colors[0];
      } else if (planIndex === lastIndex) {
        return colors[3];
      } else if (planIndex <= segmentSize) {
        return colors[1];
      } else if (planIndex <= segmentSize * 2) {
        return colors[2];
      } else {
        return colors[3];
      }
    }
  };

  const subscriptionColor = mostExpensiveSubscription
    ? getSubscriptionColor(mostExpensiveSubscription)
    : { bg: 'bg-zinc-800', text: 'text-zinc-500' };

  // Fetch public profile for non-owner visitors
  useEffect(() => {
    if (isOwner || !profileSlug) return;

    const fetchPublicProfile = async () => {
      try {
        setLoadingProfile(true);
        const API_URL = import.meta.env['PUBLIC_API_URL'];
        const response = await fetch(`${API_URL}/api/user/profile/${profileSlug}`);
        const result = await response.json();

        if (result?.status === true && result?.data) {
          setProfileData(result.data);
          const s = result.data.stats;
          setStats({
            read: s?.read || 0,
            toRead: s?.toRead || 0,
            favorites: 0,
            accountAge: s?.accountAge || 0,
            activeDaysStreak: s?.activeDaysStreak || 0,
            streak: s?.streak || 0,
            favoriteGenre: s?.favoriteGenre || null,
            hoursEstimated: s?.hoursEstimated || 0,
            weekChaptersRead: s?.weekChaptersRead || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching public profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchPublicProfile();
  }, [isOwner, profileSlug]);

  // Update editData when user changes (owner only)
  useEffect(() => {
    if (user && isOwner) {
      setEditData({
        name: user.username || '',
        avatar: user.imageUrl || '',
        banner: user.bannerUrl || '',
        description: user.description || ''
      });
      setAvatarFile(null);
      setBannerFile(null);
    }
  }, [user, isOwner]);

  // Fetch followed organizations
  useEffect(() => {
    if (isOwner) {
      if (!logged || !user) {
        setLoadingScans(false);
        return;
      }
      const fetchFollowedScans = async () => {
        try {
          setLoadingScans(true);
          const result = await callAPI("/api/organization/followed");
          setFollowedScans(Array.isArray(result) ? result : []);
        } catch (error) {
          console.error('Error fetching followed scans:', error);
          setFollowedScans([]);
        } finally {
          setLoadingScans(false);
        }
      };
      fetchFollowedScans();
    } else if (profileSlug) {
      const fetchPublicFollowedScans = async () => {
        try {
          setLoadingScans(true);
          const API_URL = import.meta.env['PUBLIC_API_URL'];
          const response = await fetch(`${API_URL}/api/user/profile/${profileSlug}/followed-scans`);
          const result = await response.json();
          if (result?.status === true && Array.isArray(result?.data)) {
            setFollowedScans(result.data);
          } else {
            setFollowedScans([]);
          }
        } catch (error) {
          console.error('Error fetching public followed scans:', error);
          setFollowedScans([]);
        } finally {
          setLoadingScans(false);
        }
      };
      fetchPublicFollowedScans();
    } else {
      setLoadingScans(false);
    }
  }, [isOwner, logged, user, profileSlug]);

  // Fetch reading history (owner only)
  useEffect(() => {
    if (!isOwner || !logged || !user) {
      setLoadingHistory(false);
      return;
    }

    const fetchReadingHistory = async () => {
      try {
        setLoadingHistory(true);
        const result = await callAPI('/api/user-chapter-history?limit=30');

        if (result && typeof result === 'object' && !Array.isArray(result) && Array.isArray(result.items)) {
          setReadingHistory(result.items);
          setHistoryTotal(result.total || result.items.length);
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
  }, [isOwner, logged, user]);

  // Fetch favorites
  useEffect(() => {
    if (isOwner) {
      if (!logged || !user) {
        setLoadingFavorites(false);
        return;
      }
      const fetchFavorites = async () => {
        try {
          setLoadingFavorites(true);
          const result = await callAPI('/api/favorites?limit=6');
          if (result && typeof result === 'object' && !Array.isArray(result) && Array.isArray(result.items)) {
            setFavorites(result.items);
            setFavoritesTotal(result.total || result.items.length);
          } else if (Array.isArray(result)) {
            setFavorites(result);
            setFavoritesTotal(result.length);
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
    } else if (profileSlug) {
      const fetchPublicFavorites = async () => {
        try {
          setLoadingFavorites(true);
          const API_URL = import.meta.env['PUBLIC_API_URL'];
          const response = await fetch(`${API_URL}/api/user/profile/${profileSlug}/favorites`);
          const result = await response.json();
          if (result?.status === true && Array.isArray(result?.data)) {
            setFavorites(result.data);
            setFavoritesTotal(result.data.length);
          } else {
            setFavorites([]);
            setFavoritesTotal(0);
          }
        } catch (error) {
          console.error('Error fetching public favorites:', error);
          setFavorites([]);
          setFavoritesTotal(0);
        } finally {
          setLoadingFavorites(false);
        }
      };
      fetchPublicFavorites();
    } else {
      setLoadingFavorites(false);
    }
  }, [isOwner, logged, user, profileSlug]);

  // Fetch achievements
  useEffect(() => {
    if (isOwner) {
      if (!logged || !user) {
        setLoadingAchievements(false);
        return;
      }
      const fetchAchievements = async () => {
        try {
          setLoadingAchievements(true);
          const result = await callAPI('/api/user/achievements');
          if (Array.isArray(result)) {
            setAchievements(result);
          }
        } catch (error) {
          console.error('Error fetching achievements:', error);
        } finally {
          setLoadingAchievements(false);
        }
      };
      fetchAchievements();
    } else if (profileData) {
      setAchievements(profileData.achievements || []);
      setCommentRank(profileData.commentRank || null);
      setLoadingAchievements(false);
    } else {
      setLoadingAchievements(false);
    }
  }, [isOwner, logged, user, profileData]);

  // Fetch stats (owner only - visitors get stats from public profile)
  useEffect(() => {
    if (!isOwner || !logged || !user) return;

    const fetchStats = async () => {
      try {
        const result = await callAPI('/api/user/stats');

        if (result) {
          setStats({
            read: result.read || 0,
            toRead: result.toRead || 0,
            favorites: favorites.length,
            accountAge: result.accountAge || 0,
            activeDaysStreak: result.activeDaysStreak || 0,
            streak: result.streak || 0,
            favoriteGenre: result.favoriteGenre || null,
            hoursEstimated: result.hoursEstimated || 0,
            weekChaptersRead: result.weekChaptersRead || 0,
          });
          if (result.commentRank) {
            setCommentRank(result.commentRank);
          }
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats({
          read: 0,
          toRead: 0,
          favorites: favorites.length,
          accountAge: user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          activeDaysStreak: 0,
          streak: 0,
          favoriteGenre: null,
          hoursEstimated: 0,
          weekChaptersRead: 0,
        });
      }
    };

    fetchStats();
  }, [isOwner, logged, user, favorites]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    if (!isUserPro && type === 'banner') return;
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'avatar') {
        setAvatarFile(file);
      } else {
        setBannerFile(file);
      }

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

      if (avatarFile) {
        const avatarKey = await uploadFile(avatarFile, undefined, 'profile_pictures');
        formData.append('image', avatarKey);
      } else if (editData.avatar && editData.avatar !== user.imageUrl && !editData.avatar.startsWith('data:')) {
        formData.append('image', editData.avatar);
      }

      if (isUserPro) {
        if (bannerFile) {
          const bannerKey = await uploadFile(bannerFile, undefined, 'profile_pictures');
          formData.append('banner', bannerKey);
        } else if (editData.banner !== user.bannerUrl) {
          if (editData.banner && !editData.banner.startsWith('data:')) {
            formData.append('banner', editData.banner);
          } else if (!editData.banner || editData.banner === '') {
            formData.append('banner', 'null');
          }
        }
      }

      if (isUserPro && editData.name !== user.username) {
        formData.append('username', editData.name);
      }

      if (isUserPro && editData.description !== (user.description || '')) {
        formData.append('description', editData.description);
      }

      const result = await callAPI(
        `/api/user/${user.id}`, { method: "PATCH", body: formData }
      );

      if (result) {
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
  };

  // Stats data - for visitors, hide "favorites" and "to read" since those are private
  const statsData = isOwner ? [
    { label: 'Leidos', value: stats.read.toString(), icon: <BookOpen className="text-cyan-500" size={18} />, tooltip: 'Capitulos que has terminado de leer' },
    { label: 'Por leer', value: stats.toRead.toString(), icon: <Bookmark className="text-purple-500" size={18} />, tooltip: 'Capitulos que empezaste pero no terminaste' },
    { label: 'Favoritos', value: stats.favorites.toString(), icon: <Heart className="text-red-500" size={18} />, tooltip: 'Mangas que guardaste en tus favoritos' },
    { label: 'Dias Activos', value: stats.activeDaysStreak.toString(), icon: <Flame className="text-orange-500" size={18} />, tooltip: 'Dias consecutivos que has visitado la plataforma' },
    { label: 'Antiguedad', value: `${stats.accountAge}d`, icon: <Calendar className="text-yellow-500" size={18} />, tooltip: 'Dias desde que creaste tu cuenta' },
    { label: 'Esta Semana', value: stats.weekChaptersRead.toString(), icon: <Zap className="text-green-500" size={18} />, tooltip: 'Capitulos leidos en los ultimos 7 dias' },
    { label: 'Horas Leidas', value: `~${stats.hoursEstimated}`, icon: <Clock className="text-orange-500" size={18} />, tooltip: 'Estimacion de horas totales de lectura' },
    { label: 'Genero Fav.', value: stats.favoriteGenre || '-', icon: <Award className="text-pink-500" size={18} />, tooltip: 'El genero que mas has leido' },
  ] : [
    { label: 'Leidos', value: stats.read.toString(), icon: <BookOpen className="text-cyan-500" size={18} />, tooltip: 'Capitulos terminados de leer' },
    { label: 'Dias Activos', value: stats.activeDaysStreak.toString(), icon: <Flame className="text-orange-500" size={18} />, tooltip: 'Dias consecutivos visitando la plataforma' },
    { label: 'Antiguedad', value: `${stats.accountAge}d`, icon: <Calendar className="text-yellow-500" size={18} />, tooltip: 'Dias desde que creo su cuenta' },
    { label: 'Esta Semana', value: stats.weekChaptersRead.toString(), icon: <Zap className="text-green-500" size={18} />, tooltip: 'Capitulos leidos en los ultimos 7 dias' },
    { label: 'Horas Leidas', value: `~${stats.hoursEstimated}`, icon: <Clock className="text-orange-500" size={18} />, tooltip: 'Estimacion de horas totales de lectura' },
    { label: 'Genero Fav.', value: stats.favoriteGenre || '-', icon: <Award className="text-pink-500" size={18} />, tooltip: 'El genero que mas ha leido' },
  ];

  const ProRestrictionTooltip = () => (
    <div className="absolute -top-10 left-0 bg-yellow-500 text-zinc-950 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
      <Info size={12} /> Para ser Miembro Pro debes tener una suscripcion activa
    </div>
  );

  const ProUnlockedTooltip = () => (
    <div className="absolute -top-10 right-0 bg-cyan-500 text-zinc-950 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl opacity-0 group-hover/unlocked:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
      <Sparkles size={12} /> Funcion disponible gracias a tu rango miembro pro
    </div>
  );

  // Loading state for public profiles
  if (!isOwner && loadingProfile) {
    return (
      <div className="pt-24 pb-20 min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-800 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm font-medium">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Profile not found
  if (!isOwner && !profileData) {
    return (
      <div className="pt-24 pb-20 min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 text-lg font-medium">Usuario no encontrado</p>
        </div>
      </div>
    );
  }

  // Owner but not logged in (shouldn't happen with new routing, but safety)
  if (isOwner && (!logged || !user)) {
    return (
      <div className="pt-24 pb-20 min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 text-lg font-medium">Por favor, inicia sesion para ver tu perfil</p>
        </div>
      </div>
    );
  }

  const displayUsername = displayUser?.username || displayUser?.email || 'Usuario';
  const displayAvatar = isOwner ? (editData.avatar || user?.imageUrl) : displayUser?.imageUrl;
  const displayBanner = isOwner ? (editData.banner || user?.bannerUrl) : displayUser?.bannerUrl;
  const displayDescription = isOwner ? editData.description : displayUser?.description;

  return (
    <div className="pt-24 pb-20 min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Profile Header */}
        <div className="relative mb-12">
          <div className="h-48 md:h-72 rounded-[40px] overflow-hidden relative border border-zinc-800 shadow-2xl">
            <img
              src={displayBanner || "https://picsum.photos/seed/bannerprof/1200/400"}
              className="w-full h-full object-cover opacity-60 transition-opacity duration-700"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          </div>

          <div className="relative -mt-16 md:-mt-20 px-8 flex flex-col md:flex-row items-end gap-6 md:gap-10">
            <div className="relative group">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-[40px] overflow-hidden border-8 border-zinc-950 bg-zinc-900 shadow-2xl relative z-10">
                <img
                  src={displayAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayUsername)}&background=27272a&color=fff&size=176`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  alt={displayUsername}
                />
              </div>
              {mostExpensiveSubscription ? (
                <div className={`absolute -bottom-2 -right-2 px-3 py-2 rounded-2xl border-4 border-zinc-950 z-20 shadow-lg ${subscriptionColor.bg} ${subscriptionColor.text} flex items-center gap-2`}>
                  <Crown size={16} fill="currentColor" />
                  <span className="text-xs font-black uppercase tracking-tight">
                    {mostExpensiveSubscription.subscriptionPlan?.name || 'Pro'}
                  </span>
                </div>
              ) : (
                <div className={`absolute -bottom-2 -right-2 p-2 rounded-2xl border-4 border-zinc-950 z-20 shadow-lg bg-zinc-800 text-zinc-500`}>
                  <Lock size={20} />
                </div>
              )}
            </div>

            <div className="flex-1 pb-4 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                  {displayUsername}
                </h1>
                {isUserPro && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest mx-auto md:mx-0">
                    <Award size={14} /> Miembro Pro
                  </div>
                )}
              </div>
              {/* Email only visible to owner */}
              {isOwner && <p className="text-zinc-500 font-bold text-base mb-2">{user?.email}</p>}
              {displayDescription && (
                <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-2xl italic">
                  "{displayDescription}"
                </p>
              )}
            </div>

            {/* Edit button - owner only */}
            {isOwner && (
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
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {isOwner ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {statsData.slice(0, 4).map((stat, idx) => (
                <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-colors flex items-center gap-5 group relative" title={stat.tooltip}>
                  <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white italic leading-none mb-1">{stat.value}</p>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                  </div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-xl border border-zinc-700">
                    {stat.tooltip}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {statsData.slice(4).map((stat, idx) => (
                <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-colors flex items-center gap-5 group relative" title={stat.tooltip}>
                  <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white italic leading-none mb-1">{stat.value}</p>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                  </div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-xl border border-zinc-700">
                    {stat.tooltip}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {statsData.map((stat, idx) => (
                <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-colors flex items-center gap-5 group relative" title={stat.tooltip}>
                  <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white italic leading-none mb-1">{stat.value}</p>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                  </div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-xl border border-zinc-700">
                    {stat.tooltip}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Reading Streak Badge */}
        {stats.streak > 0 && (
          <div className="mb-16 bg-gradient-to-r from-orange-500/10 via-yellow-500/10 to-orange-500/10 border border-orange-500/20 rounded-[32px] p-8 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-5xl">🔥</div>
              <div>
                <p className="text-3xl font-black text-white italic leading-none mb-1">
                  {stats.streak} {stats.streak === 1 ? 'Dia' : 'Dias'}
                </p>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                  Racha de Lectura
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-400 font-bold">
                {stats.streak >= 100 ? 'Legendario!' : stats.streak >= 30 ? 'Leyenda!' : stats.streak >= 7 ? 'Imparable!' : 'Sigue asi!'}
              </p>
            </div>
          </div>
        )}

        {/* Comment Rank */}
        {commentRank && (
          <div className="mb-8 bg-zinc-900/50 border border-zinc-800 rounded-[32px] p-8 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800">
                <MessageSquare className="text-cyan-500" size={24} />
              </div>
              <div>
                <p className="text-3xl font-black text-white italic leading-none mb-1">
                  #{commentRank.rank}
                </p>
                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">
                  Ranking de Comentarista
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white italic">{commentRank.count}</p>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">comentarios</p>
            </div>
          </div>
        )}

        {/* Achievements */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
              <span className="text-yellow-500">Logros</span>
              {achievements.length > 0 && (
                <span className="text-zinc-500 text-base ml-3 font-bold not-italic">
                  {achievements.filter((a: any) => a.unlocked).length}/{achievements.length}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              <Trophy size={14} /> Progreso
            </div>
          </div>
          {loadingAchievements ? (
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 animate-pulse">
                  <div className="h-10 w-10 bg-zinc-800 rounded-full mx-auto mb-2" />
                  <div className="h-3 bg-zinc-800 rounded mx-auto w-2/3" />
                </div>
              ))}
            </div>
          ) : achievements.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {achievements.map((achievement: any) => (
                <div
                  key={achievement.id}
                  className={`relative border rounded-2xl p-4 text-center transition-all group ${
                    achievement.unlocked
                      ? 'bg-zinc-900/60 border-zinc-700 hover:border-yellow-500/50'
                      : 'bg-zinc-900/20 border-zinc-800/50 opacity-50'
                  }`}
                  title={achievement.description}
                >
                  <div className={`text-3xl mb-2 ${achievement.unlocked ? '' : 'grayscale'}`}>
                    {achievement.unlocked ? achievement.emoji : (
                      <Lock size={24} className="text-zinc-600 mx-auto" />
                    )}
                  </div>
                  <p className={`text-[9px] font-black uppercase tracking-wider leading-tight ${
                    achievement.unlocked ? 'text-white' : 'text-zinc-600'
                  }`}>
                    {achievement.title}
                  </p>
                  {/* Hover tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl border border-zinc-700 w-[180px] text-center leading-tight">
                    {achievement.description}
                  </div>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <p className="text-[7px] font-bold text-zinc-600 mt-1">
                      {new Date(achievement.unlockedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-zinc-900/40 border border-zinc-800 rounded-[32px]">
              <Trophy size={32} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm font-medium">Los logros se desbloquean al leer, comentar y explorar</p>
            </div>
          )}
        </section>

        {/* Followed Scans, Favorites, Reading History */}
        <div className="grid lg:grid-cols-12 gap-10">
          <div className={`${isOwner ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-16`}>
            {/* Followed Scans Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{isOwner ? 'Mis' : 'Sus'} <span className="text-purple-500">Scans</span></h2>
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
                <div className={`grid grid-cols-1 ${isOwner ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
                  {followedScans.map((scan) => (
                    <a key={scan.id} href={`/${scan.slug}`} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[32px] group hover:bg-zinc-900 transition-all shadow-xl block">
                      <div className="flex items-start justify-between mb-4">
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

                      {/* Subscription details - owner only */}
                      {isOwner && (
                        <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                          {scan.subscription ? (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-yellow-500"><Award size={16} /></span>
                                  <span className="text-white font-bold text-sm">{scan.subscription.rank}</span>
                                </div>
                                <span className="text-white font-black text-sm italic">
                                  {scan.subscription.currency === 'USD' ? '$' : scan.subscription.currency}{scan.subscription.price}/{ { DAY: 'día', WEEK: 'sem', MONTH: 'mes', YEAR: 'año' }[scan.subscription.interval] ?? scan.subscription.interval.toLowerCase() }
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${scan.subscription.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-orange-500'}`} />
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${scan.subscription.status === 'active' ? 'text-green-500' : 'text-orange-500'}`}>
                                    {scan.subscription.status === 'active' ? 'Suscripcion Activa' : 'Suscripcion Pausada'}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSubscription(scan.id); }}
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
                              <span className="text-zinc-500 font-bold text-xs">Sin suscripcion activa</span>
                              <span
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/${scan.slug}/subscriptions`; }}
                                className="text-cyan-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors cursor-pointer"
                              >
                                Ver Planes
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-900/40 border border-zinc-800 rounded-[32px]">
                  <p className="text-zinc-500 text-lg font-medium">{isOwner ? 'No sigues ningun scan todavia' : 'No sigue ningun scan todavia'}</p>
                </div>
              )}
            </section>

            {/* Favorites Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{isOwner ? 'Mis' : 'Sus'} <span className="text-cyan-500">Favoritos</span></h2>
                {isOwner && favorites.length > 6 && !showAllFavorites && (
                  <button
                    onClick={async () => {
                      if (favorites.length < favoritesTotal) {
                        setLoadingMoreFavorites(true);
                        try {
                          const result = await callAPI(`/api/favorites?limit=${favoritesTotal}`);
                          if (Array.isArray(result)) {
                            setFavorites(result);
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
                  <div className={`grid grid-cols-2 ${isOwner ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-6`}>
                    {(showAllFavorites ? favorites : favorites.slice(0, isOwner ? 6 : 12)).map((favorite: any) => {
                      const mangaCustom = favorite.mangaCustom || favorite;
                      const orgSlug = mangaCustom.organization?.slug || '';

                      const userHasSubscription = logged && user?.subscriptions?.some(
                        (sub: any) => sub?.subscriptionPlan?.organizationId === mangaCustom.organization?.id && sub.active === true && sub?.subscriptionPlan?.canReadUnreleased === true
                      ) || false;

                      const chaptersWithReadStatus = (mangaCustom.chapters || []).map((chapter: any) => {
                        const isRead = logged && user?.history?.some(
                          (historyItem: any) => historyItem.chapterId === chapter.id && historyItem.finishedAt
                        ) || false;

                        return {
                          id: chapter.id,
                          number: chapter.number,
                          title: chapter.title,
                          releasedAt: chapter.releasedAt,
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
                            isNSFW: mangaCustom.isNSFW || mangaCustom.organization?.isNSFW || false,
                          }}
                        />
                      );
                    })}
                  </div>
                  {isOwner && showAllFavorites && favorites.length > 6 && (
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
                  <p className="text-zinc-500 text-lg font-medium">{isOwner ? 'No tienes favoritos todavia' : 'No tiene favoritos todavia'}</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar - Reading History (owner only) */}
          {isOwner && (
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
                            if (readingHistory.length < historyTotal) {
                              setLoadingMoreHistory(true);
                              try {
                                const result = await callAPI(`/api/user-chapter-history?limit=${historyTotal}`);
                                if (result && typeof result === 'object' && !Array.isArray(result) && Array.isArray(result.items)) {
                                  setReadingHistory(result.items);
                                } else if (Array.isArray(result)) {
                                  setReadingHistory(result);
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
          )}
        </div>
      </div>

      {/* Edit Profile Modal - owner only */}
      {isOwner && isEditModalOpen && (
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
                      <span className="text-white font-black text-[10px] uppercase tracking-widest">Requiere Suscripcion Activa</span>
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
                    <AlignLeft size={14} /> Biografia / Descripcion
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
                    placeholder={isUserPro ? "Escribe algo sobre ti..." : "Solo miembros Pro pueden tener una descripcion personalizada"}
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
