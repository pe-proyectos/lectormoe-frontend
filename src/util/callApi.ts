async function getIpFromCloudflare() {
    let f = await fetch('https://ipv4-check-perf.radar.cloudflare.com/api/info');
    let data = await f.json();
    return data.ip_address;
}

export const callAPI = async (url: string, fetchOptions?: Partial<RequestInit> & { includeIp?: any }) => {
    try {
        // Verificar si estamos en el cliente
        if (typeof window === 'undefined') {
            throw new Error('callAPI can only be called on the client side');
        }

        const API_URL = import.meta.env["PUBLIC_API_URL"];
        
        // Obtener token de cookies
        let token: any = null;

        if (typeof window !== 'undefined' && (window as any).cookieStore) {
            try {
                // @ts-ignore
                token = await window.cookieStore.get('token');
            } catch (e) {
                // Si cookieStore falla, usar document.cookie
            }
        }

        // Fallback a document.cookie si cookieStore no está disponible o falló
        if (!token) {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                if (key && value) {
                    acc[key] = decodeURIComponent(value);
                }
                return acc;
            }, {} as Record<string, string>);

            if (cookies['token']) {
                token = { value: cookies['token'] };
            }
        }
        
        // Determinar si estamos en la landing page
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const firstSegment = pathSegments[0] || '';
        const reservedRoutes = ['admin', 'login', 'register', 'logout', '404', '500', 'forgot', 'search', 'scans', 'subscriptions', 'organizations', 'manga', 'profile', 'joint', 'joints', 'list', 'notifications', 'writings', 'luckys', 'terms', 'privacy', 'dmca', 'listas', 'reclutamiento'];
        // Si el segundo segmento es 'login' o 'register', entonces el primero es un slug de organización
        const isOrgLoginPage = pathSegments.length === 2 && (pathSegments[1] === 'login' || pathSegments[1] === 'register');
        const isLandingPage = window.location.pathname === '/' || (firstSegment && reservedRoutes.includes(firstSegment) && !isOrgLoginPage);

        // Determinar el x-organization SOLO desde el path actual (NO cookies)
        let orgDomain: string | null = null;

        if (firstSegment === 'red' && pathSegments.length > 1) {
            // /red/{slug}/... → usar el segundo segmento como org
            // /red/writings/{slug}/... → usar el tercer segmento como org
            if (pathSegments[1] === 'writings' && pathSegments.length > 2) {
                const actualSlug = pathSegments[2];
                if (!reservedRoutes.includes(actualSlug)) orgDomain = actualSlug;
            } else {
                const actualSlug = pathSegments[1];
                if (!reservedRoutes.includes(actualSlug)) orgDomain = actualSlug;
            }
        } else if (firstSegment === 'writings' && pathSegments.length > 1) {
            // /writings/{slug}/... → usar el segundo segmento como org
            const actualSlug = pathSegments[1];
            if (!reservedRoutes.includes(actualSlug)) orgDomain = actualSlug;
        } else if (!isLandingPage) {
            // Si estamos en una página de organización, extraer slug del path
            if (firstSegment && !reservedRoutes.includes(firstSegment)) {
                orgDomain = firstSegment;
            }
        }
        // Si estamos en landing page, orgDomain permanece null
        
        // Construir headers
        const headers: Record<string, string> = {
            ...((!fetchOptions?.body) || (fetchOptions?.body instanceof FormData) ? {} : { 'Content-Type': 'application/json' }),
            ...(token?.value ? { 'Authorization': `Bearer ${token.value}` } : {}),
            ...(orgDomain ? { 'x-organization': orgDomain } : {}),
            ...(fetchOptions?.headers || {}),
            ...(fetchOptions?.includeIp ? { 'ip': await getIpFromCloudflare() } : {}),
        };
        
        const response = await fetch(API_URL + url, {
            ...(fetchOptions || {}),
            headers,
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
