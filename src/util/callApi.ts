import 'cookie-store';

const clientIp = document.getElementById('client-ip')?.getAttribute('content');
console.log(clientIp);


async function getIpFromCloudflare() {
    let f = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
    let data = await f.text();
    let ipRegex = /[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}/;
    return data.match(ipRegex)?.[0];
}

export const callAPI = async (url: string, fetchOptions?: Partial<RequestInit> & { includeIp?: any }) => {
    try {
        const API_URL = import.meta.env.PUBLIC_API_URL;
        // @ts-ignore
        const token = await cookieStore.get('token');
        const response = await fetch(API_URL + url, {
            ...(fetchOptions || {}),
            headers: {
                'organization-domain': import.meta.env.PUBLIC_OVERRIDE_ORGANIZATION_DOMAIN || location.hostname,
                ...((!fetchOptions?.body) || (fetchOptions?.body instanceof FormData) ? {} : { 'Content-Type': 'application/json' }),
                'Authorization': token?.value ? `Bearer ${token?.value}` : '',
                ...(fetchOptions?.headers || {}),
                ...(fetchOptions?.includeIp ? { 'ip': await getIpFromCloudflare() } : {}),
            },
        });
        const result = await response.json();
        if (result?.status === false) {
            console.warn(`callAPI status failed at ${url} with ${fetchOptions ? JSON.stringify(fetchOptions) : '{}'}`);
            console.error(result);
            throw new Error(result?.message || result?.error || 'Error desconocido al contactar con el servidor.');
        }
        return result.data;
    } catch (error: any) {
        console.warn(`callAPI failed at ${url} with ${fetchOptions ? JSON.stringify(fetchOptions) : '{}'} error message: ${error?.message}`);
        console.error(error);
        throw error;
    }
}
