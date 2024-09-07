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
import { getTranslator } from "../../util/translate";

export function AdminCoinPackDialog({ organization, open, setOpen, coinpack, setCoinpack }) {
    const _ = getTranslator(organization.language);

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
        if (!name) {
            return toast.error(_('name_mandatory'));
        }
        const formData = new FormData();
        formData.append('name', name);
        if (description) formData.append('description', description);
        formData.append('priceWithoutDiscount', priceWithoutDiscount);
        formData.append('price', price);
        formData.append('coins', coins);
        formData.append('active', active);
        setLoading(true);
        callAPI(coinpack ? `/api/coinpack/${coinpack.id}` : '/api/coinpack', {
            method: coinpack ? 'PATCH' : 'POST',
            body: formData,
        })
            .then(response => {
                toast.success(_('coin_pack_saved'));
                setCoinpack(null);
                setName('');
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
                    {coinpack ? _('edit_coin_pack') : _('create_coin_pack')}
                </Typography>
            </DialogHeader>
            <DialogBody className="max-h-[65vh] overflow-y-auto flex flex-col gap-4">
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('name')}
                </Typography>
                <Input
                    size="lg"
                    label={_('coin_pack_name')}
                    autoComplete='off'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('description_optional')}
                </Typography>
                <Textarea
                    size="lg"
                    label={_('coin_pack_description')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('price_without_discount')}
                </Typography>
                <Input
                    type="number"
                    size="lg"
                    label={_('price_without_discount')}
                    min={0}
                    max={1000}
                    value={priceWithoutDiscount}
                    onChange={(e) => setPriceWithoutDiscount(parseFloat(e.target.value))}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('price_with_discount')}
                </Typography>
                <Input
                    type="number"
                    size="lg"
                    label={_('price_with_discount')}
                    min={0}
                    max={1000}
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('coin_amount')}
                </Typography>
                <Input
                    type="number"
                    size="lg"
                    label={_('coin_amount')}
                    min={0}
                    max={1000}
                    value={coins}
                    onChange={(e) => setCoins(parseInt(e.target.value))}
                />
                <label htmlFor="active-checkbox">
                    <Checkbox
                        color="blue"
                        text={_('active')}
                        id="active-checkbox"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                    />
                    {_('active')}
                </label>
            </DialogBody>
            <DialogFooter className="space-x-2">
                <Button variant="outlined" onClick={handleSubmit} loading={loading}>
                    {_('save_coin_pack')}
                </Button>
            </DialogFooter>
            <ToastContainer theme="dark" />
        </Dialog>
    );
}
