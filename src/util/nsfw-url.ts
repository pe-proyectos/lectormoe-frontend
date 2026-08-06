// En modo +18 (/red) las URLs internas deben llevar el prefijo /red. El API
// devuelve rutas "desnudas" (/scan/manga/...), así que sin esto cada clic en
// una obra NSFW provocaba un redirect 302 del servidor a /red/..., lo que
// convertía la transición suave (SPA) en una recarga completa (y la barra de
// progreso se veía entrecortada o "no salía"). Prefijar evita el redirect.
export function nsfwUrl(url: string | null | undefined, nsfwMode: boolean): string | undefined {
  if (!url || typeof url !== 'string') return url ?? undefined;
  if (!nsfwMode) return url;
  if (url === '#' || !url.startsWith('/')) return url;
  if (url === '/red' || url.startsWith('/red/')) return url;
  return '/red' + url;
}
