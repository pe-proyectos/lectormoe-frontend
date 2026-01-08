import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ResponsiveTreeMap } from '@nivo/treemap';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { Calendar, TrendingUp, Eye, Users, BookOpen, Search, Loader2 } from 'lucide-react';
import { DatePicker } from '../DatePicker';
import { callAPI } from '../../util/callApi';
import Card from './ui/Card';

interface AdminDashboardProps {
  organization: any;
  language?: string;
  organizationSlug: string;
}

interface StatsData {
  manga_views_treemap?: Array<{ x: string; y: number }>;
  view_manga_profile?: { series: number[]; labels: string[] };
  view_manga_search?: { series: number[]; labels: string[] };
  view_login_page?: { series: number[]; labels: string[] };
  view_register_page?: { series: number[]; labels: string[] };
  action_search_manga?: { series: number[]; labels: string[] };
  view_manga_chapter?: { series: number[]; labels: string[] };
  action_login?: { series: number[]; labels: string[] };
  action_register?: { series: number[]; labels: string[] };
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ organization, language, organizationSlug }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [from, setFrom] = useState(() => new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7));
  const [to, setTo] = useState(() => new Date());

  useEffect(() => {
    refreshOrganization();
  }, [from, to]);

  const refreshOrganization = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('from', from.toISOString());
    params.append('to', to.toISOString());
    callAPI(`/api/analytics?${params}`)
      .then((stats) => {
        setStats(stats);
      })
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoading(false));
  };

  const LineChartCard: React.FC<{ title: string; icon: React.ElementType; data: number[]; labels: string[] }> = ({ 
    title, 
    icon: Icon, 
    data, 
    labels,
  }) => {
    // Validar que existan datos
    if (!data || !labels || data.length === 0 || labels.length === 0) {
      return (
        <Card className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Icon size={20} className="text-cyan-500" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
          </div>
          <div className="h-[250px] flex items-center justify-center text-zinc-600 text-sm">
            Sin datos disponibles
          </div>
        </Card>
      );
    }

    const chartData = [{
      id: 'vistas',
      data: labels.map((label, i) => ({
        x: label,
        y: data[i] || 0,
      })),
    }];

    return (
      <Card className="flex-1 min-w-[300px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Icon size={20} className="text-cyan-500" />
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
        </div>
        <div style={{ height: '250px' }}>
          <ResponsiveLine
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
            curve="monotoneX"
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
            }}
            colors={['#06b6d4']}
            pointSize={6}
            pointColor="#06b6d4"
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            enableArea={true}
            areaOpacity={0.1}
            useMesh={true}
            theme={{
              background: 'transparent',
              textColor: '#71717a',
              fontSize: 11,
              axis: {
                domain: {
                  line: {
                    stroke: '#27272a',
                    strokeWidth: 1,
                  },
                },
                ticks: {
                  line: {
                    stroke: '#27272a',
                    strokeWidth: 1,
                  },
                },
              },
              grid: {
                line: {
                  stroke: '#27272a',
                  strokeWidth: 1,
                },
              },
            }}
          />
        </div>
      </Card>
    );
  };

  const BarChartCard: React.FC<{ title: string; icon: React.ElementType; data: number[]; labels: string[] }> = ({ 
    title, 
    icon: Icon, 
    data, 
    labels,
  }) => {
    // Validar que existan datos
    if (!data || !labels || data.length === 0 || labels.length === 0) {
      return (
        <Card className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Icon size={20} className="text-cyan-500" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
          </div>
          <div className="h-[250px] flex items-center justify-center text-zinc-600 text-sm">
            Sin datos disponibles
          </div>
        </Card>
      );
    }

    const chartData = labels.map((label, i) => ({
      id: label,
      label: label,
      value: data[i] || 0,
    }));

    return (
      <Card className="flex-1 min-w-[300px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Icon size={20} className="text-cyan-500" />
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
        </div>
        <div style={{ height: '250px' }}>
          <ResponsiveBar
            data={chartData}
            keys={['value']}
            indexBy="label"
            margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
            padding={0.3}
            colors={['#06b6d4']}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            theme={{
              background: 'transparent',
              textColor: '#71717a',
              fontSize: 11,
              axis: {
                domain: {
                  line: {
                    stroke: '#27272a',
                    strokeWidth: 1,
                  },
                },
                ticks: {
                  line: {
                    stroke: '#27272a',
                    strokeWidth: 1,
                  },
                },
              },
              grid: {
                line: {
                  stroke: '#27272a',
                  strokeWidth: 1,
                },
              },
            }}
          />
        </div>
      </Card>
    );
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-cyan-500 animate-spin" />
          <span className="text-zinc-400 font-medium">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 md:space-y-8">
      {/* Date Filters */}
      <Card>
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Calendar size={20} className="text-cyan-500 flex-shrink-0" />
          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Filtros de Fecha</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 w-full sm:min-w-[200px]">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 block">
              Desde
            </label>
            <DatePicker
              language={language}
              value={from}
              onChange={setFrom}
              disabled={loading}
            />
          </div>
          <div className="flex-1 w-full sm:min-w-[200px]">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 block">
              Hasta
            </label>
            <DatePicker
              language={language}
              value={to}
              onChange={setTo}
              disabled={loading}
            />
          </div>
        </div>
      </Card>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <TrendingUp size={20} className="text-cyan-500" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              Popularidad por Vistas
            </h3>
          </div>
          <div style={{ height: '400px' }}>
            {stats?.manga_views_treemap && stats.manga_views_treemap.length > 0 ? (
              <ResponsiveTreeMap
                data={{
                  name: 'mangas',
                  children: stats.manga_views_treemap.map((item) => ({
                    name: item.x,
                    value: item.y,
                  })),
                }}
                identity="name"
                value="value"
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                labelSkipSize={12}
                labelTextColor="#18181b"
                parentLabelTextColor="#ffffff"
                colors={['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#083344']}
                borderColor="#27272a"
                theme={{
                  background: 'transparent',
                  textColor: '#ffffff',
                  fontSize: 11,
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                Sin datos disponibles
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <BookOpen size={20} className="text-cyan-500" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              Top 6 Más Vistos
            </h3>
          </div>
          <div style={{ height: '400px' }}>
            {stats?.manga_views_treemap && stats.manga_views_treemap.length > 0 ? (
              <ResponsivePie
                data={stats.manga_views_treemap.slice(0, 6).map((item, index) => ({
                  id: `${index + 1}. ${item.x}`,
                  label: `${index + 1}. ${item.x}`,
                  value: item.y,
                }))}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                colors={['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#083344']}
                borderWidth={1}
                borderColor="#27272a"
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#a1a1aa"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="#18181b"
                theme={{
                  background: 'transparent',
                  textColor: '#a1a1aa',
                  fontSize: 11,
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                Sin datos disponibles
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="flex flex-wrap gap-6">
        <LineChartCard
          title="Vistas de Perfiles"
          icon={Eye}
          data={stats?.view_manga_profile?.series || []}
          labels={stats?.view_manga_profile?.labels || []}
        />
        <LineChartCard
          title="Búsquedas de Manga"
          icon={Search}
          data={stats?.view_manga_search?.series || []}
          labels={stats?.view_manga_search?.labels || []}
        />
        <LineChartCard
          title="Vistas de Login"
          icon={Users}
          data={stats?.view_login_page?.series || []}
          labels={stats?.view_login_page?.labels || []}
        />
        <LineChartCard
          title="Vistas de Registro"
          icon={Users}
          data={stats?.view_register_page?.series || []}
          labels={stats?.view_register_page?.labels || []}
        />
        <BarChartCard
          title="Búsquedas Realizadas"
          icon={Search}
          data={stats?.action_search_manga?.series || []}
          labels={stats?.action_search_manga?.labels || []}
        />
        <BarChartCard
          title="Lecturas de Capítulos"
          icon={BookOpen}
          data={stats?.view_manga_chapter?.series || []}
          labels={stats?.view_manga_chapter?.labels || []}
        />
        <BarChartCard
          title="Inicios de Sesión"
          icon={Users}
          data={stats?.action_login?.series || []}
          labels={stats?.action_login?.labels || []}
        />
        <BarChartCard
          title="Registros de Usuarios"
          icon={Users}
          data={stats?.action_register?.series || []}
          labels={stats?.action_register?.labels || []}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;

