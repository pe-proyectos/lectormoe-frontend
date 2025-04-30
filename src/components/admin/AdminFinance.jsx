import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import {
    Alert,
    Spinner,
    Card,
    CardHeader,
    CardBody,
    Typography,
    IconButton,
} from "@material-tailwind/react";
import Chart from "react-apexcharts";
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";

export function AdminFinance({ language }) {
    const _ = getTranslator(language);

    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});
    const [graphInterval, setGraphInterval] = useState('monthly');
    const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' or 'YYYY-MM'
    const [summary, setSummary] = useState({
        totalEarnings: 0,
        totalWithdrawals: 0,
        balance: 0
    });

    useEffect(() => {
        refreshTransactions();
    }, []);

    useEffect(() => {
        calculateSummary();
    }, [transactions]);

    const calculateSummary = () => {
        const filteredTransactions = selectedMonth === 'all' 
            ? transactions.filter(t => t.status === 'COMPLETED')
            : transactions.filter(t => {
                const date = new Date(t.transactionDate);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === selectedMonth && t.status === 'COMPLETED';
            });

        const totalEarnings = filteredTransactions
            .filter(t => t.type === 'EARNING')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalWithdrawals = filteredTransactions
            .filter(t => t.type === 'WITHDRAWAL')
            .reduce((sum, t) => sum + t.amount, 0);

        setSummary({
            totalEarnings,
            totalWithdrawals,
            balance: totalEarnings - totalWithdrawals
        });
    };

    /**
     * Generates a formatted date key string based on the current graphInterval
     * @param {Date} date - The date to generate a key from
     * @returns {string} A formatted string in one of these formats:
     * - Monthly: "YYYY-MM" 
     * - Weekly: "YYYY-WW-D" (WW=week number, D=day of week)
     * - Daily: "YYYY-MM-DD"
     */
    const getKey = (date) => {
        const year = date.getFullYear();
        const monthStr = String(date.getMonth() + 1).padStart(2, '0');
        if (graphInterval === 'monthly') {
            return `${year}-${monthStr}`;
        } else if (graphInterval === 'weekly') {
            const weekNumber = Math.ceil(date.getDate() / 7);
            return `${year}-${monthStr} S${weekNumber}`;
        } else {
            return `${year}-${monthStr}-${String(date.getDate()).padStart(2, '0')}`;
        }
    }

    const getChartData = () => {
        const filteredTransactions = selectedMonth === 'all'
            ? transactions.filter(t => t.status === 'COMPLETED')
            : transactions.filter(t => {
                const date = new Date(t.transactionDate);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === selectedMonth && t.status === 'COMPLETED';
            });

        const data = filteredTransactions.reduce((acc, transaction) => {
            const date = new Date(transaction.transactionDate);
            const key = getKey(date);
            
            if (!acc[key]) {
                acc[key] = {
                    earnings: 0,
                    withdrawals: 0
                };
            }

            if (transaction.type === 'EARNING') {
                acc[key].earnings += transaction.amount;
            } else {
                acc[key].withdrawals += transaction.amount;
            }

            return acc;
        }, {});

        const sortedKeys = Object.keys(data).sort();

        return {
            options: {
                chart: {
                    type: 'area',
                    height: 350
                },
                xaxis: {
                    categories: sortedKeys,
                    title: {
                        text: ({monthly: 'Transacciones por mes', weekly: 'Transacciones por semana', daily: 'Transacciones por dia'})[graphInterval]
                    }
                },
                yaxis: {
                    title: {
                        text: 'Monto (USD)'
                    }
                },
                colors: ['#4CAF50', '#f44336']
            },
            series: [
                {
                    name: 'Ganancias',
                    data: sortedKeys.map(key => data[key].earnings)
                },
                {
                    name: 'Retiros',
                    data: sortedKeys.map(key => data[key].withdrawals)
                }
            ]
        };
    };

    const refreshTransactions = () => {
        setLoading(true);
        callAPI(`/api/transactions`)
            .then((data) => {
                setTransactions(data)
            })
            .catch(error => toast.error(error?.message || _('error_loading_transactions')))
            .finally(() => setLoading(false));
    };

    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const toggleRowExpanded = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getAvailableMonths = () => {
        const months = new Set();
        transactions.forEach(t => {
            const date = new Date(t.transactionDate);
            months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
        });
        return Array.from(months).sort().reverse();
    };

    const formatMonthOption = (monthKey) => {
        if (monthKey === 'all') return 'Todos los tiempos';
        const [year, month] = monthKey.split('-');
        return `${new Date(year, month - 1).toLocaleString('es', { month: 'long' })} ${year}`;
    };

    return (
        <div className="w-full my-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card>
                    <CardBody>
                        <Typography variant="h6" color="green">
                            Ganado
                        </Typography>
                        <Typography variant="h4">
                            {formatCurrency(summary.totalEarnings)}
                        </Typography>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <Typography variant="h6" color="red">
                            Retirado
                        </Typography>
                        <Typography variant="h4">
                            {formatCurrency(summary.totalWithdrawals)}
                        </Typography>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <Typography variant="h6" color="blue">
                            Saldo actual
                        </Typography>
                        <Typography variant="h4">
                            {formatCurrency(summary.balance)}
                        </Typography>
                    </CardBody>
                </Card>
            </div>

            <Card className="mb-4">
                <CardHeader floated={false} shadow={false}>
                    <div className="flex justify-between items-center">
                        <Typography variant="h6">
                            Ganancias en el tiempo
                        </Typography>
                        <div className="flex gap-4">
                            <div className="w-48">
                                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                                    <option value="all">Todos los tiempos</option>
                                    {getAvailableMonths().map(month => (
                                        <option key={month} value={month}>
                                            {formatMonthOption(month)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-48">
                                <select value={graphInterval} onChange={(e) => setGraphInterval(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                                    <option value="monthly">Mensual</option>
                                    <option value="weekly">Semanal</option>
                                    <option value="daily">Diario</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    {!loading && transactions.length > 0 && (
                        <Chart
                            // @ts-ignore
                            options={getChartData().options}
                            series={getChartData().series}
                            type="area"
                            height={350}
                        />
                    )}
                </CardBody>
            </Card>

            <Card>
                <CardHeader floated={false} shadow={false} className="rounded-none">
                    <div className="flex items-center justify-between gap-8 mb-4">
                        <div>
                            <Typography variant="h5" color="blue-gray">
                                {_('Transacciones')}
                            </Typography>
                            <Typography color="gray" className="mt-1 font-normal">
                                {_('Ver todas las transacciones (Ingresos y Retiros)')}
                            </Typography>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="overflow-x-scroll px-0">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Spinner />
                        </div>
                    ) : transactions.length === 0 ? (
                        <Alert>{_('no_transactions_found')}</Alert>
                    ) : (
                        <table className="w-full min-w-[400px] table-auto text-left">
                            <thead>
                                <tr>
                                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                                            Fecha
                                        </Typography>
                                    </th>
                                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                                            Tipo
                                        </Typography>
                                    </th>
                                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                                            Monto Final
                                        </Typography>
                                    </th>
                                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                                            Estado
                                        </Typography>
                                    </th>
                                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                                            Origen
                                        </Typography>
                                    </th>
                                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                        <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                                            Detalles
                                        </Typography>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => (
                                    <>
                                        <tr key={transaction.id}>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Typography variant="small" color="blue-gray">
                                                    {formatDate(transaction.transactionDate)}
                                                </Typography>
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Typography variant="small" color="blue-gray">
                                                    {transaction.type === 'EARNING' ? _('Ingreso') : _('Retiro')}
                                                </Typography>
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Typography variant="small" color={transaction.type === 'EARNING' ? 'green' : 'red'}>
                                                    {formatCurrency(transaction.amount, transaction.currency)}
                                                </Typography>
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Typography variant="small" color="blue-gray">
                                                    {transaction.status}
                                                </Typography>
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Typography variant="small" color="blue-gray">
                                                    {transaction.origin}
                                                </Typography>
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <IconButton
                                                    variant="text"
                                                    onClick={() => toggleRowExpanded(transaction.id)}
                                                >
                                                    {expandedRows[transaction.id] ? '▼' : '▶'}
                                                </IconButton>
                                            </td>
                                        </tr>
                                        {expandedRows[transaction.id] && (
                                            <tr>
                                                <td colSpan={6} className="p-2 border-b border-blue-gray-50 bg-blue-gray-50/50">
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap gap-4">
                                                            <Typography variant="small" color="blue-gray">
                                                                Antes de comisiones: {formatCurrency(transaction.beforeFeesAmount, transaction.currency)}
                                                            </Typography>
                                                            <Typography variant="small" color="red">
                                                                Comisión PayPal: {formatCurrency(transaction.paypalFee || 0, transaction.currency)}
                                                            </Typography>
                                                            <Typography variant="small" color="red">
                                                                Comisión Capibara: {formatCurrency(transaction.capibaraFee || 0, transaction.currency)}
                                                            </Typography>
                                                        </div>
                                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                                            {transaction.description}
                                                        </Typography>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardBody>
            </Card>
            <ToastContainer theme="dark" />
        </div>
    );
}
