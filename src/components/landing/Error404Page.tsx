import React from 'react';
import { Home, Search, AlertCircle } from 'lucide-react';

interface Error404PageProps {
  onNavigateHome?: () => void;
  onNavigateSearch?: () => void;
}

const Error404Page: React.FC<Error404PageProps> = ({ 
  onNavigateHome, 
  onNavigateSearch 
}) => {
  const handleNavigateHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleNavigateSearch = () => {
    if (onNavigateSearch) {
      onNavigateSearch();
    } else {
      window.location.href = '/search';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Animated 404 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
          </div>
          <div className="relative">
            <h1 className="text-[180px] md:text-[240px] font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-600 leading-none italic tracking-tighter">
              404
            </h1>
          </div>
        </div>

        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-zinc-900 border-4 border-zinc-800 rounded-full flex items-center justify-center">
            <AlertCircle size={40} className="text-cyan-400" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
            Página no encontrada
          </h2>
          <p className="text-lg text-zinc-400 font-medium max-w-md mx-auto">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <button
            onClick={handleNavigateHome}
            className="group w-full sm:w-auto bg-white hover:bg-cyan-400 text-zinc-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-white/10 hover:shadow-cyan-400/20 active:scale-95 flex items-center justify-center gap-3"
          >
            <Home size={20} className="group-hover:scale-110 transition-transform" />
            Ir al inicio
          </button>
          <button
            onClick={handleNavigateSearch}
            className="group w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Search size={20} className="group-hover:scale-110 transition-transform" />
            Buscar manga
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="pt-12 flex justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-zinc-800 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Error404Page;

