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

        const API_URL = import.meta.env.PUBLIC_API_URL;
        
        // Usar cookieStore si está disponible, sino usar document.cookie como fallback
        let token: any = null;
        let organizationDomain: any = null;
        
        if (typeof window !== 'undefined' && (window as any).cookieStore) {
            try {
                // @ts-ignore
                token = await window.cookieStore.get('token');
                // @ts-ignore
                organizationDomain = await window.cookieStore.get('organization-domain');
            } catch (e) {
                // Si cookieStore falla, usar document.cookie
            }
        }
        
        // Fallback a document.cookie si cookieStore no está disponible o falló
        if (!token || !organizationDomain) {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                if (key && value) {
                    acc[key] = decodeURIComponent(value);
                }
                return acc;
            }, {} as Record<string, string>);
            
            if (!token && cookies['token']) {
                token = { value: cookies['token'] };
            }
            if (!organizationDomain && cookies['organization-domain']) {
                organizationDomain = { value: cookies['organization-domain'] };
            }
        }
        
        // Determinar si estamos en la landing page
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const firstSegment = pathSegments[0] || '';
        const reservedRoutes = ['admin', 'login', 'register', 'logout', '404', '500', 'forgot', 'search', 'scans', 'subscriptions', 'organizations', 'manga', 'profile'];
        // Si el segundo segmento es 'login' o 'register', entonces el primero es un slug de organización
        const isOrgLoginPage = pathSegments.length === 2 && (pathSegments[1] === 'login' || pathSegments[1] === 'register');
        const isLandingPage = window.location.pathname === '/' || (firstSegment && reservedRoutes.includes(firstSegment) && !isOrgLoginPage);
        
        // Determinar el organization-domain a usar
        let orgDomain: string | null = null;
        
        if (!isLandingPage || isOrgLoginPage) {
            // Si estamos en una página de login/register de organización, usar el slug
            if (isOrgLoginPage) {
                orgDomain = firstSegment;
            } else {
                // Solo buscar organization-domain si NO estamos en la landing page
                // Ignorar cookie si estamos en landing page
                orgDomain = import.meta.env.PUBLIC_OVERRIDE_ORGANIZATION_DOMAIN || null;
                if (!orgDomain && organizationDomain?.value) {
                    orgDomain = organizationDomain.value;
                }
                if (!orgDomain) {
                    // Si el primer segmento no es una ruta reservada, usarlo como slug
                    if (firstSegment && !reservedRoutes.includes(firstSegment)) {
                        orgDomain = firstSegment; // Usar slug
                    }
                }
            }
        }
        // Si estamos en landing page global, forzar orgDomain a null (ignorar cookie y override)
        
        // Construir headers
        const headers: Record<string, string> = {
            ...((!fetchOptions?.body) || (fetchOptions?.body instanceof FormData) ? {} : { 'Content-Type': 'application/json' }),
            'Authorization': token?.value ? `Bearer ${token?.value}` : '',
            ...(fetchOptions?.headers || {}),
            ...(fetchOptions?.includeIp ? { 'ip': await getIpFromCloudflare() } : {}),
        };
        
        // Solo agregar organization-domain si no estamos en la landing page global y tenemos un dominio
        // O si estamos en una página de login/register de organización
        if ((!isLandingPage || isOrgLoginPage) && orgDomain) {
            headers['organization-domain'] = orgDomain;
        }
        
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
