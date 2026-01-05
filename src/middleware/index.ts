import { defineMiddleware } from "astro:middleware";
import { getIP } from "../util/get-ip";

export const onRequest = defineMiddleware(async (context, next) => {
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
    const redirectTo = context.url.searchParams.get("redirect") || "/";
    context.cookies.delete("token");
    context.cookies.delete("username");
    context.cookies.delete("userSlug");
    context.cookies.delete("user");
    context.locals.token = undefined;
    context.locals.username = undefined;
    context.locals.userSlug = undefined;
    context.locals.user = undefined;
    return context.redirect(redirectTo);
  }

  context.locals.token = context.cookies.get("token")?.value;
  context.locals.username = context.cookies.get("username")?.value;
  context.locals.userSlug = context.cookies.get("userSlug")?.value;

  try {
    context.locals.user = context.cookies.get("user")?.value
      ? JSON.parse(context.cookies.get("user")?.value!)
      : undefined;
  } catch (error) {}

  // Establecer logged basado en si existe token y user
  context.locals.logged = !!(context.locals.token && context.locals.user);

  // Mapeo de dominios/subdominios antiguos a slugs de organización
  const domainToSlugMap: Record<string, string> = {
    // Subdominios de capibaratraductor.com
    '6ianfranc9.capibaratraductor.com': '6ianfranc9',
    'senshimanga.capibaratraductor.com': 'senshimanga',
    
    // Dominios independientes
    'mangaclub.moe': 'mangaclub',
    'doujinclub.icu': 'doujinclub',
    'ouroborosnetwork.org': 'ouroborosnetwork',
  };
  
  const hostname = context.url.hostname;
  const mainDomain = "capibaratraductor.com";
  const localhostPattern = /^(localhost|127\.0\.0\.1)(:\d+)?$/;
  
  // Solo hacer redirección si no es localhost y si está en el mapeo
  if (!localhostPattern.test(hostname) && hostname !== mainDomain) {
    const targetSlug = domainToSlugMap[hostname];
    
    if (targetSlug) {
      // Construir la nueva URL con formato de slug
      const newPath = `/${targetSlug}${context.url.pathname}${context.url.search}`;
      const newUrl = `${context.url.protocol}//${mainDomain}${newPath}`;
      
      // Redirigir permanentemente (301) a la nueva URL
      return context.redirect(newUrl, 301);
    }
  }

  // Variable para almacenar el identifier de la organización (slug o domain)
  let organizationIdentifier: string | null = null;

  const callAPI = async (
    url: string,
    fetchOptions?: Partial<RequestInit> & { includeIp?: any }
  ) => {
    const API_URL = process.env["PUBLIC_API_URL"] || "";
    const response = await fetch(API_URL + url, {
      ...(fetchOptions || {}),
      headers: {
        "x-organization": organizationIdentifier,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const months: { [key: number]: string } = {
      0: "ENE",
      1: "FEB",
      2: "MAR",
      3: "ABR",
      4: "MAY",
      5: "JUN",
      6: "JUL",
      7: "AGO",
      8: "SEP",
      9: "OCT",
      10: "NOV",
      11: "DIC",
    };
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  context.locals.formatDate = formatDate;

  // Rutas reservadas que no deben ser tratadas como slugs de organización
  // Nota: login, register, forgot-password están aquí para rutas globales, pero también pueden estar dentro de un slug (ej: /senshimanga/login)
  const reservedRoutes = [
    'logout',
    '404',
    '500',
    'forgot',
    'forgot-password',
    'login',
    'register',
    'search',
    'scans',
    'subscriptions',
    'organizations',
    'profile',
    'settings',
    '.well-known', // Rutas de certificados SSL y otros estándares web
  ];

  // Extraer el primer segmento de la ruta
  const pathSegments = context.url.pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0] || '';
  
  // Determinar si es landing page
  // Es landing si la ruta es "/" o si el primer segmento es una ruta reservada
  const isLandingPage = context.url.pathname === '/' || 
    (firstSegment && reservedRoutes.includes(firstSegment));
  
  context.locals.isLandingPage = isLandingPage;
  
  // Si es landing page, verificar autenticación pero sin requerir organización
  if (isLandingPage) {
    context.locals.organization = null;
    context.locals.organizationSlug = null;
    
    // Verificar autenticación si hay token (pero sin requerir organización específica)
    if (context.locals.token && context.locals.user) {
      try {
        organizationIdentifier = context.url.hostname;
        
        const authCheck = await callAPI("/api/auth/check");
        
        if (authCheck?.token && authCheck?.user) {
          // Token válido, actualizar cookies con datos frescos
          context.locals.token = authCheck.token;
          context.locals.username = authCheck.user.username;
          context.locals.userSlug = authCheck.user.slug;
          if (authCheck.user) {
            context.locals.user = authCheck.user;
          }
          context.cookies.set("token", authCheck.token, {
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
            sameSite: 'lax',
          });
          context.cookies.set("username", authCheck.user.username, {
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
            sameSite: 'lax',
          });
          context.cookies.set("userSlug", authCheck.user.slug, {
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
            sameSite: 'lax',
          });
          if (authCheck.user) {
            context.cookies.set("user", JSON.stringify(authCheck.user), {
              maxAge: 60 * 60 * 24 * 7,
              path: '/',
              sameSite: 'lax',
            });
          }
          context.locals.logged = true;
        } else {
          // Token inválido en el servidor, cerrar sesión
          context.locals.logged = false;
          context.locals.token = null;
          context.locals.user = null;
          context.locals.username = null;
          context.locals.userSlug = null;
          context.cookies.delete("token");
          context.cookies.delete("username");
          context.cookies.delete("userSlug");
          context.cookies.delete("user");
        }
      } catch (error) {
        // Si el check falla (error de red, etc.), mantener la sesión activa
        context.locals.logged = true; // Mantener sesión activa
      }
    } else if (context.locals.token) {
      // Solo hacer check si hay token pero no user (para refrescar datos)
      try {
        organizationIdentifier = context.url.hostname;
        
        const authCheck = await callAPI("/api/auth/check");
        
        // callAPI retorna result.data directamente, así que authCheck ya es { token, user }
        if (authCheck?.token && authCheck?.user) {
          context.locals.token = authCheck.token;
          context.locals.username = authCheck.user.username;
          context.locals.userSlug = authCheck.user.slug;
          if (authCheck.user) {
            context.locals.user = authCheck.user;
          }
          context.cookies.set("token", authCheck.token, {
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
            sameSite: 'lax',
          });
          context.cookies.set("username", authCheck.user.username, {
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
            sameSite: 'lax',
          });
          context.cookies.set("userSlug", authCheck.user.slug, {
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
            sameSite: 'lax',
          });
          if (authCheck.user) {
            context.cookies.set("user", JSON.stringify(authCheck.user), {
              maxAge: 60 * 60 * 24 * 7,
              path: '/',
              sameSite: 'lax',
            });
          }
          context.cookies.set("auth-check-time", Date.now().toString(), {
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
            sameSite: 'lax',
          });
          context.locals.logged = true;
        } else {
          // Si no hay token o user, la sesión no es válida
          context.locals.logged = false;
          context.locals.token = null;
          context.locals.user = null;
          context.locals.username = null;
          context.locals.userSlug = null;
          context.cookies.delete("token");
          context.cookies.delete("username");
          context.cookies.delete("userSlug");
          context.cookies.delete("user");
          context.cookies.delete("auth-check-time");
        }
      } catch (error) {
        // Si callAPI lanza un error, NO borrar las cookies inmediatamente
        // Puede ser un error temporal de red, mantener las cookies existentes
        console.warn('Auth check failed, but keeping existing cookies:', error);
        // Solo marcar como no logueado si no hay user en cookies
        if (!context.locals.user) {
          context.locals.logged = false;
        } else {
          context.locals.logged = true;
        }
      }
    } else {
      context.locals.logged = false;
    }
    
    return await next();
  }

  // Extraer el slug de la organización del primer segmento de la ruta
  const organizationSlug = firstSegment;
  context.locals.organizationSlug = organizationSlug;
  
  // Si es una ruta reservada o especial, no buscar organización
  if (reservedRoutes.includes(organizationSlug) || organizationSlug.startsWith('.')) {
    return await next();
  }
  
  // Establecer el identifier para las llamadas al API (usar slug en lugar de domain)
  organizationIdentifier = organizationSlug;

  try {
    // Para la verificación de organización, hacer la llamada sin el header x-organization
    // porque aún no sabemos qué organización es y el endpoint debe usar solo el query param
    const API_URL = process.env["PUBLIC_API_URL"] || "";
    const organizationCheckResponse = await fetch(API_URL + `/api/organization/check?slug=${organizationSlug}`, {
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
        organizationCheck = { status: false, message: `HTTP ${organizationCheckResponse.status}` };
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
    
    const [authCheck] = await Promise.all([
      callAPI("/api/auth/check"),
    ]);

    // El callAPI del middleware retorna data directamente, así que authCheck ya es { token, user, permissions } o { status: false, message: '...' }
    if (authCheck?.token && authCheck?.user) {
      context.locals.token = authCheck.token;
      context.locals.username = authCheck.user.username;
      context.locals.userSlug = authCheck.user.slug;
      if (authCheck.user) {
        context.locals.user = authCheck.user;
      }
      // Guardar permisos si están disponibles
      if (authCheck.permissions) {
        context.locals.permissions = authCheck.permissions;
      }
      context.cookies.set("token", authCheck.token, {
        maxAge: 60 * 60 * 24 * 7,
      });
      context.cookies.set("username", authCheck.user.username, {
        maxAge: 60 * 60 * 24 * 7,
      });
      context.cookies.set("userSlug", authCheck.user.slug, {
        maxAge: 60 * 60 * 24 * 7,
      });
      if (authCheck.user) {
        context.cookies.set("user", JSON.stringify(authCheck.user), {
          maxAge: 60 * 60 * 24 * 7,
        });
      }
      context.locals.logged = true;
    } else {
      context.locals.token = undefined;
      context.locals.username = undefined;
      context.locals.userSlug = undefined;
      context.locals.user = undefined;
      context.locals.permissions = undefined;
      context.cookies.set("token", "", { maxAge: 0 });
      context.cookies.set("username", "", { maxAge: 0 });
      context.cookies.set("userSlug", "", { maxAge: 0 });
      context.cookies.set("user", "", { maxAge: 0 });
      context.locals.logged = false;
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
    // También guardar el slug en una cookie para que el cliente pueda usarlo
    context.cookies.set("x-organization", organization.slug, {
      maxAge: 60 * 60 * 24, // 24 horas
      path: "/",
    });

    if (context.url.pathname === "/ads.txt") {
      const adstxt = organization?.googleAdsAdsTxtContent || "";
      return new Response(adstxt, {
        headers: { "Content-Type": "text/plain" },
      });
    }

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
          if (
            organization?.useBlockedCountries &&
            countryOption.blocked
          ) {
            return new Response("Country blocked", {
              status: 403,
              headers: { "Content-Type": "text/plain" },
            });
          }
          if (
            organization?.useAllowedCountries &&
            !countryOption.allowed
          ) {
            return new Response("Country not allowed", {
              status: 403,
              headers: { "Content-Type": "text/plain" },
            });
          }
        }
      }
    }

    context.locals.formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const months: { [key: number]: string } = (
        {
          es: {
            0: "ENE",
            1: "FEB",
            2: "MAR",
            3: "ABR",
            4: "MAY",
            5: "JUN",
            6: "JUL",
            7: "AGO",
            8: "SEP",
            9: "OCT",
            10: "NOV",
            11: "DIC",
          },
          en: {
            0: "JAN",
            1: "FEB",
            2: "MAR",
            3: "APR",
            4: "MAY",
            5: "JUN",
            6: "JUL",
            7: "AUG",
            8: "SEP",
            9: "OCT",
            10: "NOV",
            11: "DEC",
          },
          pt: {
            0: "JAN",
            1: "FEV",
            2: "MAR",
            3: "ABR",
            4: "MAI",
            5: "JUN",
            6: "JUL",
            7: "AGO",
            8: "SET",
            9: "OUT",
            10: "NOV",
            11: "DEZ",
          },
        } as any
      )[context.locals.language];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    };

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
      // Las páginas de admin ya validan permisos individualmente mediante el API
      // No necesitamos validar aquí porque cada endpoint del API valida canSeeAdminPanel
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
