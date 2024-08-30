import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import {
    Textarea,
    Button,
    Dialog,
    DialogHeader,
    DialogBody,
    Checkbox,
    DialogFooter,
    Typography,
    Input,
} from "@material-tailwind/react";
import { callAPI } from '../../util/callApi';

export function AdminCoinPackDialog({ open, setOpen, coinpack, setCoinpack }) {
    // dialog
    const [loading, setLoading] = useState(false);
    // form
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [priceWithoutDiscount, setPriceWithoutDiscount] = useState(0.0);
    const [price, setPrice] = useState(0.0);
    const [coins, setCoins] = useState(0);
    const [active, setActive] = useState(false);

    useEffect(() => {
        if (!coinpack) return;
        setName(coinpack.name);
        setDescription(coinpack.description);
        setPriceWithoutDiscount(coinpack.priceWithoutDiscount);
        setPrice(coinpack.price);
        setCoins(coinpack.coins);
        setActive(coinpack.active);
    }, [coinpack]);

    const handleSubmit = async () => {
        if (!name || !slug) {
            return toast.error('El nombre y el slug son obligatorios');
        }
        const formData = new FormData();
        formData.append('name', name);
        if (description) formData.append('description', description);
        formData.append('priceWithoutDiscount', priceWithoutDiscount);
        formData.append('price', price);
        formData.append('coins', coins);
        formData.append('active', active);
        setLoading(true);
        callAPI(coinpack ? `/api/coin-pack/${coinpack.id}` : '/api/coin-pack', {
            method: coinpack ? 'PATCH' : 'POST',
            body: formData,
        })
            .then(response => {
                toast.success('Paquete de monedas guardado');
                setCoinpack(null);
                setName('');
                setSlug('');
                setDescription('');
                setPriceWithoutDiscount(0.0);
                setPrice(0.0);
                setCoins(0);
                setActive(false);
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
                    {coinpack ? 'Editar paquete de monedas' : 'Crear paquete de monedas'}
                </Typography>
            </DialogHeader>
            <DialogBody className="max-h-[65vh] overflow-y-auto flex flex-col gap-4">
                <Typography className="-mb-2" variant="h6" color="gray">
                    Nombre
                </Typography>
                <Input
                    size="lg"
                    label="Nombre del paquete de monedas"
                    autoComplete='off'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Descripción (Opcional)
                </Typography>
                <Textarea
                    size="lg"
                    label="Descripción del paquete de monedas"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Precio sin descuento
                </Typography>
                <Input
                    type="number"
                    size="lg"
                    label="Precio sin descuento"
                    value={priceWithoutDiscount}
                    onChange={(e) => setPriceWithoutDiscount(parseFloat(e.target.value))}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Precio con descuento
                </Typography>
                <Input
                    type="number"
                    size="lg"
                    label="Precio con descuento"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Cantidad de monedas
                </Typography>
                <Input
                    type="number"
                    size="lg"
                    label="Cantidad de monedas"
                    value={coins}
                    onChange={(e) => setCoins(parseInt(e.target.value))}
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
                    Guardar paquete de monedas
                </Button>
            </DialogFooter>
            <ToastContainer theme="dark" />
        </Dialog>
    );
}
