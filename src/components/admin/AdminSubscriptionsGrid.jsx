import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import {
    Alert,
    Spinner,
    Button,
} from "@material-tailwind/react";
import { AdminSubscriptionCard } from './AdminSubscriptionCard';
import { AdminSubscriptionDialog } from './AdminSubscriptionDialog';
import { callAPI } from '../../util/callApi';

export function AdminSubscriptionsGrid() {
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState([]);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);

    useEffect(() => {
        if (!isSubscriptionDialogOpen) refreshSubscriptions();
    }, [isSubscriptionDialogOpen]);

    const refreshSubscriptions = () => {
        setLoading(true);
        callAPI(`/api/subscription-model`)
            .then(({ data }) => {
                console.log(data);
                setSubscriptions(data)
            })
            .catch(error => toast.error(error?.message || 'Error al cargar las suscripciones'))
            .finally(() => setLoading(false));
    };

    const handleCardClick = (subscription) => {
        setSelectedSubscription(subscription);
        setIsSubscriptionDialogOpen(true);
    }

    return (
        <div className="w-full my-4">
            <Button
                variant="outlined"
                className="flex items-center gap-3 h-full sm:m-4"
                onClick={() => setIsSubscriptionDialogOpen(true)}
            >
                Agregar suscripción
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            </Button>
            <AdminSubscriptionDialog
                open={isSubscriptionDialogOpen}
                setOpen={setIsSubscriptionDialogOpen}
                subscription={selectedSubscription}
                setSubscription={setSelectedSubscription}
            />
            <div className="max-w-lg">
                {loading && <Spinner className='m-4 w-full' />}
                {!loading && subscriptions.length === 0 &&
                    <Alert>
                        No hay suscripciones disponibles,
                        <a href="/admin/subscriptions/create" className='hover:text-light-blue-200'>{" crea una "}</a>
                        para empezar.
                    </Alert>
                }
            </div>
            <div className="flex flex-wrap gap-4">
                {subscriptions.map(subscription => (
                    <AdminSubscriptionCard
                        key={subscription.id}
                        subscription={subscription}
                        onClick={() => handleCardClick(subscription)}
                    />
                ))}
            </div>
        </div>
    );
}
