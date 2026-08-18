import { defineMiddleware } from "astro:middleware";
import { getIP } from "../util/get-ip";

/**
 * Calcula si se deben mostrar anuncios basándose en el usuario y la organización
 * @param user - Usuario autenticado (puede ser null)
 * @param organization - Organización actual (puede ser null para landing pages)
 * @returns true si se deben mostrar anuncios, false si no
 */
function calculateShowAds(user: any, organization: any): boolean {
  // GLOBAL OVERRIDE: User.hideAds is the platform-wide opt-out (admins,
  // giveaway prizes). Trumps everything; works across every page.
  if (user?.hideAds === true) return false;

  // CROSS-ORG: any active subscription anywhere on the platform suppresses ads
  // everywhere. /api/auth/check returns ALL active subs regardless of which org
  // the page belongs to, so a single check covers all surfaces (per-org pages,
  // global landing, joints, search, /writings, etc.).
  // Other plan benefits (canDownload, canReadUnreleased, in-app hideAds badge,
  // subscriber-only chapter access) remain org-scoped through their own checks.
  if (user?.subscriptions && Array.isArray(user.subscriptions)) {
    const hasAnyActiveSub = user.subscriptions.some((sub: any) => sub?.active === true);
    if (hasAnyActiveSub) return false;
  }

  // No org context (global landing, joint pages, search, scans, list, notifications, etc.):
  // ads default to ON. The actual provider (Google vs Adsterra vs none) is decided
  // by resolveAdsProvider in the layout, which knows about /, /red, and auth paths.
  if (!organization) {
    return true;
  }

  // Los anuncios son decisión de la PLATAFORMA, no del scan: siempre activos por
  // defecto. El proveedor (AdSense normal / Adsterra +18) lo decide
  // resolveAdsProvider. Los scans ya no controlan si salen o cuáles.

  // Sin usuario autenticado, mostrar anuncios
  if (!user) {
    return true;
  }

  // Verificar permisos con hideAds de la organización actual (org-scoped:
  // un mod de scan A no oculta ads cuando navega scan B).
  if (user.permissions && Array.isArray(user.permissions)) {
    const hasHideAds = user.permissions.some(
      (perm: any) =>
        perm.hideAds === true &&
        perm.organizationId === organization.id,
    );
    if (hasHideAds) {
      return false;
    }

    // STAFF: los miembros del scan con acceso al panel no ven anuncios en las
    // páginas de SU scan (siguen viendo anuncios en scans ajenos y en la
    // landing). Criterio: canSeeAdminPanel de ESA org; el role no es confiable.
    const isStaffHere = user.permissions.some(
      (perm: any) =>
        perm.canSeeAdminPanel === true &&
        perm.organizationId === organization.id,
    );
    if (isStaffHere) {
      return false;
    }
  }
  return true;
}

// Guarda solo los campos que el cliente necesita para evitar superar el límite de 4KB del cookie
// Guarda solo los campos que el cliente necesita para evitar superar el límite de 4KB del cookie
const minimalCookieUser = (user: any) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  email: user.email,
  imageUrl: user.imageUrl,
  slug: user.slug,
  permissions: user.permissions?.map((p: any) => ({
    organizationId: p.organizationId,
    canSeeAdminPanel: p.canSeeAdminPanel,
    hideAds: p.hideAds,
    organization: p.organization
      ? { id: p.organization.id, name: p.organization.name, slug: p.organization.slug, logoUrl: p.organization.logoUrl }
      : null,
  })) ?? [],
});

export const onRequest = defineMiddleware(async (context, next) => {
  // ============================================
  // CONFIGURACIONES BÁSICAS
  // ============================================

  // Skip middleware for static file requests (service worker, manifests, etc.)
  const staticFileExtensions = /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|json|xml|txt|map|webmanifest)$/i;
  if (staticFileExtensions.test(context.url.pathname)) {
    return await next();
  }

  if (context.url.pathname === "/ads.txt") {
    const adstxt = "google.com, pub-2799839819522052, DIRECT, f08c47fec0942fa0";
    return new Response(adstxt, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  context.locals.theme =
    context.cookies.get("theme")?.value === "light" ? "light" : "black";

  try {
    const queryLang = context.url.searchParams.get("lang");
    const storedLang = context.cookies.get("language")?.value;
    const language = queryLang || storedLang || "es";

    context.locals.language = language;
  } catch (error) {
    console.error(error);
    context.locals.language = "es";
  }

  if (context.url.pathname === "/logout") {
    context.locals.token = null;
    context.locals.user = null;
    context.cookies.delete("token", { path: "/" });
    context.cookies.delete("user", { path: "/" });
    const redirectTo = context.url.searchParams.get("redirect") || "/";
    return context.redirect(redirectTo);
  }

  context.locals.token = context.cookies.get("token")?.value;

  // Variable para almacenar el identifier de la organización (slug o domain)
  let organizationIdentifier: string | null = null;

  const callAPI = async (
    url: string,
    fetchOptions?: Partial<RequestInit> & { includeIp?: any },
  ) => {
    const API_URL = import.meta.env["PUBLIC_API_URL"] || "";
    const fullUrl = API_URL
      ? API_URL + url
      : new URL(url, context.request.url).toString();
    const response = await fetch(fullUrl, {
      ...(fetchOptions || {}),
      headers: {
        // IMPORTANTE: Solo enviar x-organization si tiene un valor válido
        ...(organizationIdentifier
          ? { "x-organization": organizationIdentifier }
          : {}),
        "Content-Type": "application/json",
        Authorization: context.locals.token
          ? `Bearer ${context.locals.token}`
          : "",
        ip: getIP(context.request.headers) || "0.0.0.0",
        "Accept-Language": context.locals.language,
        ...(fetchOptions?.headers || {}),
      },
    });

    // Si la respuesta no es OK, retornar un objeto con status: false
    if (!response.ok) {
      try {
        const errorResult = await response.json();
        return errorResult;
      } catch {
        return { status: false, message: `HTTP ${response.status}` };
      }
    }

    const result = await response.json();
    // Si el resultado tiene status: false, retornar el objeto completo para que el código pueda manejarlo
    if (result?.status === false) {
      return result;
    }
    // Si tiene status: true, retornar solo el data
    if (result?.status === true && result?.data) {
      return result.data;
    }
    // Si no tiene status, retornar el resultado completo (para compatibilidad)
    return result;
  };

  context.locals.callAPI = callAPI;

  // Rutas reservadas que no deben ser tratadas como slugs de organización
  // Nota: login, register, forgot-password están aquí para rutas globales, pero también pueden estar dentro de un slug (ej: /senshimanga/login)
  const reservedRoutes = [
    "logout",
    "404",
    "500",
    "forgot",
    "forgot-password",
    "reset-password",
    "login",
    "register",
    "search",
    "scans",
    "subscriptions",
    "organizations",
    "profile",
    "settings",
    "verify-email",
    "unsubscribe",
    ".well-known", // Rutas de certificados SSL y otros estándares web
    "superadmin",
    "joint",
    "joints",
    "list",
    "notifications",
    "writings",
    "luckys",
    "discord",
    "terms",
    "privacy",
    "dmca",
    "listas",
    "reclutamiento",
    "mensajes",
    "descargas",
    "app",
    "eliminar-cuenta",
    "beta",
  ];

  // Extraer el primer segmento de la ruta
  const pathSegments = context.url.pathname.split("/").filter(Boolean);
  const firstSegment = pathSegments[0] || "";

  // ============================================
  // MODO NSFW: /red/{slug}/... → nsfwMode=true, org slug = pathSegments[1]
  //            /red            → nsfwMode=true, landing page global NSFW
  // ============================================
  let nsfwMode = false;
  let effectiveSlug = firstSegment;

  if (firstSegment === "red") {
    nsfwMode = true;
    effectiveSlug = pathSegments[1] || ""; // "" si solo es /red
  }

  // +18 PERSISTENTE: si el usuario activó el modo adulto (cookie `nsfw=1`), las
  // raíces globales (inicio / búsqueda / novelas) redirigen a su versión /red,
  // para que la preferencia se mantenga al volver al inicio en vez de perderse.
  // Acotado a rutas EXACTAS: sus gemelas empiezan con /red (nsfwMode=true), así
  // que no hay bucle. La preferencia solo cambia al pulsar el toggle.
  if (!nsfwMode && context.cookies.get("nsfw")?.value === "1") {
    const twin: Record<string, string> = {
      "/": "/red",
      "/search": "/red/search",
      "/writings": "/red/writings",
    };
    const target = twin[context.url.pathname];
    if (target) {
      return context.redirect(target + context.url.search, 302);
    }
  }

  context.locals.nsfwMode = nsfwMode;

  // Determinar si es landing page
  // Es landing si la ruta es "/" o si el slug efectivo es reservado/vacío
  const isLandingPage =
    context.url.pathname === "/" ||
    !effectiveSlug ||
    reservedRoutes.includes(effectiveSlug);

  context.locals.isLandingPage = isLandingPage;

  // Si es landing page, verificar autenticación pero sin requerir organización
  if (isLandingPage) {
    context.locals.organization = null;
    context.locals.organizationSlug = null;

    // Verificar autenticación si hay token (pero sin requerir organización específica)
    if (context.locals.token) {
      // IMPORTANTE: NO asignar organizationIdentifier en landing page
      // Debe permanecer null para que callAPI no envíe x-organization header
      let authCheck: any = null;
      let transient = false;
      try {
        authCheck = await callAPI("/api/auth/check");
      } catch (error) {
        // Error de transporte (API caído durante un deploy, o sin red en la app):
        // NO es prueba de que el token sea inválido.
        transient = true;
      }

      if (authCheck?.token && authCheck?.user) {
        // Token válido, actualizar cookies con datos frescos
        context.locals.token = authCheck.token;
        context.locals.user = authCheck.user;

        // Set Cookies
        context.cookies.set("token", authCheck.token, {
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
          sameSite: "lax",
        });
        context.cookies.set("user", JSON.stringify(minimalCookieUser(authCheck.user)), {
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
          sameSite: "lax",
        });

        // Calcular showAds para landing pages (sin organización)
        context.locals.showAds = calculateShowAds(context.locals.user, null);

        return await next();
      }

      // Solo cerramos sesión ante CONFIRMACIÓN de token inválido: auth/check
      // respondió (no transitorio) con el mensaje de sesión inválida. Cualquier
      // otro fallo (red, 5xx, downtime de deploy) conserva la sesión para no
      // desloguear a la gente por cortes momentáneos (bug reportado en la app).
      const definitiveInvalid =
        !transient &&
        authCheck?.status === false &&
        authCheck?.message === "Sesión no válida";

      if (!definitiveInvalid) {
        // Transitorio: conservar la sesión con la cookie de usuario cacheada y
        // sin borrar el token (se revalida en la próxima carga).
        let cachedUser: any = null;
        try {
          const raw = context.cookies.get("user")?.value;
          if (raw) cachedUser = JSON.parse(raw);
        } catch {}
        context.locals.user = cachedUser;
        context.locals.showAds = calculateShowAds(cachedUser, null);
        return await next();
      }
    }
    context.locals.token = null;
    context.locals.user = null;
    context.cookies.delete("token", { path: "/" });
    context.cookies.delete("user", { path: "/" });

    // Calcular showAds para landing pages (sin organización, sin usuario)
    context.locals.showAds = true;

    return await next();
  }

  // Extraer el slug de la organización (efectiveSlug ya resuelve /red/{slug} → slug)
  const organizationSlug = effectiveSlug;
  context.locals.organizationSlug = organizationSlug;

  // Si es una ruta reservada o especial, no buscar organización
  if (
    reservedRoutes.includes(organizationSlug) ||
    organizationSlug.startsWith(".")
  ) {
    // Calcular showAds para rutas reservadas (sin organización)
    context.locals.showAds = calculateShowAds(context.locals.user, null);
    return await next();
  }

  // Establecer el identifier para las llamadas al API (usar slug en lugar de domain)
  organizationIdentifier = organizationSlug;

  try {
    // Para la verificación de organización, hacer la llamada sin el header x-organization
    // porque aún no sabemos qué organización es y el endpoint debe usar solo el query param
    const API_URL = import.meta.env["PUBLIC_API_URL"] || "";
    const checkUrl = API_URL
      ? `${API_URL}/api/organization/check?slug=${organizationSlug}`
      : new URL(
          `/api/organization/check?slug=${organizationSlug}`,
          context.request.url,
        ).toString();
    const organizationCheckResponse = await fetch(checkUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: context.locals.token
          ? `Bearer ${context.locals.token}`
          : "",
        ip: getIP(context.request.headers) || "0.0.0.0",
        "Accept-Language": context.locals.language,
        // NO incluir x-organization aquí para que el endpoint use solo el query param
      },
    });

    let organizationCheck;
    if (!organizationCheckResponse.ok) {
      try {
        const errorResult = await organizationCheckResponse.json();
        organizationCheck = errorResult;
      } catch {
        organizationCheck = {
          status: false,
          message: `HTTP ${organizationCheckResponse.status}`,
        };
      }
    } else {
      const result = await organizationCheckResponse.json();
      // Mantener la estructura { status, data } para consistencia con el resto del código
      if (result?.status === true && result?.data) {
        organizationCheck = result;
      } else {
        organizationCheck = result;
      }
    }

    const authCheck = await callAPI("/api/auth/check");

    // El callAPI del middleware retorna data directamente, así que authCheck ya es { token, user, permissions } o { status: false, message: '...' }
    if (authCheck?.token && authCheck?.user) {
      // Token válido, actualizar cookies con datos frescos
      context.locals.token = authCheck.token;
      context.locals.user = authCheck.user;

      // Set Cookies
      context.cookies.set("token", authCheck.token, {
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
      });
      context.cookies.set("user", JSON.stringify(minimalCookieUser(authCheck.user)), {
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
      });
      // Usuario autenticado - user ya está establecido
    } else {
      context.locals.token = null;
      context.locals.user = null;
      context.cookies.delete("token", { path: "/" });
      context.cookies.delete("user", { path: "/" });
    }

    // callAPI retorna result.data cuando status === true, o el objeto completo cuando status === false
    // Si organizationCheck es null/undefined o tiene status: false, significa que no se encontró la organización
    if (!organizationCheck) {
      return context.redirect("/404");
    }

    // Si organizationCheck tiene la propiedad status y es false, redirigir a 404
    if (organizationCheck.status === false) {
      return context.redirect("/404");
    }

    // Si organizationCheck es directamente el objeto de la organización (porque callAPI retorna result.data cuando status === true)
    // o si tiene la propiedad data
    const organization = organizationCheck.data || organizationCheck;
    context.locals.organization = organization;
    // Actualizar el identifier con el slug de la organización para las siguientes llamadas al API
    organizationIdentifier = organization.slug;
    // NO usamos cookies para x-organization, solo el path actual determina la organización

    // Si la organización es NSFW y no estamos ya en modo /red/, redirigir
    if (organization?.isNSFW && !context.locals.nsfwMode) {
      // restSegments: todo lo que viene después del slug de la org
      const orgSegmentIndex = firstSegment === "red" ? 2 : 1;
      const restSegments = pathSegments.slice(orgSegmentIndex);
      const nsfwPath = `/red/${organization.slug}${restSegments.length ? `/${restSegments.join("/")}` : ""}`;
      const redirectUrl = new URL(nsfwPath, context.url);
      redirectUrl.search = context.url.search;
      return context.redirect(redirectUrl.toString());
    }

    if (
      organization?.useBlockedCountries ||
      organization?.useAllowedCountries
    ) {
      const userCountry = context.request.headers.get("cf-ipcountry") || "XX";
      if (userCountry) {
        const countryOption = organization?.countryOptions?.find(
          (option: any) =>
            option.countryCode === userCountry.trim().toUpperCase().slice(0, 2),
        );
        if (countryOption) {
          if (organization?.useBlockedCountries && countryOption.blocked) {
            return new Response("Country blocked", {
              status: 403,
              headers: { "Content-Type": "text/plain" },
            });
          }
          if (organization?.useAllowedCountries && !countryOption.allowed) {
            return new Response("Country not allowed", {
              status: 403,
              headers: { "Content-Type": "text/plain" },
            });
          }
        }
      }
    }

    // Validar acceso a rutas de admin (/{slug}/admin/*)
    if (context.url.pathname.includes("/admin")) {
      if (!context.locals.user || !context.locals.token) {
        // Si es una ruta de scan, redirigir al login de ese scan
        if (context.locals.organizationSlug) {
          const loginPath = nsfwMode
            ? `/red/${context.locals.organizationSlug}/login`
            : `/${context.locals.organizationSlug}/login`;
          return context.redirect(loginPath);
        }
        return context.redirect("/login");
      }

      // SECURITY: Verificar permiso canSeeAdminPanel
      if (context.locals.user && context.locals.organization) {
        const permissions = context.locals.user.permissions?.find(
          (p: any) => p.organizationId === context.locals.organization.id,
        );

        if (!permissions?.canSeeAdminPanel) {
          console.warn(
            `User ${context.locals.user.id} attempted to access admin panel without canSeeAdminPanel permission`,
          );
          const homePath = context.locals.organizationSlug
            ? (nsfwMode ? `/red/${context.locals.organizationSlug}` : `/${context.locals.organizationSlug}`)
            : "/";
          return context.redirect(homePath);
        }
      }
    }

    // Calcular showAds después de establecer user y organization
    context.locals.showAds = calculateShowAds(
      context.locals.user,
      context.locals.organization,
    );

    return await next();
  } catch (error) {
    // @ts-ignore
    if (error?.message === "Not found") {
      console.warn("Ocurrió un error not_found en " + context.request.url);
      return context.redirect("/404");
    }
    console.error(error);
    console.warn("Ocurrió un error 500 en " + context.request.url);
    return context.redirect("/500");
  }
});
