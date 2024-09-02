import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import {
    Alert,
    Spinner,
    Button,
} from "@material-tailwind/react";
import { AdminCoinPackCard } from './AdminCoinPackCard';
import { AdminCoinPackDialog } from './AdminCoinPackDialog';
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";

export function AdminCoinPackGrid({ organization }) {
    const _ = getTranslator(organization.language);

    const [loading, setLoading] = useState(true);
    const [coinPacks, setCoinPacks] = useState([]);
    const [selectedCoinPack, setSelectedCoinPack] = useState(null);
    const [isCoinPackDialogOpen, setIsCoinPackDialogOpen] = useState(false);

    useEffect(() => {
        if (!isCoinPackDialogOpen) refreshCoinPacks();
    }, [isCoinPackDialogOpen]);

    const refreshCoinPacks = () => {
        setLoading(true);
        callAPI(`/api/coinpack`)
            .then(({ data }) => {
                console.log(data);
                setCoinPacks(data)
            })
            .catch(error => toast.error(error?.message || _('error_loading_coin_packs')))
            .finally(() => setLoading(false));
    };

    const handleCardClick = (coinPack) => {
        setSelectedCoinPack(coinPack);
        setIsCoinPackDialogOpen(true);
    }

    return (
        <div className="w-full my-4">
            <Button
                variant="outlined"
                className="flex items-center gap-3 h-full sm:m-4"
                onClick={() => setIsCoinPackDialogOpen(true)}
            >
                {_('add_coin_pack')}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            </Button>
            <AdminCoinPackDialog
                organization={organization}
                open={isCoinPackDialogOpen}
                setOpen={setIsCoinPackDialogOpen}
                coinpack={selectedCoinPack}
                setCoinpack={setSelectedCoinPack}
            />
            <div className="max-w-lg">
                {loading && <Spinner className='m-4 w-full' />}
                {!loading && coinPacks.length === 0 &&
                    <Alert>
                        {_('no_coin_packs_available')},
                        <a href="/admin/coin-packs/create" className='hover:text-light-blue-200'>{_('create_one_to_start')}</a>
                    </Alert>
                }
            </div>
            <div className="flex flex-wrap gap-4">
                {coinPacks.map(coinPack => (
                    <AdminCoinPackCard
                        organization={organization}
                        key={coinPack.id}
                        coinpack={coinPack}
                        onClick={() => handleCardClick(coinPack)}
                    />
                ))}
            </div>
        </div>
    );
}
