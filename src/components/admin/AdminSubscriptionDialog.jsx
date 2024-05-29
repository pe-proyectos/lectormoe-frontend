import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import {
    Textarea,
    Button,
    Dialog,
    Spinner,
    DialogHeader,
    DialogBody,
    Checkbox,
    DialogFooter,
    Typography,
    Input,
} from "@material-tailwind/react";
import { callAPI } from '../../util/callApi';

export function AdminSubscriptionDialog({ open, setOpen, subscription, setSubscription }) {
    // dialog
    const [loading, setLoading] = useState(false);
    // form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [benefits, setBenefits] = useState('');
    const [readAnticipationHours, setReadAnticipationHours] = useState(0);
    const [monthlyPrice, setMonthlyPrice] = useState(0.0);
    const [yearlyPrice, setYearlyPrice] = useState(0.0);
    const [discountMonthlyPrice, setDiscountMonthlyPrice] = useState(0.0);
    const [discountYearlyPrice, setDiscountYearlyPrice] = useState(0.0);
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (!subscription) return;
        setTitle(subscription.title);
        setDescription(subscription.description);
        setBenefits(subscription.benefits);
        setReadAnticipationHours(subscription.readAnticipationHours);
        setMonthlyPrice(subscription.monthlyPrice);
        setYearlyPrice(subscription.yearlyPrice);
        setDiscountMonthlyPrice(subscription.discountMonthlyPrice);
        setDiscountYearlyPrice(subscription.discountYearlyPrice);
        setActive(subscription.active);
    }, [subscription]);

    const handleSubmit = async () => {
        if (!title) {
            return toast.error('El título es obligatorio');
        }
        const formData = new FormData();
        if (title) formData.append('title', title);
        if (description) formData.append('description', description);
        if (benefits) formData.append('benefits', benefits);
        if (readAnticipationHours) formData.append('readAnticipationHours', readAnticipationHours);
        if (monthlyPrice) formData.append('monthlyPrice', monthlyPrice);
        if (yearlyPrice) formData.append('yearlyPrice', yearlyPrice);
        if (discountMonthlyPrice) formData.append('discountMonthlyPrice', discountMonthlyPrice);
        if (discountYearlyPrice) formData.append('discountYearlyPrice', discountYearlyPrice);
        if (active) formData.append('active', active);
        setLoading(true);
        callAPI(subscription ? `/api/subscription-model/${subscription.id}` : '/api/subscription-model', {
            method: subscription ? 'PATCH' : 'POST',
            body: formData,
        })
            .then(response => {
                toast.success('Modelo de suscripción creado');
                setSubscription(null);
                setTitle('');
                setDescription('');
                setBenefits('');
                setReadAnticipationHours(0);
                setMonthlyPrice(0.0);
                setYearlyPrice(0.0);
                setDiscountMonthlyPrice(0.0);
                setDiscountYearlyPrice(0.0);
                setActive(true);
                setOpen(false);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    };

    return (
        <Dialog
            size="sm"
            open={open}
            handler={() => setOpen(previousState => !previousState)}
            className="max-h-[95vh]"
        >
            <DialogHeader>
                <Typography variant="h4" color="blue-gray">
                    {subscription ? 'Editar modelo de suscripción' : 'Crear modelo de suscripción'}
                </Typography>
            </DialogHeader>
            <DialogBody className="max-h-[65vh] overflow-y-auto flex flex-col gap-4">
                <Typography className="-mb-2" variant="h6" color="gray">
                    Título
                </Typography>
                <Input
                    size="lg"
                    label="Título del modelo de suscripción"
                    autoComplete='off'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Descripción (Opcional)
                </Typography>
                <Textarea
                    size="lg"
                    label="Descripción del modelo de suscripción"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Beneficios (Opcional)
                </Typography>
                <Textarea
                    size="lg"
                    label="Beneficios del modelo de suscripción"
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Horas de anticipación de lectura
                </Typography>
                <Input
                    type="number"
                    size="lg"
                    label="Horas de anticipación de lectura"
                    value={readAnticipationHours}
                    onChange={(e) => setReadAnticipationHours(parseInt(e.target.value))}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Precios y Descuentos
                </Typography>
                <Input
                    type="number"
                    size="lg"
                    label="Precio mensual"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(parseFloat(e.target.value))}
                />
                <Input
                    type="number"
                    size="lg"
                    label="Precio anual"
                    value={yearlyPrice}
                    onChange={(e) => setYearlyPrice(parseFloat(e.target.value))}
                />
                <Input
                    type="number"
                    size="lg"
                    label="Descuento en precio mensual"
                    value={discountMonthlyPrice}
                    onChange={(e) => setDiscountMonthlyPrice(parseFloat(e.target.value))}
                />
                <Input
                    type="number"
                    size="lg"
                    label="Descuento en precio anual"
                    value={discountYearlyPrice}
                    onChange={(e) => setDiscountYearlyPrice(parseFloat(e.target.value))}
                />
                <label htmlFor="active-checkbox">
                    <Checkbox
                        color="blue"
                        text="Activo"
                        id="active-checkbox"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                    />
                    Activo
                </label>
            </DialogBody>
            <DialogFooter className="space-x-2">
                <Button variant="outlined" onClick={handleSubmit} loading={loading}>
                    Guardar modelo de suscripción
                </Button>
            </DialogFooter>
            <ToastContainer theme="dark" />
        </Dialog>
    );
}
