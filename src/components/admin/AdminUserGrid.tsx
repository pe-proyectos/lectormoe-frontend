import React, { useState, useEffect } from 'react';
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
  organization: any;
}

const AdminUserGrid: React.FC<AdminUserGridProps> = ({ language, subscriptionPlans, organization }) => {
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

  useEffect(() => {
    refreshUserList();
  }, []);

  useEffect(() => {
    refreshUserList();
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [orderBy, limit]);

  useEffect(() => {
    if (!isUserDialogOpen) refreshUserList();
  }, [isUserDialogOpen]);

  const handleCardClick = (user: User) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };

  const refreshUserList = () => {
    setLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('page', page.toString());
    urlParams.set('limit', limit.toString());
    urlParams.set('order', orderBy);
    const query = new URLSearchParams({
      page: page.toString(),
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
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    callAPI(`/api/user?${query}`)
      .then((result: any) => {
        if (result && result.data) {
          setTotal(result.total || 0);
          setUserList(result.data);
          setMaxPage(result.maxPage || 1);
        } else if (Array.isArray(result)) {
          setUserList(result);
          setTotal(result.length);
          setMaxPage(1);
        }
      })
      .catch((error: any) => toast.error(error?.message))
      .finally(() => setLoading(false));
  };

  const handleSubscriptionPlanToggle = (planId: number) => {
    setSelectedSubscriptionPlanIds((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]
    );
  };

  return (
    <div className="w-full my-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
          <Users className="text-white" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{_('user_list')}</h2>
          <p className="text-gray-400 text-sm">{total || '-'} usuarios en total</p>
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
        organization={organization}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userList.map((user) => (
          <Card
            key={user.id}
            className="cursor-pointer hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1"
            onClick={() => handleCardClick(user)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{user.username}</h3>
                <p className="text-gray-400 text-sm break-all">{user.email}</p>
              </div>
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <User className="text-blue-400" size={20} />
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

