import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Card,
    CardBody,
    CardFooter,
    Button,
    Typography,
    Spinner,
    Alert,
    Select,
    Option,
    Input,
} from "@material-tailwind/react";
import { AdminMangaCustomCard } from './AdminMangaCustomCard';
import { AdminMangaCustomDialog } from './AdminMangaCustomDialog';
import { PageNavigation } from '../PageNavigation';
import { callAPI } from '../../util/callApi';

export function AdminUsersGrid() {
    const [loading, setLoading] = useState(true);
    const [memberList, setMemberList] = useState([]);
    const [total, setTotal] = useState(0);
    const [selectedManga, setSelectedManga] = useState(null);
    const [isCreateMangaCustomDialogOpen, setIsCreateMangaCustomDialogOpen] = useState(false);
    const [email, setEmail] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('email') || '';
    });
    const [username, setUsername] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('username') || '';
    });
    const [orderBy, setOrderBy] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('order') || 'createdAt_desc';
    });
    const [lastSearchQuery, setLastSearchQuery] = useState('');
    const [page, setPage] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return Number(urlParams.get('page')) || 1;
    });
    const [maxPage, setMaxPage] = useState(1);
    const [limit, setLimit] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return Number(urlParams.get('limit')) || 24;
    });

    useEffect(() => {
        refreshMemberList();
    }, []);

    useEffect(() => {
        refreshMemberList();
    }, [page]);

    useEffect(() => {
        setPage(1);
    }, [orderBy]);

    useEffect(() => {
        setPage(1);
    }, [limit]);

    const refreshMemberList = () => {
        setLoading(true);
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('page', page);
        urlParams.set('limit', limit);
        urlParams.set('order', orderBy);
        const query = new URLSearchParams({
            page,
            limit: limit,
            order: orderBy,
        });
        if (email) {
            query.set('email', email);
            urlParams.set('email', email);
        }
        if (username) {
            query.set('username', username);
            urlParams.set('username', username);
        }
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
        callAPI(`/api/member?${query}`)
            .then(({ data, total, maxPage }) => {
                setTotal(total);
                setMemberList(data);
                setMaxPage(maxPage || 1);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    }

    return (
        <div className="w-full my-4">
            <div className='w-full flex flex-col gap-2 sm:gap-4 select-none my-4'>
                <p className='font-semibold text-xl'>Lista de usuarios ({total || '-'})</p>
                <div className="w-80">
                    <Input
                        label="Buscar Email"
                        placeholder="Buscar por Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="w-80">
                    <Input
                        label="Buscar Nombre de Usuario"
                        placeholder="Buscar por Nombre de Usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div className="w-80">
                    <Select
                        label="Ordenar por"
                        onChange={(val) => setOrderBy(val)}
                    >
                        <Option value="createdAt_desc" selected={orderBy === 'createdAt_desc'}>Fecha de Registro (Mas reciente primero)</Option>
                        <Option value="createdAt_asc" selected={orderBy === 'createdAt_asc'}>Fecha de Registro (Mas antiguo primero)</Option>
                        <Option value="username_asc" selected={orderBy === 'username_asc'}>Nombre de Usuario (A-Z)</Option>
                        <Option value="username_desc" selected={orderBy === 'username_desc'}>Nombre de Usuario (Z-A)</Option>
                    </Select>
                </div>
                <div className="w-80">
                    <Select
                        label="Mostrar"
                        onChange={(val) => setLimit(val)}
                    >
                        <Option value="12" selected={limit === 12}>12</Option>
                        <Option value="24" selected={limit === 24}>24</Option>
                        <Option value="48" selected={limit === 48}>48</Option>
                        <Option value="96" selected={limit === 96}>96</Option>
                    </Select>
                </div>
                <div className="w-80">
                    <Button
                        variant='outlined'
                        onClick={() => refreshMemberList()}
                    >
                        Buscar
                    </Button>
                </div>
            </div>
            <div className='w-full flex flex-wrap items-center justify-around gap-2 sm:gap-4 select-none my-4'>
                <div className="flex items-center gap-8 bg-blue-gray-500 p-2 rounded-md">
                    <PageNavigation
                        page={page}
                        maxPage={maxPage}
                        setPage={setPage}
                        loading={loading}
                        data={memberList}
                    />
                </div>
            </div>
            <div className="max-w-lg">
                {loading && <Spinner className='m-4 w-full' />}
                {!loading && memberList.length === 0 &&
                    <Alert>
                        No hay miembros para mostrar, prueba refinando tu busqueda.
                    </Alert>
                }
            </div>
            <div className="flex flex-wrap gap-4">
                {memberList.map(member => (
                    <Card
                        key={member.id}
                        className="w-96 shadow-md"
                    >
                        <CardBody>
                            <Typography variant="h5" color="blue-gray" className="mb-2">
                                {member.user.username}
                            </Typography>
                            <Typography>
                                Rol: {member.role}
                            </Typography>
                            <Typography>
                                Email: {member.user.email}
                            </Typography>
                            <Typography>
                                Fecha Registro: {new Date(member.user.createdAt).toLocaleString()}
                            </Typography>
                        </CardBody>
                        {/* <CardFooter className="pt-0">
                            <Button>Ver Detalles</Button>
                        </CardFooter> */}
                    </Card>
                ))}
            </div>
            <div className='w-full flex flex-wrap items-center justify-around gap-2 sm:gap-4 select-none my-4'>
                <div className="flex items-center gap-8 bg-blue-gray-500 p-2 rounded-md">
                    <PageNavigation
                        page={page}
                        maxPage={maxPage}
                        setPage={setPage}
                        loading={loading}
                        data={memberList}
                    />
                </div>
            </div>
        </div>
    );
}
