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
import { AdminUserDialog } from './AdminUserDialog';
import { PageNavigation } from '../PageNavigation';
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";

export function AdminUserGrid({ organization }) {
    const _ = getTranslator(organization.language);

    const [loading, setLoading] = useState(true);
    const [userList, setUserList] = useState([]);
    const [total, setTotal] = useState(0);
    const [selectedManga, setSelectedManga] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
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
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);

    useEffect(() => {
        callAPI(`/api/subscription-plan`)
          .then(({ data }) => {
            setSubscriptionPlans(data);
          })
          .catch((error) => toast.error(error?.message));
      }, []);
    useEffect(() => {
        refreshUserList();
    }, []);

    useEffect(() => {
        refreshUserList();
    }, [page]);

    useEffect(() => {
        setPage(1);
    }, [orderBy]);

    useEffect(() => {
        setPage(1);
    }, [limit]);

    useEffect(() => {
        if (!isUserDialogOpen) refreshUserList();
    }, [isUserDialogOpen]);
    
    const handleCardClick = (user) => {
        setSelectedUser(user);
        setIsUserDialogOpen(true);
    }

    const refreshUserList = () => {
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
        callAPI(`/api/user?${query}`)
            .then(({ data, total, maxPage }) => {
                setTotal(total);
                setUserList(data);
                setMaxPage(maxPage || 1);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    }

    return (
        <div className="w-full my-4">
            <div className='w-full flex flex-col gap-2 sm:gap-4 select-none my-4'>
                <p className='font-semibold text-xl'>{_("user_list")} ({total || '-'})</p>
                <div className="w-80">
                    <Input
                        label={_("search_email")}
                        placeholder={_("search_by_email")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="w-80">
                    <Input
                        label={_("search_username")}
                        placeholder={_("search_by_username")}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div className="w-80">
                    <Select
                        label={_("order_by")}
                        onChange={(val) => setOrderBy(val)}
                    >
                        <Option value="createdAt_desc" selected={orderBy === 'createdAt_desc'}>{_("registration_date_newest_first")}</Option>
                        <Option value="createdAt_asc" selected={orderBy === 'createdAt_asc'}>{_("registration_date_oldest_first")}</Option>
                        <Option value="username_asc" selected={orderBy === 'username_asc'}>{_("username_a_z")}</Option>
                        <Option value="username_desc" selected={orderBy === 'username_desc'}>{_("username_z_a")}</Option>
                    </Select>
                </div>
                <div className="w-80">
                    <Select
                        label={_("show")}
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
                        onClick={() => refreshUserList()}
                    >
                        {_("search")}
                    </Button>
                </div>
            </div>
            <div className='w-full flex flex-wrap items-center justify-around gap-2 sm:gap-4 select-none my-4'>
                <div className="flex items-center gap-8 bg-blue-gray-500 p-2 rounded-md">
                    <PageNavigation
                        organization={organization}
                        page={page}
                        maxPage={maxPage}
                        setPage={setPage}
                        loading={loading}
                        data={userList}
                    />
                </div>
            </div>
            <AdminUserDialog
                organization={organization}
                open={isUserDialogOpen}
                setOpen={setIsUserDialogOpen}
                user={selectedUser}
                setUser={setSelectedUser}
                subscriptionPlans={subscriptionPlans}
            />
            <div className="max-w-lg">
                {loading && <Spinner className='m-4 w-full' />}
                {!loading && userList.length === 0 &&
                    <Alert>
                        {_("no_users_to_show")}
                    </Alert>
                }
            </div>
            <div className="flex flex-wrap gap-4">
                {userList.map(user => (
                    <Card
                        key={user.id}
                        className="w-96 shadow-md"
                    >
                        <CardBody>
                            <Typography variant="h5" color="blue-gray" className="mb-2">
                                {user.username}
                            </Typography>
                            <Typography>
                                {_("role")}: {user.role || _("user")}
                            </Typography>
                            <Typography>
                                {_("email")}: {user.email}
                            </Typography>
                            <Typography>
                                {_("registration_date")}: {new Date(user.createdAt).toLocaleString()}
                            </Typography>
                        </CardBody>
                        <CardFooter className="pt-0">
                            <Button
                                onClick={() => handleCardClick(user)}
                            >
                                {_("edit")}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
            <div className='w-full flex flex-wrap items-center justify-around gap-2 sm:gap-4 select-none my-4'>
                <div className="flex items-center gap-8 bg-blue-gray-500 p-2 rounded-md">
                    <PageNavigation
                        organization={organization}
                        page={page}
                        maxPage={maxPage}
                        setPage={setPage}
                        loading={loading}
                        data={userList}
                    />
                </div>
            </div>
        </div>
    );
}
