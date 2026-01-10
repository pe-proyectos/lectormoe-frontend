import { defineMiddleware } from "astro:middleware";
import { getIP } from "../util/get-ip";

export const onRequest = defineMiddleware(async (context, next) => {
  // ============================================
  // CONFIGURACIONES BÁSICAS
  // ============================================
  
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
    context.locals.logged = false;
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
    fetchOptions?: Partial<RequestInit> & { includeIp?: any }
  ) => {
    const API_URL = import.meta.env.PUBLIC_API_URL || "";
    const fullUrl = API_URL ? API_URL + url : new URL(url, context.request.url).toString();
    const response = await fetch(fullUrl, {
      ...(fetchOptions || {}),
      headers: {
        // IMPORTANTE: Solo enviar x-organization si tiene un valor válido
        ...(organizationIdentifier ? { "x-organization": organizationIdentifier } : {}),
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
    "login",
    "register",
    "search",
    "scans",
    "subscriptions",
    "organizations",
    "profile",
    "settings",
    ".well-known", // Rutas de certificados SSL y otros estándares web
  ];

  // Extraer el primer segmento de la ruta
  const pathSegments = context.url.pathname.split("/").filter(Boolean);
  const firstSegment = pathSegments[0] || "";

  // Determinar si es landing page
  // Es landing si la ruta es "/" o si el primer segmento es una ruta reservada
  const isLandingPage =
    context.url.pathname === "/" ||
    (firstSegment && reservedRoutes.includes(firstSegment));

  context.locals.isLandingPage = isLandingPage;

  // Si es landing page, verificar autenticación pero sin requerir organización
  if (isLandingPage) {
    context.locals.organization = null;
    context.locals.organizationSlug = null;

    // Verificar autenticación si hay token (pero sin requerir organización específica)
    if (context.locals.token) {
      try {
        // IMPORTANTE: NO asignar organizationIdentifier en landing page
        // Debe permanecer null para que callAPI no envíe x-organization header
        // organizationIdentifier = null; // Ya es null por defecto

        const authCheck = await callAPI("/api/auth/check");

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
          context.cookies.set("user", JSON.stringify(authCheck.user), {
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
            sameSite: "lax",
          });
          context.locals.logged = true;

          return await next();
        }
      } catch (error) {
        // Si el check falla matar sesion
      }
    }

    context.locals.logged = false;
    context.locals.token = null;
    context.locals.user = null;
    context.cookies.delete("token", { path: "/" });
    context.cookies.delete("user", { path: "/" });

    return await next();
  }

  // Extraer el slug de la organización del primer segmento de la ruta
  const organizationSlug = firstSegment;
  context.locals.organizationSlug = organizationSlug;

  // Si es una ruta reservada o especial, no buscar organización
  if (
    reservedRoutes.includes(organizationSlug) ||
    organizationSlug.startsWith(".")
  ) {
    return await next();
  }

  // Establecer el identifier para las llamadas al API (usar slug en lugar de domain)
  organizationIdentifier = organizationSlug;

  try {
    // Para la verificación de organización, hacer la llamada sin el header x-organization
    // porque aún no sabemos qué organización es y el endpoint debe usar solo el query param
    const API_URL = import.meta.env.PUBLIC_API_URL || "";
    const checkUrl = API_URL 
      ? `${API_URL}/api/organization/check?slug=${organizationSlug}`
      : new URL(`/api/organization/check?slug=${organizationSlug}`, context.request.url).toString();
    const organizationCheckResponse = await fetch(
      checkUrl,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: context.locals.token
            ? `Bearer ${context.locals.token}`
            : "",
          ip: getIP(context.request.headers) || "0.0.0.0",
          "Accept-Language": context.locals.language,
          // NO incluir x-organization aquí para que el endpoint use solo el query param
        },
      }
    );

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
      context.cookies.set("user", JSON.stringify(authCheck.user), {
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
      });
      context.locals.logged = true;
    } else {
      context.locals.logged = false;
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

    if (
      organization?.useBlockedCountries ||
      organization?.useAllowedCountries
    ) {
      const userCountry = context.request.headers.get("cf-ipcountry") || "XX";
      if (userCountry) {
        const countryOption = organization?.countryOptions?.find(
          (option: any) =>
            option.countryCode === userCountry.trim().toUpperCase().slice(0, 2)
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

    context.locals.logged = context.locals.token ? true : false;

    // Validar acceso a rutas de admin (/{slug}/admin/*)
    if (context.url.pathname.includes("/admin")) {
      if (!context.locals.logged) {
        // Si es una ruta de scan, redirigir al login de ese scan
        if (context.locals.organizationSlug) {
          return context.redirect(`/${context.locals.organizationSlug}/login`);
        }
        return context.redirect("/login");
      }

      // SECURITY: Verificar permiso canSeeAdminPanel
      if (context.locals.user && context.locals.organization) {
        const permissions = context.locals.user.permissions?.find(
          (p: any) => p.organizationId === context.locals.organization.id
        );

        if (!permissions?.canSeeAdminPanel) {
          console.warn(
            `User ${context.locals.user.id} attempted to access admin panel without canSeeAdminPanel permission`
          );
          return context.redirect(
            context.locals.organizationSlug
              ? `/${context.locals.organizationSlug}`
              : "/"
          );
        }
      }
    }

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
