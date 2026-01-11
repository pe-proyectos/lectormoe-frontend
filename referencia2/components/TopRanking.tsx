
import React, { useState } from 'react';
import { TOP_RANKING_DATA } from '../constants';
import { Trophy, TrendingUp } from 'lucide-react';

const TopRanking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8 h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Trophy size={20} />
          </div>
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Top Ranking</h3>
        </div>
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'weekly' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-500 hover:text-white'}`}
          >
            Semanal
          </button>
          <button 
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'monthly' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-500 hover:text-white'}`}
          >
            Mensual
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {TOP_RANKING_DATA.map((title, index) => (
          <div 
            key={index} 
            className="group flex items-center gap-4 py-3 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 px-3 -mx-3 rounded-xl transition-all cursor-pointer"
          >
            <span className={`text-2xl font-black italic italic tracking-tighter w-8 shrink-0 ${index < 3 ? 'text-cyan-500' : 'text-zinc-700'}`}>
              {index + 1}.
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">MANGA</span>
              <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1 leading-tight">
                {title}
              </p>
            </div>
            {index < 5 && (
              <div className="ml-auto flex items-center gap-1 text-green-500">
                <TrendingUp size={12} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopRanking;
