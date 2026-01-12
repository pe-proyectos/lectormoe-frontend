import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Search, Users, Mail, User, Filter, ChevronDown } from 'lucide-react';
import AdminUserDialog from './AdminUserDialog';
import { PageNavigation } from '../PageNavigation';
import { callAPI } from '../../util/callApi';
import { getTranslator } from '../../util/translate';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Badge from './ui/Badge';
import Autocomplete from './ui/Autocomplete';

interface Subscription {
  id: number;
  active: boolean;
  subscriptionPlan: {
    name: string;
    price: number;
  };
}

interface User {
  id: number;
  username: string;
  email: string;
  imageUrl?: string | null;
  createdAt: string;
  subscriptions: Subscription[];
}

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  active: boolean;
}

interface AdminUserGridProps {
  language: string;
  subscriptionPlans: SubscriptionPlan[];
  organizationSlug: string;
  organizationId: number;
}

const PERMISSION_OPTIONS = [
  { key: 'canSeeAdminPanel', label: 'Ver panel de administración' },
  { key: 'canEditOrganization', label: 'Editar organización' },
  { key: 'canDeleteOrganization', label: 'Eliminar organización' },
  { key: 'canEditUser', label: 'Editar usuarios' },
  { key: 'canDeleteUser', label: 'Eliminar usuarios' },
  { key: 'canCreateAuthor', label: 'Crear autores' },
  { key: 'canCreateMangaProfile', label: 'Crear perfiles de manga' },
  { key: 'canCreateMangaCustom', label: 'Crear mangas personalizados' },
  { key: 'canEditMangaCustom', label: 'Editar mangas personalizados' },
  { key: 'canDeleteMangaCustom', label: 'Eliminar mangas personalizados' },
  { key: 'canCreateGenre', label: 'Crear géneros' },
  { key: 'canEditGenre', label: 'Editar géneros' },
  { key: 'canDeleteGenre', label: 'Eliminar géneros' },
  { key: 'canCreateChapter', label: 'Crear capítulos' },
  { key: 'canEditChapter', label: 'Editar capítulos' },
  { key: 'canDeleteChapter', label: 'Eliminar capítulos' },
  { key: 'canCreatePage', label: 'Crear páginas' },
  { key: 'canEditPage', label: 'Editar páginas' },
  { key: 'canDeletePage', label: 'Eliminar páginas' },
  { key: 'canCreateSubscriptionPlan', label: 'Crear planes de suscripción' },
  { key: 'canEditSubscriptionPlan', label: 'Editar planes de suscripción' },
  { key: 'canDeleteSubscriptionPlan', label: 'Eliminar planes de suscripción' },
  { key: 'canDeleteComment', label: 'Eliminar comentarios' },
  { key: 'canEditComment', label: 'Editar comentarios' },
  { key: 'canHideComment', label: 'Ocultar comentarios' },
  { key: 'hideAds', label: 'Ocultar anuncios' },
  { key: 'canDownload', label: 'Descargar' },
  { key: 'canReadUnreleased', label: 'Leer no publicados' },
];

const AdminUserGrid: React.FC<AdminUserGridProps> = ({ language, subscriptionPlans, organizationSlug, organizationId }) => {
  const _ = getTranslator(language);

  const [loading, setLoading] = useState(true);
  const [userList, setUserList] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [email, setEmail] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('email') || '';
  });
  const [username, setUsername] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('username') || '';
  });
  const [selectedSubscriptionPlanIds, setSelectedSubscriptionPlanIds] = useState<number[]>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planIds = urlParams.get('selectedSubscriptionPlans');
    return planIds ? planIds.split(',').map(Number).filter(Boolean) : [];
  });
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const permissionKeys = urlParams.get('permissionKeys');
    return permissionKeys ? permissionKeys.split(',').filter(Boolean) : [];
  });
  const [orderBy, setOrderBy] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('order') || 'createdAt_desc';
  });
  const [page, setPage] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return Number(urlParams.get('page')) || 1;
  });
  const [maxPage, setMaxPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return Number(urlParams.get('limit')) || 24;
  });

  // Cargar lista inicial
  useEffect(() => {
    refreshUserList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refrescar cuando cambie la página
  useEffect(() => {
    refreshUserList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Refrescar cuando cambien los filtros (excepto en el montaje inicial)
  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef({
    orderBy,
    limit,
    selectedSubscriptionPlanIds: JSON.stringify([...selectedSubscriptionPlanIds].sort()),
    selectedPermissionKeys: JSON.stringify([...selectedPermissionKeys].sort()),
    email,
    username,
    page
  });
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevFiltersRef.current = {
        orderBy,
        limit,
        selectedSubscriptionPlanIds: JSON.stringify([...selectedSubscriptionPlanIds].sort()),
        selectedPermissionKeys: JSON.stringify([...selectedPermissionKeys].sort()),
        email,
        username,
        page
      };
      return;
    }
    
    const currentFilters = {
      orderBy,
      limit,
      selectedSubscriptionPlanIds: JSON.stringify([...selectedSubscriptionPlanIds].sort()),
      selectedPermissionKeys: JSON.stringify([...selectedPermissionKeys].sort()),
      email,
      username,
      page
    };
    
    // Verificar si realmente cambiaron los filtros (no la página)
    const filtersChanged = 
      prevFiltersRef.current.orderBy !== currentFilters.orderBy ||
      prevFiltersRef.current.limit !== currentFilters.limit ||
      prevFiltersRef.current.selectedSubscriptionPlanIds !== currentFilters.selectedSubscriptionPlanIds ||
      prevFiltersRef.current.selectedPermissionKeys !== currentFilters.selectedPermissionKeys ||
      prevFiltersRef.current.email !== currentFilters.email ||
      prevFiltersRef.current.username !== currentFilters.username;
    
    if (filtersChanged) {
      prevFiltersRef.current = currentFilters;
      // Si la página ya es 1, refrescar directamente
      if (page === 1) {
        refreshUserList(1);
      } else {
        setPage(1);
      }
    } else {
      // Si solo cambió la página, actualizar la referencia
      prevFiltersRef.current.page = page;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderBy, limit, selectedSubscriptionPlanIds, selectedPermissionKeys, email, username, page]);

  useEffect(() => {
    if (!isUserDialogOpen) refreshUserList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserDialogOpen]);

  const handleCardClick = (user: User) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };

  const refreshUserList = React.useCallback((currentPage?: number) => {
    setLoading(true);
    const pageToUse = currentPage !== undefined ? currentPage : page;
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('page', pageToUse.toString());
    urlParams.set('limit', limit.toString());
    urlParams.set('order', orderBy);
    const query = new URLSearchParams({
      page: pageToUse.toString(),
      limit: limit.toString(),
      order: orderBy,
    });
    if (email) {
      query.set('email', email);
      urlParams.set('email', email);
    }
    if (username) {
      query.set('username', username);
      urlParams.set('username', username);
    }
    if (selectedSubscriptionPlanIds.length > 0) {
      query.set('subscriptionPlanIds', selectedSubscriptionPlanIds.join(','));
      urlParams.set('selectedSubscriptionPlans', selectedSubscriptionPlanIds.join(','));
    }
    if (selectedPermissionKeys.length > 0) {
      query.set('permissionKeys', selectedPermissionKeys.join(','));
      urlParams.set('permissionKeys', selectedPermissionKeys.join(','));
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    callAPI(`/api/user?${query}`)
      .then((result: any) => {
        // El API retorna { items: [...], maxPage: X, total: Y }
        if (result && typeof result === 'object' && !Array.isArray(result) && Array.isArray(result.items)) {
          setTotal(result.total || 0);
          setUserList(result.items);
          setMaxPage(result.maxPage || 1);
        }
      })
      .catch((error: any) => toast.error(error?.message))
      .finally(() => setLoading(false));
  }, [page, limit, orderBy, email, username, selectedSubscriptionPlanIds, selectedPermissionKeys]);

  const handleSubscriptionPlanToggle = (planId: number) => {
    setSelectedSubscriptionPlanIds((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]
    );
  };

  return (
    <div className="w-full my-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
          <Users className="text-white" size={24} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{_('user_list')}</h2>
          <p className="text-gray-400 text-xs sm:text-sm">{total || '-'} usuarios en total</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label={_('search_email')}
            placeholder={_('search_by_email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
          />
          <Input
            label={_('search_username')}
            placeholder={_('search_by_username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<User size={18} />}
          />
          <Select
            label={_('order_by')}
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
          >
            <option value="createdAt_desc">{_('registration_date_newest_first')}</option>
            <option value="createdAt_asc">{_('registration_date_oldest_first')}</option>
            <option value="username_asc">{_('username_a_z')}</option>
            <option value="username_desc">{_('username_z_a')}</option>
          </Select>
          <Select
            label={_('show')}
            value={limit.toString()}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value="12">12</option>
            <option value="24">24</option>
            <option value="48">48</option>
            <option value="96">96</option>
          </Select>
          
          {/* Subscription Plans Filter */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {_('subscription_plan')}
            </label>
            <div className="flex flex-wrap gap-2">
              {subscriptionPlans
                .filter((plan) => plan.active)
                .sort((a, b) => a.price - b.price)
                .map((plan) => (
                  <Badge
                    key={plan.id}
                    variant={selectedSubscriptionPlanIds.includes(plan.id) ? 'default' : 'outline'}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleSubscriptionPlanToggle(plan.id)}
                  >
                    ${plan.price} - {plan.name}
                  </Badge>
                ))}
            </div>
          </div>
          
          {/* Permissions Filter */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filtros de permisos
            </label>
            <Autocomplete
              multiple
              options={PERMISSION_OPTIONS}
              value={selectedPermissionKeys.map(key => {
                const option = PERMISSION_OPTIONS.find(opt => opt.key === key);
                return option || { key, label: key };
              })}
              onChange={(event, newValue) => {
                const keys = Array.isArray(newValue) ? newValue.map(v => v.key) : [];
                setSelectedPermissionKeys(keys);
              }}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.key === value.key}
              placeholder="Seleccionar permisos..."
            />
          </div>
          
          <div className="col-span-full">
            <Button onClick={refreshUserList} icon={<Search size={18} />}>
              {_('search')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Pagination Top */}
      <div className="flex items-center justify-center mb-6">
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
          <PageNavigation
            language={language}
            page={page}
            maxPage={maxPage}
            setPage={setPage}
            loading={loading}
            data={userList}
          />
        </div>
      </div>

      {/* User Dialog */}
      <AdminUserDialog
        language={language}
        open={isUserDialogOpen}
        setOpen={setIsUserDialogOpen}
        user={selectedUser}
        setUser={setSelectedUser}
        subscriptionPlans={subscriptionPlans}
        organizationSlug={organizationSlug}
        organizationId={organizationId}
      />

      {/* Loading & Empty States */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!loading && userList.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400">{_('no_users_to_show')}</p>
          </div>
        </Card>
      )}

      {/* User Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {userList.map((user) => (
          <Card
            key={user.id}
            className="cursor-pointer hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1"
            onClick={() => handleCardClick(user)}
          >
            <div className="flex items-start justify-between mb-4 gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-zinc-700"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 border-2 border-zinc-700">
                    <User className="text-zinc-400" size={24} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1 truncate">{user.username}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm break-all">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="font-medium">Fecha de registro:</span>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>

              {user.subscriptions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-300">{_('subscription_plans')}</p>
                  <div className="space-y-1">
                    {user.subscriptions.map((subscription) => (
                      <div
                        key={subscription.id}
                        className="flex items-center gap-2 text-sm bg-gray-800/50 p-2 rounded-lg"
                      >
                        <span>{subscription.active ? '✅' : '❌'}</span>
                        <span className="text-gray-300">
                          {subscription.subscriptionPlan.name}
                        </span>
                        <span className="text-green-400 ml-auto">
                          ${subscription.subscriptionPlan.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination Bottom */}
      {!loading && userList.length > 0 && (
        <div className="flex items-center justify-center mt-6">
          <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
            <PageNavigation
              language={language}
              page={page}
              maxPage={maxPage}
              setPage={setPage}
              loading={loading}
              data={userList}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserGrid;

