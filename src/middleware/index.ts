import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    context.locals.theme = context.cookies.get('theme')?.value === 'light' ? 'light' : 'black';

    context.locals.token = context.cookies.get('token')?.value;
    context.locals.username = context.cookies.get('username')?.value;
    context.locals.user_slug = context.cookies.get('user_slug')?.value;

    const callAPI = async (url: string, fetchOptions?: RequestInit) => {
        const API_URL = Bun.env["PUBLIC_API_URL"] || '';
        const response = await fetch(API_URL + url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': context.locals.token ? `Bearer ${context.locals.token}` : ''
            },
            ...(fetchOptions || {})
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
        const domain = context.url.hostname;

        const [authCheck, organizationCheck] = await Promise.all([
            callAPI('/api/auth/check'),
            callAPI(`/api/organization/check?domain=${domain}`),
        ]);

        if (authCheck?.status !== true) {
            context.locals.token = undefined;
            context.locals.username = undefined;
            context.locals.user_slug = undefined;
            context.cookies.set('token', '', { maxAge: 0 });
            context.cookies.set('username', '', { maxAge: 0 });
            context.cookies.set('user_slug', '', { maxAge: 0 });
            context.locals.logged = false;
        }

        if (organizationCheck?.status === true) {
            context.locals.organization = organizationCheck.data;
        }

        context.locals.logged = context.locals.token ? true : false;

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
