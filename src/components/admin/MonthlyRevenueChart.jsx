import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Card, CardHeader, CardBody, Typography, Spinner } from "@material-tailwind/react";
import ReactApexChart from "react-apexcharts";
import { callAPI } from "../../util/callApi";
// formatCurrency function (same as in AdminFinance.jsx)
const formatCurrency = (amount, currency = "USD") => {
  if (amount === null || amount === undefined) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export function MonthlyRevenueChart() {
    const [monthlyData, setMonthlyData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMonthlyRevenue();
    }, []);

    const fetchMonthlyRevenue = () => {
        setLoading(true);
        callAPI('/api/monthly-revenue')
            .then((response) => {
                if (response && Array.isArray(response)) {
                    setMonthlyData(response);
                } else {
                    console.error('Invalid response format:', response);
                    toast.error('Error cargando datos de ingresos mensuales');
                }
            })
            .catch(error => {
                console.error('Error loading monthly revenue:', error);
                toast.error('Error cargando datos de ingresos mensuales');
            })
            .finally(() => setLoading(false));
    };

    if (loading) {
        return (
            <Card className="mb-4">
                <CardHeader>
                    <Typography variant="h6">
                        Ingresos de los Últimos 3 Meses
                    </Typography>
                </CardHeader>
                <CardBody>
                    <div className="flex justify-center items-center p-8">
                        <Spinner className="w-8 h-8" />
                    </div>
                </CardBody>
            </Card>
        );
    }

    if (!monthlyData || monthlyData.length === 0) {
        return (
            <Card className="mb-4">
                <CardHeader>
                    <Typography variant="h6">
                        Ingresos de los Últimos 3 Meses
                    </Typography>
                </CardHeader>
                <CardBody>
                    <Typography variant="small" color="gray">
                        No hay datos de ingresos disponibles
                    </Typography>
                </CardBody>
            </Card>
        );
    }

    // Prepare chart data
    const chartData = {
        series: [{
            name: 'Ingresos Netos',
            data: monthlyData.map(item => item.revenue)
        }, {
            name: 'Suscripciones Pagadas',
            data: monthlyData.map(item => item.subscriptionPayments)
        }],
        options: {
            chart: {
                type: 'line',
                height: 350,
                toolbar: {
                    show: false
                }
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            dataLabels: {
                enabled: true,
                formatter: function (val, { seriesIndex }) {
                    if (seriesIndex === 0) {
                        return formatCurrency(val);
                    } else {
                        return val;
                    }
                },
                style: {
                    fontSize: '12px',
                    colors: ['#304758']
                }
            },
            xaxis: {
                categories: monthlyData.map(item => `${item.month} ${item.year}`),
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis: [{
                title: {
                    text: 'Ingresos Netos ($)',
                    style: {
                        fontSize: '14px',
                        fontWeight: 600
                    }
                },
                labels: {
                    formatter: function (val) {
                        return formatCurrency(val);
                    }
                }
            }, {
                opposite: true,
                title: {
                    text: 'Suscripciones Pagadas',
                    style: {
                        fontSize: '14px',
                        fontWeight: 600
                    }
                },
                labels: {
                    formatter: function (val) {
                        return Math.round(val);
                    }
                }
            }],
            fill: {
                opacity: 1
            },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function (val, { seriesIndex }) {
                        if (seriesIndex === 0) {
                            return formatCurrency(val);
                        } else {
                            return `${val} suscripciones`;
                        }
                    }
                }
            },
            grid: {
                borderColor: '#e7e7e7',
                row: {
                    colors: ['#f3f3f3', 'transparent'],
                    opacity: 0.5
                }
            }
        }
    };

    // Calculate summary statistics
    const totalRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
    const averageRevenue = totalRevenue / monthlyData.length;
    const maxRevenue = Math.max(...monthlyData.map(item => item.revenue));
    const minRevenue = Math.min(...monthlyData.map(item => item.revenue));
    
    const totalSubscriptions = monthlyData.reduce((sum, item) => sum + item.subscriptionPayments, 0);
    const averageSubscriptions = totalSubscriptions / monthlyData.length;
    const maxSubscriptions = Math.max(...monthlyData.map(item => item.subscriptionPayments));
    const minSubscriptions = Math.min(...monthlyData.map(item => item.subscriptionPayments));

    return (
        <Card className="mb-4">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <Typography variant="h6">
                        Ingresos de los Últimos 3 Meses
                    </Typography>
                    <button
                        onClick={fetchMonthlyRevenue}
                        className="text-blue-500 hover:text-blue-700"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </CardHeader>
            <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-green-50 rounded-lg">
                        <Typography variant="small" color="green" className="font-medium">
                            Total Ingresos 3 Meses
                        </Typography>
                        <Typography variant="h6" color="green">
                            {formatCurrency(totalRevenue)}
                        </Typography>
                        <Typography variant="small" color="gray">
                            {totalSubscriptions} suscripciones
                        </Typography>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <Typography variant="small" color="blue" className="font-medium">
                            Promedio Mensual
                        </Typography>
                        <Typography variant="h6" color="blue">
                            {formatCurrency(averageRevenue)}
                        </Typography>
                        <Typography variant="small" color="gray">
                            {Math.round(averageSubscriptions)} suscripciones
                        </Typography>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                        <Typography variant="small" color="orange" className="font-medium">
                            Mes Más Alto
                        </Typography>
                        <Typography variant="h6" color="orange">
                            {formatCurrency(maxRevenue)}
                        </Typography>
                        <Typography variant="small" color="gray">
                            {maxSubscriptions} suscripciones
                        </Typography>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                        <Typography variant="small" color="red" className="font-medium">
                            Mes Más Bajo
                        </Typography>
                        <Typography variant="h6" color="red">
                            {formatCurrency(minRevenue)}
                        </Typography>
                        <Typography variant="small" color="gray">
                            {minSubscriptions} suscripciones
                        </Typography>
                    </div>
                </div>

                <ReactApexChart
                    // @ts-ignore
                    options={chartData.options}
                    series={chartData.series}
                    type="line"
                    height={350}
                />

                <div className="mt-4">
                    <Typography variant="small" color="gray" className="text-center">
                        * Los ingresos mostrados son netos (después de comisiones de PayPal y Capibara)
                    </Typography>
                    <Typography variant="small" color="gray" className="text-center">
                        * Las suscripciones pagadas incluyen solo transacciones vinculadas a suscripciones activas
                    </Typography>
                </div>
            </CardBody>
        </Card>
    );
}
