import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, CreditCard } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import AdminSubscriptionPlanCard from './AdminSubscriptionPlanCard';
import AdminSubscriptionPlanDialog from './AdminSubscriptionPlanDialog';
import { callAPI } from '../../util/callApi';
import { getTranslator } from '../../util/translate';
import { getOrgPath, getOrgSlugFromPath } from '../../util/get-org-path';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  interval: string;
  currency: string;
  active: boolean;
  hideAds: boolean;
  canDownload: boolean;
  canReadUnreleased: boolean;
  subscriptions: any[];
}

interface AdminSubscriptionPlanGridProps {
  language: string;
  organizationSlug?: string;
}

const AdminSubscriptionPlanGrid: React.FC<AdminSubscriptionPlanGridProps> = ({ language, organizationSlug }) => {
  const _ = getTranslator(language);

  const orgSlug = organizationSlug || getOrgSlugFromPath();

  const [loading, setLoading] = useState(true);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [isSubscriptionPlanDialogOpen, setIsSubscriptionPlanDialogOpen] = useState(false);

  useEffect(() => {
    if (!isSubscriptionPlanDialogOpen) refreshSubscriptionPlans();
  }, [isSubscriptionPlanDialogOpen]);

  const refreshSubscriptionPlans = () => {
    setLoading(true);
    callAPI(`/api/subscription-plan`)
      .then((result) => {
        // El API retorna { items: [...], maxPage: X, total: Y }
        if (result && typeof result === 'object' && !Array.isArray(result) && Array.isArray(result.items)) {
          setSubscriptionPlans(result.items);
        }
      })
      .catch((error) => toast.error(error?.message || 'Error al cargar planes de suscripción'))
      .finally(() => setLoading(false));
  };

  const handleCardClick = (subscriptionPlan: SubscriptionPlan) => {
    setSelectedSubscriptionPlan(subscriptionPlan);
    setIsSubscriptionPlanDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Planes de Suscripción</h1>
            <p className="text-sm text-zinc-400 mt-1">Gestiona los planes de suscripción de tu organización</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedSubscriptionPlan(null);
              setIsSubscriptionPlanDialogOpen(true);
            }}
          >
            <Plus size={18} />
            Crear Plan
          </Button>
        </div>
      </Card>

      {/* Plans Grid */}
      {loading ? (
        <Card>
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        </Card>
      ) : subscriptionPlans.length === 0 ? (
        <Card>
          <div className="text-center p-12">
            <CreditCard size={48} className="mx-auto text-zinc-700 mb-3" />
            <p className="text-zinc-500 mb-4">No hay planes de suscripción disponibles</p>
            <Button
              variant="primary"
              onClick={() => {
                setSelectedSubscriptionPlan(null);
                setIsSubscriptionPlanDialogOpen(true);
              }}
            >
              <Plus size={18} />
              Crear Primer Plan
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptionPlans.map((subscriptionPlan) => (
            <AdminSubscriptionPlanCard
              language={language}
              key={subscriptionPlan.id}
              subscriptionPlan={subscriptionPlan}
              onClick={() => handleCardClick(subscriptionPlan)}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <AdminSubscriptionPlanDialog
        language={language}
        open={isSubscriptionPlanDialogOpen}
        setOpen={setIsSubscriptionPlanDialogOpen}
        subscriptionPlan={selectedSubscriptionPlan}
        setSubscriptionPlan={setSelectedSubscriptionPlan}
      />
    </div>
  );
};

export default AdminSubscriptionPlanGrid;

