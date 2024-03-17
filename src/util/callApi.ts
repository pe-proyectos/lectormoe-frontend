import 'cookie-store';

export const callAPI = async (url: string, fetchOptions?: RequestInit) => {
    try {
        const API_URL = import.meta.env.PUBLIC_API_URL;
        // @ts-ignore
        const token = await cookieStore.get('token');
        const response = await fetch(API_URL + url, {
            headers: {
                ...((!fetchOptions?.body) || (fetchOptions?.body instanceof FormData) ? {} : { 'Content-Type': 'application/json' }),
                'Authorization': token?.value ? `Bearer ${token?.value}` : ''
            },
            ...(fetchOptions || {})
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
