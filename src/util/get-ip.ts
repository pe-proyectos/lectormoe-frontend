/*
Code by gaurishhs extracted from
https://github.com/gaurishhs/elysia-ip/blob/main/src/index.ts
*/

export type IPHeaders = 'x-real-ip' | 'x-client-ip' | 'cf-connecting-ip' | 'fastly-client-ip' | 'x-cluster-client-ip' | 'x-forwarded' | 'forwarded-for' | 'forwarded' | 'x-forwarded' | 'appengine-user-ip' | 'true-client-ip' | 'cf-pseudo-ipv4' | (string & {})

export const headersToCheck: IPHeaders[] = [
    'cf-connecting-ip', // Cloudflare
    'x-real-ip', // Nginx proxy/FastCGI
    'x-client-ip', // Apache https://httpd.apache.org/docs/2.4/mod/mod_remoteip.html#page-header 
    'fastly-client-ip', // Fastly
    'x-cluster-client-ip', // GCP
    'x-forwarded', // General Forwarded
    'forwarded-for', // RFC 7239
    'forwarded', // RFC 7239
    'x-forwarded', // RFC 7239
    'appengine-user-ip', // GCP
    'true-client-ip', // Akamai and Cloudflare
    'cf-pseudo-ipv4', // Cloudflare 
]

export const getIP = (headers: Headers, checkHeaders: IPHeaders[] = headersToCheck) => {
    if (typeof checkHeaders === 'string' && headers.get(checkHeaders)) return headers.get(checkHeaders);
    // X-Forwarded-For is the de-facto standard header
    if (headers.get('x-forwarded-for')) return headers.get('x-forwarded-for')?.split(',')[0];
    let clientIP: string | undefined | null = null;
    if (!checkHeaders) return null;
    for (const header of checkHeaders) {
        clientIP = headers.get(header);
        if (clientIP) break;
    }
    return clientIP || "0.0.0.0";
}
