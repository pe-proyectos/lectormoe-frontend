import { Check, Edit, Users } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { getTranslator } from '../../util/translate';

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

interface AdminSubscriptionPlanCardProps {
  language: string;
  subscriptionPlan: SubscriptionPlan;
  onClick: (plan: SubscriptionPlan) => void;
}

const AdminSubscriptionPlanCard: React.FC<AdminSubscriptionPlanCardProps> = ({
  language,
  subscriptionPlan,
  onClick,
}) => {
  const _ = getTranslator(language);

  const intervalLabels: Record<string, string> = {
    MONTH: 'Mensual',
    YEAR: 'Anual',
    WEEK: 'Semanal',
    DAY: 'Diario',
  };

  return (
    <Card className="hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all">
      <div className="flex items-center justify-between mb-4">
        <Badge variant={subscriptionPlan.active ? 'success' : 'default'}>
          {subscriptionPlan.active ? 'Activo' : 'Inactivo'}
        </Badge>
        <div className="text-right">
          <p className="text-2xl font-black text-cyan-500">
            ${subscriptionPlan.price.toFixed(2)}
          </p>
          <p className="text-xs text-zinc-500">{subscriptionPlan.currency}</p>
        </div>
      </div>

      <h3 className="text-xl font-black text-white mb-2">{subscriptionPlan.name || 'Sin nombre'}</h3>
      <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
        {subscriptionPlan.description || 'Sin descripción'}
      </p>

      <div className="mb-4 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700">
        <p className="text-xs text-zinc-500 mb-2">INTERVALO</p>
        <p className="text-sm font-bold text-zinc-300">
          {intervalLabels[subscriptionPlan.interval] || subscriptionPlan.interval}
        </p>
      </div>

      <div className="space-y-2 mb-4">
        {subscriptionPlan.hideAds && (
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Check size={16} className="text-cyan-500" />
            Sin anuncios
          </div>
        )}
        {subscriptionPlan.canDownload && (
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Check size={16} className="text-cyan-500" />
            Descarga de capítulos
          </div>
        )}
        {subscriptionPlan.canReadUnreleased && (
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Check size={16} className="text-cyan-500" />
            Acceso anticipado
          </div>
        )}
        {!subscriptionPlan.hideAds && !subscriptionPlan.canDownload && !subscriptionPlan.canReadUnreleased && (
          <p className="text-sm text-zinc-600 italic">Sin beneficios configurados</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Users size={16} />
          <span>{subscriptionPlan.subscriptions?.length || 0} suscritos</span>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onClick(subscriptionPlan)}>
          <Edit size={14} />
          Editar
        </Button>
      </div>
    </Card>
  );
};

export default AdminSubscriptionPlanCard;

