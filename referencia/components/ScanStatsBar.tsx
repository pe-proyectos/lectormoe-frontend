
import React, { useState } from 'react';
import { Users, Facebook, Instagram, MessageSquare, Star } from 'lucide-react';
import { Scan } from '../types';

interface ScanStatsBarProps {
  scan: Scan;
}

const ScanStatsBar: React.FC<ScanStatsBarProps> = ({ scan }) => {
  const [isFollowed, setIsFollowed] = useState(false);

  return (
    <div className="bg-zinc-900/50 border-b border-zinc-800 py-4">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
              <img src={scan.logo} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-black uppercase tracking-tighter text-sm italic">{scan.name}</span>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <Users size={12} /> {scan.memberCount.toLocaleString()} Seguidores
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-zinc-500 hover:text-white transition-colors" title="Facebook">
              <Facebook size={16} />
            </a>
            <a href="#" className="text-zinc-500 hover:text-white transition-colors" title="Discord">
              <MessageSquare size={16} />
            </a>
            <a href="#" className="text-zinc-500 hover:text-white transition-colors" title="Instagram">
              <Instagram size={16} />
            </a>
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Follow Button */}
          <button 
            onClick={() => setIsFollowed(!isFollowed)}
            className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
              isFollowed 
                ? 'text-yellow-500' 
                : 'text-cyan-500 hover:text-white'
            }`}
          >
            {!isFollowed && <span>Seguir al Scan</span>}
            <Star 
              size={18} 
              fill={isFollowed ? "currentColor" : "none"} 
              className={isFollowed ? "animate-in zoom-in duration-300" : "hover:scale-110 transition-transform"} 
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanStatsBar;
