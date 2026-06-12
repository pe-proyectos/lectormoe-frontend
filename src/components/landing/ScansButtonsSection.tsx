import React, { useState, useEffect, useCallback } from 'react';
import { callAPI } from '../../util/callApi';
import { Users } from 'lucide-react';

interface Scan {
  id: string;
  name: string;
  logo?: string | null;
  url: string;
  followerCount: number;
  isNSFW?: boolean;
}

interface Props {
  onNavigate: (path: string) => void;
  nsfwMode?: boolean;
  user?: any;
  logged?: boolean;
}

const ScanPill: React.FC<{
  scan: Scan;
  onClick: () => void;
  isFollowed: boolean;
  showTooltip: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}> = ({ scan, onClick, isFollowed, showTooltip, onMouseEnter, onMouseLeave }) => (
  <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 bg-zinc-900/80 backdrop-blur-xl rounded-full hover:bg-zinc-800 transition-all group shadow-2xl ${
        isFollowed
          ? 'border border-yellow-500/70 hover:border-yellow-400'
          : 'border border-zinc-800 hover:border-cyan-500/50'
      }`}
    >
      <div className={`w-8 h-8 rounded-full overflow-hidden border transition-colors ${
        isFollowed
          ? 'border-yellow-500/70 group-hover:border-yellow-400'
          : 'border-zinc-700 group-hover:border-cyan-500/50'
      }`}>
        <img
          src={scan.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(scan.name)}&background=27272a&color=fff&size=32`}
          alt={scan.name}
          className="w-full h-full object-cover"
        />
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
        isFollowed ? 'text-yellow-400 group-hover:text-yellow-300' : 'text-white group-hover:text-cyan-400'
      }`}>
        {scan.name}
      </span>
    </button>

    {/* Follower count tooltip */}
    {showTooltip && (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-xl whitespace-nowrap">
          <Users size={11} className="text-cyan-500 flex-shrink-0" />
          <span className="text-[11px] font-bold text-white">
            {scan.followerCount.toLocaleString('es')} seguidores
          </span>
        </div>
        <div className="w-2 h-2 bg-zinc-900 border-b border-r border-zinc-700 rotate-45 mx-auto -mt-1" />
      </div>
    )}
  </div>
);

const ScansButtonsSection: React.FC<Props> = ({ onNavigate, nsfwMode = false, user, logged }) => {
  const [trendingScans, setTrendingScans] = useState<Scan[]>([]);
  const [frequentScans, setFrequentScans] = useState<Scan[]>([]);
  const [followedSlugs, setFollowedSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const navigate = useCallback((scan: Scan) => {
    const url = nsfwMode ? `/red${scan.url}` : scan.url;
    onNavigate(url);
  }, [nsfwMode, onNavigate]);

  useEffect(() => {
    const API_URL = (import.meta as any).env?.PUBLIC_API_URL ?? '';

    const fetchTrending = fetch(`${API_URL}/api/landing/scans?limit=10&sort=followers_7d`, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(r => r.json())
      .then(result => {
        const items: Scan[] = (result?.data?.items ?? []).map((s: any) => ({
          id: s.id,
          name: s.name,
          url: s.url || `/${s.id}`,
          logo: s.logo,
          followerCount: s.followerCount ?? 0,
          isNSFW: s.isNSFW,
        }));
        setTrendingScans(items);
      });

    const promises: Promise<any>[] = [fetchTrending];

    if (logged) {
      promises.push(
        callAPI('/api/organization/frequent-reads')
          .then((data: any[]) => {
            setFrequentScans((data ?? []).map(s => ({
              id: s.id ?? s.slug,
              name: s.name,
              url: s.url || `/${s.slug || s.id}`,
              logo: s.logo,
              followerCount: s.followerCount ?? 0,
              isNSFW: s.isNSFW,
            })));
          })
          .catch(() => {}),

        callAPI('/api/organization/followed')
          .then((data: any[]) => {
            setFollowedSlugs(new Set((data ?? []).map((o: any) => o.slug)));
          })
          .catch(() => {}),
      );
    }

    Promise.all(promises).finally(() => setLoading(false));
  }, [logged]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 relative z-30 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-zinc-900/80 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 relative z-30 space-y-4">
      {/* Top 10 trending — scans with most new followers this week */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {trendingScans.map(scan => (
          <ScanPill
            key={scan.id}
            scan={scan}
            onClick={() => navigate(scan)}
            isFollowed={followedSlugs.has(scan.id)}
            showTooltip={hoveredId === `t-${scan.id}`}
            onMouseEnter={() => setHoveredId(`t-${scan.id}`)}
            onMouseLeave={() => setHoveredId(null)}
          />
        ))}
      </div>

      {/* Top 5 most-read scans for the logged-in user */}
      {logged && frequentScans.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.25em] self-center">
            Tus scans
          </span>
          {frequentScans.map(scan => (
            <ScanPill
              key={scan.id}
              scan={scan}
              onClick={() => navigate(scan)}
              isFollowed={followedSlugs.has(scan.id)}
              showTooltip={hoveredId === `f-${scan.id}`}
              onMouseEnter={() => setHoveredId(`f-${scan.id}`)}
              onMouseLeave={() => setHoveredId(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ScansButtonsSection;
