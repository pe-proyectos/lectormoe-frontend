
import React, { useState } from 'react';
import { USER_PENDING, USER_FOLLOWING, USER_FAVORITES } from '../constants';
import MangaCard3D from './MangaCard3D';
import { Bookmark, Heart, Bell } from 'lucide-react';

type TabType = 'pending' | 'following' | 'favorites';

const UserLists: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  const getActiveData = () => {
    switch (activeTab) {
      case 'pending': return USER_PENDING;
      case 'following': return USER_FOLLOWING;
      case 'favorites': return USER_FAVORITES;
      default: return [];
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pendiente', icon: <Bookmark size={14} /> },
    { id: 'following', label: 'Siguiendo', icon: <Bell size={14} /> },
    { id: 'favorites', label: 'Favorito', icon: <Heart size={14} /> },
  ];

  return (
    <section className="bg-zinc-950 py-16 border-b border-zinc-900/50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Mis Capítulos <span className="text-cyan-500">Pendientes</span></h2>
            <p className="text-zinc-500 text-sm font-medium">Continúa donde lo dejaste y mantente al día con tus scans.</p>
          </div>

          <div className="flex items-center p-1.5 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-cyan-500 text-zinc-950 shadow-lg shadow-cyan-500/20 scale-105' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 min-h-[300px]">
          {getActiveData().map((manga) => (
            <MangaCard3D key={`user-${activeTab}-${manga.id}`} manga={manga} />
          ))}
          {getActiveData().length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4">
               <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700">
                  <Bookmark size={30} />
               </div>
               <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No tienes mangas en esta categoría</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default UserLists;
