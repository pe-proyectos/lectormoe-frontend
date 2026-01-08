import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Plus, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import AdminMangaCustomCard from './AdminMangaCustomCard';
import { AdminMangaCustomDialog } from './AdminMangaCustomDialog';
import { callAPI } from '../../util/callApi';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';

interface AdminMangaCustomGridProps {
  organization: any;
  language?: string;
  organizationSlug: string;
}

const AdminMangaCustomGrid: React.FC<AdminMangaCustomGridProps> = ({
  organization,
  language,
  organizationSlug,
}) => {
  const [loading, setLoading] = useState(true);
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedManga, setSelectedManga] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    refreshMangaProfile();
    refreshSubscriptionPlans();
  }, [page, debouncedSearchTerm]);

  useEffect(() => {
    if (!isDialogOpen) {
      refreshMangaProfile();
      setSelectedManga(null);
    }
  }, [isDialogOpen]);

  const refreshMangaProfile = useCallback(() => {
    setLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      order: 'latest',
      limit: '20',
    });

    if (debouncedSearchTerm.trim()) {
      query.append('search', debouncedSearchTerm.trim());
    }

    callAPI(`/api/manga-custom?${query}`)
      .then((result) => {
        if (result && Array.isArray(result.data)) {
          setMangaList(result.data);
          setMaxPage(result.maxPage || 1);
          setTotal(result.total || 0);
        } else if (Array.isArray(result)) {
          setMangaList(result);
          setMaxPage(1);
          setTotal(result.length);
        }
      })
      .catch((error) => toast.error(error?.message || 'Error cargando mangas'))
      .finally(() => setLoading(false));
  }, [page, debouncedSearchTerm]);

  const refreshSubscriptionPlans = () => {
    return callAPI(`/api/subscription-plan`)
      .then((result) => {
        if (result && Array.isArray(result.data)) {
          setSubscriptionPlans(result.data);
        } else if (Array.isArray(result)) {
          setSubscriptionPlans(result);
        }
      })
      .catch((error) => toast.error(error?.message || 'Error cargando planes de suscripción'));
  };

  const handleCardClick = (mangaCustom: any) => {
    setSelectedManga(mangaCustom);
    setIsDialogOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearchTerm(searchTerm);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < maxPage) setPage(page + 1);
  };

  return (
    <div className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6">
      {/* Dialog */}
      <AdminMangaCustomDialog
        organization={organization}
        language={language}
        open={isDialogOpen}
        setOpen={setIsDialogOpen}
        mangaCustom={selectedManga}
        setMangaCustom={setSelectedManga}
        subscriptionPlans={subscriptionPlans}
      />

      {/* Header */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <Button
            variant="primary"
            onClick={() => {
              setSelectedManga(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus size={20} />
            Agregar Manga
          </Button>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
            <Input
              type="text"
              placeholder="Buscar manga..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pr-10"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-cyan-500 transition-colors"
            >
              <Search size={20} />
            </button>
          </form>
        </div>

        {/* Results info */}
        {!loading && (
          <div className="mt-4 text-sm text-zinc-400">
            Mostrando{' '}
            <span className="font-bold text-white">
              {mangaList.length > 0 ? (page - 1) * 20 + 1 : 0}
            </span>
            {' - '}
            <span className="font-bold text-white">
              {Math.min(page * 20, total)}
            </span>
            {' de '}
            <span className="font-bold text-white">{total}</span>
            {' mangas'}
          </div>
        )}
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-cyan-500 animate-spin" />
            <span className="text-zinc-400 font-medium">Cargando mangas...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && mangaList.length === 0 && (
        <Card className="text-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-zinc-800 rounded-full">
              <Search size={48} className="text-zinc-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2">
                No se encontraron mangas
              </h3>
              <p className="text-zinc-400">
                {searchTerm
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza agregando tu primer manga'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Grid */}
      {!loading && mangaList.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {mangaList.map((manga) => (
              <AdminMangaCustomCard
                key={manga.id || manga.slug}
                language={language}
                mangaCustom={manga}
                onClick={handleCardClick}
                organizationSlug={organizationSlug}
              />
            ))}
          </div>

          {/* Pagination */}
          {maxPage > 1 && (
            <Card>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="w-full sm:w-auto"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>

                <span className="text-xs sm:text-sm font-bold text-zinc-400 text-center">
                  Página <span className="text-white">{page}</span> de{' '}
                  <span className="text-white">{maxPage}</span>
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={page === maxPage}
                  className="w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AdminMangaCustomGrid;

