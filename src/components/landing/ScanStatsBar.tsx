import React, { useState, useEffect } from 'react';
import { Users, BookOpen, ShieldAlert, Facebook, Instagram, MessageSquare, Star, Loader2 } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface ScanStatsBarProps {
  organization: any;
  user?: any;
  logged?: boolean;
}

const ScanStatsBar: React.FC<ScanStatsBarProps> = ({ organization, user, logged }) => {
  const [isFollowed, setIsFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState(organization?.followerCount || 0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize follower count from organization data
    if (organization?.followerCount !== undefined) {
      setFollowerCount(organization.followerCount);
    }

    // Check if user is following this organization
    const checkFollowStatus = async () => {
      if (logged && user) {
        try {
          const API_URL = import.meta.env.PUBLIC_API_URL;
          const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
          
          const response = await fetch(`${API_URL}/api/organization/${organization?.slug}/follow/status`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            const result = await response.json();
            if (result?.status === true && result?.data) {
              setIsFollowed(result.data.isFollowing);
            }
          }
        } catch (error) {
          console.error('Error checking follow status:', error);
        }
      }
    };

    checkFollowStatus();
  }, [organization, logged, user]);

  const handleFollow = async () => {
    if (!logged) {
      // Redirect to login
      window.location.href = `/${organization?.slug}/login`;
      return;
    }

    if (isLoading) {
      return; // Prevent multiple clicks
    }

    setIsLoading(true);

    try {
      const API_URL = import.meta.env.PUBLIC_API_URL;
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const method = isFollowed ? 'DELETE' : 'POST';
      
      const response = await fetch(`${API_URL}/api/organization/${organization?.slug}/follow`, {
        method,
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.status === true && result?.data) {
          setIsFollowed(result.data.followed);
          setFollowerCount(result.data.followerCount);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/50 border-b border-zinc-800 py-4">
      <div className="max-w-7xl mx-auto px-3 md:px-8 flex flex-wrap items-center justify-center gap-4 md:justify-between md:gap-0">
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
              <img 
                src={organization.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(organization.name)}&background=27272a&color=fff&size=32`} 
                alt="" 
                className="w-full h-full object-cover" 
              />
            </div>
            <span className="text-white font-black uppercase tracking-tighter text-sm italic">{organization.name}</span>
          </div>
          <div className="hidden md:block h-4 w-px bg-zinc-800" />
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <Users size={12} /> {followerCount.toLocaleString()} Seguidores
          </span>
          {(organization?.mangaCount ?? 0) > 0 && (
            <>
              <div className="hidden md:block h-4 w-px bg-zinc-800" />
              <span className="hidden md:flex text-zinc-500 text-[10px] font-bold uppercase tracking-widest items-center gap-2">
                <BookOpen size={12} /> {(organization.mangaCount as number).toLocaleString()} {organization.mangaCount === 1 ? 'Proyecto' : 'Proyectos'}
              </span>
            </>
          )}
          {(organization?.nsfwMangaCount ?? 0) > 0 && (
            <>
              <div className="hidden md:block h-4 w-px bg-zinc-800" />
              <span className="hidden md:flex text-zinc-500 text-[10px] font-bold uppercase tracking-widest items-center gap-2">
                <ShieldAlert size={12} className="text-red-500" /> {(organization.nsfwMangaCount as number).toLocaleString()} NSFW
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Social Links */}
          <div className="flex items-center gap-4">
            {organization.facebookUrl && (
              <a href={organization.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors" title="Facebook">
                <Facebook size={16} />
              </a>
            )}
            {organization.discordUrl && (
              <a href={organization.discordUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors" title="Discord">
                <MessageSquare size={16} />
              </a>
            )}
            {organization.instagramUrl && (
              <a href={organization.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors" title="Instagram">
                <Instagram size={16} />
              </a>
            )}
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Follow Button */}
          <button 
            onClick={handleFollow}
            disabled={isLoading}
            className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
              isLoading
                ? 'text-zinc-500 cursor-not-allowed opacity-60'
                : isFollowed 
                  ? 'text-yellow-500 hover:text-yellow-400' 
                  : 'text-cyan-500 hover:text-white'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Cargando...</span>
              </>
            ) : (
              <>
                {!isFollowed && <span>Seguir al Scan</span>}
                <Star 
                  size={18} 
                  fill={isFollowed ? "currentColor" : "none"} 
                  className={isFollowed ? "animate-in zoom-in duration-300" : "hover:scale-110 transition-transform"} 
                />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanStatsBar;

