
import React, { useMemo } from 'react';
import { SCANS, ALL_MANGAS } from '../constants';
import ScanHero from './ScanHero';
import ScanStatsBar from './ScanStatsBar';
import ScanTopThree from './ScanTopThree';
import ScanPopular24h from './ScanPopular24h';
import ScanRecentUpdates from './ScanRecentUpdates';
import ScanSidebar from './ScanSidebar';

interface Props {
  scanId: string;
}

const ScanLanding: React.FC<Props> = ({ scanId }) => {
  const scan = useMemo(() => SCANS.find(s => s.id === scanId) || SCANS[0], [scanId]);
  
  const scanMangas = useMemo(() => ALL_MANGAS.filter(m => m.scan === scan.name), [scan.name]);
  
  const featuredMangas = useMemo(() => 
    scanMangas.length > 0 ? scanMangas.slice(0, 5) : ALL_MANGAS.slice(0, 5)
  , [scanMangas]);

  // Top 3 histórico
  const top3Mangas = useMemo(() => scanMangas.slice(0, 3), [scanMangas]);
  
  // Populares 24h (Simulando 9 mangas)
  const popular24h = useMemo(() => 
    scanMangas.length > 0 
      ? Array(Math.min(9, scanMangas.length * 3)).fill(null).map((_, i) => scanMangas[i % scanMangas.length])
      : []
  , [scanMangas]);
  
  // Actualizados recientemente (Simulando 18 mangas)
  const recentUpdates = useMemo(() => 
    scanMangas.length > 0
      ? Array(Math.min(18, scanMangas.length * 5)).fill(null).map((_, i) => scanMangas[i % scanMangas.length])
      : []
  , [scanMangas]);

  const handleGoToSub = () => {
    window.location.hash = `#/subscriptions/${scan.id}`;
  };

  const handleGoToExplore = () => {
    window.location.hash = '#explore';
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <ScanHero mangas={featuredMangas} />
      
      <ScanStatsBar scan={scan} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* COLUMNA PRINCIPAL */}
          <div className="lg:col-span-8 space-y-20">
            <ScanTopThree mangas={top3Mangas} />

            <ScanPopular24h mangas={popular24h} />

            <ScanRecentUpdates 
              mangas={recentUpdates} 
              onExploreClick={handleGoToExplore} 
            />
          </div>

          {/* SIDEBAR DERECHO */}
          <ScanSidebar onSubscribeClick={handleGoToSub} />
        </div>
      </div>
    </div>
  );
};

export default ScanLanding;
