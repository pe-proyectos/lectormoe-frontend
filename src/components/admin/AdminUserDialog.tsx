import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { User, Shield, CreditCard, Check, X, Settings } from 'lucide-react';
import { callAPI } from '../../util/callApi';
import { getTranslator } from '../../util/translate';
import { ImageDropzone } from '../ImageDropzone';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  active: boolean;
}

interface Subscription {
  id: number;
  active: boolean;
  startDate: string;
  endDate: string | null;
  lastPayment: string | null;
  nextPayment: string | null;
  status: string;
  paypalSubscriptionId: string;
  subscriptionPlan: {
    name: string;
    price: number;
  };
}

interface UserPermissions {
  role?: string;
  hierarchyLevel?: number;
  canSeeAdminPanel?: boolean;
  canEditOrganization?: boolean;
  canDeleteOrganization?: boolean;
  canEditUser?: boolean;
  canDeleteUser?: boolean;
  canCreateAuthor?: boolean;
  canCreateMangaProfile?: boolean;
  canCreateMangaCustom?: boolean;
  canEditMangaCustom?: boolean;
  canDeleteMangaCustom?: boolean;
  canCreateGenre?: boolean;
  canEditGenre?: boolean;
  canDeleteGenre?: boolean;
  canCreateChapter?: boolean;
  canEditChapter?: boolean;
  canDeleteChapter?: boolean;
  canCreatePage?: boolean;
  canEditPage?: boolean;
  canDeletePage?: boolean;
  canCreateSubscriptionPlan?: boolean;
  canEditSubscriptionPlan?: boolean;
  canDeleteSubscriptionPlan?: boolean;
  canDeleteComment?: boolean;
  canEditComment?: boolean;
  canHideComment?: boolean;
  hideAds?: boolean;
  canDownload?: boolean;
  canReadUnreleased?: boolean;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  description?: string;
  subscriptions: Subscription[];
  permissions?: UserPermissions;
}

interface AdminUserDialogProps {
  language: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  subscriptionPlans: SubscriptionPlan[];
}

const AdminUserDialog: React.FC<AdminUserDialogProps> = ({
  language,
  open,
  setOpen,
  user,
  setUser,
  subscriptionPlans,
}) => {
  const _ = getTranslator(language);

  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<'user' | 'permissions' | 'subscriptions'>('user');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [hierarchyLevel, setHierarchyLevel] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    canSeeAdminPanel: false,
    canEditOrganization: false,
    canDeleteOrganization: false,
    canEditUser: false,
    canDeleteUser: false,
    canCreateAuthor: false,
    canCreateMangaProfile: false,
    canCreateMangaCustom: false,
    canEditMangaCustom: false,
    canDeleteMangaCustom: false,
    canCreateGenre: false,
    canEditGenre: false,
    canDeleteGenre: false,
    canCreateChapter: false,
    canEditChapter: false,
    canDeleteChapter: false,
    canCreatePage: false,
    canEditPage: false,
    canDeletePage: false,
    canCreateSubscriptionPlan: false,
    canEditSubscriptionPlan: false,
    canDeleteSubscriptionPlan: false,
    canDeleteComment: false,
    canEditComment: false,
    canHideComment: false,
    hideAds: false,
    canDownload: false,
    canReadUnreleased: false,
  });

  useEffect(() => {
    if (!user) return;
    const userPermissions = user.permissions || {};
    // Solo leer los valores para mostrar, no para editar
    setRole(userPermissions.role || 'user');
    setDescription(user.description || '');
    setHierarchyLevel(userPermissions.hierarchyLevel || 0);
    
    // Solo cargar permisos relacionados con la organización
    const newPermissions: Record<string, boolean> = {};
    Object.keys(permissions).forEach((key) => {
      newPermissions[key] = (userPermissions as any)[key] || false;
    });
    setPermissions(newPermissions);
  }, [user]);

  const handleSubmit = async () => {
    // Los admins solo pueden editar permisos, no información personal
    const formData = new FormData();
    formData.append('hierarchyLevel', hierarchyLevel.toString());
    
    // Solo enviar permisos relacionados con la organización
    Object.keys(permissions).forEach((key) => {
      formData.append(key, permissions[key].toString());
    });
    
    setLoading(true);
    callAPI(user ? `/api/user/${user.id}` : '/api/user', {
      method: user ? 'PATCH' : 'POST',
      body: formData,
    })
      .then(() => {
        toast.success(_('user_updated'));
        setUser(null);
        setRole('user');
        setDescription('');
        setHierarchyLevel(0);
        const permissionsSetToFalse: Record<string, boolean> = {};
        Object.keys(permissions).forEach((key) => {
          permissionsSetToFalse[key] = false;
        });
        setPermissions(permissionsSetToFalse);
        setImageFile(null);
        setOpen(false);
      })
      .catch((error: any) => toast.error(error?.message))
      .finally(() => setLoading(false));
  };

  const handleDeactivateSubscription = async (subscriptionId: number, userId: number) => {
    const formData = new FormData();
    formData.append('active', 'false');
    formData.append('userId', userId.toString());
    callAPI(`/api/subscription/${subscriptionId}`, {
      method: 'PATCH',
      body: formData,
    })
      .then(() => {
        toast.success(_('subscription_deactivated') || 'Suscripción pausada');
        setOpen(false);
      })
      .catch((error: any) => toast.error(error?.message));
  };


  const permissionSections = [
    {
      title: _('general'),
      permissions: [
        { key: 'canSeeAdminPanel', label: _('can_see_admin_panel') },
        { key: 'canEditOrganization', label: _('can_edit_organization') },
        { key: 'canDeleteOrganization', label: _('can_delete_organization') },
      ],
    },
    {
      title: _('users'),
      permissions: [{ key: 'canEditUser', label: _('can_edit_user') }],
    },
    {
      title: _('content'),
      permissions: [
        { key: 'canCreateAuthor', label: _('can_create_author') },
        { key: 'canCreateMangaProfile', label: _('can_create_manga_profile') },
        { key: 'canCreateMangaCustom', label: _('can_create_manga') },
        { key: 'canEditMangaCustom', label: _('can_edit_manga') },
        { key: 'canDeleteMangaCustom', label: _('can_delete_manga') },
        { key: 'canCreateGenre', label: _('can_create_genre') },
        { key: 'canEditGenre', label: _('can_edit_genre') },
        { key: 'canDeleteGenre', label: _('can_delete_genre') },
        { key: 'canCreateChapter', label: _('can_create_chapter') },
        { key: 'canEditChapter', label: _('can_edit_chapter') },
        { key: 'canDeleteChapter', label: _('can_delete_chapter') },
        { key: 'canCreatePage', label: _('can_create_page') },
        { key: 'canEditPage', label: _('can_edit_page') },
        { key: 'canDeletePage', label: _('can_delete_page') },
      ],
    },
    {
      title: _('subscription_plans'),
      permissions: [
        { key: 'canCreateSubscriptionPlan', label: _('can_create_subscription_plan') },
        { key: 'canEditSubscriptionPlan', label: _('can_edit_subscription_plan') },
        { key: 'canDeleteSubscriptionPlan', label: _('can_delete_subscription_plan') },
        { key: 'canDeleteComment', label: _('can_delete_comment') },
        { key: 'canEditComment', label: _('can_edit_comment') },
        { key: 'canHideComment', label: _('can_hide_comment') },
      ],
    },
    {
      title: _('perks'),
      permissions: [
        { key: 'hideAds', label: _('hide_ads') },
        { key: 'canDownload', label: _('can_download') },
        { key: 'canReadUnreleased', label: _('can_read_unreleased') },
      ],
    },
  ];

  return (
    <Modal
      isOpen={open}
      onClose={() => setOpen(false)}
      title={user ? _('edit_user') : _('create_user')}
      size="lg"
    >
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-zinc-800">
        <button
          onClick={() => setCurrentTab('user')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            currentTab === 'user'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-300'
          }`}
        >
          <User size={18} />
          {_('general')}
        </button>
        <button
          onClick={() => setCurrentTab('permissions')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            currentTab === 'permissions'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-300'
          }`}
        >
          <Shield size={18} />
          {_('permissions')}
        </button>
        <button
          onClick={() => setCurrentTab('subscriptions')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            currentTab === 'subscriptions'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-300'
          }`}
        >
          <CreditCard size={18} />
          {_('subscriptions')}
        </button>
      </div>

      {/* User Tab */}
      {currentTab === 'user' && (
        <div className="space-y-4">
          <Card className="bg-zinc-800/30">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  {_('username') || 'Nombre de usuario'}
                </label>
                <div className="px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-400">
                  {user?.username || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  {_('email') || 'Correo electrónico'}
                </label>
                <div className="px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-400">
                  {user?.email || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  {_('user_role') || 'Rol'}
                </label>
                <div className="px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-400">
                  {role || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  {_('description') || 'Descripción'}
                </label>
                <div className="px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-400 min-h-[60px]">
                  {description || '-'}
                </div>
              </div>
            </div>
          </Card>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-amber-400 text-sm font-medium">
              ⚠️ Los administradores no pueden editar la información personal del usuario (nombre, email, rol, descripción, foto de perfil). Solo pueden gestionar permisos y suscripciones de la organización.
            </p>
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {currentTab === 'permissions' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const permissionsSetToTrue: Record<string, boolean> = {};
                Object.keys(permissions).forEach((key) => {
                  permissionsSetToTrue[key] = true;
                });
                setPermissions(permissionsSetToTrue);
              }}
            >
              Marcar todos
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const permissionsSetToFalse: Record<string, boolean> = {};
                Object.keys(permissions).forEach((key) => {
                  permissionsSetToFalse[key] = false;
                });
                setPermissions(permissionsSetToFalse);
              }}
            >
              Desmarcar todos
            </Button>
          </div>

          {permissionSections.map((section) => (
            <Card key={section.title} className="bg-zinc-800/50">
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-3">{section.title}</h3>
              <div className="space-y-2">
                {section.permissions.map((perm) => (
                  <label
                    key={perm.key}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-700/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={permissions[perm.key]}
                      onChange={(e) =>
                        setPermissions({ ...permissions, [perm.key]: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                    />
                    <span className="text-zinc-300 text-sm">{perm.label}</span>
                  </label>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Subscriptions Tab */}
      {currentTab === 'subscriptions' && (() => {
        // Filtrar suscripciones para mostrar solo las de esta organización
        const organizationSubscriptionPlanIds = subscriptionPlans.map(plan => plan.id);
        const organizationSubscriptions = user && user.subscriptions 
          ? user.subscriptions.filter(sub => {
              // Verificar si la suscripción pertenece a un plan de esta organización
              const planId = subscriptionPlans.find(p => p.name === sub.subscriptionPlan?.name)?.id;
              return planId && organizationSubscriptionPlanIds.includes(planId);
            })
          : [];
        
        return (
          <div className="space-y-4">
            {organizationSubscriptions.length > 0 ? (
              <>
                <p className="text-white font-black uppercase tracking-tight">Suscripciones de la organización</p>
                <div className="space-y-4">
                  {organizationSubscriptions.map((subscription) => (
                  <Card key={subscription.id} className="bg-zinc-800/50">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">
                        {subscription.subscriptionPlan.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          subscription.active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {subscription.active ? _('active') : _('inactive')}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-zinc-400 mb-4">
                      <p>
                        <span className="font-medium">Fecha de inicio:</span>{' '}
                        {new Date(subscription.startDate).toLocaleDateString()}
                      </p>
                      {subscription.endDate && (
                        <p>
                          <span className="font-medium">Fecha de fin:</span>{' '}
                          {new Date(subscription.endDate).toLocaleDateString()}
                        </p>
                      )}
                      {subscription.lastPayment && (
                        <p>
                          <span className="font-medium">Última fecha de pago:</span>{' '}
                          {new Date(subscription.lastPayment).toLocaleDateString()}
                        </p>
                      )}
                      {subscription.nextPayment && (
                        <p>
                          <span className="font-medium">Próxima fecha de pago:</span>{' '}
                          {new Date(subscription.nextPayment).toLocaleDateString()}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Estado:</span> {subscription.status}
                      </p>
                      <p>
                        <span className="font-medium">ID PayPal:</span>{' '}
                        {subscription.paypalSubscriptionId}
                      </p>
                      <p>
                        <span className="font-medium">ID:</span> {subscription.id}
                      </p>
                    </div>
                    {subscription.active ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => user && handleDeactivateSubscription(subscription.id, user.id)}
                      >
                        <X size={16} />
                        Pausar suscripción
                      </Button>
                    ) : (
                      <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                        <p className="text-zinc-400 text-sm font-medium">
                          ⚠️ Solo el usuario puede reactivar su propia suscripción
                        </p>
                      </div>
                    )}
                  </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <CreditCard className="mx-auto text-zinc-600 mb-3" size={48} />
                  <p className="text-zinc-400">
                    {user && user.subscriptions.length > 0 
                      ? 'No hay suscripciones de esta organización' 
                      : 'No hay suscripciones activas'}
                  </p>
                </div>
              </Card>
            )}
          </div>
        );
      })()}

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-zinc-800">
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading} loading={loading}>
          {loading ? 'Guardando...' : _('save')}
        </Button>
      </div>
    </Modal>
  );
};

export default AdminUserDialog;

