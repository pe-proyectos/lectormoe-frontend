import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Select from './ui/Select';
import Switch from './ui/Switch';
import Modal from './ui/Modal';
import { callAPI } from '../../util/callApi';
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
}

interface AdminSubscriptionPlanDialogProps {
  language: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  subscriptionPlan: SubscriptionPlan | null;
  setSubscriptionPlan: (plan: SubscriptionPlan | null) => void;
}

const AdminSubscriptionPlanDialog: React.FC<AdminSubscriptionPlanDialogProps> = ({
  language,
  open,
  setOpen,
  subscriptionPlan,
  setSubscriptionPlan,
}) => {
  const _ = getTranslator(language);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0.0);
  const [planInterval, setPlanInterval] = useState('MONTH');
  const [currency, setCurrency] = useState('USD');
  const [active, setActive] = useState(true);
  const [hideAds, setHideAds] = useState(false);
  const [canDownload, setCanDownload] = useState(false);
  const [canReadUnreleased, setCanReadUnreleased] = useState(false);

  useEffect(() => {
    if (!subscriptionPlan) {
      setName('');
      setDescription('');
      setPrice(0.0);
      setPlanInterval('MONTH');
      setCurrency('USD');
      setActive(true);
      setHideAds(false);
      setCanDownload(false);
      setCanReadUnreleased(false);
      return;
    }
    setName(subscriptionPlan.name || '');
    setDescription(subscriptionPlan.description || '');
    setPrice(subscriptionPlan.price || 0.0);
    setPlanInterval(subscriptionPlan.interval || 'MONTH');
    setCurrency(subscriptionPlan.currency || 'USD');
    setActive(subscriptionPlan.active || true);
    setHideAds(subscriptionPlan.hideAds || false);
    setCanDownload(subscriptionPlan.canDownload || false);
    setCanReadUnreleased(subscriptionPlan.canReadUnreleased || false);
  }, [subscriptionPlan]);

  const handleSubmit = async () => {
    if (!name) {
      return toast.error('El nombre es obligatorio');
    }
    const formData = new FormData();
    formData.append('name', name);
    if (description) formData.append('description', description);
    if (!subscriptionPlan) formData.append('price', price.toString());
    if (!subscriptionPlan) formData.append('interval', planInterval);
    if (!subscriptionPlan) formData.append('currency', currency);
    formData.append('active', active.toString());
    formData.append('hideAds', hideAds.toString());
    formData.append('canDownload', canDownload.toString());
    formData.append('canReadUnreleased', canReadUnreleased.toString());
    setLoading(true);
    callAPI(
      subscriptionPlan ? `/api/subscription-plan/${subscriptionPlan.id}` : '/api/subscription-plan',
      {
        method: subscriptionPlan ? 'PATCH' : 'POST',
        body: formData,
      }
    )
      .then((response) => {
        toast.success('Plan de suscripción guardado exitosamente');
        setSubscriptionPlan(null);
        setName('');
        setDescription('');
        setPrice(0.0);
        setPlanInterval('MONTH');
        setCurrency('USD');
        setActive(true);
        setHideAds(false);
        setCanDownload(false);
        setCanReadUnreleased(false);
        setOpen(false);
      })
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoading(false));
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => setOpen(false)}
      title={subscriptionPlan ? 'Editar Plan de Suscripción' : 'Crear Plan de Suscripción'}
    >
      <div className="space-y-6">
        <Input
          label="Nombre del Plan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Plan Premium"
        />

        <Textarea
          label="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Acceso completo a todos los beneficios..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Precio"
            type="number"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            disabled={!!subscriptionPlan}
            min={1}
            max={1000}
          />

          <Select
            label="Moneda"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={!!subscriptionPlan}
            options={[
              { value: 'USD', label: 'USD - Dólar Estadounidense' },
              { value: 'EUR', label: 'EUR - Euro' },
              { value: 'MXN', label: 'MXN - Peso Mexicano' },
            ]}
          />
        </div>

        <Select
          label="Intervalo de Pago"
          value={planInterval}
          onChange={(e) => setPlanInterval(e.target.value)}
          disabled={!!subscriptionPlan}
          options={[
            { value: 'DAY', label: 'Diario' },
            { value: 'WEEK', label: 'Semanal' },
            { value: 'MONTH', label: 'Mensual' },
            { value: 'YEAR', label: 'Anual' },
          ]}
        />

        {subscriptionPlan && (
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <p className="text-sm text-orange-400">
              ⚠️ El precio, moneda e intervalo no se pueden modificar después de crear el plan
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-zinc-800">
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Beneficios del Plan</p>
          <div className="space-y-4">
            <Switch
              label="Plan activo (disponible para suscripción)"
              checked={active}
              onChange={setActive}
            />
            <Switch
              label="Ocultar anuncios publicitarios"
              checked={hideAds}
              onChange={setHideAds}
            />
            <Switch
              label="Permitir descarga de capítulos"
              checked={canDownload}
              onChange={setCanDownload}
            />
            <Switch
              label="Acceso anticipado a capítulos no publicados"
              checked={canReadUnreleased}
              onChange={setCanReadUnreleased}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {subscriptionPlan ? 'Guardar Cambios' : 'Crear Plan'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AdminSubscriptionPlanDialog;

