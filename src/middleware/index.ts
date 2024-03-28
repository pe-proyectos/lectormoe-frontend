import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    context.locals.theme = context.cookies.get('theme')?.value === 'light' ? 'light' : 'black';

    context.locals.token = context.cookies.get('token')?.value;
    context.locals.username = context.cookies.get('username')?.value;
    context.locals.userSlug = context.cookies.get('userSlug')?.value;
    
    try {
        context.locals.member = context.cookies.get('member')?.value ? JSON.parse(context.cookies.get('member')?.value!) : undefined;
    } catch (error) {
    }

    const callAPI = async (url: string, fetchOptions?: Partial<RequestInit> & { includeIp?: any }) => {
        const API_URL = Bun.env["PUBLIC_API_URL"] || '';
        const response = await fetch(API_URL + url, {
            ...(fetchOptions || {}),
            headers: {
                'organization-domain': context.url.hostname,
                'Content-Type': 'application/json',
                'Authorization': context.locals.token ? `Bearer ${context.locals.token}` : '',
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
            callAPI(`/api/organization/check?domain=${context.url.hostname}`),
        ]);

        if (authCheck?.status === true) {
            context.locals.token = authCheck.data.token;
            context.locals.username = authCheck.data.username;
            context.locals.userSlug = authCheck.data.userSlug;
            context.locals.member = authCheck.data.member;
            context.cookies.set('token', authCheck.data.token, { maxAge: 60 * 60 * 24 * 7 });
            context.cookies.set('username', authCheck.data.username, { maxAge: 60 * 60 * 24 * 7 });
            context.cookies.set('userSlug', authCheck.data.userSlug, { maxAge: 60 * 60 * 24 * 7 });
            context.cookies.set('member', JSON.stringify(authCheck.data.member), { maxAge: 60 * 60 * 24 * 7 });
            context.locals.logged = true;
        } else {
            context.locals.token = undefined;
            context.locals.username = undefined;
            context.locals.userSlug = undefined;
            context.locals.member = undefined;
            context.cookies.set('token', '', { maxAge: 0 });
            context.cookies.set('username', '', { maxAge: 0 });
            context.cookies.set('userSlug', '', { maxAge: 0 });
            context.cookies.set('member', '', { maxAge: 0 });
            context.locals.logged = false;
        }

        if (organizationCheck?.status === true) {
            context.locals.organization = organizationCheck.data;
        }

        context.locals.logged = context.locals.token ? true : false;

        if (!context.locals.logged && context.url.pathname.startsWith('/admin')) {
            return context.redirect("/login");
        }

        // Social Redirects
        if (context.url.pathname === "/facebook") {
            return context.redirect(organizationCheck?.data?.facebookUrl || "/");
        } else if (context.url.pathname === "/instagram") {
            return context.redirect(organizationCheck?.data?.instagramUrl || "/");
        } else if (context.url.pathname === "/x") {
            return context.redirect(organizationCheck?.data?.twitterUrl || "/");
        } else if (context.url.pathname === "/youtube") {
            return context.redirect(organizationCheck?.data?.youtubeUrl || "/");
        } else if (context.url.pathname === "/patreon") {
            return context.redirect(organizationCheck?.data?.patreonUrl || "/");
        } else if (context.url.pathname === "/discord") {
            return context.redirect(organizationCheck?.data?.discordUrl || "/");
        } else if (context.url.pathname === "/tiktok") {
            return context.redirect(organizationCheck?.data?.tiktokUrl || "/");
        } else if (context.url.pathname === "/twitch") {
            return context.redirect(organizationCheck?.data?.twitchUrl || "/");
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
