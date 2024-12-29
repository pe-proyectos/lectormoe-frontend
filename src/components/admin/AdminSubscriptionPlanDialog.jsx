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
    Select,
    Option,
} from "@material-tailwind/react";
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";

export function AdminSubscriptionPlanDialog({ organization, open, setOpen, subscriptionPlan, setSubscriptionPlan }) {
    const _ = getTranslator(organization.language);

    // dialog
    const [loading, setLoading] = useState(false);
    // form
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState(0.0);
    const [planInterval, setPlanInterval] = useState('MONTH');
    const [currency, setCurrency] = useState('USD');
    const [active, setActive] = useState(true);
    const [showAds, setShowAds] = useState(false);
    const [canDownload, setCanDownload] = useState(false);
    const [canReadUnreleased, setCanReadUnreleased] = useState(false);

    useEffect(() => {
        if (!subscriptionPlan) return;
        setName(subscriptionPlan.name || '');
        setDescription(subscriptionPlan.description || '');
        setPrice(subscriptionPlan.price || 0.0);
        setPlanInterval(subscriptionPlan.interval || 'MONTH');
        setCurrency(subscriptionPlan.currency || 'USD');
        setActive(subscriptionPlan.active || true);
        setShowAds(subscriptionPlan.showAds || false);
        setCanDownload(subscriptionPlan.canDownload || false);
        setCanReadUnreleased(subscriptionPlan.canReadUnreleased || false);
    }, [subscriptionPlan]);

    const handleSubmit = async () => {
        if (!name) {
            return toast.error(_('name_mandatory'));
        }
        const formData = new FormData();
        formData.append('name', name);
        if (description) formData.append('description', description);
        formData.append('price', price);
        formData.append('interval', planInterval);
        formData.append('currency', currency);
        formData.append('active', active);
        formData.append('showAds', showAds);
        formData.append('canDownload', canDownload);
        formData.append('canReadUnreleased', canReadUnreleased);
        setLoading(true);
        callAPI(subscriptionPlan ? `/api/subscription-plan/${subscriptionPlan.id}` : '/api/subscription-plan', {
            method: subscriptionPlan ? 'PATCH' : 'POST',
            body: formData,
        })
            .then(response => {
                toast.success(_('subscription_plan_saved'));
                setSubscriptionPlan(null);
                setName('');
                setDescription('');
                setPrice(0.0);
                setPlanInterval('MONTH');
                setCurrency('USD');
                setActive(true);
                setShowAds(false);
                setCanDownload(false);
                setCanReadUnreleased(false);
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
                    {subscriptionPlan ? _('edit_subscription_plan') : _('create_subscription_plan')}
                </Typography>
            </DialogHeader>
            <DialogBody className="max-h-[65vh] overflow-y-auto flex flex-col gap-4">
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('name')}
                </Typography>
                <Input
                    size="lg"
                    label={_('subscription_plan_name')}
                    autoComplete='off'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('description_optional')}
                </Typography>
                <Textarea
                    size="lg"
                    label={_('subscription_plan_description')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('price_usd')}
                </Typography>
                <Input
                    type="number"
                    size="lg"
                    label={_('price')}
                    min={1}
                    max={1000}
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('interval')}
                </Typography>
                <div className="w-full">
                    <Select
                        label={_('interval')}
                        value={planInterval}
                        onChange={(e) => setPlanInterval(e.target.value)}
                    >
                        <Option value="DAY" selected={planInterval === 'DAY'}>{_('daily')}</Option>
                        <Option value="WEEK" selected={planInterval === 'WEEK'}>{_('weekly')}</Option>
                        <Option value="MONTH" selected={planInterval === 'MONTH'}>{_('monthly')}</Option>
                        <Option value="YEAR" selected={planInterval === 'YEAR'}>{_('yearly')}</Option>
                    </Select>
                </div>
                {/* active */}
                <div className="flex flex-col gap-2">
                    <p className="text-md font-bold text-gray-800">{_('active')}</p>
                    <Checkbox
                        label={_('active_description')}
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                    />
                </div>
                {/* hide ads */}
                <div className="flex flex-col gap-2">
                    <p className="text-md font-bold text-gray-800">{_('hide_ads')}</p>
                    <Checkbox
                        label={_('hide_ads_descriptions')}
                        checked={!showAds}
                        onChange={(e) => setShowAds(!e.target.checked)}
                    />
                </div>
                {/* can download */}
                <div className="flex flex-col gap-2">
                    <p className="text-md font-bold text-gray-800">{_('can_download')}</p>
                    <Checkbox
                        label={_('can_download_descriptions')}
                        checked={canDownload}
                        onChange={(e) => setCanDownload(e.target.checked)}
                    />
                </div>
                {/* can read unreleased */}
                <div className="flex flex-col gap-2">
                    <p className="text-md font-bold text-gray-800">{_('can_read_unreleased')}</p>
                    <Checkbox
                        label={_('can_read_unreleased_descriptions')}
                        checked={canReadUnreleased}
                        onChange={(e) => setCanReadUnreleased(e.target.checked)}
                    />
                </div>
            </DialogBody>
            <DialogFooter className="space-x-2">
                <Button variant="outlined" onClick={handleSubmit} loading={loading}>
                    {_('save_subscription_plan')}
                </Button>
            </DialogFooter>
            <ToastContainer theme="dark" />
        </Dialog>
    );
}
