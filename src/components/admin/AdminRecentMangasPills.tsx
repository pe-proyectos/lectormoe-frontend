import React, { useState, useEffect } from 'react';
import { callAPI } from '../../util/callApi';
import { toast } from 'react-toastify';

interface AdminRecentMangasPillsProps {
  organizationSlug: string;
  language?: string;
  onMangaClick?: (manga: any) => void;
}

const AdminRecentMangasPills: React.FC<AdminRecentMangasPillsProps> = ({
  organizationSlug,
  language,
  onMangaClick,
}) => {
  const [recentMangas, setRecentMangas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentMangas();
  }, []);

  const fetchRecentMangas = () => {
    setLoading(true);
    const query = new URLSearchParams({
      order: 'latest',
      limit: '20',
    });

    callAPI(`/api/manga-custom?${query}`)
      .then((result) => {
        let mangas = [];
        if (result && typeof result === 'object' && !Array.isArray(result) && Array.isArray(result.items)) {
          mangas = result.items;
        } else if (Array.isArray(result)) {
          mangas = result.slice(0, 20);
        }
        
        // Log para debugging (puede removerse después)
        if (mangas.length > 0) {
          console.log('Estructura del primer manga:', mangas[0]);
        }
        
        setRecentMangas(mangas);
      })
      .catch((error) => {
        console.error('Error fetching recent mangas:', error);
        toast.error(error?.message || 'Error cargando mangas recientes');
      })
      .finally(() => setLoading(false));
  };

  const handleMangaClick = (manga: any) => {
    if (onMangaClick) {
      onMangaClick(manga);
    } else {
      // Normalizar la estructura del manga para asegurar que tenga toda la información necesaria
      // El API puede devolver el slug en diferentes lugares según la estructura
      const slug = manga?.slug || manga?.manga?.slug || manga?.mangaSlug;
      const id = manga?.id;
      const mangaId = manga?.mangaId || manga?.manga?.id;
      
      // Si no hay slug, intentar obtenerlo del objeto manga anidado
      if (!slug && manga?.manga) {
        console.warn('Manga sin slug encontrado:', manga);
      }
      
      const normalizedManga = {
        ...manga,
        // Asegurar que el slug esté en el nivel correcto (crítico para el diálogo)
        slug: slug,
        // Asegurar que el id esté disponible
        id: id,
        // Asegurar que el mangaId esté disponible (necesario para el diálogo)
        mangaId: mangaId,
        // Preservar la estructura original del manga si existe
        manga: manga?.manga || undefined,
      };
      
      // Emitir evento personalizado para que el grid lo escuche
      const event = new CustomEvent('openMangaDialog', { 
        detail: { manga: normalizedManga } 
      });
      window.dispatchEvent(event);
    }
  };

  // Función helper para obtener el slug del manga
  const getMangaSlug = (manga: any): string | undefined => {
    // Intentar diferentes estructuras posibles del API
    return manga?.slug || manga?.manga?.slug || manga?.mangaSlug;
  };

  // Función helper para obtener el título del manga
  const getMangaTitle = (manga: any): string => {
    return manga?.title || manga?.manga?.title || 'Sin título';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-3">
        <div className="h-6 w-16 bg-zinc-800 rounded-full animate-pulse"></div>
        <div className="h-6 w-20 bg-zinc-800 rounded-full animate-pulse"></div>
        <div className="h-6 w-14 bg-zinc-800 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (recentMangas.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 py-3 px-2">
      {recentMangas.map((manga) => {
        const mangaSlug = getMangaSlug(manga);
        const mangaTitle = getMangaTitle(manga);
        const mangaId = manga?.id || manga?.manga?.id;
        
        // Construir la URL del manga en el admin
        const mangaUrl = mangaSlug 
          ? `/${organizationSlug}/admin/mangas/${mangaSlug}`
          : '#';
        
        return (
          <a
            key={mangaId || mangaSlug || Math.random()}
            href={mangaUrl}
            onClick={(e) => {
              // Si no hay slug, usar el handler original como fallback
              if (!mangaSlug) {
                e.preventDefault();
                handleMangaClick(manga);
              }
            }}
            className="
              px-2.5 py-1 
              bg-zinc-800/60 hover:bg-zinc-700 
              text-white text-xs font-medium
              rounded-full
              transition-all duration-200
              border border-zinc-700/50 hover:border-cyan-500/50
              whitespace-nowrap
              hover:scale-105
              inline-block
            "
          >
            {mangaTitle}
          </a>
        );
      })}
    </div>
  );
};

export default AdminRecentMangasPills;
