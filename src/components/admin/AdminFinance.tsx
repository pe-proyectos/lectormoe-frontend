import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { DollarSign, TrendingUp, TrendingDown, Wallet, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Select from './ui/Select';
import { callAPI } from '../../util/callApi';
import { getTranslator } from '../../util/translate';

interface Transaction {
  id: number;
  transactionDate: string;
  type: 'EARNING' | 'WITHDRAWAL';
  amount: number;
  beforeFeesAmount: number;
  paypalFee: number;
  capibaraFee: number;
  currency: string;
  status: string;
  origin: string;
  description: string;
}

interface MonthlyData {
  month: string;
  year: number;
  revenue: number;
  subscriptionPayments: number;
  revenueByOrigin: Record<string, number>;
}

interface SubscriptionsByPlanData {
  month: string;
  year: number;
  totalSubscriptions: number;
  subscriptionsByPlan: Record<string, { count: number; planId: number; price: number }>;
}

interface AdminFinanceProps {
  language: string;
  organization: any;
  organizationSlug: string;
}

const formatCurrency = (amount: number, currency = 'USD') => {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const AdminFinance: React.FC<AdminFinanceProps> = ({ language, organization, organizationSlug }) => {
  const _ = getTranslator(language);

  const [loading, setLoading] = useState(true);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [subscriptionsByPlanData, setSubscriptionsByPlanData] = useState<SubscriptionsByPlanData[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [graphInterval, setGraphInterval] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalWithdrawals: 0,
    balance: 0,
  });

  useEffect(() => {
    refreshTransactions();
    fetchMonthlyRevenue();
    fetchSubscriptionsByPlan();
  }, []);

  useEffect(() => {
    calculateSummary();
  }, [transactions, selectedMonth]);

  const fetchMonthlyRevenue = () => {
    setMonthlyLoading(true);
    callAPI('/api/monthly-revenue')
      .then((response) => {
        if (response && Array.isArray(response)) {
          setMonthlyData(response);
        }
      })
      .catch((error) => {
        console.error('Error loading monthly revenue:', error);
        toast.error('Error cargando ingresos mensuales');
      })
      .finally(() => setMonthlyLoading(false));
  };

  const fetchSubscriptionsByPlan = () => {
    setSubscriptionsLoading(true);
    callAPI('/api/subscriptions-by-plan')
      .then((response) => {
        if (response && Array.isArray(response)) {
          setSubscriptionsByPlanData(response);
        }
      })
      .catch((error) => {
        console.error('Error loading subscriptions by plan:', error);
        toast.error('Error cargando suscripciones por plan');
      })
      .finally(() => setSubscriptionsLoading(false));
  };

  const calculateSummary = () => {
    const filteredTransactions =
      selectedMonth === 'all'
        ? transactions.filter((t) => t.status === 'COMPLETED')
        : transactions.filter((t) => {
            const date = new Date(t.transactionDate);
            return (
              `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === selectedMonth &&
              t.status === 'COMPLETED'
            );
          });

    const totalEarnings = filteredTransactions
      .filter((t) => t.type === 'EARNING')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = filteredTransactions
      .filter((t) => t.type === 'WITHDRAWAL')
      .reduce((sum, t) => sum + t.amount, 0);

    setSummary({
      totalEarnings,
      totalWithdrawals,
      balance: totalEarnings - totalWithdrawals,
    });
  };

  const refreshTransactions = () => {
    setLoading(true);
    callAPI(`/api/transactions`)
      .then((data) => {
        setTransactions(data);
      })
      .catch((error) => toast.error(error?.message || 'Error al cargar transacciones'))
      .finally(() => setLoading(false));
  };

  const toggleRowExpanded = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getAvailableMonths = () => {
    const months = new Set<string>();
    transactions.forEach((t) => {
      const date = new Date(t.transactionDate);
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse();
  };

  const formatMonthOption = (monthKey: string) => {
    if (monthKey === 'all') return 'Todos los tiempos';
    const [year, month] = monthKey.split('-');
    return `${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('es', {
      month: 'long',
    })} ${year}`;
  };

  const getChartData = () => {
    const filteredTransactions =
      selectedMonth === 'all'
        ? transactions.filter((t) => t.status === 'COMPLETED')
        : transactions.filter((t) => {
            const date = new Date(t.transactionDate);
            return (
              `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === selectedMonth &&
              t.status === 'COMPLETED'
            );
          });

    const data = filteredTransactions.reduce((acc: any, transaction) => {
      const date = new Date(transaction.transactionDate);
      const key =
        graphInterval === 'monthly'
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          : graphInterval === 'weekly'
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')} S${Math.ceil(date.getDate() / 7)}`
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (!acc[key]) {
        acc[key] = { earnings: 0, withdrawals: 0 };
      }

      if (transaction.type === 'EARNING') {
        acc[key].earnings += transaction.amount;
      } else {
        acc[key].withdrawals += transaction.amount;
      }

      return acc;
    }, {});

    const sortedKeys = Object.keys(data).sort();

    // Formato para ResponsiveBar
    return sortedKeys.map((key) => ({
      periodo: key,
      Ganancias: Math.round(data[key].earnings * 100) / 100,
      Retiros: Math.round(data[key].withdrawals * 100) / 100,
    }));
  };

  // Obtener todos los orígenes únicos
  const allOrigins = Array.from(
    new Set(monthlyData.flatMap((item) => Object.keys(item.revenueByOrigin || {})))
  );

  // Mapear nombres de origen más legibles
  const originLabels: Record<string, string> = {
    'SUBSCRIPTION': 'Suscripciones',
    'ADSENSE': 'AdSense',
    'DONATION': 'Donaciones',
    'AFFILIATE': 'Afiliados',
    'SPONSOR': 'Patrocinios',
    'OTHER': 'Otros',
  };

  const monthlyBarData = monthlyData && monthlyData.length > 0 
    ? monthlyData.map((item) => {
        const data: any = {
          mes: `${item.month} ${item.year}`,
        };
        
        // Agregar cada origen como una key separada
        if (item.revenueByOrigin) {
          Object.entries(item.revenueByOrigin).forEach(([origin, amount]) => {
            const label = originLabels[origin] || origin;
            data[label] = Math.round(amount * 100) / 100;
          });
        }
        
        return data;
      })
    : [];

  // Colores para cada tipo de ingreso
  const originColors: Record<string, string> = {
    'Suscripciones': '#06b6d4',
    'AdSense': '#10b981',
    'Donaciones': '#f59e0b',
    'Afiliados': '#8b5cf6',
    'Patrocinios': '#ec4899',
    'Otros': '#6b7280',
  };

  const barChartKeys = allOrigins.map(origin => originLabels[origin] || origin);
  const barChartColors = barChartKeys.map(key => originColors[key] || '#6b7280');

  // Obtener todos los planes únicos
  const allPlans = Array.from(
    new Set(subscriptionsByPlanData.flatMap((item) => Object.keys(item.subscriptionsByPlan || {})))
  );

  // Preparar datos para gráfico de suscripciones por plan
  const subscriptionsBarData = subscriptionsByPlanData && subscriptionsByPlanData.length > 0
    ? subscriptionsByPlanData.map((item) => {
        const data: any = {
          mes: `${item.month} ${item.year}`,
        };

        // Agregar cada plan como una key separada
        if (item.subscriptionsByPlan) {
          Object.entries(item.subscriptionsByPlan).forEach(([planName, planData]) => {
            data[planName] = planData.count;
          });
        }

        return data;
      })
    : [];

  // Colores para cada plan (usando gradiente de cyan a púrpura)
  const planColors = [
    '#06b6d4', // cyan-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#6366f1', // indigo-500
  ];

  const subscriptionBarColors = allPlans.map((_, index) => planColors[index % planColors.length]);

  // Datos para gráfico de distribución
  const distributionData = [
    {
      id: 'Ganancias',
      label: 'Ganancias',
      value: summary.totalEarnings,
      color: '#06b6d4',
    },
    {
      id: 'Retiros',
      label: 'Retiros',
      value: summary.totalWithdrawals,
      color: '#ef4444',
    },
  ];

  const totalMonthlyRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
  const avgMonthlyRevenue = monthlyData.length > 0 ? totalMonthlyRevenue / monthlyData.length : 0;

  // Calcular ingresos totales por origen
  const totalRevenueByOrigin: Record<string, number> = {};
  monthlyData.forEach((item) => {
    if (item.revenueByOrigin) {
      Object.entries(item.revenueByOrigin).forEach(([origin, amount]) => {
        totalRevenueByOrigin[origin] = (totalRevenueByOrigin[origin] || 0) + amount;
      });
    }
  });

  // Calcular totales de suscripciones
  const totalNewSubscriptions = subscriptionsByPlanData.reduce((sum, item) => sum + item.totalSubscriptions, 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <TrendingUp size={24} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Total Ganado</p>
              <p className="text-2xl font-black text-white">{formatCurrency(summary.totalEarnings)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <TrendingDown size={24} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Total Retirado</p>
              <p className="text-2xl font-black text-white">{formatCurrency(summary.totalWithdrawals)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <Wallet size={24} className="text-cyan-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Saldo Actual</p>
              <p className="text-2xl font-black text-white">{formatCurrency(summary.balance)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      {!monthlyLoading && monthlyData.length > 0 && (
        <Card>
          <div className="mb-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
              Ingresos por Tipo - Últimos 3 Meses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
                <p className="text-sm text-zinc-400">Total 3 Meses</p>
                <p className="text-xl font-bold text-cyan-500">{formatCurrency(totalMonthlyRevenue)}</p>
              </div>
              <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
                <p className="text-sm text-zinc-400">Promedio Mensual</p>
                <p className="text-xl font-bold text-cyan-500">{formatCurrency(avgMonthlyRevenue)}</p>
              </div>
              <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
                <p className="text-sm text-zinc-400">Origen Principal</p>
                {Object.keys(totalRevenueByOrigin).length > 0 ? (
                  <>
                    <p className="text-xl font-bold text-cyan-500">
                      {originLabels[Object.entries(totalRevenueByOrigin).sort((a, b) => b[1] - a[1])[0][0]] || 
                       Object.entries(totalRevenueByOrigin).sort((a, b) => b[1] - a[1])[0][0]}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {formatCurrency(Object.entries(totalRevenueByOrigin).sort((a, b) => b[1] - a[1])[0][1])}
                    </p>
                  </>
                ) : (
                  <p className="text-xl font-bold text-zinc-500">-</p>
                )}
              </div>
            </div>
          </div>
          <div style={{ height: '400px' }}>
            {monthlyBarData.length > 0 && barChartKeys.length > 0 && (
              <ResponsiveBar
                data={monthlyBarData}
                keys={barChartKeys}
                indexBy="mes"
                margin={{ top: 20, right: 150, bottom: 60, left: 80 }}
                padding={0.3}
                groupMode="grouped"
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={barChartColors}
                borderRadius={4}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: '',
                  legendOffset: 36,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Ingresos (USD)',
                  legendOffset: -60,
                  format: (value) => value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value}`,
                }}
                enableLabel={false}
                legends={[
                  {
                    dataFrom: 'keys',
                    anchor: 'right',
                    direction: 'column',
                    justify: false,
                    translateX: 140,
                    translateY: 0,
                    itemsSpacing: 8,
                    itemWidth: 120,
                    itemHeight: 20,
                    itemDirection: 'left-to-right',
                    itemOpacity: 0.85,
                    symbolSize: 12,
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]}
                tooltip={({ id, value, indexValue, color }) => (
                  <div className="bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div
                        style={{ backgroundColor: color }}
                        className="w-3 h-3 rounded-sm"
                      />
                      <span className="text-sm font-bold text-white">{id}:</span>
                      <span className="text-sm text-zinc-300">{formatCurrency(value as number)}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{indexValue}</p>
                  </div>
                )}
                theme={{
                  background: 'transparent',
                  textColor: '#71717a',
                  fontSize: 11,
                  axis: {
                    domain: { line: { stroke: '#27272a', strokeWidth: 1 } },
                    ticks: { line: { stroke: '#27272a', strokeWidth: 1 } },
                  },
                  grid: { line: { stroke: '#27272a', strokeWidth: 1 } },
                  legends: {
                    text: { fill: '#a1a1aa', fontSize: 11 },
                  },
                }}
              />
            )}
          </div>
        </Card>
      )}

      {/* Transaction Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Suscripciones por Plan */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Suscripciones por Plan</h3>
          </div>
          <div style={{ height: '400px' }}>
            {!subscriptionsLoading && subscriptionsBarData.length > 0 && allPlans.length > 0 && (
              <ResponsiveBar
                data={subscriptionsBarData}
                keys={allPlans}
                indexBy="mes"
                margin={{ top: 20, right: 150, bottom: 60, left: 80 }}
                padding={0.3}
                groupMode="grouped"
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={subscriptionBarColors}
                borderRadius={4}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: '',
                  legendOffset: 36,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Cantidad de Suscripciones',
                  legendOffset: -60,
                  format: (value) => Math.round(value),
                }}
                enableLabel={true}
                label={(d) => d.value > 0 ? String(d.value) : ''}
                labelTextColor="#ffffff"
                legends={[
                  {
                    dataFrom: 'keys',
                    anchor: 'right',
                    direction: 'column',
                    justify: false,
                    translateX: 140,
                    translateY: 0,
                    itemsSpacing: 8,
                    itemWidth: 120,
                    itemHeight: 20,
                    itemDirection: 'left-to-right',
                    itemOpacity: 0.85,
                    symbolSize: 12,
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]}
                tooltip={({ id, value, indexValue, color }) => (
                  <div className="bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div
                        style={{ backgroundColor: color }}
                        className="w-3 h-3 rounded-sm"
                      />
                      <span className="text-sm font-bold text-white">{id}:</span>
                      <span className="text-sm text-zinc-300">{value} suscripciones</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{indexValue}</p>
                  </div>
                )}
                theme={{
                  background: 'transparent',
                  textColor: '#71717a',
                  fontSize: 11,
                  axis: {
                    domain: { line: { stroke: '#27272a', strokeWidth: 1 } },
                    ticks: { line: { stroke: '#27272a', strokeWidth: 1 } },
                  },
                  grid: { line: { stroke: '#27272a', strokeWidth: 1 } },
                  legends: {
                    text: { fill: '#a1a1aa', fontSize: 11 },
                  },
                  labels: {
                    text: {
                      fontSize: 12,
                      fontWeight: 600,
                    },
                  },
                }}
              />
            )}
          </div>
        </Card>

        {/* Pie Chart - Distribución */}
        <Card>
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">Distribución Total</h3>
          <div style={{ height: '400px' }}>
            {distributionData.length > 0 && distributionData[0].value > 0 && (
              <ResponsivePie
                data={distributionData}
                margin={{ top: 20, right: 20, bottom: 80, left: 20 }}
                innerRadius={0.6}
                padAngle={2}
                cornerRadius={4}
                activeOuterRadiusOffset={8}
                colors={['#06b6d4', '#ef4444']}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#a1a1aa"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="#ffffff"
                arcLabel={(d) => `$${(d.value / 1000).toFixed(1)}K`}
                tooltip={({ datum }) => (
                  <div className="bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div
                        style={{ backgroundColor: datum.color }}
                        className="w-3 h-3 rounded-full"
                      />
                      <span className="text-sm font-bold text-white">{datum.label}:</span>
                      <span className="text-sm text-zinc-300">{formatCurrency(datum.value)}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {((datum.value / (distributionData[0].value + distributionData[1].value)) * 100).toFixed(1)}% del total
                    </p>
                  </div>
                )}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 56,
                    itemsSpacing: 20,
                    itemWidth: 100,
                    itemHeight: 18,
                    itemTextColor: '#a1a1aa',
                    itemDirection: 'left-to-right',
                    itemOpacity: 1,
                    symbolSize: 12,
                    symbolShape: 'circle',
                  },
                ]}
                theme={{
                  background: 'transparent',
                  textColor: '#71717a',
                  fontSize: 12,
                }}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card padding="none">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Transacciones</h3>
          <p className="text-sm text-zinc-400 mt-1">Ver todas las transacciones (Ingresos y Retiros)</p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign size={48} className="mx-auto text-zinc-700 mb-3" />
              <p className="text-zinc-500">No se encontraron transacciones</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-zinc-900/60 border-b border-zinc-800">
                <tr>
                  <th className="p-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Fecha</th>
                  <th className="p-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Tipo</th>
                  <th className="p-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Monto</th>
                  <th className="p-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Estado</th>
                  <th className="p-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Origen</th>
                  <th className="p-4 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {transactions.map((transaction) => (
                  <React.Fragment key={transaction.id}>
                    <tr className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4 text-sm text-zinc-300">{formatDate(transaction.transactionDate)}</td>
                      <td className="p-4">
                        <Badge variant={transaction.type === 'EARNING' ? 'success' : 'danger'}>
                          {transaction.type === 'EARNING' ? 'Ingreso' : 'Retiro'}
                        </Badge>
                      </td>
                      <td className={`p-4 text-sm font-bold ${transaction.type === 'EARNING' ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </td>
                      <td className="p-4">
                        <Badge variant={transaction.status === 'COMPLETED' ? 'success' : 'warning'}>
                          {transaction.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-zinc-400">{transaction.origin}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleRowExpanded(transaction.id)}
                          className="p-1 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {expandedRows[transaction.id] ? (
                            <ChevronUp size={18} className="text-zinc-400" />
                          ) : (
                            <ChevronDown size={18} className="text-zinc-400" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRows[transaction.id] && (
                      <tr>
                        <td colSpan={6} className="p-4 bg-zinc-900/40">
                          <div className="space-y-2 text-sm">
                            <div className="flex gap-6 text-zinc-400">
                              <span>
                                Antes de comisiones:{' '}
                                <span className="text-zinc-300 font-semibold">
                                  {formatCurrency(transaction.beforeFeesAmount, transaction.currency)}
                                </span>
                              </span>
                              <span>
                                Comisión PayPal:{' '}
                                <span className="text-red-400 font-semibold">
                                  {formatCurrency(transaction.paypalFee || 0, transaction.currency)}
                                </span>
                              </span>
                              <span>
                                Comisión Capibara:{' '}
                                <span className="text-red-400 font-semibold">
                                  {formatCurrency(transaction.capibaraFee || 0, transaction.currency)}
                                </span>
                              </span>
                            </div>
                            <p className="text-zinc-400">{transaction.description}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminFinance;

