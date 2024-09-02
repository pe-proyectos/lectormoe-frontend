import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Card,
    CardHeader,
    CardBody,
    Input,
    Checkbox,
    Button,
    Typography,
} from "@material-tailwind/react";
import 'cookie-store';
import { callAPI } from '../util/callApi';
import { getTranslator } from "../util/translate";

export function LoginCard({ organization }) {
    const _ = getTranslator(organization.language);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        callAPI('/api/analytics', {
            method: 'POST',
            includeIp: true,
            body: JSON.stringify({
                event: 'view_login_page',
                path: window.location.pathname,
                userAgent: window.navigator.userAgent,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                payload: {},
            }),
        }).catch(err => console.error(err));
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        // Disable button to prevent multiple submissions
        event.target.querySelector('button').disabled = true;

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        try {
            callAPI('/api/analytics', {
                method: 'POST',
                includeIp: true,
                body: JSON.stringify({
                    event: 'action_login',
                    path: window.location.pathname,
                    userAgent: window.navigator.userAgent,
                    screenWidth: window.screen.width,
                    screenHeight: window.screen.height,
                    payload: {},
                }),
            }).catch(err => console.error(err));

            const data = await callAPI('/api/auth/login', {
                method: "POST",
                body: formData,
            });

            await Promise.all([
                cookieStore.set("token", data.token),
                cookieStore.set("username", data.username),
                cookieStore.set("userSlug", data.userSlug),
                data?.member ? cookieStore.set("member", JSON.stringify(data.member)) : null,
            ]);
            // Redirect to homepage after successful login
            window.location.href = "/";
        } catch (error) {
            console.error('Error logging in:', error);
            toast.error(error?.message || _("error_logging_in"), {
                position: "bottom-right",
            }).showToast();
        } finally {
            // Re-enable button
            event.target.querySelector('button').disabled = false;
        }
    };

    return (
        <Card>
            <CardHeader
                variant="gradient"
                className="mb-4 grid h-28 p-2 place-items-center bg-gradient-to-r from-blue-900 to-pink-900 text-white"
            >
                <Typography className='text-2xl sm:text-5xl font-extrabold'>
                    {_("login")}
                </Typography>
                <Typography className="font-normal p-2 hidden sm:block">
                    {_("login_description")}
                </Typography>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
                <form onSubmit={handleSubmit} className="mt-8 mb-2 max-w-80 mx-auto">
                    <div className="mb-1 flex flex-col gap-6">
                        <Typography variant="h6" color="blue-gray" className="-mb-3">
                            {_("username_or_email")}
                        </Typography>
                        <Input
                            size="lg"
                            placeholder="name@mail.com"
                            className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
                            autoComplete='email'
                            labelProps={{
                                className: "before:content-none after:content-none",
                            }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Typography variant="h6" color="blue-gray" className="-mb-3">
                            {_("password")}
                        </Typography>
                        <Input
                            type="password"
                            size="lg"
                            placeholder="********"
                            autoComplete='current-password'
                            className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
                            labelProps={{
                                className: "before:content-none after:content-none",
                            }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <Button type="submit" className="mt-6" fullWidth>
                        {_("login")}
                    </Button>
                    <Typography color="gray" className="mt-4 text-center font-normal">
                        {_("dont_have_an_account")}{" "}
                        <a href="#" className="font-medium text-gray-900">
                            {_("register_here")}
                        </a>
                    </Typography>
                </form>
            </CardBody>
        </Card>
    );
}
