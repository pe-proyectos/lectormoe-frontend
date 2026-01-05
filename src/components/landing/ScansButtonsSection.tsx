
import React, { useState, useEffect } from 'react';

interface Scan {
  id: string; // This is the slug
  name: string;
  logo?: string;
  url?: string; // This is the full URL path like "/senshimanga"
}

interface Props {
  onNavigate: (scanId: string) => void;
}

const ScansButtonsSection: React.FC<Props> = ({ onNavigate }) => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env['PUBLIC_API_URL'];
        const response = await fetch(`${API_URL}/api/landing/scans`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const result = await response.json();
        
        if (result?.status === true && Array.isArray(result.data)) {
          // Map the API response to include logo
          const mappedScans = result.data.slice(0, 10).map((scan: any) => ({
            id: scan.id, // This is the slug
            name: scan.name,
            url: scan.url || `/${scan.id}`, // Use url if available, otherwise construct from id
            logo: scan.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(scan.name)}&background=27272a&color=fff&size=32`, // Fallback to generated avatar
          }));
          setScans(mappedScans);
        }
      } catch (error) {
        console.error('Error fetching scans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 relative z-30">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-zinc-900/80 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 relative z-30">
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
        {scans.map(scan => (
          <button 
            key={scan.id}
            onClick={() => {
              // Redirigir a la ruta del organization/scan
              onNavigate(scan.url);
            }}
            className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-full hover:border-cyan-500/50 hover:bg-zinc-800 transition-all group shadow-2xl"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-700 group-hover:border-cyan-500/50 transition-colors">
              <img src={scan.logo} alt={scan.name} className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-cyan-400 transition-colors">{scan.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScansButtonsSection;

