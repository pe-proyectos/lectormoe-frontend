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
    setRole(userPermissions.role || 'user');
    setDescription(user.description || '');
    setHierarchyLevel(userPermissions.hierarchyLevel || 0);
    
    const newPermissions: Record<string, boolean> = {};
    Object.keys(permissions).forEach((key) => {
      newPermissions[key] = (userPermissions as any)[key] || false;
    });
    setPermissions(newPermissions);
  }, [user]);

  const handleSubmit = async () => {
    if (!role) {
      return toast.error(_('role_mandatory'));
    }
    const formData = new FormData();
    formData.append('role', role);
    formData.append('hierarchyLevel', hierarchyLevel.toString());
    if (description) formData.append('description', description);
    if (imageFile) formData.append('image', imageFile);
    
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
        toast.success(_('subscription_deactivated'));
        setOpen(false);
      })
      .catch((error: any) => toast.error(error?.message));
  };

  const handleActivateSubscription = async (subscriptionId: number, userId: number) => {
    const formData = new FormData();
    formData.append('active', 'true');
    formData.append('userId', userId.toString());
    callAPI(`/api/subscription/${subscriptionId}`, {
      method: 'PATCH',
      body: formData,
    })
      .then(() => {
        toast.success(_('subscription_activated'));
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
      <div className="flex items-center gap-2 mb-6 border-b border-gray-700">
        <button
          onClick={() => setCurrentTab('user')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            currentTab === 'user'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <User size={18} />
          {_('general')}
        </button>
        <button
          onClick={() => setCurrentTab('permissions')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            currentTab === 'permissions'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <Shield size={18} />
          {_('permissions')}
        </button>
        <button
          onClick={() => setCurrentTab('subscriptions')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            currentTab === 'subscriptions'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <CreditCard size={18} />
          {_('subscriptions')}
        </button>
      </div>

      {/* User Tab */}
      {currentTab === 'user' && (
        <div className="space-y-4">
          <Input
            label={_('user_role')}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={_('role')}
          />
          <Input
            label={_('description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={_('description')}
          />
          <Input
            label={_('hierarchy_level')}
            type="number"
            value={hierarchyLevel.toString()}
            onChange={(e) => setHierarchyLevel(Number(e.target.value))}
            placeholder="0"
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {_('profile_image')} ({_('optional')})
            </label>
            <ImageDropzone
              value={imageFile}
              label={_('drop_profile_image')}
              onChange={(files: File[]) => (files[0] ? setImageFile(files[0]) : null)}
              onDelete={() => setImageFile(null)}
            />
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {currentTab === 'permissions' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
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
              variant="outline"
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
            <Card key={section.title} className="bg-gray-800/50">
              <h3 className="text-lg font-semibold text-white mb-3">{section.title}</h3>
              <div className="space-y-2">
                {section.permissions.map((perm) => (
                  <label
                    key={perm.key}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={permissions[perm.key]}
                      onChange={(e) =>
                        setPermissions({ ...permissions, [perm.key]: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-gray-300 text-sm">{perm.label}</span>
                  </label>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Subscriptions Tab */}
      {currentTab === 'subscriptions' && (
        <div className="space-y-4">
          {user && user.subscriptions.length > 0 ? (
            <>
              <p className="text-white font-semibold">Suscripciones activas</p>
              <div className="space-y-4">
                {user.subscriptions.map((subscription) => (
                  <Card key={subscription.id} className="bg-gray-800/50">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-white">
                        {subscription.subscriptionPlan.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          subscription.active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {subscription.active ? _('active') : _('inactive')}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-400 mb-4">
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
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivateSubscription(subscription.id, user.id)}
                        icon={<X size={16} />}
                      >
                        Desactivar suscripción
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleActivateSubscription(subscription.id, user.id)}
                        icon={<Check size={16} />}
                      >
                        Activar suscripción
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <div className="text-center py-8">
                <CreditCard className="mx-auto text-gray-600 mb-3" size={48} />
                <p className="text-gray-400">No hay suscripciones activas</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-700">
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading} icon={<Check size={18} />}>
          {loading ? 'Guardando...' : _('save')}
        </Button>
      </div>
    </Modal>
  );
};

export default AdminUserDialog;

