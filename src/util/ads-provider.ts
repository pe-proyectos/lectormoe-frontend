// Single source of truth for "which ad network on this page".
//
// Rules (see CLAUDE.md / brief):
//   - Anything under /red, an org with isNSFW, or a manga with isNSFW → Adsterra.
//   - The bare global landing (`/` and `/red`) and any auth route → no ads.
//   - Everything else → Google AdSense.
//
// AdSense ToS prohibits Google ads on adult content; Adsterra is our adult-
// safe fallback. Mis-routing here can get the AdSense account banned, so the
// rule chain is intentionally short and conservative.

export type AdsProvider = 'google' | 'adsterra' | 'none';

const AUTH_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/unsubscribe',
  '/logout',
]);

const NO_ADS_LANDING_PATHS = new Set([
  '/',
  '/red',
  '/red/',
]);

function isAuthPath(pathname: string): boolean {
  // Strip /red prefix so /red/login matches /login.
  let p = pathname;
  if (p.startsWith('/red/')) p = p.slice(4);
  else if (p === '/red') p = '/';
  // Match exact and "/{slug}/login" form (auth nested under an org).
  if (AUTH_PATHS.has(p)) return true;
  for (const auth of AUTH_PATHS) {
    if (p.endsWith(auth)) return true;
  }
  return false;
}

interface ResolveAdsProviderInput {
  pathname: string;
  nsfwMode?: boolean;
  organization?: { isNSFW?: boolean | null } | null;
  manga?: { isNSFW?: boolean | null; loggedInOnly?: boolean | null; isPublic?: boolean | null } | null;
  /** True when the middleware/page already decided no ads should render
   *  (e.g. a paying user with hideAds, ads globally disabled for the org). */
  showAds?: boolean;
}

export function resolveAdsProvider({
  pathname,
  nsfwMode,
  organization,
  manga,
  showAds,
}: ResolveAdsProviderInput): AdsProvider {
  // Hard "no ads" gates first: cheaper to short-circuit.
  if (showAds === false) return 'none';
  if (NO_ADS_LANDING_PATHS.has(pathname)) return 'none';
  if (isAuthPath(pathname)) return 'none';
  // Luckys (raffles) is an ad-free zone — paid prizes shouldn't share screen
  // real estate with ads, and PayPal smart buttons + ad scripts collide.
  if (pathname === '/luckys' || pathname.startsWith('/luckys/')) return 'none';

  // Obra en privado (isPublic=false, retiro por copyright): NADA de anuncios.
  if (manga && manga.isPublic === false) return 'none';

  // Caso copyright (loggedInOnly): NUNCA AdSense — la obra tiene contenido con
  // copyright en disputa; mostrar Google ahí arriesga la cuenta de toda la
  // plataforma. Se usa Adsterra (igual que el contenido adulto).
  if (manga?.loggedInOnly) return 'adsterra';

  const adultContext = !!(
    pathname.startsWith('/red') ||
    nsfwMode ||
    organization?.isNSFW ||
    manga?.isNSFW
  );

  return adultContext ? 'adsterra' : 'google';
}
