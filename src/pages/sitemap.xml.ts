import type { APIRoute } from 'astro';

const BASE = 'https://capibaratraductor.com';
const API = import.meta.env.PUBLIC_API_URL || 'https://capibaratraductor.com';

const STATIC_PATHS = ['/', '/scans', '/search', '/listas', '/reclutamiento', '/terms', '/privacy', '/dmca'];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async () => {
  let data: any = { orgs: [], mangas: [], lists: [] };
  try {
    const res = await fetch(`${API}/api/sitemap-data`);
    const json = await res.json();
    if (json?.status && json.data) data = json.data;
  } catch {
    // sirve al menos las rutas estáticas
  }

  const urls: string[] = [];
  const add = (loc: string, lastmod?: string) => {
    urls.push(`<url><loc>${esc(BASE + loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}</url>`);
  };

  for (const p of STATIC_PATHS) add(p);
  for (const o of data.orgs || []) add(`/${o.slug}`, o.updatedAt);
  for (const m of data.mangas || []) add(`/${m.orgSlug}/manga/${m.mangaSlug}`, m.updatedAt);
  for (const w of data.writings || []) add(`/writings/${w.orgSlug}/${w.type}/${w.mangaSlug}`, w.updatedAt);
  for (const l of data.lists || []) add(`/list/${l.userSlug}/${l.listSlug}`, l.updatedAt);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
