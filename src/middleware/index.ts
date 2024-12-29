import { defineMiddleware } from "astro:middleware";
import { getIP } from "../util/get-ip";

export const onRequest = defineMiddleware(async (context, next) => {
    context.locals.theme = context.cookies.get('theme')?.value === 'light' ? 'light' : 'black';

    if (context.url.pathname === '/logout') {
        const redirectTo = context.url.searchParams.get('redirect') || '/';
        context.cookies.delete('token');
        context.cookies.delete('username');
        context.cookies.delete('userSlug');
        context.cookies.delete('user');
        context.locals.token = undefined;
        context.locals.username = undefined;
        context.locals.userSlug = undefined;
        context.locals.user = undefined;
        return context.redirect(redirectTo);
    }

    context.locals.token = context.cookies.get('token')?.value;
    context.locals.username = context.cookies.get('username')?.value;
    context.locals.userSlug = context.cookies.get('userSlug')?.value;
    
    try {
        context.locals.user = context.cookies.get('user')?.value ? JSON.parse(context.cookies.get('user')?.value!) : undefined;
    } catch (error) {
    }

    const callAPI = async (url: string, fetchOptions?: Partial<RequestInit> & { includeIp?: any }) => {
        const API_URL = process.env["PUBLIC_API_URL"] || '';
        const response = await fetch(API_URL + url, {
            ...(fetchOptions || {}),
            headers: {
                'organization-domain': process.env["PUBLIC_OVERRIDE_ORGANIZATION_DOMAIN"] || context.url.hostname,
                'Content-Type': 'application/json',
                'Authorization': context.locals.token ? `Bearer ${context.locals.token}` : '',
                'ip': getIP(context.request.headers) || "0.0.0.0",
                ...(fetchOptions?.headers || {}),
            },
        });
        const data = await response.json();
        return data;
    }

    context.locals.callAPI = callAPI;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const months: { [key: number]: string } = {
            0: 'ENE',
            1: 'FEB',
            2: 'MAR',
            3: 'ABR',
            4: 'MAY',
            5: 'JUN',
            6: 'JUL',
            7: 'AGO',
            8: 'SEP',
            9: 'OCT',
            10: 'NOV',
            11: 'DIC',
        }
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }

    context.locals.formatDate = formatDate;

    try {
        const [authCheck, organizationCheck] = await Promise.all([
            callAPI('/api/auth/check'),
            callAPI(`/api/organization/check?domain=${process.env["PUBLIC_OVERRIDE_ORGANIZATION_DOMAIN"] || context.url.hostname}`),
        ]);

        if (authCheck?.status === true) {
            context.locals.token = authCheck.data.token;
            context.locals.username = authCheck.data.user.username;
            context.locals.userSlug = authCheck.data.user.slug;
            if (authCheck.data.user) {
                context.locals.user = authCheck.data.user;
            }
            context.cookies.set('token', authCheck.data.token, { maxAge: 60 * 60 * 24 * 7 });
            context.cookies.set('username', authCheck.data.user.username, { maxAge: 60 * 60 * 24 * 7 });
            context.cookies.set('userSlug', authCheck.data.user.slug, { maxAge: 60 * 60 * 24 * 7 });
            if (authCheck.data.user) {
                context.cookies.set('user', JSON.stringify(authCheck.data.user), { maxAge: 60 * 60 * 24 * 7 });
            }
            context.locals.logged = true;
        } else {
            context.locals.token = undefined;
            context.locals.username = undefined;
            context.locals.userSlug = undefined;
            context.locals.user = undefined;
            context.cookies.set('token', '', { maxAge: 0 });
            context.cookies.set('username', '', { maxAge: 0 });
            context.cookies.set('userSlug', '', { maxAge: 0 });
            context.cookies.set('user', '', { maxAge: 0 });
            context.locals.logged = false;
        }

        if (organizationCheck?.status !== true) {
            return context.redirect("/404");
        }

        context.locals.organization = organizationCheck.data;

        if (context.url.pathname === "/ads.txt") {
            const adstxt = organizationCheck.data?.googleAdsAdsTxtContent || "";
            return new Response(adstxt, {
            headers: { "Content-Type": "text/plain" },
            });
        }

        if (organizationCheck.data.useBlockedCountries || organizationCheck.data.useAllowedCountries) {
            const userCountry = context.request.headers.get('cf-ipcountry') || "XX";
            if (userCountry) {
                const countryOption = organizationCheck.data.countryOptions.find((option: any) => option.countryCode === userCountry.trim().toUpperCase().slice(0, 2));
                if (countryOption) {
                    if (organizationCheck.data.useBlockedCountries &&countryOption.blocked) {
                        return new Response("Country blocked", {
                            status: 403,
                            headers: { "Content-Type": "text/plain" },
                        });
                    }
                    if (organizationCheck.data.useAllowedCountries && !countryOption.allowed) {
                        return new Response("Country not allowed", {
                            status: 403,
                            headers: { "Content-Type": "text/plain" },
                        });
                    }
                }
            }

        }

        context.locals.formatDate = (dateString: string) => {
            const date = new Date(dateString);
            const day = date.getDate().toString().padStart(2, '0');
            const months: { [key: number]: string } = ({
                es: {
                    0: 'ENE',
                    1: 'FEB',
                    2: 'MAR',
                    3: 'ABR',
                    4: 'MAY',
                    5: 'JUN',
                    6: 'JUL',
                    7: 'AGO',
                    8: 'SEP',
                    9: 'OCT',
                    10: 'NOV',
                    11: 'DIC',
                },
                en: {
                    0: 'JAN',
                    1: 'FEB',
                    2: 'MAR',
                    3: 'APR',
                    4: 'MAY',
                    5: 'JUN',
                    6: 'JUL',
                    7: 'AUG',
                    8: 'SEP',
                    9: 'OCT',
                    10: 'NOV',
                    11: 'DEC',
                },
                pt: {
                    0: 'JAN',
                    1: 'FEV',
                    2: 'MAR',
                    3: 'ABR',
                    4: 'MAI',
                    5: 'JUN',
                    6: 'JUL',
                    7: 'AGO',
                    8: 'SET',
                    9: 'OUT',
                    10: 'NOV',
                    11: 'DEZ',
                },
            } as any)[context.locals.organization.language];
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            return `${day} ${month} ${year}`;
        };

        context.locals.logged = context.locals.token ? true : false;

        if (context.url.pathname.startsWith('/admin')) {
            if (!context.locals.logged) {
                return context.redirect("/login");
            }
            if (!context.locals.user?.canSeeAdminPanel) {
                return context.redirect("/");
            }
        }

        return await next();
    } catch (error) {
        // @ts-ignore
        if (error?.message === 'Not found') {
            console.warn('Ocurrió un error not_found en ' + context.request.url);
            return context.redirect('/404');
        }
        console.error(error);
        console.warn('Ocurrió un error 500 en ' + context.request.url);
        return context.redirect('/500');
    }
});
