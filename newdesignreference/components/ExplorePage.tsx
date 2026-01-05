import React, { useState, useMemo, useEffect } from 'react';
import { ALL_MANGAS, SCANS, GENRES } from '../constants';
import MangaCard3D from './MangaCard3D';
import { Search, Filter, SlidersHorizontal, LayoutGrid, List as ListIcon, Clock, Book, ArrowRight, User } from 'lucide-react';
import { Manga } from '../types';

interface Props {
  initialScan?: string;
}

const MangaListItem: React.FC<{ manga: Manga; hideScan?: boolean }> = ({ manga, hideScan }) => {
  return (
    <div className="group relative bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4 flex items-center gap-6 hover:bg-zinc-900 hover:border-cyan-500/30 transition-all duration-300">
      {/* Cover */}
      <div className="w-20 h-28 shrink-0 rounded-lg overflow-hidden shadow-lg border border-white/5">
        <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      </div>

      {/* Info Container */}
      <div className="flex-1 min-w-0 flex flex-col py-1">
        {/* Title and Status Area */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-2">
             <h3 className="text-lg md:text-xl font-black text-white italic uppercase tracking-tight group-hover:text-cyan-400 transition-colors leading-tight break-words">
              {manga.title}
            </h3>
            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 ${manga.status === 'Ongoing' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'}`}>
              {manga.status}
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mb-3">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
            <User size={12} /> {manga.author || 'Autor Desconocido'}
          </div>
          {!hideScan && (
            <div className="flex items-center gap-1.5 text-cyan-500 text-[10px] font-black uppercase tracking-widest">
              <span className="text-zinc-700">|</span> {manga.scan}
            </div>
          )}
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-2">
          {manga.genres?.slice(0, 4).map(genre => (
            <span key={genre} className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[9px] font-bold rounded uppercase">
              {genre}
            </span>
          ))}
        </div>
      </div>

      {/* Chapters & Date (Desktop) */}
      <div className="hidden lg:flex flex-col items-end gap-2 shrink-0 pr-6 border-r border-zinc-800 min-w-[180px]">
        <div className="text-right">
          <p className="text-white font-black text-base uppercase">{manga.chapter}</p>
          <p className="text-[10px] text-zinc-500 font-medium truncate max-w-[150px]">"{manga.chapterTitle || 'Nuevo Capítulo'}"</p>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-600 text-[9px] font-bold uppercase tracking-widest">
          <Clock size={12} /> {manga.lastUpdate}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="shrink-0 flex items-center gap-3">
        <button className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-cyan-500 hover:text-zinc-950 transition-all" title="Ver Info">
          <Book size={18} />
        </button>
        <button className="hidden sm:flex items-center gap-2 bg-white text-zinc-950 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-lg shadow-black/20">
          Leer <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

const ExplorePage: React.FC<Props> = ({ initialScan = 'All' }) => {
  const [search, setSearch] = useState('');
  const [selectedScan, setSelectedScan] = useState(initialScan);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const isScanBranded = initialScan !== 'All';

  useEffect(() => {
    setSelectedScan(initialScan);
  }, [initialScan]);

  const filteredMangas = useMemo(() => {
    return ALL_MANGAS.filter(manga => {
      const matchesSearch = manga.title.toLowerCase().includes(search.toLowerCase()) || 
                           manga.author?.toLowerCase().includes(search.toLowerCase());
      const matchesScan = selectedScan === 'All' || manga.scan === selectedScan;
      const matchesStatus = selectedStatus === 'All' || manga.status === selectedStatus;
      const matchesGenre = selectedGenre === 'All' || manga.genres?.includes(selectedGenre);
      
      return matchesSearch && matchesScan && matchesStatus && matchesGenre;
    }).sort((a, b) => {
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [search, selectedScan, selectedStatus, selectedGenre, sortBy]);

  return (
    <div className="pt-24 pb-20 min-h-screen bg-zinc-950">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        
        {/* Header Section */}
        <div className="mb-12 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {!isScanBranded ? (
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                  Explorar <span className="text-cyan-500">Biblioteca</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium">
                  Descubre historias subidas por la comunidad.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-[0.3em]">
                  Catálogo Exclusivo
                </div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  Resultados de <span className="text-cyan-500">Búsqueda</span>
                </h2>
              </div>
            )}
            
            <div className={`relative flex-1 group transition-all duration-300 ${!isScanBranded ? 'max-w-xl' : 'max-w-2xl'}`}>
              <div className="absolute inset-y-0 left-4 flex items-center text-zinc-500 group-focus-within:text-cyan-500 transition-colors">
                <Search size={20} />
              </div>
              <input 
                type="text"
                placeholder={`Buscar en ${selectedScan !== 'All' ? selectedScan : 'la biblioteca'}...`}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all shadow-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 text-zinc-400 mr-2 border-r border-zinc-800 pr-4">
              <SlidersHorizontal size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Filtros</span>
            </div>

            {!isScanBranded && (
              <select 
                value={selectedScan}
                onChange={(e) => setSelectedScan(e.target.value)}
                className="bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 text-xs font-bold rounded-xl px-4 py-2 hover:border-cyan-500/50 focus:outline-none transition-all cursor-pointer"
              >
                <option value="All">Todos los Scans</option>
                {SCANS.map(scan => <option key={scan.id} value={scan.name}>{scan.name}</option>)}
              </select>
            )}

            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 text-xs font-bold rounded-xl px-4 py-2 hover:border-cyan-500/50 focus:outline-none transition-all cursor-pointer"
            >
              <option value="All">Cualquier Estado</option>
              <option value="Ongoing">En publicación</option>
              <option value="Completed">Finalizado</option>
              <option value="Hiatus">En pausa</option>
            </select>

            <select 
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 text-xs font-bold rounded-xl px-4 py-2 hover:border-cyan-500/50 focus:outline-none transition-all cursor-pointer"
            >
              <option value="All">Géneros</option>
              {GENRES.map(genre => <option key={genre} value={genre}>{genre}</option>)}
            </select>

            <div className="flex-1" />

            {/* Sort Filter */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Ordenar</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-cyan-500 text-xs font-black uppercase tracking-widest focus:outline-none cursor-pointer"
              >
                <option value="latest">Últimos</option>
                <option value="popular">Popularidad</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info & View Toggle */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            {filteredMangas.length} Resultados encontrados
          </p>
          <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-500 hover:text-white'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-500 hover:text-white'}`}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>

        {/* Results */}
        {filteredMangas.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredMangas.map((manga) => (
                <MangaCard3D key={manga.id} manga={manga} hideScan={isScanBranded} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredMangas.map((manga) => (
                <MangaListItem key={manga.id} manga={manga} hideScan={isScanBranded} />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-40 space-y-4">
            <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center text-zinc-700">
               <Filter size={40} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-white uppercase italic">No se hallaron resultados</h3>
              <p className="text-zinc-500 text-sm">Intenta ajustar los filtros.</p>
            </div>
            <button 
              onClick={() => {
                setSearch('');
                if (!isScanBranded) setSelectedScan('All');
                setSelectedGenre('All');
                setSelectedStatus('All');
              }}
              className="text-cyan-500 font-bold text-xs uppercase tracking-[0.2em] border-b border-cyan-500/30 pb-1 hover:border-cyan-500 transition-all"
            >
              Resetear Filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;