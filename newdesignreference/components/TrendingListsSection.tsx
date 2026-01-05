
import React from 'react';
import { TRENDING_LISTS } from '../constants';
import { Layers, Users, ChevronRight } from 'lucide-react';

const TrendingListsSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Layers size={20} />
            </div>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Listas de moda</h3>
          </div>
          <button className="text-[10px] font-black text-zinc-500 hover:text-cyan-400 uppercase tracking-widest flex items-center gap-1 transition-colors">
            Ver todas <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TRENDING_LISTS.slice(0, 2).map((list) => (
            <div key={list.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-purple-500/30 transition-all group cursor-pointer">
              <h4 className="text-white font-black italic text-lg mb-2 group-hover:text-purple-400 transition-colors">{list.title}</h4>
              <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <span>{list.count} Obras</span>
                <span className="flex items-center gap-1"><Users size={12} /> {list.followers}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users size={20} />
            </div>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Listas más seguidas</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TRENDING_LISTS.slice(2, 4).map((list) => (
            <div key={list.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-blue-500/30 transition-all group cursor-pointer">
              <h4 className="text-white font-black italic text-lg mb-2 group-hover:text-blue-400 transition-colors">{list.title}</h4>
              <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <span>{list.count} Obras</span>
                <span className="flex items-center gap-1"><Users size={12} /> {list.followers}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingListsSection;
