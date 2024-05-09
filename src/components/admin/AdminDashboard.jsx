import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import Chart from "react-apexcharts";
import {
    Textarea,
    Button,
    Dialog,
    Spinner,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Input,
    Checkbox,
    Accordion,
    AccordionHeader,
    AccordionBody,
    Switch,
} from "@material-tailwind/react";
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import { DropzoneArea } from 'material-ui-dropzone';
import { DatePicker } from '../DatePicker';
import { ImageDropzone } from '../ImageDropzone';
import { AdminMangaProfileDialog } from './AdminMangaProfileDialog';
import { callAPI } from '../../util/callApi';

export function AdminDashboard() {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);

    // form
    const [from, setFrom] = useState(() => new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7));
    const [to, setTo] = useState(() => new Date());


    useEffect(() => {
        refreshOrganization();
    }, [from, to]);

    const refreshOrganization = () => {
        setLoading(true);
        const params = new URLSearchParams();
        params.append("from", from);
        params.append("to", to);
        callAPI(`/api/analytics?${params}`)
            .then(stats => {
                console.log("stats", stats);
                setStats(stats);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    };

    if (loading) {
        return <Spinner />;
    }

    /*
        events:
        - view_manga_profile
        - view_manga_chapter
        - view_manga_search
        - view_login_page
        - view_register_page
        - action_login
        - action_register
        - action_search_manga
        others:
        - manga_views_treemap
    */

    const LineChartCard = ({ title, data, labels, type }) => (
        <div className="shadow-md rounded-md p-4">
            <Typography className="mb-4" variant="h4" color="blue-gray">
                {title}
            </Typography>
            <Chart
                options={{
                    xaxis: {
                        categories: labels || []
                    }
                }}
                series={[
                    {
                        name: "Vistas",
                        data: data || []
                    }
                ]}
                type={type || "line"}
                width="450"
            />
        </div>
    );

    return (
        <div className="p-4">
            <div className="flex flex-wrap gap-2 mb-4">
                <div>
                    <Typography variant="h6" color="gray">
                        Desde
                    </Typography>
                    <DatePicker
                        value={from}
                        onChange={setFrom}
                        disabled={loading}
                    />
                </div>
                <div>
                    <Typography variant="h6" color="gray">
                        Hasta
                    </Typography>
                    <DatePicker
                        value={to}
                        onChange={setTo}
                        disabled={loading}
                    />
                </div>

            </div>
            <div className="flex flex-wrap gap-4 justify-around">
                <div className="shadow-md rounded-md p-4">
                    <Typography className="mb-4" variant="h4" color="blue-gray">
                        Caja de Popularidad (Por vistas)
                    </Typography>
                    <Chart
                        options={{}}
                        series={[{ data: stats?.manga_views_treemap || [] }]}
                        type="treemap"
                        width="520"
                        height="520"
                    />
                </div>
                <div className="shadow-md rounded-md p-4">
                    <Typography className="mb-4" variant="h4" color="blue-gray">
                        Dona de Popularidad (Top 6 con mas vistas)
                    </Typography>
                    <Chart
                        options={{
                            labels: (stats?.manga_views_treemap || []).slice(0, 6).map((item, index) => `${index + 1}.- ${item.x}`),
                            legend: {
                                position: "bottom"
                            }
                        }}
                        series={(stats?.manga_views_treemap || []).slice(0, 6).map(item => item.y)}
                        type="pie"
                        width="520"
                        height="520"
                    />
                </div>
            </div>
            <div className="flex flex-wrap gap-4 justify-around">
                <LineChartCard
                    title="Vistas de Perfil de Manga"
                    data={stats?.view_manga_profile?.series || []}
                    labels={stats?.view_manga_profile?.labels || []}
                />
                <LineChartCard
                    title="Vistas del Buscador de Mangas"
                    data={stats?.view_manga_search?.series || []}
                    labels={stats?.view_manga_search?.labels || []}
                />
                <LineChartCard
                    title="Vistas del Login"
                    data={stats?.view_login_page?.series || []}
                    labels={stats?.view_login_page?.labels || []}
                />
                <LineChartCard
                    title="Vistas del Registro"
                    data={stats?.view_register_page?.series || []}
                    labels={stats?.view_register_page?.labels || []}
                />
                <LineChartCard
                    title="Busquedas de mangas"
                    data={stats?.action_search_manga?.series || []}
                    labels={stats?.action_search_manga?.labels || []}
                    type="bar"
                />
                <LineChartCard
                    title="Lecturas de Cápitulos"
                    data={stats?.view_manga_chapter?.series || []}
                    labels={stats?.view_manga_chapter?.labels || []}
                    type="bar"
                />
                <LineChartCard
                    title="Inicios de Sesión"
                    data={stats?.action_login?.series || []}
                    labels={stats?.action_login?.labels || []}
                    type="bar"
                />
                <LineChartCard
                    title="Registros de Usuarios"
                    data={stats?.action_register?.series || []}
                    labels={stats?.action_register?.labels || []}
                    type="bar"
                />
            </div>
        </div>
    );
}
