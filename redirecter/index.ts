import { Elysia } from 'elysia';

const domainToSlugMap: Record<string, string> = {
  // Subdominios de capibaratraductor.com
  '6ianfranc9.capibaratraductor.com': '6ianfranc9',
  'senshimanga.capibaratraductor.com': 'senshimanga',
  
  // Dominios independientes
  'mangaclub.moe': 'mangaclub',
  'doujinclub.icu': 'doujinclub',
  'ouroborosnetwork.org': 'ouroborosnetwork',
};

const mainDomain = 'capibaratraductor.com';

const app = new Elysia()
  .onRequest(({ request, set }) => {
    const url = new URL(request.url);
    const hostname = request.headers.get('host')?.split(':')[0] || url.hostname;
    const xForwardedHost = request.headers.get('x-forwarded-host');
    const xForwardedProto = request.headers.get('x-forwarded-proto');
    
    // Use x-forwarded-host if available, otherwise use host header
    const actualHostname = xForwardedHost?.split(':')[0] || hostname;
    
    // Determine protocol
    const protocol = xForwardedProto ? `${xForwardedProto}:` : url.protocol;
    
    // Skip if already on main domain or localhost
    if (actualHostname === mainDomain || actualHostname === 'localhost' || actualHostname.startsWith('127.0.0.1')) {
      return;
    }
    
    // Check if hostname is in the map
    let targetSlug = domainToSlugMap[actualHostname];
    
    // If not in map but is a subdomain of main domain, extract slug
    if (!targetSlug && actualHostname.endsWith(`.${mainDomain}`)) {
      targetSlug = actualHostname.replace(`.${mainDomain}`, '');
    }
    
    // If we have a target slug, redirect
    if (targetSlug) {
      const pathname = url.pathname;
      const search = url.search;
      const newPath = `/${targetSlug}${pathname === '/' ? '' : pathname}${search}`;
      const newUrl = `${protocol}//${mainDomain}${newPath}`;
      
      set.status = 301;
      set.headers['Location'] = newUrl;
      return new Response(null, { status: 301, headers: { Location: newUrl } });
    }
  })
  .listen(process.env.PORT || 3001);

console.log(`🚀 Redirecter server is running on port ${process.env.PORT || 3001}`);

