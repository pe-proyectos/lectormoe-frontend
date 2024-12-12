import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import {
    Alert,
    Spinner,
    Button,
} from "@material-tailwind/react";
import { AdminSubscriptionPlanCard } from './AdminSubscriptionPlanCard';
import { AdminSubscriptionPlanDialog } from './AdminSubscriptionPlanDialog';
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";

export function AdminSubscriptionPlanGrid({ organization }) {
    const _ = getTranslator(organization.language);

    const [loading, setLoading] = useState(true);
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState(null);
    const [isSubscriptionPlanDialogOpen, setIsSubscriptionPlanDialogOpen] = useState(false);

    useEffect(() => {
        if (!isSubscriptionPlanDialogOpen) refreshSubscriptionPlans();
    }, [isSubscriptionPlanDialogOpen]);

    const refreshSubscriptionPlans = () => {
        setLoading(true);
        callAPI(`/api/subscription-plan`)
            .then(({ data }) => {
                setSubscriptionPlans(data)
            })
            .catch(error => toast.error(error?.message || _('error_loading_subscription_plans')))
            .finally(() => setLoading(false));
    };

    const handleCardClick = (subscriptionPlan) => {
        setSelectedSubscriptionPlan(subscriptionPlan);
        setIsSubscriptionPlanDialogOpen(true);
    }

    return (
        <div className="w-full my-4">
            <Button
                variant="outlined"
                className="flex items-center gap-3 h-full sm:m-4"
                onClick={() => setIsSubscriptionPlanDialogOpen(true)}
            >
                {_('add_subscription_plan')}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            </Button>
            <AdminSubscriptionPlanDialog
                organization={organization}
                open={isSubscriptionPlanDialogOpen}
                setOpen={setIsSubscriptionPlanDialogOpen}
                subscriptionPlan={selectedSubscriptionPlan}
                setSubscriptionPlan={setSelectedSubscriptionPlan}
            />
            <div className="max-w-lg">
                {loading && <Spinner className='m-4 w-full' />}
                {!loading && subscriptionPlans.length === 0 &&
                    <Alert>
                        {_('no_subscription_plans_available')},
                        <a href="/admin/subscription-plans/create" className='hover:text-light-blue-200'>{_('create_one_to_start')}</a>
                    </Alert>
                }
            </div>
            <div className="flex flex-wrap gap-4">
                {subscriptionPlans.map(subscriptionPlan => (
                    <AdminSubscriptionPlanCard
                        organization={organization}
                        key={subscriptionPlan.id}
                        subscriptionPlan={subscriptionPlan}
                        onClick={() => handleCardClick(subscriptionPlan)}
                    />
                ))}
            </div>
        </div>
    );
}
